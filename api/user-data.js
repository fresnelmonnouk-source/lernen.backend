// api/user-data.js
// Données personnelles de l'utilisateur (RGPD)
//
// GET    /api/user-data   → EXPORT (RGPD art. 20 — portabilité)
// DELETE /api/user-data   → SUPPRESSION DU COMPTE (RGPD art. 17 + Apple App Store 5.1.1)
//
// Headers : Authorization: Bearer <supabase_jwt>
// L'id utilisateur est TOUJOURS lu depuis le JWT, jamais d'un paramètre client.

import { handleCors } from './_lib/deepseek.js';
import { requireAuth, getSupabaseAdmin } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  // Auth obligatoire — l'utilisateur n'agit que sur SES propres données.
  const auth = await requireAuth(req, res);
  if (!auth) return; // 401 déjà envoyé
  const { user, supabase } = auth;

  try {
    // ============ EXPORT (RGPD art. 20) ============
    if (req.method === 'GET') {
      // Lecture via le client scoping RLS → ne renvoie que les lignes de l'utilisateur.
      const [profileRes, coursesRes, examsRes, certsRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('course_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('exam_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('certification_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      // Périmètre validé par Helena : identité + 4 tables (JSONB inclus).
      // Exclus par design : hash du mot de passe et tokens de session (jamais exposés ici).
      const data = {
        export_format: 'lernen.de/user-data/v1',
        exported_at: new Date().toISOString(),
        account: {
          id: user.id,
          email: user.email,
          provider: user.app_metadata?.provider || 'email',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed: !!user.email_confirmed_at,
        },
        profile: profileRes.data || null,
        course_history: coursesRes.data || [],
        exam_history: examsRes.data || [],
        certification_history: certsRes.data || [],
      };

      return res.status(200).json({ success: true, data });
    }

    // ============ SUPPRESSION DU COMPTE (RGPD art. 17 + Apple 5.1.1) ============
    if (req.method === 'DELETE') {
      // Suppression DURE de auth.users via service_role.
      // Les 4 tables ont ON DELETE CASCADE sur auth.users(id) → purge automatique.
      // Pas de fichier Storage à nettoyer : avatar_url = URL OAuth externe ou null (aucun upload).
      const admin = getSupabaseAdmin();
      const { error } = await admin.auth.admin.deleteUser(user.id);

      if (error) {
        console.error('deleteUser error:', error);
        return res.status(500).json({ error: 'Suppression impossible. Réessaie dans un instant.' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (error) {
    console.error('user-data error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
