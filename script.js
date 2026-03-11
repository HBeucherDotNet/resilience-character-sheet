function toggleDesc(btn) {
	// Cherche le sibling .desc dans le parent
	let desc = null;
	const parent = btn.parentElement;
	if (parent) {
		desc = parent.querySelector('.desc');
	}
	if (!desc) return;
	const short = desc.querySelector('.short');
	const long = desc.querySelector('.long');

	// Détecte la saison de l'option
	let saison = '';
	const option = btn.closest('.option');
	if (option) {
		if (option.classList.contains('hiver')) saison = 'hiver';
		else if (option.classList.contains('printemps')) saison = 'printemps';
		else if (option.classList.contains('ete')) saison = 'ete';
		else if (option.classList.contains('automne')) saison = 'automne';
		else if (option.classList.contains('temps')) saison = 'temps';
	}

	// Couleurs par saison
	const couleurs = {
		hiver: '#235a8a',
		printemps: '#2c7a4b',
		ete: '#bfa600',
		automne: '#a13a3a',
		temps: '#3a7ad2'
	};
	const couleur = couleurs[saison] || '#235a8a';

	// Pour le bouton pictogramme
	if (btn.classList.contains('pictogram-btn')) {
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
		return;
	}

	// Pour les autres boutons
	if (long.style.display === 'none') {
		long.style.display = 'inline';
		btn.textContent = 'Lire moins';
	} else {
		long.style.display = 'none';
		btn.textContent = 'Lire plus';
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

function genererFiche() {
	// Remplit dynamiquement la fiche de personnage
	const saison = document.querySelector('input[name="saison"]:checked');
	const famille = document.querySelector('input[name="famille"]:checked');
	const lignee = document.querySelector('input[name="lignee"]:checked');

	document.getElementById('fiche-saison').textContent = saison ? saison.closest('.option').querySelector('label').textContent.trim() : '';
	document.getElementById('fiche-famille').textContent = famille ? famille.closest('.option').querySelector('label').textContent.trim() : '';
	document.getElementById('fiche-lignee').textContent = lignee ? lignee.closest('.option').querySelector('label').textContent.trim() : '';
}

// Mise à jour automatique de la fiche
window.addEventListener('DOMContentLoaded', function() {
	   ['saison', 'famille', 'lignee'].forEach(group => {
		   document.querySelectorAll('input[name="' + group + '"]').forEach(input => {
			   input.addEventListener('change', genererFiche);
		   });
	   });
	   genererFiche(); // Initialiser la fiche au chargement
	});
