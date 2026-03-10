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

	// Pour le bouton pictogramme (hiver)
	if (btn.classList.contains('pictogram-btn')) {
		if (long.style.display === 'none') {
			long.style.display = 'inline';
			// Point d'interrogation barré
			btn.innerHTML = `
				<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="11" cy="11" r="10" stroke="#235a8a" stroke-width="2" fill="#fff"/>
					<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#235a8a">?</text>
					<line x1="6" y1="6" x2="16" y2="16" stroke="#235a8a" stroke-width="2"/>
				</svg>
			`;
		} else {
			long.style.display = 'none';
			// Point d'interrogation normal
			btn.innerHTML = `
				<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
					<circle cx="11" cy="11" r="10" stroke="#235a8a" stroke-width="2" fill="#fff"/>
					<text x="11" y="15" text-anchor="middle" font-size="13" font-family="Arial, sans-serif" fill="#235a8a">?</text>
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
	// ...existing code...
}
