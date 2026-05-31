# 🇩🇪 Lernen — App d'apprentissage de l'allemand avec IA

App d'apprentissage de l'allemand avec module de conjugaison alimenté par **DeepSeek V4**.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│  Frontend       │ ───▶ │  Backend Vercel      │ ───▶ │  DeepSeek V4 API │
│  (HTML/JS pur)  │      │  (Serverless funcs)  │      │                  │
└─────────────────┘      └──────────────────────┘      └──────────────────┘
        │
        └─ 925 mots + 65 verbes pré-conjugués (local, hors-ligne)
```

**Hybride** :
- ✅ **Local** : Vocabulaire (925 mots), 65 verbes pré-conjugués, quiz QCM, Super Quiz
- 🤖 **IA** : Conjugaison de N'IMPORTE QUEL verbe, correction de phrases, exercices générés

## 💰 Coûts estimés

DeepSeek V4 Flash : **$0.14 input / $0.28 output par 1M tokens** (avec cache : **$0.0028 input** — 98% off)

Pour 100 utilisateurs faisant 30 requêtes IA/mois :
- ~**$0.10/mois** avec cache activé 🤯
- DeepSeek offre **5M tokens gratuits** à l'inscription

## 🚀 Déploiement étape par étape

### 1. Cloner le projet localement

```bash
mkdir lernen-de && cd lernen-de
# Copier tous les fichiers du projet ici
```

Structure attendue :
```
lernen-de/
├── api/
│   ├── _lib/deepseek.js
│   ├── conjugate.js
│   ├── correct-sentence.js
│   ├── check-irregular.js
│   └── generate-exercise.js
├── public/
│   ├── index.html        # à intégrer (prochaine étape)
│   ├── data.js
│   └── verbs-data.js
├── package.json
├── vercel.json
├── .env.example
└── README.md
```

### 2. Obtenir une clé DeepSeek API

1. Va sur [platform.deepseek.com](https://platform.deepseek.com)
2. Crée un compte (gratuit, **pas de carte bancaire requise**)
3. Tu reçois **5 millions de tokens gratuits**
4. Dans le dashboard → API Keys → Create new key
5. Copie la clé (commence par `sk-`)

### 3. Installer Vercel CLI

```bash
npm install -g vercel
```

### 4. Tester localement

```bash
# Crée un fichier .env.local
echo "DEEPSEEK_API_KEY=sk-ta-cle-ici" > .env.local
echo "DEEPSEEK_MODEL=deepseek-v4-flash" >> .env.local
echo "RATE_LIMIT_PER_HOUR=50" >> .env.local

# Installe les dépendances
npm install

# Lance le serveur local
vercel dev
```

Ouvre http://localhost:3000

### 5. Tester l'API en local

```bash
# Test conjugaison
curl -X POST http://localhost:3000/api/conjugate \
  -H "Content-Type: application/json" \
  -d '{"verb":"gehen","tense":"Präteritum"}'

# Test verbe irrégulier ?
curl -X POST http://localhost:3000/api/check-irregular \
  -H "Content-Type: application/json" \
  -d '{"verb":"essen"}'

# Test correction de phrase
curl -X POST http://localhost:3000/api/correct-sentence \
  -H "Content-Type: application/json" \
  -d '{"sentence":"Gestern ich gehe ins Kino"}'

# Test génération d'exercice
curl -X POST http://localhost:3000/api/generate-exercise \
  -H "Content-Type: application/json" \
  -d '{"type":"conjugate","level":"A1"}'
```

### 6. Déployer en production

```bash
# Première fois : lier le projet
vercel

# Configurer les variables d'environnement
vercel env add DEEPSEEK_API_KEY        # colle ta clé
vercel env add DEEPSEEK_MODEL          # tape : deepseek-v4-flash
vercel env add RATE_LIMIT_PER_HOUR     # tape : 50
vercel env add ALLOWED_ORIGIN          # tape : * (ou ton domaine)

# Déployer en prod
vercel --prod
```

Tu reçois une URL type `https://lernen-de.vercel.app`.

### 7. Sécuriser pour le lancement public

Une fois en prod, **important** :

1. **Restreindre les origines CORS** : remplace `*` par ton domaine réel
   ```bash
   vercel env rm ALLOWED_ORIGIN
   vercel env add ALLOWED_ORIGIN  # tape : https://ton-domaine.com
   ```

2. **Ajuster le rate limit** selon ton trafic :
   - 50/heure/IP par défaut
   - Pour production publique : 20-30/heure recommandé

3. **Monitorer les coûts** sur platform.deepseek.com

4. **Activer un alerte budgétaire** sur Vercel + DeepSeek

## 📡 Endpoints API

### `POST /api/conjugate`

Conjugue un verbe dans un temps donné.

```json
// Request
{
  "verb": "essen",
  "tense": "Perfekt"
}

// Response
{
  "success": true,
  "verb": "essen",
  "tense": "Perfekt",
  "conjugations": {
    "ich": "habe gegessen",
    "du": "hast gegessen",
    "er_sie_es": "hat gegessen",
    "wir": "haben gegessen",
    "ihr": "habt gegessen",
    "sie_Sie": "haben gegessen"
  },
  "isIrregular": true,
  "auxiliary": "haben",
  "separable": false,
  "notes": "..."
}
```

### `POST /api/check-irregular`

Détermine si un verbe est régulier ou irrégulier.

```json
// Request
{ "verb": "essen" }

// Response
{
  "success": true,
  "verb": "essen",
  "isIrregular": true,
  "type": "stark",
  "principalParts": {
    "infinitiv": "essen",
    "präteritum_er": "aß",
    "perfekt_er": "hat gegessen"
  },
  "vowelChange": "e-a-e (mais 'i' au présent)",
  "explanation": "..."
}
```

### `POST /api/correct-sentence`

Analyse une phrase OU valide la correction de l'utilisateur.

```json
// Mode "analyze" (pas de userCorrection)
{ "sentence": "Gestern ich gehe ins Kino" }

// Réponse :
{
  "success": true,
  "mode": "analyze",
  "isCorrect": false,
  "correctedSentence": "Gestern ging ich ins Kino",
  "errors": [{ "word": "gehe", "correctForm": "ging", ... }],
  "explanation": "..."
}

// Mode "validate" (avec userCorrection)
{
  "sentence": "Gestern ich gehe ins Kino",
  "userCorrection": "Gestern bin ich ins Kino gegangen"
}

// Réponse :
{
  "success": true,
  "mode": "validate",
  "isValid": true,
  "alternativeForms": ["Gestern ging ich ins Kino"],
  "feedback": "Excellente correction !"
}
```

### `POST /api/generate-exercise`

Génère un exercice aléatoire selon le niveau.

```json
// Request
{ "type": "conjugate", "level": "A1" }
// Types : conjugate | irregular_or_not | fix_sentence

// Response (varie selon type)
{
  "success": true,
  "exercise": {
    "type": "conjugate",
    "level": "A1",
    "verb": "gehen",
    "verbFrench": "aller",
    "person": "du",
    "tense": "Präsens",
    "expectedAnswer": "gehst",
    "hint": "..."
  }
}
```

## ⚠️ Limites connues

1. **L'IA peut se tromper** sur les conjugaisons rares (Konjunktiv II, verbes archaïques). Toujours tester.
2. **Latence** : 1-3 secondes par requête. Le cache aide pour les requêtes répétées.
3. **Rate limit en mémoire** : se réinitialise au cold start (acceptable pour démarrer, à remplacer par Redis si besoin).
4. **Modération** : DeepSeek peut refuser certains contenus. À tester.

## 🔐 Sécurité

- ✅ La clé API n'est JAMAIS exposée au frontend
- ✅ Rate limiting par IP (50/h par défaut)
- ✅ Validation stricte des inputs
- ✅ CORS configurable
- ✅ Logs d'erreur sans données sensibles

## 📊 Monitoring

Vérifie régulièrement :
- **Vercel** : Logs, latence, taux d'erreur (vercel.com/dashboard)
- **DeepSeek** : Utilisation tokens, coûts (platform.deepseek.com/usage)

## 🛠️ Prochaines étapes (roadmap)

- [ ] Intégrer le frontend (HTML) avec le module Conjugaison
- [ ] Ajouter un système d'auth (Vercel KV ou Supabase)
- [ ] Mettre Redis pour rate limiting distribué
- [ ] Ajouter analytics (Plausible/Posthog)
- [ ] PWA pour installation mobile
- [ ] Notifications push pour streaks

## 📄 Licence

MIT — utilise librement.
