// ============================================================
// LERNEN.DE — Module Examen IA
// ============================================================
// Workflow : niveau → domaine → nb questions → difficulté → test → correction
// Utilise /api/generate-test et /api/grade-test
// ============================================================

window.Examen = {
  state: {
    domain: null,
    level: null,
    difficulty: null,
    questionCount: null,
    test: null,
    answers: {},
    currentIdx: 0,
    results: null,
  },

  show() {
    // Pré-remplir le niveau depuis le profil
    if (App.profile?.current_level && !this.state.level) {
      this.state.level = App.profile.current_level;
    }
    this.renderSelectionScreen();
  },

  renderSelectionScreen() {
    const screen = document.getElementById('screen-examen');
    screen.innerHTML = `
      <button class="back-btn" onclick="App.showMain()">← Retour</button>
      
      <div style="margin-bottom: 1rem;">
        <div class="badge" style="background: var(--red); color: white;">🎯 EXAMEN IA</div>
        <h1 style="margin-top: 0.5rem;">Teste ton niveau</h1>
        <p class="text-muted" style="font-weight: 500; font-size: 0.9rem;">
          L'IA génère un examen sur mesure et te corrige
        </p>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">1. DOMAINE</h3>
        <div class="option-row" id="ex-domain">
          <button class="option-btn" data-d="vocabulary">📚 Vocab</button>
          <button class="option-btn" data-d="grammar">✏️ Gram.</button>
          <button class="option-btn" data-d="spelling">🔤 Orthogr.</button>
          <button class="option-btn" data-d="conjugation">🔄 Conjug.</button>
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">2. NIVEAU</h3>
        <div class="option-row" id="ex-level">
          ${['A1','A2','B1','B2'].map(l => `
            <button class="option-btn ${this.state.level === l ? 'active' : ''}" data-l="${l}">${l}</button>
          `).join('')}
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">3. DIFFICULTÉ</h3>
        <div class="option-row" id="ex-diff" style="grid-template-columns: 1fr 1fr 1fr;">
          <button class="option-btn" data-diff="easy"><strong>Facile</strong></button>
          <button class="option-btn" data-diff="medium"><strong>Moyen</strong></button>
          <button class="option-btn" data-diff="hard"><strong>Difficile</strong></button>
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">4. NOMBRE DE QUESTIONS</h3>
        <div class="option-row" id="ex-count" style="grid-template-columns: repeat(5, 1fr);">
          ${[5, 10, 15, 20, 30].map(n => `
            <button class="option-btn" data-n="${n}"><strong>${n}</strong></button>
          `).join('')}
        </div>
      </div>

      <button id="btn-generate-test" class="btn btn-primary btn-block" disabled>
        Générer l'examen →
      </button>

      <div id="exam-recent" class="mt-2"></div>
    `;

    // Events
    document.querySelectorAll('#ex-domain .option-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#ex-domain .option-btn').forEach(o => o.classList.remove('active'));
        b.classList.add('active');
        this.state.domain = b.dataset.d;
        this.updateGenBtn();
      };
    });
    document.querySelectorAll('#ex-level .option-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#ex-level .option-btn').forEach(o => o.classList.remove('active'));
        b.classList.add('active');
        this.state.level = b.dataset.l;
        this.updateGenBtn();
      };
    });
    document.querySelectorAll('#ex-diff .option-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#ex-diff .option-btn').forEach(o => o.classList.remove('active'));
        b.classList.add('active');
        this.state.difficulty = b.dataset.diff;
        this.updateGenBtn();
      };
    });
    document.querySelectorAll('#ex-count .option-btn').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#ex-count .option-btn').forEach(o => o.classList.remove('active'));
        b.classList.add('active');
        this.state.questionCount = parseInt(b.dataset.n);
        this.updateGenBtn();
      };
    });
    
    document.getElementById('btn-generate-test').onclick = () => this.generateTest();
    
    // Restaurer sélections
    if (this.state.level) document.querySelector(`#ex-level .option-btn[data-l="${this.state.level}"]`)?.classList.add('active');
    
    this.loadRecentExams();
  },

  updateGenBtn() {
    const btn = document.getElementById('btn-generate-test');
    if (!btn) return;
    btn.disabled = !(this.state.domain && this.state.level && this.state.difficulty && this.state.questionCount);
  },

  async loadRecentExams() {
    const el = document.getElementById('exam-recent');
    if (!App.supabase) return;
    
    const { data, error } = await App.supabase
      .from('exam_history')
      .select('id, domain, level, difficulty, question_count, score, grade, created_at')
      .eq('user_id', App.user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error || !data || data.length === 0) {
      el.innerHTML = '';
      return;
    }
    
    el.innerHTML = `
      <div class="section-title">
        <h2 style="font-size: 1rem;">Derniers examens</h2>
      </div>
      ${data.map(e => `
        <div class="history-item">
          <div style="flex: 1;">
            <div class="history-item-title">${this.domainLabel(e.domain)} · ${e.question_count} questions</div>
            <div class="history-item-meta">
              <span class="badge badge-${e.level}">${e.level}</span>
              <span style="margin-left: 0.5rem;">${e.difficulty}</span>
              <span style="margin-left: 0.5rem;">· ${this.formatDate(e.created_at)}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 800;">${e.score}%</div>
            <div class="mono text-muted" style="font-size: 0.7rem;">${e.grade}</div>
          </div>
        </div>
      `).join('')}
    `;
  },

  domainLabel(d) {
    return { vocabulary: '📚 Vocab', grammar: '✏️ Gram.', spelling: '🔤 Orthog.', conjugation: '🔄 Conjug.' }[d] || d;
  },

  formatDate(iso) {
    const d = new Date(iso);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  },

  async generateTest() {
    const screen = document.getElementById('screen-examen');
    screen.innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🤖</div>
        <h2 style="text-align: center;">L'IA prépare ton examen...</h2>
        <p class="text-muted text-center" style="font-weight: 500;">
          ${this.state.questionCount} questions · ${this.state.level} · ${this.state.difficulty}
        </p>
        <div class="loader" style="margin-top: 1rem;"></div>
      </div>
    `;
    
    const { data, error } = await App.api('/api/generate-test', {
      method: 'POST',
      body: {
        domain: this.state.domain,
        level: this.state.level,
        difficulty: this.state.difficulty,
        questionCount: this.state.questionCount,
      },
    });
    
    if (error || !data?.test) {
      App.toast('Erreur : ' + (error || 'génération échouée'), 'error');
      this.renderSelectionScreen();
      return;
    }
    
    this.state.test = data.test;
    this.state.answers = {};
    this.state.currentIdx = 0;
    this.renderQuestion();
  },

  renderQuestion() {
    const t = this.state.test;
    const q = t.questions[this.state.currentIdx];
    const total = t.questions.length;
    const idx = this.state.currentIdx;
    
    const screen = document.getElementById('screen-examen');
    screen.innerHTML = `
      <div class="flex-between mb-1">
        <span class="mono text-muted" style="font-size: 0.8rem;">${idx + 1} / ${total}</span>
        <span class="badge badge-${t.level}">${t.level} · ${t.difficulty}</span>
      </div>

      <!-- Progress bar -->
      <div style="height: 6px; background: var(--light-gray); border: var(--border-w) solid var(--ink); border-radius: 99px; overflow: hidden; margin-bottom: 1.5rem;">
        <div style="height: 100%; width: ${((idx + 1) / total) * 100}%; background: var(--ink); transition: width 0.3s;"></div>
      </div>

      <div class="exam-question">
        <p style="font-weight: 700; font-size: 1.05rem; margin-bottom: 0.75rem;">${this.escape(q.question)}</p>
        ${this.renderAnswerArea(q)}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; margin-bottom: 2rem;">
        ${idx > 0 ? `<button class="btn" onclick="Examen.prev()">← Précédent</button>` : '<div></div>'}
        ${idx === total - 1 
          ? `<button id="btn-submit-test" class="btn btn-primary">Soumettre ↑</button>`
          : `<button id="btn-next-q" class="btn btn-primary">Suivant →</button>`
        }
      </div>
    `;
    
    // Events
    if (q.type === 'mcq') {
      document.querySelectorAll('.exam-option').forEach(opt => {
        opt.onclick = () => {
          document.querySelectorAll('.exam-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          this.state.answers[q.id] = parseInt(opt.dataset.idx);
        };
      });
      
      // Restaurer sélection
      const prev = this.state.answers[q.id];
      if (prev !== undefined) {
        document.querySelector(`.exam-option[data-idx="${prev}"]`)?.classList.add('selected');
      }
    } else {
      const inp = document.getElementById('open-answer-input');
      if (inp) {
        inp.value = this.state.answers[q.id] || '';
        inp.oninput = () => { this.state.answers[q.id] = inp.value; };
      }
    }
    
    const btnNext = document.getElementById('btn-next-q');
    if (btnNext) btnNext.onclick = () => this.next();
    
    const btnSubmit = document.getElementById('btn-submit-test');
    if (btnSubmit) btnSubmit.onclick = () => this.submitTest();
    
    window.scrollTo(0, 0);
  },

  renderAnswerArea(q) {
    if (q.type === 'mcq') {
      return `
        <div class="exam-options">
          ${(q.options || []).map((opt, i) => `
            <button class="exam-option" data-idx="${i}">
              <div class="marker">${String.fromCharCode(65 + i)}</div>
              <div>${this.escape(opt)}</div>
            </button>
          `).join('')}
        </div>
      `;
    } else {
      return `<input type="text" id="open-answer-input" class="input" placeholder="Ta réponse..." autocomplete="off">`;
    }
  },

  next() {
    if (this.state.currentIdx < this.state.test.questions.length - 1) {
      this.state.currentIdx++;
      this.renderQuestion();
    }
  },

  prev() {
    if (this.state.currentIdx > 0) {
      this.state.currentIdx--;
      this.renderQuestion();
    }
  },

  async submitTest() {
    // Vérifier qu'au moins quelques questions ont été répondues
    if (Object.keys(this.state.answers).length === 0) {
      if (!confirm('Tu n\'as répondu à aucune question. Soumettre quand même ?')) return;
    }
    
    const screen = document.getElementById('screen-examen');
    screen.innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem;">🤖</div>
        <h2>L'IA corrige ton examen...</h2>
        <div class="loader" style="margin-top: 1rem;"></div>
      </div>
    `;
    
    const answersArray = Object.entries(this.state.answers).map(([qid, ans]) => ({
      questionId: parseInt(qid),
      answer: ans,
    }));
    
    const { data, error } = await App.api('/api/grade-test', {
      method: 'POST',
      body: { test: this.state.test, answers: answersArray },
    });
    
    if (error || !data) {
      App.toast('Erreur correction : ' + (error || 'inconnue'), 'error');
      this.renderQuestion();
      return;
    }
    
    this.state.results = data;
    
    // Sauvegarder dans Supabase
    try {
      await App.supabase.from('exam_history').insert({
        user_id: App.user.id,
        domain: this.state.test.domain,
        level: this.state.test.level,
        difficulty: this.state.test.difficulty,
        question_count: this.state.test.questions.length,
        test_data: this.state.test,
        user_answers: this.state.answers,
        results: data.results,
        score: data.score.percentage,
        grade: data.score.grade,
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Save exam error (non-fatal):', e);
    }
    
    this.renderResults();
  },

  renderResults() {
    const r = this.state.results;
    const screen = document.getElementById('screen-examen');
    
    const scoreColor = r.score.percentage >= 75 ? 'var(--green)' : 
                       r.score.percentage >= 60 ? 'var(--blue)' : 
                       r.score.percentage >= 40 ? 'var(--yellow)' : 'var(--red)';
    const scoreText = r.score.percentage >= 60 ? 'white' : (r.score.percentage >= 40 ? 'var(--ink)' : 'white');
    
    screen.innerHTML = `
      <div class="card result-card" style="background: ${scoreColor}; color: ${scoreText}; border-color: var(--ink);">
        <div class="mono" style="font-size: 0.75rem; opacity: 0.8;">SCORE</div>
        <div class="result-score">${r.score.grade}</div>
        <div class="result-percent">${r.score.correct}/${r.score.total} · ${r.score.percentage}%</div>
      </div>

      <div class="card mt-2" style="background: var(--ink); color: var(--cream);">
        <div class="mono" style="font-size: 0.7rem; opacity: 0.7; margin-bottom: 0.5rem;">BILAN PERSONNALISÉ</div>
        <p style="font-weight: 500; line-height: 1.5;">${this.escape(r.overall_feedback || '')}</p>
      </div>

      ${r.strengths?.length ? `
        <div class="card mt-1" style="background: var(--green); color: white;">
          <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">💪 TES FORCES</div>
          ${r.strengths.map(s => `<p style="font-weight: 500; padding: 0.2rem 0;">→ ${this.escape(s)}</p>`).join('')}
        </div>
      ` : ''}

      ${r.weaknesses?.length ? `
        <div class="card mt-1" style="background: var(--red); color: white;">
          <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">⚠️ À TRAVAILLER</div>
          ${r.weaknesses.map(w => `<p style="font-weight: 500; padding: 0.2rem 0;">→ ${this.escape(w)}</p>`).join('')}
        </div>
      ` : ''}

      ${r.recommendations?.length ? `
        <div class="card mt-1" style="background: var(--yellow);">
          <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.5rem;">📌 RECOMMANDATIONS</div>
          ${r.recommendations.map(rec => `<p style="font-weight: 500; padding: 0.2rem 0;">→ ${this.escape(rec)}</p>`).join('')}
        </div>
      ` : ''}

      <div class="section-title mt-2">
        <h2 style="font-size: 1.1rem;">Détail par question</h2>
      </div>

      ${(r.results || []).map((item, i) => `
        <div class="card mb-1" style="border-left: 4px solid ${item.is_correct ? 'var(--green)' : (item.verdict === 'partial' ? 'var(--yellow)' : 'var(--red)')};">
          <div class="flex-between mb-1">
            <span class="mono text-muted" style="font-size: 0.75rem;">Q${i + 1}</span>
            <span style="font-weight: 700; font-size: 0.85rem;">
              ${item.is_correct ? '✅' : (item.verdict === 'partial' ? '🟡' : '❌')}
              ${item.points} pt${item.points !== 1 ? 's' : ''}
            </span>
          </div>
          <p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">${this.escape(item.question)}</p>
          <div style="font-size: 0.85rem;">
            <div><strong>Ta réponse :</strong> ${this.escape(String(item.user_answer))}</div>
            ${!item.is_correct ? `<div style="color: var(--green);"><strong>Réponse :</strong> ${this.escape(String(item.correct_answer))}</div>` : ''}
          </div>
          ${item.feedback ? `
            <div class="mt-1" style="padding-top: 0.5rem; border-top: 1px dashed var(--muted); font-size: 0.85rem; color: var(--muted);">
              ${this.escape(item.feedback)}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="mt-2" style="display: flex; gap: 0.75rem; margin-bottom: 2rem;">
        <button class="btn btn-block" onclick="Examen.show()">Nouvel examen</button>
        <button class="btn btn-primary btn-block" onclick="App.showMain()">Accueil</button>
      </div>
    `;
    
    window.scrollTo(0, 0);
  },

  escape(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },
};
