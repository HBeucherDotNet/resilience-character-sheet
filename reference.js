import { competences } from './data/competences.js';
import { morphologies } from './data/morphologies.js';
import { equipements } from './data/equipements.js';
import { dons } from './data/dons.js';
import { includeHtmlPartials } from './lib/includeHtml.js';
import { bindHeaderMenu } from './lib/headerMenu.js';

const SAISON_ORDER = ['hiver', 'printemps', 'ete', 'automne', 'temps', 'appel', null];

const SECTION_CONFIGS = [
	{
		id: 'section-competences',
		data: competences,
		groupKey: 'categorie',
		groups: [
			{ key: 'role', label: 'Rôle', hint: '+1 Harmonie' },
			{ key: 'commune', label: 'Communes' },
			{ key: 'animale', label: 'Animale' },
			{ key: 'végétale', label: 'Végétale' },
			{ key: 'flamme', label: 'Flamme' },
			{ key: 'techné', label: 'Techné' },
		]
	},
	{
		id: 'section-morphologies',
		data: morphologies,
		groupKey: 'categorie',
		groups: [
			{ key: 'armement', label: 'Armements' },
			{ key: 'cuirasse', label: 'Cuirasses' },
			{ key: 'mains', label: 'Mains' },
			{ key: 'peau', label: 'Peau' },
			{ key: 'toxine', label: 'Toxines', hint: '+1 Harmonie - 4 doses' },
		]
	},
	{
		id: 'section-equipements',
		data: equipements,
		groupKey: 'categorie',
		groups: [
			{ key: 'arme', label: 'Armes' },
			{ key: 'armure', label: 'Armures' },
			{ key: 'outil', label: 'Outils' },
			{ key: 'vetement', label: 'Vêtements' },
			{ key: 'drogue', label: 'Drogues', hint: '+1 Harmonie - 4 doses' },
		]
	},
	{
		id: 'section-dons',
		data: dons,
		groupKey: 'categorie',
		groups: [
			{ key: 'Famille', label: 'Famille', hint: '+1 Harmonie' },
			{ key: 'Commun', label: 'Communs' },
			{ key: 'Mobilité', label: 'Mobilité' },
			{ key: 'Perception', label: 'Perception' },
			{ key: 'Communication', label: 'Communication' },
			{ key: 'Sécrétion', label: 'Sécrétion' },
		]
	}
];

function sortBySaison(items) {
	return [...items].sort((a, b) => {
		const ia = SAISON_ORDER.indexOf(a.saison);
		const ib = SAISON_ORDER.indexOf(b.saison);
		return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
	});
}

function createCard(item) {
	const saison = item.saison ?? 'appel';
	const card = document.createElement('article');
	card.className = `ref-card ${saison}`;

	const name = document.createElement('span');
	name.className = 'ref-card-name';
	name.textContent = item.nom;

	const desc = document.createElement('span');
	desc.className = 'ref-card-desc';
	desc.innerHTML = item.description || '';

	card.appendChild(name);
	card.appendChild(desc);
	return card;
}

function renderSection(config) {
	const container = document.getElementById(config.id);

	const grouped = {};
	for (const [id, item] of Object.entries(config.data)) {
		const k = item[config.groupKey] ?? 'autre';
		if (!grouped[k]) grouped[k] = [];
		grouped[k].push({ id, ...item });
	}

	for (const { key, label, hint } of config.groups) {
		const items = grouped[key];
		if (!items || items.length === 0) continue;

		const group = document.createElement('div');
		group.className = 'ref-group';

		const title = document.createElement('h3');
		title.className = 'ref-group-title';
		title.textContent = label;
		if (hint) {
			const hintEl = document.createElement('span');
			hintEl.className = 'ref-group-hint';
			hintEl.textContent = `(${hint})`;
			title.appendChild(hintEl);
		}
		group.appendChild(title);

		const grid = document.createElement('div');
		grid.className = 'ref-grid';
		for (const item of sortBySaison(items)) {
			grid.appendChild(createCard(item));
		}
		group.appendChild(grid);
		container.appendChild(group);
	}
}

// Onglets
document.querySelectorAll('.ref-tab').forEach(tab => {
	tab.addEventListener('click', () => {
		document.querySelectorAll('.ref-tab').forEach(t => {
			t.classList.remove('active');
			t.setAttribute('aria-selected', 'false');
		});
		document.querySelectorAll('.ref-section').forEach(s => {
			s.hidden = true;
		});
		tab.classList.add('active');
		tab.setAttribute('aria-selected', 'true');
		document.getElementById('section-' + tab.dataset.section).hidden = false;
	});
});

// Rendu
SECTION_CONFIGS.forEach(config => renderSection(config));

// La première section est visible, les autres masquées
document.querySelectorAll('.ref-section').forEach((s, i) => {
	s.hidden = i !== 0;
});

await includeHtmlPartials();
bindHeaderMenu('.desktop-header-menu');
