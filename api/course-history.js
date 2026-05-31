// api/course-history.js
// Gérer l'historique des cours d'un utilisateur
//
// GET   /api/course-history                  → liste tous les cours (titres + meta)
// GET   /api/course-history?id=xxx           → récupère un cours complet
// GET   /api/course-history?limit=10         → limite le nombre
// GET   /api/course-history?category=grammar → filtre par catégorie
// DELETE /api/course-history?id=xxx          → supprime un cours
//
// Headers : Authorization: Bearer <supabase_jwt>

import { handleCors } from './_lib/deepseek.js';
import { requireAuth } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  const auth = await requireAuth(req, res);
  if (!auth) return;
  const { user, supabase } = auth;

  try {
    // ============ DELETE ============
    if (req.method === 'DELETE') {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id requis' });

      const { error } = await supabase
        .from('course_history')
        .delete()
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, deleted: id });
    }

    // ============ GET ============
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Méthode non autorisée' });
    }

    const { id, limit = 50, category, level } = req.query;

    // Récupérer un cours spécifique (complet)
    if (id) {
      const { data, error } = await supabase
        .from('course_history')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Cours introuvable' });
      }

      return res.status(200).json({ success: true, course: data });
    }

    // Sinon : lister
    let query = supabase
      .from('course_history')
      .select('id, title, topic, category, level, format, exam_completed, exam_score, created_at, completed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit) || 50);

    if (category) query = query.eq('category', category);
    if (level) query = query.eq('level', level);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    // Statistiques globales
    const total = data.length;
    const completed = data.filter(c => c.exam_completed).length;
    const avgScore = completed > 0
      ? Math.round(data.filter(c => c.exam_completed).reduce((s, c) => s + (c.exam_score || 0), 0) / completed)
      : null;

    return res.status(200).json({
      success: true,
      courses: data,
      stats: {
        total,
        completed,
        average_score: avgScore,
      }
    });

  } catch (error) {
    console.error('Course history error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
