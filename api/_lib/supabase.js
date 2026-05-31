// api/_lib/supabase.js
// Helper pour interagir avec Supabase côté backend Vercel
// - Valider les tokens JWT envoyés par le client
// - Effectuer des opérations DB authentifiées

import { createClient } from '@supabase/supabase-js';

let _supabaseAdmin = null;

// Client admin (service_role key) — bypasse RLS, à utiliser AVEC PRÉCAUTION
export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin;
  
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurés');
  }
  
  _supabaseAdmin = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });
  
  return _supabaseAdmin;
}

// Client utilisateur (basé sur le JWT envoyé) — respecte RLS
export function getSupabaseClient(jwt) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!url || !anonKey) {
    throw new Error('SUPABASE_URL et SUPABASE_ANON_KEY doivent être configurés');
  }
  
  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {}
    }
  });
}

// Extrait le JWT depuis le header Authorization
export function getJwtFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) return null;
  
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Vérifie le JWT et retourne le user, ou null si invalide
export async function verifyUser(req) {
  const jwt = getJwtFromRequest(req);
  if (!jwt) return null;
  
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.auth.getUser(jwt);
    
    if (error || !data?.user) return null;
    return data.user;
  } catch (e) {
    console.error('verifyUser error:', e);
    return null;
  }
}

// Middleware-like : exige un utilisateur authentifié
// Retourne { user, supabase } ou envoie 401 directement
export async function requireAuth(req, res) {
  const user = await verifyUser(req);
  
  if (!user) {
    res.status(401).json({ error: 'Authentification requise' });
    return null;
  }
  
  const jwt = getJwtFromRequest(req);
  const supabase = getSupabaseClient(jwt);
  
  return { user, supabase };
}

// Helper pour récupérer les N derniers cours d'un utilisateur (anti-doublon)
export async function getRecentCourses(supabase, userId, limit = 15) {
  const { data, error } = await supabase
    .from('course_history')
    .select('title, topic, category, level, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('getRecentCourses error:', error);
    return [];
  }
  
  return data || [];
}

// Helper pour sauvegarder un cours
export async function saveCourse(supabase, userId, courseData) {
  const { data, error } = await supabase
    .from('course_history')
    .insert({
      user_id: userId,
      title: courseData.title,
      topic: courseData.topic,
      category: courseData.category,
      level: courseData.level,
      format: courseData.format,
      course_data: courseData,
    })
    .select()
    .single();
  
  if (error) {
    console.error('saveCourse error:', error);
    throw error;
  }
  
  return data;
}
