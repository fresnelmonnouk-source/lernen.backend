// api/user-profile.js
// Gérer le profil utilisateur (lire, mettre à jour, compléter l'onboarding)
//
// GET   /api/user-profile           → récupère le profil
// PATCH /api/user-profile           → met à jour (nom, niveau, préférences)
//
// Headers : Authorization: Bearer <supabase_jwt>

import { handleCors } from './_lib/deepseek.js';
import { requireAuth } from './_lib/supabase.js';

const VALID_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const VALID_FORMATS = ['short', 'standard', 'long'];

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { user, supabase } = auth;

  try {
    // ============ GET : récupérer le profil ============
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ 
          error: 'Profil introuvable',
          message: 'Le profil sera créé automatiquement à la première connexion.'
        });
      }

      // Stats globales du user
      const [coursesRes, examsRes, certsRes] = await Promise.all([
        supabase.from('course_history').select('id, exam_score', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('exam_history').select('id, score', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('certification_history').select('id, score, passed', { count: 'exact' }).eq('user_id', user.id),
      ]);

      const stats = {
        courses_total: coursesRes.count || 0,
        courses_completed: (coursesRes.data || []).filter(c => c.exam_score !== null).length,
        exams_total: examsRes.count || 0,
        certs_total: certsRes.count || 0,
        certs_passed: (certsRes.data || []).filter(c => c.passed).length,
      };

      return res.status(200).json({
        success: true,
        profile: {
          ...data,
          email: user.email,
          email_confirmed: !!user.email_confirmed_at,
        },
        stats,
      });
    }

    // ============ PATCH : mettre à jour ============
    if (req.method === 'PATCH' || req.method === 'POST') {
      const updates = {};
      const body = req.body || {};

      // Validation et nettoyage
      if (body.display_name !== undefined) {
        if (typeof body.display_name !== 'string' || body.display_name.length < 1 || body.display_name.length > 50) {
          return res.status(400).json({ error: 'Nom invalide (1-50 caractères)' });
        }
        updates.display_name = body.display_name.trim();
      }

      if (body.current_level !== undefined) {
        if (!VALID_LEVELS.includes(body.current_level)) {
          return res.status(400).json({ error: 'Niveau invalide', validLevels: VALID_LEVELS });
        }
        updates.current_level = body.current_level;
      }

      if (body.target_certification !== undefined) {
        if (body.target_certification && typeof body.target_certification !== 'string') {
          return res.status(400).json({ error: 'Certification cible invalide' });
        }
        updates.target_certification = body.target_certification || null;
      }

      if (body.preferred_course_format !== undefined) {
        if (body.preferred_course_format && !VALID_FORMATS.includes(body.preferred_course_format)) {
          return res.status(400).json({ error: 'Format invalide' });
        }
        updates.preferred_course_format = body.preferred_course_format || null;
      }

      // Marquer l'onboarding comme terminé si nom + niveau renseignés
      if (updates.display_name && updates.current_level) {
        updates.onboarding_completed = true;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        profile: data,
      });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });

  } catch (error) {
    console.error('User profile error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
