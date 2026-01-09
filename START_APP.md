# How to Start the Career Guidance Application

## Quick Start (Recommended)

### Option 1: Use the PowerShell Script

1. Right-click on `start.ps1` in Windows Explorer
2. Select "Run with PowerShell"
3. If you get a security warning, you may need to allow script execution first

OR run in PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File start.ps1
```

---

### Option 2: Manual Start

1. Open PowerShell in this directory (`C:\Users\angup`)
2. Run these commands:
```powershell
$env:Path += ";C:\Program Files\nodejs\"
npm start
```

---

### Option 3: Use Command Prompt (Easiest)

1. Open **Command Prompt** (cmd.exe)
2. Navigate to your project:
```cmd
cd C:\Users\angup
```
3. Run:
```cmd
npm start
```

---

## Access the Application

Once the server starts, open your web browser and go to:
```
http://localhost:3000
```

---

## Troubleshooting

### If npm is not recognized:
- Make sure Node.js is installed
- Try using Command Prompt instead of PowerShell
- Or add Node.js to PATH manually

### If port 3000 is already in use:
- Close other applications using port 3000
- Or change the port in `server/index.js` (line 11)

### If you see database errors:
- The SQLite database will be created automatically on first run
- Make sure you have write permissions in the `server` directory

---

## Development Mode

To run with auto-reload on file changes:
```powershell
npm run dev
```

(Note: Requires nodemon to be installed globally, or just use `npm start`)
