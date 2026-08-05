import { getSaisonScore } from '../personnage.js';

// Fabrique un calculateur d'Harmonie : la logique est pure (aucun accès DOM), seules les
// données déjà extraites du DOM (resonanceRows, checkedMagicTalentIds, harmonieActuelle) lui sont passées.
export function createHarmonieCalculator({ symbols, sorts, competences, dons, saisonSuffix }) {
	// Inverse de `symbols` (saison -> emoji), pour retrouver la saison d'une relation depuis le pictogramme de son nom.
	const saisonBySymbol = Object.fromEntries(
		Object.entries(symbols).map(([saisonValue, emoji]) => [emoji, saisonValue])
	);

	const saisonScoreModKeys = Object.fromEntries(
		Object.entries(saisonSuffix).map(([saisonValue, suffix]) => [saisonValue, `scoreMod${suffix}`])
	);

	// Les `freeCount` premiers ajouts au-delà de la sélection de base sont gratuits, puis le n-ième coûte n.
	function getAmeliorationAjouteeCost(count, freeCount = 1) {
		if (count <= freeCount) return 0;
		return (count * (count + 1)) / 2 - (freeCount * (freeCount + 1)) / 2;
	}

	// Les points au-delà de la base coûtent 2*(base+k) au k-ième point supplémentaire, soit m² + m*(2*base+1) au total.
	function getScoreExtraCostFromBase(baseScore, extraPoints) {
		const m = Math.max(0, extraPoints);
		return m * m + m * (2 * baseScore + 1);
	}

	// Les points au-delà du seuil gratuit (déjà couvert par le score de base 3) coûtent 8, 10, 12, 14... Harmonie.
	function getScoreExtraCost(mod) {
		const extra = Math.max(0, Number.parseInt(String(mod ?? '0'), 10) || 0);
		return getScoreExtraCostFromBase(3, extra);
	}

	function getSaisonFromPictogram(text) {
		const entry = Object.entries(saisonBySymbol).find(([emoji]) => text.includes(emoji));
		return entry?.[1] ?? null;
	}

	// La Voix du Temps améliore le Souffle des autres (base 3 pour une autre Voix du Temps, 2 sinon) au lieu d'une Saison.
	function getRelationTargetBaseScore(otherSaisonValue, maSaisonValue) {
		if (maSaisonValue === 'temps') {
			return otherSaisonValue === 'temps' ? 3 : 2;
		}
		return getSaisonScore({ value: otherSaisonValue }, maSaisonValue);
	}

	// Améliorer la Saison (ou le Souffle, pour la Voix du Temps) de quelqu'un d'autre renforce la relation avec cette personne.
	// Le coût de chaque augmentation dépend du score de base de la cible (déduit du pictogramme de son nom).
	function getRelationsHarmonieDetails(resonanceRows, maSaisonValue) {
		return resonanceRows
			.map(row => {
				const otherSaisonValue = getSaisonFromPictogram(row.name);
				if (!otherSaisonValue) return null;

				const base = getRelationTargetBaseScore(otherSaisonValue, maSaisonValue);
				const extra = row.niveau - base;
				if (extra <= 0) return null;

				return {
					name: row.name,
					base,
					niveau: row.niveau,
					extra,
					cost: getScoreExtraCostFromBase(base, extra)
				};
			})
			.filter(Boolean);
	}

	// Le niveau de chaque sphère est défini dans data/sorts.js.
	function getSphereLevels() {
		return Object.fromEntries(
			Object.entries(sorts).map(([sphereId, sphere]) => [sphereId, sphere.niveau ?? 1])
		);
	}

	// Dans une sphère, le 1er talent appris coûte le niveau de la sphère, le 2e niveau+1, le 3e niveau+2, etc.
	function getMagieTalentsHarmonieDetails(checkedMagicTalentIds) {
		const sphereLevels = getSphereLevels();
		const countsBySphere = {};
		checkedMagicTalentIds.forEach(id => {
			const [sphereId] = id.split('-');
			countsBySphere[sphereId] = (countsBySphere[sphereId] || 0) + 1;
		});

		return Object.entries(countsBySphere).map(([sphereId, count]) => {
			const level = sphereLevels[sphereId] ?? 1;
			const cost = count * level + (count * (count - 1)) / 2;
			return { sphereId, count, level, cost };
		});
	}

	function computeHarmonieBreakdown({ state, harmonieActuelle, resonanceRows, checkedMagicTalentIds }) {
		const items = [];

		items.push({
			label: 'Harmonie actuelle',
			cost: Math.max(0, harmonieActuelle || 0)
		});

		[
			{ key: 'competencesAjoutees', label: 'Compétences apprises', freeCount: 2, dataMap: competences, surchargeCategorie: 'role', surchargeLabel: 'Rôle' },
			{ key: 'donsAjoutes', label: 'Dons acquis', freeCount: 2, dataMap: dons, surchargeCategorie: 'Famille', surchargeLabel: 'Famille' },
			{ key: 'equipementsAjoutes', label: 'Équipements maîtrisés', freeCount: 1 },
			{ key: 'morphologiesAjoutees', label: 'Morphologies acquises', freeCount: 1 }
		].forEach(({ key, label, freeCount, dataMap, surchargeCategorie, surchargeLabel }) => {
			const addedKeys = state[key] ?? [];
			const count = addedKeys.length;
			// La 1ère compétence de Rôle / le 1er don de Famille est offert automatiquement, seuls les suivants surchargent.
			const surchargeCount = dataMap
				? Math.max(0, addedKeys.filter(itemKey => dataMap[itemKey]?.categorie === surchargeCategorie).length - 1)
				: 0;

			let detail = count > 0 ? `${count} ajouté${count > 1 ? 's' : ''}` : 'aucun';
			if (surchargeCount > 0) {
				detail += ` (dont ${surchargeCount} suppl. de ${surchargeLabel} : +${surchargeCount})`;
			}

			items.push({
				label,
				detail,
				cost: getAmeliorationAjouteeCost(count, freeCount) + surchargeCount
			});
		});

		const maSaisonValue = state.saison?.value ?? '';
		const saisonScoreModKey = saisonScoreModKeys[maSaisonValue];
		if (saisonScoreModKey) {
			const mod = Math.max(0, state[saisonScoreModKey] ?? 0);
			items.push({
				label: `Score de la Saison (${maSaisonValue})`,
				detail: `+${mod} point${mod > 1 ? 's' : ''}`,
				cost: getScoreExtraCost(mod)
			});
		}

		// Relations : une Voix classique améliore la Saison d'un autre personnage, la Voix du Temps améliore son Souffle.
		if (saisonScoreModKey) {
			const relationsDetails = getRelationsHarmonieDetails(resonanceRows, maSaisonValue);
			if (relationsDetails.length > 0) {
				items.push({
					label: 'Relations améliorées',
					detail: `${relationsDetails.length} relation(s)`,
					cost: relationsDetails.reduce((total, d) => total + d.cost, 0),
					subitems: relationsDetails.map(d =>
						`${d.name} : base ${d.base} → niveau ${d.niveau} — ${d.cost} Harmonie`
					)
				});
			}
		}

		const magieDetails = getMagieTalentsHarmonieDetails(checkedMagicTalentIds);
		if (magieDetails.length > 0) {
			const rawMagieCost = magieDetails.reduce((total, d) => total + d.cost, 0);
			// Les 2 premiers talents magiques sont offerts, soit -3 Harmonie sur le coût total des talents.
			const talentsOffertsDiscount = Math.min(3, rawMagieCost);
			const subitems = magieDetails.map(({ sphereId, count, level, cost }) =>
				`${sphereId} (niv. ${level}) : ${count} talent${count > 1 ? 's' : ''} — ${cost} Harmonie`
			);
			if (talentsOffertsDiscount > 0) {
				subitems.push(`Talents offerts (2 premiers) — -${talentsOffertsDiscount} Harmonie`);
			}

			items.push({
				label: 'Talents magiques',
				detail: `${magieDetails.reduce((total, d) => total + d.count, 0)} talent(s)`,
				cost: rawMagieCost - talentsOffertsDiscount,
				subitems
			});
		}

		const total = items.reduce((sum, item) => sum + item.cost, 0);
		return { items, total };
	}

	return {
		computeHarmonieBreakdown,
		getAmeliorationAjouteeCost,
		getScoreExtraCostFromBase,
		getScoreExtraCost
	};
}
