# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FridgeScan is a cross-platform inventory management app for tracking food items with barcode scanning, OCR for expiry dates, and AI-powered recipe suggestions. The app helps users reduce food waste through color-coded expiry tracking and collaborative household sharing.

**Current Status:** Planning phase - no code implementation yet. The project plan is defined in PROJECT_PLAN.md.

## Technology Stack

### Frontend (Planned)
- **React Native (Expo)**: Single codebase for web, iOS, and Android
- **TypeScript**: Type safety across the stack
- **Expo Router**: Navigation
- **Expo Camera**: Barcode scanning
- **NativeWind**: TailwindCSS for React Native
- **Zustand or React Query**: State management

### Backend (Planned)
- **Node.js + Express** or **Next.js API routes**
- **PostgreSQL**: Primary database
- **Prisma ORM**: Type-safe database access
- **AWS S3 or Cloudinary**: Image storage

### External Services (Planned)
- **Barcode API**: OpenFoodFacts API (free food database) or UPC Database
- **OCR**: Google Cloud Vision API or AWS Textract for date recognition
- **AI**: OpenAI GPT-4 or Claude API for recipe suggestions
- **Push Notifications**: Firebase Cloud Messaging or OneSignal
- **Authentication**: Firebase Auth or Auth0

## Planned Project Structure

```
fridgescan/
├── apps/
│   ├── mobile/          # Expo React Native app
│   ├── web/             # Next.js web app (or Expo Web)
│   └── api/             # Backend API (Next.js API routes or Express)
├── packages/
│   ├── ui/              # Shared UI components
│   ├── database/        # Prisma schema & migrations
│   ├── shared/          # Shared utilities, types
│   └── config/          # Shared config (ESLint, TypeScript)
├── docs/
│   ├── PROJECT_PLAN.md
│   ├── API_DOCS.md
│   └── DESIGN_SYSTEM.md
└── scripts/             # Build, deployment scripts
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
```

**IMPORTANT: Port Configuration**
- Always use port 3003 for web development (not 3000)
- Another app on this server uses port 3000
- Set in environment or use: `npx expo start --web --port 3003`

### Database (Prisma)
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
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

- Full project plan: PROJECT_PLAN.md
- Technology decisions are documented in PROJECT_PLAN.md sections 1-6
- Database schema details in PROJECT_PLAN.md section 2
- UI/UX flows in PROJECT_PLAN.md sections 3-4
