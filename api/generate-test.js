// api/generate-test.js
// Génère un test personnalisé selon domaine, niveau, difficulté et nombre de questions
//
// POST body : {
//   domain: "vocabulary" | "grammar" | "spelling" | "conjugation",
//   level: "A1" | "A2" | "B1" | "B2",
//   difficulty: "easy" | "medium" | "hard",
//   questionCount: 10-30
// }

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const VALID_DOMAINS = ['vocabulary', 'grammar', 'spelling', 'conjugation'];
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

const DOMAIN_GUIDANCE = {
  vocabulary: `Vocabulaire allemand : reconnaissance de mots, traduction FR↔DE, synonymes, antonymes, mots dans le contexte d'une phrase. Choix lexical approprié au niveau.`,
  grammar: `Grammaire allemande : déclinaisons (cas N/A/D/G), articles, prépositions et leur cas, ordre des mots, subordonnées, connecteurs, pronoms relatifs, comparatifs/superlatifs.`,
  spelling: `Orthographe allemande : majuscules des noms, ß vs ss, voyelles longues/courtes, mots composés, ponctuation, distinctions ähnlich/ehnlich, dass/das.`,
  conjugation: `Conjugaison allemande : Präsens, Präteritum, Perfekt selon niveau. Verbes forts, faibles, mixtes, modaux, séparables, pronominaux. Auxiliaire haben/sein.`,
};

const DIFFICULTY_GUIDANCE = {
  easy: `Niveau d'entrée : mots fréquents, phrases courtes, structures de base. Indices possibles. L'utilisateur doit pouvoir réussir 80%+.`,
  medium: `Niveau standard du CECRL : structures et vocabulaire typiques. Pas d'indices. Réussite attendue 60-70%.`,
  hard: `Niveau exigeant : pièges classiques, faux amis, exceptions, structures complexes. Réussite attendue 40-50%.`,
};

const SYSTEM_PROMPT = `Tu es un expert en pédagogie de l'allemand FLE (français langue étrangère). Tu crées des tests précis et pédagogiques pour des francophones.

MISSION : Générer un test d'évaluation respectant exactement les paramètres demandés.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide, sans texte autour.
2. Mélange QCM (70%) et questions ouvertes (30%) — calcul exact selon le total.
3. Les QCM ont 4 options dont UNE seule correcte, avec des distracteurs plausibles.
4. Les questions ouvertes acceptent plusieurs variantes correctes (acceptable_variations).
5. CHAQUE question a une "explanation" pédagogique en français (50-80 mots).
6. Les énoncés sont en FRANÇAIS, mais le contenu testé est en ALLEMAND.
7. Adapte précisément au niveau CECRL et à la difficulté demandés.
8. Varie les types de questions (pas 10 fois la même structure).
9. Pour conjugaison : précise toujours la personne et le temps attendu.
10. Numérote les questions de 1 à N.

STRUCTURE JSON :
{
  "test_id": "test_unique_id",
  "domain": "...",
  "level": "...",
  "difficulty": "...",
  "question_count": N,
  "estimated_duration_minutes": N,
  "instructions": "Brève consigne en français",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Énoncé en français + élément allemand",
      "options": ["...", "...", "...", "..."],
      "correct_index": 0,
      "explanation": "Pourquoi cette réponse est juste, et pourquoi les autres sont fausses."
    },
    {
      "id": 2,
      "type": "open",
      "question": "Énoncé en français + élément à compléter",
      "expected_answer": "réponse principale attendue",
      "acceptable_variations": ["variante1", "variante2"],
      "explanation": "Explication détaillée."
    }
  ]
}

EXEMPLES de bonnes questions :

QCM vocabulaire A2 medium :
{
  "id": 1, "type": "mcq",
  "question": "Comment traduit-on 'l'environnement' en allemand ?",
  "options": ["die Umgebung", "die Umwelt", "die Umfrage", "die Umkehr"],
  "correct_index": 1,
  "explanation": "'Die Umwelt' = l'environnement (écologie). Attention : 'die Umgebung' = les alentours (lieu), 'die Umfrage' = sondage, 'die Umkehr' = demi-tour. Tous commencent par 'Um-' mais ont des sens très différents."
}

Question ouverte conjugaison B1 medium :
{
  "id": 5, "type": "open",
  "question": "Conjugue 'sich erinnern' (se souvenir) à la 2e personne du singulier (du) au Perfekt.",
  "expected_answer": "du hast dich erinnert",
  "acceptable_variations": ["Du hast dich erinnert", "hast dich erinnert"],
  "explanation": "Verbe pronominal régulier. Au Perfekt : 'haben' (du hast) + pronom réfléchi (dich) + participe passé (erinnert). Notez : pas de 'ge-' car le verbe a un préfixe inséparable 'er-'."
}`;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Trop de requêtes', resetIn: rateLimit.resetIn });
    }

    const { domain, level, difficulty, questionCount } = req.body || {};

    // Validation
    if (!VALID_DOMAINS.includes(domain)) {
      return res.status(400).json({ error: 'Domaine invalide', validDomains: VALID_DOMAINS });
    }
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ error: 'Niveau invalide', validLevels: VALID_LEVELS });
    }
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: 'Difficulté invalide', validDifficulties: VALID_DIFFICULTIES });
    }
    const count = parseInt(questionCount);
    if (!count || count < 10 || count > 30) {
      return res.status(400).json({ error: 'Nombre de questions invalide (5-30)' });
    }

    const seed = Math.floor(Math.random() * 1000000);
    const mcqCount = Math.ceil(count * 0.7);
    const openCount = count - mcqCount;

    const userPrompt = `Génère un test pour un apprenant francophone.

Paramètres :
- Domaine : ${domain}
- Spécificités : ${DOMAIN_GUIDANCE[domain]}
- Niveau CECRL : ${level}
- Difficulté : ${difficulty} — ${DIFFICULTY_GUIDANCE[difficulty]}
- Nombre total de questions : ${count}
- Répartition : ${mcqCount} QCM + ${openCount} questions ouvertes
- Seed de variation : ${seed}

Le test doit être pédagogique, varié et précisément calibré au niveau ${level} en difficulté ${difficulty}.`;

    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.7, // diversité
      useCache: false,  // chaque test doit être unique
    });

    // Ajout d'un test_id côté serveur si manquant
    if (!result.data.test_id) {
      result.data.test_id = `test_${Date.now()}_${seed}`;
    }

    return res.status(200).json({
      success: true,
      test: result.data,
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
        usage: result.usage,
      }
    });

  } catch (error) {
    console.error('Generate test error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
