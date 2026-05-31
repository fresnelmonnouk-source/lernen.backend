// ============================================================
// LERNEN.DE — Module Cours
// ============================================================
// Workflow :
// 1. Écran de sélection : catégorie → niveau → format → sujet
// 2. Génération du cours via /api/generate-course
// 3. Affichage du cours (sections, exemples, points clés)
// 4. Mini-examen
// 5. Résultats + bilan IA
// 6. Historique consultable
// ============================================================

window.Cours = {
  state: {
    category: null,
    level: null,
    format: null,
    topic: null,
    suggestions: [],
    course: null,
    examAnswers: {},
  },

  // ===== Point d'entrée =====
  show() {
    // Pré-remplir le niveau depuis le profil
    if (App.profile?.current_level && !this.state.level) {
      this.state.level = App.profile.current_level;
    }
    if (App.profile?.preferred_course_format && !this.state.format) {
      this.state.format = App.profile.preferred_course_format;
    }
    this.renderSelectionScreen();
  },

  // ===== ÉCRAN 1 : Sélection =====
  renderSelectionScreen() {
    const screen = document.getElementById('screen-cours');
    screen.innerHTML = `
      <button class="back-btn" onclick="App.showMain()">← Retour</button>
      
      <div style="margin-bottom: 1rem;">
        <div class="badge" style="background: var(--yellow); color: var(--ink);">📖 COURS</div>
        <h1 style="margin-top: 0.5rem;">Crée ton cours</h1>
        <p class="text-muted" style="font-weight: 500; font-size: 0.9rem;">
          L'IA va te préparer un cours personnalisé
        </p>
      </div>

      <!-- Étape 1 : Catégorie -->
      <div class="card mb-1">
        <h3 style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--muted);">1. CATÉGORIE</h3>
        <div class="option-row" id="cat-options">
          ${['vocabulary','grammar','conjugation','spelling','expression','culture'].map(c => `
            <button class="option-btn ${this.state.category === c ? 'active' : ''}" data-cat="${c}">
              ${this.categoryLabel(c)}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Étape 2 : Niveau -->
      <div class="card mb-1">
        <h3 style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--muted);">2. NIVEAU</h3>
        <div class="option-row" id="level-options">
          ${['A1','A2','B1','B2'].map(l => `
            <button class="option-btn ${this.state.level === l ? 'active' : ''}" data-level="${l}">${l}</button>
          `).join('')}
        </div>
      </div>

      <!-- Étape 3 : Format -->
      <div class="card mb-1">
        <h3 style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--muted);">3. FORMAT</h3>
        <div class="option-row" id="format-options" style="grid-template-columns: 1fr 1fr 1fr;">
          <button class="option-btn ${this.state.format === 'short' ? 'active' : ''}" data-format="short">
            <strong>Court</strong><br><span style="font-weight:400;font-size:0.7rem;">~10 min</span>
          </button>
          <button class="option-btn ${this.state.format === 'standard' ? 'active' : ''}" data-format="standard">
            <strong>Standard</strong><br><span style="font-weight:400;font-size:0.7rem;">~20 min</span>
          </button>
          <button class="option-btn ${this.state.format === 'long' ? 'active' : ''}" data-format="long">
            <strong>Long</strong><br><span style="font-weight:400;font-size:0.7rem;">~30 min</span>
          </button>
        </div>
      </div>

      <!-- Étape 4 : Sujet -->
      <div class="card mb-1">
        <h3 style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--muted);">4. SUJET</h3>
        
        <div class="field">
          <input type="text" id="topic-input" class="input" placeholder="Ex: Les articles définis, Le datif..." 
                 value="${this.state.topic || ''}" maxlength="200">
        </div>
        
        <div id="suggestions-box" class="hidden">
          <div class="mono text-muted mb-1" style="font-size: 0.7rem;">OU CHOISIS UN SUJET SUGGÉRÉ :</div>
          <div id="suggestion-list" class="suggestion-grid"></div>
        </div>
      </div>

      <!-- CTA -->
      <button id="btn-generate-course" class="btn btn-primary btn-block" disabled>
        Générer mon cours →
      </button>

      <!-- Historique récent -->
      <div id="recent-courses-section" style="margin-top: 2rem;">
        <div class="section-title">
          <h2 style="font-size: 1rem;">Tes derniers cours</h2>
          <button class="back-btn" id="btn-view-all-history" style="margin: 0;">Voir tout</button>
        </div>
        <div id="recent-courses-list">
          <div class="text-muted text-center" style="padding: 1rem;">Chargement...</div>
        </div>
      </div>
    `;

    App.showScreen('#screen-cours');

    // Events
    this.bindSelectionEvents();
    this.loadSuggestions();
    this.loadRecentCourses();
  },

  bindSelectionEvents() {
    // Catégorie
    document.querySelectorAll('#cat-options .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#cat-options .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.category = btn.dataset.cat;
        this.loadSuggestions();
        this.updateGenerateBtn();
      };
    });

    // Niveau
    document.querySelectorAll('#level-options .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#level-options .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.level = btn.dataset.level;
        this.loadSuggestions();
        this.updateGenerateBtn();
      };
    });

    // Format
    document.querySelectorAll('#format-options .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#format-options .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.format = btn.dataset.format;
        this.updateGenerateBtn();
      };
    });

    // Sujet (input)
    document.getElementById('topic-input').oninput = (e) => {
      this.state.topic = e.target.value.trim();
      this.updateGenerateBtn();
    };

    // Bouton générer
    document.getElementById('btn-generate-course').onclick = () => this.generateCourse();

    // Voir tout l'historique
    document.getElementById('btn-view-all-history').onclick = () => this.showFullHistory();
  },

  async loadSuggestions() {
    if (!this.state.category || !this.state.level) {
      document.getElementById('suggestions-box').classList.add('hidden');
      return;
    }
    
    document.getElementById('suggestions-box').classList.remove('hidden');
    const listEl = document.getElementById('suggestion-list');
    listEl.innerHTML = '<div class="text-muted">Chargement...</div>';
    
    const { data, error } = await App.api('/api/course-suggestions', {
      query: { level: this.state.level, category: this.state.category },
    });
    
    if (error || !data?.suggestions) {
      listEl.innerHTML = '<div class="text-muted">Aucune suggestion</div>';
      return;
    }
    
    this.state.suggestions = data.suggestions;
    listEl.innerHTML = data.suggestions.map(s => `
      <button class="suggestion-chip" data-suggestion="${this.escapeHtml(s)}">${this.escapeHtml(s)}</button>
    `).join('');
    
    listEl.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.onclick = () => {
        listEl.querySelectorAll('.suggestion-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const topic = chip.dataset.suggestion;
        document.getElementById('topic-input').value = topic;
        this.state.topic = topic;
        this.updateGenerateBtn();
      };
    });
  },

  updateGenerateBtn() {
    const btn = document.getElementById('btn-generate-course');
    if (!btn) return;
    const ok = this.state.category && this.state.level && this.state.format && this.state.topic?.length >= 3;
    btn.disabled = !ok;
  },

  async loadRecentCourses() {
    const listEl = document.getElementById('recent-courses-list');
    const { data, error } = await App.api('/api/course-history', { query: { limit: 5 } });
    
    if (error || !data?.courses || data.courses.length === 0) {
      listEl.innerHTML = `
        <p class="text-muted text-center" style="padding: 1rem; font-size: 0.9rem;">
          Tu n'as pas encore de cours. Commence ton premier ci-dessus ! ☝️
        </p>
      `;
      return;
    }
    
    listEl.innerHTML = data.courses.map(c => `
      <div class="history-item" data-course-id="${c.id}">
        <div style="flex: 1; min-width: 0;">
          <div class="history-item-title">${this.escapeHtml(c.title)}</div>
          <div class="history-item-meta">
            <span class="badge badge-${c.level}">${c.level}</span>
            ${c.exam_completed ? `<span style="margin-left: 0.5rem;">✅ ${c.exam_score}%</span>` : '<span style="margin-left: 0.5rem; opacity: 0.6;">En cours</span>'}
            <span style="margin-left: 0.5rem;">· ${this.formatDate(c.created_at)}</span>
          </div>
        </div>
        <div style="font-size: 1.3rem;">→</div>
      </div>
    `).join('');
    
    listEl.querySelectorAll('.history-item').forEach(item => {
      item.onclick = () => this.openHistoryCourse(item.dataset.courseId);
    });
  },

  // ===== Génération du cours =====
  async generateCourse() {
    const btn = document.getElementById('btn-generate-course');
    btn.disabled = true;
    btn.innerHTML = '<div class="loader" style="width:18px;height:18px;border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>';
    
    // Loader plein écran
    const screen = document.getElementById('screen-cours');
    screen.innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📖</div>
        <h2 style="text-align: center;">L'IA prépare ton cours...</h2>
        <p class="text-muted" style="text-align: center; max-width: 300px;">
          Sujet : <strong>${this.escapeHtml(this.state.topic)}</strong><br>
          Niveau : ${this.state.level} · Format : ${this.state.format}
        </p>
        <div class="loader" style="margin-top: 1rem;"></div>
        <p class="mono text-muted" style="font-size: 0.75rem; margin-top: 2rem;">
          Génération avec DeepSeek V4 · 5-15 sec
        </p>
      </div>
    `;
    
    const { data, error } = await App.api('/api/generate-course', {
      method: 'POST',
      body: {
        topic: this.state.topic,
        category: this.state.category,
        level: this.state.level,
        format: this.state.format,
      },
    });
    
    if (error || !data?.course) {
      App.toast('Erreur : ' + (error || 'génération échouée'), 'error');
      this.renderSelectionScreen();
      return;
    }
    
    this.state.course = data.course;
    this.state.courseId = data.course_id;
    this.renderCourse();
  },

  // ===== ÉCRAN 2 : Affichage du cours =====
  renderCourse() {
    const c = this.state.course;
    const screen = document.getElementById('screen-cours');
    
    screen.innerHTML = `
      <button class="back-btn" onclick="Cours.confirmExit()">← Retour</button>
      
      <div style="margin-bottom: 1rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
          <span class="badge badge-${c.level}">${c.level}</span>
          <span class="badge" style="background: var(--cream); color: var(--ink);">${this.categoryLabel(c.category)}</span>
          <span class="badge" style="background: var(--yellow); color: var(--ink);">⏱ ${c.estimated_duration_minutes}min</span>
        </div>
        <h1 style="margin-top: 0.75rem; font-size: 1.6rem;">${this.escapeHtml(c.title)}</h1>
      </div>

      <!-- Introduction -->
      <div class="card mb-1" style="background: var(--blue); color: white;">
        <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">OBJECTIF DU COURS</div>
        <p style="font-size: 1rem; line-height: 1.4; margin-bottom: 0.75rem;">${this.escapeHtml(c.introduction?.objective || '')}</p>
        ${c.introduction?.why_important ? `
          <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.3rem;">POURQUOI C'EST UTILE</div>
          <p style="font-size: 0.9rem; line-height: 1.4;">${this.escapeHtml(c.introduction.why_important)}</p>
        ` : ''}
        ${c.introduction?.prerequisites && c.introduction.prerequisites !== 'aucun' ? `
          <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.75rem; margin-bottom: 0.3rem;">PRÉREQUIS</div>
          <p style="font-size: 0.9rem;">${this.escapeHtml(c.introduction.prerequisites)}</p>
        ` : ''}
      </div>

      <!-- Sections -->
      <div class="course-content">
        ${(c.sections || []).map(s => `
          <div class="course-section">
            <h3>${s.section_number}. ${this.escapeHtml(s.title)}</h3>
            <p style="line-height: 1.5; margin-bottom: 1rem;">${this.escapeHtml(s.explanation)}</p>
            
            ${(s.examples || []).map(ex => `
              <div class="course-example">
                <div class="de">${this.escapeHtml(ex.german)}</div>
                <div class="fr">${this.escapeHtml(ex.french)}</div>
                <div class="commentary">${this.escapeHtml(ex.commentary)}</div>
              </div>
            `).join('')}
            
            ${(s.common_mistakes || []).length > 0 ? `
              <div class="card" style="background: var(--red); color: white; margin-top: 1rem;">
                <div class="mono" style="font-size: 0.7rem; opacity: 0.8; margin-bottom: 0.5rem;">⚠️ ERREUR À ÉVITER</div>
                ${s.common_mistakes.map(m => `<p style="font-size: 0.9rem;">${this.escapeHtml(m)}</p>`).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Points clés -->
      <div class="key-points">
        <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.75rem;">📌 À RETENIR</div>
        <ul>
          ${(c.key_points || []).map(p => `<li>${this.escapeHtml(p)}</li>`).join('')}
        </ul>
      </div>

      <!-- CTA Mini-examen -->
      <button id="btn-start-exam" class="btn btn-primary btn-block mt-2" style="margin-bottom: 2rem;">
        🎯 Passer le mini-examen (${(c.mini_exam?.questions || []).length} questions)
      </button>
    `;

    window.scrollTo(0, 0);
    document.getElementById('btn-start-exam').onclick = () => this.startExam();
  },

  // ===== ÉCRAN 3 : Mini-examen =====
  startExam() {
    this.state.examAnswers = {};
    this.renderExam();
  },

  renderExam() {
    const c = this.state.course;
    const questions = c.mini_exam?.questions || [];
    const screen = document.getElementById('screen-cours');
    
    screen.innerHTML = `
      <button class="back-btn" onclick="Cours.confirmCancelExam()">← Retour au cours</button>
      
      <div style="margin-bottom: 1rem;">
        <div class="badge" style="background: var(--red); color: white;">🎯 MINI-EXAMEN</div>
        <h1 style="margin-top: 0.5rem;">${this.escapeHtml(c.title)}</h1>
        ${c.mini_exam?.instructions ? `
          <p class="text-muted mt-1" style="font-weight: 500; font-size: 0.9rem;">${this.escapeHtml(c.mini_exam.instructions)}</p>
        ` : ''}
      </div>

      <div id="exam-questions">
        ${questions.map((q, i) => this.renderQuestion(q, i)).join('')}
      </div>

      <button id="btn-submit-exam" class="btn btn-primary btn-block mt-2" style="margin-bottom: 2rem;" disabled>
        Soumettre ma copie
      </button>
    `;

    window.scrollTo(0, 0);

    // Events
    document.querySelectorAll('.exam-option').forEach(opt => {
      opt.onclick = () => this.selectOption(opt);
    });
    document.querySelectorAll('.open-answer').forEach(inp => {
      inp.oninput = () => {
        this.state.examAnswers[inp.dataset.qid] = inp.value;
        this.updateSubmitBtn();
      };
    });
    document.getElementById('btn-submit-exam').onclick = () => this.submitExam();
  },

  renderQuestion(q, index) {
    if (q.type === 'mcq') {
      return `
        <div class="exam-question">
          <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">QUESTION ${index + 1}/${this.state.course.mini_exam.questions.length}</div>
          <p style="font-weight: 700; margin-bottom: 0.5rem;">${this.escapeHtml(q.question)}</p>
          <div class="exam-options">
            ${(q.options || []).map((opt, i) => `
              <button class="exam-option" data-qid="${q.id}" data-idx="${i}">
                <div class="marker">${String.fromCharCode(65 + i)}</div>
                <div>${this.escapeHtml(opt)}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    } else {
      return `
        <div class="exam-question">
          <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">QUESTION ${index + 1}/${this.state.course.mini_exam.questions.length}</div>
          <p style="font-weight: 700; margin-bottom: 0.75rem;">${this.escapeHtml(q.question)}</p>
          <input type="text" class="input open-answer" data-qid="${q.id}" placeholder="Ta réponse..." autocomplete="off">
        </div>
      `;
    }
  },

  selectOption(btn) {
    const qid = btn.dataset.qid;
    const idx = parseInt(btn.dataset.idx);
    
    // Désélectionner les autres options de la même question
    document.querySelectorAll(`.exam-option[data-qid="${qid}"]`).forEach(o => o.classList.remove('selected'));
    btn.classList.add('selected');
    
    this.state.examAnswers[qid] = idx;
    this.updateSubmitBtn();
  },

  updateSubmitBtn() {
    const total = (this.state.course.mini_exam?.questions || []).length;
    const answered = Object.keys(this.state.examAnswers).filter(k => {
      const v = this.state.examAnswers[k];
      return v !== '' && v !== null && v !== undefined;
    }).length;
    const btn = document.getElementById('btn-submit-exam');
    if (!btn) return;
    btn.disabled = answered < total;
    btn.textContent = answered < total 
      ? `Répondre à ${total - answered} question${total - answered > 1 ? 's' : ''} restante${total - answered > 1 ? 's' : ''}`
      : 'Soumettre ma copie';
  },

  async submitExam() {
    const btn = document.getElementById('btn-submit-exam');
    btn.disabled = true;
    
    // Loader plein écran
    document.getElementById('screen-cours').innerHTML = `
      <div class="loader-page" style="min-height: 70vh;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🤖</div>
        <h2>L'IA corrige ta copie...</h2>
        <div class="loader" style="margin-top: 1rem;"></div>
      </div>
    `;
    
    const answersArray = Object.keys(this.state.examAnswers).map(qid => ({
      questionId: parseInt(qid),
      answer: this.state.examAnswers[qid],
    }));
    
    const { data, error } = await App.api('/api/grade-course-exam', {
      method: 'POST',
      body: { course_id: this.state.courseId, answers: answersArray },
    });
    
    if (error || !data) {
      App.toast('Erreur correction : ' + (error || 'inconnue'), 'error');
      this.renderExam();
      return;
    }
    
    this.state.results = data;
    this.renderResults();
  },

  // ===== ÉCRAN 4 : Résultats =====
  renderResults() {
    const r = this.state.results;
    const screen = document.getElementById('screen-cours');
    
    screen.innerHTML = `
      <div class="card result-card" style="background: ${this.scoreColor(r.score.percentage)}; color: white; border-color: var(--ink);">
        <div style="font-size: 4rem;">${r.score.emoji}</div>
        <div class="mono" style="font-size: 0.75rem; opacity: 0.8; margin: 0.5rem 0;">SCORE</div>
        <div class="result-score">${r.score.correct}/${r.score.total}</div>
        <div class="result-percent">${r.score.percentage}% — ${r.score.mention}</div>
      </div>

      <div class="card mt-2" style="background: var(--cream);">
        <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">VERDICT</div>
        <h3 style="text-transform: none; font-size: 1.1rem;">${this.escapeHtml(r.summary?.verdict || '')}</h3>
        <p style="font-weight: 500; margin-top: 0.75rem;">${this.escapeHtml(r.summary?.feedback || '')}</p>
        ${r.summary?.next_action ? `
          <div class="card" style="background: white; margin-top: 0.75rem;">
            <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.3rem;">PROCHAINE ÉTAPE</div>
            <p style="font-size: 0.9rem; font-weight: 500;">${this.escapeHtml(r.summary.next_action)}</p>
          </div>
        ` : ''}
      </div>

      <div class="section-title" style="margin-top: 2rem;">
        <h2 style="font-size: 1.1rem;">Correction détaillée</h2>
      </div>

      ${(r.results || []).map((item, i) => `
        <div class="card mb-1" style="border-left: 4px solid ${item.is_correct ? 'var(--green)' : (item.verdict === 'partial' ? 'var(--yellow)' : 'var(--red)')};">
          <div class="flex-between mb-1">
            <span class="mono text-muted" style="font-size: 0.75rem;">Q${i + 1}</span>
            <span style="font-weight: 700; font-size: 0.85rem;">
              ${item.is_correct ? '✅ Correct' : (item.verdict === 'partial' ? '🟡 Partiel' : '❌ Faux')}
              · ${item.points} pt${item.points !== 1 ? 's' : ''}
            </span>
          </div>
          <p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.95rem;">${this.escapeHtml(item.question)}</p>
          <div style="font-size: 0.85rem;">
            <div><strong>Ta réponse :</strong> ${this.escapeHtml(String(item.user_answer))}</div>
            ${!item.is_correct ? `<div style="color: var(--green);"><strong>Bonne réponse :</strong> ${this.escapeHtml(String(item.correct_answer))}</div>` : ''}
          </div>
          ${item.feedback ? `
            <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--muted); font-size: 0.85rem; color: var(--muted);">
              ${this.escapeHtml(item.feedback)}
            </div>
          ` : ''}
        </div>
      `).join('')}

      <div class="mt-2" style="display: flex; gap: 0.75rem; margin-bottom: 2rem;">
        <button class="btn btn-block" onclick="Cours.show()">Nouveau cours</button>
        <button class="btn btn-primary btn-block" onclick="App.showMain()">Accueil</button>
      </div>
    `;

    window.scrollTo(0, 0);
  },

  // ===== Historique complet =====
  async showFullHistory() {
    const screen = document.getElementById('screen-cours');
    screen.innerHTML = `
      <button class="back-btn" onclick="Cours.show()">← Retour</button>
      <h1>Historique des cours</h1>
      <div id="full-history-list" class="mt-1">
        <div class="text-muted">Chargement...</div>
      </div>
    `;

    const { data, error } = await App.api('/api/course-history', { query: { limit: 100 } });
    const listEl = document.getElementById('full-history-list');

    if (error || !data?.courses) {
      listEl.innerHTML = '<p class="text-muted">Erreur de chargement</p>';
      return;
    }

    if (data.courses.length === 0) {
      listEl.innerHTML = '<p class="text-muted text-center" style="padding: 2rem;">Aucun cours pour le moment.</p>';
      return;
    }

    // Stats
    listEl.innerHTML = `
      <div class="card mb-2" style="background: var(--ink); color: var(--cream);">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; text-align: center;">
          <div><div style="font-size: 1.8rem; font-weight: 800;">${data.stats.total}</div><div class="mono text-muted" style="font-size: 0.7rem;">TOTAL</div></div>
          <div><div style="font-size: 1.8rem; font-weight: 800;">${data.stats.completed}</div><div class="mono text-muted" style="font-size: 0.7rem;">TERMINÉS</div></div>
          <div><div style="font-size: 1.8rem; font-weight: 800;">${data.stats.average_score || '—'}${data.stats.average_score ? '%' : ''}</div><div class="mono text-muted" style="font-size: 0.7rem;">MOYENNE</div></div>
        </div>
      </div>
      <div id="all-courses">
        ${data.courses.map(c => `
          <div class="history-item" data-course-id="${c.id}">
            <div style="flex: 1; min-width: 0;">
              <div class="history-item-title">${this.escapeHtml(c.title)}</div>
              <div class="history-item-meta">
                <span class="badge badge-${c.level}">${c.level}</span>
                ${c.exam_completed ? `<span style="margin-left: 0.5rem;">✅ ${c.exam_score}%</span>` : '<span style="margin-left: 0.5rem;">En cours</span>'}
                <span style="margin-left: 0.5rem;">· ${this.formatDate(c.created_at)}</span>
              </div>
            </div>
            <div style="font-size: 1.3rem;">→</div>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('#all-courses .history-item').forEach(item => {
      item.onclick = () => this.openHistoryCourse(item.dataset.courseId);
    });
  },

  async openHistoryCourse(courseId) {
    const screen = document.getElementById('screen-cours');
    screen.innerHTML = '<div class="loader-page"><div class="loader"></div></div>';
    
    const { data, error } = await App.api('/api/course-history', { query: { id: courseId } });
    if (error || !data?.course) {
      App.toast('Erreur de chargement', 'error');
      this.show();
      return;
    }
    
    this.state.course = data.course.course_data;
    this.state.courseId = data.course.id;
    
    // Si l'examen est déjà fait, montrer directement les résultats
    if (data.course.exam_completed && data.course.exam_data) {
      this.state.results = {
        score: {
          correct: Math.round((data.course.exam_score / 100) * (this.state.course.mini_exam?.questions?.length || 0)),
          total: this.state.course.mini_exam?.questions?.length || 0,
          percentage: data.course.exam_score,
          mention: this.getMention(data.course.exam_score),
          emoji: this.getEmoji(data.course.exam_score),
        },
        results: data.course.exam_data.results || [],
        summary: data.course.exam_data.summary || {},
      };
      this.renderResults();
    } else {
      this.renderCourse();
    }
  },

  // ===== Utils =====
  confirmExit() {
    if (confirm('Quitter le cours ? Ta progression est sauvegardée.')) {
      this.state = { ...this.state, course: null, examAnswers: {}, courseId: null };
      App.showMain();
    }
  },

  confirmCancelExam() {
    if (confirm('Annuler l\'examen ? Tes réponses ne seront pas enregistrées.')) {
      this.renderCourse();
    }
  },

  categoryLabel(c) {
    return {
      vocabulary: '📚 Vocabulaire',
      grammar: '✏️ Grammaire',
      conjugation: '🔄 Conjugaison',
      spelling: '🔤 Orthographe',
      expression: '💬 Expression',
      culture: '🎭 Culture',
    }[c] || c;
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  formatDate(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  },

  scoreColor(pct) {
    if (pct >= 75) return 'var(--green)';
    if (pct >= 60) return 'var(--blue)';
    if (pct >= 40) return 'var(--yellow)';
    return 'var(--red)';
  },

  getMention(pct) {
    if (pct >= 90) return 'Excellent';
    if (pct >= 75) return 'Très bien';
    if (pct >= 60) return 'Bien';
    if (pct >= 40) return 'Passable';
    return 'À retravailler';
  },

  getEmoji(pct) {
    if (pct >= 90) return '🌟';
    if (pct >= 75) return '✨';
    if (pct >= 60) return '👍';
    if (pct >= 40) return '🤔';
    return '💪';
  },
};
