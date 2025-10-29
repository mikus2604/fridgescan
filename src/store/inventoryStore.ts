import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface InventoryItem {
  id: string;
  productName: string;
  brand?: string;
  itemCount: number; // Number of packages/items (e.g., 2 bottles, 3 packs)
  quantity: number;
  quantityUnit: string;
  bestBeforeDate: Date;
  purchaseDate: Date;
  storageLocation: string;
  photoUrl?: string;
  barcode?: string;
  category?: string;
}

export interface UsageHistoryEntry {
  id: string;
  itemId: string;
  productName: string;
  quantityUsed: number;
  quantityUnit: string;
  usedAt: Date;
}

interface InventoryStore {
  items: InventoryItem[];
  usageHistory: UsageHistoryEntry[];
  isLoaded: boolean;
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  recordUsage: (itemId: string, productName: string, quantityUsed: number, quantityUnit: string) => void;
  loadData: () => Promise<void>;
  getExpiryStatus: (date: Date) => {
    color: string;
    daysUntilExpiry: number;
    status: 'expired' | 'critical' | 'warning' | 'caution' | 'fresh';
  };
}

const STORAGE_KEY = '@fridgescan_inventory';
const USAGE_HISTORY_KEY = '@fridgescan_usage_history';

// Helper to persist data
const persistData = async (items: InventoryItem[], usageHistory: UsageHistoryEntry[]) => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify(items)],
      [USAGE_HISTORY_KEY, JSON.stringify(usageHistory)],
    ]);
  } catch (error) {
    console.error('Error persisting data:', error);
  }
};

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  usageHistory: [],
  isLoaded: false,

  loadData: async () => {
    try {
      const [[, itemsData], [, historyData]] = await AsyncStorage.multiGet([
        STORAGE_KEY,
        USAGE_HISTORY_KEY,
      ]);

      if (itemsData) {
        const parsedItems = JSON.parse(itemsData).map((item: any) => ({
          ...item,
          bestBeforeDate: new Date(item.bestBeforeDate),
          purchaseDate: new Date(item.purchaseDate),
        }));
        set({ items: parsedItems, isLoaded: true });
      } else {
        // Initialize with mock data if no saved data
        const mockData = [
          {
            id: '1',
            productName: 'Milk',
            brand: 'Organic Valley',
            itemCount: 2,
            quantity: 1,
            quantityUnit: 'L',
            bestBeforeDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            storageLocation: 'Fridge',
            category: 'Dairy',
          },
          {
            id: '2',
            productName: 'Chicken Breast',
            brand: 'Fresh Farms',
            itemCount: 1,
            quantity: 500,
            quantityUnit: 'g',
            bestBeforeDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
            purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            storageLocation: 'Fridge',
            category: 'Meat',
          },
          {
            id: '3',
            productName: 'Yogurt',
            brand: 'Chobani',
            itemCount: 4,
            quantity: 1,
            quantityUnit: 'count',
            bestBeforeDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            storageLocation: 'Fridge',
            category: 'Dairy',
          },
        ];
        set({ items: mockData, isLoaded: true });
        await persistData(mockData, []);
      }

      if (historyData) {
        const parsedHistory = JSON.parse(historyData).map((entry: any) => ({
          ...entry,
          usedAt: new Date(entry.usedAt),
        }));
        set({ usageHistory: parsedHistory });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      set({ isLoaded: true });
    }
  },

  addItem: (item) =>
    set((state) => {
      const newItem = {
        ...item,
        id: Date.now().toString(),
      };
      const newItems = [...state.items, newItem];
      persistData(newItems, state.usageHistory);
      return { items: newItems };
    }),

  removeItem: (id) =>
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== id);
      persistData(newItems, state.usageHistory);
      return { items: newItems };
    }),

  updateItem: (id, updates) =>
    set((state) => {
      const newItems = state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      persistData(newItems, state.usageHistory);
      return { items: newItems };
    }),

  recordUsage: (itemId, productName, quantityUsed, quantityUnit) =>
    set((state) => {
      const newEntry: UsageHistoryEntry = {
        id: Date.now().toString(),
        itemId,
        productName,
        quantityUsed,
        quantityUnit,
        usedAt: new Date(),
      };
      const newHistory = [...state.usageHistory, newEntry];
      persistData(state.items, newHistory);
      return { usageHistory: newHistory };
    }),

  getExpiryStatus: (date: Date) => {
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return { color: '#991B1B', daysUntilExpiry, status: 'expired' };
    } else if (daysUntilExpiry <= 3) {
      return { color: '#EF4444', daysUntilExpiry, status: 'critical' };
    } else if (daysUntilExpiry <= 7) {
      return { color: '#F59E0B', daysUntilExpiry, status: 'warning' };
    } else if (daysUntilExpiry <= 14) {
      return { color: '#EAB308', daysUntilExpiry, status: 'caution' };
    } else {
      return { color: '#10B981', daysUntilExpiry, status: 'fresh' };
    }
  },
}));
