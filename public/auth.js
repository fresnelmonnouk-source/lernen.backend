// ============================================================
// LERNEN.DE — Module Authentification
// ============================================================
// - Modal Signup (email + password + nom)
// - Modal Login (email + password ou Google)
// - Reset password
// ============================================================

window.Auth = {
  // ===== Modal d'inscription =====
  showSignupModal() {
    const modal = App.showModal({
      title: "S'inscrire",
      content: `
        <button class="btn btn-block mb-1" id="signup-google" style="background: white; color: var(--ink); display: flex; align-items: center; gap: 0.5rem;">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.7-.4-4z"/></svg>
          Continuer avec Google
        </button>
        
        <div class="divider-or">ou</div>
        
        <div class="field">
          <label>Nom</label>
          <input type="text" id="signup-name" class="input" placeholder="Ton prénom" maxlength="50">
        </div>
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="signup-email" class="input" placeholder="ton@email.com" autocomplete="email">
        </div>
        <div class="field">
          <label>Mot de passe</label>
          <input type="password" id="signup-password" class="input" placeholder="Au moins 8 caractères" autocomplete="new-password" minlength="8">
        </div>
        
        <button id="signup-submit" class="btn btn-primary btn-block mb-1">
          Créer mon compte
        </button>
        
        <p class="text-center text-muted" style="font-size: 0.85rem; margin-top: 1rem;">
          Déjà inscrit ? 
          <a href="#" id="signup-to-login" style="font-weight: 700; text-decoration: underline;">Se connecter</a>
        </p>
      `,
    });

    setTimeout(() => {
      const $$$ = (s) => modal.querySelector(s);
      
      $$$('#signup-google').onclick = () => this.signInWithGoogle();
      $$$('#signup-to-login').onclick = (e) => {
        e.preventDefault();
        App.closeModal();
        this.showLoginModal();
      };
      $$$('#signup-submit').onclick = () => this.handleSignup(modal);
      
      // Submit on Enter
      ['#signup-name', '#signup-email', '#signup-password'].forEach(sel => {
        $$$(sel).onkeydown = (e) => {
          if (e.key === 'Enter') this.handleSignup(modal);
        };
      });
    }, 50);
  },

  async handleSignup(modal) {
    const $$$ = (s) => modal.querySelector(s);
    const name = $$$('#signup-name').value.trim();
    const email = $$$('#signup-email').value.trim();
    const password = $$$('#signup-password').value;

    if (name.length < 1) return App.toast('Renseigne ton nom', 'error');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return App.toast('E-mail invalide', 'error');
    if (password.length < 8) return App.toast('Mot de passe : 8 caractères minimum', 'error');

    const btn = $$$('#signup-submit');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="loader" style="width:18px;height:18px;border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>';

    try {
      const { data, error } = await App.supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      App.closeModal();
      App.toast('Compte créé ! Vérifie ta boîte mail.', 'success', 5000);
      // Le onAuthStateChange déclenchera la suite
    } catch (err) {
      console.error('Signup error:', err);
      App.toast(this.translateAuthError(err.message), 'error');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  },

  // ===== Modal de connexion =====
  showLoginModal() {
    const modal = App.showModal({
      title: 'Se connecter',
      content: `
        <button class="btn btn-block mb-1" id="login-google" style="background: white; color: var(--ink); display: flex; align-items: center; gap: 0.5rem;">
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.7-.4-4z"/></svg>
          Continuer avec Google
        </button>
        
        <div class="divider-or">ou</div>
        
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="login-email" class="input" placeholder="ton@email.com" autocomplete="email">
        </div>
        <div class="field">
          <label>Mot de passe</label>
          <input type="password" id="login-password" class="input" placeholder="Ton mot de passe" autocomplete="current-password">
        </div>
        
        <button id="login-submit" class="btn btn-primary btn-block mb-1">
          Se connecter
        </button>
        
        <div class="text-center" style="margin-top: 0.5rem;">
          <a href="#" id="login-forgot" class="text-muted" style="font-size: 0.85rem;">Mot de passe oublié ?</a>
        </div>
        
        <p class="text-center text-muted" style="font-size: 0.85rem; margin-top: 1rem;">
          Pas encore inscrit ? 
          <a href="#" id="login-to-signup" style="font-weight: 700; text-decoration: underline;">Créer un compte</a>
        </p>
      `,
    });

    setTimeout(() => {
      const $$$ = (s) => modal.querySelector(s);
      
      $$$('#login-google').onclick = () => this.signInWithGoogle();
      $$$('#login-to-signup').onclick = (e) => {
        e.preventDefault();
        App.closeModal();
        this.showSignupModal();
      };
      $$$('#login-forgot').onclick = (e) => {
        e.preventDefault();
        App.closeModal();
        this.showForgotModal();
      };
      $$$('#login-submit').onclick = () => this.handleLogin(modal);
      
      ['#login-email', '#login-password'].forEach(sel => {
        $$$(sel).onkeydown = (e) => {
          if (e.key === 'Enter') this.handleLogin(modal);
        };
      });
    }, 50);
  },

  async handleLogin(modal) {
    const $$$ = (s) => modal.querySelector(s);
    const email = $$$('#login-email').value.trim();
    const password = $$$('#login-password').value;

    if (!email || !password) return App.toast('Champs requis', 'error');

    const btn = $$$('#login-submit');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="loader" style="width:18px;height:18px;border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>';

    try {
      const { data, error } = await App.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      App.closeModal();
      // onAuthStateChange déclenchera la suite
    } catch (err) {
      console.error('Login error:', err);
      App.toast(this.translateAuthError(err.message), 'error');
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  },

  // ===== Google OAuth =====
  async signInWithGoogle() {
    try {
      const { error } = await App.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      // Redirection automatique vers Google
    } catch (err) {
      App.toast(err.message || 'Erreur Google', 'error');
    }
  },

  // ===== Mot de passe oublié =====
  showForgotModal() {
    const modal = App.showModal({
      title: 'Mot de passe oublié ?',
      content: `
        <p class="text-muted mb-1" style="font-weight: 500;">
          Saisis ton e-mail. On t'enverra un lien pour le réinitialiser.
        </p>
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="forgot-email" class="input" placeholder="ton@email.com">
        </div>
        <button id="forgot-submit" class="btn btn-primary btn-block">
          Envoyer le lien
        </button>
      `,
    });

    setTimeout(() => {
      const $$$ = (s) => modal.querySelector(s);
      $$$('#forgot-submit').onclick = async () => {
        const email = $$$('#forgot-email').value.trim();
        if (!email) return App.toast('E-mail requis', 'error');

        const btn = $$$('#forgot-submit');
        btn.disabled = true;

        try {
          const { error } = await App.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
          });
          if (error) throw error;
          App.closeModal();
          App.toast('E-mail envoyé ! Vérifie ta boîte.', 'success');
        } catch (err) {
          App.toast(err.message, 'error');
          btn.disabled = false;
        }
      };
    }, 50);
  },

  // ===== Helper : traduire les erreurs Supabase en français =====
  translateAuthError(msg) {
    const m = (msg || '').toLowerCase();
    if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect';
    if (m.includes('email not confirmed')) return 'E-mail non confirmé. Vérifie ta boîte mail.';
    if (m.includes('user already registered')) return 'Cet e-mail est déjà utilisé';
    if (m.includes('password should be at least')) return 'Mot de passe trop court (8 caractères min)';
    if (m.includes('unable to validate email')) return 'E-mail invalide';
    if (m.includes('network')) return 'Erreur réseau. Réessaie.';
    return msg || 'Une erreur est survenue';
  },
};
