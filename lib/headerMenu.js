// Comportement de fermeture partagé par les menus hamburger des headers
// (<details class="desktop-header-menu">, <details class="mobile-header-menu">) :
// clic en dehors, touche Échap, ou clic sur une action du menu.
export function bindHeaderMenu(selector) {
	const headerMenu = document.querySelector(selector);
	if (!(headerMenu instanceof HTMLDetailsElement)) return;

	function closeHeaderMenu() {
		headerMenu.open = false;
	}

	headerMenu.addEventListener('click', event => {
		const button = event.target instanceof Element ? event.target.closest('.page-action-btn') : null;
		if (button) closeHeaderMenu();
	});

	document.addEventListener('click', event => {
		if (!(event.target instanceof Node)) return;
		if (!headerMenu.open) return;
		if (headerMenu.contains(event.target)) return;
		closeHeaderMenu();
	});

	document.addEventListener('keydown', event => {
		if (event.key === 'Escape') {
			closeHeaderMenu();
		}
	});
}
