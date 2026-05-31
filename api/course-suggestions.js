// api/course-suggestions.js
// Retourne des sujets de cours suggérés selon niveau et catégorie
// Pas d'IA ici — liste curée pour rapidité et fiabilité
//
// GET /api/course-suggestions?level=A2&category=grammar
//
// (Pas d'auth requise — c'est juste un catalogue public)

import { handleCors } from './_lib/deepseek.js';

const SUGGESTIONS = {
  vocabulary: {
    A1: [
      'Les couleurs et formes', 'La famille proche', 'Les nombres 1-100',
      'Les jours et les mois', 'La nourriture de base', 'Les vêtements quotidiens',
      'Les pièces de la maison', 'Les transports', 'Les animaux courants',
      'Les métiers les plus communs',
    ],
    A2: [
      'Les sentiments et émotions', 'Les loisirs et hobbies', 'À l\'école et au travail',
      'Au restaurant : commander en allemand', 'Les voyages : vocabulaire essentiel',
      'La santé et le corps humain', 'Faire les courses', 'Le temps et la météo',
      'Les sports populaires en Allemagne', 'La technologie quotidienne',
    ],
    B1: [
      'Vocabulaire de l\'environnement', 'Le monde du travail (CV, entretiens)',
      'Médias et journalisme', 'Politique et société', 'Vocabulaire culinaire avancé',
      'L\'éducation : système allemand', 'Voyages : conversations avancées',
      'Santé : chez le médecin', 'Logement : recherche et bail', 'Banque et finances',
    ],
    B2: [
      'Vocabulaire académique', 'Langage des affaires', 'Termes scientifiques courants',
      'Vocabulaire littéraire', 'Expressions idiomatiques avancées',
      'Langage juridique de base', 'Vocabulaire technologique avancé',
      'Termes psychologiques', 'Critique d\'art et culture', 'Langage diplomatique',
    ],
  },
  grammar: {
    A1: [
      'Les articles définis (der, die, das)', 'Les articles indéfinis (ein, eine)',
      'Le présent : conjugaison régulière', 'Les pronoms personnels au nominatif',
      'La négation avec nicht et kein', 'L\'ordre des mots simple (V2)',
      'Les questions avec W- (Wer, Was, Wo...)', 'Le pluriel des noms',
      'Le verbe sein et haben au présent', 'Les nombres et l\'heure',
    ],
    A2: [
      'L\'accusatif : compléments d\'objet direct',
      'Le datif : compléments d\'attribution',
      'Les prépositions de lieu (in, auf, an...)',
      'Les verbes modaux (können, müssen, wollen...)',
      'Le Perfekt : passé composé', 'Les verbes séparables',
      'Le génitif : possession et indications',
      'Les pronoms personnels accusatif/datif',
      'Comparatif et superlatif des adjectifs',
      'Les subordonnées avec dass et weil',
    ],
    B1: [
      'Le Präteritum : passé écrit', 'La déclinaison des adjectifs',
      'Le passif (Passiv) : formation et usage',
      'Les pronoms relatifs (der, die, das)',
      'Konjunktiv II : conditionnel et politesse',
      'Les connecteurs avancés (obwohl, trotzdem...)',
      'L\'infinitif avec zu', 'Les verbes pronominaux',
      'Les prépositions à régime fixe',
      'Le discours indirect (indirekte Rede)',
    ],
    B2: [
      'Konjunktiv I : discours rapporté formel',
      'Le Plusquamperfekt : antériorité',
      'Les nominalisations (Verb → Nomen)',
      'Particules modales (doch, ja, mal, eben)',
      'Subordonnées complexes avec damit, sodass',
      'La voix passive avancée (Passiv-Ersatzformen)',
      'Les verbes à préfixes : be-, ver-, ent-, zer-',
      'L\'expression de la cause et de la conséquence',
      'Les nuances temporelles avancées',
      'La syntaxe des phrases complexes',
    ],
  },
  conjugation: {
    A1: [
      'Sein et haben : les deux auxiliaires',
      'Le présent régulier (Präsens)',
      'Werden : devenir et plus encore',
      'Les verbes modaux de base (können, müssen)',
      'Les verbes en -ieren (studieren, telefonieren)',
      'Les verbes avec changement de voyelle',
      'L\'impératif (du, ihr, Sie)',
      'Les verbes en -t et -d (arbeiten, finden)',
      'Wollen et möchten : nuances',
      'Les verbes essentiels du quotidien',
    ],
    A2: [
      'Le Perfekt avec haben',
      'Le Perfekt avec sein',
      'Les verbes séparables au Perfekt',
      'Les participes irréguliers fréquents',
      'Le Präteritum de sein, haben, werden',
      'Les verbes pronominaux au présent',
      'Tous les verbes modaux maîtrisés',
      'Les verbes inséparables (be-, ver-, er-, ent-)',
      'Verbes forts les plus fréquents',
      'L\'impératif avancé',
    ],
    B1: [
      'Le Präteritum des verbes forts',
      'Le Konjunktiv II au présent',
      'Le Konjunktiv II au passé',
      'Le Plusquamperfekt : usage',
      'Le futur (Futur I) avec werden',
      'Le passif au présent',
      'Le passif au passé',
      'Les verbes à régime (warten auf, denken an)',
      'Les verbes mixtes (kennen, denken, bringen)',
      'Verbes pronominaux : tous les temps',
    ],
    B2: [
      'Le Konjunktiv I : discours indirect',
      'Le Futur II : antériorité dans le futur',
      'Le passif d\'état (Zustandspassiv)',
      'Les Modalverben au Konjunktiv II',
      'Les substituts du passif',
      'Verbes rares au Präteritum',
      'Les nominalisations verbales',
      'Verbes avec double régime',
      'Verbes archaïques de la littérature',
      'Le subjonctif passé',
    ],
  },
  spelling: {
    A1: [
      'Les majuscules des noms',
      'Les umlauts (ä, ö, ü)',
      'Le ß : quand et comment',
      'L\'alphabet allemand prononcé',
      'Les noms composés : règles de base',
    ],
    A2: [
      'ß vs ss : la règle expliquée',
      'Voyelles longues vs courtes',
      'Les noms composés courants',
      'La ponctuation allemande',
      'Les abréviations courantes (z.B., u.a., usw.)',
    ],
    B1: [
      'Les nuances ähnlich / ehnlich',
      'dass vs das : la confusion classique',
      'Les mots empruntés et leur orthographe',
      'La nouvelle orthographe (Rechtschreibreform)',
      'Les pièges fréquents des francophones',
    ],
    B2: [
      'Orthographe des mots scientifiques',
      'Les mots étrangers intégrés (Sportler → Sportlerin)',
      'La virgule dans les phrases complexes',
      'Anglicismes et leur écriture',
      'L\'orthographe de l\'allemand suisse vs allemand standard',
    ],
  },
  expression: {
    A1: [
      'Se saluer en allemand',
      'Se présenter en 5 phrases',
      'Demander son chemin',
      'Au restaurant : phrases utiles',
      'Faire un achat : les essentiels',
    ],
    A2: [
      'Exprimer ses goûts et préférences',
      'Raconter sa journée',
      'Parler de sa famille',
      'Inviter et accepter une invitation',
      'S\'excuser et remercier formellement',
    ],
    B1: [
      'Donner son opinion poliment',
      'Argumenter dans une discussion',
      'Exprimer le doute et la certitude',
      'Faire des hypothèses',
      'Exprimer ses émotions avec nuance',
    ],
    B2: [
      'Le langage des affaires : e-mails formels',
      'Présenter un projet à l\'oral',
      'Argumenter dans un débat',
      'Expressions idiomatiques avancées',
      'Le registre soutenu vs familier',
    ],
  },
  culture: {
    A1: [
      'Les pays germanophones',
      'Les grandes villes : Berlin, Vienne, Zurich',
      'Les fêtes traditionnelles',
      'La cuisine allemande de base',
    ],
    A2: [
      'Le système scolaire allemand',
      'Les transports en Allemagne',
      'Noël en Allemagne (Weihnachten)',
      'La musique allemande populaire',
      'Le sport en Allemagne',
    ],
    B1: [
      'Histoire moderne : la réunification',
      'Le système politique allemand',
      'La littérature allemande classique',
      'Le cinéma allemand contemporain',
      'L\'art allemand : du Bauhaus à aujourd\'hui',
    ],
    B2: [
      'La philosophie allemande (Kant, Hegel, Nietzsche)',
      'Le débat sur l\'immigration',
      'L\'écologie en Allemagne (Energiewende)',
      'Les médias allemands : panorama',
      'La culture du Mittelstand',
    ],
  },
};

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { level, category } = req.query;

  if (!level || !category) {
    // Renvoie toute la structure si pas de filtres
    return res.status(200).json({
      success: true,
      suggestions: SUGGESTIONS,
      categories: Object.keys(SUGGESTIONS),
      levels: ['A1', 'A2', 'B1', 'B2'],
    });
  }

  if (!['A1', 'A2', 'B1', 'B2'].includes(level)) {
    return res.status(400).json({ error: 'Niveau invalide' });
  }
  if (!SUGGESTIONS[category]) {
    return res.status(400).json({ error: 'Catégorie invalide', validCategories: Object.keys(SUGGESTIONS) });
  }

  return res.status(200).json({
    success: true,
    level,
    category,
    suggestions: SUGGESTIONS[category][level] || [],
  });
}
