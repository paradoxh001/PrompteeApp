 @echo off
 where node >nul 2>nul
 if %ERRORLEVEL% EQU 0 (
     start /B "" node "%~dp0server.js"
 ) else (
     start /B "" "C:\Users\hu.d\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "%~dp0server.js"
 )
