import { sorts } from './data/sorts.js';
import { includeHtmlPartials } from './lib/includeHtml.js';
import { bindHeaderMenu } from './lib/headerMenu.js';

const SAISON_LABELS = {
	hiver: { label: 'Magie de l\'Hiver', emoji: '❄️' },
	printemps: { label: 'Magie du Printemps', emoji: '🌱' },
	ete: { label: 'Magie de l\'Été', emoji: '☀️' },
	automne: { label: 'Magie de l\'Automne', emoji: '🍁' },
	temps: { label: 'Magie du Temps', emoji: '⏳' }
};

const SPHERE_LABELS = {
	eau: 'l\'Eau',
	chair: 'la Chair',
	vie: 'la Vie',
	air: 'l\'Air',
	sens: 'les Sens',
	savoir: 'le Savoir',
	feu: 'le Feu',
	alchimie: 'l\'Alchimie',
	passion: 'la Passion',
	terre: 'la Terre',
	force: 'la Force',
	technique: 'la Technique',
	present: 'le Présent',
	passe: 'le Passé',
	futur: 'le Futur'
};

const TALENT_ORDER = ['connaitre', 'alterer', 'invoquer', 'modeler'];

const TALENT_LABELS = {
	alterer: 'Altérer',
	connaitre: 'Connaître',
	invoquer: 'Invoquer',
	modeler: 'Modeler'
};

function createTalentCard(saisonKey, sphereKey, talentKey, effects) {
	const card = document.createElement('article');
	card.className = `magie-talent-card ${saisonKey}`;

	const talentLabel = TALENT_LABELS[talentKey] ?? talentKey;
	const sphereLabel = SPHERE_LABELS[sphereKey] ?? sphereKey;

	const title = document.createElement('h4');
	title.className = 'magie-talent-name';

	const radio = document.createElement('input');
	radio.type = 'radio';
	radio.name = `connait-${sphereKey}-${talentKey}`;
	title.appendChild(radio);
	title.appendChild(document.createTextNode(`${talentLabel} ${sphereLabel}`));
	card.appendChild(title);

	let radioWasChecked = false;
	card.addEventListener('mousedown', () => {
		radioWasChecked = radio.checked;
	});
	card.addEventListener('click', event => {
		if (radioWasChecked) {
			radio.checked = false;
		} else if (event.target !== radio) {
			radio.checked = true;
		}
	});

	const list = document.createElement('ul');
	list.className = 'magie-talent-effets';
	effects.forEach(effect => {
		const item = document.createElement('li');
		item.innerHTML = effect;
		list.appendChild(item);
	});
	card.appendChild(list);

	return card;
}

function createSaisonSection(saisonKey, spheresParSaison) {
	const section = document.createElement('section');
	section.className = `magie-saison ${saisonKey}`;

	const title = document.createElement('h2');
	title.className = 'magie-saison-title';
	const { label, emoji } = SAISON_LABELS[saisonKey] ?? { label: saisonKey, emoji: '' };
	title.textContent = emoji ? `${label} ${emoji}` : label;
	section.appendChild(title);

	const flow = document.createElement('div');
	flow.className = 'magie-talents-flow';
	Object.entries(spheresParSaison).forEach(([sphereKey, talents]) => {
		TALENT_ORDER.forEach(talentKey => {
			const effects = talents[talentKey];
			if (!Array.isArray(effects) || effects.length === 0) return;
			flow.appendChild(createTalentCard(saisonKey, sphereKey, talentKey, effects));
		});
	});
	section.appendChild(flow);

	return section;
}

function render() {
	const container = document.getElementById('magie-content');
	if (!container) return;

	Object.entries(sorts).forEach(([saisonKey, spheresParSaison]) => {
		container.appendChild(createSaisonSection(saisonKey, spheresParSaison));
	});
}

function bindSaisonFilter() {
	const filterButtons = Array.from(document.querySelectorAll('.magie-saison-filter-btn'));
	const saisonSections = Array.from(document.querySelectorAll('.magie-saison'));

	function applyFilter(selectedSaison) {
		saisonSections.forEach(section => {
			section.hidden = Boolean(selectedSaison) && !section.classList.contains(selectedSaison);
		});
		filterButtons.forEach(button => {
			const isSelected = button.dataset.saison === selectedSaison;
			button.classList.toggle('selected', isSelected);
			button.setAttribute('aria-pressed', String(isSelected));
		});
	}

	filterButtons.forEach(button => {
		button.addEventListener('click', () => {
			const alreadySelected = button.classList.contains('selected');
			applyFilter(alreadySelected ? null : button.dataset.saison);
		});
	});
}

document.getElementById('magie-print-btn')?.addEventListener('click', () => {
	window.print();
});

await includeHtmlPartials();

render();
bindSaisonFilter();
bindHeaderMenu('.desktop-header-menu');
