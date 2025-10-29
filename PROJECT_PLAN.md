# FridgeScan - Application Architecture Plan

## Project Overview

FridgeScan is a cross-platform inventory management app that helps users track food items in their fridge, cupboard, and other storage locations. The app uses barcode scanning and OCR technology to automatically populate product information and expiry dates, helping users reduce food waste and manage their household inventory efficiently.

## User Requirements

- Multi-platform support: Web app (MVP), then iOS and Android native apps
- Barcode scanning for product identification
- OCR for best-before/use-by date extraction
- Multiple storage locations (fridge as default, custom locations as folders)
- Color-coded expiry date system (green → yellow → red)
- Partial usage tracking with flexible measurement units
- Collaborative household sharing
- AI-powered recipe suggestions
- Push notifications for expiry alerts and shopping suggestions

---

## 1. Technology Stack (Cross-Platform First)

### Frontend
- **React Native (Expo)** - Single codebase for web, iOS, and Android
  - Expo Router for navigation
  - Expo Camera for barcode scanning
  - Expo Image Picker for photo capture
- **TypeScript** - Type safety across the stack
- **TailwindCSS / NativeWind** - Consistent styling across platforms
- **Zustand or React Query** - State management

### Backend
- **Node.js + Express** or **Next.js API routes**
- **PostgreSQL** - Relational database for structured inventory data
- **Prisma ORM** - Type-safe database access
- **AWS S3 or Cloudinary** - Image storage for product photos

### External Services
- **Barcode API:** OpenFoodFacts API (free, comprehensive food database) or UPC Database
- **OCR:** Google Cloud Vision API or AWS Textract (accurate date recognition)
- **AI for Recipes:** OpenAI GPT-4 or Claude API
- **Push Notifications:** Firebase Cloud Messaging (FCM) or OneSignal
- **Authentication:** Firebase Auth or Auth0 (supports email + social)

---

## 2. Database Schema (Core Entities)

### Users Table
```
- id (UUID, primary key)
- email (string, unique)
- name (string)
- auth_provider (enum: email, google, apple)
- profile_photo (string, URL)
- preferences (JSON: notification settings, measurement units)
- created_at (timestamp)
- updated_at (timestamp)
```

### Households Table (for collaboration)
```
- id (UUID, primary key)
- name (string)
- created_by (UUID, foreign key → users.id)
- created_at (timestamp)
- updated_at (timestamp)
```

### Household_Members Table (join table)
```
- id (UUID, primary key)
- household_id (UUID, foreign key → households.id)
- user_id (UUID, foreign key → users.id)
- role (enum: admin, member, viewer)
- joined_at (timestamp)
```

### Storage_Locations Table
```
- id (UUID, primary key)
- household_id (UUID, foreign key → households.id)
- name (string: e.g., "Fridge", "Pantry")
- icon (string: emoji or icon name)
- color (string: hex color code)
- is_default (boolean)
- created_at (timestamp)
```

### Products Table (cached product data)
```
- id (UUID, primary key)
- barcode (string, unique)
- product_name (string)
- brand (string)
- size (string: e.g., "500ml", "250g")
- category (string: e.g., "Dairy", "Vegetables")
- default_image_url (string)
- nutritional_info (JSON, optional)
- average_lifespan_days (integer, for smart suggestions)
- created_at (timestamp)
- updated_at (timestamp)
```

### Inventory_Items Table
```
- id (UUID, primary key)
- product_id (UUID, foreign key → products.id)
- storage_location_id (UUID, foreign key → storage_locations.id)
- household_id (UUID, foreign key → households.id)
- added_by (UUID, foreign key → users.id)
- purchase_date (date)
- best_before_date (date)
- quantity_initial (decimal)
- quantity_current (decimal)
- measurement_unit (enum: g, ml, count, oz, lb, tbsp, cup, etc.)
- photo_url (string, URL to uploaded photo)
- status (enum: active, partially_used, consumed, expired)
- created_at (timestamp)
- updated_at (timestamp)
```

### Usage_History Table
```
- id (UUID, primary key)
- inventory_item_id (UUID, foreign key → inventory_items.id)
- user_id (UUID, foreign key → users.id)
- usage_amount (decimal)
- usage_date (timestamp)
- notes (text, optional: e.g., "used for pasta recipe")
- created_at (timestamp)
```

### Shopping_List Table (future feature)
```
- id (UUID, primary key)
- household_id (UUID, foreign key → households.id)
- product_id (UUID, foreign key → products.id, nullable)
- item_name (string)
- quantity (decimal)
- measurement_unit (string)
- is_purchased (boolean)
- added_by (UUID, foreign key → users.id)
- created_at (timestamp)
```

---

## 3. Core Features & User Flow

### A. Onboarding
1. User signs up (email/password or Google/Apple)
2. Create or join household (optional for families/roommates)
3. Set default storage location ("Fridge") - auto-created
4. Quick tutorial: "Scan your first item"

### B. Adding Items (Photo → Database)
1. User taps "Add Item" button (floating action button)
2. **Step 1:** Scan barcode with camera
   - API call to OpenFoodFacts or UPC Database
   - Auto-populate: product name, brand, size, image
   - If not found: allow manual entry
   - Cache product data in Products table
3. **Step 2:** Photo capture of best-before date
   - OCR extracts date (DD/MM/YYYY format detection)
   - User confirms/edits date if needed
4. **Step 3:** Select storage location (default: Fridge)
5. **Step 4:** Set quantity (default: 1 unit, or enter weight/volume)
6. Save to database → Item appears in inventory list

### C. Home Screen (Smart Inventory View)

**Layout:**
- **Top section:** Items expiring soon (next 3 days) - RED banners
- **Middle section:** Items expiring within 7 days - YELLOW/ORANGE
- **Bottom section:** Fresh items (7+ days) - GREEN

**UI Elements per item:**
- Product image (thumbnail)
- Product name + brand
- Best-before date (e.g., "Expires in 2 days")
- Storage location icon (fridge/cupboard/freezer)
- Quantity remaining (progress bar: 100% → 0%)
- Quick actions: "Use some" | "Remove" | "Details"

**Filters & Search:**
- By storage location (Fridge, Pantry, etc.)
- By category (Dairy, Vegetables, Condiments)
- Search bar for quick lookup
- Sort by: Expiry date (default), Name, Date added

**Color Coding Logic:**
```
Days until expiry:
- 0-3 days: RED (#EF4444)
- 4-7 days: ORANGE (#F59E0B)
- 8-14 days: YELLOW (#EAB308)
- 15+ days: GREEN (#10B981)
- Expired: DARK RED (#991B1B)
```

### D. Partial Usage Tracking
1. User taps "Use some" on an item (e.g., butter)
2. Modal appears with options:
   - **Quick fractions:** 1/2, 1/3, 1/4, 1/5, 1/8 (tap buttons)
   - **Precise amount:** Input field with unit selector (grams, ml, tbsp, cups)
   - **Percentage slider:** Visual slider (0-100%)
3. System calculates remaining quantity:
   ```
   quantity_current = quantity_current - usage_amount
   ```
4. Updates inventory item in database
5. Logs usage in Usage_History table
6. If quantity < 10%, prompt: "Mark as finished?" or "Add to shopping list"

### E. Expiry Notifications

**Notification Types:**
1. **3 days before expiry:** "Your milk expires in 3 days"
2. **1 day before expiry:** "Use your yogurt today or it'll expire!"
3. **Expiry day:** "Your cheese expires today!"
4. **Weekly digest:** "5 items expiring this week. Check your fridge!"
5. **Shopping suggestions:** "You usually buy eggs every 2 weeks. Time to restock?"

**Notification Settings (user preferences):**
- Enable/disable each notification type
- Set quiet hours (e.g., no notifications 10pm-8am)
- Notification frequency for weekly digest (Monday mornings by default)

### F. AI Recipe Suggestions
1. User taps "What can I cook?" button on home screen
2. App sends current active inventory to AI API:
   ```json
   {
     "items": [
       {"name": "chicken breast", "quantity": "400g", "expires_in_days": 2},
       {"name": "bell peppers", "quantity": "2", "expires_in_days": 4}
     ]
   }
   ```
3. AI (OpenAI/Claude) returns 3-5 recipe ideas prioritizing items expiring soon
4. Display: Recipe name, ingredients needed, cooking time, estimated difficulty
5. User can tap to see full recipe or save to favorites

---

## 4. Mobile-First Design Principles

### Visual Style
- **Modern minimalism** (lots of white space, clean sans-serif fonts)
- **Glassmorphism** for card backgrounds (subtle blur effects)
- **Bold color coding** for expiry status (traffic light system)
- **Micro-interactions:** Smooth animations when swiping to delete, haptic feedback on actions
- **Dark mode support** for OLED displays

### Navigation
- **Bottom tab bar:** Home | Add Item | Locations | Recipes | Profile
- **Swipe gestures:**
  - Swipe left to "use some"
  - Swipe right to "remove"
  - Pull to refresh inventory

### Accessibility
- High contrast mode for expiry colors
- VoiceOver/TalkBack support
- Large tap targets (min 44x44 points)
- Font scaling support
- Screen reader-friendly labels

### Design References
- Material Design 3 (Android)
- iOS Human Interface Guidelines
- Contemporary design trends: Neumorphism, gradient accents, floating action buttons

---

## 5. Cross-Platform Strategy

### Phase 1: React Native Web App (MVP)
- Deploy as PWA (Progressive Web App)
- Install prompt for "Add to Home Screen" on mobile browsers
- Service workers for offline access to cached inventory
- Responsive design: Mobile-first, tablet-optimized

### Phase 2: Native Apps (iOS & Android)
- Same React Native codebase
- Platform-specific features:
  - **iOS:** Live Activities for expiring items on lock screen, Widgets
  - **Android:** Home screen widgets showing inventory summary, Material You theming
- Submit to App Store & Google Play
- Deep linking support

### Phase 3: Future Enhancements
- Desktop app (Electron) for pantry management at home
- Smart home integration (Alexa: "What's in my fridge?", Google Home)
- Wear OS / Apple Watch quick glance at expiring items
- Smart fridge integration (Samsung Family Hub, LG ThinQ)

---

## 6. Technical Considerations

### API Rate Limits
- **Cache barcode lookups locally** in Products table
- If product exists in DB, skip external API call
- Implement TTL (time-to-live) for cached products (90 days)
- Fallback: If primary barcode API fails, try secondary service

### OCR Accuracy
- **Train on common date formats:**
  - Best Before: DD/MM/YYYY, MM/DD/YYYY
  - Use By: DD-MM-YY
  - Expiry/EXP/BB: Various formats
- **Preprocessing:** Enhance image contrast, crop to date region
- **Confidence threshold:** If OCR confidence < 80%, prompt manual entry
- **Fallback:** Manual date picker if OCR fails

### Image Storage
- **Compression:** Compress photos before upload (max 1MB per image)
- **Thumbnail generation:** Generate 200x200px thumbnails for list views
- **CDN:** Use CloudFront or Cloudinary CDN for fast image delivery
- **Cleanup:** Delete images when inventory items are removed (after 30-day grace period)

### Offline Mode
- **Local storage:** SQLite (React Native) for recent inventory
- **Sync strategy:** Queue API calls when offline, sync when back online
- **Conflict resolution:** Last-write-wins for collaborative mode (with timestamp checks)
- **Cached images:** Store thumbnails locally for offline viewing

### Security
- **Authentication:** JWT tokens with refresh token rotation
- **API security:** Rate limiting, CORS policies
- **Database:** Row-level security (users only see their household's data)
- **Image URLs:** Pre-signed S3 URLs with 24-hour expiration
- **Data encryption:** Encrypt sensitive user data at rest

### Performance Optimization
- **Lazy loading:** Infinite scroll for large inventories
- **Debouncing:** Search input debouncing (300ms)
- **Caching:** React Query for API response caching
- **Code splitting:** Lazy load routes and components
- **Image optimization:** WebP format with JPEG fallback

---

## 7. Development Phases

### MVP (Minimum Viable Product) - 6-8 weeks

**Week 1-2: Project Setup & Authentication**
- Initialize Expo React Native project
- Set up PostgreSQL database + Prisma ORM
- Implement authentication (email + Google OAuth)
- Create basic user profile

**Week 3-4: Core Scanning Features**
- Barcode scanning integration (Expo Camera)
- OpenFoodFacts API integration
- OCR implementation (Google Cloud Vision)
- Product data caching

**Week 5-6: Inventory Management**
- Basic inventory list UI (sorted by expiry)
- Add item flow (barcode → date → save)
- Remove items (full consumption only)
- Single default storage location (Fridge)

**Week 7-8: UI Polish & Testing**
- Color-coded expiry system
- Responsive design for web/mobile
- Basic error handling
- User testing & bug fixes

### Phase 2 - 4-6 weeks: Enhanced Features

**Week 9-10: Multiple Storage Locations**
- Create/edit storage locations (folders)
- Icon/color customization
- Filter inventory by location
- Location management UI

**Week 11-12: Partial Usage Tracking**
- "Use some" modal with fractions/precise amounts
- Usage history logging
- Quantity progress bars
- Shopping list integration (basic)

**Week 13-14: Notifications & Collaboration**
- Push notification setup (Firebase)
- Expiry alerts (1-day, 3-day)
- Household creation/joining
- Collaborative inventory sharing

### Phase 3 - 4-6 weeks: AI & Analytics

**Week 15-16: AI Recipe Suggestions**
- OpenAI/Claude API integration
- Recipe suggestion UI
- Save favorite recipes
- Filter recipes by dietary preferences

**Week 17-18: Analytics & Insights**
- Usage analytics dashboard
- Food waste tracking (expired items report)
- Weekly summary notifications
- Shopping pattern insights

**Week 19-20: Shopping List & Smart Features**
- Auto-generate shopping list from usage patterns
- Smart restock suggestions
- Barcode scanning for shopping list items
- Shopping list sharing

### Phase 4 - 3-4 weeks: Native Apps

**Week 21-22: iOS/Android Build**
- Build native apps from React Native codebase
- Platform-specific testing (iOS/Android)
- App Store/Play Store submission prep

**Week 23-24: Platform-Specific Features**
- iOS Live Activities & Widgets
- Android Widgets & Material You
- Push notification platform testing
- App store launch

---

## 8. Estimated Costs (Monthly, Post-Launch)

### Infrastructure
- **Hosting:** Vercel/Railway for backend ($20-50)
- **Database:** Supabase/Render PostgreSQL ($10-25)
- **Image Storage:** AWS S3 ($5-20 for ~1000 users)

### External APIs
- **OCR API:** Google Cloud Vision (1000 free/month, then $1.50 per 1000)
- **Barcode API:** OpenFoodFacts (free, donations encouraged)
- **AI Recipes:** OpenAI API ($10-50 depending on usage)

### Push Notifications
- **Firebase:** Free tier sufficient for <10,000 users

### Total Estimated Costs
- **0-1,000 users:** ~$50-150/month
- **1,000-10,000 users:** ~$200-500/month
- **10,000+ users:** Scale accordingly with usage-based pricing

---

## 9. Success Metrics (KPIs)

### User Engagement
- Daily Active Users (DAU) / Monthly Active Users (MAU)
- Average items scanned per user per week
- Retention rate (7-day, 30-day)

### Feature Adoption
- % of users using partial usage tracking
- % of users with multiple storage locations
- % of users who tried AI recipe suggestions

### Business Impact
- Food waste reduction (tracked via expired items)
- User-reported savings (optional survey)
- App Store ratings and reviews

---

## 10. Future Feature Ideas (Post-MVP)

### Advanced Features
- **Barcode scanning for recipes:** Scan multiple items to auto-suggest recipes
- **Smart meal planning:** Weekly meal plans based on inventory
- **Nutrition tracking:** Track calories/macros from consumed items
- **Food sharing:** Donate excess food to neighbors/community
- **Price tracking:** Track grocery prices over time, suggest cheaper alternatives

### Integrations
- **Smart scales:** Auto-update quantities via Bluetooth scales
- **Grocery delivery APIs:** Order missing items directly from app (Instacart, Amazon Fresh)
- **Calendar integration:** Meal planning with Google Calendar/iCal

### Gamification
- **Achievements:** Badges for reducing food waste, consistent usage
- **Streaks:** Track days without wasting food
- **Community challenges:** Compete with friends/family to reduce waste

---

## 11. Risk Mitigation

### Technical Risks
- **OCR accuracy issues:** Provide manual override, improve with user feedback
- **Barcode API limitations:** Implement fallback APIs, allow manual product entry
- **Offline sync conflicts:** Use conflict resolution strategies (timestamp-based)

### Business Risks
- **User acquisition:** Focus on organic growth, referral programs
- **Retention:** Push notifications for re-engagement, valuable content
- **Monetization:** Freemium model (basic free, premium features for households)

### Compliance
- **GDPR/Privacy:** Clear data handling policies, user data export/deletion
- **App Store guidelines:** Follow Apple/Google submission requirements
- **API ToS:** Respect rate limits and terms of service for external APIs

---

## Next Steps

1. **Technology Selection:** Finalize tech stack (Expo vs. pure React Native)
2. **Project Initialization:** Set up Git repo, project structure, dependencies
3. **Database Design:** Create Prisma schema, set up PostgreSQL
4. **API Integration:** Test OpenFoodFacts API and Google Cloud Vision API
5. **UI Mockups:** Design key screens (Home, Add Item, Item Details)
6. **Development Kickoff:** Start with authentication and basic inventory CRUD

---

## Project Structure (Recommended)

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

---

**Document Version:** 1.0
**Last Updated:** 2025-10-29
**Status:** Planning Phase
