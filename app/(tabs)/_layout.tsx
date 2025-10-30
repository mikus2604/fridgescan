import { Tabs } from 'expo-router';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext';

// Simple React Native-compatible event emitter
class SimpleEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(...args));
  }
}

// Event emitter for triggering save from tab button
export const addItemEvents = new SimpleEventEmitter();

// Simple icon component (we'll use emojis for now)
function TabBarIcon({ name }: { name: string }) {
  return <Text style={{ fontSize: 24 }}>{name}</Text>;
}

// Custom Add Button Component
function CustomAddButton() {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === '/add';
  const { colors } = useTheme();

  // Define colors based on active state
  const buttonColor = isActive ? '#10B981' : colors.primary; // Green when active (Save), primary otherwise
  const buttonText = isActive ? 'Save' : 'Add';
  const buttonIcon = isActive ? '✓' : '+';

  const handlePress = () => {
    if (isActive) {
      // If on add page, emit save event
      addItemEvents.emit('save');
    } else {
      // Otherwise navigate to add page
      router.push('/add');
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.addButtonContainer,
        pressed && styles.addButtonPressed,
      ]}
    >
      <View style={[styles.addButton, isActive && styles.addButtonActive]}>
        <View style={[styles.addButtonGlow, { backgroundColor: buttonColor, shadowColor: buttonColor }]} />
        <View style={[styles.addButtonGlass, { backgroundColor: `${buttonColor}D9` }]}>
          <Text style={styles.addButtonIcon}>{buttonIcon}</Text>
          <Text style={styles.addButtonLabel}>{buttonText}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerStyle: {
          backgroundColor: colors.backgroundSecondary,
        },
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventory',
          headerTitle: 'FridgeScan',
          tabBarIcon: ({ color }) => <TabBarIcon name="🏠" />,
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: 'Locations',
          tabBarIcon: ({ color }) => <TabBarIcon name="📦" />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => <CustomAddButton />,
          tabBarLabel: () => null,
          tabBarItemStyle: {
            marginTop: -30,
          },
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
          tabBarIcon: ({ color }) => <TabBarIcon name="🍳" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="👤" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  addButtonGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 40,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  addButtonGlass: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  addButtonPressed: {
    transform: [{ scale: 0.92 }],
    opacity: 0.9,
  },
  addButtonActive: {
    opacity: 1,
  },
  addButtonIcon: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: -4,
  },
  addButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
