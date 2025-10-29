# Contributing to FridgeScan

Thank you for your interest in contributing to FridgeScan! This document provides guidelines and information for contributors.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/fridgescan.git
   cd fridgescan
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

## Project Structure

```
fridgescan/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation group
│   │   ├── _layout.tsx      # Tab navigator config
│   │   ├── index.tsx        # Home/Inventory screen
│   │   ├── add.tsx          # Add item screen
│   │   ├── locations.tsx    # Locations screen
│   │   └── profile.tsx      # Profile screen
│   └── _layout.tsx          # Root layout
├── src/
│   └── store/               # State management
│       └── inventoryStore.ts # Zustand inventory store
├── assets/                  # Static assets (images, icons)
├── docs/                    # Documentation
└── scripts/                 # Build/deploy scripts
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid `any` type - use `unknown` if necessary

### React Native Components
- Use functional components with hooks
- Extract reusable components to separate files
- Follow React Native best practices

### Naming Conventions
- **Files**: PascalCase for components (`HomeScreen.tsx`), camelCase for utilities (`inventoryStore.ts`)
- **Components**: PascalCase (`InventoryItem`)
- **Functions**: camelCase (`calculateExpiry`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_ITEMS`)

### Styling
- Use StyleSheet.create for component styles
- Follow the existing color scheme:
  - Primary: `#10B981` (green)
  - Gray scale: `#111827`, `#374151`, `#6B7280`, `#9CA3AF`, `#F3F4F6`, `#F9FAFB`
  - Status colors: `#991B1B` (expired), `#EF4444` (critical), `#F59E0B` (warning), `#EAB308` (caution)

## Making Changes

### Branch Naming
- `feat/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates

### Commit Messages
Follow conventional commits format:
```
type(scope): description

- Detail 1
- Detail 2
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(inventory): add partial usage tracking

- Add usage modal with fraction buttons
- Update inventory store with usage history
- Display remaining quantity with progress bar
```

### Pull Request Process

1. Create a new branch from `main`
2. Make your changes
3. Test thoroughly on web and mobile
4. Update documentation if needed
5. Submit PR with clear description
6. Link any related issues

## Feature Development

### Priority Features (Phase 2)

1. **Barcode Scanning**
   - Location: `app/(tabs)/add.tsx`
   - Use: `expo-camera`
   - API: OpenFoodFacts

2. **OCR for Expiry Dates**
   - Location: `app/(tabs)/add.tsx`
   - Use: `expo-image-picker`
   - API: Google Cloud Vision

3. **Backend Integration**
   - Create: `src/api/` directory
   - Database: PostgreSQL + Prisma
   - Auth: Firebase or Auth0

4. **Partial Usage Tracking**
   - Update: `src/store/inventoryStore.ts`
   - Add: Usage history model
   - UI: Usage modal component

### Adding New Screens

1. Create file in `app/` directory
2. Add navigation in `app/(tabs)/_layout.tsx`
3. Update types if needed
4. Add to documentation

### Modifying State

All state modifications should go through the Zustand store:
```typescript
// src/store/inventoryStore.ts
export const useInventoryStore = create<InventoryStore>((set) => ({
  // Add new state and actions here
}));
```

## Testing

### Manual Testing Checklist
- [ ] Test on web browser
- [ ] Test on iOS (simulator or Expo Go)
- [ ] Test on Android (emulator or Expo Go)
- [ ] Test all user flows
- [ ] Test edge cases (empty states, errors)
- [ ] Test different screen sizes

### Future: Automated Testing
- Jest for unit tests
- React Native Testing Library for component tests
- Detox for E2E tests

## Documentation

When adding features, update:
- [ ] README.md (if user-facing)
- [ ] CLAUDE.md (if architecture changes)
- [ ] Code comments (complex logic)
- [ ] Type definitions

## Questions?

- Check [PROJECT_PLAN.md](PROJECT_PLAN.md) for architecture details
- Check [CLAUDE.md](CLAUDE.md) for development guidelines
- Open an issue for questions or discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

---

Thank you for contributing to FridgeScan! 🎉
