function toggleDesc(btn) {
	const desc = btn.closest('.desc');
	const short = desc.querySelector('.short');
	const long = desc.querySelector('.long');

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

function genererFiche() {
	// ...existing code...
}
