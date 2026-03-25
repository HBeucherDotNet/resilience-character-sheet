import { competences } from './data/competences.js';
import { dons } from './data/dons.js';
import { equipements } from './data/equipements.js';
import { morphologies } from './data/morphologies.js';

const saisonsEnum = {
	hiver: 1,
	printemps: 2,
	ete: 3,
	automne: 4
};

function getLabelFromSelectedInput(input) {
	if (!input) return '';
	const label = input.closest('.option')?.querySelector('label');
	return label ? label.textContent.trim() : '';
}

function getTextContentFromClosest(input, selector) {
	if (!input) return '';
	const node = input.closest('.option')?.querySelector(selector);
	return node ? node.textContent.trim() : '';
}

function getSaisonScore(saison, saisonName) {
	if (!saison) return '';
	switch (Math.abs(saisonsEnum[saison.value] - saisonsEnum[saisonName])) {
		case 0: return 3;
		case 1:
		case 3: return 2;
		case 2: return 1;
		default: return 2;
	}
}

function getDatasetValue(input, datasetKey) {
	if (!input || !input.dataset) return '';
	return input.dataset[datasetKey] || '';
}

function getCompetencesForRole(roleValue) {
	if (!roleValue) return [];
	return Object.entries(competences)
		.filter(([, competence]) => competence.role === roleValue)
		.map(([competenceKey]) => competenceKey);
}

function getExistingSelections(dataMap, values) {
	return [...new Set(values.filter(value => value && Object.hasOwn(dataMap, value)))];
}

function mergeSelections(baseSelections, addedSelections, dataMap) {
	return getExistingSelections(dataMap, [...baseSelections, ...addedSelections]);
}

function getDonsSelectionnes(famille, lignee) {
	return getExistingSelections(dons, [
		getDatasetValue(famille, 'don'),
		getDatasetValue(lignee, 'don')
	]);
}

function getEquipementsSelectionnes(environnement, modeDeVie, philosophie, relationRupture) {
	return getExistingSelections(equipements, [
		getDatasetValue(environnement, 'equipement'),
		getDatasetValue(modeDeVie, 'equipement'),
		getDatasetValue(philosophie, 'equipement'),
		getDatasetValue(relationRupture, 'equipement')
	]);
}

function getMorphologiesSelectionnees(armement, cuirasse, mains, peau) {
	return getExistingSelections(morphologies, [
		getDatasetValue(armement, 'morphologie'),
		getDatasetValue(cuirasse, 'morphologie'),
		getDatasetValue(mains, 'morphologie'),
		getDatasetValue(peau, 'morphologie')
	]);
}

const ameliorationTypeConfig = {
	competence: {
		dataMap: competences,
		addedKey: 'competencesAjoutees',
		baseKey: 'competencesDeBase',
		selectedKey: 'competencesSelectionnees'
	},
	don: {
		dataMap: dons,
		addedKey: 'donsAjoutes',
		baseKey: 'donsDeBase',
		selectedKey: 'donsSelectionnes'
	},
	equipement: {
		dataMap: equipements,
		addedKey: 'equipementsAjoutes',
		baseKey: 'equipementsDeBase',
		selectedKey: 'equipementsSelectionnes'
	},
	morphologie: {
		dataMap: morphologies,
		addedKey: 'morphologiesAjoutees',
		baseKey: 'morphologiesDeBase',
		selectedKey: 'morphologiesSelectionnees'
	}
};

export class Personnage {
	constructor() {
		this.state = {
			saison: null,
			famille: null,
			lignee: null,
			role: null,
			age: null,
			competencesDeBase: [],
			competencesAjoutees: [],
			competencesSelectionnees: [],
			donsDeBase: [],
			donsAjoutes: [],
			donsSelectionnes: [],
			equipementsDeBase: [],
			equipementsAjoutes: [],
			equipementsSelectionnes: [],
			morphologiesDeBase: [],
			morphologiesAjoutees: [],
			morphologiesSelectionnees: [],
			ficheSaison: '',
			ficheEssence: '',
			ficheAnatheme: '',
			ficheFamille: '',
			ficheLignee: '',
			ficheRole: '',
			ficheAge: '',
			ficheHiver: '',
			fichePrintemps: '',
			ficheEte: '',
			ficheAutomne: '',
			ficheVitalite: '',
			ficheSouffle: '',
			ficheResilience: '',
			saisonClass: ''
		};
		this.listeners = new Set();
	}

	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	setSelections({
		saison,
		famille,
		lignee,
		role,
		age,
		environnement,
		modeDeVie,
		philosophie,
		relationRupture,
		armement,
		cuirasse,
		mains,
		peau,
		competencesAjoutees = [],
		donsAjoutes = [],
		equipementsAjoutes = [],
		morphologiesAjoutees = []
	}) {
		this.state.saison = saison ?? null;
		this.state.famille = famille ?? null;
		this.state.lignee = lignee ?? null;
		this.state.role = role ?? null;
		this.state.age = age ?? null;
		this.state.competencesDeBase = getCompetencesForRole(this.state.role?.value || '');
		this.state.donsDeBase = getDonsSelectionnes(this.state.famille, this.state.lignee);
		this.state.equipementsDeBase = getEquipementsSelectionnes(environnement, modeDeVie, philosophie, relationRupture);
		this.state.morphologiesDeBase = getMorphologiesSelectionnees(armement, cuirasse, mains, peau);
		this.state.competencesAjoutees = getExistingSelections(competences, competencesAjoutees);
		this.state.donsAjoutes = getExistingSelections(dons, donsAjoutes);
		this.state.equipementsAjoutes = getExistingSelections(equipements, equipementsAjoutes);
		this.state.morphologiesAjoutees = getExistingSelections(morphologies, morphologiesAjoutees);
		this._syncSelectionArrays();

		this.state.ficheSaison = getLabelFromSelectedInput(this.state.saison);
		this.state.ficheEssence = getTextContentFromClosest(this.state.saison, '.label-essence');
		this.state.ficheAnatheme = getTextContentFromClosest(this.state.saison, '.label-anatheme');
		this.state.ficheFamille = getLabelFromSelectedInput(this.state.famille);
		this.state.ficheLignee = getLabelFromSelectedInput(this.state.lignee);
		this.state.ficheRole = getLabelFromSelectedInput(this.state.role);
		this.state.ficheAge = getLabelFromSelectedInput(this.state.age);

		this._recalculate();
		this._notify();
	}

	addAmelioration(type, key) {
		const config = ameliorationTypeConfig[type];
		if (!config || !Object.hasOwn(config.dataMap, key)) return false;

		const addedSelections = this.state[config.addedKey];
		if (addedSelections.includes(key)) return false;

		this.state[config.addedKey] = [...addedSelections, key];
		this._syncSelectionArrays();
		this._notify();
		return true;
	}

	removeAmelioration(type, key) {
		const config = ameliorationTypeConfig[type];
		if (!config || !Object.hasOwn(config.dataMap, key)) return false;

		const addedSelections = this.state[config.addedKey];
		if (!addedSelections.includes(key)) return false;

		this.state[config.addedKey] = addedSelections.filter(value => value !== key);
		this._syncSelectionArrays();
		this._notify();
		return true;
	}

	_syncSelectionArrays() {
		Object.values(ameliorationTypeConfig).forEach(config => {
			this.state[config.selectedKey] = mergeSelections(
				this.state[config.baseKey],
				this.state[config.addedKey],
				config.dataMap
			);
		});
	}

	_recalculate() {
		this.state.ficheHiver = getSaisonScore(this.state.saison, 'hiver');
		this.state.fichePrintemps = getSaisonScore(this.state.saison, 'printemps');
		this.state.ficheEte = getSaisonScore(this.state.saison, 'ete');
		this.state.ficheAutomne = getSaisonScore(this.state.saison, 'automne');
		this.state.ficheVitalite = this.state.ficheHiver + this.state.fichePrintemps + this.state.ficheEte + this.state.ficheAutomne;
		
		this.state.ficheSouffle = this.state.saison && this.state.saison.value === 'temps' ? 3 : 2;
		this.state.ficheResilience = this.state.saison && this.state.saison.value === 'temps' ? 3 : 2;
		this.state.saisonClass = this.state.saison ? this.state.saison.value : '';
	}

	_notify() {
		this.listeners.forEach(listener => listener(this.state));
	}
}
