// api/generate-exercise.js
// Génère un exercice de conjugaison aléatoire
//
// POST body : {
//   type: "conjugate" | "irregular_or_not" | "fix_sentence",
//   level: "A1" | "A2" | "B1" | "B2"
// }
//
// Réponse : exercice structuré selon le type demandé

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

const PROMPTS = {
  conjugate: `Tu es un créateur d'exercices d'allemand. Génère UN exercice de conjugaison aléatoire pour le niveau {level}.

Réponds UNIQUEMENT en JSON :
{
  "type": "conjugate",
  "level": "{level}",
  "verb": "...",          // infinitif allemand
  "verbFrench": "...",    // traduction française
  "person": "...",        // ich, du, er_sie_es, wir, ihr, ou sie_Sie
  "tense": "...",         // Präsens, Präteritum, Perfekt (selon niveau)
  "expectedAnswer": "...", // forme conjuguée attendue
  "hint": "..."           // indice optionnel (max 50 mots)
}

CONTRAINTES par niveau :
- A1 : Präsens uniquement, verbes très fréquents (sein, haben, gehen, machen, etc.)
- A2 : Präsens + Präteritum, verbes courants
- B1 : Präsens + Präteritum + Perfekt, plus de verbes irréguliers
- B2 : Tous temps + Konjunktiv II + verbes complexes`,

  irregular_or_not: `Tu es un créateur d'exercices d'allemand. Génère UN exercice "régulier ou irrégulier" pour le niveau {level}.

Réponds UNIQUEMENT en JSON :
{
  "type": "irregular_or_not",
  "level": "{level}",
  "verb": "...",                  // infinitif
  "verbFrench": "...",            // traduction
  "isIrregular": true|false,      // réponse correcte
  "verbType": "stark|schwach|gemischt|modal",
  "explanation": "..."            // explication courte (max 80 mots)
}

CHOIX du verbe selon niveau :
- A1 : verbes très fréquents (mix régulier/irrégulier 50/50)
- A2 : élargir le vocabulaire
- B1 : verbes moins courants, plus subtils
- B2 : verbes complexes ou rares`,

  fix_sentence: `Tu es un créateur d'exercices d'allemand. Génère UNE phrase allemande contenant UNE erreur de conjugaison de verbe pour le niveau {level}.

Réponds UNIQUEMENT en JSON :
{
  "type": "fix_sentence",
  "level": "{level}",
  "incorrectSentence": "...",     // phrase avec l'erreur
  "correctSentence": "...",       // phrase corrigée
  "errorWord": "...",             // mot mal conjugué
  "correctWord": "...",           // forme correcte
  "translation": "...",           // traduction française
  "explanation": "..."            // explication pédagogique (max 80 mots)
}

CONTRAINTES :
- L'erreur DOIT être uniquement sur la conjugaison d'un verbe (pas ordre des mots, pas déclinaisons).
- Phrase naturelle, du niveau demandé.
- L'erreur doit être plausible (typique d'un apprenant).

EXEMPLES d'erreurs typiques :
- Mauvaise terminaison : "du gehe" → "du gehst"
- Mauvais temps : "Gestern ich gehe" → "Gestern ging ich"
- Auxiliaire wrong : "Ich habe gegangen" → "Ich bin gegangen"
- Participe wrong : "Ich habe gegeht" → "Ich bin gegangen"`,
};

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
    
    const { type, level = 'A1' } = req.body || {};
    
    if (!type || !PROMPTS[type]) {
      return res.status(400).json({ 
        error: 'Type invalide', 
        validTypes: Object.keys(PROMPTS) 
      });
    }
    if (!['A1', 'A2', 'B1', 'B2'].includes(level)) {
      return res.status(400).json({ error: 'Niveau invalide' });
    }
    
    const systemPrompt = PROMPTS[type].replace(/\{level\}/g, level);
    
    // Pour la diversité, on ajoute un seed aléatoire dans le user prompt
    const seed = Math.floor(Math.random() * 100000);
    const userPrompt = `Génère un exercice ${type} de niveau ${level}. Seed: ${seed}. Varie tes choix de verbes.`;
    
    const result = await askDeepSeek({
      systemPrompt,
      userPrompt,
      jsonMode: true,
      temperature: 0.8, // haute température pour la diversité
      useCache: false,  // pas de cache pour la diversité
    });
    
    return res.status(200).json({
      success: true,
      exercise: result.data,
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
        cost: result.usage,
      }
    });
    
  } catch (error) {
    console.error('Generate exercise error:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur',
      message: error.message 
    });
  }
}
