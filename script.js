import { dons } from './dons.js';
import { equipements } from './equipements.js';
import { competences } from './competences.js';

const saisonsEnum = {
	hiver: 1,
	printemps: 2,
	ete: 3,
	automne: 4
};

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
}

window.addEventListener('DOMContentLoaded', function() {
	['saison', 'famille', 'lignee', 'environnement', 'mode-de-vie', 'philosophie', 'relation-rupture', 'role'].forEach(group => {
		document.querySelectorAll('input[name="' + group + '"]').forEach(input => {
			input.addEventListener('change', genererFiche);
		});
	});
	genererFiche(); // Initialiser la fiche au chargement
	updateLignees(); // Met à jour les lignées au chargement
	updateFicheDons(); // Met à jour les dons au chargement
	updateFicheEquipements(); // Met à jour les équipements au chargement
	updateFicheCompetences(); // Met à jour les compétences au chargement
});

function updateFicheCompetences() {
	// Récupère la compétence liée au rôle sélectionné
	const role = document.querySelector('input[name="role"]:checked');
	let competencesSelectionnees = [];
	if (role && role.dataset.competence && competences[role.dataset.competence]) {
		const compObj = competences[role.dataset.competence];
		competencesSelectionnees = Object.keys(compObj);
	}
	// Supprime les doublons
	competencesSelectionnees = [...new Set(competencesSelectionnees)];
	
	console.log(competencesSelectionnees);
	
	const ficheCompetences = document.getElementById('fiche-competences');
	ficheCompetences.innerHTML = '';
	competencesSelectionnees.forEach(compKey => {
		if (competences[role.dataset.competence][compKey]) {
			ficheCompetences.innerHTML += `
				<div class="competence-recap fiche-bloc-item">
					<input type="checkbox" id="competence-${compKey}" name="competence-selected" value="${compKey}">
					<label for="competence-${compKey}">${competences[role.dataset.competence][compKey].nom}</label>
					<button type="button" class="competence-picto" onclick="window.toggleCompetenceResume('${compKey}', this)" aria-label="Afficher le résumé" style="background:none;border:none;padding:0;cursor:pointer;">
						<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="11" cy="11" r="10" stroke="#2c7a4b" stroke-width="2" fill="#fff"/>
							<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#2c7a4b">?</text>
						</svg>
					</button>
					<span class="competence-resume" style="display:none;">${competences[role.dataset.competence][compKey].description}</span>
				</div>
			`;
		}
	});
}

window.toggleCompetenceResume = function(compKey, btn) {
	const resume = btn.parentElement.querySelector('.competence-resume');
	if (!resume) return;
	resume.style.display = resume.style.display === 'none' ? 'block' : 'none';
};
['role'].forEach(group => {
	document.querySelectorAll('input[name="' + group + '"]').forEach(input => {
		input.addEventListener('change', updateFicheCompetences);
	});
});
function updateFicheEquipements() {
	// Récupère les équipements sélectionnés (environnement, mode-de-vie, philosophie, relation-rupture)
	const env = document.querySelector('input[name="environnement"]:checked');
	const mode = document.querySelector('input[name="mode-de-vie"]:checked');
	const philo = document.querySelector('input[name="philosophie"]:checked');
	const rupture = document.querySelector('input[name="relation-rupture"]:checked');
	let equipementsSelectionnes = [];
	if (env && env.dataset.equipement) equipementsSelectionnes.push(env.dataset.equipement);
	if (mode && mode.dataset.equipement) equipementsSelectionnes.push(mode.dataset.equipement);
	if (philo && philo.dataset.equipement) equipementsSelectionnes.push(philo.dataset.equipement);
	if (rupture && rupture.dataset.equipement) equipementsSelectionnes.push(rupture.dataset.equipement);
	// Supprime les doublons
	equipementsSelectionnes = [...new Set(equipementsSelectionnes)];
	const ficheEquipements = document.getElementById('fiche-equipements');
	ficheEquipements.innerHTML = '';
	equipementsSelectionnes.forEach(eqKey => {
		if (equipements[eqKey]) {
			ficheEquipements.innerHTML += `
				<div class="equipement-recap fiche-bloc-item">
					<input type="checkbox" id="equipement-${eqKey}" name="equipement-selected" value="${eqKey}">
					<label for="equipement-${eqKey}">${equipements[eqKey].nom}</label>
					<button type="button" class="equipement-picto" onclick="window.toggleEquipementResume('${eqKey}', this)" aria-label="Afficher le résumé" style="background:none;border:none;padding:0;cursor:pointer;">
						<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="11" cy="11" r="10" stroke="#a13a3a" stroke-width="2" fill="#fff"/>
							<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#a13a3a">?</text>
						</svg>
					</button>
					<span class="equipement-resume" style="display:none;">${equipements[eqKey].description}</span>
				</div>
			`;
		}
	});
}

window.toggleEquipementResume = function(eqKey, btn) {
	const resume = btn.parentElement.querySelector('.equipement-resume');
	if (!resume) return;
	resume.style.display = resume.style.display === 'none' ? 'block' : 'none';
};

window.updateFicheDons = function() {
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
	
	console.log(donsSelectionnes);
	
	const ficheDons = document.getElementById('fiche-dons');
	ficheDons.innerHTML = '';
	donsSelectionnes.forEach(donKey => {
		if (dons[donKey]) {
			ficheDons.innerHTML += `
				<div class="don-recap fiche-bloc-item">
					<input type="checkbox" id="don-${donKey}" name="don-selected" value="${donKey}">
					<label for="don-${donKey}">${dons[donKey].nom}</label>
					<button type="button" class="don-picto" onclick="window.toggleDonResume('${donKey}', this)" aria-label="Afficher le résumé" style="background:none;border:none;padding:0;cursor:pointer;">
						<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="11" cy="11" r="10" stroke="#235a8a" stroke-width="2" fill="#fff"/>
							<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#235a8a">?</text>
						</svg>
					</button>
					<span class="don-resume" style="display:none;">${dons[donKey].description}</span>
				</div>
			`;
			// Affiche ou masque le résumé du don
			window.toggleDonResume = function(donKey, btn) {
				const resume = btn.parentElement.querySelector('.don-resume');
				if (!resume) return;
				resume.style.display = resume.style.display === 'none' ? 'block' : 'none';
			};
		}
	});
}

function getsaisonScore(saison, saisonName) {
	if (!saison) return '';
	switch (Math.abs(saisonsEnum[saison.value] - saisonsEnum[saisonName])) {
		case 0: return 3;
		case 1:
		case 3: return 2;
		case 2: return 1;
		default: return '';
	}
}

// Ajoute les listeners pour afficher les dons
['famille', 'lignee'].forEach(group => {
	document.querySelectorAll('input[name="' + group + '"]').forEach(input => {
		input.addEventListener('change', updateFicheDons);
	});
});
['environnement', 'mode-de-vie', 'philosophie', 'relation-rupture'].forEach(group => {
	document.querySelectorAll('input[name="' + group + '"]').forEach(input => {
		input.addEventListener('change', updateFicheEquipements);
	});
});
