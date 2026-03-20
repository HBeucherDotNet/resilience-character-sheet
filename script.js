const saisonsEnum = {
	hiver: 1,
	printemps: 2,
	ete: 3,
	automne: 4
};

// Génération et restauration de l'état via hash
function getCheckedInputs() {
	const checked = [];
	document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
		if (input.checked && input.id) checked.push(input.id);
	});
	return checked;
}

function getChoiceInputs() {
	return Array.from(document.querySelectorAll('input[type="checkbox"], input[type="radio"]')).filter(input => input.id);
}

function getTextStateFields() {
	return Array.from(document.querySelectorAll('input[type="text"], textarea')).filter(field => field.id);
}

function getTextStateValues() {
	const values = {};
	getTextStateFields().forEach(field => {
		if (field.value !== '') {
			values[field.id] = field.value;
		}
	});
	return values;
}

function encodeUnicodeToBase64Url(value) {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	bytes.forEach(byte => {
		binary += String.fromCharCode(byte);
	});
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64UrlToUnicode(value) {
	const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

function encodeCheckedIds(ids) {
	const checkedSet = new Set(ids);
	const allInputs = getChoiceInputs();
	let bitset = 0n;
	allInputs.forEach((input, index) => {
		if (checkedSet.has(input.id)) {
			bitset |= 1n << BigInt(index);
		}
	});
	
	const textStateJson = JSON.stringify(getTextStateValues());
	const textStateEncoded = encodeUnicodeToBase64Url(textStateJson);
	return `v1.${bitset.toString(36)}.${textStateEncoded}`;
}

function base36ToBigInt(value) {
	let result = 0n;
	for (const char of value.toLowerCase()) {
		const digit = parseInt(char, 36);
		if (Number.isNaN(digit) || digit < 0 || digit > 35) {
			throw new Error('Invalid base36 value');
		}
		result = result * 36n + BigInt(digit);
	}
	return result;
}

function decodeCheckedIds(hash) {
	if (!hash) return [];
	if (!hash.startsWith('v1.')) return [];
	const parts = hash.split('.');
	if (parts.length !== 3) return [];
	
	const bitsetPayload = parts[1];
	let bitset;
	try {
		bitset = base36ToBigInt(bitsetPayload);
	} catch {
		return [];
	}
	
	const allInputs = getChoiceInputs();
	const ids = [];
	allInputs.forEach((input, index) => {
		if (((bitset >> BigInt(index)) & 1n) === 1n) {
			ids.push(input.id);
		}
	});
	
	return ids;
}

function decodeTextStateValues(hash) {
	if (!hash || !hash.startsWith('v1.')) return {};
	const parts = hash.split('.');
	if (parts.length !== 3) return {};
	
	const textPayload = parts[2];
	if (!textPayload) return {};
	
	try {
		const json = decodeBase64UrlToUnicode(textPayload);
		const values = JSON.parse(json);
		if (!values || typeof values !== 'object' || Array.isArray(values)) return {};
		return values;
	} catch {
		return {};
	}
}

function setCheckedInputs(ids) {
	const selectedIds = new Set(ids);
	document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
		input.checked = false;
	});
	
	document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
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

function updateHashFromState() {
	const checked = getCheckedInputs();
	const encoded = encodeCheckedIds(checked);
	const newUrl = `${window.location.pathname}${window.location.search}#${encoded}`;
	history.replaceState(null, '', newUrl);
}

function bindAutoHashSync() {
	document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
		input.addEventListener('change', updateHashFromState);
	});
	
	let textSyncTimer;
	document.querySelectorAll('input[type="text"], textarea').forEach(field => {
		field.addEventListener('input', () => {
			clearTimeout(textSyncTimer);
			textSyncTimer = setTimeout(updateHashFromState, 1000);
		});
		field.addEventListener('change', updateHashFromState);
	});
}

function restoreStateFromHash() {
	const hash = window.location.hash.replace(/^#/, '');
	if (!hash) return;
	const ids = decodeCheckedIds(hash);
	const textValues = decodeTextStateValues(hash);
	setCheckedInputs(ids);
	setTextStateValues(textValues);
}

// Permet de restaurer l'état si le hash change (navigation ou collage)
window.addEventListener('hashchange', restoreStateFromHash);

// Couleurs par saison
const couleurs = {
	hiver: '#235a8a',
	printemps: '#2c7a4b',
	ete: '#bfa600',
	automne: '#a13a3a',
	temps: '#3a7ad2'
};

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
	
	const couleur = couleurs[saison] || '#235a8a';
	
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

window.selectUnique = function(group, el) {
	const checkboxes = document.querySelectorAll('input[name="' + group + '"]');
	checkboxes.forEach(cb => {
		if (cb !== el) cb.checked = false;
		const option = cb.closest('.option');
		if (option) option.classList.remove('selected-option');
	});
	const selectedOption = el.closest('.option');
	if (selectedOption && el.checked) selectedOption.classList.add('selected-option');
}

window.updateLignees = function() {
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

window.genererFiche = function() {
	// Remplit dynamiquement la fiche de personnage
	const saison = document.querySelector('input[name="saison"]:checked');
	const famille = document.querySelector('input[name="famille"]:checked');
	const lignee = document.querySelector('input[name="lignee"]:checked');
	const role = document.querySelector('input[name="role"]:checked');
	
	document.getElementById('fiche-saison').textContent = saison ? saison.closest('.option').querySelector('label').textContent.trim() : '';
	document.getElementById('fiche-essence').textContent = saison ? saison.closest('.option').querySelector('.label-essence').textContent.trim() : '';
	document.getElementById('fiche-anatheme').textContent = saison ? saison.closest('.option').querySelector('.label-anatheme').textContent.trim() : '';
	document.getElementById('fiche-famille').textContent = famille ? famille.closest('.option').querySelector('label').textContent.trim() : '';
	document.getElementById('fiche-lignee').textContent = lignee ? lignee.closest('.option').querySelector('label').textContent.trim() : '';
	document.getElementById('fiche-role').textContent = role ? role.closest('.option').querySelector('label').textContent.trim() : '';
	
	document.getElementById('fiche-hiver').textContent = getsaisonScore(saison, 'hiver');
	document.getElementById('fiche-printemps').textContent = getsaisonScore(saison, 'printemps');
	document.getElementById('fiche-ete').textContent = getsaisonScore(saison, 'ete');
	document.getElementById('fiche-automne').textContent = getsaisonScore(saison, 'automne');
	document.getElementById('fiche-souffle').textContent = saison && saison.value === 'temps' ? 3 : 2;
	document.getElementById('fiche-resilience').textContent = saison && saison.value === 'temps' ? 3 : 2;
	
	document.getElementById('fiche-essence-harmonie').className = saison ? saison.value : '';
	document.getElementById('fiche-champ-lexical').className = saison ? saison.value : '';
	document.getElementById('fiche-magie').className = saison ? saison.value : '';
}

window.addEventListener('DOMContentLoaded', function() {
	['saison', 'famille', 'lignee', 'environnement', 'mode-de-vie', 'philosophie', 'relation-rupture', 'role'].forEach(group => {
		document.querySelectorAll('input[name="' + group + '"]').forEach(input => {
			input.addEventListener('change', genererFiche);
		});
	});
	
	// Ajoute le comportement de sélection sur .option
	document.querySelectorAll('.option').forEach(option => {
		option.addEventListener('click', function(e) {
			// Si le clic est sur .lire-plus.pictogram-btn, ne coche pas la checkbox
			if (e.target.closest('.lire-plus.pictogram-btn, svg, input')) return;
			const checkbox = option.querySelector('input[type="checkbox"], input[type="radio"]');
			if (checkbox) {
				checkbox.checked = !checkbox.checked;
				selectUnique(checkbox.name, checkbox);
				checkbox.dispatchEvent(new Event('change', { bubbles: true }));
			}
		});
	});
	
	// Restaure l'état à l'ouverture si hash présent
	restoreStateFromHash();
	
	// Synchronise automatiquement le hash sans rechargement
	bindAutoHashSync();
	
	genererFiche(); // Initialiser la fiche au chargement
	updateLignees(); // Met à jour les lignées au chargement
	updateFicheAge(); // Met à jour l'âge au chargement
	updateFicheDons(); // Met à jour les dons au chargement
	updateFicheEquipements(); // Met à jour les équipements au chargement
	updateFicheCompetences(); // Met à jour les compétences au chargement
	updateFicheMorphologies(); // Met à jour les morphologies au chargement
});

function updateFicheAge() {
	const age = document.querySelector('input[name="age"]:checked');
	const ficheAge = document.getElementById('fiche-age');
	if (!age) {
		ficheAge.textContent = '';
		return;
	}
	ficheAge.textContent = age.closest('.option').querySelector('label').textContent.trim();
}

function updateFicheCompetences() {
	// Récupère la compétence liée au rôle sélectionné
	const role = document.querySelector('input[name="role"]:checked');
	let roleSelectionne = '';
	if (role && role.value) {
		roleSelectionne = role.value;
	}
	
	document.querySelectorAll('#fiche-competences .competence-recap').forEach(div => {
		div.style.display = 'none';
	});
	
	const competenceBlocs = document.querySelectorAll(`#fiche-competences .competence-recap[data-role="${roleSelectionne}"]`);
	competenceBlocs.forEach(competenceBloc => {
		if (competenceBloc) competenceBloc.style.display = '';
	});
}

function updateFicheEquipements() {
	// Récupère les morphologies sélectionnées
	const groups = ['environnement', 'mode-de-vie', 'philosophie', 'relation-rupture'];
	let equipementsSelectionnes = 
	groups
	.map(group => document.querySelector(`#${group}-group input:checked`))
	.filter(input => input && input.dataset.equipement)
	.map(input => input.dataset.equipement);
	
	// Supprime les doublons
	equipementsSelectionnes = [...new Set(equipementsSelectionnes)];
	
	// Masque tous les équipements
	document.querySelectorAll('#fiche-equipements .equipement-recap').forEach(div => {
		div.style.display = 'none';
	});
	
	// Affiche ceux sélectionnés
	equipementsSelectionnes.forEach(eqKey => {
		const div = document.querySelector(`#fiche-equipements .equipement-recap[data-equipement="${eqKey}"]`);
		if (div) div.style.display = '';
	});
}

function updateFicheDons() {
	// Récupère le don sélectionné (famille ou lignée)
	const famille = document.querySelector('input[name="famille"]:checked');
	const lignee = document.querySelector('input[name="lignee"]:checked');
	let donsSelectionnes = [];
	if (famille && famille.dataset.don) {
		donsSelectionnes.push(famille.dataset.don);
	}
	if (lignee && lignee.dataset.don) {
		donsSelectionnes.push(lignee.dataset.don);
	}
	
	// Masque tous les dons
	document.querySelectorAll('#fiche-dons .don-recap').forEach(div => {
		div.style.display = 'none';
	});
	
	// Affiche ceux sélectionnés
	donsSelectionnes.forEach(donKey => {
		const div = document.querySelector(`#fiche-dons .don-recap[data-don="${donKey}"]`);
		if (div) div.style.display = '';
	});
}

function updateFicheMorphologies() {
	// Récupère les morphologies sélectionnées
	const groups = ['armement', 'cuirasse', 'mains', 'peau'];
	let morphologiesSelectionnees = 
	groups
	.map(group => document.querySelector(`#${group}-group input:checked`))
	.filter(input => input && input.dataset.morphologie)
	.map(input => input.dataset.morphologie);
	
	// Supprime les doublons
	morphologiesSelectionnees = [...new Set(morphologiesSelectionnees)];
	
	// Masque toutes les morphologies
	document.querySelectorAll('#fiche-morphologies .morphologie-recap').forEach(div => {
		div.style.display = 'none';
	});
	
	// Affiche celles sélectionnées
	morphologiesSelectionnees.forEach(morphKey => {
		const div = document.querySelector(`#fiche-morphologies .morphologie-recap[data-morphologie="${morphKey}"]`);
		if (div) div.style.display = '';
	});
}

function getsaisonScore(saison, saisonName) {
	if (!saison) return '';
	switch (Math.abs(saisonsEnum[saison.value] - saisonsEnum[saisonName])) {
		case 0: return 3;
		case 1:
		case 3: return 2;
		case 2: return 1;
		default: return 2;
	}
}

// Ajoute les listeners pour afficher les dons
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

document.querySelectorAll(`.lire-plus.pictogram-btn`).forEach(div => {
	div.addEventListener('click', () => toggleDesc(div));
});
