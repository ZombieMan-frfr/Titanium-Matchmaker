@echo off
title Installing Titanium Matchmaker Packages

echo Installing TypeScript tools...
call npm install -g typescript
call npm install -g ts-node

echo Installing project dependencies...
call npm install ws
call npm install @types/ws --save-dev
call npm install @types/node --save-dev

echo Creating tsconfig.json if missing...
if not exist tsconfig.json (
    echo {> tsconfig.json
    echo   "compilerOptions": {>> tsconfig.json
    echo     "target": "ES2020",>> tsconfig.json
    echo     "module": "ESNext",>> tsconfig.json
    echo     "moduleResolution": "Node",>> tsconfig.json
    echo     "esModuleInterop": true,>> tsconfig.json
    echo     "skipLibCheck": true,>> tsconfig.json
    echo     "outDir": "dist">> tsconfig.json
    echo   },>> tsconfig.json
    echo   "include": ["./**/*.ts"]>> tsconfig.json
    echo }>> tsconfig.json
)

echo Done.
echo If there were errors, they are shown above.
pause