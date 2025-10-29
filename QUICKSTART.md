# Quick Start Guide

## Initial Setup Complete! 🎉

Your FridgeScan MVP has been set up with:

✅ Expo React Native project with TypeScript
✅ Expo Router for navigation (tab-based)
✅ Zustand for state management
✅ Complete UI for all 4 screens (Home, Add, Locations, Profile)
✅ Color-coded expiry tracking system
✅ Mock data for testing
✅ GitHub repository created

## Next Steps

### 1. Push Code to GitHub

Since you have the GitHub repository already created, push your code:

```bash
cd /root/fridgescan

# Add all files
git add .

# Create initial commit
git commit -m "feat: Initial MVP implementation

- Set up Expo with TypeScript and Expo Router
- Implemented tab navigation with 4 screens
- Created inventory store with Zustand
- Built home screen with color-coded expiry system
- Added manual item entry form
- Created locations and profile screens
- Added mock data for testing

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to GitHub
git push -u origin main
```

### 2. Install Dependencies

The dependencies should already be installed, but if you need to reinstall:

```bash
npm install
```

### 3. Start the Development Server

```bash
npm start
```

This will open the Expo Dev Tools. You can then:
- Press `w` to open in web browser (will use default port)
- Scan QR code with Expo Go app on your phone
- Press `a` for Android emulator
- Press `i` for iOS simulator (macOS only)

**IMPORTANT - Port Configuration:**
Port 3000 is already in use by another app on this server. When running the web version, use port 3003:

```bash
# Run web on port 3003
npm run web -- --port 3003

# Or manually specify port when prompted
npx expo start --web --port 3003
```

### 4. Test the App

The app comes with mock data so you can immediately:
1. View inventory items on the home screen
2. Add new items using the "Add Item" tab
3. See items grouped by location in "Locations" tab
4. View statistics in "Profile" tab

## Project Structure

```
app/
├── (tabs)/
│   ├── _layout.tsx       # Tab navigator setup
│   ├── index.tsx         # Home/Inventory screen
│   ├── add.tsx           # Add item form
│   ├── locations.tsx     # Storage locations view
│   └── profile.tsx       # Profile & settings
├── _layout.tsx           # Root layout
src/
└── store/
    └── inventoryStore.ts # State management
```

## Key Features Implemented

### Color-Coded Expiry System
- 🔴 **Red (0-3 days)**: Critical - use immediately
- 🟡 **Orange (4-7 days)**: Warning - use soon
- 🟢 **Yellow (8-14 days)**: Caution - still good
- ✅ **Green (15+ days)**: Fresh - plenty of time
- ⚠️ **Dark Red (expired)**: Expired

### State Management
All inventory data is managed through Zustand in `src/store/inventoryStore.ts`:
- `items`: Array of inventory items
- `addItem()`: Add new item
- `removeItem()`: Remove item by ID
- `updateItem()`: Update item properties
- `getExpiryStatus()`: Calculate expiry status and color

### Mock Data
The app includes 5 mock items representing different expiry states for testing:
- Milk (expires in 2 days - critical)
- Chicken (expires in 1 day - critical)
- Yogurt (expires in 10 days - fresh)
- Pasta (expires in 1 year - fresh)
- Strawberries (expired yesterday)

## Development Workflow

### Making Changes

1. Edit files in `app/` or `src/`
2. Save - Expo will hot reload automatically
3. Test on web/mobile

### Type Checking

```bash
npm run type-check
```

### Clear Cache (if issues occur)

```bash
npx expo start -c
```

## What's Next?

According to the PROJECT_PLAN.md, the next features to implement are:

1. **Backend & Database Setup**
   - Set up PostgreSQL database
   - Create Prisma schema
   - Build REST API or GraphQL

2. **Barcode Scanning**
   - Integrate Expo Camera
   - Connect to OpenFoodFacts API
   - Cache product data

3. **OCR for Dates**
   - Integrate Google Cloud Vision API
   - Parse date formats
   - Manual fallback

4. **Authentication**
   - Firebase Auth or Auth0
   - User profiles
   - Secure API endpoints

5. **Partial Usage Tracking**
   - Usage history table
   - Fraction/percentage UI
   - Shopping list integration

## Troubleshooting

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force
# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Expo Start Issues
```bash
# Clear Expo cache
npx expo start -c
```

### TypeScript Errors
```bash
# Regenerate types
npm run type-check
```

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Project Plan](PROJECT_PLAN.md)
- [Claude Code Guide](CLAUDE.md)

## Repository

https://github.com/mikus2604/fridgescan

---

Ready to start developing! 🚀
