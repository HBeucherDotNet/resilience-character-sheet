import { dons } from './dons.js';
import { lignees } from './lignees.js';

function buildLigneeLongHtml(lignee) {
	return [
		`<p>${lignee.description}</p>`,
		'<ul>',
			`<li>Environnement prefere : ${lignee.environnement}</li>`,
			`<li>Mode de vie favori : ${lignee.modeDeVie}</li>`,
			`<li>Personnalite majoritaire : ${lignee.personnalite}</li>`,
			`<li>Exemples de noms ${lignee.exemplesNoms}</li>`,
		'</ul>'
	].join('');
}

export const ligneeOptionConfigs = Object.entries(lignees).map(([key, lignee]) => {
	const saison = dons[lignee.don]?.saison || 'temps';
	const don = dons[lignee.don];

	return {
		value: key,
		id: `lignee-${key}`,
		label: lignee.nom,
		labelSuffixHtml: ` <span class="lignee-sexe">(${lignee.sexe})</span>`,
		saison,
		dataset: { don: lignee.don },
		shortText: lignee.summary,
		longHtml: buildLigneeLongHtml(lignee),
		donHtml: `Don : ${don?.nom || lignee.don}${don?.categorie ? ` (${don.categorie})` : ''}`,
		extraClasses: ['lignee', lignee.famille],
		famille: lignee.famille
	};
});