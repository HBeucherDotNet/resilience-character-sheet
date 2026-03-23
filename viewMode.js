function isViewModeEnabled() {
	return new URLSearchParams(window.location.search).get('view') === '1';
}

function buildUrlForViewMode(enabled) {
	const searchParams = new URLSearchParams(window.location.search);
	if (enabled) {
		searchParams.set('view', '1');
	} else {
		searchParams.delete('view');
	}
	const search = searchParams.toString();
	return `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
}

function updateViewModeUi() {
	const isViewMode = isViewModeEnabled();
	document.body.classList.toggle('view-mode', isViewMode);

	const toggleButton = document.getElementById('toggle-view-mode-btn');
	if (toggleButton) {
		toggleButton.textContent = isViewMode ? 'Revenir a l\'edition' : 'Ouvrir le mode vue';
		toggleButton.setAttribute('aria-pressed', String(isViewMode));
	}
}

async function copyViewModeLink() {
	const absoluteUrl = new URL(buildUrlForViewMode(true), window.location.href).toString();
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(absoluteUrl);
		return;
	}
	window.prompt('Copiez ce lien :', absoluteUrl);
}

function bindViewModeActions() {
	const toggleButton = document.getElementById('toggle-view-mode-btn');
	if (toggleButton) {
		toggleButton.addEventListener('click', () => {
			const nextIsViewMode = !isViewModeEnabled();
			history.replaceState(null, '', buildUrlForViewMode(nextIsViewMode));
			updateViewModeUi();
		});
	}

	const shareButton = document.getElementById('share-view-link-btn');
	if (shareButton) {
		shareButton.addEventListener('click', async () => {
			try {
				await copyViewModeLink();
				shareButton.textContent = 'Lien copie';
				setTimeout(() => {
					if (document.body.contains(shareButton)) {
						shareButton.textContent = 'Copier le lien de partage';
					}
				}, 1500);
			} catch {
				window.prompt('Copiez ce lien :', new URL(buildUrlForViewMode(true), window.location.href).toString());
			}
		});
	}
}

export {
	bindViewModeActions,
	updateViewModeUi
};
