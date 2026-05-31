// api/cert-lesen.js
// Génère un test Lesen (compréhension écrite) inspiré du format Goethe-Institut
//
// POST body : {
//   level: "A1" | "A2" | "B1" | "B2",
//   part: 1 | 2 | 3 | 4    // partie du test (chaque niveau a 3-5 parties)
// }
//
// Note : inspiré du format Goethe public, contenus 100% originaux générés par IA.

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];

// Spécifications par niveau, inspirées du format Goethe-Zertifikat (publiquement documenté)
const LESEN_SPECS = {
  A1: {
    duration_minutes: 25,
    parts: {
      1: {
        format: 'Lire des courts messages personnels (cartes postales, SMS, e-mails simples) et répondre par vrai/faux à 5 affirmations.',
        text_length: '50-80 mots',
        questions: 5,
        question_type: 'true_false',
      },
      2: {
        format: 'Lire des petites annonces (immobilier, événement) et choisir laquelle correspond à un besoin (3-4 annonces, 5 situations).',
        text_length: '40-60 mots chacune, 3 annonces',
        questions: 5,
        question_type: 'matching',
      },
      3: {
        format: 'Lire des panneaux, étiquettes, prospectus quotidiens et choisir l\'option vraie/utile.',
        text_length: 'court, 20-40 mots chacun',
        questions: 5,
        question_type: 'mcq',
      },
    }
  },
  A2: {
    duration_minutes: 30,
    parts: {
      1: {
        format: 'Lire un article court (presse simple, blog) et répondre à 5 questions de compréhension.',
        text_length: '150-200 mots',
        questions: 5,
        question_type: 'mcq',
      },
      2: {
        format: 'Lire des petites annonces variées (5 textes) et associer chaque annonce à une personne (7 personnes).',
        text_length: '50-80 mots chacune',
        questions: 5,
        question_type: 'matching',
      },
      3: {
        format: 'Lire des e-mails ou messages personnels et déterminer si des affirmations sont vraies ou fausses.',
        text_length: '100-150 mots',
        questions: 4,
        question_type: 'true_false',
      },
    }
  },
  B1: {
    duration_minutes: 65,
    parts: {
      1: {
        format: 'Lire un blog/forum/article informatif (presse) et répondre à 6 questions de compréhension globale et détaillée.',
        text_length: '300-400 mots',
        questions: 6,
        question_type: 'mcq',
      },
      2: {
        format: 'Lire 2 articles courts sur le même sujet et identifier qui a quelle opinion (8 affirmations, 2 personnes ou "aucun").',
        text_length: '150-200 mots chacun',
        questions: 6,
        question_type: 'matching',
      },
      3: {
        format: 'Lire un texte argumentatif/avis et choisir entre vrai/faux/non mentionné pour 6 affirmations.',
        text_length: '250-350 mots',
        questions: 7,
        question_type: 'three_way',
      },
      4: {
        format: 'Lire 7 petites annonces et associer chacune à 1 des 10 situations de personnes.',
        text_length: '40-60 mots chacune',
        questions: 7,
        question_type: 'matching',
      },
    }
  },
  B2: {
    duration_minutes: 65,
    parts: {
      1: {
        format: 'Lire un article de presse (sujet société/culture/sciences) et répondre à 5 questions de compréhension fine et inférence.',
        text_length: '500-700 mots',
        questions: 5,
        question_type: 'mcq',
      },
      2: {
        format: 'Lire des commentaires de lecteurs sur un sujet et associer chacun à des opinions/positions.',
        text_length: '80-120 mots chacun, 4 commentaires',
        questions: 6,
        question_type: 'matching',
      },
      3: {
        format: 'Lire un texte d\'opinion/éditorial et identifier les arguments de l\'auteur (vrai/faux/non mentionné).',
        text_length: '400-500 mots',
        questions: 6,
        question_type: 'three_way',
      },
    }
  },
};

const SYSTEM_PROMPT = `Tu es un créateur d'épreuves d'allemand inspiré du format Goethe-Zertifikat. Tu produis des contenus 100% ORIGINAUX (jamais copiés des vrais tests).

MISSION : Générer une partie du test Lesen selon le niveau et la spécification donnée.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Le texte ou les textes DOIVENT être ORIGINAUX (jamais d'extrait de vrais examens, d'œuvres, ou de sites copyrightés).
3. Inspire-toi de la VIE QUOTIDIENNE ALLEMANDE moderne : transports, logement, études, travail, loisirs, écologie, technologie, immigration, santé.
4. Le contenu doit RESPECTER strictement le niveau CECRL demandé (vocabulaire, structures).
5. Pour le format "true_false" : exactement 2 options ("richtig"/"falsch").
6. Pour "three_way" : 3 options ("richtig"/"falsch"/"steht nicht im Text").
7. Pour "matching" : associer N éléments avec correctement les bons indices.
8. Pour "mcq" : 4 options dont 1 seule correcte.
9. Chaque question a une "explanation" courte (40-80 mots) en français.

STRUCTURE JSON :
{
  "level": "...",
  "part": N,
  "format_description": "Description du type d'exercice",
  "duration_minutes": N,
  "instructions": "Consignes en français pour le candidat.",
  "texts": [
    {
      "id": "text_1",
      "title": "Titre du texte/annonce (en allemand)",
      "content": "Texte intégral en allemand."
    }
  ],
  "questions": [
    {
      "id": 1,
      "question_text": "Question en allemand (comme dans le vrai test).",
      "type": "mcq|true_false|three_way|matching",
      "options": ["Option 1", "Option 2", ...],
      "correct_index": 0,
      "explanation": "Explication en français : où dans le texte trouve-t-on la réponse, pourquoi telle option et pas une autre."
    }
  ],
  "passing_score_percentage": 60
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

    const { level, part = 1 } = req.body || {};

    if (!LEVELS.includes(level)) {
      return res.status(400).json({ error: 'Niveau invalide', validLevels: LEVELS });
    }
    const partNum = parseInt(part);
    if (!LESEN_SPECS[level].parts[partNum]) {
      return res.status(400).json({
        error: 'Partie invalide pour ce niveau',
        validParts: Object.keys(LESEN_SPECS[level].parts)
      });
    }

    const spec = LESEN_SPECS[level].parts[partNum];
    const seed = Math.floor(Math.random() * 1000000);

    const userPrompt = `Génère la partie ${partNum} d'un test Lesen niveau ${level} :

SPÉCIFICATIONS :
- Format : ${spec.format}
- Longueur du/des texte(s) : ${spec.text_length}
- Nombre de questions : ${spec.questions}
- Type de questions : ${spec.question_type}
- Durée totale du test complet : ${LESEN_SPECS[level].duration_minutes} minutes

CONTRAINTES :
- Contenu 100% ORIGINAL (jamais issu d'un vrai test, livre ou site copyrighté).
- Thème quotidien allemand contemporain.
- Vocabulaire/grammaire strictement niveau ${level}.
- Seed de variation : ${seed}.`;

    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.8,
      useCache: false,
    });

    return res.status(200).json({
      success: true,
      test: result.data,
      disclaimer: "Test inspiré du format Goethe-Zertifikat. Contenus originaux. Non affilié au Goethe-Institut.",
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
        usage: result.usage,
      }
    });

  } catch (error) {
    console.error('Cert Lesen error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
