// Charge des fragments HTML statiques (partials/*.html) et les monte dans la page.
//
// Usage :
//   <div data-include="partials/header-desktop.html" data-title="Sorts">
//     <a href="index.html" class="page-action-btn">Fiche de personnage</a>
//     <div data-slot="extra">...</div>
//   </div>
//
// - Le contenu de partials/header-desktop.html remplace la div hôte.
// - data-title (optionnel) remplit l'élément [data-slot="title"] du partiel.
// - Chaque enfant de la div hôte est déplacé dans l'élément [data-slot="..."] du
//   partiel correspondant à son propre attribut data-slot (par défaut "actions").
export async function includeHtmlPartials(root = document) {
	const hosts = Array.from(root.querySelectorAll('[data-include]'));

	await Promise.all(hosts.map(async host => {
		const response = await fetch(host.dataset.include);
		const html = await response.text();

		const wrapper = document.createElement('div');
		wrapper.innerHTML = html.trim();
		const mounted = wrapper.firstElementChild;
		if (!mounted) return;

		if (host.dataset.title) {
			const titleSlot = mounted.querySelector('[data-slot="title"]');
			if (titleSlot) titleSlot.textContent = host.dataset.title;
		}

		Array.from(host.children).forEach(child => {
			const slotName = child.dataset.slot || 'actions';
			const target = mounted.querySelector(`[data-slot="${slotName}"]`);
			target?.appendChild(child);
		});

		host.replaceWith(mounted);
	}));
}
