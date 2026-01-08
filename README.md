# 🗒️ DDU MEMO - 떠메모

> **"복잡함 속에서 간단함을 발견하다"**  
> 일상 속 불편함을 단순함으로 풀어내는 바탕화면 포스트잇 애플리케이션

## 📌 프로젝트 소개

떠메모는 클립보드에 복사한 이미지나 텍스트를 바탕화면에 포스트잇처럼 붙일 수 있는 Electron 기반 데스크톱 애플리케이션입니다. 
브라우저가 아닌 **바탕화면 위에 직접 떠다니는 투명한 오버레이 창**으로 구현되어, 작업 중에도 중요한 정보를 놓치지 않을 수 있습니다.

### 🎯 개발 철학

- **일상 속 불편함**: 중요한 이미지나 메모를 빠르게 확인하고 싶지만 창을 계속 전환해야 하는 번거로움
- **단순한 해결책**: 복사 → 붙여넣기, 단 두 단계로 바탕화면에 포스트잇 생성
- **실시간 협업**: WebSocket 기반 실시간 코멘트로 다른 사용자와 소통

## ✨ 주요 기능

### 1. 클립보드 붙여넣기
- **Ctrl+V**만으로 바탕화면에 포스트잇 생성
- 이미지와 텍스트 모두 지원
- Base64 인코딩으로 이미지 저장

### 2. 바탕화면 오버레이
- 투명한 배경의 항상 위(Always on Top) 창
- 프레임 없는(Frameless) 깔끔한 디자인
- 작업 중에도 항상 보이는 포스트잇

### 3. 드래그 앤 드롭
- 마우스로 자유롭게 포스트잇 위치 이동
- 부드러운 Delta 기반 드래그 구현
- 실시간 위치 업데이트

### 4. 실시간 코멘트
- WebSocket(STOMP) 기반 실시간 통신
- 포스트잇 클릭 시 코멘트 팝업 표시
- 다른 사용자의 코멘트 즉시 반영
- 코멘트 개수 뱃지 표시

### 5. 설정 창
- 모든 포스트잇 관리
- 새 포스트잇 생성 (클립보드 붙여넣기)
- 포스트잇 목록 보기
- 코멘트 추가 및 확인

## 🛠️ 기술 스택

### Frontend
- **Electron 33.2.1**: 데스크톱 애플리케이션 프레임워크
- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빠른 빌드 도구
- **SockJS + STOMP**: WebSocket 통신
- **Axios**: HTTP 클라이언트

### Backend
- **Spring Boot 3.2.1**: Java 백엔드 프레임워크
- **Java 17**: OpenJDK
- **Spring WebSocket**: 실시간 통신
- **Spring Data JPA**: 데이터베이스 ORM
- **H2 Database**: 인메모리 데이터베이스
- **Maven**: 빌드 도구

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Java 17 (OpenJDK)
- npm 또는 yarn

### 1. 백엔드 실행

```bash
cd backend

# Maven Wrapper로 실행 (Windows)
.\mvnw.cmd spring-boot:run

# 또는 Maven 직접 실행
mvn spring-boot:run
```

백엔드가 `http://localhost:8080`에서 실행됩니다.

### 2. 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# Electron 앱 실행
npm run electron:dev
```

## 📁 프로젝트 구조

```
anything/
├── backend/                    # Spring Boot 백엔드
│   ├── src/main/java/com/stickyboard/
│   │   ├── StickyBoardApplication.java
│   │   ├── config/
│   │   │   ├── WebSocketConfig.java      # WebSocket 설정
│   │   │   └── CorsConfig.java           # CORS 설정
│   │   ├── model/
│   │   │   ├── StickyNote.java           # 포스트잇 엔티티
│   │   │   └── Comment.java              # 코멘트 엔티티
│   │   ├── repository/
│   │   │   ├── StickyNoteRepository.java
│   │   │   └── CommentRepository.java
│   │   ├── service/
│   │   │   ├── StickyNoteService.java
│   │   │   └── CommentService.java
│   │   ├── controller/
│   │   │   ├── StickyNoteController.java  # REST API
│   │   │   ├── CommentController.java
│   │   │   └── WebSocketController.java   # WebSocket 핸들러
│   │   └── dto/
│   │       ├── StickyNoteDto.java
│   │       └── CommentDto.java
│   ├── pom.xml
│   └── application.yml
│
└── frontend/                   # Electron + React 프론트엔드
    ├── electron/
    │   ├── main.js            # Electron 메인 프로세스
    │   └── preload.js         # Preload 스크립트 (IPC 브릿지)
    ├── src/
    │   ├── App.tsx            # 라우팅 (설정창/오버레이창 구분)
    │   ├── SettingsWindow.tsx # 설정창 컴포넌트
    │   ├── SettingsWindow.css
    │   ├── OverlayWindow.tsx  # 오버레이창 컴포넌트
    │   ├── OverlayWindow.css
    │   └── main.tsx
    ├── package.json
    └── vite.config.ts

```

## 🎮 사용 방법

### 1. 포스트잇 생성
1. 설정창에서 이미지나 텍스트를 클립보드에 복사
2. 설정창 붙여넣기 영역에 **Ctrl+V**
3. 자동으로 바탕화면에 오버레이 창 생성 ✨

### 2. 포스트잇 이동
- 포스트잇을 마우스로 드래그하여 원하는 위치로 이동

### 3. 코멘트 확인
1. 포스트잇 클릭
2. 코멘트 팝업 표시 (코멘트가 있는 경우)
3. 코멘트 뱃지로 개수 확인

### 4. 코멘트 작성
1. 설정창에서 포스트잇 클릭
2. 코멘트 패널에 작성
3. 실시간으로 다른 사용자와 공유

### 5. 포스트잇 삭제
- 설정창에서 포스트잇의 ❌ 버튼 클릭

## 🔧 개발 특징

### Electron 아키텍처
- **Main Process**: 설정창과 여러 오버레이창 관리
- **Renderer Process**: React 기반 UI
- **IPC 통신**: Preload 스크립트로 보안 강화

### WebSocket 실시간 통신
```
클라이언트 → /app/note/create → 서버 → /topic/notes → 모든 클라이언트
```

### 드래그 구현
- Delta 기반: 이전 위치와 현재 위치의 차이 계산
- Screen 좌표: `screenX/Y`로 정확한 마우스 추적
- Electron API: `BrowserWindow.setPosition()`으로 창 이동

### CORS 설정
- WebSocket과 REST API 모두 CORS 허용
- 개발 환경: `localhost:5173`, `localhost:5174`, `localhost:3000`

## 🚀 빌드 (추후 구현)

```bash
# 프론트엔드 빌드
cd frontend
npm run electron:build

# 백엔드 빌드
cd backend
.\mvnw.cmd package
```

## 🐛 알려진 이슈

- [ ] 오버레이 창이 여러 개일 때 Z-index 관리 필요
- [ ] 백엔드 종료 시 데이터 영구 저장 (H2 → MySQL/PostgreSQL)
- [ ] Electron 앱 자동 업데이트 기능
- [ ] 포스트잇 크기 조절 기능
- [ ] 색상 선택 기능

## 📝 개발 일지

**2026년 1월 8일**
- ✅ Spring Boot 백엔드 구조 설계 및 구현
- ✅ Electron + React 프론트엔드 설정
- ✅ WebSocket 실시간 통신 구현
- ✅ 바탕화면 오버레이 창 구현
- ✅ 드래그 앤 드롭 기능 구현
- ✅ 클립보드 붙여넣기 기능 구현
- ✅ 실시간 코멘트 시스템 구현
- ✅ CORS 설정 및 디버깅
- ✅ 드래그 성능 최적화

## 🤝 기여

이 프로젝트는 개인 학습 및 실험 프로젝트입니다.

## 📄 라이선스

MIT License

---

**Made with ❤️ by Jinwoo**  
*"복잡함 속에서 간단함을 발견하다"*
