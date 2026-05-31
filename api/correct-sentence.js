// api/correct-sentence.js
// Corrige une phrase allemande dont le verbe est mal conjugué
//
// POST body : {
//   sentence: "Gestern ich gehe ins Kino",
//   userCorrection: "Gestern ging ich ins Kino"  (optionnel - si fourni, valide la correction)
// }
//
// Réponse : {
//   originalSentence, isCorrect, correctedSentence, errors: [...], explanation
// }

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const SYSTEM_PROMPT_GENERATE = `Tu es un correcteur de grammaire allemande spécialisé dans la conjugaison.

MISSION : Analyser une phrase allemande et identifier UNIQUEMENT les erreurs de conjugaison de verbes (pas l'ordre des mots, pas les déclinaisons d'articles, pas les cas).

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Si la phrase est correcte : isCorrect=true, errors=[], correctedSentence=la phrase originale.
3. Si erreur de conjugaison : liste chaque verbe mal conjugué.
4. Pour CHAQUE erreur, donne : { word, position, correctForm, reason }
5. explanation = explication pédagogique en français (max 80 mots).
6. Ignore les autres types d'erreurs (capitalisation, ponctuation, ordre).

EXEMPLE pour "Gestern ich gehe ins Kino" :
{
  "originalSentence": "Gestern ich gehe ins Kino",
  "isCorrect": false,
  "correctedSentence": "Gestern ging ich ins Kino",
  "errors": [
    {
      "word": "gehe",
      "position": 2,
      "correctForm": "ging",
      "reason": "Avec 'gestern' (passé), utiliser le Präteritum 'ging' au lieu du Präsens 'gehe'."
    }
  ],
  "explanation": "Le mot 'gestern' (hier) marque le passé. En allemand écrit, on utilise le Präteritum : 'ging' (allais/suis allé). Le Perfekt 'bin gegangen' serait aussi correct à l'oral."
}`;

const SYSTEM_PROMPT_VALIDATE = `Tu es un correcteur de grammaire allemande.

MISSION : Vérifier si la correction d'un utilisateur est valide.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Plusieurs réponses peuvent être correctes (ex: Perfekt et Präteritum sont souvent interchangeables).
3. Si la correction utilisateur est valide : isValid=true.
4. Sinon : isValid=false + raison + suggestion.
5. Ne tiens compte QUE de la conjugaison des verbes.

EXEMPLE :
Phrase originale (incorrecte) : "Gestern ich gehe ins Kino"
Correction utilisateur : "Gestern bin ich ins Kino gegangen"
Réponse : {
  "isValid": true,
  "alternativeForms": ["Gestern ging ich ins Kino"],
  "feedback": "Excellente correction ! Tu as utilisé le Perfekt, parfait à l'oral. Le Präteritum 'ging' serait aussi correct, surtout à l'écrit."
}`;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: 'Trop de requêtes. Réessaie dans 1 heure.',
        resetIn: rateLimit.resetIn 
      });
    }
    
    const { sentence, userCorrection } = req.body || {};
    
    if (!sentence || typeof sentence !== 'string' || sentence.length > 300) {
      return res.status(400).json({ error: 'Phrase invalide (max 300 caractères)' });
    }
    
    // Si l'utilisateur soumet sa correction, on la valide
    if (userCorrection) {
      if (typeof userCorrection !== 'string' || userCorrection.length > 300) {
        return res.status(400).json({ error: 'Correction invalide' });
      }
      
      const userPrompt = `Phrase originale (incorrecte) : "${sentence}"\nCorrection proposée par l'utilisateur : "${userCorrection}"\n\nLa correction est-elle valide ?`;
      
      const result = await askDeepSeek({
        systemPrompt: SYSTEM_PROMPT_VALIDATE,
        userPrompt,
        jsonMode: true,
        temperature: 0.2,
      });
      
      return res.status(200).json({
        success: true,
        mode: 'validate',
        ...result.data,
        meta: {
          fromCache: result.fromCache || false,
          rateLimit: { remaining: rateLimit.remaining },
        }
      });
    }
    
    // Sinon, on analyse la phrase directement
    const userPrompt = `Analyse cette phrase allemande et identifie les erreurs de conjugaison de verbes :\n\n"${sentence}"`;
    
    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT_GENERATE,
      userPrompt,
      jsonMode: true,
      temperature: 0.2,
    });
    
    return res.status(200).json({
      success: true,
      mode: 'analyze',
      ...result.data,
      meta: {
        fromCache: result.fromCache || false,
        rateLimit: { remaining: rateLimit.remaining },
      }
    });
    
  } catch (error) {
    console.error('Correct sentence error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
