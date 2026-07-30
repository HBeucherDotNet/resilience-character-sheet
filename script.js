import { Personnage, getSaisonScore } from './personnage.js';
import { bindViewModeActions, updateViewModeUi } from './viewMode.js';
import { createFicheRenderer, createQuestionMarkSvg, normalizePlaceholderToken } from './lib/ficheRenderer.js';
import { createHashStateSync } from './lib/hashState.js';
import { createOptionCard, renderOptionGroup } from './lib/optionCard.js';
import { createSortDialogController } from './lib/sortDialog.js';
import { ligneeOptionConfigs } from './data/ligneeSections.js';
import { competences } from './data/competences.js';
import { dons } from './data/dons.js';
import { equipements } from './data/equipements.js';
import { morphologies } from './data/morphologies.js';
import { ameliorationSectionConfigs } from './data/ameliorationSections.js';
import { champLexicalWordsBySaison } from './data/champLexical.js';
import { morphologyGroupConfig, optionSectionConfigs } from './data/optionSections.js';
import { spheres as sorts } from './data/sorts.js';

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

// Suffixe du champ d'état associé au stat propre à chaque Saison (la Voix du Temps utilise le Souffle, pas un champ "Temps").
const saisonSuffix = {
	hiver: 'Hiver',
	printemps: 'Printemps',
	ete: 'Ete',
	automne: 'Automne',
	temps: 'Souffle'
};

const saisonScoreModKey = Object.fromEntries(
	Object.entries(saisonSuffix).map(([saisonValue, suffix]) => [saisonValue, `scoreMod${suffix}`])
);

// Inverse de `symbols` (saison -> emoji), pour retrouver la saison d'une relation depuis le pictogramme de son nom.
const saisonBySymbol = Object.fromEntries(
	Object.entries(symbols).map(([saisonValue, emoji]) => [emoji, saisonValue])
);

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
	const suffix = saisonSuffix[saisonValue];
	const score = Number.parseInt(String(state?.[`fiche${suffix}`] ?? '0'), 10);
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
		item.innerHTML = text;
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
			row.classList.remove('hidden');
			const cells = Array.from(row.querySelectorAll('td'));
			cells.forEach(cell => {
				cell.classList.remove('hidden');
			});

			if (!isReadOnlyView) return;

			const domainInput = row.querySelector('td:first-child input[type="checkbox"]:not(.talent)');
			const domainKey = normalizePlaceholderToken(domainInput?.id ?? '');

			if (!domainInput?.checked || !sorts[domainKey]) {
				row.classList.add('hidden');
			}

			let hasVisibleTalent = false;
			cells.slice(1).forEach(cell => {
				const talentInput = cell.querySelector('input.talent');

				ensureDesktopMagicTalentLabel(talentInput);
				const talentKey = resolveMagicTalentKey(talentInput);
				const descriptions = Array.isArray(sorts[domainKey]?.[talentKey]) ? sorts[domainKey][talentKey] : [];
				if (descriptions.length === 0) {
					cell.classList.add('hidden');
					return;
				}

				hasVisibleTalent = true;
			});

			if (!hasVisibleTalent) {
				row.classList.add('hidden');
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

// Les `freeCount` premiers ajouts au-delà de la sélection de base sont gratuits, puis le n-ième coûte n.
function getAmeliorationAjouteeCost(count, freeCount = 1) {
	if (count <= freeCount) return 0;
	return (count * (count + 1)) / 2 - (freeCount * (freeCount + 1)) / 2;
}

// Les points au-delà de la base coûtent 2*(base+k) au k-ième point supplémentaire, soit m² + m*(2*base+1) au total.
function getScoreExtraCostFromBase(baseScore, extraPoints) {
	const m = Math.max(0, extraPoints);
	return m * m + m * (2 * baseScore + 1);
}

// Les points au-delà du seuil gratuit (déjà couvert par le score de base 3) coûtent 8, 10, 12, 14... Harmonie.
function getScoreExtraCost(mod) {
	const extra = Math.max(0, Number.parseInt(String(mod ?? '0'), 10) || 0);
	return getScoreExtraCostFromBase(3, extra);
}

function getSaisonFromPictogram(text) {
	const entry = Object.entries(saisonBySymbol).find(([emoji]) => text.includes(emoji));
	return entry?.[1] ?? null;
}

// Les lignes de la table Résonances : nom (avec pictogramme de Saison) + niveau atteint.
function getResonanceRows() {
	return Array.from(document.querySelectorAll('input[id^="resonance-"]'))
		.filter(input => /^resonance-\d+$/.test(input.id))
		.map(nameInput => {
			const suffix = nameInput.id.replace('resonance-', '');
			const niveauInput = document.getElementById(`resonance-niv-${suffix}`);
			return {
				name: nameInput.value.trim(),
				niveau: Number.parseInt(niveauInput?.value ?? '', 10)
			};
		})
		.filter(row => row.name && Number.isFinite(row.niveau));
}

// La Voix du Temps améliore le Souffle des autres (base 3 pour une autre Voix du Temps, 2 sinon) au lieu d'une Saison.
function getRelationTargetBaseScore(otherSaisonValue, maSaisonValue) {
	if (maSaisonValue === 'temps') {
		return otherSaisonValue === 'temps' ? 3 : 2;
	}
	return getSaisonScore({ value: otherSaisonValue }, maSaisonValue);
}

// Améliorer la Saison (ou le Souffle, pour la Voix du Temps) de quelqu'un d'autre renforce la relation avec cette personne.
// Le coût de chaque augmentation dépend du score de base de la cible (déduit du pictogramme de son nom).
function getRelationsHarmonieDetails(maSaisonValue) {
	return getResonanceRows()
		.map(row => {
			const otherSaisonValue = getSaisonFromPictogram(row.name);
			if (!otherSaisonValue) return null;

			const base = getRelationTargetBaseScore(otherSaisonValue, maSaisonValue);
			const extra = row.niveau - base;
			if (extra <= 0) return null;

			return {
				name: row.name,
				base,
				niveau: row.niveau,
				extra,
				cost: getScoreExtraCostFromBase(base, extra)
			};
		})
		.filter(Boolean);
}

// Le niveau de chaque sphère est défini dans data/sorts.js.
function getSphereLevels() {
	return Object.fromEntries(
		Object.entries(sorts).map(([sphereId, sphere]) => [sphereId, sphere.niveau ?? 1])
	);
}

// Dans une sphère, le 1er talent appris coûte le niveau de la sphère, le 2e niveau+1, le 3e niveau+2, etc.
function getMagieTalentsHarmonieDetails() {
	const sphereLevels = getSphereLevels();
	const countsBySphere = {};
	document.querySelectorAll('#fiche-magie input.talent:checked').forEach(checkbox => {
		const [sphereId] = checkbox.id.split('-');
		countsBySphere[sphereId] = (countsBySphere[sphereId] || 0) + 1;
	});

	return Object.entries(countsBySphere).map(([sphereId, count]) => {
		const level = sphereLevels[sphereId] ?? 1;
		const cost = count * level + (count * (count - 1)) / 2;
		return { sphereId, count, level, cost };
	});
}

function computeHarmonieBreakdown() {
	const state = personnage.state;
	const items = [];

	const harmonieActuelle = Math.max(0, Number.parseInt(document.getElementById('fiche-harmonie')?.value ?? '0', 10) || 0);
	items.push({
		label: 'Harmonie actuelle',
		cost: harmonieActuelle
	});

	[
		{ key: 'competencesAjoutees', label: 'Compétences apprises', freeCount: 2, dataMap: competences, surchargeCategorie: 'role', surchargeLabel: 'Rôle' },
		{ key: 'donsAjoutes', label: 'Dons acquis', freeCount: 2, dataMap: dons, surchargeCategorie: 'Famille', surchargeLabel: 'Famille' },
		{ key: 'equipementsAjoutes', label: 'Équipements maîtrisés', freeCount: 1 },
		{ key: 'morphologiesAjoutees', label: 'Morphologies acquises', freeCount: 1 }
	].forEach(({ key, label, freeCount, dataMap, surchargeCategorie, surchargeLabel }) => {
		const addedKeys = state[key] ?? [];
		const count = addedKeys.length;
		// La 1ère compétence de Rôle / le 1er don de Famille est offert automatiquement, seuls les suivants surchargent.
		const surchargeCount = dataMap
			? Math.max(0, addedKeys.filter(itemKey => dataMap[itemKey]?.categorie === surchargeCategorie).length - 1)
			: 0;

		let detail = count > 0 ? `${count} ajouté${count > 1 ? 's' : ''}` : 'aucun';
		if (surchargeCount > 0) {
			detail += ` (dont ${surchargeCount} suppl. de ${surchargeLabel} : +${surchargeCount})`;
		}

		items.push({
			label,
			detail,
			cost: getAmeliorationAjouteeCost(count, freeCount) + surchargeCount
		});
	});

	const maSaisonValue = state.saison?.value ?? '';
	const saisonScoreModKey = saisonScoreModKey[maSaisonValue];
	if (saisonScoreModKey) {
		const mod = Math.max(0, state[saisonScoreModKey] ?? 0);
		items.push({
			label: `Score de la Saison (${maSaisonValue})`,
			detail: `+${mod} point${mod > 1 ? 's' : ''}`,
			cost: getScoreExtraCost(mod)
		});
	}

	// Relations : une Voix classique améliore la Saison d'un autre personnage, la Voix du Temps améliore son Souffle.
	if (saisonScoreModKey) {
		const relationsDetails = getRelationsHarmonieDetails(maSaisonValue);
		if (relationsDetails.length > 0) {
			items.push({
				label: 'Relations améliorées',
				detail: `${relationsDetails.length} relation(s)`,
				cost: relationsDetails.reduce((total, d) => total + d.cost, 0),
				subitems: relationsDetails.map(d =>
					`${d.name} : base ${d.base} → niveau ${d.niveau} — ${d.cost} Harmonie`
				)
			});
		}
	}

	const magieDetails = getMagieTalentsHarmonieDetails();
	if (magieDetails.length > 0) {
		const rawMagieCost = magieDetails.reduce((total, d) => total + d.cost, 0);
		// Les 2 premiers talents magiques sont offerts, soit -3 Harmonie sur le coût total des talents.
		const talentsOffertsDiscount = Math.min(3, rawMagieCost);
		const subitems = magieDetails.map(({ sphereId, count, level, cost }) =>
			`${sphereId} (niv. ${level}) : ${count} talent${count > 1 ? 's' : ''} — ${cost} Harmonie`
		);
		if (talentsOffertsDiscount > 0) {
			subitems.push(`Talents offerts (2 premiers) — -${talentsOffertsDiscount} Harmonie`);
		}

		items.push({
			label: 'Talents magiques',
			detail: `${magieDetails.reduce((total, d) => total + d.count, 0)} talent(s)`,
			cost: rawMagieCost - talentsOffertsDiscount,
			subitems
		});
	}

	const total = items.reduce((sum, item) => sum + item.cost, 0);
	return { items, total };
}

function renderHarmonieDialog() {
	const list = document.getElementById('harmonie-dialog-list');
	const totalEl = document.getElementById('harmonie-dialog-total');
	if (!list || !totalEl) return;

	const { items, total } = computeHarmonieBreakdown();

	list.innerHTML = '';
	items.forEach(item => {
		const li = document.createElement('li');
		li.className = 'harmonie-dialog-item';

		const label = document.createElement('div');

		label.innerHTML = `${item.label}`;

		if (item.detail) {
			label.innerHTML += `<br><span class="desc">${item.detail}</span>`;
		}
		
		if (item.subitems?.length) {
			const subList = document.createElement('ul');
			subList.className = 'harmonie-dialog-subitems';
			item.subitems.forEach(text => {
				const subLi = document.createElement('li');
				subLi.textContent = text;
				subList.appendChild(subLi);
			});
			label.appendChild(subList);
		}

		const cost = document.createElement('span');
		cost.className = 'harmonie-dialog-item-cost';
		cost.textContent = String(item.cost);

		li.appendChild(label);
		li.appendChild(cost);
		list.appendChild(li);
	});

	totalEl.textContent = String(total);
}

function bindHarmonieDialog() {
	const dialog = document.getElementById('harmonie-dialog');
	const trigger = document.getElementById('fiche-harmonie-label');
	if (!dialog || !trigger) return;

	trigger.addEventListener('click', () => {
		renderHarmonieDialog();
		if (typeof dialog.showModal === 'function') {
			dialog.showModal();
		} else {
			dialog.setAttribute('open', 'open');
		}
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

function randomChoice(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function selectRandomInGroup(name) {
	const inputs = Array.from(document.querySelectorAll(`input[name="${name}"]`))
		.filter(input => !input.disabled);
	if (inputs.length === 0) return;
	inputs.forEach(cb => { cb.checked = false; });
	const chosen = randomChoice(inputs);
	chosen.checked = true;
	chosen.dispatchEvent(new Event('change', { bubbles: true }));
}

function genererPersonnageAleatoire() {
	// Famille avant lignée : updateLignees() est déclenché par le change famille
	selectRandomInGroup('saison');
	selectRandomInGroup('famille');

	const visibleLigneeInputs = Array.from(document.querySelectorAll('input[name="lignee"]'))
		.filter(input => {
			const option = input.closest('.option');
			return option && option.style.display !== 'none' && !input.disabled;
		});
	if (visibleLigneeInputs.length > 0) {
		document.querySelectorAll('input[name="lignee"]').forEach(cb => { cb.checked = false; });
		const chosen = randomChoice(visibleLigneeInputs);
		chosen.checked = true;
		chosen.dispatchEvent(new Event('change', { bubbles: true }));
	}

	['armement', 'cuirasse', 'mains', 'peau'].forEach(selectRandomInGroup);
	['environnement', 'mode-de-vie', 'philosophie', 'relation-rupture', 'role', 'age', 'personnalite']
		.forEach(selectRandomInGroup);

	syncPersonnageFromDom();
}

function initBindings() {
	bindViewModeActions();

	const launchSortButton = document.getElementById('launch-sort-btn');
	launchSortButton?.addEventListener('click', () => {
		if (launchSortButton.disabled) return;
		sortDialogController.openSortDialog();
	});

	document.getElementById('random-personnage-btn')?.addEventListener('click', () => {
		genererPersonnageAleatoire();
		document.querySelector('.desktop-header-menu')?.removeAttribute('open');
		document.querySelector('.mobile-header-menu')?.removeAttribute('open');
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
	bindHarmonieDialog();

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
