# 🗒️ DDU MEMO - 떠메모

> **"복잡함 속에서 간단함을 발견하다"**  
> 일상 속 불편함을 단순함으로 풀어내는 바탕화면 포스트잇 애플리케이션

## 📌 프로젝트 소개

떠메모는 클립보드에 복사한 이미지나 텍스트를 바탕화면에 포스트잇처럼 붙일 수 있는 Electron 기반 데스크톱 애플리케이션입니다. 
브라우저가 아닌 **바탕화면 위에 직접 떠다니는 투명한 오버레이 창**으로 구현되어, 작업 중에도 중요한 정보를 놓치지 않을 수 있습니다.

### 🎯 개발 철학

- **일상 속 불편함**: 중요한 이미지나 메모를 빠르게 확인하고 싶지만 창을 계속 전환해야 하는 번거로움
- **단순한 해결책**: 복사 → 붙여넣기, 단 두 단계로 바탕화면에 포스트잇 생성
- **로컬 우선**: 불필요한 네트워크 오버헤드 없이 빠른 로컬 저장

## ✨ 주요 기능

### 1. 클립보드 붙여넣기
- **Ctrl+V**만으로 바탕화면에 포스트잇 생성
- 이미지와 텍스트 모두 지원
- Base64 인코딩으로 이미지 저장

### 2. 바탕화면 오버레이
- 투명한 배경의 항상 위(Always on Top) 창
- 프레임 없는(Frameless) 깔끔한 디자인
- 작업 중에도 항상 보이는 포스트잇

### 3. 드래그 & 리사이즈
- 마우스로 자유롭게 포스트잇 위치 이동
- 우측 하단 핸들로 크기 조절
- 실시간 위치/크기 자동 저장

### 4. 로컬 데이터 저장
- electron-store로 JSON 기반 로컬 저장
- 앱 재시작 시 자동으로 포스트잇 복구
- 빠른 읽기/쓰기 성능

### 5. 설정 창
- 모든 포스트잇 관리
- 새 포스트잇 생성 (클립보드 붙여넣기 / 드래그 앤 드롭)
- 포스트잇 목록 보기
- 개별 포스트잇 삭제

## 🛠️ 기술 스택

### Frontend
- **Electron 33.2.1**: 데스크톱 애플리케이션 프레임워크
- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Vite**: 빠른 개발 빌드

### Storage
- **electron-store 11**: 로컬 JSON 기반 데이터 저장소
- 자동 영속성(Auto-persistence)
- 앱 재시작 시 데이터 복원

### Architecture
- **Pure Electron**: 백엔드 서버 불필요
- **IPC Communication**: Renderer ↔ Main 프로세스 통신
- **Event-driven**: 실시간 UI 업데이트

## 🚀 시작하기

### 필수 요구사항
- Node.js 20.x 이상
- npm 10.x 이상

### 설치

```bash
# 프로젝트 클론
git clone [repository-url]
cd anything

# 의존성 설치
npm install
```

### 실행

```bash
# 개발 모드로 실행
npm run electron:dev
```

앱이 실행되면:
1. 설정 창이 열립니다
2. Ctrl+V로 클립보드 내용을 바탕화면에 붙여넣기
3. 포스트잇을 드래그로 이동하거나 우측 하단 핸들로 크기 조절
4. X 버튼으로 개별 포스트잇 닫기

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 실행 파일 생성 (Electron Builder)
npm run electron:build
```

## 📁 프로젝트 구조

```
anything/
├── electron/
│   ├── main.js          # Electron 메인 프로세스
│   └── preload.js       # IPC API 노출
├── src/
│   ├── SettingsWindow.tsx    # 설정 창 UI
│   ├── OverlayWindow.tsx     # 오버레이 포스트잇 UI
│   └── *.css                 # 스타일
├── package.json
└── vite.config.ts
```

## 🎨 UI/UX

### 설정 창
- 모든 포스트잇 목록 표시
- 그리드 레이아웃으로 미리보기
- 포스트잇 개수 표시
- Ctrl+V 또는 드래그 앤 드롭으로 추가

### 오버레이 포스트잇
- 투명 배경 (opacity: 0.95)
- 항상 위(Always on Top)
- 프레임 없는 디자인
- X 닫기 버튼
- 우측 하단 리사이즈 핸들

## 🐛 버그 수정 이력

### 드래그 버그 수정 (2025-01-10)
- **문제**: 드래그 시 창이 엉뚱한 위치로 이동
- **원인**: `event.clientX/Y` (뷰포트 기준) vs `event.screenX/Y` (스크린 기준) 혼용
- **해결**: screenX/Y로 통일 + Delta 방식 드래그 구현

### 리사이즈 버그 수정 (2025-01-10)
- **문제**: 리사이즈 핸들 클릭 시 아무 반응 없음
- **원인**: `window.innerWidth/Height` (HTML 요소 크기) vs `window.outerWidth/Height` (창 전체 크기) 혼용
- **해결**: `getWindowSize()` IPC로 정확한 창 크기 가져오기

## 🏗️ 아키텍처 개선 (2025-01-10)

### Before: Spring Boot + Electron
- Spring Boot 3.2.1 백엔드
- H2 Database
- WebSocket (STOMP)
- axios HTTP 통신

### After: Pure Electron
- electron-store (로컬 JSON)
- IPC 통신
- 이벤트 기반 실시간 업데이트
- **네트워크 오버헤드 제거**

**왜?** 로컬 데스크톱 앱에서 HTTP/WebSocket은 불필요한 복잡도!

## 📝 향후 개선 사항

- [ ] 포스트잇 색상/테마 설정
- [ ] 폰트 크기 조절
- [ ] 포스트잇 검색 기능
- [ ] 키보드 단축키 확장
- [ ] 윈도우 스냅(Snap) 기능
- [ ] 멀티 모니터 지원 개선

## 📄 라이선스

MIT License

## 👨‍💻 개발자

- 개발: [Your Name]
- 문의: [Your Email]

---

**"복잡함 속에서 간단함을 발견하다"** - 떠메모 팀
