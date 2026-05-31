// api/_lib/deepseek.js
// Helper pour appeler l'API DeepSeek V4 (compatible OpenAI)

import OpenAI from 'openai';

// Cache simple en mémoire pour les réponses fréquentes
// (réinitialisé à chaque cold start, ce qui est OK pour Vercel)
const responseCache = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 heure
const MAX_CACHE_SIZE = 500;

// Rate limiting par IP (en mémoire, simple)
const rateLimitMap = new Map();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_PER_HOUR || '50');

export function getClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY non configurée');
  }
  return new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

export function getModel() {
  return process.env.DEEPSEEK_MODEL || 'deepseek-v4-flash';
}

// Vérifie le rate limit pour une IP
export function checkRateLimit(ip) {
  const now = Date.now();
  const hourAgo = now - 1000 * 60 * 60;
  
  // Nettoie les vieilles entrées
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter(t => t > hourAgo);
  
  if (requests.length >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, resetIn: 3600 };
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  
  return { 
    allowed: true, 
    remaining: RATE_LIMIT - requests.length,
    resetIn: 3600
  };
}

// Génère une clé de cache à partir du prompt
function cacheKey(prompt, options = {}) {
  return `${prompt}::${JSON.stringify(options)}`;
}

// Récupère du cache (avec TTL)
function getFromCache(key) {
  const entry = responseCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }
  return entry.value;
}

// Met en cache (avec limite de taille)
function setCache(key, value) {
  if (responseCache.size >= MAX_CACHE_SIZE) {
    // Supprime la plus ancienne entrée
    const firstKey = responseCache.keys().next().value;
    responseCache.delete(firstKey);
  }
  responseCache.set(key, { value, timestamp: Date.now() });
}

/**
 * Appel principal à DeepSeek V4
 * - useCache: utilise le cache local si possible
 * - jsonMode: force la réponse JSON (parsée automatiquement)
 */
export async function askDeepSeek({
  systemPrompt,
  userPrompt,
  useCache = true,
  jsonMode = false,
  temperature = 0.3,
}) {
  const cacheK = useCache ? cacheKey(userPrompt, { systemPrompt, jsonMode }) : null;
  
  if (cacheK) {
    const cached = getFromCache(cacheK);
    if (cached) return { ...cached, fromCache: true };
  }
  
  const client = getClient();
  const model = getModel();
  
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });
  
  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    response_format: jsonMode ? { type: 'json_object' } : undefined,
    max_tokens: 1500,
  });
  
  const content = response.choices[0].message.content;
  let result;
  
  if (jsonMode) {
    try {
      result = { 
        data: JSON.parse(content), 
        usage: response.usage,
        model
      };
    } catch (e) {
      throw new Error('Réponse IA invalide (JSON parsing failed)');
    }
  } else {
    result = { 
      text: content, 
      usage: response.usage,
      model
    };
  }
  
  if (cacheK) setCache(cacheK, result);
  
  return result;
}

// Helper pour récupérer l'IP du client depuis Vercel
export function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
    || req.headers['x-real-ip'] 
    || 'unknown';
}

// Helper pour les réponses CORS preflight
export function handleCors(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}
