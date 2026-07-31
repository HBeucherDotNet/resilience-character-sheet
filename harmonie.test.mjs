import test from 'node:test';
import assert from 'node:assert/strict';
import { createHarmonieCalculator } from './lib/harmonie.js';

const symbols = {
	hiver: '❄️',
	printemps: '🌱',
	ete: '☀️',
	automne: '🍁',
	temps: '⏳',
	rupture: '💀'
};

const saisonSuffix = {
	hiver: 'Hiver',
	printemps: 'Printemps',
	ete: 'Ete',
	automne: 'Automne',
	temps: 'Souffle'
};

// Fixtures volontairement minimales et indépendantes des données de jeu réelles (competences/dons
// évoluent au fil des rééquilibrages), pour isoler la formule de calcul de son contenu.
const competences = {
	c1: { categorie: 'commune' },
	c2: { categorie: 'commune' },
	r1: { categorie: 'role' },
	r2: { categorie: 'role' }
};

const dons = {
	d1: { categorie: 'commune' },
	f1: { categorie: 'Famille' },
	f2: { categorie: 'Famille' }
};

const sorts = {
	eau: { niveau: 1 },
	chair: { niveau: 2 }
};

const calculator = createHarmonieCalculator({ symbols, sorts, competences, dons, saisonSuffix });

function emptyState(overrides = {}) {
	return {
		saison: null,
		competencesAjoutees: [],
		donsAjoutes: [],
		equipementsAjoutes: [],
		morphologiesAjoutees: [],
		...overrides
	};
}

function breakdown(overrides = {}) {
	return calculator.computeHarmonieBreakdown({
		state: emptyState(),
		harmonieActuelle: 0,
		resonanceRows: [],
		checkedMagicTalentIds: [],
		...overrides
	});
}

test('getScoreExtraCostFromBase / getScoreExtraCost : formule des points supplementaires', () => {
	assert.equal(calculator.getScoreExtraCostFromBase(3, 0), 0);
	assert.equal(calculator.getScoreExtraCostFromBase(3, 1), 1 + 1 * 7); // 8
	assert.equal(calculator.getScoreExtraCostFromBase(3, 2), 4 + 2 * 7); // 18
	assert.equal(calculator.getScoreExtraCostFromBase(2, 1), 1 + 1 * 5); // 6

	assert.equal(calculator.getScoreExtraCost(0), 0);
	assert.equal(calculator.getScoreExtraCost(1), 8);
	assert.equal(calculator.getScoreExtraCost(-5), 0); // jamais negatif
});

test('getAmeliorationAjouteeCost : triangulaire au-dela du seuil gratuit', () => {
	assert.equal(calculator.getAmeliorationAjouteeCost(0, 2), 0);
	assert.equal(calculator.getAmeliorationAjouteeCost(2, 2), 0);
	assert.equal(calculator.getAmeliorationAjouteeCost(3, 2), 3);
	assert.equal(calculator.getAmeliorationAjouteeCost(4, 2), 3 + 4);
});

test('computeHarmonieBreakdown : harmonie actuelle telle quelle, plancher a 0', () => {
	assert.deepEqual(breakdown({ harmonieActuelle: 5 }).items[0], { label: 'Harmonie actuelle', cost: 5 });
	assert.deepEqual(breakdown({ harmonieActuelle: -3 }).items[0], { label: 'Harmonie actuelle', cost: 0 });
});

test('computeHarmonieBreakdown : ameliorations ajoutees, cout triangulaire au-dela du seuil gratuit', () => {
	const { items } = breakdown({
		state: emptyState({ competencesAjoutees: ['c1', 'c2', 'r1'] })
	});
	const competencesItem = items.find(item => item.label === 'Compétences apprises');

	assert.equal(competencesItem.cost, 3); // getAmeliorationAjouteeCost(3, 2) + 0 surcharge (1 seule competence de role)
	assert.equal(competencesItem.detail, '3 ajoutés');
});

test('computeHarmonieBreakdown : une 2e amelioration de Role/Famille surcharge meme sous le seuil gratuit', () => {
	const { items } = breakdown({
		state: emptyState({ competencesAjoutees: ['r1', 'r2'] })
	});
	const competencesItem = items.find(item => item.label === 'Compétences apprises');

	// count(2) <= freeCount(2) => cout de base 0, mais la 2e competence de role surcharge : +1
	assert.equal(competencesItem.cost, 1);
	assert.match(competencesItem.detail, /dont 1 suppl\. de Rôle : \+1/);
});

test('computeHarmonieBreakdown : la surcharge de Famille suit la meme regle pour les dons', () => {
	const { items } = breakdown({
		state: emptyState({ donsAjoutes: ['d1', 'f1', 'f2'] })
	});
	const donsItem = items.find(item => item.label === 'Dons acquis');

	// count(3) > freeCount(2) => cout de base getAmeliorationAjouteeCost(3,2)=3, + 1 surcharge Famille (2e don de Famille)
	assert.equal(donsItem.cost, 3 + 1);
});

test('computeHarmonieBreakdown : equipements/morphologies sans surcharge (pas de dataMap de categorie)', () => {
	const { items } = breakdown({
		state: emptyState({ equipementsAjoutes: ['e1', 'e2', 'e3'], morphologiesAjoutees: ['m1'] })
	});

	assert.equal(items.find(item => item.label === 'Équipements maîtrisés').cost, calculator.getAmeliorationAjouteeCost(3, 1));
	assert.equal(items.find(item => item.label === 'Morphologies acquises').cost, 0);
});

test('computeHarmonieBreakdown : sans Saison choisie, pas de score de Saison ni de relations', () => {
	const { items } = breakdown({
		state: emptyState(),
		resonanceRows: [{ name: 'Voix de l’Automne 🍁', niveau: 5 }]
	});

	assert.ok(!items.some(item => item.label.startsWith('Score de la Saison')));
	assert.ok(!items.some(item => item.label === 'Relations améliorées'));
});

test('computeHarmonieBreakdown : score de Saison, pluriel du detail selon le mod', () => {
	const { items: items1 } = breakdown({ state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 1 }) });
	const saisonItem1 = items1.find(item => item.label === 'Score de la Saison (hiver)');
	assert.equal(saisonItem1.detail, '+1 point');
	assert.equal(saisonItem1.cost, 8);

	const { items: items2 } = breakdown({ state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 2 }) });
	const saisonItem2 = items2.find(item => item.label === 'Score de la Saison (hiver)');
	assert.equal(saisonItem2.detail, '+2 points');
	assert.equal(saisonItem2.cost, 18);
});

test('computeHarmonieBreakdown : relations ameliorees, cout base sur le score de la cible', () => {
	const { items } = breakdown({
		state: emptyState({ saison: { value: 'hiver' } }),
		resonanceRows: [
			{ name: 'Voix de l’Automne 🍁', niveau: 3 }, // base = getSaisonScore(automne, hiver) = 2, extra = 1
			{ name: 'Voix du Printemps 🌱', niveau: 2 }, // base = getSaisonScore(printemps, hiver) = 2, extra = 0 => ignore
			{ name: 'Symbole inconnu 🐙', niveau: 5 } // pictogramme non reconnu => ignore
		]
	});

	const relationsItem = items.find(item => item.label === 'Relations améliorées');
	assert.ok(relationsItem);
	assert.equal(relationsItem.detail, '1 relation(s)');
	assert.equal(relationsItem.cost, 6); // getScoreExtraCostFromBase(2, 1) = 1 + 1*5 = 6
	assert.deepEqual(relationsItem.subitems, ['Voix de l’Automne 🍁 : base 2 → niveau 3 — 6 Harmonie']);
});

test('computeHarmonieBreakdown : la Voix du Temps ameliore le Souffle des autres, pas leur Saison', () => {
	const { items } = breakdown({
		state: emptyState({ saison: { value: 'temps' } }),
		resonanceRows: [
			{ name: 'Voix de l’Hiver ❄️', niveau: 3 }, // base = 2 (autre Saison que Temps)
			{ name: 'Voix du Temps ⏳', niveau: 4 } // base = 3 (une autre Voix du Temps)
		]
	});

	const relationsItem = items.find(item => item.label === 'Relations améliorées');
	assert.equal(relationsItem.subitems.length, 2);
	assert.match(relationsItem.subitems[0], /base 2 → niveau 3/);
	assert.match(relationsItem.subitems[1], /base 3 → niveau 4/);
});

test('computeHarmonieBreakdown : talents magiques, 2 premiers offerts (max -3 Harmonie)', () => {
	const { items } = breakdown({
		checkedMagicTalentIds: ['eau-1', 'eau-2', 'chair-1']
	});

	const magieItem = items.find(item => item.label === 'Talents magiques');
	// eau (niveau 1, 2 talents) = 2*1 + 1 = 3 ; chair (niveau 2, 1 talent) = 1*2 = 2 ; brut = 5, remise = min(3,5) = 3
	assert.equal(magieItem.cost, 5 - 3);
	assert.equal(magieItem.detail, '3 talent(s)');
	assert.ok(magieItem.subitems.includes('Talents offerts (2 premiers) — -3 Harmonie'));
});

test('computeHarmonieBreakdown : talents magiques, remise plafonnee au cout reel si inferieur a 3', () => {
	const { items } = breakdown({
		checkedMagicTalentIds: ['eau-1']
	});

	const magieItem = items.find(item => item.label === 'Talents magiques');
	assert.equal(magieItem.cost, 0); // cout brut 1, remise min(3,1) = 1
});

test('computeHarmonieBreakdown : le total est la somme de tous les couts affiches', () => {
	const { items, total } = breakdown({
		harmonieActuelle: 10,
		state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 1, competencesAjoutees: ['c1', 'c2', 'r1'] }),
		resonanceRows: [{ name: 'Voix de l’Automne 🍁', niveau: 3 }],
		checkedMagicTalentIds: ['eau-1']
	});

	const expectedTotal = items.reduce((sum, item) => sum + item.cost, 0);
	assert.equal(total, expectedTotal);
	assert.ok(total > 0);
});
