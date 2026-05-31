// api/check-irregular.js
// Vérifie si un verbe allemand est régulier ou irrégulier, avec explication
//
// POST body : { verb: "essen" }
//
// Réponse : {
//   verb, isIrregular, type, principalParts, vowelChange, explanation
// }

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const SYSTEM_PROMPT = `Tu es un expert en grammaire allemande spécialisé dans les verbes forts (starke Verben).

MISSION : Identifier si un verbe est régulier (faible/schwach) ou irrégulier (fort/stark ou mixte).

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. type = "schwach" (régulier), "stark" (fort), "gemischt" (mixte), ou "modal"
3. Donne TOUJOURS les trois temps principaux : infinitiv, präteritum (er-form), perfekt (er-form avec auxiliaire)
4. vowelChange : décris le changement de voyelle s'il y en a (ex: "e-a-e")
5. explanation : explication pédagogique en français (max 100 mots)

EXEMPLES :

Pour "essen" :
{
  "verb": "essen",
  "isIrregular": true,
  "type": "stark",
  "principalParts": {
    "infinitiv": "essen",
    "präteritum_er": "aß",
    "perfekt_er": "hat gegessen"
  },
  "vowelChange": "e-a-e (mais 'i' au présent : er isst)",
  "explanation": "Verbe fort très irrégulier. Au présent : ich esse, du isst, er isst (changement e→i). Au passé : aß (avec ß). Participe : gegessen (préfixe ge-, double consonne, terminaison -en)."
}

Pour "machen" :
{
  "verb": "machen",
  "isIrregular": false,
  "type": "schwach",
  "principalParts": {
    "infinitiv": "machen",
    "präteritum_er": "machte",
    "perfekt_er": "hat gemacht"
  },
  "vowelChange": null,
  "explanation": "Verbe faible régulier. Conjugaison standard : ajout de -te au passé (machte), participe en ge-...-t (gemacht). Aucun changement de voyelle."
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
        error: 'Trop de requêtes',
        resetIn: rateLimit.resetIn 
      });
    }
    
    const { verb } = req.body || {};
    
    if (!verb || typeof verb !== 'string' || verb.length > 50) {
      return res.status(400).json({ error: 'Verbe invalide' });
    }
    
    const cleanVerb = verb.trim().toLowerCase().replace(/[^a-zäöüß]/g, '');
    if (!cleanVerb) {
      return res.status(400).json({ error: 'Verbe invalide' });
    }
    
    const userPrompt = `Analyse le verbe allemand "${cleanVerb}". Est-il régulier ou irrégulier ?`;
    
    const result = await askDeepSeek({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      jsonMode: true,
      temperature: 0.1,
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
    console.error('Check irregular error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
