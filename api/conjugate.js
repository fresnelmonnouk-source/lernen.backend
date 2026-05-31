// api/conjugate.js
// Conjugue un verbe allemand dans un temps et une personne donnés
// 
// POST body : {
//   verb: "gehen",                     // infinitif
//   tense: "Präteritum",               // temps
//   person: "ich" | "alle"             // personne (ou "alle" pour toutes)
// }
//
// Réponse : {
//   verb, tense, conjugations: { ich, du, er_sie_es, wir, ihr, sie_Sie },
//   isIrregular, auxiliary, separable, notes
// }

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const VALID_TENSES = [
  'Präsens', 'Präteritum', 'Perfekt', 'Plusquamperfekt',
  'Futur I', 'Futur II', 'Konjunktiv I', 'Konjunktiv II', 'Imperativ'
];

const SYSTEM_PROMPT = `Tu es un expert en grammaire allemande. Tu conjugues des verbes avec une précision absolue.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide, sans texte autour.
2. Inclus TOUJOURS les 6 personnes : ich, du, er_sie_es, wir, ihr, sie_Sie.
3. Pour le Perfekt et Plusquamperfekt, inclus l'auxiliaire (haben/sein) + participe.
4. Pour les verbes séparables (aufstehen), sépare le préfixe au Präsens/Präteritum.
5. isIrregular = true pour les verbes forts (changement de voyelle au radical).
6. auxiliary = "haben" ou "sein" pour le Perfekt.
7. notes = explication brève en français des particularités (max 100 mots).

EXEMPLE de réponse pour "gehen" au Präteritum :
{
  "verb": "gehen",
  "tense": "Präteritum",
  "conjugations": {
    "ich": "ging",
    "du": "gingst",
    "er_sie_es": "ging",
    "wir": "gingen",
    "ihr": "gingt",
    "sie_Sie": "gingen"
  },
  "isIrregular": true,
  "auxiliary": "sein",
  "separable": false,
  "notes": "Verbe fort. Changement de voyelle e→i. Auxiliaire sein car verbe de mouvement."
}`;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  try {
    // Rate limit
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: 'Trop de requêtes. Réessaie dans 1 heure.',
        resetIn: rateLimit.resetIn 
      });
    }
    
    const { verb, tense, person } = req.body || {};
    
    // Validation
    if (!verb || typeof verb !== 'string' || verb.length > 50) {
      return res.status(400).json({ error: 'Verbe invalide' });
    }
    if (!tense || !VALID_TENSES.includes(tense)) {
      return res.status(400).json({ 
        error: 'Temps invalide', 
        validTenses: VALID_TENSES 
      });
    }
    
    // Nettoyage : ne garder que des lettres allemandes
    const cleanVerb = verb.trim().toLowerCase().replace(/[^a-zäöüß]/g, '');
    if (!cleanVerb) {
      return res.status(400).json({ error: 'Verbe invalide après nettoyage' });
    }
    
    const userPrompt = `Conjugue le verbe "${cleanVerb}" au ${tense}.`;
    
    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.1, // basse température pour précision grammaticale
    });
    
    return res.status(200).json({
      success: true,
      ...result.data,
      meta: {
        fromCache: result.fromCache || false,
        rateLimit: { remaining: rateLimit.remaining },
      }
    });
    
  } catch (error) {
    console.error('Conjugate error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
