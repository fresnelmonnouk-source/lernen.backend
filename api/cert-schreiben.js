// api/cert-schreiben.js
// Génère un sujet Schreiben (expression écrite) inspiré du format Goethe-Institut
//
// POST body : {
//   level: "A1" | "A2" | "B1" | "B2",
//   task: 1 | 2 | 3   // numéro de tâche
// }

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const SCHREIBEN_SPECS = {
  A1: {
    duration_minutes: 20,
    tasks: {
      1: {
        type: 'form_filling',
        description: 'Remplir un formulaire simple avec des informations personnelles fictives.',
        word_count_min: 30,
        word_count_max: 50,
      },
      2: {
        type: 'short_message',
        description: 'Écrire un court message (SMS, carte postale, e-mail très simple) sur un sujet quotidien.',
        word_count_min: 25,
        word_count_max: 40,
      }
    }
  },
  A2: {
    duration_minutes: 30,
    tasks: {
      1: {
        type: 'email_personal',
        description: 'Écrire un e-mail personnel à un ami ou membre de la famille (invitation, remerciement, raconter un événement).',
        word_count_min: 30,
        word_count_max: 50,
      },
      2: {
        type: 'email_semiformal',
        description: 'Écrire un e-mail semi-formel (à un voisin, collègue) pour demander, s\'excuser ou s\'informer.',
        word_count_min: 30,
        word_count_max: 50,
      }
    }
  },
  B1: {
    duration_minutes: 60,
    tasks: {
      1: {
        type: 'email_formal',
        description: 'Écrire un e-mail formel sur une situation concrète (réservation, plainte, demande d\'information).',
        word_count_min: 80,
        word_count_max: 120,
      },
      2: {
        type: 'forum_post',
        description: 'Écrire un commentaire/contribution dans un forum en ligne pour donner son opinion sur un sujet de société.',
        word_count_min: 80,
        word_count_max: 120,
      },
      3: {
        type: 'private_message',
        description: 'Écrire un message privé pour raconter, s\'excuser ou expliquer une situation à un proche.',
        word_count_min: 40,
        word_count_max: 60,
      }
    }
  },
  B2: {
    duration_minutes: 75,
    tasks: {
      1: {
        type: 'argumentative_text',
        description: 'Écrire un texte argumentatif (lettre ouverte, blog, tribune) sur un sujet de société, en présentant son opinion étayée.',
        word_count_min: 150,
        word_count_max: 200,
      },
      2: {
        type: 'formal_email',
        description: 'Écrire un e-mail très formel (administration, employeur, université) avec demande complexe et registre soutenu.',
        word_count_min: 100,
        word_count_max: 150,
      }
    }
  },
};

const SYSTEM_PROMPT = `Tu es un créateur de sujets d'épreuve Schreiben d'allemand, inspiré du format Goethe-Zertifikat.

MISSION : Générer UN sujet d'expression écrite original et authentique.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Le sujet est en ALLEMAND (comme dans le vrai test).
3. Donne aussi une traduction française pour aider le candidat à comprendre.
4. Pour les e-mails, fournis un destinataire/contexte clair.
5. Pour les sujets argumentatifs B1-B2, propose un sujet d'actualité ou société (écologie, numérique, mobilité, télétravail, immigration, alimentation).
6. Inclus des "elements_to_cover" : 3-4 points obligatoires que le candidat doit traiter (comme dans le vrai test).
7. Précise les critères d'évaluation Goethe :
   - Erfüllung (réalisation de la tâche)
   - Kohärenz (cohérence)
   - Wortschatz (vocabulaire)
   - Strukturen (structures grammaticales)

STRUCTURE JSON :
{
  "level": "...",
  "task_number": N,
  "task_type": "...",
  "duration_minutes": N,
  "word_count": { "min": N, "max": N },
  "instructions_de": "Consigne complète en allemand (comme dans le test officiel).",
  "instructions_fr": "Traduction française des consignes.",
  "context": {
    "scenario": "Mise en situation complète.",
    "recipient": "À qui écrit-on (le cas échéant)",
    "purpose": "But de l'écrit"
  },
  "elements_to_cover": [
    "Point obligatoire 1 (en allemand)",
    "Point obligatoire 2",
    "Point obligatoire 3"
  ],
  "elements_to_cover_fr": [
    "Traduction française",
    "..."
  ],
  "evaluation_criteria": [
    "Erfüllung der Aufgabe",
    "Kohärenz und Zusammenhang",
    "Wortschatz",
    "Grammatikalische Strukturen"
  ],
  "tips": [
    "Conseil pratique 1 en français",
    "Conseil pratique 2"
  ]
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

    const { level, task = 1 } = req.body || {};

    if (!['A1', 'A2', 'B1', 'B2'].includes(level)) {
      return res.status(400).json({ error: 'Niveau invalide' });
    }

    const taskNum = parseInt(task);
    if (!SCHREIBEN_SPECS[level].tasks[taskNum]) {
      return res.status(400).json({
        error: 'Tâche invalide pour ce niveau',
        validTasks: Object.keys(SCHREIBEN_SPECS[level].tasks)
      });
    }

    const spec = SCHREIBEN_SPECS[level].tasks[taskNum];
    const seed = Math.floor(Math.random() * 1000000);

    const userPrompt = `Génère un sujet Schreiben niveau ${level}, tâche ${taskNum} :

SPÉCIFICATIONS :
- Type : ${spec.type}
- Description : ${spec.description}
- Longueur attendue : ${spec.word_count_min}-${spec.word_count_max} mots
- Durée : ${SCHREIBEN_SPECS[level].duration_minutes} min (test complet)

Crée un sujet ORIGINAL, contextualisé, pédagogiquement intéressant. Seed : ${seed}.`;

    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.8,
      useCache: false,
    });

    return res.status(200).json({
      success: true,
      task: result.data,
      disclaimer: "Sujet inspiré du format Goethe-Zertifikat. 100% original. Non affilié au Goethe-Institut.",
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
        usage: result.usage,
      }
    });

  } catch (error) {
    console.error('Cert Schreiben error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
