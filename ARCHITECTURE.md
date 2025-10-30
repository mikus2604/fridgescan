# FridgeScan Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Data Flow](#data-flow)
5. [Authentication System](#authentication-system)
6. [State Management](#state-management)
7. [Database Design](#database-design)
8. [API Integration](#api-integration)
9. [Security](#security)
10. [Performance Considerations](#performance-considerations)

---

## System Overview

FridgeScan is a cross-platform mobile and web application built with React Native (Expo) that helps users manage food inventory, reduce waste, and get recipe suggestions based on items nearing expiration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  iOS  App    │  │ Android App  │     │
│  │ (Expo Web)   │  │ (Expo Go)    │  │ (Expo Go)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            React Native (Expo)                       │   │
│  │  ┌──────────┐  ┌───────────┐  ┌─────────────────┐  │   │
│  │  │  Expo    │  │  Zustand  │  │  React Context  │  │   │
│  │  │  Router  │  │   Store   │  │  (Auth, Theme)  │  │   │
│  │  └──────────┘  └───────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐    │
│  │   Supabase   │  │  OpenFoodFacts│  │   ML Kit     │    │
│  │    Client    │  │     API       │  │  Text OCR    │    │
│  └──────────────┘  └───────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend Layer                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Supabase (BaaS)                      │   │
│  │  ┌──────────┐  ┌───────────┐  ┌─────────────────┐  │   │
│  │  │PostgreSQL│  │   Auth    │  │    Storage      │  │   │
│  │  │    DB    │  │  Service  │  │   (Future)      │  │   │
│  │  └──────────┘  └───────────┘  └─────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React Native 0.81.5 with Expo 54
- **Language**: TypeScript 5.9.2
- **Navigation**: Expo Router 6 (file-based routing)
- **State Management**:
  - Zustand 5.0.2 (global state)
  - React Context (auth, theme)
- **UI Components**: Custom components with React Native core
- **Styling**: StyleSheet API with dynamic theming

### Backend
- **BaaS**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Database**: PostgreSQL 15+ (via Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **File Storage**: Supabase Storage (planned)

### External APIs
- **Barcode Lookup**: OpenFoodFacts API
- **OCR**: Google ML Kit Text Recognition (native)
- **AI Recipes**: OpenAI/Claude API (planned)

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript compiler
- **Environment Variables**: dotenv + Expo Constants
- **Version Control**: Git

---

## Architecture Patterns

### 1. Component Architecture

```
Components/
├── Screens (Route Components)
│   └── Full-page components in app/ directory
├── Feature Components
│   └── Reusable, self-contained features (modals, scanners)
├── UI Components
│   └── Basic, presentational components
└── Layout Components
    └── Navigation wrappers and layouts
```

**Pattern**: Container/Presentational Components
- **Container**: Manages state, handles logic
- **Presentational**: Pure UI, receives props

### 2. State Management Strategy

**Multi-layered Approach:**

```
┌───────────────────────────────────────────┐
│          Component State (useState)        │  ← UI state, form inputs
├───────────────────────────────────────────┤
│        React Context (useContext)         │  ← Auth, Theme
├───────────────────────────────────────────┤
│          Zustand Store (global)           │  ← Inventory data
├───────────────────────────────────────────┤
│       Supabase (server state)             │  ← Source of truth
└───────────────────────────────────────────┘
```

**When to use each:**
- **useState**: Temporary UI state (modal open/closed, form inputs)
- **Context**: Cross-cutting concerns (auth, theme, configuration)
- **Zustand**: Client-side data cache (inventory, households)
- **Supabase**: Persistent data, multi-user sync

### 3. File-Based Routing (Expo Router)

```
app/
├── (tabs)/          # Tab navigator group
│   ├── index.tsx    # Route: /
│   ├── add.tsx      # Route: /add
│   └── _layout.tsx  # Tab layout
├── auth/            # Auth routes (no tabs)
│   ├── login.tsx    # Route: /auth/login
│   └── register.tsx # Route: /auth/register
└── _layout.tsx      # Root layout
```

**Benefits:**
- Automatic route generation
- Type-safe navigation
- Easy deep linking
- Nested layouts

### 4. Service Layer Pattern

All external API calls are abstracted into service modules:

```typescript
// src/services/barcodeService.ts
export const lookupBarcode = async (barcode: string) => {
  // API logic
  // Caching logic
  // Error handling
  return productData;
};
```

**Benefits:**
- Centralized API logic
- Easy to mock for testing
- Consistent error handling
- Caching strategies

---

## Data Flow

### Read Flow (Fetching Data)

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│Component│─────▶│ Zustand │─────▶│ Supabase │─────▶│PostgreSQL│
│         │      │  Store  │      │  Client  │      │    DB    │
└─────────┘      └─────────┘      └──────────┘      └──────────┘
     │                │                  │                 │
     │                │                  │                 │
     ▼                ▼                  ▼                 ▼
  Render          Check cache       Query with RLS    Return rows
                  If miss, fetch    Apply policies
```

### Write Flow (Updating Data)

```
┌─────────┐      ┌─────────┐      ┌──────────┐      ┌──────────┐
│Component│─────▶│ Zustand │─────▶│ Supabase │─────▶│PostgreSQL│
│ (Form)  │      │  Action │      │  Client  │      │    DB    │
└─────────┘      └─────────┘      └──────────┘      └──────────┘
     │                │                  │                 │
     │                │                  │                 │
     ▼                ▼                  ▼                 ▼
User submits     Optimistic update   Mutation         Update row
                 Update local cache  with RLS         Trigger RLS
                                     Return result     Return to client
```

### Example: Adding an Inventory Item

```typescript
// 1. User scans barcode
const barcode = await scanBarcode();

// 2. Lookup product info
const product = await barcodeService.lookupBarcode(barcode);

// 3. User confirms and saves
const newItem = {
  household_id: currentHousehold.id,
  product_id: product.id,
  quantity: 1,
  expiry_date: '2024-12-31',
};

// 4. Zustand action (optimistic update)
inventoryStore.addItem(newItem); // Updates UI immediately

// 5. Supabase insert
await supabase.from('inventory_items').insert(newItem);

// 6. On success: item already in UI (optimistic)
// 7. On error: roll back local state
```

---

## Authentication System

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                  AuthContext                          │
│  ┌────────────────────────────────────────────────┐  │
│  │  State: user, session, profile, households     │  │
│  │  Methods: signIn, signUp, signOut, OAuth       │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              Supabase Auth Client                     │
│  ┌────────────────────────────────────────────────┐  │
│  │  JWT Token Management                          │  │
│  │  Session Persistence (SecureStore/localStorage)│  │
│  │  OAuth Provider Integration                    │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│              Supabase Auth API                        │
│  ┌────────────────────────────────────────────────┐  │
│  │  Email/Password Auth                           │  │
│  │  Google OAuth Flow                             │  │
│  │  Apple OAuth Flow                              │  │
│  │  Token Refresh                                 │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Authentication Flow

**Email/Password Sign Up:**
```
User → Register Screen → AuthContext.signUp()
  → Supabase.auth.signUp()
  → Trigger: handle_new_user() (PostgreSQL function)
  → Create profile in profiles table
  → Create default household
  → Add user as household owner
  → Return session + user
  → Update AuthContext state
  → Redirect to main app
```

**OAuth Flow (Google/Apple):**
```
User → Click OAuth button → AuthContext.signInWithGoogle()
  → makeRedirectUri() (expo-auth-session)
  → Supabase.auth.signInWithOAuth()
  → Open browser (WebBrowser.openAuthSessionAsync)
  → User authenticates with provider
  → Redirect to fridgescan://auth/callback
  → Extract tokens from URL
  → Supabase.auth.setSession()
  → Update AuthContext state
  → Redirect to main app
```

### Protected Routes

```typescript
// app/_layout.tsx
<AuthProvider>
  <ProtectedRoute>
    <Stack>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/login" />
    </Stack>
  </ProtectedRoute>
</AuthProvider>

// src/components/ProtectedRoute.tsx
useEffect(() => {
  if (!user && !inAuthGroup) {
    router.replace('/auth/login'); // Redirect to login
  } else if (user && inAuthGroup) {
    router.replace('/(tabs)'); // Redirect to app
  }
}, [user, segments]);
```

---

## State Management

### Zustand Store Structure

```typescript
// src/store/inventoryStore.ts
interface InventoryStore {
  // State
  items: InventoryItem[];
  storageLocations: StorageLocation[];
  isLoading: boolean;

  // Actions
  loadData: () => Promise<void>;
  addItem: (item: NewItem) => Promise<void>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  useSomeItem: (id: string, amount: number) => Promise<void>;

  // Computed values
  expiringSoon: () => InventoryItem[];
  colorCodedItems: () => Map<string, InventoryItem[]>;
}
```

**Key Patterns:**
- Actions are async and handle Supabase calls
- Optimistic updates for better UX
- Error handling with rollback on failure
- Computed values derived from state

### Context Providers

**1. AuthContext** (`src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  households: Household[];
  currentHousehold: Household | null;
  signIn: (email, password) => Promise<void>;
  signUp: (email, password, name) => Promise<void>;
  signOut: () => Promise<void>;
  // ... OAuth methods
}
```

**2. ThemeContext** (`src/theme/ThemeContext.tsx`)
```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  colors: ColorScheme;
  toggleTheme: () => void;
}
```

---

## Database Design

### Entity-Relationship Diagram

```
┌──────────────┐        ┌───────────────────┐
│   profiles   │────┬───│ household_members │
└──────────────┘    │   └───────────────────┘
                    │            │
                    │            │
                    │   ┌────────────────┐
                    └───│  households    │
                        └────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
           ┌────────▼─────────┐    ┌─────────▼────────┐
           │ storage_locations│    │ inventory_items  │
           └──────────────────┘    └──────────────────┘
                                            │
                                            │
                    ┌───────────────────────┴──────┐
                    │                              │
           ┌────────▼────────┐          ┌─────────▼─────────┐
           │    products     │          │  usage_history    │
           └─────────────────┘          └───────────────────┘
```

### Key Tables

**profiles**
- One-to-one with auth.users
- Stores user metadata (name, avatar)
- Created automatically on signup via trigger

**households**
- Represents shared inventory groups
- One household per default, can be multiple
- Created automatically for new users

**household_members**
- Join table: users ↔ households
- Includes role (owner, admin, member)
- Enables multi-user collaboration

**inventory_items**
- Core entity: food items
- Links to household, storage location, product
- Tracks quantity (initial, current) and expiry

**products**
- Cached barcode lookup data
- Prevents repeated API calls
- Shared across all users

### Row Level Security (RLS) Policies

**Principle**: Users can only access data from their households

```sql
-- Example: inventory_items RLS
CREATE POLICY "Users can view household inventory"
  ON inventory_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = inventory_items.household_id
        AND user_id = auth.uid()
    )
  );
```

**Benefits:**
- Database-level security
- No backend authorization code needed
- Automatic enforcement on all queries

---

## API Integration

### Barcode Lookup (OpenFoodFacts)

```typescript
// src/services/barcodeService.ts
export const lookupBarcode = async (barcode: string) => {
  // 1. Check local cache (products table)
  const cached = await checkProductCache(barcode);
  if (cached) return cached;

  // 2. Call OpenFoodFacts API
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  );

  // 3. Parse and normalize data
  const product = normalizeProductData(response);

  // 4. Cache in database
  await cacheProduct(barcode, product);

  return product;
};
```

**Caching Strategy:**
- Cache all successful lookups
- 90-day TTL (Time To Live)
- Fallback to manual entry if not found

### OCR (ML Kit Text Recognition)

```typescript
// src/services/nativeOCRService.ts
export const scanDate = async (imageUri: string) => {
  // 1. Preprocess image (crop, enhance contrast)
  const processed = await preprocessImage(imageUri);

  // 2. Run ML Kit recognition
  const result = await TextRecognition.recognize(processed);

  // 3. Extract date patterns
  const dates = extractDates(result.text);

  // 4. Parse and validate
  const parsed = parseDateFormats(dates);

  // 5. Return with confidence score
  return { date: parsed, confidence: result.confidence };
};
```

**Supported Formats:**
- DD/MM/YYYY
- MM/DD/YYYY
- DD-MM-YY
- YYYY-MM-DD

---

## Security

### Authentication Security
- **JWT Tokens**: Short-lived access tokens + refresh tokens
- **Secure Storage**:
  - Native: Expo SecureStore (encrypted keychain)
  - Web: localStorage (with HTTPS only)
- **Session Management**: Automatic token refresh
- **OAuth**: Follows PKCE flow for mobile

### Database Security
- **Row Level Security (RLS)**: All tables protected
- **Policies**: Users can only access their household data
- **SQL Injection**: Protected by Supabase parameterized queries
- **Audit Logs**: created_at, updated_at on all tables

### API Security
- **Rate Limiting**: Supabase built-in limits
- **CORS**: Configured for app.myfrigee.com
- **Environment Variables**: Sensitive keys in .env (not committed)
- **Anon Key**: Public key for client, limited permissions

### Data Privacy
- **User Isolation**: RLS ensures data separation
- **Soft Deletes**: Grace period before permanent deletion
- **Image URLs**: Pre-signed URLs with expiration (future)

---

## Performance Considerations

### Optimizations

**1. Lazy Loading**
```typescript
// Only load visible items
<FlatList
  data={items}
  renderItem={renderItem}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

**2. Image Optimization**
- Compress before upload (max 1MB)
- Generate thumbnails (200x200px)
- Use WebP format with JPEG fallback
- Lazy load images

**3. State Optimization**
- Zustand: Selective subscriptions
- Memoization with useMemo/React.memo
- Debounced search inputs (300ms)

**4. Database Optimization**
- Indexes on foreign keys and date columns
- Efficient RLS policies (EXISTS vs JOIN)
- Pagination for large datasets

**5. Network Optimization**
- Cache API responses
- Optimistic UI updates
- Offline queue (future)
- Request deduplication

### Monitoring
- Track query performance in Supabase dashboard
- Monitor bundle size
- Profile React renders in development
- Measure time-to-interactive

---

## Deployment Architecture

### Development
```
Developer → Expo CLI → Metro Bundler
  → Expo Go App (iOS/Android)
  → Web Browser (localhost:3003)
```

### Production
```
┌─────────────────┐
│   Vercel/CDN    │  ← Static web build
└─────────────────┘
         │
┌────────▼─────────┐
│  app.myfrigee.com│
└──────────────────┘

┌─────────────────┐
│  EAS Build      │  ← Native builds
└─────────────────┘
         │
┌────────▼─────────┐
│ App Store/       │
│ Google Play      │
└──────────────────┘
```

---

## Future Enhancements

### Planned Architecture Changes
1. **Realtime Sync**: Supabase Realtime for multi-user live updates
2. **Offline Mode**: Local SQLite cache + sync queue
3. **Push Notifications**: Expo Notifications for expiry alerts
4. **Analytics**: Usage tracking and food waste metrics
5. **AI Integration**: Recipe suggestions via OpenAI/Claude API
6. **Image Storage**: Supabase Storage for item photos

### Scalability Considerations
- **Database**: PostgreSQL scales to millions of rows
- **Auth**: Supabase Auth handles high concurrency
- **CDN**: Static assets served from edge locations
- **Caching**: Redis for hot data (if needed)
- **Read Replicas**: For heavy read workloads (future)

---

## Development Workflow

### Local Development
1. Clone repository
2. Install dependencies: `npm install`
3. Configure Supabase: Copy `.env` with credentials
4. Run migrations in Supabase dashboard
5. Start dev server: `npx expo start --web --port 3003`

### Testing Strategy (Future)
- **Unit Tests**: Jest for utilities and services
- **Component Tests**: React Native Testing Library
- **Integration Tests**: Detox for E2E
- **API Tests**: Supabase client mocking

### CI/CD (Future)
- GitHub Actions for automated testing
- EAS Build for native app builds
- Vercel for web deployment
- Automated migrations with Supabase CLI

---

## Conclusion

FridgeScan follows modern React Native best practices with:
- Clean separation of concerns
- Type safety throughout
- Secure authentication and authorization
- Scalable database design
- Performance-optimized rendering
- Cross-platform compatibility

For questions or contributions, see project documentation.
