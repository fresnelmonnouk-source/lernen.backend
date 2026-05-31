// api/grade-schreiben.js
// Corrige une production Schreiben selon les 4 critères Goethe officiels
//
// POST body : {
//   task: { ... },              // le sujet généré par cert-schreiben
//   userText: "Texte produit par le candidat..."
// }
//
// Retourne note sur 100 + détail par critère + corrections + version améliorée

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const SYSTEM_PROMPT = `Tu es un correcteur officiel d'épreuves d'allemand inspiré des standards Goethe-Zertifikat. Tu notes avec rigueur et bienveillance.

MISSION : Évaluer une production écrite selon les 4 critères Goethe et fournir un retour pédagogique complet.

LES 4 CRITÈRES (chacun noté sur 25, total /100) :

1. **Erfüllung** (Réalisation de la tâche) - /25 :
   - Tous les "elements_to_cover" sont-ils traités ?
   - Le format et le ton sont-ils appropriés ?
   - La longueur respecte-t-elle les limites ?

2. **Kohärenz** (Cohérence textuelle) - /25 :
   - Logique entre les phrases et paragraphes
   - Utilisation de connecteurs (aber, deshalb, weil, trotzdem...)
   - Progression naturelle des idées

3. **Wortschatz** (Vocabulaire) - /25 :
   - Richesse et précision du vocabulaire
   - Adaptation au registre (formel/informel)
   - Mots spécifiques au niveau (vs. répétitifs ou trop basiques)

4. **Strukturen** (Structures grammaticales) - /25 :
   - Correction grammaticale (cas, conjugaisons, accords)
   - Variété et complexité des structures
   - Orthographe et ponctuation

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Sois BIENVEILLANT mais HONNÊTE. Ne gonfle pas les notes.
3. Liste précisément les ERREURS spécifiques avec leur position approximative.
4. Donne une VERSION AMÉLIORÉE du texte (en gardant les idées du candidat).
5. Note finale = somme des 4 critères / 100.
6. Mention finale selon Goethe :
   - 90-100 : Sehr gut (Excellent)
   - 80-89 : Gut (Bien)
   - 70-79 : Befriedigend (Satisfaisant)
   - 60-69 : Ausreichend (Suffisant / passable)
   - <60 : Nicht bestanden (Non admis)

STRUCTURE JSON :
{
  "word_count": N,
  "scores": {
    "erfuellung": { "points": N, "max": 25, "comment": "..." },
    "kohaerenz": { "points": N, "max": 25, "comment": "..." },
    "wortschatz": { "points": N, "max": 25, "comment": "..." },
    "strukturen": { "points": N, "max": 25, "comment": "..." }
  },
  "total_score": N,
  "max_score": 100,
  "mention": "Sehr gut|Gut|Befriedigend|Ausreichend|Nicht bestanden",
  "passed": true|false,
  "errors": [
    {
      "type": "grammatik|wortschatz|orthographie|struktur",
      "extract": "Extrait du texte avec l'erreur",
      "issue": "Description de l'erreur en français",
      "correction": "Forme corrigée"
    }
  ],
  "strengths": ["Force 1", "Force 2"],
  "improvements": ["Amélioration suggérée 1", "Amélioration 2"],
  "improved_version": "Version améliorée du texte (gardant les idées du candidat mais correction des erreurs).",
  "global_feedback": "Bilan global en français (3-4 phrases) bienveillant et constructif.",
  "next_steps": [
    "Recommandation concrète 1 (ex: 'Révise les déclinaisons à l'accusatif')",
    "Recommandation concrète 2"
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

    const { task, userText } = req.body || {};

    if (!task || !task.level) {
      return res.status(400).json({ error: 'Sujet (task) invalide' });
    }
    if (!userText || typeof userText !== 'string' || userText.length < 10) {
      return res.status(400).json({ error: 'Texte trop court (minimum 10 caractères)' });
    }
    if (userText.length > 5000) {
      return res.status(400).json({ error: 'Texte trop long (max 5000 caractères)' });
    }

    const wordCount = userText.trim().split(/\s+/).length;

    const userPrompt = `Corrige cette production Schreiben niveau ${task.level} :

=== SUJET ORIGINAL ===
${task.instructions_de || task.instructions || ''}

Points à traiter :
${(task.elements_to_cover || []).map((e, i) => `${i + 1}. ${e}`).join('\n')}

Longueur attendue : ${task.word_count?.min || 50}-${task.word_count?.max || 150} mots

=== PRODUCTION DU CANDIDAT (${wordCount} mots) ===
${userText}

=== INSTRUCTIONS ===
Évalue selon les 4 critères Goethe (Erfüllung, Kohärenz, Wortschatz, Strukturen).
Sois honnête : pénalise les vraies erreurs, mais sois indulgent sur les petites maladresses naturelles.
Adapte ton niveau d'exigence au niveau ${task.level} (un B1 n'est pas un B2).`;

    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.3,
      useCache: false,
    });

    return res.status(200).json({
      success: true,
      evaluation: result.data,
      meta: {
        word_count: wordCount,
        rateLimit: { remaining: rateLimit.remaining },
        usage: result.usage,
      }
    });

  } catch (error) {
    console.error('Grade Schreiben error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
