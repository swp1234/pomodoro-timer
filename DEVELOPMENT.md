# Pomodoro Timer - 개발 문서

## 프로젝트 개요

포모도로 타이머는 사용자의 집중력을 높이고 생산성을 극대화하기 위한 웹 기반 PWA 애플리케이션입니다.

- **출시일**: 2026-02-10
- **개발 언어**: HTML5, CSS3, Vanilla JavaScript
- **타겟**: dopabrain.com
- **라이센스**: MIT

## 아키텍처

### 핵심 컴포넌트

```
┌─────────────────────────────────────┐
│         HTML Structure              │
│  (index.html - 모달, UI 요소)       │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┬──────────────┬─────────────┐
        │             │              │             │
        ▼             ▼              ▼             ▼
   ┌─────────┐  ┌─────────┐   ┌──────────┐  ┌─────────┐
   │ app.js  │  │i18n.js  │   │style.css │  │ sw.js   │
   │(타이머) │  │(다국어) │   │(스타일)  │  │(오프라인)│
   └─────────┘  └─────────┘   └──────────┘  └─────────┘
        │             │
        │        ┌────┴──────┬──────┐
        │        ▼           ▼      ▼
        │    ┌─────────────────────────┐
        │    │  locales/ (12개 언어)  │
        │    └─────────────────────────┘
        │
        └──▶ localStorage (데이터 지속성)
```

### 클래스 구조

#### PomodoroTimer 클래스
메인 애플리케이션 로직을 담당하는 클래스입니다.

**프로퍼티:**
- `workTime`: 작업 시간 (초)
- `breakTime`: 휴식 시간 (초)
- `longBreakTime`: 긴 휴식 시간 (초)
- `cycleCount`: 긴 휴식 전 사이클 수
- `timeRemaining`: 남은 시간
- `isRunning`: 타이머 실행 상태
- `isWorkMode`: 작업 모드 여부
- `completedToday`: 오늘 완료한 포모도로
- `todayGoal`: 오늘의 목표

**메서드:**
```javascript
// 초기화
async init()                    // 앱 초기화
registerServiceWorker()         // Service Worker 등록

// 타이머 제어
start()                         // 타이머 시작
pause()                         // 타이머 일시정지
reset()                         // 타이머 초기화
complete()                      // 타이머 완료 처리

// UI 업데이트
updateDisplay()                 // 타이머 디스플레이 업데이트
updateStats()                   // 통계 업데이트
generateWeeklyStats()           // 주간 통계 생성

// 모달 관리
openSettings()                  // 설정 모달 열기
saveSettings()                  // 설정 저장
openStats()                     // 통계 모달 열기
toggleFocusMode()               // 집중 모드 토글
openGoalModal()                 // 목표 설정 모달 열기

// 알림
playNotificationSound()         // 알림음 재생
showGoalReached()               // 목표 달성 알림

// 데이터 관리
saveData()                      // localStorage에 저장
loadData()                      // localStorage에서 로드
```

#### I18n 클래스
다국어 지원을 담당하는 클래스입니다.

**프로퍼티:**
- `translations`: 현재 언어 번역 객체
- `supportedLanguages`: 지원 언어 목록 (12개)
- `currentLang`: 현재 언어

**메서드:**
```javascript
// 초기화
async initialize()              // i18n 초기화
detectLanguage()                // 기기 언어 감지

// 언어 관리
async loadTranslations(lang)    // 언어 파일 로드
async setLanguage(lang)         // 언어 변경
getCurrentLanguage()            // 현재 언어 반환

// 번역
t(key)                          // 키로 번역 조회
updateUI()                      // UI 텍스트 자동 번역

// 헬퍼
getLanguageName(lang)           // 언어 이름 반환
getLanguageFlag(lang)           // 언어 플래그 반환
```

## 데이터 구조

### localStorage 키

**설정 저장:**
```javascript
localStorage.setItem('pomodoroSettings', JSON.stringify({
  workTime: 1500,              // 25분 (초)
  breakTime: 300,              // 5분 (초)
  longBreakTime: 900,          // 15분 (초)
  cycleCount: 4,               // 사이클 수
  notificationEnabled: true,   // 알림 활성화
  soundEnabled: true,          // 알림음 활성화
  todayGoal: 8                 // 오늘의 목표
}));
```

**일일 통계 저장:**
```javascript
localStorage.setItem('stats-YYYY-MM-DD', JSON.stringify({
  count: 5,                    // 완료한 포모도로 수
  date: 'YYYY-MM-DD'           // 날짜
}));
```

**언어 설정:**
```javascript
localStorage.setItem('appLanguage', 'ko');  // 현재 언어
```

### 번역 파일 구조 (locales/*.json)

```json
{
  "section": {
    "key": "번역된 텍스트"
  }
}
```

**주요 섹션:**
- `app`: 앱 제목, 부제목
- `timer`: 타이머 라벨
- `buttons`: 버튼 텍스트
- `settings`: 설정 페이지
- `stats`: 통계 페이지
- `premium`: 프리미엄 기능
- `notifications`: 알림 텍스트
- `goals`: 목표 설정
- `messages`: 메시지

## UI 컴포넌트

### 타이머 디스플레이
```html
<div class="timer-circle">
  <!-- 원형 진행률 (conic-gradient) -->
  <div class="timer-content">
    <div class="timer-time">25:00</div>
    <div class="timer-period">분</div>
  </div>
</div>
```

**CSS 진행률 계산:**
```css
.timer-circle {
  background: conic-gradient(
    var(--primary) 0deg,
    var(--primary) calc(var(--progress) * 360deg),
    rgba(255,255,255,0.1) calc(var(--progress) * 360deg),
    rgba(255,255,255,0.1) 360deg
  );
}
```

### 모달 시스템
모든 모달은 같은 구조를 사용합니다:

```html
<div id="modal-id" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2 class="modal-title">제목</h2>
      <button class="modal-close">×</button>
    </div>
    <!-- 콘텐츠 -->
  </div>
</div>
```

**활성화:**
```javascript
modal.classList.add('active');    // 모달 표시
modal.classList.remove('active'); // 모달 숨김
```

### 언어 선택기
```html
<div class="language-selector">
  <button id="lang-toggle">🌐</button>
  <div id="lang-menu" class="lang-menu hidden">
    <button class="lang-option" data-lang="ko">🇰🇷 한국어</button>
    <!-- 나머지 언어 -->
  </div>
</div>
```

## 이벤트 흐름

### 타이머 시작
```
start() 클릭
  ↓
isRunning = true
  ↓
setInterval() 시작 (1초마다)
  ↓
updateDisplay() 호출 (UI 업데이트)
  ↓
timeRemaining 감소
  ↓
timeRemaining === 0일 때
  ↓
complete() 호출
  ↓
알림음 재생
isWorkMode 토글
timeRemaining 리셋
```

### 언어 변경
```
lang-option 클릭
  ↓
i18n.setLanguage(lang)
  ↓
loadTranslations(lang) - JSON 로드
  ↓
localStorage 저장
  ↓
updateUI() - DOM 업데이트
  ↓
updateDisplay() - 타이머 업데이트
```

## Service Worker

### 캐싱 전략
1. **Cache First**: 정적 파일 (HTML, CSS, JS, SVG)
2. **Network First**: 언어 파일 (locales/*.json)
3. **Offline Fallback**: 네트워크 오류 시 캐시 사용

### 캐시 파일
- HTML, CSS, JavaScript 번들
- 12개 언어 JSON 파일
- SVG 아이콘 (192x192, 512x512)

## 스타일 시스템

### 색상 팔레트
```css
--primary: #e74c3c;           /* 토마토 레드 (테마색) */
--primary-dark: #c0392b;      /* 어두운 빨강 */
--bg-dark: #0f0f23;           /* 주 배경색 */
--bg-secondary: #1a1a2e;      /* 보조 배경색 */
--bg-tertiary: #2d2d44;       /* 3차 배경색 */
--text-light: #ffffff;        /* 밝은 텍스트 */
--text-secondary: #b0b0b0;    /* 보조 텍스트 */
```

### 레이아웃 시스템
- **Grid**: 1200px 이상
- **Flex**: 모든 컨테이너
- **Responsive**: 모바일 우선 (360px+)

### 애니메이션
- **Glassmorphism**: `backdrop-filter: blur(10px)`
- **Microinteraction**: 호버 효과, 리플 효과
- **Transition**: 모든 상태 변화 (0.2s~0.3s)

## 성능 최적화

### 로딩 성능
- Service Worker 캐싱으로 오프라인 지원
- 번들 크기 최소화 (< 150KB gzipped)
- 이미지 포맷: SVG (벡터, 축소 가능)

### 런타임 성능
- 불필요한 리페인트/리플로우 최소화
- `transform` 속성으로 GPU 가속
- `will-change` 힌트 활용

### 메모리 효율
- 타이머 인터벌 적절히 정리
- 이벤트 리스너 중복 방지
- 큰 배열이 아닌 객체 사용

## 접근성

### WCAG 2.1 AA 준수
- 색상 대비: 4.5:1 이상
- 터치 타겟: 44px 이상
- 키보드 네비게이션: Space로 시작/일시정지

### 시맨틱 HTML
- `<header>`, `<main>`, `<button>` 등 시맨틱 요소 사용
- `data-i18n` 속성으로 번역 텍스트 마킹
- ARIA 라벨 추가 (aria-label, role)

## SEO 최적화

### 메타 태그
- `<meta name="description">`: 설명
- Open Graph 태그: SNS 공유 최적화
- Twitter Card: 트위터 공유 최적화

### 구조화된 데이터
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Pomodoro Timer",
  "applicationCategory": "Productivity",
  "offers": { "price": "0" }
}
```

## 테스트 가이드

### 기능 테스트
1. 타이머 시작/일시정지/초기화 확인
2. 원형 진행률 바 애니메이션 확인
3. 작업/휴식/긴 휴식 전환 확인
4. 알림음 및 브라우저 알림 테스트
5. 통계 데이터 저장/표시 테스트

### 다국어 테스트
1. 모든 언어 선택기 확인
2. 언어 변경 후 UI 완전 업데이트 확인
3. localStorage에 언어 저장 확인
4. 페이지 새로고침 후 언어 유지 확인

### PWA 테스트
1. Chrome DevTools → Applications → Service Workers
2. "Update on reload" 체크 해제
3. 인터넷 끄고 오프라인 작동 확인
4. "Install" 버튼으로 앱 설치 테스트

### 반응형 테스트
- 360px (모바일 최소)
- 480px (모바일 표준)
- 768px (태블릿)
- 1024px 이상 (데스크톱)

### 성능 테스트
```
Lighthouse 실행:
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 95+
- PWA: 95+
```

## 배포 체크리스트

- [ ] 모든 언어 파일이 완전한가?
- [ ] 이미지/아이콘이 모든 해상도에서 표시되는가?
- [ ] Service Worker가 올바르게 캐싱하는가?
- [ ] 모달이 올바르게 열고 닫히는가?
- [ ] 브라우저 호환성이 확인되었는가?
- [ ] Google Analytics 이벤트 추적이 설정되었는가?
- [ ] AdSense 광고 영역이 준비되었는가?
- [ ] 메타 태그와 Schema.org가 설정되었는가?

## 향후 개선 사항

### Phase 2
- 소리 선택 기능 (여러 알림음 지원)
- 백그라운드 음악 재생 옵션
- 통계 내보내기 (CSV)

### Phase 3
- 클라우드 동기화 (Google 계정)
- 친구와 통계 공유
- 리더보드 기능

### Phase 4
- AI 기반 최적화 추천
- 음성 명령 지원
- 스마트워치 연동

## 문제 해결

### 타이머가 작동하지 않음
1. 브라우저 콘솔 확인 (F12 → Console)
2. JavaScript 오류 확인
3. localStorage 권한 확인

### 알림이 안 나옴
1. 브라우저 알림 권한 확인
2. 설정에서 알림 활성화 확인
3. 시스템 소리 확인

### PWA 설치 안 됨
1. https 또는 localhost에서만 가능
2. manifest.json 유효성 확인
3. Service Worker 등록 확인

## 참고 자료

- [MDN - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Google - Web Fundamentals](https://developers.google.com/web/fundamentals)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref)
- [JSON for Linking Data](https://json-ld.org)
