import { HashCodec } from './hashCodec.js';
import { Personnage } from './personnage.js';
import { bindViewModeActions, updateViewModeUi } from './viewMode.js';
import { lignees } from './data/lignees.js';
import { competences } from './data/competences.js';
import { dons } from './data/dons.js';
import { equipements } from './data/equipements.js';
import { morphologies } from './data/morphologies.js';
import { sorts } from './data/sorts.js';

// Couleurs par saison
const couleurs = {
	hiver: getCssColorVar('--color-hiver', '#235a8a'),
	printemps: getCssColorVar('--color-printemps', '#2c7a4b'),
	ete: getCssColorVar('--color-ete', '#bfa600'),
	automne: getCssColorVar('--color-automne', '#a13a3a'),
	temps: getCssColorVar('--color-temps', '#3a7ad2')
};

const personnage = new Personnage();
const sortManagedInputIds = new Set(['sort-graines', 'sort-aire-effet', 'sort-portee', 'sort-puissance', 'sort-duree']);
let sortGrainesUtilisees = 0;
let handleSortDialogScoreStep = null;

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
		competencesAjoutees: getCheckedFicheBlocKeys('#fiche-competences', '.fiche-bloc-item', 'competence'),
		donsAjoutes: getCheckedFicheBlocKeys('#fiche-dons', '.fiche-bloc-item', 'don'),
		equipementsAjoutes: getCheckedFicheBlocKeys('#fiche-equipements', '.fiche-bloc-item', 'equipement'),
		morphologiesAjoutees: getCheckedFicheBlocKeys('#fiche-morphologies', '.fiche-bloc-item', 'morphologie')
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

function bindAmeliorationScoreControls() {
	document.querySelectorAll('.amelioration-score-btn').forEach(button => {
		button.addEventListener('click', () => {
			const targetId = button.dataset.scoreTarget;
			const step = resolveScoreStep(button.dataset.scoreStep ?? '0');
			const input = targetId ? document.getElementById(targetId) : null;
			if (!input || !Number.isFinite(step)) return;

			if (handleSortDialogScoreStep?.(targetId, input, step)) {
				return;
			}

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

function bindSortDialog() {
	const dialog = document.getElementById('sort-dialog');
	const openButton = document.getElementById('open-sort-dialog-btn');
	const form = dialog?.querySelector('form');
	const scoreInputs = form ? Array.from(form.querySelectorAll('.amelioration-score-input')) : [];
	const talentSelect = document.getElementById('sort-talent-select');
	const talentEffectsList = document.getElementById('sort-talent-effets');
	const aireEffetInput = document.getElementById('sort-aire-effet');
	const porteeInput = document.getElementById('sort-portee');
	const puissanceInput = document.getElementById('sort-puissance');
	const dureeInput = document.getElementById('sort-duree');
	const grainesInput = document.getElementById('sort-graines');
	const grainesIndicator = document.getElementById('sort-graines-indicator');
	const aireEffetIndicator = document.getElementById('sort-aire-effet-indicator');
	const porteeIndicator = document.getElementById('sort-portee-indicator');
	const puissanceIndicator = document.getElementById('sort-puissance-indicator');
	const dureeIndicator = document.getElementById('sort-duree-indicator');
	const sortDialogButtons = form ? Array.from(form.querySelectorAll('.amelioration-score-btn')) : [];

	if (!dialog || !openButton || !form) return;

	const sortParameterConfigs = [
		{ input: aireEffetInput, indicator: aireEffetIndicator },
		{ input: porteeInput, indicator: porteeIndicator },
		{ input: puissanceInput, indicator: puissanceIndicator },
		{ input: dureeInput, indicator: dureeIndicator }
	].filter(config => config.input);
	let isSyncingSortDialog = false;

	const saisonSymbols = {
		hiver: '❄️',
		printemps: '🌱',
		ete: '☀️',
		automne: '🍁',
		temps: '⏳',
		rupture: '💀'
	};

	function buildTalentOptionLabel(talentCheckbox) {
		const { categoryLabel, actionLabel } = getTalentContextLabels(talentCheckbox);
		const category = categoryLabel || '';
		const action = actionLabel || '';

		if (!category && !action) return '';
		if (!category) return action;
		if (!action) return category;
		return `${category} - ${action}`;
	}

	function getSortInputValue(input) {
		const value = Number.parseInt(input?.value ?? '0', 10);
		return Number.isFinite(value) ? Math.max(0, value) : 0;
	}

	function getSortBaseValue(input) {
		const value = Number.parseInt(input?.dataset.sortBase ?? input?.defaultValue ?? '0', 10);
		return Number.isFinite(value) ? Math.max(0, value) : 0;
	}

	function getSortSouffleValue() {
		const value = Number.parseInt(String(personnage.state.ficheSouffle ?? '0'), 10);
		return Number.isFinite(value) ? Math.max(0, value) : 0;
	}

	function getSeedsUsedByInput(input, souffleValue = getSortSouffleValue()) {
		if (!input || souffleValue <= 0) return 0;

		const delta = getSortInputValue(input) - getSortBaseValue(input);
		if (delta <= 0) return 0;

		return Math.ceil(delta / souffleValue);
	}

	function getTalentContextLabels(talentCheckbox) {
		const domainCard = talentCheckbox.closest('.magie-domaine-card');
		if (domainCard) {
			return {
				categoryLabel: domainCard.querySelector('.magie-domaine-name')?.textContent?.trim() || '',
				actionLabel: talentCheckbox.closest('label')?.querySelector('.magie-talent-label')?.textContent?.trim() || ''
			};
		}

		const rowElement = talentCheckbox.closest('tr');
		const firstCellLabel = rowElement?.querySelector('td:first-child label');
		return {
			categoryLabel: firstCellLabel?.textContent?.trim() || '',
			actionLabel: talentCheckbox.parentElement?.textContent?.trim() || ''
		};
	}

	function getGrainesSelectionnees() {
		return getSortInputValue(grainesInput);
	}

	function getMinAllowedValueForInput(input) {
		if (!input) return 0;
		if (input === grainesInput) return Math.max(0, updateSortGrainesUsed());
		return getSortBaseValue(input);
	}

	function updateSortGrainesUsed() {
		sortGrainesUtilisees = sortParameterConfigs.reduce(
			(total, config) => total + getSeedsUsedByInput(config.input),
			0
		);

		return sortGrainesUtilisees;
	}

	function getRemainingSeedsForInput(input) {
		const usedByOthers = sortParameterConfigs.reduce((total, config) => {
			if (config.input === input) return total;
			return total + getSeedsUsedByInput(config.input);
		}, 0);

		return Math.max(0, getGrainesSelectionnees() - usedByOthers);
	}

	function getMaxAllowedValueForInput(input) {
		if (input === grainesInput) return Number.POSITIVE_INFINITY;

		const souffleValue = getSortSouffleValue();
		const baseValue = getSortBaseValue(input);
		if (souffleValue <= 0) return baseValue;

		return baseValue + getRemainingSeedsForInput(input) * souffleValue;
	}

	function renderIndicatorSymbols(indicator, symbol, count) {
		if (!indicator) return;

		indicator.replaceChildren();
		if (!symbol || count <= 0) return;

		const fragment = document.createDocumentFragment();
		for (let index = 0; index < count; index += 1) {
			const seed = document.createElement('span');
			seed.className = 'sort-dialog-row-indicator-seed';
			seed.textContent = symbol;
			fragment.appendChild(seed);
		}

		indicator.appendChild(fragment);
	}

	function renderSortDialogIndicators() {
		const selectedCount = getGrainesSelectionnees();
		const saisonKey = personnage.state.saison?.value ?? '';
		const symbol = saisonSymbols[saisonKey] ?? '';
		updateSortGrainesUsed();
		const remainingSeeds = Math.max(0, selectedCount - sortGrainesUtilisees);

		if (grainesIndicator) {
			renderIndicatorSymbols(grainesIndicator, symbol, remainingSeeds);
			grainesIndicator.dataset.usedSeeds = String(sortGrainesUtilisees);
			grainesIndicator.dataset.remainingSeeds = String(remainingSeeds);
			grainesIndicator.title = `${remainingSeeds} restante${remainingSeeds > 1 ? 's' : ''} • ${sortGrainesUtilisees}/${selectedCount} utilisees`;
		}

		sortParameterConfigs.forEach(config => {
			if (!config.indicator) return;
			const usedSeeds = getSeedsUsedByInput(config.input);
			renderIndicatorSymbols(config.indicator, symbol, usedSeeds);
			config.indicator.title = `${usedSeeds} graine${usedSeeds > 1 ? 's' : ''} utilisee${usedSeeds > 1 ? 's' : ''}`;
		});

		updateSortDialogButtonStates();
	}

	function updateSortDialogButtonStates() {
		sortDialogButtons.forEach(button => {
			const targetId = button.dataset.scoreTarget;
			const input = targetId ? document.getElementById(targetId) : null;
			if (!input || !sortManagedInputIds.has(targetId)) {
				button.disabled = false;
				return;
			}

			const step = resolveScoreStep(button.dataset.scoreStep ?? '0');
			const currentValue = getSortInputValue(input);
			const minValue = getMinAllowedValueForInput(input);
			const maxValue = getMaxAllowedValueForInput(input);

			let isDisabled = step === 0;
			if (!isDisabled && step < 0) {
				isDisabled = currentValue <= minValue;
			}
			if (!isDisabled && step > 0) {
				isDisabled = currentValue >= maxValue;
			}

			button.disabled = isDisabled;
		});
	}

	function normalizeSortDialogInput(changedInput = null) {
		if (isSyncingSortDialog) return;
		isSyncingSortDialog = true;

		if (changedInput === grainesInput && grainesInput) {
			const normalizedGraines = Math.max(updateSortGrainesUsed(), getSortInputValue(grainesInput));
			if (String(normalizedGraines) !== grainesInput.value) {
				grainesInput.value = String(normalizedGraines);
			}
		}

		const changedConfig = sortParameterConfigs.find(config => config.input === changedInput);
		if (changedConfig) {
			const normalizedValue = Math.max(
				getMinAllowedValueForInput(changedConfig.input),
				Math.min(getSortInputValue(changedConfig.input), getMaxAllowedValueForInput(changedConfig.input))
			);
			if (String(normalizedValue) !== changedConfig.input.value) {
				changedConfig.input.value = String(normalizedValue);
			}
		}

		renderSortDialogIndicators();
		isSyncingSortDialog = false;
	}

	function getTalentSortKeys(talentCheckbox) {
		const { categoryLabel, actionLabel } = getTalentContextLabels(talentCheckbox);
		const categoryKey = normalizePlaceholderToken(categoryLabel);
		const actionKey = normalizePlaceholderToken(actionLabel);

		return { categoryKey, actionKey };
	}

	function renderTalentEffects() {
		if (!talentEffectsList) return;

		talentEffectsList.innerHTML = '';

		const selectedOption = talentSelect?.selectedOptions?.[0];
		const categoryKey = selectedOption?.dataset.sortCategory ?? '';
		const actionKey = selectedOption?.dataset.sortAction ?? '';
		const effects = sorts?.[categoryKey]?.[actionKey] ?? [];

		if (!categoryKey || !actionKey || effects.length === 0) {
			const item = document.createElement('li');
			item.textContent = 'Aucun effet défini pour ce talent.';
			talentEffectsList.appendChild(item);
			return;
		}

		effects.forEach(effect => {
			const item = document.createElement('li');
			item.textContent = effect;
			talentEffectsList.appendChild(item);
		});
	}

	function setSortDialogDefaultScores() {
		const defaults = [
			[aireEffetInput, personnage.state.ficheHiver],
			[porteeInput, personnage.state.fichePrintemps],
			[puissanceInput, personnage.state.ficheEte],
			[dureeInput, personnage.state.ficheAutomne]
		];

		defaults.forEach(([input, value]) => {
			if (!input) return;

			const normalizedValue = String(value ?? '0');
			input.dataset.sortBase = normalizedValue;
			input.defaultValue = normalizedValue;
			input.value = normalizedValue;
			input.dispatchEvent(new Event('input', { bubbles: true }));
			input.dispatchEvent(new Event('change', { bubbles: true }));
		});

		normalizeSortDialogInput();
		renderSortDialogIndicators();
	}

	function populateTalentSelect() {
		if (!talentSelect) return;

		talentSelect.innerHTML = '';
		const checkedTalents = Array.from(document.querySelectorAll('input.talent:checked'));

		if (checkedTalents.length === 0) {
			const option = document.createElement('option');
			option.value = '';
			option.textContent = 'Aucun talent coché';
			option.selected = true;
			talentSelect.appendChild(option);
			talentSelect.disabled = true;
			renderTalentEffects();
			return;
		}

		talentSelect.disabled = false;
		checkedTalents.forEach(checkbox => {
			const { categoryKey, actionKey } = getTalentSortKeys(checkbox);
			const option = document.createElement('option');
			option.value = checkbox.id;
			option.textContent = buildTalentOptionLabel(checkbox);
			option.dataset.sortCategory = categoryKey;
			option.dataset.sortAction = actionKey;
			talentSelect.appendChild(option);
		});

		renderTalentEffects();
	}

	openButton.addEventListener('click', () => {
		if (dialog.open) return;

		setSortDialogDefaultScores();
		populateTalentSelect();

		if (typeof dialog.showModal === 'function') {

	handleSortDialogScoreStep = (targetId, input, step) => {
		if (!sortManagedInputIds.has(targetId)) return false;

		const currentValue = getSortInputValue(input);
			const minValue = getMinAllowedValueForInput(input);
			const maxValue = getMaxAllowedValueForInput(input);
		let nextValue = currentValue + step;

			if (step > 0) {
				nextValue = Math.min(nextValue, maxValue);
		}
			nextValue = Math.max(minValue, nextValue);

		if (nextValue === currentValue) {
			renderSortDialogIndicators();
			return true;
		}

		input.value = String(nextValue);
		input.dispatchEvent(new Event('input', { bubbles: true }));
		input.dispatchEvent(new Event('change', { bubbles: true }));
		return true;
	};
			dialog.showModal();
			return;
		}

		dialog.setAttribute('open', 'open');
	});

	dialog.addEventListener('click', event => {
		// With <dialog>, backdrop clicks target the dialog element itself.
		// This avoids false positives with native <select> popups that can render outside bounds.
		if (event.target !== dialog) return;

		if (typeof dialog.close === 'function') {
			dialog.close('dismiss');
		} else {
			dialog.removeAttribute('open');
		}
	});

	talentSelect?.addEventListener('change', renderTalentEffects);
	grainesInput?.addEventListener('input', () => normalizeSortDialogInput(grainesInput));
	grainesInput?.addEventListener('change', () => normalizeSortDialogInput(grainesInput));
	sortParameterConfigs.forEach(config => {
		config.input.addEventListener('input', () => normalizeSortDialogInput(config.input));
		config.input.addEventListener('change', () => normalizeSortDialogInput(config.input));
	});

	form.addEventListener('reset', () => {
		window.requestAnimationFrame(() => {
			setSortDialogDefaultScores();
			scoreInputs.forEach(input => {
				input.dispatchEvent(new Event('input', { bubbles: true }));
				input.dispatchEvent(new Event('change', { bubbles: true }));
			});
			renderTalentEffects();
			renderSortDialogIndicators();
		});
	});

	dialog.addEventListener('close', () => {
		handleSortDialogScoreStep = null;
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

	document.getElementById('fiche-personnage').className = state.saisonClass;

	refreshFicheSummaryPlaceholders(state);

	renderCompetences(state);
	renderEquipements(state);
	renderDons(state);
	renderMorphologies(state);
	refreshAmeliorationButtons(state);
}

function renderCompetences(state) {
	document.querySelectorAll('#fiche-competences .fiche-bloc-item').forEach(div => {
		div.style.display = 'none';
	});

	state.competencesSelectionnees.forEach(competenceKey => {
		const competenceBloc = document.querySelector(`#fiche-competences .fiche-bloc-item[data-competence="${competenceKey}"]`);
		if (competenceBloc) competenceBloc.style.display = '';
	});
}

function createQuestionMarkSvg(color) {
	return `
		<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="11" cy="11" r="10" stroke="${color}" stroke-width="2" fill="#fff"/>
			<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="${color}">?</text>
		</svg>
	`;
}

function normalizePlaceholderToken(token) {
	return String(token ?? '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.trim();
}

function replaceSummaryPlaceholders(template, state) {
	if (typeof template !== 'string') return '';

	const valuesByToken = {
		hiver: String(state?.ficheHiver ?? ''),
		printemps: String(state?.fichePrintemps ?? ''),
		ete: String(state?.ficheEte ?? ''),
		automne: String(state?.ficheAutomne ?? ''),
		vitalite: String(state?.ficheVitalite ?? ''),
		souffle: String(state?.ficheSouffle ?? ''),
		resilience: String(state?.ficheResilience ?? '')
	};

	return template.replace(/\{([^}]+)\}/g, (match, token) => {
		const normalizedToken = normalizePlaceholderToken(token);
		return Object.hasOwn(valuesByToken, normalizedToken) ? valuesByToken[normalizedToken] : match;
	});
}

function refreshFicheSummaryPlaceholders(state) {
	document.querySelectorAll('.fiche-bloc-item .desc[data-summary-template]').forEach(desc => {
		const template = desc.dataset.summaryTemplate ?? '';
		desc.textContent = replaceSummaryPlaceholders(template, state);
	});
}

function fillFicheFromData(data, saison, itemType) {
	const container = document.getElementById(`fiche-${itemType}s`);
	if (!container) return;

	container.innerHTML = '';
	const fragment = document.createDocumentFragment();
	const iconColor = couleurs[saison] || couleurs.temps;

	Object.entries(data).forEach(([key, item]) => {
		const itemDiv = document.createElement('div');
		itemDiv.className = `fiche-bloc-item ${saison}`;
		itemDiv.dataset[itemType] = key;

		const input = document.createElement('input');
		input.type = 'checkbox';
		input.id = `${itemType}-${key}`;
		input.name = `${itemType}-${key}`;
		input.value = key;

		const label = document.createElement('label');
		label.setAttribute('for', input.id);
		label.textContent = item.nom;

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'lire-plus pictogram-btn';
		button.setAttribute('aria-label', 'Afficher le résumé');
		button.innerHTML = createQuestionMarkSvg(iconColor);

		const desc = document.createElement('span');
		desc.className = 'desc';
		desc.style.display = 'none';
		desc.dataset.summaryTemplate = item.summary ?? item.description ?? '';

		const initialSummary = replaceSummaryPlaceholders(desc.dataset.summaryTemplate, personnage.state);
		desc.textContent = initialSummary;

		itemDiv.appendChild(input);
		itemDiv.appendChild(label);
		itemDiv.appendChild(button);
		itemDiv.appendChild(desc);
		fragment.appendChild(itemDiv);
	});

	container.appendChild(fragment);
}

function renderEquipements(state) {
	document.querySelectorAll('#fiche-equipements .fiche-bloc-item').forEach(div => {
		div.style.display = 'none';
	});

	state.equipementsSelectionnes.forEach(eqKey => {
		const div = document.querySelector(`#fiche-equipements .fiche-bloc-item[data-equipement="${eqKey}"]`);
		if (div) div.style.display = '';
	});
}

function renderDons(state) {
	document.querySelectorAll('#fiche-dons .fiche-bloc-item').forEach(div => {
		div.style.display = 'none';
	});

	state.donsSelectionnes.forEach(donKey => {
		const div = document.querySelector(`#fiche-dons .fiche-bloc-item[data-don="${donKey}"]`);
		if (div) div.style.display = '';
	});
}

function renderMorphologies(state) {
	document.querySelectorAll('#fiche-morphologies .fiche-bloc-item').forEach(div => {
		div.style.display = 'none';
	});

	state.morphologiesSelectionnees.forEach(morphKey => {
		const div = document.querySelector(`#fiche-morphologies .fiche-bloc-item[data-morphologie="${morphKey}"]`);
		if (div) div.style.display = '';
	});
}

function getCssColorVar(varName, fallback) {
	const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
	return value || fallback;
}

// Génération et restauration de l'état via hash
function isPersistedHashField(field) {
	return Boolean(field?.id) && !field.closest('#sort-dialog');
}

function getCheckedInputs() {
	return Array.from(document.querySelectorAll('input[type="checkbox"]'))
		.filter(input => input.checked && isPersistedHashField(input))
		.map(input => input.id);
}

function getChoiceInputs() {
	return Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(isPersistedHashField);
}

function getTextStateFields() {
	return Array.from(document.querySelectorAll('input[type="text"], textarea')).filter(isPersistedHashField);
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
		const option = cb.closest('.option');
		if (option) option.classList.remove('selected');
	});
	const selectedOption = el.closest('.option');
	if (selectedOption && el.checked) selectedOption.classList.add('selected');
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
		competence: `#fiche-competences .fiche-bloc-item[data-competence="${key}"] input[type="checkbox"]`,
		don: `#fiche-dons .fiche-bloc-item[data-don="${key}"] input[type="checkbox"]`,
		equipement: `#fiche-equipements .fiche-bloc-item[data-equipement="${key}"] input[type="checkbox"]`,
		morphologie: `#fiche-morphologies .fiche-bloc-item[data-morphologie="${key}"] input[type="checkbox"]`
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

function createAmeliorationItem({ key, type, nom, meta, description }) {
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
			description: equipement.description
		}))
	);
}

function initLignees() {
	const lignéesList = document.getElementById('lignées-list');
	if (!lignéesList) return;

	Object.entries(lignees).forEach(([key, lignee]) => {
		const saison = dons[lignee.don]?.saison;

		const option = document.createElement('div');
		option.className = `option lignee ${lignee.famille} ${saison}`;
		option.style.display = 'none';

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'lire-plus pictogram-btn';
		button.setAttribute('aria-label', 'Afficher la description');
		button.innerHTML = createQuestionMarkSvg(couleurs[saison] || couleurs.temps);

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.name = 'lignee';
		checkbox.value = key;
		checkbox.id = `lignee-${key}`;
		checkbox.dataset.don = lignee.don;
		
		const label = document.createElement('label');
		label.setAttribute('for', checkbox.id);
		label.textContent = lignee.nom;

		const sexe = document.createElement('span');
		sexe.className = 'lignee-sexe';
		sexe.textContent = `(${lignee.sexe})`;

		const optionLabel = document.createElement('span');
		optionLabel.className = 'option-label';
		optionLabel.appendChild(checkbox);
		optionLabel.appendChild(label);
		optionLabel.appendChild(sexe);

		option.appendChild(optionLabel);

		const desc = document.createElement('div');
		desc.className = 'desc';

		const shortDesc = document.createElement('span');
		shortDesc.className = 'short';
		shortDesc.textContent = lignee.summary;

		const longDesc = document.createElement('span');
		longDesc.className = 'long';
		longDesc.style.display = 'none';
		longDesc.textContent = lignee.description;

		const ul = document.createElement('ul');
		const liEnv = document.createElement('li');
		liEnv.textContent = `Environnement préféré : ${lignee.environnement}`;
		const liVie = document.createElement('li');
		liVie.textContent = `Mode de vie favori : ${lignee.modeDeVie}`;
		const liPerso = document.createElement('li');
		liPerso.textContent = `Personnalité majoritaire : ${lignee.personnalite}`;
		const liNoms = document.createElement('li');
		liNoms.textContent = `Exemples de noms ${lignee.exemplesNoms}`;

		ul.appendChild(liEnv);
		ul.appendChild(liVie);
		ul.appendChild(liPerso);
		ul.appendChild(liNoms);
		longDesc.appendChild(ul);

		const hr = document.createElement('hr');
		hr.className = 'don-separateur';

		const donSpan = document.createElement('span');
		donSpan.className = 'don';
		donSpan.textContent = `Don : ${dons[lignee.don]?.nom} (${dons[lignee.don]?.categorie})`;

		desc.appendChild(shortDesc);
		desc.appendChild(longDesc);
		desc.appendChild(hr);
		desc.appendChild(donSpan);
		option.appendChild(desc);

		option.appendChild(button);

		lignéesList.appendChild(option);
	});
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

window.addEventListener('DOMContentLoaded', function() {

	fillFicheFromData(competences, 'printemps', 'competence');
	fillFicheFromData(dons, 'ete', 'don');
	fillFicheFromData(equipements, 'automne', 'equipement');
	fillFicheFromData(morphologies, 'hiver', 'morphologie');

	document.querySelectorAll('.fiche-bloc-item').forEach(div => { div.style.display = 'none'; });
	personnage.subscribe(renderPersonnage);

	fillAmeliorationsCompetencesList();
	fillAmeliorationsDonsList();
	fillAmeliorationsEquipementsList();
	fillAmeliorationsMorphologiesList();

	initLignees();
	updateViewModeUi();
	initBindings();
	initStateFromHash();
	syncPersonnageFromDom();
	bindSortDialog();
	bindResponsiveCollapsibleSection();
});
