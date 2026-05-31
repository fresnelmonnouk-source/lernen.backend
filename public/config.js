// ============================================================
// CONFIGURATION — À REMPLIR AVEC TES PROPRES VALEURS
// ============================================================
// 1. Récupère ces valeurs dans Supabase : Settings → API
// 2. L'API_URL est l'URL de ton déploiement Vercel
// 3. Ne JAMAIS mettre la service_role key ici (frontend = public)

window.CONFIG = {
  // Supabase (frontend - SAFE, les clés anon sont publiques)
  SUPABASE_URL: 'https://VOTRE_PROJET.supabase.co',
  SUPABASE_ANON_KEY: 'VOTRE_ANON_KEY_ICI',
  
  // URL du backend Vercel (où sont déployés les endpoints /api/*)
  // En local : http://localhost:3000
  // En prod : https://votre-app.vercel.app
  API_URL: window.location.origin,
  
  // Niveau par défaut pour nouveaux utilisateurs sans onboarding
  DEFAULT_LEVEL: 'A1',
  
  // Activer les logs détaillés en dev
  DEBUG: false,
};
