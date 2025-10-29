import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useInventoryStore } from '../src/store/inventoryStore';

export default function RootLayout() {
  const loadData = useInventoryStore((state) => state.loadData);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
      </Stack>
    </>
  );
}
