// ============================================================
// LERNEN.DE — Bootstrap principal
// ============================================================
// - Initialise Supabase
// - Gère la navigation entre écrans
// - Maintient l'état global (user, profile, token)
// - Helpers réutilisables : toast, modal, API fetch
// ============================================================

(function() {
  'use strict';

  // ===== Helpers globaux =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ===== État global =====
  window.App = {
    supabase: null,
    user: null,
    profile: null,
    session: null,
    
    // ===== Initialisation =====
    async init() {
      // Vérifier la config
      if (!window.CONFIG?.SUPABASE_URL || window.CONFIG.SUPABASE_URL.includes('VOTRE_PROJET')) {
        return this.showConfigError();
      }

      // Initialiser Supabase
      this.supabase = window.supabase.createClient(
        window.CONFIG.SUPABASE_URL,
        window.CONFIG.SUPABASE_ANON_KEY
      );

      // Écouter les changements d'auth
      this.supabase.auth.onAuthStateChange((event, session) => {
        if (window.CONFIG.DEBUG) console.log('Auth event:', event);
        this.session = session;
        this.user = session?.user || null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          this.handleSignedIn();
        } else if (event === 'SIGNED_OUT') {
          this.handleSignedOut();
        }
      });

      // Vérifier la session existante
      const { data: { session } } = await this.supabase.auth.getSession();
      this.session = session;
      this.user = session?.user || null;

      if (this.user) {
        await this.handleSignedIn();
      } else {
        this.showAuth();
      }

      // Brancher les events globaux
      this.bindGlobalEvents();
    },

    showConfigError() {
      $('#screen-loading').classList.add('hidden');
      document.body.innerHTML = `
        <div class="container" style="padding: 2rem 1rem;">
          <div class="card card-red" style="margin-top: 2rem;">
            <h2 style="margin-bottom: 1rem;">⚠️ Configuration manquante</h2>
            <p style="font-weight: 500;">
              Édite <strong>config.js</strong> et renseigne les valeurs :
            </p>
            <ul style="margin: 1rem 0 1rem 1.5rem; font-weight: 500;">
              <li>SUPABASE_URL</li>
              <li>SUPABASE_ANON_KEY</li>
            </ul>
            <p style="font-weight: 500; font-size: 0.9rem;">
              Récupère-les dans ton dashboard Supabase :
              <strong>Settings → API</strong>
            </p>
          </div>
        </div>
      `;
    },

    // ===== Gestion auth =====
    async handleSignedIn() {
      try {
        // Charger le profil
        await this.loadProfile();

        // Vérifier la confirmation d'e-mail
        if (!this.user.email_confirmed_at && this.user.app_metadata?.provider === 'email') {
          this.showEmailConfirmation();
          return;
        }

        // Vérifier l'onboarding
        if (!this.profile?.onboarding_completed) {
          this.showOnboarding();
          return;
        }

        // Tout est bon : afficher l'app
        this.showMain();
      } catch (err) {
        console.error('handleSignedIn error:', err);
        this.toast('Erreur de chargement du profil', 'error');
      }
    },

    handleSignedOut() {
      this.user = null;
      this.profile = null;
      this.session = null;
      this.showAuth();
    },

    async loadProfile() {
      const { data, error } = await this.api('/api/user-profile', { method: 'GET' });
      if (error) throw new Error(error);
      this.profile = data.profile;
      this.stats = data.stats;
      return this.profile;
    },

    async signOut() {
      await this.supabase.auth.signOut();
    },

    // ===== Navigation entre écrans =====
    showScreen(id) {
      $$('.container').forEach(c => c.classList.add('hidden'));
      $(id).classList.remove('hidden');
      window.scrollTo(0, 0);
    },

    showAuth() {
      this.showScreen('#screen-auth');
    },

    showOnboarding() {
      this.showScreen('#screen-onboarding');
      // Pré-remplir le nom si dispo (login social)
      const nameInput = $('#onb-name');
      if (this.profile?.display_name && !nameInput.value) {
        nameInput.value = this.profile.display_name;
        this.updateOnboardingValidity();
      }
    },

    showEmailConfirmation() {
      this.showScreen('#screen-auth');
      // Remplacer le contenu par un écran de confirmation
      const container = $('#screen-auth');
      container.innerHTML = `
        <div class="header">
          <div class="logo">lernen<span class="dot">.</span><span class="ext">de</span></div>
        </div>
        <div style="text-align: center; padding: 2rem 1rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">📧</div>
          <h1 style="margin-bottom: 1rem;">Vérifie ta boîte mail</h1>
          <p style="margin-bottom: 2rem; font-weight: 500;">
            On a envoyé un lien de confirmation à<br>
            <strong>${this.user.email}</strong>
          </p>
          <p class="text-muted" style="font-size: 0.85rem; margin-bottom: 2rem;">
            Clique sur le lien pour activer ton compte. Pense à vérifier les spams.
          </p>
          <button id="btn-resend" class="btn btn-block mb-1">Renvoyer l'e-mail</button>
          <button id="btn-signout-confirm" class="btn btn-block">Utiliser un autre compte</button>
        </div>
      `;
      $('#btn-resend').onclick = async () => {
        const { error } = await this.supabase.auth.resend({
          type: 'signup',
          email: this.user.email,
        });
        if (error) this.toast(error.message, 'error');
        else this.toast('E-mail renvoyé !', 'success');
      };
      $('#btn-signout-confirm').onclick = () => this.signOut();
    },

    showMain() {
      // Restaurer le screen-auth si modifié
      if (!$('#btn-show-signup')) {
        location.reload();
        return;
      }
      this.showScreen('#screen-main');
      this.updateMainScreen();
    },

    updateMainScreen() {
      if (!this.profile) return;
      $('#user-name-display').textContent = this.profile.display_name || '';
      $('#user-name-short').textContent = (this.profile.display_name || '?').charAt(0).toUpperCase();
      
      if (this.stats) {
        $('#stat-courses').textContent = this.stats.courses_completed || 0;
        $('#stat-exams').textContent = this.stats.exams_total || 0;
      }
      if (this.profile.streak_days) {
        $('#stat-streak').innerHTML = `🔥 ${this.profile.streak_days}j`;
      }
    },

    // ===== Events globaux =====
    bindGlobalEvents() {
      // Écran auth
      $('#btn-show-signup').onclick = () => Auth.showSignupModal();
      $('#btn-show-login').onclick = () => Auth.showLoginModal();

      // Écran onboarding
      $('#onb-name').oninput = () => this.updateOnboardingValidity();
      $$('#onb-level-options .option-btn').forEach(btn => {
        btn.onclick = () => {
          $$('#onb-level-options .option-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.selectedLevel = btn.dataset.level;
          this.updateOnboardingValidity();
        };
      });
      $('#btn-complete-onboarding').onclick = () => this.completeOnboarding();

      // Menu principal — navigation
      $$('.menu-card[data-menu]').forEach(card => {
        card.onclick = () => {
          const menu = card.dataset.menu;
          if (menu === 'cours') {
            Cours.show();
          } else if (menu === 'apprendre') {
            Apprendre.show();
          } else if (menu === 'examen') {
            Examen.show();
          } else if (menu === 'certification') {
            Certification.show();
          }
        };
      });

      // Profil
      $('#btn-profile').onclick = () => this.showProfileMenu();
    },

    updateOnboardingValidity() {
      const name = $('#onb-name').value.trim();
      const ok = name.length >= 1 && this.selectedLevel;
      $('#btn-complete-onboarding').disabled = !ok;
    },

    async completeOnboarding() {
      const name = $('#onb-name').value.trim();
      const level = this.selectedLevel;
      
      $('#btn-complete-onboarding').disabled = true;
      $('#btn-complete-onboarding').innerHTML = '<div class="loader" style="width:16px;height:16px;"></div>';
      
      try {
        const { data, error } = await this.api('/api/user-profile', {
          method: 'PATCH',
          body: { display_name: name, current_level: level },
        });
        if (error) throw new Error(error);
        this.profile = data.profile;
        this.toast(`Bienvenue ${name} !`, 'success');
        this.showMain();
      } catch (err) {
        this.toast(err.message || 'Erreur', 'error');
        $('#btn-complete-onboarding').disabled = false;
        $('#btn-complete-onboarding').textContent = 'Continuer →';
      }
    },

    showProfileMenu() {
      this.showModal({
        title: this.profile?.display_name || 'Profil',
        content: `
          <div class="mb-2">
            <p class="text-muted" style="font-size: 0.85rem;">${this.user.email}</p>
            <p class="mb-1" style="font-size: 0.9rem;">
              Niveau actuel : <span class="badge badge-${this.profile?.current_level}">${this.profile?.current_level || 'A1'}</span>
            </p>
            ${this.stats ? `
              <div class="card" style="background: var(--cream); margin-top: 1rem;">
                <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">STATISTIQUES</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.9rem;">
                  <div><strong>${this.stats.courses_total}</strong> cours</div>
                  <div><strong>${this.stats.courses_completed}</strong> terminés</div>
                  <div><strong>${this.stats.exams_total}</strong> examens</div>
                  <div><strong>${this.stats.certs_total}</strong> certifs</div>
                </div>
              </div>
            ` : ''}
          </div>
          <button id="modal-signout" class="btn btn-block btn-red">Se déconnecter</button>
        `,
      });
      setTimeout(() => {
        const btn = document.querySelector('#modal-signout');
        if (btn) btn.onclick = () => { this.closeModal(); this.signOut(); };
      }, 50);
    },

    // ===== Helpers : API call avec auth =====
    async api(path, { method = 'GET', body = null, query = null } = {}) {
      const url = new URL(window.CONFIG.API_URL + path);
      if (query) Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
      
      const headers = { 'Content-Type': 'application/json' };
      if (this.session?.access_token) {
        headers['Authorization'] = `Bearer ${this.session.access_token}`;
      }
      
      try {
        const res = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data.error || data.message || 'Erreur réseau' };
        return { data, error: null };
      } catch (e) {
        return { data: null, error: 'Erreur réseau' };
      }
    },

    // ===== Helpers : Toast =====
    toast(message, type = 'default', duration = 3000) {
      const t = document.createElement('div');
      t.className = `toast toast-${type}`;
      t.textContent = message;
      $('#toast-container').appendChild(t);
      setTimeout(() => t.remove(), duration);
    },

    // ===== Helpers : Modal =====
    showModal({ title, content, onClose } = {}) {
      const modalEl = document.createElement('div');
      modalEl.className = 'modal-backdrop';
      modalEl.innerHTML = `
        <div class="modal">
          ${title ? `<h2 style="margin-bottom: 1rem; padding-right: 3rem;">${title}</h2>` : ''}
          <button class="modal-close">×</button>
          <div class="modal-body">${content || ''}</div>
        </div>
      `;
      $('#modal-container').appendChild(modalEl);
      modalEl.querySelector('.modal-close').onclick = () => {
        modalEl.remove();
        if (onClose) onClose();
      };
      modalEl.onclick = (e) => {
        if (e.target === modalEl) {
          modalEl.remove();
          if (onClose) onClose();
        }
      };
      return modalEl;
    },

    closeModal() {
      $$('#modal-container .modal-backdrop').forEach(m => m.remove());
    },
  };

  // ===== Démarrage =====
  document.addEventListener('DOMContentLoaded', () => App.init());
})();
