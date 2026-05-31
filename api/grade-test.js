// api/grade-test.js
// Corrige un test passé par l'utilisateur, note les questions ouvertes avec l'IA
//
// POST body : {
//   test: { ... },               // le test complet retourné par generate-test
//   answers: [                   // les réponses utilisateur
//     { questionId: 1, answer: 2 },                  // QCM : index de l'option
//     { questionId: 2, answer: "ich bin gegangen" }  // ouverte : texte
//   ]
// }
//
// Retourne :
// {
//   score: { correct: N, total: N, percentage: N, grade: "A+/A/B+/B/C/D/E" },
//   results: [
//     { questionId, type, userAnswer, correctAnswer, isCorrect, feedback, points }
//   ],
//   overallFeedback: "Bilan pédagogique...",
//   strengths: [...], weaknesses: [...], recommendations: [...]
// }

import { askDeepSeek, checkRateLimit, getClientIp, handleCors } from './_lib/deepseek.js';

// Système prompt pour la correction des questions ouvertes
const GRADING_SYSTEM_PROMPT = `Tu es un correcteur pédagogique d'allemand pour francophones.

MISSION : Pour chaque question ouverte, déterminer si la réponse de l'utilisateur est correcte (totalement, partiellement, ou pas du tout) et donner un feedback constructif.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT en JSON valide.
2. Pour chaque réponse, évalue : "correct" (totalement correct), "partial" (sens correct mais erreurs mineures), ou "incorrect".
3. Sois INDULGENT sur :
   - Majuscules manquantes (sauf si c'est l'objet de la question)
   - Espaces multiples, ponctuation manquante
   - Variantes orthographiques régionales (Schweizer Standard, etc.)
   - Synonymes acceptables
4. Sois STRICT sur :
   - Genre des noms (der/die/das)
   - Cas (nominatif/accusatif/datif/génitif)
   - Conjugaison (personne, temps)
   - Sens lexical
5. Le feedback est COURT (30-60 mots), pédagogique et bienveillant.
6. "partial" donne 0.5 point, "correct" donne 1 point, "incorrect" donne 0 point.

STRUCTURE JSON attendue :
{
  "graded_answers": [
    {
      "question_id": 2,
      "user_answer": "ich bin gegangen",
      "expected_answer": "du hast dich erinnert",
      "verdict": "incorrect|partial|correct",
      "points": 0|0.5|1,
      "feedback": "Explication courte et constructive."
    }
  ]
}`;

const OVERALL_FEEDBACK_PROMPT = `Tu es un coach d'apprentissage d'allemand pour francophones. 

À partir des résultats du test, génère un bilan pédagogique constructif et personnalisé.

Réponds UNIQUEMENT en JSON :
{
  "overall_feedback": "Bilan général (2-3 phrases, ton bienveillant et motivant).",
  "strengths": ["Force 1 identifiée", "Force 2"],
  "weaknesses": ["Faiblesse 1 identifiée", "Faiblesse 2"],
  "recommendations": [
    "Recommandation concrète 1 (ex: 'Révise les déclinaisons à l'accusatif')",
    "Recommandation concrète 2",
    "Recommandation concrète 3"
  ]
}`;

function calculateGrade(percentage) {
  if (percentage >= 95) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 65) return 'B';
  if (percentage >= 55) return 'C';
  if (percentage >= 40) return 'D';
  return 'E';
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ error: 'Trop de requêtes', resetIn: rateLimit.resetIn });
    }

    const { test, answers } = req.body || {};

    if (!test || !test.questions || !Array.isArray(test.questions)) {
      return res.status(400).json({ error: 'Test invalide' });
    }
    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Réponses invalides' });
    }

    // 1. Correction automatique des QCM
    const results = [];
    const openQuestions = [];
    let totalPoints = 0;

    for (const q of test.questions) {
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
        openQuestions.push({
          question: q,
          user_answer: userAnswer ? String(userAnswer.answer).trim() : '',
        });
      }
    }

    // 2. Correction IA des questions ouvertes (en batch)
    if (openQuestions.length > 0) {
      const userPrompt = `Corrige les ${openQuestions.length} questions ouvertes suivantes :

${openQuestions.map((oq, i) => `
Question ${i + 1} (id: ${oq.question.id}) :
- Énoncé : ${oq.question.question}
- Réponse attendue : ${oq.question.expected_answer}
- Variantes acceptables : ${(oq.question.acceptable_variations || []).join(' / ') || 'aucune'}
- Réponse de l'utilisateur : "${oq.user_answer || '(vide)'}"
`).join('\n')}`;

      const gradingResult = await askDeepSeek({
        systemPrompt: GRADING_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        temperature: 0.1,
        useCache: false,
      });

      const graded = gradingResult.data.graded_answers || [];
      for (const g of graded) {
        const original = openQuestions.find(oq => oq.question.id === g.question_id);
        if (original) {
          totalPoints += g.points;
          results.push({
            question_id: g.question_id,
            type: 'open',
            question: original.question.question,
            user_answer: g.user_answer || original.user_answer,
            correct_answer: g.expected_answer || original.question.expected_answer,
            is_correct: g.verdict === 'correct',
            verdict: g.verdict,
            points: g.points,
            feedback: g.feedback,
          });
        }
      }
    }

    // 3. Tri des résultats par ordre original
    results.sort((a, b) => a.question_id - b.question_id);

    // 4. Calcul du score
    const total = test.questions.length;
    const percentage = Math.round((totalPoints / total) * 100);
    const grade = calculateGrade(percentage);

    // 5. Bilan pédagogique IA
    const summaryPrompt = `Voici les résultats d'un test ${test.domain} niveau ${test.level} difficulté ${test.difficulty} :
- Score : ${totalPoints}/${total} (${percentage}%, note ${grade})
- Détails par question :
${results.map(r => `  Q${r.question_id} (${r.type}) : ${r.is_correct ? '✓' : (r.verdict === 'partial' ? '~' : '✗')} — ${r.question.substring(0, 80)}...`).join('\n')}

Génère un bilan personnalisé.`;

    const summaryResult = await askDeepSeek({
      systemPrompt: OVERALL_FEEDBACK_PROMPT,
      userPrompt: summaryPrompt,
      jsonMode: true,
      temperature: 0.5,
      useCache: false,
    });

    return res.status(200).json({
      success: true,
      score: {
        correct: totalPoints,
        total,
        percentage,
        grade,
      },
      results,
      overall_feedback: summaryResult.data.overall_feedback,
      strengths: summaryResult.data.strengths || [],
      weaknesses: summaryResult.data.weaknesses || [],
      recommendations: summaryResult.data.recommendations || [],
      meta: {
        rateLimit: { remaining: rateLimit.remaining },
      }
    });

  } catch (error) {
    console.error('Grade test error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
