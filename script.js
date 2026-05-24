import { Personnage } from './personnage.js';
import { bindViewModeActions, updateViewModeUi } from './viewMode.js';
import { createFicheRenderer, createQuestionMarkSvg, normalizePlaceholderToken } from './lib/ficheRenderer.js';
import { createHashStateSync } from './lib/hashState.js';
import { createOptionCard, renderOptionGroup } from './lib/optionCard.js';
import { createSortDialogController } from './lib/sortDialog.js';
import { lignees } from './data/lignees.js';
import { ligneeOptionConfigs } from './data/ligneeSections.js';
import { competences } from './data/competences.js';
import { dons } from './data/dons.js';
import { equipements } from './data/equipements.js';
import { morphologies } from './data/morphologies.js';
import { ameliorationSectionConfigs } from './data/ameliorationSections.js';
import { champLexicalWordsBySaison } from './data/champLexical.js';
import { morphologyGroupConfig, optionSectionConfigs } from './data/optionSections.js';
import { sorts } from './data/sorts.js';

// Couleurs par saison
const couleurs = {
	hiver: getCssColorVar('--color-hiver', '#235a8a'),
	printemps: getCssColorVar('--color-printemps', '#2c7a4b'),
	ete: getCssColorVar('--color-ete', '#bfa600'),
	automne: getCssColorVar('--color-automne', '#a13a3a'),
	temps: getCssColorVar('--color-temps', '#3a7ad2')
};

const symbols = {
	hiver: '❄️',
	printemps: '🌱',
	ete: '☀️',
	automne: '🍁',
	temps: '⏳',
	rupture: '💀'
};

const persistedCharacterTextFieldSelector = 'input[type="text"], textarea';

const personnage = new Personnage();
const ficheRenderer = createFicheRenderer({
	couleurs,
	champLexicalWordsBySaison,
	getState: () => personnage.state,
	onStateRendered: state => refreshAmeliorationButtons(state)
});
const hashStateSync = createHashStateSync({
	getHashState: () => personnage.getPersistedHashState(),
	onStateRestored: syncPersonnageFromDom
});
const sortDialogController = createSortDialogController({
	getState: () => personnage.state,
	symbols,
	sorts,
	normalizePlaceholderToken,
	resolveScoreStep
});
const lastScoreButtonClickByElement = new WeakMap();

function getCheckedFicheBlocKeys(containerSelector, itemSelector, dataKey) {
	return Array.from(document.querySelectorAll(`${containerSelector} ${itemSelector} input:checked`))
		.map(input => input.closest(itemSelector)?.dataset[dataKey] || '')
		.filter(Boolean);
}

function isPersistedCharacterTextField(field) {
	return Boolean(field?.id) && !field.closest('#sort-dialog');
}

function getPersistedCharacterTextValues() {
	const values = {};
	Array.from(document.querySelectorAll(persistedCharacterTextFieldSelector))
		.filter(isPersistedCharacterTextField)
		.forEach(field => {
			values[field.id] = field.value;
		});
	return values;
}

function getCheckedMagicTalentIds() {
	return Array.from(document.querySelectorAll('#fiche-magie input.talent:checked'))
		.map(input => input.id)
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
		competencesAjoutees: getCheckedFicheBlocKeys('#fiche-competences', '.fiche-bloc-item', 'competence'),
		donsAjoutes: getCheckedFicheBlocKeys('#fiche-dons', '.fiche-bloc-item', 'don'),
		equipementsAjoutes: getCheckedFicheBlocKeys('#fiche-equipements', '.fiche-bloc-item', 'equipement'),
		morphologiesAjoutees: getCheckedFicheBlocKeys('#fiche-morphologies', '.fiche-bloc-item', 'morphologie'),
		magicTalentIds: getCheckedMagicTalentIds(),
		textValues: getPersistedCharacterTextValues()
	});
}

function getCurrentSouffleStep() {
	const souffle = Number.parseInt(String(personnage.state.ficheSouffle ?? '0'), 10);
	return Number.isFinite(souffle) ? souffle : 0;
}

function resolveScoreStep(rawStep) {
	if (rawStep === 'souffle') return getCurrentSouffleStep();
	if (rawStep === '-souffle') return -getCurrentSouffleStep();

	const numericStep = Number.parseInt(rawStep ?? '0', 10);
	return Number.isFinite(numericStep) ? numericStep : 0;
}

function getMagicDomainScoreForSaison(state, saisonValue) {
	const scoreMap = {
		hiver: state?.ficheHiver,
		printemps: state?.fichePrintemps,
		ete: state?.ficheEte,
		automne: state?.ficheAutomne,
		temps: state?.ficheSouffle
	};

	const score = Number.parseInt(String(scoreMap[saisonValue] ?? '0'), 10);
	return Number.isFinite(score) ? score : 0;
}

function getMagicDomainCheckboxesForSaison(saisonValue) {
	const table = saisonValue ? document.getElementById(`fiche-magie-${saisonValue}`) : null;
	if (!table) return [];

	return Array.from(
		table.querySelectorAll(
			'tbody tr td:first-child input[type="checkbox"]:not(.talent), .magie-domaine-toggle input[type="checkbox"]:not(.talent)'
		)
	);
}

function syncMagicDomains(state = personnage.state) {
	const allDomainCheckboxes = Array.from(
		document.querySelectorAll(
			'#fiche-magie .tableau-magie-talents td:first-child input[type="checkbox"]:not(.talent), #fiche-magie .tableau-magie-talents .magie-domaine-toggle input[type="checkbox"]:not(.talent)'
		)
	);

	allDomainCheckboxes.forEach(checkbox => {
		checkbox.disabled = true;
		checkbox.checked = false;
	});

	const saisonValue = state?.saison?.value ?? '';
	const unlockedDomainCount = Math.max(0, getMagicDomainScoreForSaison(state, saisonValue) - 1);
	getMagicDomainCheckboxesForSaison(saisonValue)
		.slice(0, unlockedDomainCount)
		.forEach(checkbox => {
			checkbox.checked = true;
		});

	syncDesktopViewModePresentation();
	syncMobileViewModePresentation();
}

function syncSortLaunchButtonState(state = personnage.state) {
	const launchSortButton = document.getElementById('launch-sort-btn');
	if (!(launchSortButton instanceof HTMLButtonElement)) return;

	const hasSelectedSeason = Boolean(state?.saison?.value);
	launchSortButton.disabled = !hasSelectedSeason;
	launchSortButton.setAttribute('aria-disabled', String(!hasSelectedSeason));
	launchSortButton.title = hasSelectedSeason
		? 'Ouvrir la modale de lancement de sort'
		: 'Choisissez d\'abord une saison';
}

function isMobileReadOnlyViewActive() {
	return document.body.classList.contains('view-mode') && document.body.classList.contains('mobile-sheet-mode');
}

function isDesktopReadOnlyViewActive() {
	return document.body.classList.contains('view-mode') && !document.body.classList.contains('mobile-sheet-mode');
	}

function isMagicTalentDialogModeEnabled() {
	return isMobileReadOnlyViewActive() || isDesktopReadOnlyViewActive();
}

function resolveMagicDomainDataKey(card) {
	const labelToken = normalizePlaceholderToken(card.querySelector('.magie-domaine-name')?.textContent ?? '');
	if (sorts[labelToken]) return labelToken;

	const inputToken = normalizePlaceholderToken(card.querySelector('.magie-domaine-toggle input[type="checkbox"]')?.id ?? '');
	if (sorts[inputToken]) return inputToken;

	const tokenParts = inputToken.split('-').filter(Boolean);
	for (let index = tokenParts.length - 1; index >= 0; index -= 1) {
		if (sorts[tokenParts[index]]) {
			return tokenParts[index];
		}
	}

	return '';
}

function resolveMagicTalentKey(input) {
	const tokenParts = normalizePlaceholderToken(input.id ?? '').split('-').filter(Boolean);
	return tokenParts[tokenParts.length - 1] ?? '';
}

function buildMagicTalentDescription(descriptions) {
	const list = document.createElement('ul');
	list.className = 'magie-talent-description';

	descriptions.forEach(text => {
		const item = document.createElement('li');
		item.textContent = text;
		list.appendChild(item);
	});

	return list;
}

function ensureDesktopMagicTalentLabel(talentInput) {
	const label = talentInput?.closest('label');
	if (!label) return null;

	const existingLabel = label.querySelector('.magie-talent-label');
	if (existingLabel) return existingLabel;

	const labelText = label.textContent.trim();
	label.textContent = '';
	label.appendChild(talentInput);

	const textNode = document.createElement('span');
	textNode.className = 'magie-talent-label';
	textNode.textContent = labelText;
	label.appendChild(textNode);

	return textNode;
}

function syncDesktopViewModePresentation() {
	const magicTables = Array.from(document.querySelectorAll('#fiche-magie .tableau-magie-talents'));
	const isReadOnlyView = isDesktopReadOnlyViewActive();

	magicTables.forEach(table => {
		const rows = Array.from(table.querySelectorAll('tbody tr'));
		rows.forEach(row => {
			row.hidden = false;
			const cells = Array.from(row.querySelectorAll('td'));
			cells.forEach(cell => {
				cell.hidden = false;
			});

			if (!isReadOnlyView) return;

			const domainInput = row.querySelector('td:first-child input[type="checkbox"]:not(.talent)');
			const domainKey = normalizePlaceholderToken(domainInput?.id ?? '');
			if (!domainInput?.checked || !sorts[domainKey]) {
				row.hidden = true;
				return;
			}

			let hasVisibleTalent = false;
			cells.slice(1).forEach(cell => {
				const talentInput = cell.querySelector('input.talent');

				ensureDesktopMagicTalentLabel(talentInput);
				const talentKey = resolveMagicTalentKey(talentInput);
				const descriptions = Array.isArray(sorts[domainKey]?.[talentKey]) ? sorts[domainKey][talentKey] : [];
				if (descriptions.length === 0) {
					cell.hidden = true;
					return;
				}

				hasVisibleTalent = true;
			});

			if (!hasVisibleTalent) {
				row.hidden = true;
			}
		});
	});
}

function syncMobileViewModePresentation() {
	const magicCards = Array.from(document.querySelectorAll('#fiche-magie .magie-domaine-card'));
	const isReadOnlyView = isMobileReadOnlyViewActive();

	magicCards.forEach(card => {
		card.hidden = false;

		const domainToggle = card.querySelector('.magie-domaine-toggle');
		if (domainToggle) {
			domainToggle.hidden = false;
		}

		card.querySelectorAll('.magie-talent-description').forEach(description => {
			description.remove();
		});

		card.querySelectorAll('.magie-talent-chip').forEach(chip => {
			chip.hidden = false;
		});

		if (!isReadOnlyView) return;

		const domainKey = resolveMagicDomainDataKey(card);
		if (!domainKey || !sorts[domainKey]) {
			card.hidden = true;
			return;
		}

		let hasVisibleTalent = false;
		card.querySelectorAll('.magie-talent-chip').forEach(chip => {
			const talentInput = chip.querySelector('input.talent');
			if (!talentInput?.checked) {
				chip.hidden = true;
				return;
			}

			const talentKey = resolveMagicTalentKey(talentInput);
			const descriptions = Array.isArray(sorts[domainKey]?.[talentKey]) ? sorts[domainKey][talentKey] : [];
			if (descriptions.length === 0) {
				chip.hidden = true;
				return;
			}

			chip.insertAdjacentElement('afterend', buildMagicTalentDescription(descriptions));
			hasVisibleTalent = true;
		});

		if (!hasVisibleTalent) {
			card.hidden = true;
		}
	});
}

function bindAmeliorationScoreControls() {
	document.querySelectorAll('.amelioration-score-btn, .sort-dialog-btn').forEach(button => {
		button.addEventListener('click', event => {
			if (window.matchMedia('(pointer: coarse)').matches) {
				const lastHandledAt = lastScoreButtonClickByElement.get(button) ?? -Infinity;
				if ((event.timeStamp - lastHandledAt) < 180) {
					event.preventDefault();
					return;
				}
				lastScoreButtonClickByElement.set(button, event.timeStamp);
			}

			const targetId = button.dataset.scoreTarget;
			const step = resolveScoreStep(button.dataset.scoreStep ?? '0');
			const input = targetId ? document.getElementById(targetId) : null;
			if (!input || !Number.isFinite(step)) return;

			if (sortDialogController.handleScoreStep(targetId, input, step)) {
				return;
			}

			const current = Number.parseInt(input.value || '0', 10);
			const nextValue = (Number.isFinite(current) ? current : 0) + step;
			input.value = String(nextValue);
			input.dispatchEvent(new Event('input', { bubbles: true }));
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});
	});
}

function bindPersistedCharacterTextSync() {
	document.querySelectorAll(persistedCharacterTextFieldSelector).forEach(field => {
		if (!isPersistedCharacterTextField(field)) return;
		field.addEventListener('input', syncPersonnageFromDom);
		field.addEventListener('change', syncPersonnageFromDom);
	});
}

function getCssColorVar(varName, fallback) {
	const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	return value || fallback;
}

function isMobilePage() {
	return Boolean(document.getElementById('mobile-step-nav'));
}

function getMobileOptionDetailTargetSelector() {
	return isMobilePage() ? '.mobile-step-detail' : '';
}

function shouldUseCollapsedOptionDetails() {
	return !isMobilePage();
}

function createMorphologyGroupIntroNode(title, description) {
	if (isMobilePage()) {
		const intro = document.createElement('div');
		intro.className = 'step-text temps';

		const optionLabel = document.createElement('span');
		optionLabel.className = 'option-label';

		const label = document.createElement('label');
		label.textContent = title;
		optionLabel.appendChild(label);

		const desc = document.createElement('span');
		desc.className = 'desc temps-desc';

		const shortNode = document.createElement('span');
		shortNode.className = 'short';
		shortNode.textContent = description;
		desc.appendChild(shortNode);

		intro.appendChild(optionLabel);
		intro.appendChild(desc);
		return intro;
	}

	const intro = document.createElement('div');
	intro.className = 'option temps';

	const optionLabel = document.createElement('span');
	optionLabel.className = 'option-label';

	const label = document.createElement('label');
	label.textContent = title;
	optionLabel.appendChild(label);

	const desc = document.createElement('span');
	desc.className = 'desc temps-desc';

	const shortNode = document.createElement('span');
	shortNode.className = 'short';
	shortNode.textContent = description;
	desc.appendChild(shortNode);

	intro.appendChild(optionLabel);
	intro.appendChild(desc);
	return intro;
}

function renderMorphologyOptionGroups() {
	const detailTargetSelector = getMobileOptionDetailTargetSelector();

	Object.entries(morphologyGroupConfig).forEach(([groupName, groupConfig]) => {
		const container = document.getElementById(`${groupName}-group`);
		if (!container) return;

		const optionNodes = groupConfig.options.map(optionConfig => {
			return createOptionCard({
				name: groupName,
				value: optionConfig.key,
				id: `${groupName}-${optionConfig.key}`,
				label: optionConfig.label,
				saison: optionConfig.saison,
				dataset: { morphologie: optionConfig.key },
				shortText: optionConfig.shortText,
				detailTargetSelector
			});
		});

		renderOptionGroup(container, [
			createMorphologyGroupIntroNode(groupConfig.title, groupConfig.description),
			...optionNodes
		]);
	});
}

function renderConfiguredOptionSections() {
	const collapsedDetails = shouldUseCollapsedOptionDetails();
	const detailTargetSelector = getMobileOptionDetailTargetSelector();

	optionSectionConfigs.forEach(sectionConfig => {
		const container = sectionConfig.containerSelector
			? document.querySelector(sectionConfig.containerSelector)
			: document.getElementById(sectionConfig.containerId);
		if (!container) return;

		const optionNodes = sectionConfig.options.map(optionConfig => createOptionCard({
			name: sectionConfig.name,
			value: optionConfig.value,
			id: optionConfig.id,
			label: optionConfig.label,
			labelSuffixHtml: optionConfig.labelSuffixHtml,
			saison: optionConfig.saison,
			dataset: optionConfig.dataset,
			shortText: optionConfig.shortText,
			shortHtml: optionConfig.shortHtml,
			longText: optionConfig.longText,
			longHtml: optionConfig.longHtml,
			descHtml: optionConfig.descHtml,
			longHidden: collapsedDetails,
			donHtml: optionConfig.donHtml,
			donPlacement: sectionConfig.donPlacement,
			descClasses: sectionConfig.descClassesByValue?.[optionConfig.value] ?? [],
			detailTargetSelector,
			showReadMoreButton: collapsedDetails && Boolean(optionConfig.longText || optionConfig.longHtml || optionConfig.descHtml?.includes('class="long"')),
			readMoreSvg: createQuestionMarkSvg(couleurs[optionConfig.saison] || couleurs.temps)
		}));

		renderOptionGroup(container, optionNodes);
	});
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
	const option = btn.closest('.option, .fiche-bloc-item');
	if (option) {
		if (option.classList.contains('hiver')) saison = 'hiver';
		else if (option.classList.contains('printemps')) saison = 'printemps';
		else if (option.classList.contains('ete')) saison = 'ete';
		else if (option.classList.contains('automne')) saison = 'automne';
		else if (option.classList.contains('temps')) saison = 'temps';
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
	});
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

function getFicheBlocCheckboxSelector(type, key) {
	const selectorMap = {
		competence: `#fiche-competences .fiche-bloc-item[data-competence="${key}"] input[type="checkbox"]`,
		don: `#fiche-dons .fiche-bloc-item[data-don="${key}"] input[type="checkbox"]`,
		equipement: `#fiche-equipements .fiche-bloc-item[data-equipement="${key}"] input[type="checkbox"]`,
		morphologie: `#fiche-morphologies .fiche-bloc-item[data-morphologie="${key}"] input[type="checkbox"]`
	};

	return selectorMap[type] ?? '';
}

function getAmeliorationCheckboxSelector(type, key) {
	return `.ameliorations-item-checkbox[data-amelioration-type="${type}"][data-amelioration-key="${key}"]`;
}

function resolveFicheBlocAmelioration(item) {
	if (!item) return null;

	const typeByDatasetKey = {
		competence: 'competence',
		don: 'don',
		equipement: 'equipement',
		morphologie: 'morphologie'
	};

	for (const [datasetKey, type] of Object.entries(typeByDatasetKey)) {
		const key = item.dataset[datasetKey];
		if (key) {
			return { type, key };
		}
	}

	return null;
}

let isSyncingAmeliorationSelection = false;

function syncFicheBlocCheckbox(type, key, shouldBeChecked) {
	const checkbox = document.querySelector(getFicheBlocCheckboxSelector(type, key));
	if (!checkbox || checkbox.checked === shouldBeChecked) return;

	checkbox.checked = shouldBeChecked;
	checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}


function syncAmeliorationCheckbox(type, key, shouldBeChecked) {
	const checkbox = document.querySelector(getAmeliorationCheckboxSelector(type, key));
	if (!checkbox || checkbox.checked === shouldBeChecked) return;

	checkbox.checked = shouldBeChecked;
	checkbox.dispatchEvent(new Event('change', { bubbles: true }));
}

function setAmeliorationInPersonnage(type, key, shouldBeChecked) {
	const isAdded = getAddedAmeliorationsForType(type).includes(key);
	if (shouldBeChecked === isAdded) return true;

	if (!shouldBeChecked) {
		const removed = personnage.removeAmelioration(type, key);
		if (!removed) return;
		return true;
	}

	const added = personnage.addAmelioration(type, key);
	if (!added) return;
	return true;
}

function syncAmeliorationSelection(type, key, shouldBeChecked, source) {
	if (isSyncingAmeliorationSelection) return;

	isSyncingAmeliorationSelection = true;
	setAmeliorationInPersonnage(type, key, shouldBeChecked);

	if (source !== 'fiche') {
		syncFicheBlocCheckbox(type, key, shouldBeChecked);
	}

	if (source !== 'amelioration') {
		syncAmeliorationCheckbox(type, key, shouldBeChecked);
	}

	isSyncingAmeliorationSelection = false;
}

function refreshAmeliorationButtons(state = personnage.state) {
	document.querySelectorAll('.ameliorations-item-checkbox').forEach(checkbox => {
		const { ameliorationType, ameliorationKey } = checkbox.dataset;
		const isAdded = getAddedAmeliorationsForType(ameliorationType, state).includes(ameliorationKey);
		checkbox.checked = isAdded;
	});
}

function createAmeliorationItem({ key, type, nom, meta, description, saison = 'temps' }) {
	const item = createOptionCard({
		value: key,
		id: `amelioration-${type}-${key}`,
		label: nom,
		saison,
		extraClasses: ['ameliorations-item']
	});

	const checkbox = item.querySelector('input[type="checkbox"]');
	const optionLabel = item.querySelector('.option-label');
	if (!checkbox || !optionLabel) return item;

	checkbox.classList.add('ameliorations-item-checkbox');
	checkbox.dataset.ameliorationType = type;
	checkbox.dataset.ameliorationKey = key;
	checkbox.setAttribute('aria-label', `Selectionner ${nom}`);
	checkbox.addEventListener('change', () => {
		syncAmeliorationSelection(type, key, checkbox.checked, 'amelioration');
	});

	optionLabel.classList.add('ameliorations-item-option-label');

	if (meta) {
		const metaNode = document.createElement('span');
		metaNode.className = 'ameliorations-item-category';
		metaNode.textContent = meta;
		item.appendChild(metaNode);
	}

	const descriptionNode = document.createElement('span');
	descriptionNode.className = 'ameliorations-item-description';
	descriptionNode.innerHTML = description;
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

function fillAmeliorationsSections() {
	ameliorationSectionConfigs.forEach(sectionConfig => {
		fillAmeliorationsList(sectionConfig.containerId, sectionConfig.items);
	});
}

function initLignees() {
	const lignéesList = document.getElementById('lignées-list');
	if (!lignéesList) return;

	const collapsedDetails = shouldUseCollapsedOptionDetails();
	const detailTargetSelector = getMobileOptionDetailTargetSelector();
	const optionNodes = ligneeOptionConfigs.map(optionConfig => {
		const option = createOptionCard({
			name: 'lignee',
			value: optionConfig.value,
			id: optionConfig.id,
			label: optionConfig.label,
			labelSuffixHtml: optionConfig.labelSuffixHtml,
			saison: optionConfig.saison,
			dataset: optionConfig.dataset,
			shortText: optionConfig.shortText,
			longHtml: optionConfig.longHtml,
			donHtml: optionConfig.donHtml,
			longHidden: collapsedDetails,
			detailTargetSelector,
			showReadMoreButton: collapsedDetails,
			readMoreSvg: createQuestionMarkSvg(couleurs[optionConfig.saison] || couleurs.temps),
			readMoreLabel: 'Afficher la description',
			extraClasses: optionConfig.extraClasses
		});

		option.style.display = 'none';
		return option;
	});

	renderOptionGroup(lignéesList, optionNodes);
}

function initBindings() {
	bindViewModeActions();

	const launchSortButton = document.getElementById('launch-sort-btn');
	launchSortButton?.addEventListener('click', () => {
		if (launchSortButton.disabled) return;
		sortDialogController.openSortDialog();
	});

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
	bindPersistedCharacterTextSync();

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

	document.querySelectorAll('.fiche-bloc-item').forEach(item => {
		item.addEventListener('click', function(e) {
			if (e.target.closest('.lire-plus.pictogram-btn, svg, input, label')) return;
			const checkbox = item.querySelector('input[type="checkbox"]');
			checkbox?.click();
		});
	});

	document.querySelectorAll('.fiche-bloc-item input[type="checkbox"]').forEach(checkbox => {
		checkbox.addEventListener('change', () => {
			const amelioration = resolveFicheBlocAmelioration(checkbox.closest('.fiche-bloc-item'));
			if (!amelioration) return;

			syncAmeliorationSelection(amelioration.type, amelioration.key, checkbox.checked, 'fiche');
		});
	});

	document.querySelectorAll('#fiche-magie input[type="checkbox"]').forEach(input => {
		if (input.classList.contains('talent')) {
			input.addEventListener('change', syncPersonnageFromDom);
		}
		input.addEventListener('change', syncDesktopViewModePresentation);
		input.addEventListener('change', syncMobileViewModePresentation);
	});

	document.getElementById('fiche-magie')?.addEventListener('click', event => {
		const label = event.target instanceof Element
			? event.target.closest('.magie-talent-label')
			: null;
		if (!(label instanceof HTMLElement)) return;
		if (!isMagicTalentDialogModeEnabled()) return;

		event.preventDefault();
		event.stopPropagation();

		const talentInput = label.closest('.magie-talent-chip, td, label')?.querySelector('input.talent');
		if (!talentInput?.checked) return;

		sortDialogController.openSortDialog({ talentId: talentInput.id });
	});

	document.addEventListener('viewmodechange', () => {
		syncDesktopViewModePresentation();
		syncMobileViewModePresentation();
	});
}

function initStateFromHash() {
	// Restaure l'état à l'ouverture si hash présent (déclenche les change events → updateFiche*)
	hashStateSync.restoreStateFromHash();
	// Permet de restaurer si le hash change en cours de navigation
	window.addEventListener('hashchange', hashStateSync.restoreStateFromHash);
}

function isElementVisible(element) {
	if (!element) return false;
	if (typeof element.checkVisibility === 'function') {
		return element.checkVisibility();
	}

	const style = window.getComputedStyle(element);
	return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

function syncCollapsibleSectionWithSummaryVisibility() {
	const details = document.getElementById('collapsible-section');
	const summary = details?.querySelector('summary');
	if (!details) return;

	details.open = !isElementVisible(summary);
}

function bindResponsiveCollapsibleSection() {
	syncCollapsibleSectionWithSummaryVisibility();

	const details = document.getElementById('collapsible-section');
	const summary = details?.querySelector('summary');
	if (!summary) return;

	const resizeObserver = new ResizeObserver(() => {
		syncCollapsibleSectionWithSummaryVisibility();
	});
	resizeObserver.observe(summary);
}

function bindDesktopHeaderMenu() {
	const headerMenu = document.querySelector('.desktop-header-menu');
	if (!(headerMenu instanceof HTMLDetailsElement)) return;

	function closeHeaderMenu() {
		headerMenu.open = false;
	}

	headerMenu.addEventListener('click', event => {
		const button = event.target instanceof Element
			? event.target.closest('.page-action-btn')
			: null;
		if (button instanceof HTMLButtonElement) {
			closeHeaderMenu();
		}
	});

	document.addEventListener('click', event => {
		if (!(event.target instanceof Node)) return;
		if (!headerMenu.open) return;
		if (headerMenu.contains(event.target)) return;
		closeHeaderMenu();
	});

	document.addEventListener('keydown', event => {
		if (event.key === 'Escape') {
			closeHeaderMenu();
		}
	});
}

window.addEventListener('DOMContentLoaded', function() {
	renderConfiguredOptionSections();
	renderMorphologyOptionGroups();

	ficheRenderer.fillFicheFromData(competences, 'printemps', 'competence');
	ficheRenderer.fillFicheFromData(dons, 'ete', 'don');
	ficheRenderer.fillFicheFromData(equipements, 'automne', 'equipement');
	ficheRenderer.fillFicheFromData(morphologies, 'hiver', 'morphologie');

	document.querySelectorAll('.fiche-bloc-item').forEach(div => { div.style.display = 'none'; });
	personnage.subscribe(ficheRenderer.renderPersonnage);
	personnage.subscribe(syncMagicDomains);
	personnage.subscribe(syncSortLaunchButtonState);
	personnage.subscribe(hashStateSync.updateHashFromState);

	fillAmeliorationsSections();

	initLignees();
	document.dispatchEvent(new Event('optiongroupsrendered'));
	updateViewModeUi();
	initBindings();
	initStateFromHash();
	syncPersonnageFromDom();
	syncSortLaunchButtonState();
	syncMobileViewModePresentation();
	bindDesktopHeaderMenu();
	sortDialogController.bindSortDialog();
	bindResponsiveCollapsibleSection();
});
