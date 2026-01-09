@echo off
chcp 65001
echo ========================================
echo 프론트엔드만 시작합니다...
echo ========================================

cd frontend
npm run electron:dev
