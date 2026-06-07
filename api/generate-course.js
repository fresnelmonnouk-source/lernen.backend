// api/generate-course.js
// Génère un cours structuré sur un sujet d'allemand
// - Évite les doublons en consultant l'historique du user
// - Format au choix : short / standard / long
// - Inclut un mini-examen final
//
// POST body : {
//   topic: "le datif" | "verbes séparables" | ...,
//   category: "vocabulary" | "grammar" | "conjugation" | "spelling" | "expression" | "culture",
//   level: "A1" | "A2" | "B1" | "B2",
//   format: "short" | "standard" | "long"
// }
// Headers : Authorization: Bearer <supabase_jwt>

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';
import { requireAuth, getRecentCourses, saveCourse } from './_lib/supabase.js';

const VALID_CATEGORIES = ['vocabulary', 'grammar', 'conjugation', 'spelling', 'expression', 'culture'];
const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2'];
const VALID_FORMATS = ['short', 'standard', 'long'];

const FORMAT_SPECS = {
  short: {
    duration: 10,
    sections: 2,
    examples_per_section: 2,
    key_points: 3,
    exam_questions: 3,
    max_tokens: 2500,
    description: 'Cours court et focalisé sur l\'essentiel'
  },
  standard: {
    duration: 20,
    sections: 3,
    examples_per_section: 3,
    key_points: 5,
    exam_questions: 5,
    max_tokens: 4500,
    description: 'Cours équilibré avec exemples variés'
  },
  long: {
    duration: 30,
    sections: 4,
    examples_per_section: 4,
    key_points: 7,
    exam_questions: 7,
    max_tokens: 7000,
    description: 'Cours approfondi avec exercices supplémentaires'
  }
};

const SYSTEM_PROMPT = `Tu es un professeur d'allemand passionné, spécialisé dans l'enseignement aux francophones. Tu crées des cours clairs, structurés et engageants.

MISSION : Générer un cours complet sur le sujet demandé, avec une pédagogie progressive et un mini-examen final.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Le cours est en FRANÇAIS avec des exemples en ALLEMAND (toujours traduits).
3. Adapte la complexité au niveau CECRL demandé.
4. Structure progressive : du plus simple au plus complexe.
5. Chaque exemple doit être CONCRET avec traduction et commentaire pédagogique.
6. Les points clés sont des "à retenir" mémorables.
7. Le mini-examen teste UNIQUEMENT ce qui vient d'être enseigné dans le cours.
8. Le mini-examen mélange QCM (60%) et questions ouvertes (40%).
9. SI on te donne un historique de cours, génère un sujet DIFFÉRENT de ceux-là.
10. Le titre est ACCROCHEUR (pas juste "Le datif" mais "Le datif : maîtriser les compléments d'attribution").

STRUCTURE JSON :
{
  "title": "Titre accrocheur du cours",
  "topic": "Sujet exact (court)",
  "category": "...",
  "level": "...",
  "format": "...",
  "estimated_duration_minutes": N,
  "introduction": {
    "objective": "Ce que tu vas apprendre dans ce cours (2-3 phrases motivantes).",
    "prerequisites": "Ce qu'il faut connaître avant (1 phrase). Peut être 'aucun'.",
    "why_important": "Pourquoi c'est utile (1-2 phrases concrètes)."
  },
  "sections": [
    {
      "section_number": 1,
      "title": "Titre de la section",
      "explanation": "Explication claire et pédagogique en français (150-300 mots selon format).",
      "examples": [
        {
          "german": "Phrase ou expression allemande",
          "french": "Traduction française",
          "commentary": "Commentaire pédagogique sur le point précis (50-80 mots)."
        }
      ],
      "common_mistakes": [
        "Erreur fréquente que les francophones font + comment l'éviter (40-60 mots)."
      ]
    }
  ],
  "key_points": [
    "Point clé à retenir 1 (formulation mémorable)",
    "Point clé à retenir 2",
    "..."
  ],
  "mini_exam": {
    "instructions": "Brève consigne avant l'examen.",
    "questions": [
      {
        "id": 1,
        "type": "mcq",
        "question": "Énoncé en français/allemand",
        "options": ["...", "...", "...", "..."],
        "correct_index": 0,
        "explanation": "Pourquoi cette réponse."
      },
      {
        "id": 2,
        "type": "open",
        "question": "Énoncé",
        "expected_answer": "Réponse attendue",
        "acceptable_variations": ["..."],
        "explanation": "..."
      }
    ]
  },
  "next_topics_suggestions": [
    "Sujet logique à étudier ensuite 1",
    "Sujet logique à étudier ensuite 2",
    "Sujet logique à étudier ensuite 3"
  ]
}`;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    // 1. Authentification
    const auth = await requireAuth(req, res);
    if (!auth) return; // 401 déjà envoyé
    const { user, supabase } = auth;

    // 2. Rate limiting par IP
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Trop de requêtes', resetIn: rateLimit.resetIn });
    }

    // 3. Validation des inputs
    const { topic, category, level, format } = req.body || {};
    
    if (!topic || typeof topic !== 'string' || topic.length < 3 || topic.length > 200) {
      return res.status(400).json({ error: 'Sujet invalide (3-200 caractères)' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Catégorie invalide', validCategories: VALID_CATEGORIES });
    }
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ error: 'Niveau invalide', validLevels: VALID_LEVELS });
    }
    if (!VALID_FORMATS.includes(format)) {
      return res.status(400).json({ error: 'Format invalide', validFormats: VALID_FORMATS });
    }

    const spec = FORMAT_SPECS[format];

    // 4. Récupérer l'historique récent pour éviter les doublons
    const recentCourses = await getRecentCourses(supabase, user.id, 15);
    const historyContext = recentCourses.length > 0
      ? `\n\nHISTORIQUE DES COURS RÉCENTS DE CET UTILISATEUR (à NE PAS refaire) :\n${recentCourses.map((c, i) => 
          `${i + 1}. "${c.title}" — sujet: "${c.topic}" (${c.category}, ${c.level}, ${new Date(c.created_at).toLocaleDateString('fr-FR')})`
        ).join('\n')}\n\nVarie l'approche, l'angle pédagogique ou les exemples par rapport à ces cours.`
      : '';

    // 5. Génération du cours
    const seed = Math.floor(Math.random() * 1000000);
    const userPrompt = `Génère un cours sur le sujet suivant pour un apprenant francophone :

SUJET : ${topic}
CATÉGORIE : ${category}
NIVEAU CECRL : ${level}
FORMAT : ${format} — ${spec.description}

SPÉCIFICATIONS DU FORMAT ${format.toUpperCase()} :
- Durée estimée : ${spec.duration} minutes
- Nombre de sections : ${spec.sections}
- Exemples par section : ${spec.examples_per_section}
- Points clés finaux : ${spec.key_points}
- Questions du mini-examen : ${spec.exam_questions} (60% QCM + 40% ouvertes)
${historyContext}

Seed de variation : ${seed}.

Crée un cours pédagogique, structuré, avec des exemples allemands ORIGINAUX et un mini-examen pertinent.`;

    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.7,
      useCache: false,
      maxTokens: spec.max_tokens,
    });

    const courseData = result.data;

    // 6. Sauvegarder dans Supabase (en passant les champs requis)
    let savedCourse;
    try {
      savedCourse = await saveCourse(supabase, user.id, {
        ...courseData,
        topic, category, level, format,
      });
    } catch (saveErr) {
      console.error('Save error (non-fatal):', saveErr);
      // On continue quand même : l'utilisateur a son cours
    }

    return res.status(200).json({
      success: true,
      course: courseData,
      course_id: savedCourse?.id || null,
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
        usage: result.usage,
        avoided_duplicates: recentCourses.length,
      }
    });

  } catch (error) {
    console.error('Generate course error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
