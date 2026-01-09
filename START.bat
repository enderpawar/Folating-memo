@echo off
chcp 65001 > nul
echo ========================================
echo  🗒️ Sticky Board 실행 중...
echo ========================================
echo.

REM 백엔드 서버 시작 (새 창)
echo [1/2] 백엔드 서버 시작 중...
start "Sticky Board - Backend" cmd /k "cd /d "%~dp0backend" && set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot" && mvnw.cmd spring-boot:run"

REM 백엔드 서버가 시작될 때까지 대기
echo [대기] 백엔드 서버 준비 중... (약 30초)
timeout /t 30 /nobreak > nul

REM 프론트엔드 앱 시작 (새 창)
echo [2/2] 프론트엔드 앱 시작 중...
start "Sticky Board - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run electron:dev"

echo.
echo ========================================
echo  ✅ Sticky Board가 실행되었습니다!
echo ========================================
echo.
echo 백엔드: http://localhost:8080
echo 프론트엔드: Electron 앱
echo.
echo 종료하려면 각 창을 닫으세요.
echo.
pause
