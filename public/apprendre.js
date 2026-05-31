// ============================================================
// LERNEN.DE — Module Apprendre
// ============================================================
// Sous-modules : Vocabulaire (flashcards), Quiz (QCM), Conjugaison
// Utilise data.js (1377 mots) et verbs-data.js (98 verbes)
// ============================================================

window.Apprendre = {
  state: {
    submode: null,         // 'vocab' | 'quiz' | 'conj'
    category: null,
    level: null,
    cards: [],
    currentIdx: 0,
    quizQuestions: [],
    quizScore: 0,
    conjMode: null,        // 'lookup' | 'tableau' | 'irregular'
    conjVerb: null,
    conjTense: null,
    conjAnswers: {},
  },

  show() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="App.showMain()">← Retour</button>
      
      <div style="margin-bottom: 1.5rem;">
        <div class="badge" style="background: var(--blue); color: white;">🎴 APPRENDRE</div>
        <h1 style="margin-top: 0.5rem;">Pratique sans IA</h1>
        <p class="text-muted" style="font-weight: 500; font-size: 0.9rem;">
          Vocabulaire, quiz et conjugaison — 100% hors-ligne
        </p>
      </div>

      <div class="menu-grid">
        <div class="menu-card menu-card-cours" data-sub="vocab">
          <div class="menu-card-emoji">📚</div>
          <div>
            <div class="menu-card-title">Vocabulaire</div>
            <div class="menu-card-sub">1377 mots flashcards</div>
          </div>
        </div>

        <div class="menu-card menu-card-examen" data-sub="quiz">
          <div class="menu-card-emoji">🎲</div>
          <div>
            <div class="menu-card-title">Quiz</div>
            <div class="menu-card-sub">QCM rapide</div>
          </div>
        </div>

        <div class="menu-card menu-card-cert" data-sub="conj" style="grid-column: span 2; aspect-ratio: 2/1;">
          <div class="menu-card-emoji">🔄</div>
          <div>
            <div class="menu-card-title">Conjugaison</div>
            <div class="menu-card-sub">98 verbes pré-conjugués + IA</div>
          </div>
        </div>
      </div>
    `;
    
    App.showScreen('#screen-apprendre');
    
    document.querySelectorAll('.menu-card[data-sub]').forEach(card => {
      card.onclick = () => {
        const sub = card.dataset.sub;
        if (sub === 'vocab') this.showVocab();
        else if (sub === 'quiz') this.showQuiz();
        else if (sub === 'conj') this.showConj();
      };
    });
  },

  // ==================== VOCABULAIRE ====================
  showVocab() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.show()">← Retour</button>
      <h1>📚 Vocabulaire</h1>
      <p class="text-muted mb-1" style="font-weight: 500;">Choisis une catégorie et un niveau</p>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">CATÉGORIE</h3>
        <div class="option-row" id="vocab-cat">
          <button class="option-btn" data-cat="noms">Noms</button>
          <button class="option-btn" data-cat="verbes">Verbes</button>
          <button class="option-btn" data-cat="adjectifs">Adjectifs</button>
          <button class="option-btn" data-cat="prepositions">Prépos.</button>
          <button class="option-btn" data-cat="expressions">Express.</button>
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">NIVEAU</h3>
        <div class="option-row" id="vocab-level">
          <button class="option-btn" data-level="all">Tous</button>
          <button class="option-btn" data-level="A1">A1</button>
          <button class="option-btn" data-level="A2">A2</button>
          <button class="option-btn" data-level="B1">B1</button>
          <button class="option-btn" data-level="B2">B2</button>
        </div>
      </div>

      <button id="btn-start-vocab" class="btn btn-primary btn-block" disabled>
        Commencer
      </button>
    `;

    let selCat = null, selLvl = null;
    document.querySelectorAll('#vocab-cat .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#vocab-cat .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selCat = btn.dataset.cat;
        document.getElementById('btn-start-vocab').disabled = !(selCat && selLvl);
      };
    });
    document.querySelectorAll('#vocab-level .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#vocab-level .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selLvl = btn.dataset.level;
        document.getElementById('btn-start-vocab').disabled = !(selCat && selLvl);
      };
    });

    document.getElementById('btn-start-vocab').onclick = () => {
      this.startFlashcards(selCat, selLvl);
    };
  },

  startFlashcards(category, level) {
    let cards = (window.VOCAB?.[category] || []).slice();
    if (level !== 'all') cards = cards.filter(c => c.l === level);
    
    if (cards.length === 0) {
      App.toast('Aucun mot pour ce filtre', 'error');
      return;
    }
    
    // Shuffle
    cards.sort(() => Math.random() - 0.5);
    
    this.state.cards = cards;
    this.state.currentIdx = 0;
    this.state.category = category;
    this.renderFlashcard();
  },

  renderFlashcard() {
    const card = this.state.cards[this.state.currentIdx];
    if (!card) return;
    const total = this.state.cards.length;
    const idx = this.state.currentIdx;
    
    // Couleur d'article pour les noms
    const articleColor = card.a === 'der' ? 'var(--blue)' : card.a === 'die' ? 'var(--red)' : card.a === 'das' ? 'var(--green)' : 'var(--ink)';
    
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.showVocab()">← Retour</button>
      
      <div class="flex-between mb-1">
        <span class="mono text-muted" style="font-size: 0.8rem;">${idx + 1} / ${total}</span>
        <span class="badge badge-${card.l}">${card.l}</span>
      </div>

      <!-- Flashcard -->
      <div id="flashcard" style="
        background: var(--paper);
        border: var(--border);
        border-radius: var(--r-lg);
        box-shadow: var(--shadow-lg);
        padding: 2rem 1.5rem;
        min-height: 280px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        cursor: pointer;
        user-select: none;
        margin-bottom: 1.5rem;
      ">
        <div id="card-front">
          <div style="font-size: 4rem; margin-bottom: 1rem;">${card.e || '📖'}</div>
          <div class="serif" style="font-size: 2rem; line-height: 1.1;">${card.f}</div>
          <div class="mono text-muted" style="font-size: 0.75rem; margin-top: 2rem;">TAPE POUR VOIR LA TRADUCTION</div>
        </div>
        <div id="card-back" class="hidden">
          ${card.a ? `<div style="color: ${articleColor}; font-weight: 800; font-size: 1.4rem; text-transform: uppercase; margin-bottom: 0.5rem;">${card.a}</div>` : ''}
          <div style="font-size: 2.2rem; font-weight: 800; line-height: 1.1; margin-bottom: 0.5rem;">${card.d}</div>
          <div class="serif text-muted" style="font-size: 1.1rem; margin-top: 1rem;">${card.f}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <button class="btn ${idx === 0 ? '' : ''}" onclick="Apprendre.prevCard()" ${idx === 0 ? 'disabled' : ''}>← Précédent</button>
        <button class="btn btn-primary" onclick="Apprendre.nextCard()">${idx === total - 1 ? 'Terminer' : 'Suivant →'}</button>
      </div>

      <button class="btn btn-yellow btn-block mt-2" onclick="Apprendre.shuffleAndRestart()">🔀 Mélanger</button>
    `;

    document.getElementById('flashcard').onclick = () => {
      document.getElementById('card-front').classList.toggle('hidden');
      document.getElementById('card-back').classList.toggle('hidden');
    };
  },

  nextCard() {
    if (this.state.currentIdx < this.state.cards.length - 1) {
      this.state.currentIdx++;
      this.renderFlashcard();
    } else {
      this.showVocabComplete();
    }
  },

  prevCard() {
    if (this.state.currentIdx > 0) {
      this.state.currentIdx--;
      this.renderFlashcard();
    }
  },

  shuffleAndRestart() {
    this.state.cards.sort(() => Math.random() - 0.5);
    this.state.currentIdx = 0;
    this.renderFlashcard();
  },

  showVocabComplete() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <div class="result-card">
        <div style="font-size: 5rem;">🎉</div>
        <h1 style="margin-top: 1rem;">Bravo !</h1>
        <p class="text-muted mt-1" style="font-weight: 500;">
          Tu as révisé ${this.state.cards.length} mots
        </p>
        <div style="display: flex; gap: 0.75rem; margin-top: 2rem;">
          <button class="btn btn-block" onclick="Apprendre.showVocab()">Autre catégorie</button>
          <button class="btn btn-primary btn-block" onclick="Apprendre.shuffleAndRestart()">Recommencer</button>
        </div>
      </div>
    `;
  },

  // ==================== QUIZ ====================
  showQuiz() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.show()">← Retour</button>
      <h1>🎲 Quiz</h1>
      <p class="text-muted mb-1" style="font-weight: 500;">QCM de traduction — 10 questions</p>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">CATÉGORIE</h3>
        <div class="option-row" id="quiz-cat">
          <button class="option-btn" data-cat="noms">Noms</button>
          <button class="option-btn" data-cat="verbes">Verbes</button>
          <button class="option-btn" data-cat="adjectifs">Adjectifs</button>
          <button class="option-btn" data-cat="all">Tout mélangé</button>
        </div>
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">NIVEAU</h3>
        <div class="option-row" id="quiz-level">
          <button class="option-btn" data-level="all">Tous</button>
          <button class="option-btn" data-level="A1">A1</button>
          <button class="option-btn" data-level="A2">A2</button>
          <button class="option-btn" data-level="B1">B1</button>
          <button class="option-btn" data-level="B2">B2</button>
        </div>
      </div>

      <button id="btn-start-quiz" class="btn btn-primary btn-block" disabled>Commencer</button>
    `;

    let selCat = null, selLvl = null;
    document.querySelectorAll('#quiz-cat .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#quiz-cat .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selCat = btn.dataset.cat;
        document.getElementById('btn-start-quiz').disabled = !(selCat && selLvl);
      };
    });
    document.querySelectorAll('#quiz-level .option-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('#quiz-level .option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selLvl = btn.dataset.level;
        document.getElementById('btn-start-quiz').disabled = !(selCat && selLvl);
      };
    });
    document.getElementById('btn-start-quiz').onclick = () => this.startQuiz(selCat, selLvl);
  },

  startQuiz(category, level) {
    // Construire le pool de mots
    let pool = [];
    if (category === 'all') {
      pool = [...(window.VOCAB.noms || []), ...(window.VOCAB.verbes || []), ...(window.VOCAB.adjectifs || [])];
    } else {
      pool = (window.VOCAB[category] || []).slice();
    }
    if (level !== 'all') pool = pool.filter(w => w.l === level);
    
    if (pool.length < 10) {
      App.toast('Pas assez de mots pour ce filtre', 'error');
      return;
    }
    
    // Sélectionner 10 questions
    pool.sort(() => Math.random() - 0.5);
    const questions = pool.slice(0, 10).map(correct => {
      // 3 distracteurs aléatoires
      const distractors = pool.filter(w => w.d !== correct.d).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correct, ...distractors].sort(() => Math.random() - 0.5);
      return {
        prompt: correct.f,
        correctAnswer: correct.d,
        options: options.map(o => o.d),
        article: correct.a,
        level: correct.l,
      };
    });
    
    this.state.quizQuestions = questions;
    this.state.currentIdx = 0;
    this.state.quizScore = 0;
    this.state.quizAnswers = [];
    this.renderQuizQuestion();
  },

  renderQuizQuestion() {
    const q = this.state.quizQuestions[this.state.currentIdx];
    const total = this.state.quizQuestions.length;
    const idx = this.state.currentIdx;
    
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <div class="flex-between mb-1">
        <span class="mono text-muted" style="font-size: 0.8rem;">Question ${idx + 1} / ${total}</span>
        <span class="badge badge-${q.level}">${q.level}</span>
      </div>

      <div class="card mb-1" style="background: var(--ink); color: var(--cream);">
        <div class="mono" style="font-size: 0.75rem; opacity: 0.7; margin-bottom: 0.5rem;">TRADUIS EN ALLEMAND</div>
        <div class="serif" style="font-size: 2rem; font-style: italic;">${q.prompt}</div>
      </div>

      <div class="exam-options" id="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="exam-option" data-idx="${i}">
            <div class="marker">${String.fromCharCode(65 + i)}</div>
            <div>${opt}</div>
          </button>
        `).join('')}
      </div>

      <div class="mono text-muted text-center mt-2" style="font-size: 0.75rem;">
        Score : ${this.state.quizScore} / ${idx}
      </div>
    `;

    document.querySelectorAll('#quiz-options .exam-option').forEach(opt => {
      opt.onclick = () => this.answerQuiz(opt);
    });
  },

  answerQuiz(btn) {
    const q = this.state.quizQuestions[this.state.currentIdx];
    const selectedIdx = parseInt(btn.dataset.idx);
    const selectedAnswer = q.options[selectedIdx];
    const correct = selectedAnswer === q.correctAnswer;
    
    if (correct) this.state.quizScore++;
    
    // Désactiver tous les boutons et révéler
    document.querySelectorAll('#quiz-options .exam-option').forEach(o => {
      o.style.pointerEvents = 'none';
      const optText = o.querySelector('div:last-child').textContent;
      if (optText === q.correctAnswer) {
        o.style.background = 'var(--green)';
        o.style.color = 'white';
        o.style.borderColor = 'var(--green)';
      } else if (o === btn && !correct) {
        o.style.background = 'var(--red)';
        o.style.color = 'white';
        o.style.borderColor = 'var(--red)';
      }
    });
    
    this.state.quizAnswers.push({ q, selected: selectedAnswer, correct });
    
    setTimeout(() => {
      this.state.currentIdx++;
      if (this.state.currentIdx >= this.state.quizQuestions.length) {
        this.showQuizResults();
      } else {
        this.renderQuizQuestion();
      }
    }, 1200);
  },

  showQuizResults() {
    const total = this.state.quizQuestions.length;
    const score = this.state.quizScore;
    const pct = Math.round((score / total) * 100);
    
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <div class="card result-card" style="background: ${pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--blue)' : 'var(--red)'}; color: white; border-color: var(--ink);">
        <div style="font-size: 4rem;">${pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '💪'}</div>
        <div class="mono" style="font-size: 0.75rem; opacity: 0.8; margin: 0.5rem 0;">SCORE</div>
        <div class="result-score">${score}/${total}</div>
        <div class="result-percent">${pct}%</div>
      </div>

      <div class="section-title mt-2">
        <h2 style="font-size: 1.1rem;">Tes erreurs</h2>
      </div>

      ${this.state.quizAnswers.filter(a => !a.correct).map(a => `
        <div class="card mb-1" style="border-left: 4px solid var(--red);">
          <div class="serif" style="font-size: 1.1rem; margin-bottom: 0.3rem;">${a.q.prompt}</div>
          <div style="color: var(--red); font-size: 0.9rem;"><strong>Tu as répondu :</strong> ${a.selected}</div>
          <div style="color: var(--green); font-size: 0.9rem;"><strong>Bonne réponse :</strong> ${a.q.correctAnswer}</div>
        </div>
      `).join('') || '<p class="text-muted text-center" style="padding: 1rem;">✨ Aucune erreur, parfait !</p>'}

      <div style="display: flex; gap: 0.75rem; margin-top: 2rem; margin-bottom: 2rem;">
        <button class="btn btn-block" onclick="Apprendre.showQuiz()">Nouveau quiz</button>
        <button class="btn btn-primary btn-block" onclick="App.showMain()">Accueil</button>
      </div>
    `;
  },

  // ==================== CONJUGAISON ====================
  showConj() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.show()">← Retour</button>
      <h1>🔄 Conjugaison</h1>
      <p class="text-muted mb-1" style="font-weight: 500;">3 modes de pratique</p>

      <div class="card mb-1" style="cursor: pointer;" id="conj-lookup">
        <div class="flex-between">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.3rem;">📖 Consulter</h3>
            <p class="text-muted" style="font-size: 0.85rem; font-weight: 500;">Voir la conjugaison d'un verbe</p>
          </div>
          <div style="font-size: 1.5rem;">→</div>
        </div>
      </div>

      <div class="card mb-1" style="cursor: pointer;" id="conj-tableau">
        <div class="flex-between">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.3rem;">📝 Tableau à remplir</h3>
            <p class="text-muted" style="font-size: 0.85rem; font-weight: 500;">Conjugue les 6 personnes</p>
          </div>
          <div style="font-size: 1.5rem;">→</div>
        </div>
      </div>

      <div class="card mb-1" style="cursor: pointer;" id="conj-irregular">
        <div class="flex-between">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.3rem;">⚡ Régulier ou irrégulier ?</h3>
            <p class="text-muted" style="font-size: 0.85rem; font-weight: 500;">Avec explication IA</p>
          </div>
          <div style="font-size: 1.5rem;">→</div>
        </div>
      </div>
    `;

    document.getElementById('conj-lookup').onclick = () => this.showConjLookup();
    document.getElementById('conj-tableau').onclick = () => this.showConjTableau();
    document.getElementById('conj-irregular').onclick = () => this.showConjIrregular();
  },

  // --- Conjugaison : Consulter ---
  showConjLookup() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.showConj()">← Retour</button>
      <h1>📖 Consulter</h1>
      
      <div class="field">
        <label>Verbe (infinitif allemand)</label>
        <input type="text" id="conj-verb-input" class="input" placeholder="ex: gehen, essen, sich freuen..." autocomplete="off">
        <p class="text-muted mt-1" style="font-size: 0.8rem;">Si le verbe est dans nos 98 verbes pré-conjugués, affichage immédiat. Sinon, l'IA conjugue.</p>
      </div>

      <div class="field">
        <label>Temps</label>
        <select id="conj-tense-select" class="select">
          <option value="Präsens">Präsens (présent)</option>
          <option value="Präteritum">Präteritum (prétérit)</option>
          <option value="Perfekt">Perfekt (parfait)</option>
          <option value="Plusquamperfekt">Plusquamperfekt</option>
          <option value="Futur I">Futur I</option>
          <option value="Konjunktiv II">Konjunktiv II</option>
        </select>
      </div>

      <button id="btn-conj-show" class="btn btn-primary btn-block">Voir la conjugaison</button>
      
      <div id="conj-result" class="mt-2"></div>
    `;

    document.getElementById('btn-conj-show').onclick = () => this.lookupConjugation();
  },

  async lookupConjugation() {
    const verb = document.getElementById('conj-verb-input').value.trim().toLowerCase();
    const tense = document.getElementById('conj-tense-select').value;
    
    if (!verb) { App.toast('Saisis un verbe', 'error'); return; }
    
    const resultEl = document.getElementById('conj-result');
    
    // Chercher dans les 98 verbes pré-conjugués
    const local = (window.VERBS || []).find(v => v.v === verb);
    if (local && (tense === 'Präsens' || tense === 'Präteritum' || tense === 'Perfekt')) {
      this.renderLocalConjugation(local, tense);
      return;
    }
    
    // Sinon, IA
    resultEl.innerHTML = `
      <div class="loader-page" style="min-height: 200px;">
        <div class="loader"></div>
        <div class="mono text-muted">L'IA conjugue ${verb}...</div>
      </div>
    `;
    
    const { data, error } = await App.api('/api/conjugate', {
      method: 'POST',
      body: { verb, tense },
    });
    
    if (error || !data) {
      resultEl.innerHTML = `<p class="text-muted text-center" style="padding: 2rem;">Erreur : ${error || 'IA indisponible'}</p>`;
      return;
    }
    
    this.renderAiConjugation(data);
  },

  renderLocalConjugation(v, tense) {
    const persons = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
    const conj = tense === 'Präsens' ? v.P : tense === 'Präteritum' ? v.T : null;
    const colors = ['var(--blue)', 'var(--red)', 'var(--green)', 'var(--purple)', 'var(--yellow)', 'var(--blue)'];
    
    const html = `
      <div class="card" style="background: var(--paper);">
        <div class="flex-between mb-1">
          <div>
            <h2 style="font-size: 1.5rem; margin: 0;">${v.v}</h2>
            <p class="text-muted" style="font-weight: 500;">${v.f} — ${tense}</p>
          </div>
          <span class="badge badge-${v.l}">${v.l}</span>
        </div>
        
        ${tense !== 'Perfekt' ? `
          <div style="display: grid; grid-template-columns: 80px 1fr; gap: 0.5rem; margin: 1rem 0;">
            ${persons.map((p, i) => `
              <div class="mono" style="color: ${colors[i]}; font-weight: 700; padding: 0.5rem 0;">${p}</div>
              <div style="padding: 0.5rem 0; font-weight: 700; font-size: 1.05rem; border-bottom: 1px dashed var(--light-gray);">${conj[i]}</div>
            `).join('')}
          </div>
        ` : `
          <div class="card" style="background: var(--cream); margin: 1rem 0;">
            <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.5rem;">PERFEKT (3e personne)</div>
            <div style="font-size: 1.5rem; font-weight: 700;">er/sie/es ${v.K}</div>
            <p class="mt-1" style="font-size: 0.85rem; font-weight: 500;">Auxiliaire : <strong>${v.x}</strong></p>
          </div>
        `}
        
        <div class="card" style="background: var(--yellow); margin-top: 1rem;">
          <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.3rem;">💡 ASTUCE</div>
          <p style="font-size: 0.9rem; font-weight: 500;">${v.n}</p>
        </div>
        
        <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
          <span class="badge" style="background: ${v.t === 'stark' ? 'var(--red)' : v.t === 'gemischt' ? 'var(--yellow)' : v.t === 'modal' ? 'var(--purple)' : 'var(--green)'}; color: ${v.t === 'gemischt' ? 'var(--ink)' : 'white'};">${v.t}</span>
          ${v.s ? `<span class="badge" style="background: var(--blue); color: white;">séparable</span>` : ''}
        </div>
      </div>
    `;
    document.getElementById('conj-result').innerHTML = html;
  },

  renderAiConjugation(data) {
    const persons = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
    const keys = ['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'];
    const colors = ['var(--blue)', 'var(--red)', 'var(--green)', 'var(--purple)', 'var(--yellow)', 'var(--blue)'];
    
    const html = `
      <div class="card">
        <div class="flex-between mb-1">
          <div>
            <h2 style="font-size: 1.5rem; margin: 0;">${data.verb}</h2>
            <p class="text-muted" style="font-weight: 500;">${data.tense} <span class="mono">(via IA)</span></p>
          </div>
          ${data.isIrregular ? '<span class="badge" style="background: var(--red); color: white;">Irrégulier</span>' : '<span class="badge" style="background: var(--green); color: white;">Régulier</span>'}
        </div>
        
        <div style="display: grid; grid-template-columns: 80px 1fr; gap: 0.5rem; margin: 1rem 0;">
          ${persons.map((p, i) => `
            <div class="mono" style="color: ${colors[i]}; font-weight: 700; padding: 0.5rem 0;">${p}</div>
            <div style="padding: 0.5rem 0; font-weight: 700; font-size: 1.05rem; border-bottom: 1px dashed var(--light-gray);">${data.conjugations?.[keys[i]] || '—'}</div>
          `).join('')}
        </div>
        
        ${data.auxiliary ? `<p class="text-muted" style="font-size: 0.85rem;">Auxiliaire : <strong>${data.auxiliary}</strong></p>` : ''}
        ${data.separable ? `<p class="text-muted" style="font-size: 0.85rem;">✂️ Verbe séparable</p>` : ''}
        
        ${data.notes ? `
          <div class="card" style="background: var(--yellow); margin-top: 1rem;">
            <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.3rem;">💡 NOTE</div>
            <p style="font-size: 0.9rem; font-weight: 500;">${data.notes}</p>
          </div>
        ` : ''}
      </div>
    `;
    document.getElementById('conj-result').innerHTML = html;
  },

  // --- Conjugaison : Tableau à remplir ---
  showConjTableau() {
    // Choisir un verbe aléatoire dans VERBS + un temps
    const verbs = window.VERBS || [];
    if (verbs.length === 0) return;
    
    const v = verbs[Math.floor(Math.random() * verbs.length)];
    const tenses = ['Präsens', 'Präteritum'];
    const tense = tenses[Math.floor(Math.random() * tenses.length)];
    
    this.state.conjVerb = v;
    this.state.conjTense = tense;
    this.state.conjAnswers = {};
    this.renderTableau();
  },

  renderTableau() {
    const v = this.state.conjVerb;
    const tense = this.state.conjTense;
    const persons = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
    const colors = ['var(--blue)', 'var(--red)', 'var(--green)', 'var(--purple)', 'var(--yellow)', 'var(--blue)'];
    
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.showConj()">← Retour</button>
      
      <div class="card mb-1" style="background: var(--ink); color: var(--cream);">
        <div class="mono" style="font-size: 0.7rem; opacity: 0.7; margin-bottom: 0.3rem;">CONJUGUE LE VERBE</div>
        <h1 style="font-size: 2rem; margin: 0;">${v.v}</h1>
        <p style="opacity: 0.7; font-weight: 500;">${v.f}</p>
        <div class="streak-tag" style="margin-top: 0.75rem; display: inline-flex;">${tense}</div>
      </div>

      <div class="card">
        ${persons.map((p, i) => `
          <div style="display: grid; grid-template-columns: 90px 1fr; gap: 0.5rem; align-items: center; padding: 0.5rem 0; border-bottom: 1px dashed var(--light-gray);">
            <div class="mono" style="color: ${colors[i]}; font-weight: 700;">${p}</div>
            <input type="text" class="input tab-input" data-idx="${i}" placeholder="?" autocomplete="off" autocorrect="off" style="padding: 0.5rem 0.75rem;">
          </div>
        `).join('')}
        <button id="btn-tab-check" class="btn btn-primary btn-block mt-1">Vérifier</button>
      </div>
      
      <button class="btn btn-yellow btn-block mt-2" onclick="Apprendre.showConjTableau()">🔀 Autre verbe</button>
    `;
    
    document.querySelectorAll('.tab-input').forEach(inp => {
      inp.oninput = () => this.state.conjAnswers[inp.dataset.idx] = inp.value.trim();
    });
    
    document.getElementById('btn-tab-check').onclick = () => this.checkTableau();
  },

  checkTableau() {
    const v = this.state.conjVerb;
    const tense = this.state.conjTense;
    const expected = tense === 'Präsens' ? v.P : v.T;
    
    let correct = 0;
    document.querySelectorAll('.tab-input').forEach((inp, i) => {
      const user = (inp.value || '').trim().toLowerCase();
      const exp = expected[i].toLowerCase();
      const isOk = user === exp;
      
      inp.style.background = isOk ? 'var(--green)' : 'var(--red)';
      inp.style.color = 'white';
      inp.style.borderColor = 'var(--ink)';
      inp.disabled = true;
      
      if (!isOk) {
        // Afficher la bonne réponse à côté
        const correctSpan = document.createElement('div');
        correctSpan.innerHTML = `<span class="mono" style="color: var(--green); font-weight: 700;">✓ ${expected[i]}</span>`;
        correctSpan.style.marginTop = '0.3rem';
        inp.parentNode.appendChild(correctSpan);
      } else {
        correct++;
      }
    });
    
    // Note finale + astuce
    const pct = Math.round((correct / 6) * 100);
    const btn = document.getElementById('btn-tab-check');
    btn.outerHTML = `
      <div class="card mt-1" style="background: ${pct === 100 ? 'var(--green)' : pct >= 50 ? 'var(--blue)' : 'var(--red)'}; color: white;">
        <div class="flex-between">
          <h3>${correct}/6 correct</h3>
          <span style="font-size: 1.5rem;">${pct === 100 ? '🌟' : pct >= 50 ? '👍' : '💪'}</span>
        </div>
        <p style="margin-top: 0.5rem; font-size: 0.9rem; font-weight: 500;">${v.n}</p>
      </div>
      <button class="btn btn-primary btn-block mt-2" onclick="Apprendre.showConjTableau()">Verbe suivant →</button>
    `;
  },

  // --- Conjugaison : Régulier ou irrégulier ---
  showConjIrregular() {
    const screen = document.getElementById('screen-apprendre');
    screen.innerHTML = `
      <button class="back-btn" onclick="Apprendre.showConj()">← Retour</button>
      <h1>⚡ Régulier ou irrégulier ?</h1>
      <p class="text-muted mb-1" style="font-weight: 500;">Saisis un verbe et devine son type</p>

      <div class="field">
        <label>Verbe (infinitif allemand)</label>
        <input type="text" id="irr-verb-input" class="input" placeholder="ex: essen, machen, denken..." autocomplete="off">
      </div>

      <div class="card mb-1">
        <h3 style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">TON HYPOTHÈSE</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
          <button id="guess-regular" class="btn btn-green">Régulier (schwach)</button>
          <button id="guess-irregular" class="btn btn-red">Irrégulier (stark)</button>
        </div>
      </div>

      <div id="irr-result"></div>
    `;

    document.getElementById('guess-regular').onclick = () => this.checkIrregular(false);
    document.getElementById('guess-irregular').onclick = () => this.checkIrregular(true);
  },

  async checkIrregular(userGuess) {
    const verb = document.getElementById('irr-verb-input').value.trim().toLowerCase();
    if (!verb) { App.toast('Saisis un verbe', 'error'); return; }
    
    const resultEl = document.getElementById('irr-result');
    resultEl.innerHTML = `<div class="loader-page" style="min-height: 200px;"><div class="loader"></div></div>`;
    
    const { data, error } = await App.api('/api/check-irregular', {
      method: 'POST',
      body: { verb },
    });
    
    if (error || !data) {
      resultEl.innerHTML = `<p class="text-muted">Erreur : ${error}</p>`;
      return;
    }
    
    const correct = data.isIrregular === userGuess;
    
    resultEl.innerHTML = `
      <div class="card" style="background: ${correct ? 'var(--green)' : 'var(--red)'}; color: white;">
        <div style="font-size: 3rem;">${correct ? '✅' : '❌'}</div>
        <h2 style="margin-top: 0.5rem;">${correct ? 'Bravo !' : 'Pas exactement'}</h2>
        <p style="margin-top: 0.5rem; font-weight: 500;">
          <strong>${data.verb}</strong> est <strong>${data.isIrregular ? 'irrégulier' : 'régulier'}</strong>
          (type : ${data.type})
        </p>
      </div>
      
      <div class="card mt-1">
        <div class="mono text-muted" style="font-size: 0.7rem; margin-bottom: 0.3rem;">3 FORMES PRINCIPALES</div>
        <div class="mono" style="font-size: 1rem; font-weight: 700;">
          ${data.principalParts?.infinitiv || verb} → ${data.principalParts?.präteritum_er || '?'} → ${data.principalParts?.perfekt_er || '?'}
        </div>
        ${data.vowelChange ? `<p class="text-muted mt-1" style="font-size: 0.85rem;">Changement de voyelle : <strong>${data.vowelChange}</strong></p>` : ''}
      </div>
      
      <div class="card mt-1" style="background: var(--yellow);">
        <div class="mono" style="font-size: 0.7rem; margin-bottom: 0.3rem;">💡 EXPLICATION</div>
        <p style="font-size: 0.9rem; font-weight: 500;">${data.explanation}</p>
      </div>
      
      <button class="btn btn-primary btn-block mt-2" onclick="Apprendre.showConjIrregular()">Autre verbe</button>
    `;
  },
};
