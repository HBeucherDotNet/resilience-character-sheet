import { HashCodec } from './hashCodec.js';
import { Personnage } from './personnage.js';
import { bindViewModeActions, updateViewModeUi } from './viewMode.js';
import { competences } from './data/competences.js';
import { dons } from './data/dons.js';
import { equipements } from './data/equipements.js';
import { morphologies } from './data/morphologies.js';

// Couleurs par saison
const couleurs = {
	hiver: getCssColorVar('--color-hiver', '#235a8a'),
	printemps: getCssColorVar('--color-printemps', '#2c7a4b'),
	ete: getCssColorVar('--color-ete', '#bfa600'),
	automne: getCssColorVar('--color-automne', '#a13a3a'),
	temps: getCssColorVar('--color-temps', '#3a7ad2')
};

const personnage = new Personnage();

function getCheckedFicheBlocKeys(containerSelector, itemSelector, dataKey) {
	return Array.from(document.querySelectorAll(`${containerSelector} ${itemSelector} input:checked`))
		.map(input => input.closest(itemSelector)?.dataset[dataKey] || '')
		.filter(Boolean);
}

function syncPersonnageFromDom() {
	personnage.setSelections({
		saison: document.querySelector('input[name="saison"]:checked'),
		famille: document.querySelector('input[name="famille"]:checked'),
		lignee: document.querySelector('input[name="lignee"]:checked'),
		role: document.querySelector('input[name="role"]:checked'),
		age: document.querySelector('input[name="age"]:checked'),
		environnement: document.querySelector('#environnement-group input:checked'),
		modeDeVie: document.querySelector('#mode-de-vie-group input:checked'),
		philosophie: document.querySelector('#philosophie-group input:checked'),
		relationRupture: document.querySelector('#relation-rupture-group input:checked'),
		armement: document.querySelector('#armement-group input:checked'),
		cuirasse: document.querySelector('#cuirasse-group input:checked'),
		mains: document.querySelector('#mains-group input:checked'),
		peau: document.querySelector('#peau-group input:checked'),
		scoreModHiver: document.getElementById('amelioration-score-hiver')?.value ?? '0',
		scoreModPrintemps: document.getElementById('amelioration-score-printemps')?.value ?? '0',
		scoreModEte: document.getElementById('amelioration-score-ete')?.value ?? '0',
		scoreModAutomne: document.getElementById('amelioration-score-automne')?.value ?? '0',
		scoreModSouffle: document.getElementById('amelioration-score-souffle')?.value ?? '0',
		competencesAjoutees: getCheckedFicheBlocKeys('#fiche-competences', '.competence-recap', 'competence'),
		donsAjoutes: getCheckedFicheBlocKeys('#fiche-dons', '.don-recap', 'don'),
		equipementsAjoutes: getCheckedFicheBlocKeys('#fiche-equipements', '.equipement-recap', 'equipement'),
		morphologiesAjoutees: getCheckedFicheBlocKeys('#fiche-morphologies', '.morphologie-recap', 'morphologie')
	});
}

function bindAmeliorationScoreControls() {
	document.querySelectorAll('.amelioration-score-btn').forEach(button => {
		button.addEventListener('click', () => {
			const targetId = button.dataset.scoreTarget;
			const step = Number.parseInt(button.dataset.scoreStep ?? '0', 10);
			const input = targetId ? document.getElementById(targetId) : null;
			if (!input || !Number.isFinite(step)) return;

			const current = Number.parseInt(input.value || '0', 10);
			const nextValue = (Number.isFinite(current) ? current : 0) + step;
			input.value = String(nextValue);
			input.dispatchEvent(new Event('input', { bubbles: true }));
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
	});

	document.querySelectorAll('.amelioration-score-input').forEach(input => {
		input.addEventListener('input', syncPersonnageFromDom);
		input.addEventListener('change', syncPersonnageFromDom);
	});
}

function renderPersonnage(state) {
	document.getElementById('fiche-saison').textContent = state.ficheSaison;
	document.getElementById('fiche-essence').textContent = state.ficheEssence;
	document.getElementById('fiche-anatheme').textContent = state.ficheAnatheme;
	document.getElementById('fiche-famille').textContent = state.ficheFamille;
	document.getElementById('fiche-lignee').textContent = state.ficheLignee;
	document.getElementById('fiche-role').textContent = state.ficheRole;
	document.getElementById('fiche-age').textContent = state.ficheAge;

	document.getElementById('fiche-hiver').textContent = state.ficheHiver;
	document.getElementById('fiche-printemps').textContent = state.fichePrintemps;
	document.getElementById('fiche-ete').textContent = state.ficheEte;
	document.getElementById('fiche-automne').textContent = state.ficheAutomne;
	document.getElementById('fiche-vitalite').textContent = state.ficheVitalite;
	document.getElementById('fiche-souffle').textContent = state.ficheSouffle;
	document.getElementById('fiche-resilience').textContent = state.ficheResilience;

	document.getElementById('fiche-essence-harmonie').className = state.saisonClass;
	document.getElementById('fiche-champ-lexical').className = state.saisonClass;
	document.getElementById('fiche-magie').className = state.saisonClass;

	renderCompetences(state);
	renderEquipements(state);
	renderDons(state);
	renderMorphologies(state);
	refreshAmeliorationButtons(state);
}

function renderCompetences(state) {
	document.querySelectorAll('#fiche-competences .competence-recap').forEach(div => {
		div.style.display = 'none';
	});

	state.competencesSelectionnees.forEach(competenceKey => {
		const competenceBloc = document.querySelector(`#fiche-competences .competence-recap[data-competence="${competenceKey}"]`);
		if (competenceBloc) competenceBloc.style.display = '';
	});
}

function renderEquipements(state) {
	document.querySelectorAll('#fiche-equipements .equipement-recap').forEach(div => {
		div.style.display = 'none';
	});

	state.equipementsSelectionnes.forEach(eqKey => {
		const div = document.querySelector(`#fiche-equipements .equipement-recap[data-equipement="${eqKey}"]`);
		if (div) div.style.display = '';
	});
}

function renderDons(state) {
	document.querySelectorAll('#fiche-dons .don-recap').forEach(div => {
		div.style.display = 'none';
	});

	state.donsSelectionnes.forEach(donKey => {
		const div = document.querySelector(`#fiche-dons .don-recap[data-don="${donKey}"]`);
		if (div) div.style.display = '';
	});
}

function renderMorphologies(state) {
	document.querySelectorAll('#fiche-morphologies .morphologie-recap').forEach(div => {
		div.style.display = 'none';
	});

	state.morphologiesSelectionnees.forEach(morphKey => {
		const div = document.querySelector(`#fiche-morphologies .morphologie-recap[data-morphologie="${morphKey}"]`);
		if (div) div.style.display = '';
	});
}

function getCssColorVar(varName, fallback) {
	const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	return value || fallback;
}

// Génération et restauration de l'état via hash
function getCheckedInputs() {
	return Array.from(document.querySelectorAll('input[type="checkbox"]'))
	.filter(input => input.checked && input.id)
	.map(input => input.id);
}

function getChoiceInputs() {
	return Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(input => input.id);
}

function getTextStateFields() {
	return Array.from(document.querySelectorAll('input[type="text"], textarea')).filter(field => field.id);
}

function getTextStateValues() {
	const values = {};
	getTextStateFields()
	.filter(field => field.value !== '')
	.forEach(field => {
		values[field.id] = field.value;
	});
	return values;
}

function setCheckedInputs(ids) {
	const selectedIds = new Set(ids);
	document.querySelectorAll('input[type="checkbox"]').forEach(input => {
		input.checked = false;
	});
	
	document.querySelectorAll('input[type="checkbox"]').forEach(input => {
		if (selectedIds.has(input.id)) {
			input.checked = true;
			input.dispatchEvent(new Event('change', { bubbles: true }));
		}
	});
}

function setTextStateValues(values) {
	const fields = getTextStateFields();
	fields.forEach(field => {
		field.value = '';
	});
	
	fields.forEach(field => {
		if (Object.prototype.hasOwnProperty.call(values, field.id)) {
			field.value = String(values[field.id] ?? '');
			field.dispatchEvent(new Event('input', { bubbles: true }));
			field.dispatchEvent(new Event('change', { bubbles: true }));
		}
	});
}

function debounce(fn, delay) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

let isRestoringState = false;

function updateHashFromState() {
	if (isRestoringState) return;
	const encoded = HashCodec.encode({
		checkedIds: getCheckedInputs(),
		textValues: getTextStateValues(),
		allChoiceIds: getChoiceInputs().map(input => input.id)
	});
	const newUrl = `${window.location.pathname}${window.location.search}#${encoded}`;
	history.replaceState(null, '', newUrl);
}

function bindAutoHashSync() {
	document.querySelectorAll('input[type="checkbox"]').forEach(input => {
		input.addEventListener('change', updateHashFromState);
	});

	const debouncedUpdateHash = debounce(updateHashFromState, 1000);
	document.querySelectorAll('input[type="text"], textarea').forEach(field => {
		field.addEventListener('input', debouncedUpdateHash);
		field.addEventListener('change', updateHashFromState);
	});
}

function restoreStateFromHash() {
	const hash = window.location.hash.replace(/^#/, '');
	if (!hash) return;
	const state = HashCodec.decode(hash, {
		allChoiceIds: getChoiceInputs().map(input => input.id)
	});
	if (!state) return;
	isRestoringState = true;
	setCheckedInputs(state.checkedIds);
	setTextStateValues(state.textValues);
	isRestoringState = false;
}

window.toggleDesc = function(btn) {
	// Cherche le sibling .desc dans le parent
	let desc = null;
	const parent = btn.parentElement;
	if (parent) { desc = parent.querySelector('.desc'); }
	if (!desc) return;
	
	const long = desc.querySelector('.long') ?? desc; // Si pas de .long, toggle sur tout le .desc
	
	// Détecte la saison de l'option
	let saison = '';
	const option = btn.closest('.option');
	const item = btn.closest('.fiche-bloc-item');
	if (option) {
		if (option.classList.contains('hiver')) saison = 'hiver';
		else if (option.classList.contains('printemps')) saison = 'printemps';
		else if (option.classList.contains('ete')) saison = 'ete';
		else if (option.classList.contains('automne')) saison = 'automne';
		else if (option.classList.contains('temps')) saison = 'temps';
	}
	else if (item) {
		if (item.classList.contains('morphologie-recap')) saison = 'hiver';
		else if (item.classList.contains('competence-recap')) saison = 'printemps';
		else if (item.classList.contains('don-recap')) saison = 'ete';
		else if (item.classList.contains('equipement-recap')) saison = 'automne';
	}
	else {
		return; // Pas de saison détectée, ne pas continuer
	}
	
	const couleur = couleurs[saison] || couleurs.temps;
	
	// Pour le bouton pictogramme
	if (!btn.classList.contains('pictogram-btn'))
		return;
	
	if (long.style.display === 'none') {
		long.style.display = 'inline';
		// Point d'interrogation barré
		btn.innerHTML = `
				<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="11" cy="11" r="10" stroke="${couleur}" stroke-width="2" fill="#fff"/>
					<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="${couleur}">?</text>
					<line x1="6" y1="6" x2="16" y2="16" stroke="${couleur}" stroke-width="2"/>
				</svg>
			`;
	} else {
		long.style.display = 'none';
		// Point d'interrogation normal
		btn.innerHTML = `
				<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="11" cy="11" r="10" stroke="${couleur}" stroke-width="2" fill="#fff"/>
					<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="${couleur}">?</text>
				</svg>
			`;
	}
}

function selectUnique(group, el) {
	const checkboxes = document.querySelectorAll('input[name="' + group + '"]');
	checkboxes.forEach(cb => {
		if (cb !== el) cb.checked = false;
		const option = cb.closest('.option');
		if (option) option.classList.remove('selected-option');
	});
	const selectedOption = el.closest('.option');
	if (selectedOption && el.checked) selectedOption.classList.add('selected-option');
}

function updateLignees() {
	const famille = document.querySelector('input[name="famille"]:checked');
	const lignéesMessage = document.getElementById('lignées-message');
	const lignéesList = document.getElementById('lignées-list');
	const allLignees = lignéesList.querySelectorAll('.lignee.option');
	
	if (!famille) {
		lignéesMessage.style.display = 'block';
		allLignees.forEach(l => l.style.display = 'none');
		return;
	}
	
	let familleClass = famille.value;
	
	lignéesMessage.style.display = 'none';
	allLignees.forEach(l => {
		if (l.classList.contains(familleClass)) {
			l.style.display = '';
		} else {
			l.style.display = 'none';
		}
	});
}

// Remplit dynamiquement la fiche de personnage
function genererFiche() {
	syncPersonnageFromDom();
}

function updateFicheAge() {
	syncPersonnageFromDom();
}

function updateFicheCompetences() {
	syncPersonnageFromDom();
}

function updateFicheEquipements() {
	syncPersonnageFromDom();
}

function updateFicheDons() {
	syncPersonnageFromDom();
}

function updateFicheMorphologies() {
	syncPersonnageFromDom();
}

function getAddedAmeliorationsForType(type, state = personnage.state) {
	switch (type) {
		case 'competence':
			return state.competencesAjoutees;
		case 'don':
			return state.donsAjoutes;
		case 'equipement':
			return state.equipementsAjoutes;
		case 'morphologie':
			return state.morphologiesAjoutees;
		default:
			return [];
	}
}

function syncFicheBlocCheckbox(type, key, shouldBeChecked) {
	const selectorMap = {
		competence: `#fiche-competences .competence-recap[data-competence="${key}"] input[type="checkbox"]`,
		don: `#fiche-dons .don-recap[data-don="${key}"] input[type="checkbox"]`,
		equipement: `#fiche-equipements .equipement-recap[data-equipement="${key}"] input[type="checkbox"]`,
		morphologie: `#fiche-morphologies .morphologie-recap[data-morphologie="${key}"] input[type="checkbox"]`
	};

	const checkbox = document.querySelector(selectorMap[type]);
	if (!checkbox || checkbox.checked === shouldBeChecked) return;

	checkbox.checked = shouldBeChecked;
	checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

function toggleAmeliorationInPersonnage(type, key) {
	const isAdded = getAddedAmeliorationsForType(type).includes(key);
	if (isAdded) {
		const removed = personnage.removeAmelioration(type, key);
		if (!removed) return;
		syncFicheBlocCheckbox(type, key, false);
		return;
	}

	const added = personnage.addAmelioration(type, key);
	if (!added) return;
	syncFicheBlocCheckbox(type, key, true);
}

function refreshAmeliorationButtons(state = personnage.state) {
	document.querySelectorAll('.ameliorations-item-add-btn').forEach(button => {
		const { ameliorationType, ameliorationKey } = button.dataset;
		const isAdded = getAddedAmeliorationsForType(ameliorationType, state).includes(ameliorationKey);
		if(isAdded) {
			button.textContent = '-';
			button.closest('.ameliorations-item')?.classList.add('selected');
		} else {
			button.textContent = '+';
			button.closest('.ameliorations-item')?.classList.remove('selected');
		}
		button.setAttribute('aria-pressed', String(isAdded));
	});
}

function createAmeliorationItem({ key, type, nom, meta, description, allowHtmlDescription = false }) {
	const item = document.createElement('div');
	item.className = 'ameliorations-item';

	const header = document.createElement('div');
	header.className = 'ameliorations-item-header';

	const title = document.createElement('strong');
	title.textContent = nom;
	header.appendChild(title);

	if (key && type) {
		const addButton = document.createElement('button');
		addButton.type = 'button';
		addButton.className = 'ameliorations-item-add-btn';
		addButton.textContent = '+';
		addButton.dataset.ameliorationType = type;
		addButton.dataset.ameliorationKey = key;
		addButton.setAttribute('aria-label', `Ajouter ${nom}`);
		addButton.addEventListener('click', () => toggleAmeliorationInPersonnage(type, key));
		header.appendChild(addButton);
	}

	item.appendChild(header);

	if (meta) {
		const metaNode = document.createElement('div');
		metaNode.className = 'ameliorations-item-category';
		metaNode.textContent = meta;
		item.appendChild(metaNode);
	}

	const descriptionNode = document.createElement('div');
	descriptionNode.className = 'ameliorations-item-description';
	if (allowHtmlDescription) {
		descriptionNode.innerHTML = description;
	} else {
		descriptionNode.textContent = description;
	}
	item.appendChild(descriptionNode);

	return item;
}

function fillAmeliorationsList(containerId, items) {
	const container = document.getElementById(containerId);
	if (!container) return;

	container.innerHTML = '';
	const fragment = document.createDocumentFragment();
	items.forEach(item => {
		fragment.appendChild(createAmeliorationItem(item));
	});
	container.appendChild(fragment);
}

function fillAmeliorationsMorphologiesList() {
	fillAmeliorationsList(
		'ameliorations-morphologies-list',
		Object.entries(morphologies).map(([key, morphologie]) => ({
			key,
			type: 'morphologie',
			nom: morphologie.nom,
			meta: `Categorie : ${morphologie.categorie}`,
			description: morphologie.description
		}))
	);
}

function fillAmeliorationsCompetencesList() {
	fillAmeliorationsList(
		'ameliorations-competences-list', 
		Object.entries(competences).map(([key, competence]) => ({
			key,
			type: 'competence',
			nom: competence.nom,
			meta: `Rôle : ${competence.role}`,
			description: competence.description
		}))
	);
}

function fillAmeliorationsDonsList() {
	fillAmeliorationsList(
		'ameliorations-dons-list',
		Object.entries(dons).map(([key, don]) => ({
			key,
			type: 'don',
			nom: don.nom,
			meta: don.saison ? `Categorie : ${don.categorie} • Saison : ${don.saison}` : `Categorie : ${don.categorie}`,
			description: don.description
		}))
	);
}

function fillAmeliorationsEquipementsList() {
	fillAmeliorationsList(
		'ameliorations-equipements-list',
		Object.entries(equipements).map(([key, equipement]) => ({
			key,
			type: 'equipement',
			nom: equipement.nom,
			meta: `Categorie : ${equipement.categorie} • Saison : ${equipement.saison}`,
			description: equipement.description,
			allowHtmlDescription: true
		}))
	);
}

function initBindings() {
	bindViewModeActions();

	document.querySelectorAll('#character-builder input[type="checkbox"]').forEach(input => {
		input.addEventListener('change', selectUnique.bind(null, input.name, input));
		input.addEventListener('change', genererFiche);
	});

	document.querySelectorAll('input[name="famille"]').forEach(input => {
		input.addEventListener('change', updateLignees);
	});

	['famille', 'lignee'].forEach(group => {
		document.querySelectorAll(`input[name="${group}"]`).forEach(input => {
			input.addEventListener('change', updateFicheDons);
		});
	});
	['role'].forEach(group => {
		document.querySelectorAll(`input[name="${group}"]`).forEach(input => {
			input.addEventListener('change', updateFicheCompetences);
		});
	});
	['age'].forEach(group => {
		document.querySelectorAll(`input[name="${group}"]`).forEach(input => {
			input.addEventListener('change', updateFicheAge);
		});
	});
	['environnement', 'mode-de-vie', 'philosophie', 'relation-rupture'].forEach(group => {
		document.querySelectorAll(`input[name="${group}"]`).forEach(input => {
			input.addEventListener('change', updateFicheEquipements);
		});
	});
	['armement', 'cuirasse', 'mains', 'peau'].forEach(group => {
		document.querySelectorAll(`#${group}-group input`).forEach(input => {
			input.addEventListener('change', updateFicheMorphologies);
		});
	});

	bindAmeliorationScoreControls();

	document.querySelectorAll('.lire-plus.pictogram-btn').forEach(div => {
		div.addEventListener('click', () => toggleDesc(div));
	});

	// Ajoute le comportement de sélection sur .option
	document.querySelectorAll('.option').forEach(option => {
		option.addEventListener('click', function(e) {
			// Si le clic est sur .lire-plus.pictogram-btn, ne coche pas la checkbox
			if (e.target.closest('.lire-plus.pictogram-btn, svg, input, label')) return;
			const checkbox = option.querySelector('input[type="checkbox"]');
			if (checkbox) {
				checkbox.checked = !checkbox.checked;
				selectUnique(checkbox.name, checkbox);
				checkbox.dispatchEvent(new Event('change', { bubbles: true }));
			}
		});
	});

	bindAutoHashSync();
}

function initStateFromHash() {
	// Restaure l'état à l'ouverture si hash présent (déclenche les change events → updateFiche*)
	restoreStateFromHash();
	// Permet de restaurer si le hash change en cours de navigation
	window.addEventListener('hashchange', restoreStateFromHash);
}

window.addEventListener('DOMContentLoaded', function() {
	document.querySelectorAll('.fiche-bloc-item').forEach(div => { div.style.display = 'none'; });
	personnage.subscribe(renderPersonnage);
	fillAmeliorationsCompetencesList();
	fillAmeliorationsDonsList();
	fillAmeliorationsEquipementsList();
	fillAmeliorationsMorphologiesList();

	updateViewModeUi();
	initBindings();
	initStateFromHash();
	syncPersonnageFromDom();
	
	// force l'ouverture du bloc ameliorations si le résumé est invisible (ex: sur mobile)
	const summaryVisible = document.querySelector('#collapsible-section summary').checkVisibility();
	document.getElementById('collapsible-section').open = !summaryVisible;
});
