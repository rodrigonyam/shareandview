#!/bin/bash

# Mallard Development Setup Script
echo "🎥 Mallard Development Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Check if MongoDB is running (optional)
echo "⚠️  Please ensure MongoDB is running on your system"
echo "   You can install MongoDB locally or use MongoDB Atlas"

echo ""
echo "🚀 Starting StreamVault..."
echo ""

# Start the backend server
echo "Starting backend server on port 5000..."
cd server
npm run dev &
SERVER_PID=$!

# Wait a bit for server to start
sleep 3

# Start the frontend
echo "Starting frontend development server on port 3000..."
cd ../client
npm start &
CLIENT_PID=$!

echo ""
echo "✅ StreamVault is now running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for interrupt
trap "kill $SERVER_PID $CLIENT_PID; exit" INT
wait