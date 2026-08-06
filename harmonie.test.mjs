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

test('getAmeliorationAjouteeCost : triangulaire, tout est payant des le 1er (pas de seuil gratuit)', () => {
	assert.equal(calculator.getAmeliorationAjouteeCost(0), 0);
	assert.equal(calculator.getAmeliorationAjouteeCost(1), 1);
	assert.equal(calculator.getAmeliorationAjouteeCost(2), 1 + 2);
	assert.equal(calculator.getAmeliorationAjouteeCost(3), 1 + 2 + 3);
	assert.equal(calculator.getAmeliorationAjouteeCost(4), 1 + 2 + 3 + 4);
});

test('computeHarmonieBreakdown : harmonie actuelle telle quelle, plancher a 0, en 1ere ligne', () => {
	assert.deepEqual(breakdown({ harmonieActuelle: 5 }).items[0], { label: 'Harmonie actuelle', cost: 5 });
	assert.deepEqual(breakdown({ harmonieActuelle: -3 }).items[0], { label: 'Harmonie actuelle', cost: 0 });
});

test('computeHarmonieBreakdown : le package de depart (17) est integre au total, pas affiche en ligne', () => {
	const { items, total, startingPackage } = breakdown();

	assert.equal(startingPackage, 17);
	assert.ok(!items.some(item => item.label === 'Package de départ'));

	const itemsSum = items.reduce((sum, item) => sum + item.cost, 0);
	assert.equal(total, itemsSum + 17);
});

test('computeHarmonieBreakdown : ordre des lignes', () => {
	const { items } = breakdown({
		state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 1 }),
		resonanceRows: [{ name: 'Voix de l’Automne 🍁', niveau: 3 }],
		checkedMagicTalentIds: ['eau-1']
	});

	assert.deepEqual(items.map(item => item.label), [
		'Harmonie actuelle',
		'Morphologies maîtrisées',
		'Compétences apprises',
		'Dons acquis',
		'Équipements maîtrisés',
		`Score de la saison ${symbols.hiver}`,
		'Relations améliorées',
		'Talents acquis'
	]);
});

test('computeHarmonieBreakdown : ameliorations ajoutees, cout triangulaire sans seuil gratuit', () => {
	const { items } = breakdown({
		state: emptyState({ competencesAjoutees: ['c1', 'c2', 'r1'] })
	});
	const competencesItem = items.find(item => item.label === 'Compétences apprises');

	// getAmeliorationAjouteeCost(3) = 6, + 1 surcharge (r1 est de categorie role)
	assert.equal(competencesItem.cost, 6 + 1);
	assert.equal(competencesItem.detail, '3 ajoutés (dont 1 de Rôle : +1)');
});

test('computeHarmonieBreakdown : chaque competence de Role / don de Famille surcharge, y compris le 1er', () => {
	const { items } = breakdown({
		state: emptyState({ competencesAjoutees: ['r1', 'r2'] })
	});
	const competencesItem = items.find(item => item.label === 'Compétences apprises');

	// getAmeliorationAjouteeCost(2) = 3, + 2 surcharge (r1 et r2 sont toutes deux de categorie role)
	assert.equal(competencesItem.cost, 3 + 2);
	assert.match(competencesItem.detail, /dont 2 de Rôle : \+2/);
});

test('computeHarmonieBreakdown : la surcharge de Famille suit la meme regle pour les dons', () => {
	const { items } = breakdown({
		state: emptyState({ donsAjoutes: ['d1', 'f1', 'f2'] })
	});
	const donsItem = items.find(item => item.label === 'Dons acquis');

	// getAmeliorationAjouteeCost(3) = 6, + 2 surcharge (f1 et f2 sont de categorie Famille)
	assert.equal(donsItem.cost, 6 + 2);
});

test('computeHarmonieBreakdown : equipements/morphologies sans surcharge (pas de dataMap de categorie)', () => {
	const { items } = breakdown({
		state: emptyState({ equipementsAjoutes: ['e1', 'e2', 'e3'], morphologiesAjoutees: ['m1'] })
	});

	assert.equal(items.find(item => item.label === 'Équipements maîtrisés').cost, calculator.getAmeliorationAjouteeCost(3));
	assert.equal(items.find(item => item.label === 'Morphologies maîtrisées').cost, calculator.getAmeliorationAjouteeCost(1));
});

test('computeHarmonieBreakdown : sans Saison choisie, pas de score de Saison ni de relations', () => {
	const { items } = breakdown({
		state: emptyState(),
		resonanceRows: [{ name: 'Voix de l’Automne 🍁', niveau: 5 }]
	});

	assert.ok(!items.some(item => item.label.startsWith('Score de la saison')));
	assert.ok(!items.some(item => item.label === 'Relations améliorées'));
});

test('computeHarmonieBreakdown : score de Saison (avec pictogramme), pluriel du detail selon le mod', () => {
	const { items: items1 } = breakdown({ state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 1 }) });
	const saisonItem1 = items1.find(item => item.label === `Score de la saison ${symbols.hiver}`);
	assert.equal(saisonItem1.detail, '+1 point');
	assert.equal(saisonItem1.cost, 8);

	const { items: items2 } = breakdown({ state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 2 }) });
	const saisonItem2 = items2.find(item => item.label === `Score de la saison ${symbols.hiver}`);
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

test('computeHarmonieBreakdown : talents acquis, cout plein sans remise', () => {
	const { items } = breakdown({
		checkedMagicTalentIds: ['eau-1', 'eau-2', 'chair-1']
	});

	const magieItem = items.find(item => item.label === 'Talents acquis');
	// eau (niveau 1, 2 talents) = 2*1 + 1 = 3 ; chair (niveau 2, 1 talent) = 1*2 = 2 ; total = 5, aucune remise
	assert.equal(magieItem.cost, 5);
	assert.equal(magieItem.detail, '3 talent(s)');
	assert.ok(!magieItem.subitems.some(text => text.includes('offerts')));
});

test('computeHarmonieBreakdown : talents acquis, cout base sur le niveau de la sphere', () => {
	const { items } = breakdown({
		checkedMagicTalentIds: ['eau-1']
	});

	const magieItem = items.find(item => item.label === 'Talents acquis');
	assert.equal(magieItem.cost, 1); // niveau de eau = 1, aucune remise
});

test('computeHarmonieBreakdown : le total est la somme des lignes affichees plus le package de depart', () => {
	const { items, total, startingPackage } = breakdown({
		harmonieActuelle: 10,
		state: emptyState({ saison: { value: 'hiver' }, scoreModHiver: 1, competencesAjoutees: ['c1', 'c2', 'r1'] }),
		resonanceRows: [{ name: 'Voix de l’Automne 🍁', niveau: 3 }],
		checkedMagicTalentIds: ['eau-1']
	});

	const expectedTotal = items.reduce((sum, item) => sum + item.cost, 0) + startingPackage;
	assert.equal(total, expectedTotal);
	assert.ok(total > 0);
});
