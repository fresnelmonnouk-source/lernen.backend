# 📡 Documentation des API Endpoints

App Lernen.de — Backend Vercel + DeepSeek V4

## 🎯 Endpoints existants (V1)

### Conjugaison
- **`POST /api/conjugate`** — Conjugue un verbe arbitraire dans un temps donné
- **`POST /api/correct-sentence`** — Corrige une phrase avec verbe mal conjugué
- **`POST /api/check-irregular`** — Détermine si un verbe est régulier/irrégulier
- **`POST /api/generate-exercise`** — Génère un exercice de conjugaison aléatoire

## 🆕 Nouveaux endpoints (V1.5 — Test IA & Préparation Certification)

### Test IA

#### `POST /api/generate-test`
Génère un test personnalisé avec mix QCM (70%) + questions ouvertes (30%).

**Request:**
```json
{
  "domain": "vocabulary",      // vocabulary | grammar | spelling | conjugation
  "level": "B1",                // A1 | A2 | B1 | B2
  "difficulty": "medium",       // easy | medium | hard
  "questionCount": 15           // 5 à 30
}
```

**Response:**
```json
{
  "success": true,
  "test": {
    "test_id": "test_1716...",
    "domain": "vocabulary",
    "level": "B1",
    "difficulty": "medium",
    "question_count": 15,
    "estimated_duration_minutes": 12,
    "instructions": "Répondez à chaque question...",
    "questions": [
      {
        "id": 1,
        "type": "mcq",
        "question": "Comment traduit-on 'l'environnement' en allemand ?",
        "options": ["die Umgebung", "die Umwelt", "die Umfrage", "die Umkehr"],
        "correct_index": 1,
        "explanation": "..."
      },
      {
        "id": 4,
        "type": "open",
        "question": "Conjugue 'gehen' au Perfekt avec 'wir'.",
        "expected_answer": "wir sind gegangen",
        "acceptable_variations": ["Wir sind gegangen", "sind gegangen"],
        "explanation": "..."
      }
    ]
  },
  "meta": { "rateLimit": { "remaining": 49 } }
}
```

#### `POST /api/grade-test`
Corrige le test passé : note automatique des QCM + IA pour les questions ouvertes + bilan personnalisé.

**Request:**
```json
{
  "test": { /* le test complet retourné par generate-test */ },
  "answers": [
    { "questionId": 1, "answer": 2 },                    // QCM : index de l'option choisie
    { "questionId": 4, "answer": "wir sind gegangen" }   // ouverte : texte libre
  ]
}
```

**Response:**
```json
{
  "success": true,
  "score": {
    "correct": 11,
    "total": 15,
    "percentage": 73,
    "grade": "B+"
  },
  "results": [
    {
      "question_id": 1,
      "type": "mcq",
      "user_answer": "die Umwelt",
      "correct_answer": "die Umwelt",
      "is_correct": true,
      "points": 1,
      "feedback": "..."
    },
    {
      "question_id": 4,
      "type": "open",
      "user_answer": "wir sind gegangen",
      "correct_answer": "wir sind gegangen",
      "verdict": "correct",
      "is_correct": true,
      "points": 1,
      "feedback": "Parfait ! Conjugaison correcte."
    }
  ],
  "overall_feedback": "Bon travail ! Tu maîtrises bien le vocabulaire de base...",
  "strengths": ["Vocabulaire courant solide", "Bonne compréhension des articles"],
  "weaknesses": ["Quelques difficultés avec les verbes forts"],
  "recommendations": [
    "Révise les déclinaisons de l'accusatif",
    "Pratique les verbes irréguliers"
  ]
}
```

### Préparation Certification (format Goethe inspiré)

#### `POST /api/cert-lesen`
Génère un test Lesen (compréhension écrite) selon niveau et partie.

**Request:**
```json
{
  "level": "B1",     // A1, A2, B1, B2
  "part": 1          // 1, 2, 3 ou 4 selon niveau
}
```

**Spécifications par niveau:**
- A1 : 3 parties, 25 min total
- A2 : 3 parties, 30 min total
- B1 : 4 parties, 65 min total
- B2 : 3 parties, 65 min total

**Response:**
```json
{
  "success": true,
  "test": {
    "level": "B1",
    "part": 1,
    "format_description": "Article informatif avec 6 questions de compréhension",
    "duration_minutes": 65,
    "instructions": "Lisez le texte et répondez aux questions.",
    "texts": [
      {
        "id": "text_1",
        "title": "Nachhaltige Mobilität in Berlin",
        "content": "In den letzten Jahren..."
      }
    ],
    "questions": [
      {
        "id": 1,
        "question_text": "Welche Aussage trifft auf den Text zu?",
        "type": "mcq",
        "options": ["...", "...", "...", "..."],
        "correct_index": 2,
        "explanation": "..."
      }
    ],
    "passing_score_percentage": 60
  },
  "disclaimer": "Test inspiré du format Goethe. Contenus 100% originaux. Non affilié."
}
```

#### `POST /api/cert-schreiben`
Génère un sujet Schreiben (expression écrite) selon niveau.

**Request:**
```json
{
  "level": "B1",     // A1, A2, B1, B2
  "task": 1          // 1, 2 ou 3 selon niveau
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "level": "B1",
    "task_number": 1,
    "task_type": "email_formal",
    "duration_minutes": 60,
    "word_count": { "min": 80, "max": 120 },
    "instructions_de": "Sie haben in einer Online-Sprachschule...",
    "instructions_fr": "Vous vous êtes inscrit dans une école de langue en ligne...",
    "context": {
      "scenario": "...",
      "recipient": "Service client de l'école",
      "purpose": "Réclamation pour cours non dispensé"
    },
    "elements_to_cover": [
      "Beschreiben Sie das Problem.",
      "Erklären Sie, was Sie erwarten.",
      "Bitten Sie um eine schnelle Antwort."
    ],
    "elements_to_cover_fr": [
      "Décrivez le problème.",
      "Expliquez vos attentes.",
      "Demandez une réponse rapide."
    ],
    "evaluation_criteria": ["Erfüllung", "Kohärenz", "Wortschatz", "Strukturen"],
    "tips": [
      "Utilisez 'Sehr geehrte Damen und Herren' pour ouvrir",
      "Concluez par 'Mit freundlichen Grüßen'"
    ]
  }
}
```

#### `POST /api/grade-schreiben`
Corrige une production Schreiben selon les 4 critères Goethe officiels.

**Request:**
```json
{
  "task": { /* le sujet retourné par cert-schreiben */ },
  "userText": "Sehr geehrte Damen und Herren,\nich habe mich vor einer Woche..."
}
```

**Response:**
```json
{
  "success": true,
  "evaluation": {
    "word_count": 87,
    "scores": {
      "erfuellung": { "points": 22, "max": 25, "comment": "..." },
      "kohaerenz": { "points": 20, "max": 25, "comment": "..." },
      "wortschatz": { "points": 18, "max": 25, "comment": "..." },
      "strukturen": { "points": 19, "max": 25, "comment": "..." }
    },
    "total_score": 79,
    "max_score": 100,
    "mention": "Befriedigend",
    "passed": true,
    "errors": [
      {
        "type": "grammatik",
        "extract": "...habe ich nicht das Kurs bekommen",
        "issue": "Accord en genre : 'der Kurs' donc 'den Kurs' à l'accusatif",
        "correction": "habe ich den Kurs nicht bekommen"
      }
    ],
    "strengths": ["Structure claire", "Bonne utilisation des formules de politesse"],
    "improvements": ["Varier davantage les connecteurs", "Attention aux cas"],
    "improved_version": "Sehr geehrte Damen und Herren, ich habe...",
    "global_feedback": "Très bon travail ! Tu maîtrises les formules formelles...",
    "next_steps": [
      "Révise les cas (Nominativ/Akkusativ/Dativ)",
      "Travaille les connecteurs logiques"
    ]
  }
}
```

## 💰 Coûts estimés (DeepSeek V4 Flash)

| Endpoint | Tokens estimés | Coût/appel |
|----------|----------------|------------|
| generate-test (15 questions) | 800 in / 3000 out | $0.0009 |
| grade-test | 2000 in / 1500 out | $0.0007 |
| cert-lesen | 600 in / 2500 out | $0.0008 |
| cert-schreiben | 400 in / 1500 out | $0.0005 |
| grade-schreiben | 1500 in / 2000 out | $0.0008 |

**Pour 100 utilisateurs actifs (~30 tests/mois chacun)** :
- ~3000 tests × $0.0008 = **~$2.40/mois** au total ✅

## ⚠️ Sur Hören et Sprechen (Version 2)

Ces deux endpoints **ne sont pas encore implémentés**. Quand on les ajoutera :

- **Hören** nécessitera OpenAI TTS ou Google Cloud TTS (~$15/1M caractères)
- **Sprechen** nécessitera Whisper API ou Web Speech API navigateur
- Coût additionnel estimé : **+$30-50/mois** pour 100 utilisateurs actifs

Dans le frontend V1, ces deux options sont **affichées mais désactivées** avec mention "Bientôt disponible".

## 🔒 Disclaimer légal

Tous les tests "Préparation Certification" sont **inspirés du format Goethe-Zertifikat** mais leur contenu est **100% original** généré par IA. Ce projet n'est **pas affilié au Goethe-Institut**. Aucun sujet officiel n'est reproduit.
