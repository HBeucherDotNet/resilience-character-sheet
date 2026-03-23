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

export class Personnage {
	constructor() {
		this.state = {
			saison: null,
			famille: null,
			lignee: null,
			role: null,
			age: null,
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

	setSelections({ saison, famille, lignee, role, age }) {
		this.state.saison = saison ?? null;
		this.state.famille = famille ?? null;
		this.state.lignee = lignee ?? null;
		this.state.role = role ?? null;
		this.state.age = age ?? null;

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
