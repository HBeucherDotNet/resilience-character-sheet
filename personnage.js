import { competences } from './data/competences.js';
import { dons } from './data/dons.js';
import { equipements } from './data/equipements.js';
import { morphologies } from './data/morphologies.js';
import { saisons } from './data/saisons.js';

const saisonsEnum = {
	hiver: 1,
	printemps: 2,
	ete: 3,
	automne: 4
};

function getVoixTitle(saison) {
	return getSaisonData(saison).title;
}

function getSaisonData(saison) {
	if (!saison) {
		return {
			title: '',
			essence: '',
			anatheme: ''
		};
	}
	
	return saisons[saison.value] ?? {
		title: '',
		essence: '',
		anatheme: ''
	};
}

function getLabelFromSelectedInput(input) {
	if (!input) return '';
	const label = input.closest('.option')?.querySelector('label');
	return label ? label.textContent.trim() : '';
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

function toInteger(value) {
	const parsed = Number.parseInt(String(value ?? '0'), 10);
	return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTextValues(values) {
	if (!values || typeof values !== 'object' || Array.isArray(values)) {
		return {};
	}
	
	return Object.fromEntries(
		Object.entries(values)
		.filter(([key]) => Boolean(key))
		.map(([key, value]) => [key, String(value ?? '')])
	);
}

function getSelectedInputId(input) {
	return input?.id ?? '';
}

function getAmeliorationInputIds(type, values) {
	return values
		.filter(Boolean)
		.map(value => `amelioration-${type}-${value}`);
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
			environnement: null,
			modeDeVie: null,
			philosophie: null,
			relationRupture: null,
			armement: null,
			cuirasse: null,
			mains: null,
			peau: null,
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
			scoreModHiver: 0,
			scoreModPrintemps: 0,
			scoreModEte: 0,
			scoreModAutomne: 0,
			scoreModSouffle: 0,
			magicTalentIds: [],
			textValues: {},
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
		scoreModHiver = 0,
		scoreModPrintemps = 0,
		scoreModEte = 0,
		scoreModAutomne = 0,
		scoreModSouffle = 0,
		competencesAjoutees = [],
		donsAjoutes = [],
		equipementsAjoutes = [],
		morphologiesAjoutees = [],
		magicTalentIds = [],
		textValues = {}
	}) {
		this.state.saison = saison ?? null;
		this.state.famille = famille ?? null;
		this.state.lignee = lignee ?? null;
		this.state.role = role ?? null;
		this.state.age = age ?? null;
		this.state.environnement = environnement ?? null;
		this.state.modeDeVie = modeDeVie ?? null;
		this.state.philosophie = philosophie ?? null;
		this.state.relationRupture = relationRupture ?? null;
		this.state.armement = armement ?? null;
		this.state.cuirasse = cuirasse ?? null;
		this.state.mains = mains ?? null;
		this.state.peau = peau ?? null;
		this.state.competencesDeBase = getCompetencesForRole(this.state.role?.value || '');
		this.state.donsDeBase = getDonsSelectionnes(this.state.famille, this.state.lignee);
		this.state.equipementsDeBase = getEquipementsSelectionnes(environnement, modeDeVie, philosophie, relationRupture);
		this.state.morphologiesDeBase = getMorphologiesSelectionnees(armement, cuirasse, mains, peau);
		this.state.competencesAjoutees = getExistingSelections(competences, competencesAjoutees);
		this.state.donsAjoutes = getExistingSelections(dons, donsAjoutes);
		this.state.equipementsAjoutes = getExistingSelections(equipements, equipementsAjoutes);
		this.state.morphologiesAjoutees = getExistingSelections(morphologies, morphologiesAjoutees);
		this.state.scoreModHiver = toInteger(scoreModHiver);
		this.state.scoreModPrintemps = toInteger(scoreModPrintemps);
		this.state.scoreModEte = toInteger(scoreModEte);
		this.state.scoreModAutomne = toInteger(scoreModAutomne);
		this.state.scoreModSouffle = toInteger(scoreModSouffle);
		this.state.magicTalentIds = [...new Set(magicTalentIds.filter(Boolean))];
		this.state.textValues = normalizeTextValues(textValues);
		this._syncSelectionArrays();
		const saisonData = getSaisonData(this.state.saison);
		
		this.state.ficheSaison = getVoixTitle(this.state.saison);
		this.state.ficheEssence = saisonData.essence;
		this.state.ficheAnatheme = saisonData.anatheme;
		this.state.ficheFamille = getLabelFromSelectedInput(this.state.famille);
		this.state.ficheLignee = getLabelFromSelectedInput(this.state.lignee);
		this.state.ficheRole = getLabelFromSelectedInput(this.state.role);
		this.state.ficheAge = getLabelFromSelectedInput(this.state.age);
		
		this._recalculate();
		this._notify();
	}
	
	getSerializableState() {
		return {
			selectedChoiceIds: {
				saison: getSelectedInputId(this.state.saison),
				famille: getSelectedInputId(this.state.famille),
				lignee: getSelectedInputId(this.state.lignee),
				role: getSelectedInputId(this.state.role),
				age: getSelectedInputId(this.state.age),
				environnement: getSelectedInputId(this.state.environnement),
				modeDeVie: getSelectedInputId(this.state.modeDeVie),
				philosophie: getSelectedInputId(this.state.philosophie),
				relationRupture: getSelectedInputId(this.state.relationRupture),
				armement: getSelectedInputId(this.state.armement),
				cuirasse: getSelectedInputId(this.state.cuirasse),
				mains: getSelectedInputId(this.state.mains),
				peau: getSelectedInputId(this.state.peau)
			},
			scoreMods: {
				hiver: this.state.scoreModHiver,
				printemps: this.state.scoreModPrintemps,
				ete: this.state.scoreModEte,
				automne: this.state.scoreModAutomne,
				souffle: this.state.scoreModSouffle
			},
			competencesAjoutees: [...this.state.competencesAjoutees],
			donsAjoutes: [...this.state.donsAjoutes],
			equipementsAjoutes: [...this.state.equipementsAjoutes],
			morphologiesAjoutees: [...this.state.morphologiesAjoutees],
			magicTalentIds: [...this.state.magicTalentIds],
			textValues: { ...this.state.textValues }
		};
	}
	
	getPersistedHashState() {
		const serializedState = this.getSerializableState();
		const checkedIds = Object.values(serializedState.selectedChoiceIds).filter(Boolean);
		
		checkedIds.push(
			...getAmeliorationInputIds('competence', serializedState.competencesAjoutees),
			...getAmeliorationInputIds('don', serializedState.donsAjoutes),
			...getAmeliorationInputIds('equipement', serializedState.equipementsAjoutes),
			...getAmeliorationInputIds('morphologie', serializedState.morphologiesAjoutees),
			...serializedState.magicTalentIds.filter(Boolean)
		);
		
		return {
			checkedIds: [...new Set(checkedIds)],
			textValues: serializedState.textValues
		};
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
		const baseHiver = Number(getSaisonScore(this.state.saison, 'hiver') || 0);
		const basePrintemps = Number(getSaisonScore(this.state.saison, 'printemps') || 0);
		const baseEte = Number(getSaisonScore(this.state.saison, 'ete') || 0);
		const baseAutomne = Number(getSaisonScore(this.state.saison, 'automne') || 0);
		
		this.state.ficheHiver = Math.max(0, baseHiver + this.state.scoreModHiver);
		this.state.fichePrintemps = Math.max(0, basePrintemps + this.state.scoreModPrintemps);
		this.state.ficheEte = Math.max(0, baseEte + this.state.scoreModEte);
		this.state.ficheAutomne = Math.max(0, baseAutomne + this.state.scoreModAutomne);
		this.state.ficheVitalite = this.state.ficheHiver + this.state.fichePrintemps + this.state.ficheEte + this.state.ficheAutomne;
		
		const baseSouffle = this.state.saison && this.state.saison.value === 'temps' ? 3 : 2;
		this.state.ficheSouffle = Math.max(0, baseSouffle + this.state.scoreModSouffle);
		this.state.ficheResilience = Math.max(0, baseSouffle + this.state.scoreModSouffle);
		this.state.saisonClass = this.state.saison ? this.state.saison.value : '';
	}
	
	_notify() {
		this.listeners.forEach(listener => listener(this.state));
	}
}
