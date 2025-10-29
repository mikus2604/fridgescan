# FridgeScan

Cross-platform inventory management app for tracking food items with barcode scanning, OCR for expiry dates, and AI-powered recipe suggestions.

## Features

### ✅ MVP Implemented
- 📱 Multi-platform support: Web, iOS, and Android (Expo)
- 🚦 Color-coded expiry date system (red/orange/yellow/green)
- 📦 Storage locations (Fridge, Pantry, Freezer)
- ➕ Manual item entry with quantity tracking
- 🏠 Inventory list with expiry status
- 📊 Basic statistics and grouping by location

### 🚧 Coming Soon
- 📷 Barcode scanning for product identification
- 🔍 OCR for best-before/use-by date extraction
- 📊 Partial usage tracking with flexible measurement units
- 👥 Collaborative household sharing
- 🤖 AI-powered recipe suggestions
- 🔔 Push notifications for expiry alerts

## Tech Stack

- **Frontend**: React Native (Expo) with TypeScript
- **Backend**: Node.js + Express (planned)
- **Database**: PostgreSQL with Prisma ORM (planned)
- **External APIs**: OpenFoodFacts, Google Cloud Vision, OpenAI/Claude

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- For iOS: macOS with Xcode (or use Expo Go app)
- For Android: Android Studio (or use Expo Go app)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mikus2604/fridgescan.git
cd fridgescan
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# Web (opens in browser)
npm run web

# iOS (requires macOS)
npm run ios

# Android
npm run android

# Or scan QR code with Expo Go app on your phone
```

### Development Commands

```bash
# Type checking
npm run type-check

# Start development server
npm start

# Start web on specific port (use 3003 instead of default 3000)
npm run web -- --port 3003

# Clear cache and start
npx expo start -c
```

**Note:** Port 3000 is already in use by another app on this server. Always use port 3003 for web development.

## Project Structure

```
fridgescan/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home/Inventory screen
│   │   ├── add.tsx        # Add item screen
│   │   ├── locations.tsx  # Locations screen
│   │   └── profile.tsx    # Profile screen
│   └── _layout.tsx        # Root layout
├── src/
│   └── store/             # Zustand state management
│       └── inventoryStore.ts
├── assets/                # Images and icons
├── CLAUDE.md             # AI development guide
└── PROJECT_PLAN.md       # Detailed architecture

```

## Current Features

### Home Screen
- View all inventory items sorted by expiry date
- Color-coded status badges (Fresh → Expired)
- Quick actions: Use Some, Remove
- Statistics: Total items and expiring soon count

### Add Item Screen
- Manual entry for product name, brand, quantity
- Multiple measurement units (count, g, kg, ml, L, oz, lb)
- Storage location selection (Fridge, Pantry, Freezer)
- Days until expiry calculator

### Locations Screen
- View items grouped by storage location
- Visual organization of your inventory

### Profile Screen
- Statistics dashboard
- Settings placeholders (coming soon)
- About information

## Project Status

✅ **MVP Phase 1 Complete**

The basic app structure is complete with core inventory management features. Mock data is included for testing. Next steps include backend integration, barcode scanning, and OCR implementation.

## Documentation

- [Project Plan](PROJECT_PLAN.md) - Detailed architecture and feature specifications
- [Claude Code Guide](CLAUDE.md) - Development guidance for AI assistants

## Repository

https://github.com/mikus2604/fridgescan

## License

MIT
