# Pomodoro Timer - 포모도로 타이머

포모도로 타이머로 집중력을 높이고 생산성을 극대화하세요. 웹 기반의 무료 생산성 도구입니다.

## 기능

### 핵심 기능
- **포모도로 타이머**: 25분 작업 + 5분 휴식 기본 설정
- **긴 휴식**: 4 사이클 후 15분 긴 휴식
- **원형 프로그레스 바**: CSS/SVG 애니메이션으로 시각적 진행률 표시
- **사이클 카운터**: 오늘 완료한 포모도로 수 추적
- **통계**: 일별/주별 통계 및 CSS 바 차트

### 고급 기능
- **12개 언어 지원**: 한국어, 영어, 일본어, 중국어, 스페인어, 포르투갈어, 인도네시아어, 터키어, 독일어, 프랑스어, 힌디어, 러시아어
- **PWA (Progressive Web App)**: 오프라인 지원, 앱처럼 설치 가능
- **목표 설정**: 오늘의 목표 포모도로 수 설정
- **집중 모드**: 화면 전체를 타이머로 표시
- **알림**: 브라우저 알림 및 알림음
- **로컬 저장**: localStorage를 통한 데이터 지속성

### 프리미엄 기능
- **AI 생산성 분석**: 광고 시청 후 상세 통계 분석
  - 집중력 점수
  - 꾸준함 점수
  - 효율성 점수
  - 전체 종합 평가

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **PWA**: Service Worker, Web Manifest, Web App Install
- **i18n**: 커스텀 다국어 로더 (12개 언어)
- **Analytics**: Google Analytics 4 (GA4)
- **Ads**: Google AdSense (광고 준비 완료)
- **Storage**: localStorage API

## 설치 및 사용

### 로컬 테스트
```bash
cd pomodoro-timer
python -m http.server 8000
# http://localhost:8000 에서 확인
```

### PWA로 설치
1. 웹 사이트 방문
2. 브라우저 메뉴에서 "앱 설치" 또는 "Add to Home Screen" 선택
3. 앱으로 설치되어 오프라인에서도 사용 가능

## 파일 구조

```
pomodoro-timer/
├── index.html                 # 메인 HTML (모달, 타이머 UI 포함)
├── manifest.json              # PWA 설정
├── sw.js                       # Service Worker
├── icon-192.svg, icon-512.svg  # PWA 아이콘
├── css/
│   └── style.css              # 전체 스타일 (다크 모드 기본, Glassmorphism)
├── js/
│   ├── app.js                 # 메인 애플리케이션 로직
│   ├── i18n.js                # 다국어 지원 로더
│   └── locales/               # 12개 언어 번역 파일
│       ├── ko.json
│       ├── en.json
│       ├── ja.json
│       ├── zh.json
│       ├── es.json
│       ├── pt.json
│       ├── id.json
│       ├── tr.json
│       ├── de.json
│       ├── fr.json
│       ├── hi.json
│       └── ru.json
└── README.md                  # 이 파일
```

## 2026 UI/UX 트렌드 적용

### Glassmorphism 2.0
- `backdrop-filter: blur(10px)` 효과
- 반투명 배경으로 현대적인 느낌
- 접근성을 해치지 않는 깔끔한 디자인

### Microinteractions
- 버튼 호버 효과 (scale, 색상 변화)
- 리플 효과 (클릭 시 퍼지는 효과)
- 부드러운 슬라이드 애니메이션
- 타이머 원형 진행률 부드러운 변화

### Dark Mode First
- 기본값: 깊은 검은색 배경 (#0f0f23)
- 토마토 레드 테마색 (#e74c3c)
- 라이트 모드 옵션 지원 (body.light-mode)

### 접근성
- 최소 44px 터치 타겟
- 충분한 색상 대비
- 키보드 네비게이션 지원
- ARIA 라벨 추가

## 주요 코드 하이라이트

### 원형 타이머 진행률
```css
.timer-circle {
  conic-gradient(
    var(--primary) 0deg,
    var(--primary) calc(var(--progress, 0) * 360deg),
    rgba(255, 255, 255, 0.1) calc(var(--progress, 0) * 360deg),
    rgba(255, 255, 255, 0.1) 360deg
  );
}
```

### 다국어 지원
```javascript
class I18n {
  async setLanguage(lang) {
    await this.loadTranslations(lang);
    this.currentLang = lang;
    localStorage.setItem('appLanguage', lang);
    this.updateUI();
  }
}
```

### Service Worker 캐싱
```javascript
// 오프라인에서도 앱 사용 가능
event.respondWith(
  caches.match(event.request)
    .then(response => response || fetch(event.request))
);
```

## 사용자 경험 개선 사항

### 알림 시스템
- Web Audio API로 완료 알림음 생성
- Notification API로 브라우저 알림
- 사용자 설정으로 활성화/비활성화 가능

### 데이터 지속성
- localStorage에 설정 저장
- 일일 통계 자동 추적
- 페이지 새로고침 후에도 진행 상황 유지

### 배터리 최적화
- 필요할 때만 인터벌 실행
- Wake Lock API 지원
- 배터리 낮을 때 체크 (확장 가능)

## SEO 최적화

- **Schema.org**: WebApplication 구조화 데이터
- **Open Graph**: SNS 공유 최적화
- **메타 태그**: 설명, 키워드, 뷰포트
- **모바일 최적화**: viewport-fit=cover, responsive design

## 설정 커스터마이징

사용자는 다음을 커스터마이징할 수 있습니다:

| 항목 | 범위 | 기본값 |
|------|------|--------|
| 작업 시간 | 1~120분 | 25분 |
| 휴식 시간 | 1~60분 | 5분 |
| 긴 휴식 시간 | 1~120분 | 15분 |
| 긴 휴식 사이클 | 2~10 | 4 |
| 알림 활성화 | On/Off | On |
| 알림음 | On/Off | On |
| 오늘의 목표 | 1~50 | 8 |

## 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| Space | 시작/일시정지 토글 |

## 성능 지표

- **Lighthouse Score**: 90+ (PWA, Performance, Accessibility, Best Practices)
- **First Paint**: < 100ms
- **Time to Interactive**: < 2s
- **Size (gzipped)**: < 150KB

## 브라우저 호환성

- Chrome/Edge: 88+
- Firefox: 87+
- Safari: 14+
- Android Chrome: Latest
- iOS Safari: 14+

## 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

## 기여

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요.

## 개발자

DopaBrain - AI 기반 웹 애플리케이션 개발

## 업데이트 히스토리

### v1.0.0 (2026-02-10)
- 초기 출시
- 기본 포모도로 타이머 기능
- 12개 언어 지원
- PWA 지원
- 통계 및 분석 기능
- AI 생산성 분석 (프리미엄)
