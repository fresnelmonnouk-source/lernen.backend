# 🗄️ Configuration Supabase — Guide complet

Setup en **~30 minutes** : DB + Auth (Email + Google) + confirmation e-mail.

---

## 1. Créer un compte et un projet Supabase

1. [supabase.com](https://supabase.com) → **Start your project** (connexion GitHub recommandée)
2. **New project** :
   - **Name** : `lernen-de`
   - **Database Password** : génère un mot de passe fort → **garde-le précieusement**
   - **Region** : `Frankfurt (eu-central-1)` (meilleure latence depuis Europe/Afrique)
   - **Plan** : Free
3. Attendre ~2 min de provisionnement

---

## 2. Exécuter le schéma SQL

1. Menu de gauche : **SQL Editor** → **New query**
2. Ouvre `supabase/schema.sql` du projet, copie tout
3. Colle dans l'éditeur → **Run** (Ctrl+Enter)
4. ✅ "Success" attendu

**Vérification** : menu **Table Editor**, tu dois voir :
- `user_profiles`
- `course_history`
- `exam_history`
- `certification_history`

---

## 3. Récupérer les clés API

Menu **Settings** (engrenage) → **API** :

| Clé | Usage | Sensibilité |
|-----|-------|-------------|
| **Project URL** | Backend + Frontend | Publique |
| **anon / public** key | Frontend (auth flow) | Publique |
| **service_role** key | Backend Vercel uniquement | ⚠️ **ULTRA SECRÈTE** |

---

## 4. Configurer la confirmation d'e-mail (obligatoire dès l'inscription)

Menu **Authentication** → **Providers** → **Email** :

✅ Cocher :
- **Enable Email provider**
- **Confirm email** ← **important** : impose la vérification

Menu **Authentication** → **Email Templates** → personnaliser si tu veux :
- "Confirm signup" : e-mail envoyé après inscription
- Texte par défaut : OK pour démarrer
- Personnalisation possible (langue, branding) plus tard

---

## 5. Configurer Google OAuth (gratuit)

### A. Côté Google Cloud Console (15 min)

1. Va sur [console.cloud.google.com](https://console.cloud.google.com)
2. **Créer un projet** : "Lernen DE" (ou utilise un projet existant)
3. Menu : **APIs et services** → **Écran de consentement OAuth**
   - Type : **Externe** (sauf si tu as Google Workspace)
   - Nom de l'app : `Lernen.de`
   - E-mail de support : ton e-mail
   - Logo (optionnel)
   - Domaines autorisés : ton-domaine.vercel.app
   - Scopes : `email`, `profile`, `openid`
   - Utilisateurs de test : ajoute ton e-mail (en mode "test", limité à 100 users)
   - **Publier l'app** quand prêt pour la prod (validation Google ~2-3 jours)

4. Menu : **APIs et services** → **Identifiants** → **Créer des identifiants** → **ID client OAuth 2.0**
   - Type d'application : **Application Web**
   - Nom : `Lernen.de Supabase`
   - URI de redirection autorisées :
     ```
     https://xxxxx.supabase.co/auth/v1/callback
     ```
     (remplace `xxxxx` par l'ID de ton projet Supabase)
5. **Créer** → tu récupères :
   - **Client ID**
   - **Client Secret**

### B. Côté Supabase

1. **Authentication** → **Providers** → **Google**
2. **Enable Google provider** : ON
3. Colle **Client ID** et **Client Secret**
4. **Save**

✅ Fait. Les utilisateurs verront un bouton "Continuer avec Google" qui les connecte en 1 clic.

---

## 6. Apple Sign In — Pour plus tard (V2)

⚠️ **Apple exige un compte développeur à 99€/an**. Recommandation :
- **V1 (maintenant)** : Email + Google suffisent (~85-90% du marché)
- **V2 (quand l'app a de la traction)** : Ajouter Apple

Quand tu seras prêt, voici les étapes (ne fais pas maintenant) :
1. [developer.apple.com](https://developer.apple.com) → Apple Developer Program → s'inscrire (99€/an)
2. Créer un **App ID** + **Services ID** avec "Sign in with Apple" activé
3. Créer une **Sign in with Apple Key** (.p8 file)
4. Configurer dans Supabase Auth Providers → Apple
5. Coût total : 99€/an + ~1h de config

---

## 7. URLs de redirection

Menu **Authentication** → **URL Configuration** :

```
Site URL : http://localhost:3000        (en dev)
           https://ton-domaine.vercel.app  (en prod)

Redirect URLs (ajouter toutes celles utilisées) :
http://localhost:3000/**
https://ton-domaine.vercel.app/**
```

---

## 8. Configuration Vercel

```bash
# En local : crée .env.local
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
DEEPSEEK_API_KEY=sk-xxx...
DEEPSEEK_MODEL=deepseek-v4-flash

# En prod
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add DEEPSEEK_API_KEY
vercel env add DEEPSEEK_MODEL
```

---

## 9. Tester

### Test 1 : Endpoint public (sans auth)
```bash
curl https://ton-app.vercel.app/api/course-suggestions?level=A2&category=grammar
```

### Test 2 : Inscription d'un user de test
Dans le dashboard Supabase : **Authentication** → **Users** → **Add user** → "Send invitation"
Ou via le frontend (à venir).

### Test 3 : Endpoint authentifié
```bash
# Après login dans la console JS du navigateur :
# const { data } = await supabase.auth.signInWithPassword({email, password});
# console.log(data.session.access_token);

curl -X POST https://ton-app.vercel.app/api/generate-course \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TON_JWT" \
  -d '{
    "topic": "Les articles définis",
    "category": "grammar",
    "level": "A1",
    "format": "standard"
  }'
```

---

## ✅ Checklist avant lancement public

- [ ] Schéma SQL exécuté + tables visibles
- [ ] **Confirm email** activé
- [ ] Google OAuth configuré et testé
- [ ] URLs de redirection configurées (dev + prod)
- [ ] Variables d'environnement Vercel en place
- [ ] **service_role key** jamais exposée au frontend
- [ ] RLS activée sur toutes les tables (auto via schema)
- [ ] CORS restreint au domaine en prod (pas `*`)
- [ ] Rate limiting ajusté (20-30/h)
- [ ] Template d'e-mail de confirmation testé (vérifier qu'il arrive en boîte de réception, pas en spam)

---

## 🆘 Problèmes fréquents

**"Email not confirmed" au login** → Normal, l'utilisateur doit cliquer sur le lien dans son e-mail.

**E-mail de confirmation en SPAM** → Configurer un domaine custom pour les e-mails Supabase (Settings → Email).

**"redirect_uri_mismatch" avec Google** → L'URI dans Google Console doit EXACTEMENT correspondre à `https://[ton-projet].supabase.co/auth/v1/callback`.

**"new row violates RLS policy"** → L'authentification ne fonctionne pas. Vérifier que le JWT est bien envoyé dans le header.

**Limites Free dépassées** → Migration vers Pro ($25/mois) ou optimisation des requêtes.

---

## 📊 Limites du plan Free (rappel)

| Ressource | Limite |
|-----------|--------|
| DB Storage | 500 Mo |
| Bandwidth | 5 Go/mois |
| MAU (Monthly Active Users) | 50 000 |
| Auth users | Illimité |
| API requests | Illimité |
