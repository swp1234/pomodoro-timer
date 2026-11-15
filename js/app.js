// Pomodoro Timer Application
class PomodoroTimer {
  constructor() {
    // 설정
    this.workTime = 25 * 60; // 기본 25분
    this.breakTime = 5 * 60; // 기본 5분
    this.longBreakTime = 15 * 60; // 기본 15분
    this.cycleCount = 4; // 4 사이클 후 긴 휴식

    // 상태
    this.timeRemaining = this.workTime;
    this.isRunning = false;
    this.isWorkMode = true;
    this.currentCycle = 1;
    this.completedToday = 0;
    this.todayGoal = 8;
    this.timerInterval = null;
    this.progress = 0;
    this.hasTrackedStart = false;

    // 알림 설정
    this.notificationEnabled = true;
    this.soundEnabled = true;

    // DOM 요소
    this.timerTime = document.getElementById('timer-time');
    this.timerLabel = document.getElementById('timer-label');
    this.timerPeriod = document.getElementById('timer-period');
    this.cycleDisplay = document.getElementById('cycle-display');
    this.completedDisplay = document.getElementById('completed-display');
    this.goalDisplay = document.getElementById('goal-display');
    this.timerCircle = document.querySelector('.timer-circle');
    this.startBtn = document.getElementById('start-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.resetBtn = document.getElementById('reset-btn');
    this.settingsBtn = document.getElementById('settings-btn');
    this.statsBtn = document.getElementById('stats-btn');
    this.focusBtn = document.getElementById('focus-btn');

    // 모달
    this.settingsModal = document.getElementById('settings-modal');
    this.statsModal = document.getElementById('stats-modal');
    this.premiumModal = document.getElementById('premium-modal');
    this.goalModal = document.getElementById('goal-modal');

    this.init();
  }

  async init() {
    // i18n 초기화
    try {
      await i18n.initialize();
    } catch (e) {
      console.warn('i18n init failed:', e);
    }

    // 저장된 데이터 로드
    this.loadData();

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // Service Worker 등록
    this.registerServiceWorker();

    // 초기 UI 업데이트
    this.updateDisplay();
    this.updateStats();
    this.updateLangMenu();
    this.renderCuratedResources();
  }

  setupEventListeners() {
    // 타이머 컨트롤 버튼
    this.startBtn.addEventListener('click', () => this.start());
    this.pauseBtn.addEventListener('click', () => this.pause());
    this.resetBtn.addEventListener('click', () => this.reset());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    this.statsBtn.addEventListener('click', () => this.openStats());
    this.focusBtn.addEventListener('click', () => this.toggleFocusMode());

    // 모달 닫기
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('active');
      });
    });

    // 설정 저장
    document.getElementById('settings-save')?.addEventListener('click', () => this.saveSettings());
    document.getElementById('goal-save')?.addEventListener('click', () => this.saveGoal());

    // 언어 선택기
    document.getElementById('lang-toggle')?.addEventListener('click', () => {
      const menu = document.getElementById('lang-menu');
      menu.classList.toggle('hidden');
    });

    document.querySelectorAll('.lang-option').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const lang = e.target.dataset.lang;
        await i18n.setLanguage(lang);
        this.updateLangMenu();
        document.getElementById('lang-menu').classList.add('hidden');
        this.updateDisplay();
        this.renderCuratedResources();
      });
    });

    document.getElementById('saveCardBtn')?.addEventListener('click', () => this.generateStoryCard());
    document.getElementById('shareTwitterBtn')?.addEventListener('click', () => this.shareOnX());
    document.getElementById('shareUrlBtn')?.addEventListener('click', () => this.copyShareUrl('button'));
    document.getElementById('share-float-btn')?.addEventListener('click', () => this.shareNativeOrCopy());

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.isRunning) {
          this.pause();
        } else {
          this.start();
        }
      }
    });

    // 페이지 숨김 감지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isRunning) {
        // 페이지가 숨겨졌을 때 백그라운드에서 계속 실행
      }
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    if (!this.hasTrackedStart) {
      this.hasTrackedStart = true;
      if (typeof gtag === 'function') {
        gtag('event', 'test_start', {
          app_name: 'pomodoro-timer',
          mode: this.isWorkMode ? 'work' : 'break',
          lang: i18n.getCurrentLanguage()
        });
      }
    }
    this.startBtn.style.display = 'none';
    this.pauseBtn.style.display = 'flex';
    this.pauseBtn.textContent = i18n.t('buttons.pause');

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        this.complete();
      }

      this.updateDisplay();
    }, 1000);

    // 배터리 최적화를 위해 기기가 활성 상태일 때만 실행
    if (navigator.wakeLock) {
      navigator.wakeLock.request('screen').catch(() => {});
    }
  }

  pause() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.timerInterval);

    this.pauseBtn.style.display = 'none';
    this.startBtn.style.display = 'flex';
    this.startBtn.textContent = i18n.t('buttons.resume');
  }

  reset() {
    this.isRunning = false;
    this.hasTrackedStart = false;
    clearInterval(this.timerInterval);

    this.isWorkMode = true;
    this.timeRemaining = this.workTime;

    this.startBtn.style.display = 'flex';
    this.pauseBtn.style.display = 'none';
    this.startBtn.textContent = i18n.t('buttons.start');

    this.updateDisplay();
  }

  complete() {
    clearInterval(this.timerInterval);
    this.isRunning = false;
    this.hasTrackedStart = false;

    const completedMode = this.isWorkMode ? 'focus_cycle_complete' : 'break_cycle_complete';
    if (typeof gtag === 'function') {
      const lang = i18n.getCurrentLanguage();
      gtag('event', 'test_complete', {
        app_name: 'pomodoro-timer',
        result_type: completedMode,
        lang
      });
      gtag('event', 'pomodoro_complete', {
        app_name: 'pomodoro-timer',
        result_type: completedMode,
        lang
      });
    }

    // 알림음
    if (this.soundEnabled) {
      this.playNotificationSound();
    }

    // 브라우저 알림
    if (this.notificationEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const title = this.isWorkMode ?
          i18n.t('notifications.workComplete') :
          i18n.t('notifications.breakComplete');

        new Notification(i18n.t('app.title'), { body: title });
      }
    }

    if (this.isWorkMode) {
      // 작업 완료
      this.completedToday++;
      this.currentCycle++;

      // 사이클 완료 확인
      if (this.currentCycle > this.cycleCount) {
        this.isWorkMode = false;
        this.timeRemaining = this.longBreakTime;

        if (this.notificationEnabled && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification(i18n.t('app.title'), {
              body: i18n.t('messages.longBreakTime')
            });
          }
        }
      } else {
        // 일반 휴식
        this.isWorkMode = false;
        this.timeRemaining = this.breakTime;
      }
    } else {
      // 휴식 완료
      if (this.currentCycle > this.cycleCount) {
        this.currentCycle = 1;
      }
      this.isWorkMode = true;
      this.timeRemaining = this.workTime;
    }

    this.saveData();
    this.updateDisplay();

    this.startBtn.textContent = i18n.t('buttons.start');
    this.pauseBtn.style.display = 'none';
    this.startBtn.style.display = 'flex';

    // 목표 달성 확인
    if (this.completedToday >= this.todayGoal) {
      this.showGoalReached();
    }
  }

  playNotificationSound() {
    // Web Audio API로 간단한 비프음 생성
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  updateDisplay() {
    // 시간 표시
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.timerTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 진행률 계산
    const totalTime = this.isWorkMode ? this.workTime : this.breakTime;
    this.progress = 1 - (this.timeRemaining / totalTime);
    this.timerCircle.style.setProperty('--progress', Math.min(this.progress, 1));

    // 라벨 업데이트
    if (this.isWorkMode) {
      this.timerLabel.textContent = i18n.t('timer.work');
    } else {
      if (this.currentCycle > this.cycleCount) {
        this.timerLabel.textContent = i18n.t('timer.longBreak');
      } else {
        this.timerLabel.textContent = i18n.t('timer.break');
      }
    }

    // 브라우저 탭 제목 업데이트
    document.title = `${this.timerTime.textContent} - ${i18n.t('app.title')}`;
  }

  updateStats() {
    // 통계 업데이트
    const today = new Date().toISOString().split('T')[0];
    const stats = JSON.parse(localStorage.getItem(`stats-${today}`) || '{}');

    this.cycleDisplay.textContent = this.completedToday;
    this.completedDisplay.textContent = this.completedToday;
    this.goalDisplay.textContent = `${this.completedToday} / ${this.todayGoal}`;

    // 주간 통계 생성
    this.generateWeeklyStats();
  }

  generateWeeklyStats() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = JSON.parse(localStorage.getItem(`stats-${dateStr}`) || '{}').count || 0;
      weeklyData.push(count);
    }

    // 차트 생성
    const chartBars = document.querySelectorAll('.chart-bar');
    const maxValue = Math.max(...weeklyData, 1);

    chartBars.forEach((bar, index) => {
      const percentage = (weeklyData[index] / maxValue) * 100;
      bar.style.height = `${percentage}%`;
      bar.setAttribute('data-value', weeklyData[index]);
    });
  }

  openSettings() {
    // 설정값 로드
    document.getElementById('work-time-input').value = this.workTime / 60;
    document.getElementById('break-time-input').value = this.breakTime / 60;
    document.getElementById('long-break-input').value = this.longBreakTime / 60;
    document.getElementById('cycle-count-input').value = this.cycleCount;
    document.getElementById('notification-check').checked = this.notificationEnabled;
    document.getElementById('sound-check').checked = this.soundEnabled;

    this.settingsModal.classList.add('active');
  }

  saveSettings() {
    this.workTime = parseInt(document.getElementById('work-time-input').value) * 60;
    this.breakTime = parseInt(document.getElementById('break-time-input').value) * 60;
    this.longBreakTime = parseInt(document.getElementById('long-break-input').value) * 60;
    this.cycleCount = parseInt(document.getElementById('cycle-count-input').value);
    this.notificationEnabled = document.getElementById('notification-check').checked;
    this.soundEnabled = document.getElementById('sound-check').checked;

    this.saveData();
    this.reset();
    this.settingsModal.classList.remove('active');

    // 알림 권한 요청
    if (this.notificationEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  openStats() {
    this.updateStats();
    this.statsModal.classList.add('active');
  }

  toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    this.focusBtn.innerHTML = document.body.classList.contains('focus-mode') ?
      '↙️' : '⚙️';
  }

  openGoalModal() {
    document.getElementById('goal-input').value = this.todayGoal;
    this.goalModal.classList.add('active');
  }

  saveGoal() {
    this.todayGoal = parseInt(document.getElementById('goal-input').value) || 8;
    this.saveData();
    this.goalModal.classList.remove('active');
    this.updateStats();
  }

  showGoalReached() {
    // 목표 달성 알림
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #00b894, #00d4aa);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      z-index: 300;
      animation: slideDown 0.3s ease;
    `;
    notification.textContent = i18n.t('messages.goalReached');
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  saveData() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('pomodoroSettings', JSON.stringify({
      workTime: this.workTime,
      breakTime: this.breakTime,
      longBreakTime: this.longBreakTime,
      cycleCount: this.cycleCount,
      notificationEnabled: this.notificationEnabled,
      soundEnabled: this.soundEnabled,
      todayGoal: this.todayGoal
    }));

    localStorage.setItem(`stats-${today}`, JSON.stringify({
      count: this.completedToday,
      date: today
    }));
  }

  loadData() {
    const settings = JSON.parse(localStorage.getItem('pomodoroSettings') || '{}');
    if (settings.workTime) {
      this.workTime = settings.workTime;
      this.breakTime = settings.breakTime;
      this.longBreakTime = settings.longBreakTime;
      this.cycleCount = settings.cycleCount;
      this.notificationEnabled = settings.notificationEnabled ?? true;
      this.soundEnabled = settings.soundEnabled ?? true;
      this.todayGoal = settings.todayGoal || 8;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayStats = JSON.parse(localStorage.getItem(`stats-${today}`) || '{}');
    this.completedToday = todayStats.count || 0;

    this.timeRemaining = this.workTime;
  }

  updateLangMenu() {
    preserveLanguageLinks();
    const currentLang = i18n.getCurrentLanguage();
    document.querySelectorAll('.lang-option').forEach(btn => {
      if (btn.dataset.lang === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  getShareUrl() {
    const lang = i18n.getCurrentLanguage() || 'ko';
    return `${window.location.origin}/pomodoro-timer/?lang=${encodeURIComponent(lang)}&utm_source=share`;
  }

  showToast(message) {
    let toast = document.getElementById('pomo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'pomo-toast';
      toast.className = 'pomo-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2200);
  }

  async copyShareUrl(methodLabel = 'clipboard') {
    const shareUrl = this.getShareUrl();
    const copiedText = i18n.t('share.copiedUrl') !== 'share.copiedUrl' ? i18n.t('share.copiedUrl') : 'Link copied!';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (e) {}
    } else {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove();
    }
    this.showToast(copiedText);
    if (typeof gtag === 'function') {
      gtag('event', 'share', {
        method: methodLabel,
        app_name: 'pomodoro-timer',
        lang: i18n.getCurrentLanguage()
      });
    }
  }

  async shareNativeOrCopy() {
    const shareUrl = this.getShareUrl();
    const title = i18n.t('app.title') !== 'app.title' ? i18n.t('app.title') : document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        if (typeof gtag === 'function') {
          gtag('event', 'share', {
            method: 'native',
            app_name: 'pomodoro-timer',
            lang: i18n.getCurrentLanguage()
          });
        }
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    await this.copyShareUrl('clipboard');
  }

  shareOnX() {
    const shareUrl = this.getShareUrl();
    const tweetText = i18n.t('share.tweetText') !== 'share.tweetText'
      ? i18n.t('share.tweetText')
      : 'Structuring deep work sprints & restorative breaks with DopaBrain Pomodoro Timer.';
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
    if (typeof gtag === 'function') {
      gtag('event', 'share', {
        method: 'twitter',
        app_name: 'pomodoro-timer',
        lang: i18n.getCurrentLanguage()
      });
    }
  }

  generateStoryCard() {
    const canvas = document.getElementById('shareCanvas');
    const saveBtn = document.getElementById('saveCardBtn');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lang = i18n.getCurrentLanguage() || 'ko';
    const tr = (key, fallback) => {
      const v = i18n.t(key);
      return v && v !== key ? v : fallback;
    };

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = tr('share.savingCard', 'Creating card...');
    }

    const w = 1080;
    const h = 1920;
    canvas.width = w;
    canvas.height = h;

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#1e1b4b');
    grad.addColorStop(1, '#3b0a19');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(231, 76, 60, 0.16)';
    ctx.beginPath();
    ctx.arc(540, 620, 320, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(231, 76, 60, 0.75)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(540, 620, 260, -Math.PI / 2, Math.PI * 1.15);
    ctx.stroke();

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(tr('share.cardBadge', 'DOPABRAIN FOCUS TIMER'), 540, 170);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(tr('share.cardTitle', 'Pomodoro Focus Rhythm'), 540, 270);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '34px system-ui, -apple-system, sans-serif';
    ctx.fillText(tr('share.cardSubtitle', 'Intentional sprints & restorative recovery'), 540, 330);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 120px monospace';
    ctx.fillText(this.timerTime ? this.timerTime.textContent : '25:00', 540, 645);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.fillText(tr('share.cardFocusRhythm', 'Structured Focus Sprint'), 540, 725);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(110, 1020, 860, 420, 32);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(tr('share.cardSessionsLabel', 'TODAY STATUS'), 175, 1110);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${tr('stats.completed', 'Completed')}: ${this.completedToday} / ${this.todayGoal}`, 175, 1175);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(tr('share.cardGoalLabel', 'WORKFLOW MODE'), 175, 1295);
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
    const modeLabel = this.isWorkMode ? tr('timer.work', 'Work Time') : tr('timer.break', 'Break Time');
    ctx.fillText(modeLabel, 175, 1360);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
    ctx.fillText(tr('share.cardCta', 'Try free at dopabrain.com/pomodoro-timer'), 540, 1730);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '26px system-ui, -apple-system, sans-serif';
    ctx.fillText(`dopabrain.com/pomodoro-timer/?lang=${lang}`, 540, 1795);

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'dopabrain-pomodoro-focus.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {}

    this.showToast(tr('share.savedCard', 'Focus card saved!'));
    if (typeof gtag === 'function') {
      gtag('event', 'save_image', {
        app_name: 'pomodoro-timer',
        result_type: this.isWorkMode ? 'work_sprint' : 'recovery_break',
        lang
      });
    }

    if (saveBtn) {
      setTimeout(() => {
        saveBtn.disabled = false;
        saveBtn.textContent = tr('share.saveCard', 'Save Focus Card');
      }, 600);
    }
  }

  renderCuratedResources() {
    const container = document.getElementById('curated-resources-card');
    if (!container) return;

    const curated = i18n.t('curated');
    if (!curated || typeof curated !== 'object' || !Array.isArray(curated.books)) return;

    const lang = i18n.getCurrentLanguage() || 'ko';
    container.textContent = '';

    const header = document.createElement('div');
    header.className = 'curated-resources-header';
    const titleEl = document.createElement('h3');
    titleEl.className = 'curated-resources-title';
    titleEl.textContent = curated.title || '';
    const subEl = document.createElement('p');
    subEl.className = 'curated-resources-subtitle';
    subEl.textContent = curated.subtitle || '';
    header.appendChild(titleEl);
    header.appendChild(subEl);

    const list = document.createElement('div');
    list.className = 'curated-resources-list';

    curated.books.forEach((book) => {
      const link = document.createElement('a');
      link.className = 'curated-book-link';
      link.href = book.url;
      link.target = '_blank';
      link.rel = 'sponsored noopener noreferrer';

      const meta = document.createElement('div');
      meta.className = 'curated-book-meta';

      const bTitle = document.createElement('span');
      bTitle.className = 'curated-book-title';
      bTitle.textContent = book.title || '';

      const bAuthor = document.createElement('span');
      bAuthor.className = 'curated-book-author';
      bAuthor.textContent = book.author || '';

      const bNote = document.createElement('span');
      bNote.className = 'curated-book-note';
      bNote.textContent = book.note || '';

      meta.appendChild(bTitle);
      meta.appendChild(bAuthor);
      meta.appendChild(bNote);

      const badge = document.createElement('span');
      badge.className = 'curated-book-badge';
      badge.textContent = curated.badge || 'Book';

      link.appendChild(meta);
      link.appendChild(badge);

      link.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'curated_resource_click', {
            app_name: 'pomodoro-timer',
            resource_type: 'book',
            item_id: book.id || 'book',
            lang
          });
        }
      });

      list.appendChild(link);
    });

    const noteEl = document.createElement('p');
    noteEl.className = 'curated-affiliate-note';
    noteEl.textContent = curated.affiliateNote || '';

    container.appendChild(header);
    container.appendChild(list);
    container.appendChild(noteEl);
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new PomodoroTimer();
    preserveLanguageLinks();
  } catch(e) {
    console.error('Init error:', e);
  } finally {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 300);
    }
  }
});

function preserveLanguageLinks() {
  try {
    const lang = (window.i18n && typeof window.i18n.getCurrentLanguage === 'function' ? window.i18n.getCurrentLanguage() : null) || new URLSearchParams(window.location.search).get('lang') || 'ko';
    document.querySelectorAll('.related-card, a[href^="/stress-check/"], a[href^="/dday-counter/"], a[href^="/work-style/"], a[href^="/detox-timer/"]').forEach(function(a) {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('/portal/')) return;
      const url = new URL(href, window.location.origin);
      if (lang) {
        url.searchParams.set('lang', lang);
      }
      url.searchParams.set('source', 'pomodoro_timer_result');
      a.setAttribute('href', url.pathname + url.search + url.hash);

      if (!a.__ctaBound) {
        a.__ctaBound = true;
        a.addEventListener('click', function() {
          const liveLang = (window.i18n && typeof window.i18n.getCurrentLanguage === 'function' ? window.i18n.getCurrentLanguage() : null) || new URLSearchParams(window.location.search).get('lang') || 'ko';
          if (typeof gtag === 'function') {
            gtag('event', 'content_cta_click', {
              cta_surface: 'related_tools',
              destination: a.getAttribute('href'),
              source: 'pomodoro_timer_result',
              lang: liveLang
            });
          }
        });
      }
    });
  } catch (e) {}
}

// 마이크로인터랙션: 버튼 클릭 시 리플 효과
document.addEventListener('click', (e) => {
  if (e.target.closest('.btn')) {
    const btn = e.target.closest('.btn');
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
  }
});

// 오프라인 감지
window.addEventListener('offline', () => {
  console.log('App is offline');
});

window.addEventListener('online', () => {
  console.log('App is online');
});

// 배터리 상태 감지 (선택사항)
if (navigator.getBattery) {
  navigator.getBattery().then(battery => {
    battery.addEventListener('levelchange', () => {
      // 배터리 낮으면 타이머 활동성 조정 가능
    });
  });
}

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
  themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    document.body.classList.toggle('light-mode', next === 'light');
    localStorage.setItem('theme', next);
    themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
  });
}
