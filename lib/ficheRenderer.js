export function createQuestionMarkSvg(color) {
	return `
		<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="11" cy="11" r="10" stroke="${color}" stroke-width="2" fill="#fff"/>
			<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="${color}">?</text>
		</svg>
	`;
}

export function normalizePlaceholderToken(token) {
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

function renderSelectionList(containerSelector, dataKey, selectedKeys) {
	document.querySelectorAll(`${containerSelector} .fiche-bloc-item`).forEach(div => {
		div.style.display = 'none';
	});

	selectedKeys.forEach(itemKey => {
		const item = document.querySelector(`${containerSelector} .fiche-bloc-item[data-${dataKey}="${itemKey}"]`);
		if (item) item.style.display = '';
	});
}

export function createFicheRenderer({ couleurs, champLexicalWordsBySaison = {}, getState, onStateRendered = () => {} }) {
	function renderChampLexical(state) {
		const container = document.getElementById('fiche-champ-lexical');
		if (!container) return;

		const seasonKey = state?.saison?.value ?? '';
		const words = Array.isArray(champLexicalWordsBySaison[seasonKey]) ? champLexicalWordsBySaison[seasonKey] : [];
		container.replaceChildren();

		if (words.length === 0) return;

		const list = document.createElement('div');
		list.className = 'champ-lexical';
		list.style.display = window.location.pathname.includes('/m/') ? 'grid' : 'flex';

		words.forEach(word => {
			const item = document.createElement('div');
			item.textContent = word;
			list.appendChild(item);
		});

		container.appendChild(list);
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

			const initialSummary = replaceSummaryPlaceholders(desc.dataset.summaryTemplate, getState?.());
			desc.textContent = initialSummary;

			itemDiv.appendChild(input);
			itemDiv.appendChild(label);
			itemDiv.appendChild(button);
			itemDiv.appendChild(desc);
			fragment.appendChild(itemDiv);
		});

		container.appendChild(fragment);
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
		renderChampLexical(state);
		renderSelectionList('#fiche-competences', 'competence', state.competencesSelectionnees);
		renderSelectionList('#fiche-equipements', 'equipement', state.equipementsSelectionnes);
		renderSelectionList('#fiche-dons', 'don', state.donsSelectionnes);
		renderSelectionList('#fiche-morphologies', 'morphologie', state.morphologiesSelectionnees);
		onStateRendered(state);
	}

	return {
		fillFicheFromData,
		renderPersonnage
	};
}