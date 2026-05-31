// ============================================================
// LERNEN.DE — Module Préparation Certification
// ============================================================
// V1 : Lesen (compréhension écrite) + Schreiben (expression écrite)
// V2 (à venir) : Hören + Sprechen
// Format inspiré Goethe-Zertifikat
// ============================================================

window.Certification = {
  state: {
    level: null,
    competence: null,
    part: null,
    test: null,
    answers: {},
    userText: '',
    evaluation: null,
  },

  show() {
    if (App.profile?.current_level && !this.state.level) {
      this.state.level = App.profile.current_level;
    }
    this.renderSelectionScreen();
  },

  renderSelectionScreen() {
    const screen = document.getElementById('screen-certification');
    screen.innerHTML = `
      <button class="back-btn" onclick="App.showMain()">← Retour</button>
      
      <div style="margin-bottom: 1rem;">
        <div class="badge" style="background: var(--green); color: white;">🎓 CERTIFICATION</div>
        <h1 style="margin-top: 0.5rem;">Prépare le Goethe</h1>
        <p class="text-muted" style="font-weight: 500; font-size: 0.9rem;">
          Format inspiré du Goethe-Zertifikat · Tests originaux
        </p>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">1. INSTITUTION</h3>
        <div class="option-row">
          <button class="option-btn active">🇩🇪 Goethe</button>
          <button class="option-btn" disabled style="opacity: 0.4;">TestDaF (V2)</button>
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">2. NIVEAU</h3>
        <div class="option-row" id="cert-level">
          ${['A1','A2','B1','B2'].map(l => `
            <button class="option-btn ${this.state.level === l ? 'active' : ''}" data-l="${l}">${l}</button>
          `).join('')}
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">3. COMPÉTENCE</h3>
        <div class="menu-grid" style="margin: 0;">
          <div class="menu-card menu-card-cours" data-comp="lesen" style="cursor: pointer;">
            <div class="menu-card-emoji">📖</div>
            <div>
              <div class="menu-card-title">Lesen</div>
              <div class="menu-card-sub">Lecture</div>
            </div>
          </div>
          
          <div class="menu-card menu-card-apprendre" data-comp="schreiben" style="cursor: pointer;">
            <div class="menu-card-emoji">✍️</div>
            <div>
              <div class="menu-card-title">Schreiben</div>
              <div class="menu-card-sub">Écriture</div>
            </div>
          </div>
          
          <div class="menu-card" data-comp="hoeren" style="background: var(--light-gray); color: var(--muted); cursor: not-allowed; position: relative;">
            <div class="menu-card-emoji" style="opacity: 0.5;">🎧</div>
            <div>
              <div class="menu-card-title">Hören</div>
              <div class="menu-card-sub">🔒 V2</div>
            </div>
          </div>
          
          <div class="menu-card" data-comp="sprechen" style="background: var(--light-gray); color: var(--muted); cursor: not-allowed; position: relative;">
            <div class="menu-card-emoji" style="opacity: 0.5;">🎤</div>
            <div>
              <div class="menu-card-title">Sprechen</div>
              <div class="menu-card-sub">🔒 V2</div>
            </div>
          </div>
        </div>
      </div>

      <div id="cert-history-section" class="mt-2"></div>
    `;
    
    document.querySelectorAll('#cert-level .option-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#cert-level .option-btn').forEach(o => o.classList.remove('active'));
        b.classList.add('active');
        this.state.level = b.dataset.l;
      };
    });
    
    document.querySelectorAll('.menu-card[data-comp]').forEach(card => {
      const comp = card.dataset.comp;
      if (comp === 'hoeren' || comp === 'sprechen') return;
      card.onclick = () => {
        if (!this.state.level) {
          App.toast('Choisis un niveau d\'abord', 'error');
          return;
        }
        this.state.competence = comp;
        if (comp === 'lesen') this.startLesen();
        else if (comp === 'schreiben') this.startSchreiben();
      };
    });
    
    this.loadHistory();
  },

  async loadHistory() {
    const el = document.getElementById('cert-history-section');
    if (!App.supabase) return;
    
    const { data, error } = await App.supabase
      .from('certification_history')
      .select('id, level, competence, score, passed, created_at')
      .eq('user_id', App.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error || !data || data.length === 0) {
      el.innerHTML = '';
      return;
    }
    
    el.innerHTML = `
      <div class="section-title">
        <h2 style="font-size: 1rem;">Tes derniers tests</h2>
      </div>
      ${data.map(t => `
        <div class="history-item">
          <div style="flex: 1;">
            <div class="history-item-title">${this.competenceLabel(t.competence)}</div>
            <div class="history-item-meta">
              <span class="badge badge-${t.level}">${t.level}</span>
              <span style="margin-left: 0.5rem;">· ${this.formatDate(t.created_at)}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 800;">${t.score}%</div>
            <div class="mono" style="font-size: 0.7rem; color: ${t.passed ? 'var(--green)' : 'var(--red)'};">
              ${t.passed ? '✓ Admis' : '✗ Échec'}
            </div>
          </div>
        </div>
      `).join('')}
    `;
  },

  competenceLabel(c) {
    return { lesen: '📖 Lesen', schreiben: '✍️ Schreiben', hoeren: '🎧 Hören', sprechen: '🎤 Sprechen' }[c] || c;
  },

  formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  },

  // ==================== LESEN ====================
  async startLesen() {
    const screen = document.getElementById('screen-certification');
    
    // Demander quelle partie
    const partsCount = { A1: 3, A2: 3, B1: 4, B2: 3 }[this.state.level];
    screen.innerHTML = `
      <button class="back-btn" onclick="Certification.show()">← Retour</button>
      <h1>📖 Lesen ${this.state.level}</h1>
      <p class="text-muted mb-1" style="font-weight: 500;">Choisis la partie à passer</p>
      
      <div class="card">
        <div class="option-row" style="grid-template-columns: 1fr 1fr;">
          ${Array.from({length: partsCount}).map((_, i) => `
            <button class="btn part-btn" data-part="${i + 1}">
              Partie ${i + 1}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.querySelectorAll('.part-btn').forEach(b => {
      b.onclick = () => {
        this.state.part = parseInt(b.dataset.part);
        this.generateLesen();
      };
    });
  },

  async generateLesen() {
    const screen = document.getElementById('screen-certification');
    screen.innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem;">📖</div>
        <h2>L'IA prépare ton test...</h2>
        <p class="text-muted text-center" style="font-weight: 500;">
          Lesen ${this.state.level} · Partie ${this.state.part}
        </p>
        <div class="loader" style="margin-top: 1rem;"></div>
      </div>
    `;
    
    const { data, error } = await App.api('/api/cert-lesen', {
      method: 'POST',
      body: { level: this.state.level, part: this.state.part },
    });
    
    if (error || !data?.test) {
      App.toast('Erreur : ' + (error || 'génération échouée'), 'error');
      this.startLesen();
      return;
    }
    
    this.state.test = data.test;
    this.state.answers = {};
    this.renderLesen();
  },

  renderLesen() {
    const t = this.state.test;
    const screen = document.getElementById('screen-certification');
    
    screen.innerHTML = `
      <button class="back-btn" onclick="Certification.confirmExit()">← Retour</button>
      
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <span class="badge badge-${t.level}">${t.level}</span>
          <span class="badge" style="background: var(--green); color: white;">📖 LESEN</span>
          <span class="badge" style="background: var(--yellow); color: var(--ink);">⏱ ${t.duration_minutes}min</span>
        </div>
        <h1 style="margin-top: 0.5rem;">Partie ${t.part}</h1>
        <p class="text-muted" style="font-weight: 500; font-size: 0.9rem;">${this.escape(t.format_description)}</p>
      </div>

      <div class="card mb-2" style="background: var(--blue); color: white;">
        <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">CONSIGNE</div>
        <p style="font-weight: 500;">${this.escape(t.instructions)}</p>
      </div>

      <!-- Textes -->
      ${(t.texts || []).map(text => `
        <div class="card mb-1">
          ${text.title ? `<h3 style="font-size: 1.1rem; margin-bottom: 0.75rem; color: var(--blue);">${this.escape(text.title)}</h3>` : ''}
          <p style="white-space: pre-wrap; line-height: 1.6; font-weight: 500;">${this.escape(text.content)}</p>
        </div>
      `).join('')}

      <div class="section-title">
        <h2 style="font-size: 1.1rem;">Questions</h2>
      </div>

      ${(t.questions || []).map((q, i) => `
        <div class="exam-question">
          <p style="font-weight: 700; margin-bottom: 0.75rem;">
            <span class="mono text-muted" style="font-size: 0.75rem;">${i + 1}.</span>
            ${this.escape(q.question_text)}
          </p>
          <div class="exam-options">
            ${(q.options || []).map((opt, idx) => `
              <button class="exam-option" data-qid="${q.id}" data-idx="${idx}">
                <div class="marker">${String.fromCharCode(65 + idx)}</div>
                <div>${this.escape(opt)}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}

      <button id="btn-submit-lesen" class="btn btn-primary btn-block mt-2" style="margin-bottom: 2rem;" disabled>
        Soumettre →
      </button>
    `;

    document.querySelectorAll('.exam-option').forEach(opt => {
      opt.onclick = () => {
        const qid = opt.dataset.qid;
        document.querySelectorAll(`.exam-option[data-qid="${qid}"]`).forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.state.answers[qid] = parseInt(opt.dataset.idx);
        this.updateLesenBtn();
      };
    });
    
    document.getElementById('btn-submit-lesen').onclick = () => this.submitLesen();
    
    window.scrollTo(0, 0);
  },

  updateLesenBtn() {
    const total = (this.state.test.questions || []).length;
    const answered = Object.keys(this.state.answers).length;
    const btn = document.getElementById('btn-submit-lesen');
    if (!btn) return;
    btn.disabled = answered < total;
    btn.textContent = answered < total 
      ? `${total - answered} question${total - answered > 1 ? 's' : ''} à répondre`
      : 'Soumettre →';
  },

  async submitLesen() {
    // Correction côté client (les bonnes réponses sont dans le test)
    const t = this.state.test;
    let correct = 0;
    const results = [];
    
    for (const q of t.questions) {
      const userIdx = this.state.answers[q.id];
      const isCorrect = userIdx === q.correct_index;
      if (isCorrect) correct++;
      results.push({
        question_id: q.id,
        question: q.question_text,
        user_answer: userIdx !== undefined ? q.options[userIdx] : '(pas de réponse)',
        correct_answer: q.options[q.correct_index],
        is_correct: isCorrect,
        explanation: q.explanation,
      });
    }
    
    const total = t.questions.length;
    const percentage = Math.round((correct / total) * 100);
    const passed = percentage >= (t.passing_score_percentage || 60);
    
    // Sauvegarder
    try {
      await App.supabase.from('certification_history').insert({
        user_id: App.user.id,
        level: t.level,
        competence: 'lesen',
        part_or_task: t.part,
        test_data: t,
        user_response: this.state.answers,
        evaluation: { results, percentage, passed },
        score: percentage,
        passed,
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Save cert error:', e);
    }
    
    this.renderLesenResults({ correct, total, percentage, passed, results });
  },

  renderLesenResults(r) {
    const screen = document.getElementById('screen-certification');
    screen.innerHTML = `
      <div class="card result-card" style="background: ${r.passed ? 'var(--green)' : 'var(--red)'}; color: white; border-color: var(--ink);">
        <div style="font-size: 4rem;">${r.passed ? '🎉' : '💪'}</div>
        <h2 style="margin-top: 0.5rem;">${r.passed ? 'Admis !' : 'Pas encore'}</h2>
        <div class="result-score">${r.correct}/${r.total}</div>
        <div class="result-percent">${r.percentage}%</div>
        <p style="margin-top: 0.5rem; opacity: 0.9; font-weight: 500; font-size: 0.85rem;">
          Seuil de réussite : ${this.state.test.passing_score_percentage || 60}%
        </p>
      </div>

      <div class="section-title mt-2">
        <h2 style="font-size: 1.1rem;">Correction</h2>
      </div>

      ${r.results.map((item, i) => `
        <div class="card mb-1" style="border-left: 4px solid ${item.is_correct ? 'var(--green)' : 'var(--red)'};">
          <div class="flex-between mb-1">
            <span class="mono text-muted" style="font-size: 0.75rem;">Q${i + 1}</span>
            <span>${item.is_correct ? '✅ Correct' : '❌ Faux'}</span>
          </div>
          <p style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">${this.escape(item.question)}</p>
          <div style="font-size: 0.85rem;">
            <div><strong>Ta réponse :</strong> ${this.escape(item.user_answer)}</div>
            ${!item.is_correct ? `<div style="color: var(--green);"><strong>Réponse :</strong> ${this.escape(item.correct_answer)}</div>` : ''}
          </div>
          ${item.explanation ? `
            <div class="mt-1" style="padding-top: 0.5rem; border-top: 1px dashed var(--muted); font-size: 0.85rem; color: var(--muted);">
              ${this.escape(item.explanation)}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="mt-2" style="display: flex; gap: 0.75rem; margin-bottom: 2rem;">
        <button class="btn btn-block" onclick="Certification.show()">Autre test</button>
        <button class="btn btn-primary btn-block" onclick="App.showMain()">Accueil</button>
      </div>
    `;
    
    window.scrollTo(0, 0);
  },

  // ==================== SCHREIBEN ====================
  async startSchreiben() {
    const tasksCount = { A1: 2, A2: 2, B1: 3, B2: 2 }[this.state.level];
    const screen = document.getElementById('screen-certification');
    screen.innerHTML = `
      <button class="back-btn" onclick="Certification.show()">← Retour</button>
      <h1>✍️ Schreiben ${this.state.level}</h1>
      <p class="text-muted mb-1" style="font-weight: 500;">Choisis la tâche</p>
      
      <div class="card">
        <div class="option-row" style="grid-template-columns: 1fr 1fr;">
          ${Array.from({length: tasksCount}).map((_, i) => `
            <button class="btn task-btn" data-task="${i + 1}">
              Tâche ${i + 1}
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    document.querySelectorAll('.task-btn').forEach(b => {
      b.onclick = () => {
        this.state.part = parseInt(b.dataset.task);
        this.generateSchreiben();
      };
    });
  },

  async generateSchreiben() {
    const screen = document.getElementById('screen-certification');
    screen.innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem;">✍️</div>
        <h2>Génération du sujet...</h2>
        <div class="loader" style="margin-top: 1rem;"></div>
      </div>
    `;
    
    const { data, error } = await App.api('/api/cert-schreiben', {
      method: 'POST',
      body: { level: this.state.level, task: this.state.part },
    });
    
    if (error || !data?.task) {
      App.toast('Erreur : ' + (error || 'génération échouée'), 'error');
      this.startSchreiben();
      return;
    }
    
    this.state.test = data.task;
    this.state.userText = '';
    this.renderSchreiben();
  },

  renderSchreiben() {
    const t = this.state.test;
    const screen = document.getElementById('screen-certification');
    
    screen.innerHTML = `
      <button class="back-btn" onclick="Certification.confirmExit()">← Retour</button>
      
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <span class="badge badge-${t.level}">${t.level}</span>
          <span class="badge" style="background: var(--blue); color: white;">✍️ SCHREIBEN</span>
          <span class="badge" style="background: var(--yellow); color: var(--ink);">⏱ ${t.duration_minutes}min</span>
          <span class="badge" style="background: var(--cream); color: var(--ink); border: var(--border-w) solid var(--ink);">${t.word_count?.min || 50}-${t.word_count?.max || 150} mots</span>
        </div>
        <h1 style="margin-top: 0.5rem;">Tâche ${t.task_number}</h1>
      </div>

      <!-- Consigne allemande -->
      <div class="card mb-1" style="background: var(--ink); color: var(--cream);">
        <div class="mono" style="font-size: 0.7rem; opacity: 0.7; margin-bottom: 0.5rem;">📝 AUFGABE (en allemand)</div>
        <p style="font-weight: 500; line-height: 1.5; white-space: pre-wrap;">${this.escape(t.instructions_de)}</p>
      </div>

      <!-- Traduction -->
      <details class="card mb-1">
        <summary style="cursor: pointer; font-weight: 700; font-size: 0.9rem;">🇫🇷 Voir la traduction française</summary>
        <p class="mt-1 text-muted" style="font-weight: 500; line-height: 1.5; white-space: pre-wrap;">${this.escape(t.instructions_fr)}</p>
      </details>

      <!-- Points à traiter -->
      <div class="card mb-1" style="background: var(--yellow);">
        <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.5rem;">📌 POINTS À TRAITER</div>
        ${(t.elements_to_cover || []).map((e, i) => `
          <div style="padding: 0.4rem 0; padding-left: 1.4rem; position: relative; font-weight: 600;">
            <span style="position: absolute; left: 0; font-weight: 800;">${i + 1}.</span>
            ${this.escape(e)}
          </div>
        `).join('')}
      </div>

      <!-- Conseils -->
      ${t.tips?.length ? `
        <div class="card mb-1" style="background: var(--cream); border-left: 4px solid var(--blue);">
          <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">💡 CONSEILS</div>
          ${t.tips.map(tip => `<p style="font-weight: 500; font-size: 0.85rem; padding: 0.2rem 0;">→ ${this.escape(tip)}</p>`).join('')}
        </div>
      ` : ''}

      <!-- Zone d'écriture -->
      <div class="card mb-1">
        <div class="flex-between mb-1">
          <h3 style="font-size: 0.95rem;">✍️ TA RÉPONSE</h3>
          <span class="mono" id="word-count" style="font-size: 0.85rem; color: var(--muted);">0 mots</span>
        </div>
        <textarea id="schreiben-text" class="textarea" placeholder="Schreibe hier..." style="min-height: 250px;"></textarea>
      </div>

      <button id="btn-submit-schreiben" class="btn btn-primary btn-block mt-1" style="margin-bottom: 2rem;" disabled>
        Soumettre ma copie
      </button>
    `;
    
    const textarea = document.getElementById('schreiben-text');
    const wordCount = document.getElementById('word-count');
    const submitBtn = document.getElementById('btn-submit-schreiben');
    
    textarea.oninput = () => {
      this.state.userText = textarea.value;
      const count = textarea.value.trim().split(/\s+/).filter(Boolean).length;
      const min = t.word_count?.min || 50;
      const max = t.word_count?.max || 200;
      const color = count < min * 0.8 ? 'var(--red)' : count > max * 1.2 ? 'var(--red)' : count >= min ? 'var(--green)' : 'var(--muted)';
      wordCount.innerHTML = `<span style="color: ${color}; font-weight: 700;">${count} mots</span> · objectif ${min}-${max}`;
      submitBtn.disabled = count < min * 0.5;
    };
    
    submitBtn.onclick = () => this.submitSchreiben();
    
    window.scrollTo(0, 0);
  },

  async submitSchreiben() {
    if (!confirm('Soumettre ta copie ? L\'IA va la corriger sur les 4 critères Goethe.')) return;
    
    const screen = document.getElementById('screen-certification');
    screen.innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem;">🎓</div>
        <h2>L'IA corrige selon les critères Goethe...</h2>
        <p class="text-muted text-center" style="font-weight: 500;">
          Erfüllung · Kohärenz · Wortschatz · Strukturen
        </p>
        <div class="loader" style="margin-top: 1rem;"></div>
      </div>
    `;
    
    const { data, error } = await App.api('/api/grade-schreiben', {
      method: 'POST',
      body: { task: this.state.test, userText: this.state.userText },
    });
    
    if (error || !data?.evaluation) {
      App.toast('Erreur : ' + (error || 'correction échouée'), 'error');
      this.renderSchreiben();
      return;
    }
    
    this.state.evaluation = data.evaluation;
    
    // Sauvegarder
    try {
      await App.supabase.from('certification_history').insert({
        user_id: App.user.id,
        level: this.state.test.level,
        competence: 'schreiben',
        part_or_task: this.state.test.task_number,
        test_data: this.state.test,
        user_response: { text: this.state.userText },
        evaluation: data.evaluation,
        score: data.evaluation.total_score,
        passed: data.evaluation.passed,
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Save cert error:', e);
    }
    
    this.renderSchreibenResults();
  },

  renderSchreibenResults() {
    const e = this.state.evaluation;
    const screen = document.getElementById('screen-certification');
    
    const scoreColor = e.passed ? 'var(--green)' : 'var(--red)';
    
    screen.innerHTML = `
      <div class="card result-card" style="background: ${scoreColor}; color: white; border-color: var(--ink);">
        <div style="font-size: 4rem;">${e.passed ? '🎓' : '💪'}</div>
        <div class="mono" style="font-size: 0.75rem; opacity: 0.8; margin: 0.5rem 0;">SCORE GOETHE</div>
        <div class="result-score">${e.total_score}/100</div>
        <div class="result-percent">${e.mention}</div>
        <p style="margin-top: 0.5rem; opacity: 0.9; font-weight: 500; font-size: 0.85rem;">
          ${e.word_count} mots · ${e.passed ? '✓ Admis' : '✗ Non admis'}
        </p>
      </div>

      <!-- Détail des 4 critères -->
      <div class="section-title mt-2">
        <h2 style="font-size: 1.1rem;">Les 4 critères</h2>
      </div>

      ${['erfuellung', 'kohaerenz', 'wortschatz', 'strukturen'].map(crit => {
        const s = e.scores?.[crit];
        if (!s) return '';
        const pct = (s.points / s.max) * 100;
        const labels = {
          erfuellung: '📋 Erfüllung (Réalisation tâche)',
          kohaerenz: '🔗 Kohärenz (Cohérence)',
          wortschatz: '📚 Wortschatz (Vocabulaire)',
          strukturen: '⚙️ Strukturen (Grammaire)',
        };
        return `
          <div class="card mb-1">
            <div class="flex-between mb-1">
              <h3 style="font-size: 0.95rem; text-transform: none;">${labels[crit]}</h3>
              <span style="font-weight: 800; font-size: 1.1rem;">${s.points}/${s.max}</span>
            </div>
            <div style="height: 8px; background: var(--light-gray); border: var(--border-w) solid var(--ink); border-radius: 99px; overflow: hidden; margin-bottom: 0.5rem;">
              <div style="height: 100%; width: ${pct}%; background: ${pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--blue)' : 'var(--red)'};"></div>
            </div>
            <p class="text-muted" style="font-size: 0.85rem; font-weight: 500;">${this.escape(s.comment)}</p>
          </div>
        `;
      }).join('')}

      <!-- Forces -->
      ${e.strengths?.length ? `
        <div class="card mt-2" style="background: var(--green); color: white;">
          <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">💪 TES POINTS FORTS</div>
          ${e.strengths.map(s => `<p style="font-weight: 500; padding: 0.2rem 0;">→ ${this.escape(s)}</p>`).join('')}
        </div>
      ` : ''}

      <!-- Améliorations -->
      ${e.improvements?.length ? `
        <div class="card mt-1" style="background: var(--yellow);">
          <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.5rem;">📈 PISTES D'AMÉLIORATION</div>
          ${e.improvements.map(s => `<p style="font-weight: 500; padding: 0.2rem 0;">→ ${this.escape(s)}</p>`).join('')}
        </div>
      ` : ''}

      <!-- Erreurs détaillées -->
      ${e.errors?.length ? `
        <div class="section-title mt-2">
          <h2 style="font-size: 1.1rem;">Erreurs détectées (${e.errors.length})</h2>
        </div>
        ${e.errors.map(err => `
          <div class="card mb-1" style="border-left: 4px solid var(--red);">
            <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.3rem;">${err.type?.toUpperCase()}</div>
            <p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">
              <span style="color: var(--red);">❌ ${this.escape(err.extract)}</span>
            </p>
            <p style="margin-bottom: 0.5rem; font-size: 0.9rem;">
              <span style="color: var(--green);">✓ ${this.escape(err.correction)}</span>
            </p>
            <p class="text-muted" style="font-size: 0.85rem;">${this.escape(err.issue)}</p>
          </div>
        `).join('')}
      ` : ''}

      <!-- Version améliorée -->
      ${e.improved_version ? `
        <div class="card mt-2" style="background: var(--blue); color: white;">
          <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">✨ VERSION AMÉLIORÉE</div>
          <p style="font-weight: 500; line-height: 1.6; white-space: pre-wrap;">${this.escape(e.improved_version)}</p>
        </div>
      ` : ''}

      <!-- Bilan global -->
      <div class="card mt-1" style="background: var(--ink); color: var(--cream);">
        <div class="mono" style="font-size: 0.7rem; opacity: 0.7; margin-bottom: 0.5rem;">📝 BILAN GLOBAL</div>
        <p style="font-weight: 500; line-height: 1.5;">${this.escape(e.global_feedback || '')}</p>
      </div>

      <!-- Next steps -->
      ${e.next_steps?.length ? `
        <div class="card mt-1" style="background: var(--cream); border: var(--border);">
          <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">🎯 POUR PROGRESSER</div>
          ${e.next_steps.map(s => `<p style="font-weight: 500; padding: 0.2rem 0;">→ ${this.escape(s)}</p>`).join('')}
        </div>
      ` : ''}

      <div class="mt-2" style="display: flex; gap: 0.75rem; margin-bottom: 2rem;">
        <button class="btn btn-block" onclick="Certification.show()">Autre test</button>
        <button class="btn btn-primary btn-block" onclick="App.showMain()">Accueil</button>
      </div>
    `;
    
    window.scrollTo(0, 0);
  },

  // ==================== Utils ====================
  confirmExit() {
    if (confirm('Quitter le test ? Ta progression sera perdue.')) {
      this.state = { level: this.state.level, competence: null, part: null, test: null, answers: {}, userText: '', evaluation: null };
      App.showMain();
    }
  },

  escape(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
