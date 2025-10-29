# Port Configuration

## Important Notice

**Always use port 3003 for web development, NOT port 3000.**

Port 3000 is already occupied by another application on this server.

## Configuration Applied

### 1. Package.json Script
The `web` script has been updated to automatically use port 3003:
```json
"web": "expo start --web --port 3003"
```

### 2. Running the Web App
Simply run:
```bash
npm run web
```

This will automatically start on port 3003 and open http://localhost:3003

### 3. Manual Port Specification
If you need to start the dev server manually:
```bash
npx expo start --web --port 3003
```

### 4. Environment Variable
You can also set the PORT environment variable:
```bash
PORT=3003 npm run web
```

## Verification

When the server starts, you should see:
```
Metro waiting on exp://192.168.x.x:8081
› Web app running at http://localhost:3003  ✓
```

Make sure it says **3003**, not 3000.

## Troubleshooting

If port 3003 is also in use:
```bash
# Check what's using the port
lsof -i :3003

# Kill the process if needed
kill -9 <PID>

# Or use a different port
npm run web -- --port 3004
```

## Important Files Updated

- ✅ `package.json` - web script uses `--port 3003`
- ✅ `README.md` - Documentation updated
- ✅ `QUICKSTART.md` - Port note added
- ✅ `CLAUDE.md` - Port configuration documented
- ✅ `.env.example` - PORT=3003 set as default

---

**Remember:** Always use port 3003 for FridgeScan web development!
