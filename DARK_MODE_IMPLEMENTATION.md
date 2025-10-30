# Dark Mode Implementation Guide

## Completed

- ✅ Theme system with color palettes (light/dark)
- ✅ Theme context and provider
- ✅ Root layout integration
- ✅ Tab layout with theme colors
- ✅ Profile screen with dark mode toggle

## Implementation Pattern

For each screen/component, follow this pattern:

1. Import theme hook:
```tsx
import { useTheme } from '../../src/theme/ThemeContext';
```

2. Use the hook:
```tsx
const { colors, theme } = useTheme();
```

3. Replace hardcoded colors:
- `#F9FAFB` → `colors.background`
- `#FFFFFF` → `colors.surface`
- `#111827` → `colors.text`
- `#6B7280` → `colors.textSecondary`
- `#9CA3AF` → `colors.textTertiary`
- `#E5E7EB` → `colors.border`
- `#D1D5DB` → `colors.borderSecondary`
- `#10B981` → `colors.primary`
- `#F3F4F6` → `colors.buttonBackground`
- Status colors remain consistent (use colors.statusExpired, etc.)

4. Apply inline styles for dynamic colors:
```tsx
style={[styles.container, { backgroundColor: colors.background }]}
```

## Remaining Files to Update

- app/(tabs)/index.tsx (Home/Inventory screen)
- app/(tabs)/add.tsx (Add Item screen)
- app/(tabs)/recipes.tsx (Recipes screen)
- app/(tabs)/locations.tsx (Locations screen)
- src/components/EditItemModal.tsx
- src/components/UseSomeModal.tsx
- src/components/DateInputOptions.tsx
- src/components/BarcodeScanner.tsx
- src/components/DateScanner.tsx
