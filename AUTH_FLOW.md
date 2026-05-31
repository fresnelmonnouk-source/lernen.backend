# 🔐 Auth Flow — Référence Frontend

Ce document décrit le **parcours utilisateur complet** d'authentification + onboarding, et les **appels Supabase SDK** correspondants. Il sera implémenté dans le frontend.

## 🎬 Scénarios utilisateur

### Scénario 1 : Nouvel utilisateur (Email)

```
1. Visite homepage
   → Voit "S'inscrire" / "Se connecter"
   
2. Clique "S'inscrire"
   → Modal d'inscription :
     - Nom complet
     - E-mail
     - Mot de passe (avec indicateur de force)
     - "OU" → boutons Google / Apple
   
3. Soumet le formulaire
   → Supabase signUp() avec metadata { display_name }
   → Email envoyé automatiquement
   
4. Écran "Vérifie ta boîte mail"
   → "Un lien de confirmation a été envoyé à xxxx@xxx.com"
   → Bouton "Renvoyer l'e-mail"
   
5. Clique sur le lien dans l'e-mail
   → Redirigé vers l'app (URL de callback)
   → Compte activé automatiquement
   
6. Page d'ONBOARDING (premier login)
   → "Bienvenue [Nom] !"
   → "Quel est ton niveau actuel d'allemand ?"
     - A1 : Débutant complet
     - A2 : Bases acquises
     - B1 : Intermédiaire
     - B2 : Avancé
     - "Je ne sais pas" → mini test rapide (3 questions)
   → Update user_profiles avec le niveau
   
7. Accès au menu principal
   → 4 grands menus visibles
```

### Scénario 2 : Nouvel utilisateur (Google)

```
1. Clique "Continuer avec Google"
   → Popup Google OAuth
   
2. Choisit son compte Google + autorise
   → Retour à l'app avec session active
   → display_name récupéré automatiquement depuis Google
   
3. Page d'ONBOARDING (pas besoin de confirmer l'e-mail, Google l'a fait)
   → Demande juste le niveau
   
4. Accès au menu principal
```

### Scénario 3 : Utilisateur existant

```
1. Clique "Se connecter"
   → Modal :
     - E-mail / Mot de passe
     - "OU" → Google / Apple
     - "Mot de passe oublié ?"
   
2. Soumet
   → Session créée, JWT stocké
   → Redirection au menu principal
```

### Scénario 4 : Mot de passe oublié

```
1. Clique "Mot de passe oublié ?"
2. Saisit son e-mail
3. Reçoit un e-mail avec lien de reset
4. Clique → page de nouveau mot de passe
5. Saisit + confirme → connecté
```

## 📦 Code Supabase JS SDK (frontend)

### Initialisation

```javascript
// Dans le HTML
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

// Dans app.js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJxxx...'; // CLÉ PUBLIQUE OK

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Inscription par e-mail

```javascript
async function signUpWithEmail(email, password, displayName) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName, // sera dans raw_user_meta_data
      },
      emailRedirectTo: window.location.origin + '/auth/callback',
    }
  });
  
  if (error) {
    // Erreurs typiques : "User already registered", "Password too short"
    return { error };
  }
  
  // Succès : l'utilisateur doit confirmer son e-mail
  return { user: data.user, needsEmailConfirmation: true };
}
```

### Connexion par e-mail

```javascript
async function signInWithEmail(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    // "Invalid login credentials", "Email not confirmed"
    return { error };
  }
  
  return { user: data.user, session: data.session };
}
```

### Connexion Google

```javascript
async function signInWithGoogle() {
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/auth/callback',
    }
  });
  
  // Redirection vers Google, retour automatique après auth
}
```

### Récupérer la session active

```javascript
async function getSession() {
  const { data, error } = await sb.auth.getSession();
  return data.session; // null si pas connecté
}

// Pour écouter les changements (login/logout)
sb.auth.onAuthStateChange((event, session) => {
  // event : SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
  if (event === 'SIGNED_IN') {
    checkOnboardingStatus(); // voir ci-dessous
  } else if (event === 'SIGNED_OUT') {
    redirectToLogin();
  }
});
```

### Onboarding : compléter le profil

```javascript
async function completeOnboarding(displayName, level) {
  const { data: { user } } = await sb.auth.getUser();
  
  // Mettre à jour le profil dans user_profiles
  const { error } = await sb
    .from('user_profiles')
    .update({
      display_name: displayName,
      current_level: level,
    })
    .eq('id', user.id);
  
  if (error) return { error };
  return { success: true };
}

async function checkOnboardingStatus() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { onboarded: false, needsLogin: true };
  
  const { data: profile } = await sb
    .from('user_profiles')
    .select('display_name, current_level')
    .eq('id', user.id)
    .single();
  
  if (!profile?.current_level) {
    return { onboarded: false, needsOnboarding: true };
  }
  
  return { onboarded: true, profile };
}
```

### Mot de passe oublié

```javascript
async function resetPassword(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth/reset-password',
  });
  return { error };
}

// Sur la page /auth/reset-password
async function updatePassword(newPassword) {
  const { error } = await sb.auth.updateUser({
    password: newPassword,
  });
  return { error };
}
```

### Déconnexion

```javascript
async function signOut() {
  const { error } = await sb.auth.signOut();
  return { error };
}
```

### Appel API authentifié

```javascript
async function generateCourse(topic, category, level, format) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  
  const response = await fetch('/api/generate-course', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // ⬅ JWT
    },
    body: JSON.stringify({ topic, category, level, format }),
  });
  
  return await response.json();
}
```

## 🎨 Composants UI à créer

| Composant | Rôle |
|-----------|------|
| `<AuthModal />` | Modal avec onglets Signup/Login |
| `<EmailConfirmationScreen />` | "Vérifie ta boîte mail" |
| `<OnboardingFlow />` | Choix du nom + niveau (1-2 étapes) |
| `<LevelQuickTest />` | Mini test 3 questions si user ne connaît pas son niveau |
| `<UserMenu />` | Avatar + menu (Profil / Déconnexion) |
| `<ProtectedRoute />` | Wrapper qui redirige vers login si pas authentifié |

## 🎯 Routes/Pages

```
/                       → Homepage (avec CTA inscription/connexion)
/auth/signup            → Modal ou page d'inscription
/auth/signin            → Modal ou page de connexion
/auth/callback          → Page de retour après confirmation e-mail/OAuth
/auth/reset-password    → Page de nouveau mot de passe
/onboarding             → Configuration profil (premier login)
/app                    → Menu principal (4 menus)
/app/cours              → Module Cours
/app/apprendre          → Module Apprendre
/app/examen             → Module Examen IA
/app/certification      → Module Préparation Certification
```

(Pour un site mono-page, ces "routes" sont juste des états de l'app.)

## 🔄 Cycle de vie d'une session

```
1. App charge → sb.auth.getSession()
   ├─ Session active   → vérifier onboarding → menu principal
   └─ Pas de session   → écran de bienvenue
   
2. JWT a une durée de vie de 1 heure
   ├─ Supabase SDK gère le refresh automatique
   └─ Si refresh échoue (compte supprimé, etc.) → déconnexion auto
```

## ⚠️ Sécurité — bonnes pratiques

✅ **À FAIRE** :
- Toujours envoyer le JWT dans `Authorization: Bearer` pour les appels API
- Utiliser HTTPS uniquement en prod
- Stocker uniquement la session via le SDK (gère LocalStorage proprement)
- Activer RLS sur toutes les tables (déjà fait dans le SQL)

❌ **À NE PAS FAIRE** :
- Ne JAMAIS exposer la `service_role_key` côté frontend
- Ne JAMAIS écrire le JWT dans des cookies non-HTTPOnly
- Ne JAMAIS faire confiance aux données envoyées par le client sans validation backend
