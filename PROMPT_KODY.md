# 📋 LERNEN.DE — Document de transfert de projet

**Pour : Kody, Lead Developer AI**
**De : Équipe précédente**
**Date : Mai 2026**

---

## 🎯 Mission

Reprendre le développement de **Lernen.de**, une application mobile web d'apprentissage de l'allemand pour francophones, alimentée par l'IA DeepSeek V4. L'objectif est de la **lancer publiquement** comme un produit viable.

L'app est destinée à un public francophone (utilisateurs principalement européens et africains francophones) qui veut apprendre l'allemand sérieusement, jusqu'à passer des certifications officielles (Goethe-Zertifikat).

---

## 📐 Vue d'ensemble de l'architecture

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (HTML/CSS/JS pur — pas de framework)             │
│  Mobile-first · PWA-ready · Design Néo-Bauhaus brutaliste   │
└──────────────────────────────────┬──────────────────────────┘
                                   │
                ┌──────────────────┴───────────────────┐
                ▼                                      ▼
   ┌────────────────────────┐         ┌────────────────────────┐
   │   Backend Vercel        │         │      Supabase          │
   │   (Serverless funcs)    │         │                        │
   │                         │         │   - Auth (Email +      │
   │   14 endpoints API      │ ◄─────► │     Google OAuth)      │
   │   en Node.js (ES6)      │         │   - PostgreSQL DB      │
   │                         │         │   - Row Level Security │
   │   Appelle DeepSeek V4   │         │                        │
   └──────────┬─────────────┘         └────────────────────────┘
              │
              ▼
   ┌────────────────────────┐
   │   DeepSeek V4 API       │
   │   ($0.14/$0.28 par 1M)  │
   │   ~$3/mois pour 100 MAU │
   └────────────────────────┘
```

**Stack technique :**
- **Frontend** : HTML5 + CSS3 (vanilla) + JS ES6 (modules globaux, pas de bundler)
- **Backend** : Node.js 18+ sur Vercel Serverless Functions
- **DB + Auth** : Supabase (PostgreSQL + Auth)
- **IA** : DeepSeek V4 Flash (compatible OpenAI SDK)
- **Hébergement** : Vercel (Hobby Plan gratuit) + Supabase Free Tier

---

## 🎨 STRUCTURE DES MENUS — NOUVELLE HIÉRARCHIE (à implémenter)

**⚠️ IMPORTANT** : La structure des menus a évolué. La version actuelle du frontend a **4 menus principaux**, mais la décision finale est de passer à **2 menus principaux avec sous-menus** :

```
┌─────────────────────────────────────────────────────────┐
│                   ÉCRAN D'ACCUEIL                       │
│                                                         │
│   ┌─────────────────┐      ┌─────────────────┐         │
│   │                 │      │                 │         │
│   │   APPRENDRE     │      │     TESTER      │         │
│   │                 │      │                 │         │
│   └─────────────────┘      └─────────────────┘         │
│                                                         │
└─────────────────────────────────────────────────────────┘

APPRENDRE (sous-menus)
├── 📖 COURS
│   └── Cours générés par IA (génération, écoute, mini-examen)
│       Catégories : vocabulaire, grammaire, conjugaison, 
│                    orthographe, expression, culture
│       Format : court (10 min) / standard (20 min) / long (30 min)
│       Inclut historique + suggestions
│       (anciennement menu "Cours")
│
└── 🎴 DÉCOUVRIR
    ├── Vocabulaire (1377 mots en flashcards par catégorie+niveau)
    └── Conjugaison (98 verbes pré-conjugués + consultation IA)
        - Consulter (afficher conjugaison d'un verbe)
        - Tableau à remplir (quiz aléatoire)
        - Régulier ou irrégulier ? (avec explication IA)
    (anciennement menu "Apprendre")


TESTER (sous-menus)
├── 🎲 QUIZ
│   ├── Quiz rapide (QCM 10 questions sur le vocabulaire)
│   ├── Super Quiz (écriture libre du mot allemand)
│   ├── Quiz quotidien (1 quiz par jour, basé sur l'historique)
│   └── (À étendre par Kody : autres types de quiz)
│
└── 🎯 EXAMEN
    ├── Test IA (examen personnalisé, choix domaine/niveau/diff/nb questions)
    │   Sauvegarde dans exam_history
    │
    └── Préparation Certification (format Goethe inspiré)
        ├── Lesen ✅ (compréhension écrite, 4 parties B1)
        ├── Schreiben ✅ (expression écrite, correction 4 critères Goethe)
        ├── Hören 🔒 V2 (à implémenter avec OpenAI TTS)
        └── Sprechen 🔒 V2 (à implémenter avec Whisper)
```

**Avantages de cette nouvelle structure :**
1. Plus claire pédagogiquement : "j'apprends" vs "je me teste"
2. Meilleure expansion possible (ajouter des types de quiz/examens facilement)
3. Moins de choix initial = moins de friction utilisateur
4. Hiérarchie cohérente avec le parcours d'apprentissage

---

## 🎨 DESIGN SYSTEM — NÉO-BAUHAUS BRUTALISTE

**⚠️ RÉFÉRENCE OBLIGATOIRE** : Le fichier `lernen-bauhaus.html` (joint au ZIP) est le **design de référence**. Le CSS actuel (`public/styles.css`) est plus minimaliste et **doit être refait** pour matcher l'esprit Bauhaus.

### Palette de couleurs (variables CSS)

```css
:root {
  --cream: #F4F0E6;      /* Fond principal */
  --cream-2: #ECE5D2;
  --cream-3: #DDD3B8;
  --ink: #0A0A0A;        /* Noir principal */
  --ink-2: #1F1F1F;
  --paper: #FFFFFF;
  --red: #E63946;
  --yellow: #FFD60A;
  --blue: #1E40AF;
  --green: #16A34A;
  --der: #1E40AF;        /* Article masculin */
  --die: #E63946;        /* Article féminin */
  --das: #16A34A;        /* Article neutre */
}

/* Niveaux CECRL */
--level-A1: var(--green);
--level-A2: var(--yellow);
--level-B1: var(--red);
--level-B2: #9333EA;  /* violet */
```

### Typographie (Google Fonts)

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

- **Bricolage Grotesque** (800, uppercase) → titres, brand, boutons
- **DM Serif Display** (italic) → accents élégants, traductions
- **JetBrains Mono** → labels techniques, metadonnées, eyebrows

### Effets visuels signature

```css
--shadow: 4px 4px 0 var(--ink);       /* Ombre dure standard */
--shadow-sm: 2px 2px 0 var(--ink);    /* Ombre subtile */
--shadow-lg: 6px 6px 0 var(--ink);    /* Ombre prononcée */
--shadow-xl: 8px 8px 0 var(--ink);    /* Ombre brutale */
--border: 2.5px solid var(--ink);     /* Bordure standard */
--border-thin: 1.5px solid var(--ink); /* Bordure fine */
```

**JAMAIS d'ombres avec blur (pas de `filter: blur` ni `0 0 10px rgba(0,0,0,0.1)`)**. Toujours des ombres dures décalées en pixels nets.

### Background pattern (signature)

```css
body {
  background: var(--cream);
  background-image:
    repeating-linear-gradient(0deg, transparent 0, transparent 40px, rgba(10,10,10,0.025) 40px, rgba(10,10,10,0.025) 41px),
    repeating-linear-gradient(90deg, transparent 0, transparent 40px, rgba(10,10,10,0.025) 40px, rgba(10,10,10,0.025) 41px);
  background-attachment: fixed;
}
```

C'est cette grille très subtile qui donne l'identité Bauhaus à l'app.

### Composants signature

**1. Brand mark**
```html
<div class="brand-mark">LERNEN<em>.de</em></div>
```
- "LERNEN" en uppercase Bricolage 800, 30px, letter-spacing serré
- ".de" en DM Serif italic, 400, rouge

**2. Hero card (page d'accueil)**
- Fond `var(--ink)` (noir), texte `var(--cream)`
- Décorations géométriques en arrière-plan : 
  - **Cercle rouge** (`--red`) 200×200px, top-right, débordant
  - **Carré jaune** (`--yellow`) 60×60px, bottom-right, rotation 15°
- **Hero-number** : grand chiffre 88px Bricolage 800 avec slash italic jaune en DM Serif
- Eyebrow : monospace 10px uppercase tracking large

**3. Action cards (menus principaux)**
- Couleur de fond pleine (jaune/rouge/bleu/vert)
- **Gros numéro** 56px Bricolage 800 à gauche (style "01", "02", "03", "04")
- Titre uppercase Bricolage 700 18px sous le numéro
- Petite flèche SVG en coin haut-droit
- Au hover : translate(-2px,-2px) + ombre plus grande
- Au active : translate(3px,3px) + ombre presque nulle (effet "appuyé")

**4. List items**
- Fond `--paper`, bordure 2.5px, ombre 2px 2px
- À gauche : **marker carré 48×48px** avec lettre/icône
  - Couleurs disponibles : `.list-mark.red`, `.yellow`, `.blue`, `.ink`, `.green`
- Texte : titre uppercase Bricolage 700, sous-titre JetBrains Mono 10px
- À droite : flèche → 22px Bricolage 800

**5. Streak tag**
```html
<div class="streak-tag">🔥 5j</div>
```
- Fond jaune, bordure 2.5px, ombre 2px
- **Rotation -2°** (signature visuelle)
- JetBrains Mono 12px 700

**6. Badges achievements (6 par ligne)**
- Grille 6 colonnes, aspect-ratio 1
- Désactivés : opacity 0.35 + grayscale(100%)
- Actifs : couleurs Bauhaus + animation badgePop
- Couleurs cyclées (yellow par défaut, red 2n, blue 3n, green 5n)

**7. Section header**
```html
<div class="section-head">
  <h2 class="section-title">CARTES <em>récentes</em></h2>
  <span class="section-count">12</span>
</div>
```
- Titre uppercase + accent serif italic rouge inline
- Count badge noir avec texte cream

### Modes sombre

Variables CSS bascules :
```css
[data-theme="dark"] {
  --cream: #0A0A0A;
  --cream-2: #181818;
  --ink: #F4F0E6;
  --paper: #181818;
  /* ... ombres restent visibles */
}
```

Toggle via `document.documentElement.setAttribute('data-theme', 'dark')`.

---

## 📦 ÉTAT ACTUEL DU PROJET

### ✅ Backend complet (14 endpoints API)

Tous opérationnels, déployables sur Vercel :

**Menu Cours (5 endpoints)**
- `POST /api/generate-course` — Génère cours structuré + mini-examen, évite doublons via historique
- `POST /api/grade-course-exam` — Corrige le mini-examen final
- `GET/DELETE /api/course-history` — Liste/supprime cours utilisateur
- `GET /api/course-suggestions` — 220 sujets pré-curés (sans IA)
- `GET/PATCH /api/user-profile` — Profil utilisateur + stats

**Module Conjugaison (4 endpoints)**
- `POST /api/conjugate` — Conjugue verbe arbitraire dans un temps
- `POST /api/correct-sentence` — Corrige phrase mal conjuguée
- `POST /api/check-irregular` — Détermine régulier/irrégulier + explication
- `POST /api/generate-exercise` — Génère exercice aléatoire

**Module Examen IA (2 endpoints)**
- `POST /api/generate-test` — Génère test personnalisé (70% QCM + 30% ouvert)
- `POST /api/grade-test` — Corrige test + bilan IA

**Module Certification (3 endpoints)**
- `POST /api/cert-lesen` — Génère test Lesen format Goethe
- `POST /api/cert-schreiben` — Génère sujet Schreiben
- `POST /api/grade-schreiben` — Corrige selon 4 critères Goethe officiels

Tous incluent : rate limiting 50/h par IP, cache mémoire (98% économie), validation stricte, gestion CORS.

### ✅ Supabase (DB + Auth)

**4 tables avec RLS activée :**
- `user_profiles` (display_name, current_level, streak_days, onboarding_completed, etc.)
- `course_history` (cours générés + scores examens)
- `exam_history` (examens IA passés)
- `certification_history` (tests Goethe)

**Auth configurée :**
- Email + mot de passe avec confirmation email obligatoire
- Google OAuth (gratuit)
- Apple Sign In reporté en V2 (99€/an de compte développeur Apple requis)

**Trigger automatique** : Profil créé à l'inscription avec nom + niveau si fournis dans metadata.

Voir `supabase/schema.sql` pour le schéma complet et `SUPABASE_SETUP.md` pour la configuration.

### ⚠️ Frontend partiellement fait (à reprendre)

**Ce qui existe (mais avec design SIMPLIFIÉ, à refaire en Bauhaus brutaliste) :**
- `index.html` — Structure 4 menus (ancienne hiérarchie)
- `styles.css` — Design respectant les principes Bauhaus mais **trop minimaliste**
- `app.js` — Bootstrap, navigation, helpers (API, toast, modal)
- `auth.js` — Signup/Login/Reset (Email + Google) ✅ Fonctionnel
- `cours.js` — Module Cours complet ✅ Fonctionnel
- `apprendre.js` — Vocab + Quiz + Conjugaison ✅ Fonctionnel
- `examen.js` — Examen IA complet ✅ Fonctionnel
- `certification.js` — Lesen + Schreiben complets ✅ Fonctionnel
- `config.js` — Configuration à remplir
- `manifest.json` — PWA manifest

**Ce qui doit être refait :**
1. **CSS complet** : reprendre à 100% le style de `lernen-bauhaus.html` (grille de fond, hero décorative, action cards avec gros numéros, list items avec markers carrés colorés, badges grid, etc.)
2. **Structure des menus** : passer de 4 menus à 2 grands (Apprendre + Tester) avec sous-menus
3. **Hero d'accueil** : créer une vraie hero card noire avec décorations géométriques et grand numéro de progression
4. **HTML** : adapter index.html à la nouvelle hiérarchie

### ✅ Base de données vocabulaire

- **1377 mots** structurés (noms, verbes, adjectifs, prépositions, expressions)
- **98 verbes pré-conjugués** (Präsens + Präteritum + Perfekt × 6 personnes)
- Tous avec niveaux CECRL (A1/A2/B1/B2)
- Format compact JS : `{f, d, a, l, e, i}`

---

## 🛠️ CE QU'IL RESTE À FAIRE (priorisé)

### 🔴 P0 — Critique pour le lancement

**1. Refonte CSS complète en Bauhaus brutaliste**
- Reprendre exactement le style de `lernen-bauhaus.html`
- Garder les variables CSS de base mais enrichir massivement
- Ajouter la grille de fond signature
- Reproduire les composants : hero décorative, action cards 56px, list items markers carrés
- Estimation : 1-2 jours de travail

**2. Restructuration des menus**
- Modifier `index.html` : 2 menus principaux (Apprendre + Tester) au lieu de 4
- Créer écran intermédiaire avec sous-menus pour chaque grand menu
- Mettre à jour `app.js` pour la nouvelle navigation
- Estimation : 1 jour

**3. Configuration Supabase + Vercel par l'utilisateur final**
- L'utilisateur doit créer son projet Supabase, exécuter le schema SQL
- Configurer Google OAuth dans Supabase
- Déployer le backend sur Vercel avec les variables d'environnement
- Documentation déjà rédigée : `SUPABASE_SETUP.md`, `README.md`
- Tester chaque endpoint avec curl

**4. Tester l'app de bout en bout**
- Signup → confirmation email → onboarding → premier cours → examen
- Vérifier la persistance Supabase
- Tester sur mobile (Chrome iOS/Android)

### 🟡 P1 — Important pour la qualité

**5. Quiz quotidien** (nouvelle feature à créer)
- Endpoint backend pour générer 1 quiz par jour basé sur l'historique
- Stocker dans une nouvelle table `daily_quiz_history`
- Notification (en V2) si app non ouverte un jour
- Logique : tirer 5 mots des cours récents ou des erreurs précédentes

**6. Super Quiz** (à étendre)
- Mode écriture libre : afficher mot français, l'utilisateur tape le mot allemand exact
- Correction stricte (article + orthographe)
- Mode "speed run" optionnel avec chronomètre

**7. Page profil étendue**
- Modifier niveau, format préféré de cours
- Historique global avec graphique de progression
- Streak tracker avec calendrier
- Export des données utilisateur (RGPD)
- Suppression de compte

**8. Améliorer l'onboarding**
- Mini test de placement optionnel (5 questions pour déterminer le niveau)
- Ou "Je ne sais pas → mini test" qui valide A1/A2/B1

### 🟢 P2 — Nice to have (V1.5)

**9. Notifications email**
- Welcome email avec premier cours suggéré
- Rappel après 3 jours d'inactivité
- Félicitations à 7/30/100 jours de streak
- Utiliser les templates Supabase Auth ou un service comme Resend

**10. SEO et landing page publique**
- Page d'accueil non connectée avec features, témoignages, pricing
- Meta tags Open Graph
- Sitemap, robots.txt
- Schema.org markup

**11. Analytics**
- Plausible.io ou Posthog (privacy-friendly)
- Tracker : signups, cours générés, taux de complétion, taux d'erreur
- Pas de Google Analytics (lourd + privacy)

### 🔵 V2 — Évolutions majeures

**12. Hören (compréhension orale)**
- Intégrer OpenAI TTS API (~$15/1M caractères)
- Voix allemandes natives (alloy, echo)
- Endpoint `/api/cert-hoeren` qui génère dialogue/monologue + audio
- Player audio custom dans le frontend
- Coût estimé : +$30-50/mois pour 100 utilisateurs

**13. Sprechen (expression orale)**
- Web Speech API (navigateur, gratuit) ou Whisper API
- L'utilisateur parle → transcription → IA évalue
- Endpoint `/api/cert-sprechen` qui génère sujet + grille évaluation
- Difficile à noter précisément (l'IA évalue contenu/fluidité, pas accent)

**14. Apple Sign In**
- Inscription Apple Developer Program (99€/an)
- Configuration Services ID + Sign in with Apple Key
- Ajouter bouton dans `auth.js` (côté Supabase, le code backend est déjà compatible)

**15. PWA avancée**
- Service Worker pour mode hors-ligne (vocabulaire au minimum)
- Push notifications (avec Web Push API)
- Installation prompt natif iOS/Android

**16. Internationalisation**
- L'app est actuellement en français pour francophones apprenant l'allemand
- Pour grandir : adapter pour anglophones, hispanophones, etc.
- Architecture i18n avec fichiers de traduction JSON

---

## 🚀 SETUP COMPLET (pour Kody)

### 1. Cloner le projet et installer

```bash
# Décompresser le ZIP
tar -xzf lernen-de-full.tar.gz
cd lernen-v2

# Installer les dépendances Node
npm install

# Installer Vercel CLI globalement
npm install -g vercel
```

### 2. Configurer Supabase (15 min)

Suivre `SUPABASE_SETUP.md` étape par étape :
1. Créer projet sur supabase.com
2. Exécuter `supabase/schema.sql` dans SQL Editor
3. Configurer Email + Google OAuth dans Authentication > Providers
4. Activer "Confirm email" obligatoire
5. Récupérer les 3 clés (URL, anon, service_role)

### 3. Configurer DeepSeek (5 min)

1. Compte sur platform.deepseek.com (5M tokens gratuits)
2. Créer une API key
3. Modèle recommandé : `deepseek-v4-flash`

### 4. Configurer Vercel

```bash
# Variables d'environnement
vercel env add DEEPSEEK_API_KEY        # sk-xxx
vercel env add DEEPSEEK_MODEL          # deepseek-v4-flash
vercel env add SUPABASE_URL            # https://xxx.supabase.co
vercel env add SUPABASE_ANON_KEY       # eyJxxx
vercel env add SUPABASE_SERVICE_ROLE_KEY  # eyJxxx (CRITIQUE - jamais exposé)
vercel env add RATE_LIMIT_PER_HOUR     # 50
vercel env add ALLOWED_ORIGIN          # * en dev, ton-domaine.com en prod
```

### 5. Configurer le frontend

Éditer `public/config.js` avec les URLs Supabase publiques.

### 6. Déployer

```bash
# Dev local
vercel dev

# Production
vercel --prod
```

### 7. Tester

```bash
# Endpoint public (sans auth)
curl https://ton-app.vercel.app/api/course-suggestions?level=A2&category=grammar

# Endpoint authentifié (après login frontend)
curl -X POST https://ton-app.vercel.app/api/generate-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_DU_USER" \
  -d '{"topic":"Le datif","category":"grammar","level":"A2","format":"standard"}'
```

---

## 💰 COÛTS DÉTAILLÉS

### En dev (gratuit)
- Vercel Hobby : gratuit
- Supabase Free : gratuit (500 Mo DB, 50k MAU)
- DeepSeek : 5M tokens offerts à l'inscription
- **Total : $0**

### Production 100 MAU
- Vercel Hobby : $0 (suffisant)
- Supabase Free : $0 (suffisant)
- DeepSeek V4 Flash : ~$3/mois (avec cache à 98% off)
- **Total : ~$3/mois**

### Production 10 000 MAU
- Vercel Pro : $20/mois (recommandé pour la bande passante)
- Supabase Pro : $25/mois (au-delà des limites Free)
- DeepSeek : ~$50/mois
- **Total : ~$95/mois**

### Avec V2 (Hören + Sprechen)
- Ajouter OpenAI TTS : +$30-50/mois pour 100 MAU
- Whisper API : +$20/mois
- **Total V2 100 MAU : ~$50-80/mois**

---

## ⚖️ CONSIDÉRATIONS LÉGALES IMPORTANTES

### Copyright Goethe-Institut

**⚠️ CRITIQUE** : Ne JAMAIS reproduire les vrais sujets d'examen Goethe. Tous les tests "Préparation Certification" sont **inspirés du format** (publiquement documenté sur goethe.de) mais le **contenu est 100% original** généré par DeepSeek.

Le disclaimer doit apparaître clairement : *"Tests inspirés du format Goethe-Zertifikat. Contenus originaux. Non affilié au Goethe-Institut."*

### Données personnelles (RGPD)

- L'utilisateur doit pouvoir **exporter ses données** (à implémenter dans le profil)
- L'utilisateur doit pouvoir **supprimer son compte** (Supabase fait la cascade automatique via ON DELETE CASCADE)
- Privacy Policy obligatoire avant lancement public
- Cookies : seulement les essentiels (auth Supabase). Pas de tracking sans consentement.

### Modération de contenu

- DeepSeek peut générer du contenu inattendu sur certains sujets sensibles
- Tester les prompts système pour s'assurer qu'aucun contenu inapproprié n'est généré
- Implémenter un signalement utilisateur en cas de problème (à faire en V1.5)

---

## 🧠 DÉCISIONS PRISES ET POURQUOI

### Pourquoi DeepSeek V4 et pas OpenAI/Claude ?

- **Prix** : DeepSeek V4 Flash à $0.14/1M input vs GPT-4o-mini à $0.15/1M (équivalent), mais Claude Haiku à $0.25 et GPT-4 à $2.50
- **Performance** : V4 est sorti avril 2026, très bon sur les tâches de langue
- **Cache à 98% off** : énorme économie sur les prompts système répétés
- **5M tokens gratuits** à l'inscription sans carte bancaire

Si Kody veut switcher, l'architecture est compatible OpenAI : juste changer la `baseURL` dans `api/_lib/deepseek.js`.

### Pourquoi pas de framework (React/Vue/Svelte) ?

- **Mobile-first** : app doit charger vite, même sur connexions lentes (utilisateurs africains/européens divers)
- **PWA simple** : HTML/CSS/JS pur s'installe en PWA sans build step
- **Maintenabilité** : pas de chaîne de build, pas de versions npm à gérer, pas de bundler
- **Performances** : 0 framework = 0 JS overhead, juste 30 Ko de scripts custom

Si Kody veut moderniser : passer à **Svelte** ou **Vue 3 + Vite** est faisable, mais probablement pas prioritaire.

### Pourquoi Supabase et pas Firebase ?

- **Open source** : Supabase est open-source, on peut self-host plus tard
- **SQL** : PostgreSQL est plus puissant que Firestore pour des requêtes complexes
- **Auth gratuit** : auth gratuit jusqu'à 50k MAU vs Firebase qui devient cher
- **Régions européennes** : meilleur pour RGPD et latence depuis l'Europe/Afrique
- **Pricing prévisible** : Free Tier généreux + Pro à $25 vs Firebase qui scale en facture

### Pourquoi pas de framework UI (Tailwind, etc.) ?

- Le design Néo-Bauhaus est **trop spécifique** pour Tailwind (qui pousse vers un design générique)
- Variables CSS suffisent pour le theming
- Si Kody veut Tailwind plus tard : possible mais devra recréer toutes les classes custom

---

## 📂 STRUCTURE DU PROJET (à connaître)

```
lernen-v2/
├── api/                             # Backend Vercel
│   ├── _lib/
│   │   ├── deepseek.js             # Helper IA + rate limit + cache
│   │   └── supabase.js             # Helper auth JWT + requireAuth
│   ├── cert-lesen.js               # Génère test Lesen
│   ├── cert-schreiben.js           # Génère sujet Schreiben
│   ├── check-irregular.js          # Vérifie verbe régulier/irrégulier
│   ├── conjugate.js                # Conjugue n'importe quel verbe
│   ├── correct-sentence.js         # Corrige phrase mal conjuguée
│   ├── course-history.js           # CRUD historique cours
│   ├── course-suggestions.js       # Catalogue 220 sujets
│   ├── generate-course.js          # Génère cours + mini-examen
│   ├── generate-exercise.js        # Génère exercice conjugaison
│   ├── generate-test.js            # Génère test personnalisé
│   ├── grade-course-exam.js        # Corrige mini-examen de cours
│   ├── grade-schreiben.js          # Corrige Schreiben (4 critères)
│   ├── grade-test.js               # Corrige test + bilan IA
│   └── user-profile.js             # Get/update profil
│
├── public/                          # Frontend statique
│   ├── index.html                  # Structure principale
│   ├── styles.css                  # ⚠️ À REFAIRE en Bauhaus brutaliste
│   ├── config.js                   # À remplir avec clés Supabase
│   ├── app.js                      # Bootstrap + navigation
│   ├── auth.js                     # Signup/Login Email+Google
│   ├── cours.js                    # Module Cours
│   ├── apprendre.js                # Vocab + Quiz + Conjugaison
│   ├── examen.js                   # Examen IA
│   ├── certification.js            # Goethe Lesen + Schreiben
│   ├── data.js                     # 1377 mots de vocabulaire
│   ├── verbs-data.js               # 98 verbes pré-conjugués
│   ├── manifest.json               # PWA manifest
│   └── preview.html                # Preview statique (peut être supprimé)
│
├── supabase/
│   └── schema.sql                  # Schéma DB complet à exécuter
│
├── reference-design/                # ⚠️ NOUVEAU : Référence design
│   └── lernen-bauhaus.html         # LE design à reproduire
│
├── package.json                    # Dépendances Node
├── vercel.json                     # Config Vercel
├── .env.example                    # Variables d'env exemple
├── README.md                       # Documentation générale
├── API_ENDPOINTS.md                # Documentation des 14 endpoints
├── SUPABASE_SETUP.md               # Setup Supabase détaillé
├── AUTH_FLOW.md                    # Scénarios d'authentification
└── PROMPT_KODY.md                  # CE FICHIER
```

---

## 🎯 ROADMAP SUGGÉRÉE (pour Kody)

### Semaine 1 — Refonte design
- Jour 1-2 : Étudier `lernen-bauhaus.html` et extraire le CSS
- Jour 3-4 : Refaire `styles.css` complet en mode Bauhaus brutaliste
- Jour 5 : Tester chaque écran avec le nouveau CSS

### Semaine 2 — Restructuration menus
- Jour 1-2 : Modifier `index.html` pour la hiérarchie Apprendre/Tester
- Jour 3-4 : Mettre à jour `app.js` pour la navigation à 2 niveaux
- Jour 5 : Tester de bout en bout

### Semaine 3 — Setup + Tests
- Jour 1 : Aider l'utilisateur à configurer Supabase
- Jour 2 : Aider à déployer sur Vercel
- Jour 3-5 : Tests intensifs, fix de bugs, beta testing

### Semaine 4 — Features manquantes
- Jour 1-3 : Quiz quotidien + Super Quiz amélioré
- Jour 4-5 : Page profil étendue

### Semaine 5+ — Lancement
- Polish final, copywriting, screenshots, page d'accueil publique
- Beta avec amis/famille
- Lancement public progressif

---

## 💬 CONSEILS DE STYLE DE CODE

L'utilisateur est francophone (Togo) et préfère :
- **Code commenté en français** quand explication métier (conjugaison, grammaire allemande)
- **Code commenté en anglais** pour la logique technique pure
- **Variables et noms de fonctions en anglais** (standard de l'industrie)
- **Messages utilisateur en français**

Style de communication :
- Honnête sur les limites et les coûts
- Proactif sur les questions de copyright et de RGPD
- Pédagogique : expliquer le "pourquoi" avant le "comment"

---

## 🔧 PROMPTS DEEPSEEK SYSTÈME (référence)

Les prompts système utilisés dans le backend sont pédagogiquement réglés. Si Kody veut les améliorer, voici les principes :

1. **JSON mode strict** : toujours `response_format: { type: 'json_object' }`
2. **Pas de contenu copyrighté** : interdiction explicite dans le system prompt
3. **Réponses en français** : tous les feedbacks pédagogiques sont en français
4. **Calibration par niveau** : vocab/grammaire ajustés au niveau CECRL demandé
5. **Anti-doublon** (cours) : envoyer la liste des derniers cours dans le prompt
6. **Diversité** (exercices) : `temperature: 0.7-0.8` + seed aléatoire dans user prompt

---

## 📞 EN CAS DE QUESTION

Si Kody bloque sur quelque chose :

- **Documentation officielle** : 
  - Supabase : https://supabase.com/docs
  - Vercel : https://vercel.com/docs
  - DeepSeek : https://platform.deepseek.com/docs
  - Goethe formats : https://www.goethe.de/de/spr/kup.html
  
- **Communautés** :
  - Discord Supabase : discord.supabase.com (très actif)
  - Stack Overflow tags : `supabase`, `vercel`, `serverless`

---

## ✅ CHECKLIST AVANT LANCEMENT PUBLIC

- [ ] CSS refait en Bauhaus brutaliste à 100%
- [ ] Menus restructurés (Apprendre + Tester)
- [ ] Backend déployé sur Vercel avec toutes les env vars
- [ ] Supabase configuré (DB + Auth Email + Google + Confirm email)
- [ ] Test complet : signup → confirmation → onboarding → cours → examen → certification
- [ ] Rate limiting ajusté à 20-30/h en prod
- [ ] CORS restreint au domaine en prod
- [ ] Privacy Policy + Terms of Service rédigées
- [ ] Disclaimer Goethe sur les pages de certification
- [ ] Page d'accueil publique avec features
- [ ] Tests sur Chrome iOS, Chrome Android, Safari iOS
- [ ] PWA testable (Add to Home Screen)
- [ ] Budgets monitoring activés (DeepSeek + Vercel + Supabase)
- [ ] Email de support configuré

---

## 🎓 PHILOSOPHIE DU PROJET

Lernen.de n'est pas juste une app de vocabulaire de plus. C'est conçu comme un **véritable assistant personnel d'apprentissage** qui :

1. **Comprend ton niveau** (onboarding + adaptatif)
2. **T'apprend** (Cours sur mesure générés par IA)
3. **Te fait pratiquer** (Découvrir : vocab, conjugaison)
4. **Te teste** (Quiz quotidien, Super Quiz, Examens IA)
5. **Te prépare** (Goethe-Zertifikat avec correction professionnelle)

Le différenciateur vs Duolingo/Babbel : **personnalisation totale par IA** + **préparation certification** + **pas de gamification gadget** (juste un streak utile et des badges sobres). Design Bauhaus = identité forte, lisibilité, professionnalisme.

**L'utilisateur final ne paie rien en V1.** Modèle freemium possible en V2 (certification premium à 3-5€/mois).

---

Bonne chance Kody ! Le projet est solide, le backend tourne, la DB est prête. Il reste essentiellement à **rendre le frontend digne du design Bauhaus** et à **restructurer la navigation**. Le reste est de l'incrémental.

— L'équipe précédente 🚀
