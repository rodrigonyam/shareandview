@echo off
REM Mallard Development Setup Script for Windows

echo 🎥 Mallard Development Setup
echo ================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

echo ⚠️  Please ensure MongoDB is running on your system
echo    You can install MongoDB locally or use MongoDB Atlas
echo.

echo 🚀 Starting Mallard...
echo.

REM Start the backend server
echo Starting backend server on port 5000...
cd server
start "Mallard Backend" cmd /k "npm run dev"

REM Wait a bit for server to start
timeout /t 3 >nul

REM Start the frontend
echo Starting frontend development server on port 3000...
cd ..\client
start "Mallard Frontend" cmd /k "npm start"

echo.
echo ✅ Mallard is now running!
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo.
echo Press any key to exit...
pause >nul