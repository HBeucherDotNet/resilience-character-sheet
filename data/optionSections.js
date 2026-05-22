export const morphologyGroupConfig = {
	armement: {
		title: 'Armement',
		description: '',
		options: [
			{ key: 'articule', label: 'Articulé', saison: 'hiver', shortText: 'Tentacule, Dard, Serres, Queue, etc.' },
			{ key: 'distance', label: 'Distance', saison: 'printemps', shortText: 'Langue, Épines, Crachat, Projectile, etc.' },
			{ key: 'court', label: 'Court', saison: 'ete', shortText: 'Croc, Bec, Griffes, Cornes, etc.' },
			{ key: 'long', label: 'Long', saison: 'automne', shortText: 'Ramure, Défenses, Mandibules, Sabots, etc.' }
		]
	},
	cuirasse: {
		title: 'Cuirasse',
		description: 'Une Cuirasse réduit les Dégâts subit par le personnage lorsqu’il est victime d’une Agression de la Saison associée à l’Armure.',
		options: [
			{ key: 'mucus', label: 'Mucus', saison: 'hiver', shortText: 'Revêtement gluant ou glissant' },
			{ key: 'urticant', label: 'Urticant', saison: 'printemps', shortText: 'Poils acérés presque invisibles.' },
			{ key: 'bourre', label: 'Bourre', saison: 'ete', shortText: 'Duvet, fourrure, plumes ou liège.' },
			{ key: 'carapace', label: 'Carapace', saison: 'automne', shortText: 'Cuir, os, kératine ou écorce.' }
		]
	},
	mains: {
		title: 'Mains',
		description: 'Des Mains s’utilisent lorsque le personnage interagit avec certains êtres ou matériaux.',
		options: [
			{ key: 'ventouses', label: 'Ventouses', saison: 'hiver', shortText: '' },
			{ key: 'vibrisses', label: 'Vibrisses', saison: 'printemps', shortText: 'Poils sensitifs.' },
			{ key: 'crochets', label: 'Crochets', saison: 'ete', shortText: '' },
			{ key: 'pinces', label: 'Pinces', saison: 'automne', shortText: '' }
		]
	},
	peau: {
		title: 'Peau',
		description: 'Une Peau s’utilise lorsque le personnage effectue une action d’un certain type.',
		options: [
			{ key: 'membrane', label: 'Membrane', saison: 'hiver', shortText: 'Dorsale, recouvrant le corps ou rejoignant les membres ou doigts.' },
			{ key: 'camouflage', label: 'Camouflage', saison: 'printemps', shortText: 'Coussinets, motifs, silencieux, feuillage…' },
			{ key: 'aposematisme', label: 'Aposématisme', saison: 'ete', shortText: 'Couleurs vives et motifs complexes.' },
			{ key: 'ecailles', label: 'Écailles', saison: 'automne', shortText: 'D’os, de chitine ou d’écorce, couvrant le corps et s’emboîtant' }
		]
	}
};

export const optionSectionConfigs = [
	{
		containerId: 'saison-group',
		name: 'saison',
		descClassesByValue: {
			hiver: ['hiver-desc'],
			printemps: ['printemps-desc'],
			ete: ['ete-desc'],
			automne: ['automne-desc'],
			temps: ['temps-desc']
		},
		donPlacement: 'after-desc',
		options: [
			{
				value: 'hiver',
				id: 'saison-hiver',
				label: 'Hiver',
				saison: 'hiver',
				shortText: 'Mÿelta recherche les gens humbles, discrets, qui savent se fondre dans la masse, accepter les événements pour s\'y adapter et en tirer le meilleur parti au moment voulu.',
				longText: 'Parfois, ils sont cyniques ou froids. Souvent, ils sont ermites, agriculteurs, explorateurs. Mÿelta ne cherche pas les gens qui se mettent en avant, s\'exposent inutilement et refusent toute contrariété. Le personnage à tendance à se fondre dans la masse et attendre le meilleur moment pour agir efficacement et anonymement. Son attitude peut parfois le rendre cynique ou asocial.',
				donHtml: '<strong>Essence : <span class="label-essence">Adaptation</span>.</strong> Pour survivre en Hiver, il faut embrasser la difficulté et saisir la moindre opportunité.<br><strong>Anathème : <span class="label-anatheme">Fierté</span>.</strong> Qui se met en avant tombera en premier…'
			},
			{
				value: 'printemps',
				id: 'saison-printemps',
				label: 'Printemps',
				saison: 'printemps',
				shortText: 'Liana recherche des gens curieux, à l\'esprit vif, inventifs et perceptifs, pacifistes.',
				longText: 'Parfois, ils sont malicieux et fourbes, farceurs voire voleurs. Souvent, ils sont médecins, érudits, sentinelles. Liana ne cherche pas les personnes belliqueuses, rigides, pliant le monde à leur volonté, par la force physique ou les contraintes psychologiques. Le personnage aime découvrir le maximum de choses, explorer, tester, tout en respectant l’intégrité des gens. Cela peut le faire passer pour inconstant, peu fiable ou exagérément pacifiste.',
				donHtml: '<strong>Essence : <span class="label-essence">Curiosité</span>.</strong> Le Printemps c\'est le renouveau de la vie, la découverte du monde... <br><strong>Anathème : <span class="label-anatheme">Contrôle</span>.</strong> Dominer et exercer son pouvoir quelque chose la dénature…donc fait perdre la découverte.'
			},
			{
				value: 'ete',
				id: 'saison-ete',
				label: 'Été',
				saison: 'ete',
				shortText: 'Fyrellÿa recherche des gens sensibles, dévoués, francs, esthètes et sociaux.',
				longText: 'Parfois, ils sont envahissants ou dangereux. Souvent, ils sont artistes, officiers, négociants. Fyrellÿa ne cherche pas des personnes égocentrées, agissant sans aucune considération pour les autres ou leur environnement voire pire, les utilisant à son bénéfice. Le personnage est passionné, sociable et aime pousser les autres vers l’action ou l’expression de leur être. Il noue facilement des liens, mais peut le rendre envahissant ou exagérément extraverti.',
				donHtml: '<strong>Essence : <span class="label-essence">Émotion</span>.</strong> L’Été c’est la recherche de l’autre. L\'Émotion est le vecteur du lien… <br><strong>Anathème : <span class="label-anatheme">Insouciance</span>.</strong> Qui ne pense pas aux conséquences de ses actes sur les autres perdra ses liens avec eux.'
			},
			{
				value: 'automne',
				id: 'saison-automne',
				label: 'Automne',
				saison: 'automne',
				shortText: 'Ailma recherche les gens pragmatiques, patients, méthodiques et entiers.',
				longText: 'Parfois, ils sont lents ou rigides, autoritaires. Souvent, ils sont guerriers, artisans, rebouteux. Ailma ne cherche pas les personnes indolentes, irréfléchies, impulsives, recourant à la voie de moindre résistance face à chaque difficulté. Le personnage est posé et prend le temps de la préparation avant l’action, laissant le moins de choses possible au hasard, et déteste agir sans réfléchir. Cela peut le rendre perfectionniste ou indécis.',
				donHtml: '<strong>Essence : <span class="label-essence">Prévoyance</span>.</strong> En Automne, il faut se préparer à l’Hiver et à ses dangers… <br><strong>Anathème : <span class="label-anatheme">Facilité</span>.</strong> Les solutions simples et uniques cachent des défauts majeurs conduisant à la ruine.'
			},
			{
				value: 'temps',
				id: 'saison-temps',
				label: 'Temps',
				saison: 'temps',
				shortText: 'Les personnes bénies par le Temps voient les gens s\'organiser d\'eux-mêmes autour d\'elles.',
				longText: 'Elles maintiennent, voire créent les groupes, par leur seule présence, capables de répartir les rôles, apaiser les égos et satisfaire les désirs de chacun, ménageant un espace pour chacun et chacune. Si elles paraissent parfois en retrait, c\'est que le groupe avance dans la direction qui leur semble juste. Car elles ne relâchent jamais leur attention, veillant à ce que chacun soit justement rétribué pour ses actes. Le personnage aime voir les gens s’organiser et s’entendre. Il encourage et implique tout le monde. Le personnage a un sens aigu de la justice, de l\'équité et de la mesure. Cela peut parfois le rendre trop catégorique voire autoritaire, ou à l\'inverse manquant d\'affirmation.',
				donHtml: '<strong>Essence : <span class="label-essence">Coopération</span>.</strong> Le Temps rassemble autour de lui et permet à chacun de s’exprimer. <br><strong>Anathème : <span class="label-anatheme">Excès</span>.</strong> Ni trop, ni trop peu, mais la juste dose de tout, pour tous.'
			}
		]
	},
	{
		containerId: 'famille-group',
		name: 'famille',
		options: [
			{
				value: 'squelette',
				id: 'famille-squelette',
				label: 'Squelette',
				saison: 'ete',
				dataset: { don: 'adrenaline' },
				shortText: 'La Famille Squelette regroupe tous les personnages ayant un squelette interne, quatre membres et une tête.',
				longText: 'Ils peuvent tenir du mammifère et être couvert de poils, de l’oiseau, ou avoir plutôt une ascendance reptilienne voir un apparence directement inspirée des amphibiens, leur donnant une peau multicolore.',
				donHtml: 'Don : Adrénaline&nbsp;☀️'
			},
			{
				value: 'cellulose',
				id: 'famille-cellulose',
				label: 'Cellulose',
				saison: 'printemps',
				dataset: { don: 'symbiose' },
				shortText: 'La Famille Cellulose contient tous les personnages issus du règne des végétaux ou des champignons.',
				longText: 'Ces individus particulièrement étranges simulent des visages pour parvenir à communiquer avec les autres Familles. Dans leur incroyable diversité, ils ont trouvé le moyen d’avoir des morphologies relativement constantes, en apparence du moins.',
				donHtml: 'Don : Symbiose&nbsp;🌱'
			},
			{
				value: 'chitine',
				id: 'famille-chitine',
				label: 'Chitine',
				saison: 'automne',
				dataset: { don: 'exosquelette' },
				shortText: 'La Famille Chitine comprend tous les personnages portant un exosquelette de chitine.',
				longText: 'Leur apparence est très variée, pouvant avoir de six à plusieurs dizaines de membres, des pinces, des antennes, ou des ailes. Ces personnages peuvent donc aussi bien tenir de la fourmi de l’araignée, du mille-patte ou de la mante.',
				donHtml: 'Don : Exosquelette&nbsp;🍁'
			},
			{
				value: 'souple',
				id: 'famille-souple',
				label: 'Souple',
				saison: 'hiver',
				dataset: { don: 'mimetisme' },
				shortText: 'La Famille Souple englobe tous les personnages tenant du mollusque.',
				longText: 'Ils peuvent ainsi être inspirés très simplement des étoiles de mer, mais un poulpe est parfaitement envisageable. Les personnages les plus extravagants pourront avoir une coquille dans laquelle se réfugier, ou même tenir du ver de terre.',
				donHtml: 'Don : Mimétisme&nbsp;❄️'
			}
		]
	},
	{
		containerId: 'environnement-group',
		name: 'environnement',
		options: [
			{
				value: 'riviere-lacs-marais',
				id: 'environnement-riviere-lacs-marais',
				label: 'Rivières, lacs et marais',
				saison: 'hiver',
				dataset: { equipement: 'jambieres' },
				shortText: 'Ces environnements sont riches en eau potable. Ils attirent donc des proies faciles pour la chasse et permettent, s’ils sont bien gérés, la culture et l’élevage.',
				longText: 'Cependant, les eaux stagnantes sont propices au développement de maladies, car elles favorisent le développement de parasites tout en affaiblissant le système immunitaire des communautés vivant à leur proximité.',
				donHtml: 'Le personnage pourrait posséder des Jambières&nbsp;❄️'
			},
			{
				value: 'iles-littoral',
				id: 'environnement-iles-littoral',
				label: 'Îles et littoral',
				saison: 'printemps',
				dataset: { equipement: 'brassards' },
				shortText: 'Ces environnements bénéficient de l’influence de l’océan qui temporise les fluctuations de températures. Par ailleurs, la nourriture y est plutôt abondante et facile à récolter.',
				longText: 'En revanche, ce sont des milieux souvent pauvres en eau douce, exposés à la fois aux dangers terrestres et maritimes. De plus, beaucoup d’animaux marins tendent des embuscades, se confondant avec les rochers, et beaucoup utilisent des venins mortels.',
				donHtml: 'Le personnage pourrait posséder des Brassards&nbsp;🌱'
			},
			{
				value: 'plaines-collines',
				id: 'environnement-plaines-collines',
				label: 'Plaines et collines',
				saison: 'ete',
				dataset: { equipement: 'casque' },
				shortText: 'Ces environnements permettent de voir loin et de voyager facilement. Les échanges sont donc plus aisés, ce qui signifie que des communautés peuvent s’installer avec peu de moyens et échanger avec celles alentour.',
				longText: 'En revanche, si ces lieux permettent d’anticiper les dangers, aussi bien les attaques que les intempéries, cela signifie aussi que ses habitants y sont plus exposés, ce qui pèse lourdement sur leur moral.',
				donHtml: 'Le personnage pourrait posséder un Casque&nbsp;☀️'
			},
			{
				value: 'montagnes-canyons',
				id: 'environnement-montagnes-canyons',
				label: 'Montagnes et canyons',
				saison: 'automne',
				dataset: { equipement: 'plastron' },
				shortText: 'Ces environnements clos, difficiles d’accès ont l’avantage d’offrir un bon isolement face aux bandits et pillards, et une protection relative aux aléas climatiques.',
				longText: 'Ces lieux permettent donc de faire des abris sûrs et solides. Cependant, ils viennent avec des dangers supplémentaires : éboulements, crevasses, avalanches. Ces dangers sont impressionnants mais assez prévisibles dans l’ensemble.',
				donHtml: 'Le personnage pourrait posséder un Plastron&nbsp;🍁'
			}
		]
	},
	{
		containerId: 'mode-de-vie-group',
		name: 'mode-de-vie',
		options: [
			{
				value: 'alize',
				id: 'mode-de-vie-alize',
				label: 'Alizé',
				saison: 'hiver',
				dataset: { equipement: 'survie' },
				shortText: 'Les Alizés n’ont aucune attache, acceptant les variations et déplacements erratiques de la météo.',
				longText: 'Les troupeaux et les oracles les guident vers des alliés, des abris ou des météos favorables, répondant à leurs besoins du moment. Les Alizés errent en permanence, devant garder leur cap et faire de chaque changement une opportunité.',
				donHtml: 'Le personnage pourrait posséder des Outils de Survie&nbsp;❄️'
			},
			{
				value: 'troglodyte',
				id: 'mode-de-vie-troglodyte',
				label: 'Troglodyte',
				saison: 'printemps',
				dataset: { equipement: 'sapience' },
				shortText: 'Les Troglodytes vivent presque coupés du monde, dans des grottes cachées, des vallées secrètes, ou canyons inaccessibles.',
				longText: 'Leurs échanges rarissimes leur apprennent à tirer le meilleur parti de leur environnement. Les Troglodytes doivent connaître et comprendre leur milieu de vie à la perfection pour ne jamais manquer de rien.',
				donHtml: 'Le personnage pourrait posséder des Outils de Sapience&nbsp;🌱'
			},
			{
				value: 'sedentaire',
				id: 'mode-de-vie-sedentaire',
				label: 'Sédentaire',
				saison: 'ete',
				dataset: { equipement: 'foyer' },
				shortText: 'Les Sédentaires s’établissent dans un lieu offrant au moins une ressource pérenne, telle que l’eau, un abri ou un sol fertile.',
				longText: 'Ils construisent de quoi la faire fructifier et échangent pour le reste. Les Sédentaires doivent plus que tout maintenir leur unité et la bonne entente face à l’adversité tant interne qu’externe.',
				donHtml: 'Le personnage pourrait posséder des Outils du Foyer&nbsp;☀️'
			},
			{
				value: 'nomade',
				id: 'mode-de-vie-nomade',
				label: 'Nomade',
				saison: 'automne',
				dataset: { equipement: 'confection' },
				shortText: 'Les Nomades voyagent entre les communautés sédentaires et des points habitables, exploités puis abandonnés le temps qu’ils se régénèrent.',
				longText: 'Les Nomades entretiennent les échanges et voies de communication. Ils doivent souvent réparer les infrastructures et habitations, de la route où aider les communautés qu’ils visitent.',
				donHtml: 'Le personnage pourrait posséder des Outils de Confection&nbsp;🍁'
			}
		]
	},
	{
		containerId: 'philosophie-group',
		name: 'philosophie',
		options: [
			{
				value: 'inne',
				id: 'philosophie-inne',
				label: 'Inné',
				saison: 'hiver',
				dataset: { equipement: 'echarpe' },
				shortText: 'Le personnage considère que puisqu’aucune connaissance ne peut être complète et aucune technologie totalement fiable, le plus sage est d’apprivoiser au mieux ses qualités naturelles.',
				longText: 'Connaître ses atouts permet de faire face à toutes les situations, en improvisant à partir de la confiance en soi ainsi bâtie.',
				donHtml: 'Le personnage pourrait posséder comme Vêtement une Écharpe&nbsp;❄️'
			},
			{
				value: 'appris',
				id: 'philosophie-appris',
				label: 'Appris',
				saison: 'printemps',
				dataset: { equipement: 'cape' },
				shortText: 'Le personnage estime que dans chaque problème réside sa propre solution.',
				longText: 'Aussi, étudier le monde et ses peuples permet de développer des connaissances éclectiques pour parer à toutes les situations. Cela demande d’embrasser chaque expérience et d’en tirer des leçons, afin d’apprivoiser le monde.',
				donHtml: 'Le personnage pourrait posséder comme Vêtement une Cape&nbsp;🌱'
			},
			{
				value: 'chitine',
				id: 'philosophie-chitine',
				label: 'Entraide',
				saison: 'ete',
				dataset: { equipement: 'parure' },
				shortText: 'Le personnage sait que personne n’est parfait, qu’aucun expert ne saurait être infaillible, qu’il aura toujours besoin des autres et les autres de lui.',
				longText: 'En travaillant ensemble avec sincérité et confiance, la synergie dépasse la somme des individus.',
				donHtml: 'Le personnage pourrait posséder comme Vêtement une Parure&nbsp;☀️'
			},
			{
				value: 'construit',
				id: 'philosophie-construit',
				label: 'Construit',
				saison: 'automne',
				dataset: { equipement: 'tablier' },
				shortText: 'Le personnage pense que la technologie, incarnation du contrôle de la matière, est la clé qui permet de surmonter les épreuves de la vie.',
				longText: 'Un bon outil compense les faiblesses naturelles, permet d’aller dans l’inconnu ou de faire progresser les savoirs.',
				donHtml: 'Le personnage pourrait posséder comme Vêtement un Tablier&nbsp;🍁'
			}
		]
	},
	{
		containerId: 'relation-rupture-group',
		name: 'relation-rupture',
		options: [
			{
				value: 'dompter',
				id: 'relation-rupture-dompter',
				label: 'Dompter',
				saison: 'hiver',
				dataset: { equipement: 'armearticulee' },
				shortText: 'Le personnage a grandi dans un environnement où la Rupture était une force à dompter, où puiser avec sagesse, ou pas.',
				longText: 'Cela pouvait être pour combattre le feu par le feu, par facilité ou par recherche de puissance. En tout cas, les Rongés y étaient fréquents, peut-être même les Parjures, s’ils n’y étaient pas vu comme des faibles.',
				donHtml: 'Le personnage pourrait posséder une Arme Articulée&nbsp;❄️ : garrot, harpon, fouet ou fléau'
			},
			{
				value: 'etudier',
				id: 'relation-rupture-etudier',
				label: 'Étudier',
				saison: 'printemps',
				dataset: { equipement: 'armeadistance' },
				shortText: 'Le personnage a grandi dans un environnement où la Rupture était un mystère à percer, une énigme à résoudre.',
				longText: 'La comprendre était l’objectif, pour la détruire, la forger, ou même l’asservir. La Pourprine y était présente, peut-être des Parjures volontaires ou esclaves, ou des Séides et Chimères capturés pour études.',
				donHtml: 'Le personnage pourrait posséder une Arme à Distance&nbsp;🌱 : bolas, arc, arbalète, sarbacane, javelot, chakram, boomerang ou fronde'
			},
			{
				value: 'purifier',
				id: 'relation-rupture-purifier',
				label: 'Purifier',
				saison: 'ete',
				dataset: { equipement: 'armecourte' },
				shortText: 'Le personnage a grandi dans un environnement où la Rupture était un mal à abattre.',
				longText: 'Que ce soit pour ramener un ancien monde idéalisé, fantasmé, ou simplement pour débarrasser le monde de son influence et en construire un nouveau, tout ce qui portait sa marque, même les Rongés, était détruit.',
				donHtml: 'Le personnage pourrait posséder une Arme Courte&nbsp;☀️ : tonfa, dague, serpe, épée, hache, masse ou ceste'
			},
			{
				value: 'composer',
				id: 'relation-rupture-composer',
				label: 'Composer',
				saison: 'automne',
				dataset: { equipement: 'armelongue' },
				shortText: 'Le personnage a grandi dans un environnement où la Rupture était acceptée comme faisant partie du monde actuel.',
				longText: 'Par résignation, fatalisme ou pragmatisme, elle n’était pas activement combattue, simplement contenue. Les gens géraient les dégâts qu’elle causait et cherchaient à s’en prémunir, sans imaginer l’éradiquer.',
				donHtml: 'Le personnage pourrait posséder une Arme Longue&nbsp;🍁 : trident, sasumata, lance, pic, vouge, claymore ou bâton.'
			}
		]
	},
	{
		containerSelector: '[data-option-section="role"]',
		name: 'role',
		options: [
			{
				value: 'guide',
				id: 'role-guide',
				label: 'Guide',
				labelSuffixHtml: ' <span class="role-tagline">(nourrir et prévenir)</span>',
				saison: 'hiver',
				dataset: { competence: 'guide' },
				shortText: 'Les Guides nourrissent les communautés et leur évitent les dangers causés par les catastrophes naturelles.',
				longText: 'Grâce à eux, leurs communautés ne s’égarent pas et anticipent les dangers naturels. Le cas échéant, ils savent comment fabriquer le nécessaire pour se protéger des aléas. Les Guides nourrissent les leurs grâce à la chasse et à la cueillette et savent également comment protéger les leurs et le matériel des intempéries.',
				donHtml: '<ul><li>Compétence de Rôle : Exploration&nbsp;❄️</li><li>Compétence au choix : Chasse (Animal), Cueillette (Végétal), Cuisine (Flamme), Étoffes (Techné)</li></ul>'
			},
			{
				value: 'sibylle',
				id: 'role-sibylle',
				label: 'Sibylle',
				labelSuffixHtml: ' <span class="role-tagline">(connaître et purifier)</span>',
				saison: 'printemps',
				dataset: { competence: 'sibylle' },
				shortText: 'Les Sibylles veillent à la santé des membres de leur communauté à tous les niveaux d’existence.',
				longText: 'Maîtresses des rituels, elles organisent le passage de la vie à la mort, soignent les affections du corps et de l’âme et protègent contre les mauvais esprits. Les Sibylles oscillent entre pythies plongées dans les oracles et les secrets de l’invisible et sages dépositaires des savoirs ancestraux, permettant de faire revivre l’ancien monde au coeur de la Rupture.',
				donHtml: '<ul><li>Compétence de Rôle : Sagesse&nbsp;🌱</li><li>Compétence au choix : Artefacts (Techné), Médecine (Animal), Forge (Flamme), Sceaux (Végétal)</li></ul>'
			},
			{
				value: 'matrice',
				id: 'role-matrice',
				label: 'Matrice',
				labelSuffixHtml: ' <span class="role-tagline">(unir et échanger)</span>',
				saison: 'ete',
				dataset: { competence: 'matrice' },
				shortText: 'Les Matrices organisent les communautés et leurs ressources, aussi bien entre les membres qu’avec d’autres communautés.',
				longText: 'Elles mettent en place les structures sociales et les échanges, veillent aux troupeaux et aux récoltes. Les Matrices trouvent une place pour chaque membre de la communauté et organisent la gestion des ressources en fonction des besoins. Elles soudent les personnes entre elles, les communautés entre elles, dans une organisation dépassant leur existence.',
				donHtml: '<ul><li>Compétence de Rôle : Civilisation&nbsp;☀️</li><li>Compétence au choix : Agriculture (Végétal), Élevage (Animal), Résines (Flamme), Maçonnerie (Techné)</li></ul>'
			},
			{
				value: 'artisan',
				id: 'role-artisan',
				label: 'Artisan',
				labelSuffixHtml: ' <span class="role-tagline">(construire et innover)</span>',
				saison: 'automne',
				dataset: { competence: 'artisan' },
				shortText: 'Les Artisans fabriquent les outils dont ont besoin les membres de leurs communautés et édifient les ouvrages permettant leur survie : systèmes d’irrigation, ponts et voies de communication.',
				longText: 'Ils savent comment transformer la matière brute pour en extraire de nouvelles ressources et matériaux afin d’en faire les objets du quotidien ou de modifier leur environnement. Face à l’inconnu et à l’imprévu, leur ingéniosité et inventivité leur permet de trouver et créer de nouvelles solutions.',
				donHtml: '<ul><li>Compétence de Rôle : Ingénierie&nbsp;🍁</li><li>Compétence au choix : Bois (Végétal), Équarrissage (Animal), Poterie (Flamme), Silex (Techné)</li></ul>'
			}
		]
	},
	{
		containerSelector: '[data-option-section="age"]',
		name: 'age',
		options: [
			{
				value: 'jeune',
				id: 'age-jeune',
				label: 'Jeune',
				saison: 'temps',
				shortText: 'Ces personnages n\'ont pas fini leur croissance et apprennent encore souvent leur métier.',
				longText: 'Aussi leurs Compétences sont limitées. En revanche, ils ont de nombreux Dons, des qualités innées leur permettant de dépasser leurs limites. Les Nymphes les Adoubent peu, car leur jeunesse fait que leur volonté d\'agir, leur inclinaison profonde n’a pas souvent eu l’occasion de semanifester. Toutefois, les catastrophes ou leur fougue juvénile peuvent les avoir stimulés.'
			},
			{
				value: 'adulte',
				id: 'age-adulte',
				label: 'Adulte',
				saison: 'temps',
				shortText: 'Ces personnages se sont déjà confrontés au monde, ils ont pratiqué leur profession et l’ont affinée, ce qui leur a montré l’étendue de ce qu’ils ont encore à apprendre.',
				longText: 'Leurs corps et leur esprits sont encore frais, ce qui leur permet de cumuler à la fois la volonté et les moyens d’agir. S’il sont souvent encore caricaturaux voire extrêmes dans leur philosophie, ils n’en sont que plus réceptifs à l’enseignement des Nymphes. Ils forment la majorité des Voix.'
			},
			{
				value: 'mur',
				id: 'age-mur',
				label: 'Mûr',
				saison: 'temps',
				shortText: 'Ces personnages ont accumulé de l’expérience et des années peu communes pour ce monde post-Rupture.',
				longText: 'Cela en fait des êtres respectés dans leur communautés, tant pour leur expertise que pour leur sagesse, qui leur permet de voir les nuances des êtres. Cependant, leur volonté commence à s’étioler, ils agissent plutôt par habitude voire lassitude. Pourtant, leur flamme est toujours présente, juste dormante. Devenir une Voix les transforme en puissants leviers d’actions vers un monde meilleur.'
			},
			{
				value: 'age',
				id: 'age-age',
				label: 'Âgé',
				saison: 'temps',
				shortText: 'Ces personnages sont des êtres à part, leur longévité prouvant leur capacité de survie hors normes.',
				longText: 'Ces individus sont rares et portés en haute estime par leurs communautés. Les stigmates de leur vie sont l’histoire de celles-ci et le terreau de mythes à venir. Souvent ces personnages n\'attendent plus rien de la vie que transmettre le maximum de leurs immenses connaissances avant leur trépas. Toutefois, les Nymphes les Adoubent parfois, preuve qu’il n’y a pas d’âge pour servir et changer le monde.'
			}
		]
	},
	{
		containerSelector: '[data-option-section="personnalite"]',
		name: 'personnalite',
		options: [
			{
				value: 'eminence',
				id: 'personnalite-eminence',
				label: 'Éminence',
				saison: 'hiver',
				descHtml: '<p class="short">Le personnage fait porter ses opinions par d’autres lors des prises de décisions, ou suggère des idées aux personnes qui s’expriment ouvertement.</p><p class="long">Lors des actions lancées par la communauté, il préfère conseiller les volontaires et leur fournir de quoi réussir leur mission.</p><p class="long">La Rupture tentera le personnage lorsqu’il se sentira impuissant, dépassé par les événements. Elle sera alors le témoignage inavouable de la méconnaissance de ses limites, ou au contraire l’allié qui lui permet de se dépasser.</p>'
			},
			{
				value: 'portefaix',
				id: 'personnalite-portefaix',
				label: 'Portefaix',
				saison: 'printemps',
				descHtml: '<p class="short">Le personnage écoute les propositions des autres, ou les conseille, et se range du côté des idées qui lui paraissent les plus sensées.</p><p class="long">Il se porte généralement volontaire pour mener à bien les actions décidées par la communauté, s’intégrant dans un groupe ou en formant un autour de lui.</p><p class="long">La Rupture tentera le personnage lorsqu’il doutera ou se sentira incompétant voire inutile. Elle sera alors le cuisant rappel de son ignorance, ou bien sa source d’inspiration permanente.</p>'
			},
			{
				value: 'leader',
				id: 'personnalite-leader',
				label: 'Leader',
				saison: 'ete',
				descHtml: '<p class="short">Le personnage s’implique directement dans les processus de décision, soit en exprimant ses idées, soit en relayant celles d’autres.</p><p class="long">Il participe également activement aux actions menées, rassemblant les volontaires autour de lui ou rejoignant les groupes déjà formés.</p><p class="long">La Rupture tentera le personnage sur sa peur d’être rejeté, inutile, ou ses craintes sur l’intégrité du groupe. Elle deviendra la honte d’avoir perdu confiance, ou un moyen de maintenir les sociétés, par l’admiration ou la tyrannie.</p>'
			},
			{
				value: 'sage',
				id: 'personnalite-sage',
				label: 'Sage',
				saison: 'automne',
				descHtml: '<p class="short">Le personnage se fait le relais d’autres voix que la sienne lors des prises de décision, ou exprime ses propres idées, participant toujours aux discussions.</p><p class="long">Lorsqu’une action est menée, il fournit aux volontaires ce dont ils ont besoin, et reste au sein de la communauté pour aider les plus fragiles.</p><p class="long">La Rupture tentera le personnage lorsqu’il aura la sensation d’avoir tout perdu, ou en lui offrant ce dont il pense avoir besoin. Elle sera alors le châtiment de n’avoir pas su anticiper, ou bien un outil résolvant toutes les situations.</p>'
			}
		]
	}
];