import { Tabs } from 'expo-router';
import { Text } from 'react-native';

// Simple icon component (we'll use emojis for now)
function TabBarIcon({ name }: { name: string }) {
  return <Text style={{ fontSize: 24 }}>{name}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: {
          backgroundColor: '#F9FAFB',
        },
        headerTintColor: '#111827',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
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
        name="add"
        options={{
          title: 'Add Item',
          tabBarIcon: ({ color }) => <TabBarIcon name="➕" />,
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabBarIcon name="👤" />,
        }}
      />
    </Tabs>
  );
}
