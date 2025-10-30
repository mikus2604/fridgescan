# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FridgeScan is a cross-platform inventory management app for tracking food items with barcode scanning, OCR for expiry dates, and AI-powered recipe suggestions. The app helps users reduce food waste through color-coded expiry tracking and collaborative household sharing.

**Current Status:** Active Development - Authentication system complete, inventory features in progress.

**Development Focus:** Currently focusing on Android native app development. Web version available for testing at port 3003.

### Completed Features
- ✅ Supabase authentication (email/password, Google OAuth, Apple OAuth)
- ✅ User profile and household management
- ✅ Protected routes and session management
- ✅ Database schema with Row Level Security
- ✅ Barcode scanning functionality
- ✅ OCR for expiry date recognition
- ✅ Inventory CRUD operations
- ✅ Color-coded expiry tracking
- ✅ Storage location management
- ✅ Theme system (light/dark mode)

### In Progress
- 🚧 Production OAuth configuration
- 🚧 Recipe suggestions feature
- 🚧 Shopping list generation
- 🚧 Usage analytics

### Upcoming
- 📋 Push notifications for expiry alerts
- 📋 Household collaboration enhancements
- 📋 Native iOS/Android builds
- 📋 App Store/Play Store submission

## Technology Stack

### Frontend (Implemented)
- **React Native (Expo)**: Single codebase for web, iOS, and Android ✅
- **TypeScript**: Type safety across the stack ✅
- **Expo Router**: File-based navigation ✅
- **Expo Camera**: Barcode scanning ✅
- **ML Kit Text Recognition**: Native OCR for expiry dates ✅
- **Zustand**: Global state management ✅
- **React Context**: Theme and auth state ✅

### Backend (Implemented)
- **Supabase**: Backend-as-a-Service (PostgreSQL + Auth + Storage) ✅
- **PostgreSQL**: Primary database via Supabase ✅
- **Row Level Security**: Database-level authorization ✅
- **Supabase Storage**: Image storage (planned)

### External Services (Implemented/Planned)
- **Barcode API**: OpenFoodFacts API ✅
- **OCR**: Google ML Kit Text Recognition (native) ✅
- **AI**: OpenAI GPT-4 or Claude API for recipe suggestions (planned)
- **Push Notifications**: Expo Notifications (planned)
- **Authentication**: Supabase Auth (email, Google, Apple OAuth) ✅

## Current Project Structure

```
fridgescan/
├── app/                        # Expo Router app directory
│   ├── (tabs)/                # Tab navigation group
│   │   ├── index.tsx          # Home/Inventory screen
│   │   ├── add.tsx            # Add item screen
│   │   ├── locations.tsx      # Storage locations
│   │   ├── recipes.tsx        # Recipe suggestions
│   │   ├── profile.tsx        # User profile
│   │   └── _layout.tsx        # Tab layout
│   ├── auth/                  # Authentication screens
│   │   ├── login.tsx          # Login screen
│   │   ├── register.tsx       # Sign up screen
│   │   └── callback.tsx       # OAuth callback
│   └── _layout.tsx            # Root layout with providers
├── src/
│   ├── components/            # Reusable components
│   │   ├── BarcodeScanner.tsx
│   │   ├── DateScanner.tsx
│   │   ├── EditItemModal.tsx
│   │   ├── UseSomeModal.tsx
│   │   ├── DateInputOptions.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/              # React contexts
│   │   └── AuthContext.tsx    # Authentication state
│   ├── services/              # External API services
│   │   ├── barcodeService.ts  # OpenFoodFacts API
│   │   ├── ocrService.ts      # Google Cloud Vision
│   │   ├── nativeOCRService.ts # ML Kit OCR
│   │   └── household.service.ts
│   ├── store/                 # Zustand stores
│   │   └── inventoryStore.ts  # Inventory state
│   ├── theme/                 # Theme system
│   │   ├── ThemeContext.tsx
│   │   ├── colors.ts
│   │   └── useThemedStyles.ts
│   ├── types/                 # TypeScript types
│   │   └── database.types.ts  # Supabase generated types
│   ├── utils/                 # Utility functions
│   │   ├── digitValidation.ts
│   │   └── imagePreprocessing.ts
│   └── lib/                   # External libraries config
│       └── supabase.ts        # Supabase client
├── supabase/
│   └── migrations/            # Database migrations
│       └── 20250101000000_initial_schema.sql
├── assets/                    # Static assets
├── scripts/                   # Build scripts
└── docs/                      # Documentation
    ├── SUPABASE_SETUP.md
    ├── COMPLETE_OAUTH_SETUP.md
    ├── QUICK_SETUP_VALUES.md
    └── ARCHITECTURE.md
```

## Database Schema (Core Entities)

### Key Tables
- **users**: Authentication, preferences, profiles
- **households**: Collaborative household sharing
- **household_members**: Join table for household membership with roles
- **storage_locations**: Fridge, pantry, freezer, custom locations per household
- **products**: Cached product data from barcode lookups (brand, size, category)
- **inventory_items**: Active inventory with quantities, expiry dates, photos
- **usage_history**: Tracks partial usage of items over time
- **shopping_list**: Auto-generated from usage patterns

### Important Relationships
- Users can belong to multiple households
- Each household has multiple storage locations
- Inventory items belong to a household and storage location
- Products are cached globally to avoid repeated API calls
- Usage history tracks quantity changes per item

## Core Features & Architecture Decisions

### 1. Barcode Scanning Flow
1. Use Expo Camera to scan barcode
2. Query OpenFoodFacts API (or UPC Database as fallback)
3. Cache product data in Products table (90-day TTL)
4. If product exists in local DB, skip external API call to respect rate limits

### 2. OCR for Expiry Dates
- Capture photo of best-before date
- Google Cloud Vision API extracts date
- Support multiple date formats: DD/MM/YYYY, MM/DD/YYYY, DD-MM-YY
- If confidence < 80%, prompt manual entry
- Preprocess images: enhance contrast, crop to date region

### 3. Color-Coded Expiry System
```
Days until expiry:
- 0-3 days: RED (#EF4444)
- 4-7 days: ORANGE (#F59E0B)
- 8-14 days: YELLOW (#EAB308)
- 15+ days: GREEN (#10B981)
- Expired: DARK RED (#991B1B)
```

### 4. Partial Usage Tracking
- Users can mark items as partially used via quick fractions (1/2, 1/3, 1/4) or precise amounts
- Updates `quantity_current` in inventory_items table
- Logs each usage in usage_history table
- Prompts to add to shopping list when quantity < 10%

### 5. AI Recipe Suggestions
- Send current active inventory to OpenAI/Claude API
- Prioritize items expiring soon (next 2-3 days)
- Return 3-5 recipe ideas with ingredients, cooking time, difficulty
- API payload format:
```json
{
  "items": [
    {"name": "chicken breast", "quantity": "400g", "expires_in_days": 2}
  ]
}
```

### 6. Offline Mode Strategy
- Use SQLite (React Native) for local caching
- Queue API calls when offline, sync when back online
- Conflict resolution: last-write-wins with timestamp checks
- Cache thumbnails locally for offline viewing

## Development Phases

### MVP (6-8 weeks)
1. **Weeks 1-2**: Project setup, authentication, database
2. **Weeks 3-4**: Barcode scanning, OCR, product caching
3. **Weeks 5-6**: Inventory CRUD, color-coded UI, single storage location
4. **Weeks 7-8**: UI polish, responsive design, testing

### Phase 2 (4-6 weeks)
- Multiple storage locations with icons/colors
- Partial usage tracking with fractions
- Push notifications for expiry alerts
- Household collaboration features

### Phase 3 (4-6 weeks)
- AI recipe suggestions
- Usage analytics dashboard
- Shopping list auto-generation
- Food waste tracking

### Phase 4 (3-4 weeks)
- Native iOS/Android builds
- Platform-specific features (widgets, Live Activities)
- App Store/Play Store submission

## Key Technical Considerations

### Performance
- Lazy loading for large inventories (infinite scroll)
- Compress photos before upload (max 1MB)
- Generate 200x200px thumbnails for list views
- React Query for API response caching
- Debounce search input (300ms)

### Security
- JWT tokens with refresh token rotation
- Row-level security (users only see their household's data)
- Pre-signed S3 URLs with 24-hour expiration
- Rate limiting on API endpoints
- Encrypt sensitive user data at rest

### Image Storage
- Use Cloudinary or AWS S3 with CDN (CloudFront)
- WebP format with JPEG fallback
- Delete images 30 days after item removal (grace period)

## Common Commands

### Development (Expo React Native)
```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run ios
npm run android
npm run web

# Type checking
npm run type-check

# Linting
npm run lint

# Build Android development client (required after adding native modules)
eas build --platform android --profile development
```

**IMPORTANT: Port Configuration**
- Always use port 3003 for web development (not 3000)
- Another app on this server uses port 3000
- Set in environment or use: `npx expo start --web --port 3003`

**IMPORTANT: Native Module Development**
- When adding new native modules (like expo-web-browser, expo-camera, etc.), you MUST rebuild the development client
- Run `eas build --platform android --profile development` to create a new development build
- The build will include all native modules listed in app.json plugins
- Download and install the new APK on your Android device before testing
- Latest development build: https://expo.dev/accounts/justarieldotcom/projects/fridgescan/builds/a26c092d-8e6c-4717-b526-8bd5382ea598

### Database (Supabase)
```bash
# Run migrations in Supabase Dashboard SQL Editor
# Copy contents of supabase/migrations/20250101000000_initial_schema.sql
# Paste into SQL Editor at: https://app.supabase.com/project/xcvhnqofiazdjyxvbjwj/sql

# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --project-id xcvhnqofiazdjyxvbjwj > src/types/database.types.ts
```

### Testing (To Be Defined)
```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

## Design Principles

### Visual Style
- Modern minimalism with white space and clean sans-serif fonts
- Glassmorphism for card backgrounds (subtle blur effects)
- Bold color coding for expiry status (traffic light system)
- Smooth animations and micro-interactions
- Dark mode support

### Navigation
- Bottom tab bar: Home | Add Item | Locations | Recipes | Profile
- Swipe gestures: left to "use some", right to "remove"
- Pull to refresh inventory

### Accessibility
- High contrast mode for expiry colors
- VoiceOver/TalkBack support
- Large tap targets (min 44x44 points)
- Font scaling support
- Screen reader-friendly labels

## Important Notes for Implementation

1. **Product Caching**: Always check local Products table before making external barcode API calls to respect rate limits
2. **Error Handling**: Provide manual entry fallbacks for both barcode scanning and OCR failures
3. **Measurement Units**: Support flexible units (g, ml, count, oz, lb, tbsp, cup) with proper conversion
4. **Household Sharing**: Design all features with multi-user collaboration in mind from day one
5. **Progressive Enhancement**: Start with web (PWA) MVP, then build native apps from same React Native codebase
6. **Data Cleanup**: Implement soft deletes with grace periods for user-generated content

## Reference Documentation

### Setup Guides
- **SUPABASE_SETUP.md**: Complete Supabase configuration guide
- **COMPLETE_OAUTH_SETUP.md**: Step-by-step OAuth setup for Google and Apple
- **QUICK_SETUP_VALUES.md**: Quick reference for all configuration values
- **ARCHITECTURE.md**: System architecture and design patterns

### Project Documentation
- **PROJECT_PLAN.md**: Original project planning document
- **supabase/migrations/**: Database schema and migrations

### Key Files to Know
- **src/lib/supabase.ts**: Supabase client configuration
- **src/contexts/AuthContext.tsx**: Authentication state management
- **src/store/inventoryStore.ts**: Inventory state (Zustand)
- **app/_layout.tsx**: Root layout with providers and protected routes
- **src/types/database.types.ts**: Generated TypeScript types from Supabase schema
