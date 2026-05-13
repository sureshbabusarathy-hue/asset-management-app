@echo off
echo Starting Naandi Asset Management V2...

:: Start MongoDB
net start MongoDB

:: Run backend as Administrator
powershell -Command "Start-Process cmd -ArgumentList '/k cd /d C:\Users\Naandi\asset-v2\backend && npm run dev' -Verb RunAs"

timeout /t 3

:: Run frontend as Administrator
powershell -Command "Start-Process cmd -ArgumentList '/k cd /d C:\Users\Naandi\asset-v2\frontend && http-server -p 3000 -a 0.0.0.0' -Verb RunAs"

timeout /t 2

:: Open browser
start http://192.168.1.86:3000

echo App started!