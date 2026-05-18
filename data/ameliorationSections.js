import { competences } from './competences.js';
import { dons } from './dons.js';
import { equipements } from './equipements.js';
import { morphologies } from './morphologies.js';

function normalizeAmeliorationSaison(saison) {
	return ['hiver', 'printemps', 'ete', 'automne', 'temps'].includes(saison) ? saison : 'temps';
}

function getCompetenceAmeliorationSaison(competence) {
	if (competence.saison) return competence.saison;

	const roleSeasonMap = {
		guide: 'hiver',
		sibylle: 'printemps',
		matrice: 'ete',
		artisan: 'automne'
	};

	return roleSeasonMap[competence.role] || 'temps';
}

export const ameliorationSectionConfigs = [
	{
		containerId: 'ameliorations-morphologies-list',
		items: Object.entries(morphologies).map(([key, morphologie]) => ({
			key,
			type: 'morphologie',
			nom: morphologie.nom,
			meta: `Categorie : ${morphologie.categorie}`,
			description: morphologie.description,
			saison: morphologie.saison ?? 'temps'
		}))
	},
	{
		containerId: 'ameliorations-competences-list',
		items: Object.entries(competences).map(([key, competence]) => ({
			key,
			type: 'competence',
			nom: competence.nom,
			meta: `Rôle : ${competence.role}`,
			description: competence.description,
			saison: normalizeAmeliorationSaison(getCompetenceAmeliorationSaison(competence))
		}))
	},
	{
		containerId: 'ameliorations-dons-list',
		items: Object.entries(dons).map(([key, don]) => ({
			key,
			type: 'don',
			nom: don.nom,
			meta: don.saison ? `Categorie : ${don.categorie} • Saison : ${don.saison}` : `Categorie : ${don.categorie}`,
			description: don.description,
			saison: normalizeAmeliorationSaison(don.saison)
		}))
	},
	{
		containerId: 'ameliorations-equipements-list',
		items: Object.entries(equipements).map(([key, equipement]) => ({
			key,
			type: 'equipement',
			nom: equipement.nom,
			meta: `Categorie : ${equipement.categorie} • Saison : ${equipement.saison}`,
			description: equipement.description,
			saison: normalizeAmeliorationSaison(equipement.saison)
		}))
	}
];