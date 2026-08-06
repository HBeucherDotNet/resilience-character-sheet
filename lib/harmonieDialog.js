// Couche DOM de la fonctionnalité Harmonie : lit les entrées depuis la page, delegue le calcul
// a `harmonieCalculator` (logique pure, cf. lib/harmonie.js), et rend le resultat dans la modale.
export function createHarmonieDialogController({ harmonieCalculator, getState, getCheckedMagicTalentIds }) {
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

	function computeHarmonieBreakdown() {
		const harmonieActuelle = Number.parseInt(document.getElementById('fiche-harmonie')?.value ?? '0', 10) || 0;
		return harmonieCalculator.computeHarmonieBreakdown({
			state: getState(),
			harmonieActuelle,
			resonanceRows: getResonanceRows(),
			checkedMagicTalentIds: getCheckedMagicTalentIds()
		});
	}

	function renderHarmonieDialog() {
		const list = document.getElementById('harmonie-dialog-list');
		const totalEl = document.getElementById('harmonie-dialog-total');
		if (!list || !totalEl) return;

		const { items, total, startingPackage } = computeHarmonieBreakdown();

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

		totalEl.textContent = `${startingPackage} + ${total - startingPackage} = ${total}`;
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

	return {
		bindHarmonieDialog
	};
}
