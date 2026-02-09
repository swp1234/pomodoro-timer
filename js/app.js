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
    await i18n.initialize();

    // 저장된 데이터 로드
    this.loadData();

    // 이벤트 리스너 설정
    this.setupEventListeners();

    // Service Worker 등록
    this.registerServiceWorker();

    // 초기 UI 업데이트
    this.updateDisplay();
    this.updateStats();
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
      });
    });

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
    const currentLang = i18n.getCurrentLanguage();
    document.querySelectorAll('.lang-option').forEach(btn => {
      if (btn.dataset.lang === currentLang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}

// 앱 시작
document.addEventListener('DOMContentLoaded', () => {
  const app = new PomodoroTimer();
});

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
