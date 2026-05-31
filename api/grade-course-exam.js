// api/grade-course-exam.js
// Corrige le mini-examen final d'un cours et met à jour l'historique
//
// POST body : {
//   course_id: "uuid",          // ID du cours dans course_history
//   answers: [                   // réponses utilisateur au mini-examen
//     { questionId: 1, answer: 2 },
//     { questionId: 2, answer: "..." }
//   ]
// }
// Headers : Authorization: Bearer <supabase_jwt>

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';
import { requireAuth } from './_lib/supabase.js';

const GRADING_SYSTEM_PROMPT = `Tu es un correcteur d'allemand bienveillant et pédagogue.

MISSION : Évaluer les réponses ouvertes d'un mini-examen de cours.

RÈGLES :
1. Réponds UNIQUEMENT en JSON valide.
2. Pour chaque réponse ouverte : verdict "correct", "partial" (sens correct, erreurs mineures), ou "incorrect".
3. Indulgent sur : majuscules, ponctuation, synonymes acceptables.
4. Strict sur : genre, cas, conjugaison, sens lexical.
5. Feedback court (30-60 mots), bienveillant, pédagogique.
6. Points : correct=1, partial=0.5, incorrect=0.

STRUCTURE :
{
  "graded_answers": [
    {
      "question_id": N,
      "user_answer": "...",
      "expected_answer": "...",
      "verdict": "correct|partial|incorrect",
      "points": 0|0.5|1,
      "feedback": "..."
    }
  ]
}`;

const FINAL_FEEDBACK_PROMPT = `Tu es un coach d'apprentissage d'allemand.

À partir des résultats du mini-examen de fin de cours, donne un retour court et motivant.

Réponds UNIQUEMENT en JSON :
{
  "verdict": "Excellente compréhension|Bonne compréhension|À renforcer|À revoir",
  "feedback": "Bilan en 2-3 phrases bienveillantes en français.",
  "next_action": "Une recommandation concrète : refaire un cours similaire ? passer au suivant ? réviser un point précis ?"
}`;

function calculateGrade(percentage) {
  if (percentage >= 90) return { mention: 'Excellent', emoji: '🌟', color: 'green' };
  if (percentage >= 75) return { mention: 'Très bien', emoji: '✨', color: 'green' };
  if (percentage >= 60) return { mention: 'Bien', emoji: '👍', color: 'blue' };
  if (percentage >= 40) return { mention: 'Passable', emoji: '🤔', color: 'orange' };
  return { mention: 'À retravailler', emoji: '💪', color: 'red' };
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const auth = await requireAuth(req, res);
    if (!auth) return;
    const { user, supabase } = auth;

    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Trop de requêtes', resetIn: rateLimit.resetIn });
    }

    const { course_id, answers } = req.body || {};

    if (!course_id) return res.status(400).json({ error: 'course_id requis' });
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers invalide' });

    // 1. Récupérer le cours depuis la DB (RLS vérifie que c'est bien le user)
    const { data: course, error: fetchErr } = await supabase
      .from('course_history')
      .select('*')
      .eq('id', course_id)
      .single();

    if (fetchErr || !course) {
      return res.status(404).json({ error: 'Cours introuvable ou accès refusé' });
    }

    const examQuestions = course.course_data?.mini_exam?.questions || [];
    if (examQuestions.length === 0) {
      return res.status(400).json({ error: 'Pas d\'examen pour ce cours' });
    }

    // 2. Correction automatique des QCM + collecte des ouvertes
    const results = [];
    const openToGrade = [];
    let totalPoints = 0;

    for (const q of examQuestions) {
      const userAnswer = answers.find(a => a.questionId === q.id);

      if (q.type === 'mcq') {
        const userIdx = userAnswer ? parseInt(userAnswer.answer) : null;
        const isCorrect = userIdx === q.correct_index;
        const points = isCorrect ? 1 : 0;
        totalPoints += points;

        results.push({
          question_id: q.id,
          type: 'mcq',
          question: q.question,
          user_answer: userAnswer ? q.options[userIdx] : '(pas de réponse)',
          correct_answer: q.options[q.correct_index],
          is_correct: isCorrect,
          points,
          feedback: q.explanation,
        });
      } else if (q.type === 'open') {
        openToGrade.push({
          question: q,
          user_answer: userAnswer ? String(userAnswer.answer).trim() : '',
        });
      }
    }

    // 3. Correction IA des ouvertes (en batch)
    if (openToGrade.length > 0) {
      const userPrompt = `Corrige ces ${openToGrade.length} réponses :

${openToGrade.map((oq, i) => `
Question ${i + 1} (id: ${oq.question.id}) :
Énoncé : ${oq.question.question}
Réponse attendue : ${oq.question.expected_answer}
Variantes acceptables : ${(oq.question.acceptable_variations || []).join(' / ') || 'aucune'}
Réponse utilisateur : "${oq.user_answer || '(vide)'}"
`).join('\n')}`;

      const gradingResult = await askDeepSeek({
        systemPrompt: GRADING_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        temperature: 0.1,
        useCache: false,
      });

      for (const g of (gradingResult.data.graded_answers || [])) {
        const original = openToGrade.find(oq => oq.question.id === g.question_id);
        if (original) {
          totalPoints += g.points;
          results.push({
            question_id: g.question_id,
            type: 'open',
            question: original.question.question,
            user_answer: g.user_answer || original.user_answer,
            correct_answer: original.question.expected_answer,
            verdict: g.verdict,
            is_correct: g.verdict === 'correct',
            points: g.points,
            feedback: g.feedback,
          });
        }
      }
    }

    results.sort((a, b) => a.question_id - b.question_id);

    // 4. Score et mention
    const total = examQuestions.length;
    const percentage = Math.round((totalPoints / total) * 100);
    const grade = calculateGrade(percentage);

    // 5. Feedback final IA
    const summaryPrompt = `Résultats du mini-examen de fin de cours :
Cours : "${course.title}" (${course.category}, ${course.level})
Score : ${totalPoints}/${total} (${percentage}% — ${grade.mention})
Détails : ${results.map(r => `Q${r.question_id}: ${r.is_correct ? '✓' : (r.verdict === 'partial' ? '~' : '✗')}`).join(', ')}

Donne un retour court et motivant.`;

    const summaryResult = await askDeepSeek({
      systemPrompt: FINAL_FEEDBACK_PROMPT,
      userPrompt: summaryPrompt,
      jsonMode: true,
      temperature: 0.5,
      useCache: false,
    });

    // 6. Mettre à jour la DB
    const examData = {
      answers,
      results,
      summary: summaryResult.data,
    };

    const { error: updateErr } = await supabase
      .from('course_history')
      .update({
        exam_completed: true,
        exam_score: percentage,
        exam_data: examData,
        completed_at: new Date().toISOString(),
      })
      .eq('id', course_id);

    if (updateErr) console.error('Update course error:', updateErr);

    return res.status(200).json({
      success: true,
      score: {
        correct: totalPoints,
        total,
        percentage,
        mention: grade.mention,
        emoji: grade.emoji,
        color: grade.color,
      },
      results,
      summary: summaryResult.data,
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
      }
    });

  } catch (error) {
    console.error('Grade course exam error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
