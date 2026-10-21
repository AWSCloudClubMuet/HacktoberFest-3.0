@echo off
start cmd /k "cd Server && npm install && npm run seed && npm start"
start cmd /k "cd client && npm install && npm run dev"
echo Server: http://localhost:5000   App: http://localhost:5173
