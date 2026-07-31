import test from 'node:test';
import assert from 'node:assert/strict';
import { Personnage, getSaisonScore } from './personnage.js';
import { competences } from './data/competences.js';

function createChoiceInput({ id, value, dataset = {}, label = '' } = {}) {
	return {
		id,
		value,
		dataset,
		closest(selector) {
			if (selector !== '.option') return null;
			return {
				querySelector(sel) {
					return sel === 'label' ? { textContent: label } : null;
				}
			};
		}
	};
}

test('getSaisonScore: score selon la distance entre Saisons', () => {
	assert.equal(getSaisonScore({ value: 'hiver' }, 'hiver'), 3);
	assert.equal(getSaisonScore({ value: 'hiver' }, 'printemps'), 2);
	assert.equal(getSaisonScore({ value: 'hiver' }, 'automne'), 2);
	assert.equal(getSaisonScore({ value: 'hiver' }, 'ete'), 1);
	assert.equal(getSaisonScore(null, 'hiver'), '');
});

test('getSaisonScore: la Voix du Temps retombe sur le cas par defaut', () => {
	assert.equal(getSaisonScore({ value: 'temps' }, 'hiver'), 2);
});

test('Personnage: etat initial vide', () => {
	const personnage = new Personnage();
	assert.equal(personnage.state.saison, null);
	assert.deepEqual(personnage.state.competencesSelectionnees, []);
	assert.equal(personnage.state.ficheVitalite, '');
});

test('Personnage.setSelections: calcule les scores de Saison a partir de la Saison choisie', () => {
	const personnage = new Personnage();
	personnage.setSelections({
		saison: createChoiceInput({ id: 'saison-hiver', value: 'hiver' }),
		scoreModHiver: 1
	});

	assert.equal(personnage.state.ficheHiver, 4); // base 3 + mod 1
	assert.equal(personnage.state.fichePrintemps, 2);
	assert.equal(personnage.state.ficheEte, 1);
	assert.equal(personnage.state.ficheAutomne, 2);
	assert.equal(personnage.state.ficheVitalite, 4 + 2 + 1 + 2);
	assert.equal(personnage.state.ficheSouffle, 2); // hors Voix du Temps : base 2
	assert.equal(personnage.state.saisonClass, 'hiver');
	assert.equal(personnage.state.ficheSaison, 'Voix de l’Hiver ❄️');
	assert.equal(personnage.state.ficheEssence, 'Adaptation');
});

test('Personnage.setSelections: la Voix du Temps utilise le Souffle comme base', () => {
	const personnage = new Personnage();
	personnage.setSelections({
		saison: createChoiceInput({ id: 'saison-temps', value: 'temps' })
	});

	assert.equal(personnage.state.ficheSouffle, 3);
	assert.equal(personnage.state.ficheResilience, 3);
});

test('Personnage.setSelections: les scores ne descendent jamais sous 0', () => {
	const personnage = new Personnage();
	personnage.setSelections({
		saison: null,
		scoreModHiver: -10,
		scoreModSouffle: -10
	});

	assert.equal(personnage.state.ficheHiver, 0);
	assert.equal(personnage.state.ficheSouffle, 0);
	assert.equal(personnage.state.ficheSaison, '');
	assert.equal(personnage.state.saisonClass, '');
});

test('Personnage.setSelections: derive dons/equipements/morphologies de base depuis les datasets', () => {
	const personnage = new Personnage();
	personnage.setSelections({
		famille: createChoiceInput({ id: 'famille-x', dataset: { don: 'adrenaline' }, label: 'Famille X' }),
		lignee: createChoiceInput({ id: 'lignee-y', dataset: { don: 'symbiose' }, label: 'Lignée Y' }),
		environnement: createChoiceInput({ id: 'env-x', dataset: { equipement: 'armecourte' } }),
		armement: createChoiceInput({ id: 'arm-x', dataset: { morphologie: 'articule' } })
	});

	assert.deepEqual(personnage.state.donsDeBase, ['adrenaline', 'symbiose']);
	assert.deepEqual(personnage.state.equipementsDeBase, ['armecourte']);
	assert.deepEqual(personnage.state.morphologiesDeBase, ['articule']);
	assert.equal(personnage.state.ficheFamille, 'Famille X');
	assert.equal(personnage.state.ficheLignee, 'Lignée Y');
});

test('Personnage.setSelections: filtre les competences de base par role', () => {
	const personnage = new Personnage();
	personnage.setSelections({
		role: createChoiceInput({ id: 'role-guide', value: 'guide' })
	});

	assert.ok(personnage.state.competencesDeBase.length > 0);
	personnage.state.competencesDeBase.forEach(key => {
		assert.equal(competences[key].role, 'guide');
	});
	assert.ok(!personnage.state.competencesDeBase.includes('athletisme'));
});

test('Personnage.addAmelioration / removeAmelioration', () => {
	const personnage = new Personnage();

	assert.equal(personnage.addAmelioration('competence', 'athletisme'), true);
	assert.deepEqual(personnage.state.competencesAjoutees, ['athletisme']);
	assert.ok(personnage.state.competencesSelectionnees.includes('athletisme'));

	// deja ajoutee : pas de doublon
	assert.equal(personnage.addAmelioration('competence', 'athletisme'), false);
	assert.deepEqual(personnage.state.competencesAjoutees, ['athletisme']);

	// cle inconnue
	assert.equal(personnage.addAmelioration('competence', 'ne-existe-pas'), false);
	assert.equal(personnage.addAmelioration('type-inconnu', 'athletisme'), false);

	assert.equal(personnage.removeAmelioration('competence', 'athletisme'), true);
	assert.deepEqual(personnage.state.competencesAjoutees, []);
	assert.ok(!personnage.state.competencesSelectionnees.includes('athletisme'));

	// deja retiree : rien a faire
	assert.equal(personnage.removeAmelioration('competence', 'athletisme'), false);
});

test('Personnage.getPersistedHashState: expose les ids coches et normalise les textValues', () => {
	const personnage = new Personnage();
	personnage.setSelections({
		saison: createChoiceInput({ id: 'saison-hiver', value: 'hiver' }),
		famille: createChoiceInput({ id: 'famille-x', dataset: { don: 'adrenaline' } }),
		magicTalentIds: ['talent-a', 'talent-a', 'talent-b'],
		textValues: { '': 'ignore-moi', ficheNom: 'Aster', notes: 42 }
	});
	personnage.addAmelioration('competence', 'athletisme');

	const hashState = personnage.getPersistedHashState();

	assert.ok(hashState.checkedIds.includes('saison-hiver'));
	assert.ok(hashState.checkedIds.includes('famille-x'));
	assert.ok(hashState.checkedIds.includes('amelioration-competence-athletisme'));
	assert.ok(hashState.checkedIds.includes('talent-a'));
	assert.ok(hashState.checkedIds.includes('talent-b'));
	assert.equal(hashState.checkedIds.filter(id => id === 'talent-a').length, 1);

	assert.deepEqual(hashState.textValues, { ficheNom: 'Aster', notes: '42' });
});

test('Personnage.subscribe: notifie les listeners a chaque changement et permet de se desabonner', () => {
	const personnage = new Personnage();
	let callCount = 0;
	const unsubscribe = personnage.subscribe(() => {
		callCount += 1;
	});

	personnage.setSelections({});
	assert.equal(callCount, 1);

	personnage.addAmelioration('competence', 'athletisme');
	assert.equal(callCount, 2);

	unsubscribe();
	personnage.addAmelioration('competence', 'rupture');
	assert.equal(callCount, 2);
});
