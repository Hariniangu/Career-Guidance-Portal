# Installation Guide for Career Guidance App

## Step 1: Install Node.js

Node.js is required to run this application. Follow these steps:

### Option A: Download from Official Website (Recommended)

1. **Visit the Node.js website:**
   - Go to: https://nodejs.org/
   - Download the **LTS (Long Term Support)** version (recommended)
   - Choose the Windows Installer (.msi) for your system (64-bit or 32-bit)

2. **Install Node.js:**
   - Run the downloaded installer
   - Follow the installation wizard
   - **Important:** Make sure to check the box that says "Add to PATH" during installation
   - Complete the installation

3. **Verify Installation:**
   - Close and reopen your PowerShell/Command Prompt
   - Run these commands to verify:
     ```
     node --version
     npm --version
     ```
   - You should see version numbers if installation was successful

### Option B: Using Chocolatey (If you have it installed)

If you have Chocolatey package manager installed, you can run:
```powershell
choco install nodejs-lts
```

### Option C: Using Winget (Windows Package Manager)

If you have winget installed (Windows 10/11), you can run:
```powershell
winget install OpenJS.NodeJS.LTS
```

---

## Step 2: Install Project Dependencies

After Node.js is installed, navigate to your project directory and run:

```powershell
npm install
```

This will install all required packages:
- express (web server)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- sqlite3 (database)
- cors (cross-origin requests)
- dotenv (environment variables)

---

## Step 3: Start the Application

Run the server:

```powershell
npm start
```

Or for development with auto-reload:

```powershell
npm run dev
```

---

## Step 4: Access the Application

Open your web browser and go to:
```
http://localhost:3000
```

---

## Troubleshooting

### If npm is still not recognized after installation:

1. **Restart your terminal/PowerShell** - Close and reopen it completely
2. **Check PATH environment variable:**
   - Search for "Environment Variables" in Windows
   - Make sure `C:\Program Files\nodejs\` is in your PATH
3. **Restart your computer** - Sometimes required for PATH changes to take effect

### If you get permission errors:

- Run PowerShell as Administrator
- Or configure npm to use a different directory for global packages

---

## Need Help?

If you encounter any issues:
1. Make sure Node.js version is 14.x or higher
2. Check that all files are in the correct directory structure
3. Verify that port 3000 is not already in use
