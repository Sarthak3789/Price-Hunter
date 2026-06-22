#!/bin/bash
echo "Starting FastAPI Backend..."
cd backend
./venv_system/bin/python -m uvicorn main:app --port 8000 &
BACKEND_PID=$!

echo "Starting React Frontend..."
cd ../frontend
npm run dev -- --port 5173 &
FRONTEND_PID=$!

echo "Both servers are running!"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:8000"
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" SIGINT
wait
