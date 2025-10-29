import { create } from 'zustand';

export interface InventoryItem {
  id: string;
  productName: string;
  brand?: string;
  quantity: number;
  quantityUnit: string;
  bestBeforeDate: Date;
  purchaseDate: Date;
  storageLocation: string;
  photoUrl?: string;
  barcode?: string;
  category?: string;
}

interface InventoryStore {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  getExpiryStatus: (date: Date) => {
    color: string;
    daysUntilExpiry: number;
    status: 'expired' | 'critical' | 'warning' | 'caution' | 'fresh';
  };
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [
    // Mock data for development
    {
      id: '1',
      productName: 'Milk',
      brand: 'Organic Valley',
      quantity: 1,
      quantityUnit: 'L',
      bestBeforeDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      storageLocation: 'Fridge',
      category: 'Dairy',
    },
    {
      id: '2',
      productName: 'Chicken Breast',
      brand: 'Fresh Farms',
      quantity: 500,
      quantityUnit: 'g',
      bestBeforeDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      purchaseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      storageLocation: 'Fridge',
      category: 'Meat',
    },
    {
      id: '3',
      productName: 'Yogurt',
      brand: 'Chobani',
      quantity: 4,
      quantityUnit: 'count',
      bestBeforeDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      purchaseDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      storageLocation: 'Fridge',
      category: 'Dairy',
    },
    {
      id: '4',
      productName: 'Pasta',
      brand: 'Barilla',
      quantity: 500,
      quantityUnit: 'g',
      bestBeforeDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      storageLocation: 'Pantry',
      category: 'Grains',
    },
    {
      id: '5',
      productName: 'Strawberries',
      brand: 'Local Farm',
      quantity: 250,
      quantityUnit: 'g',
      bestBeforeDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
      purchaseDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      storageLocation: 'Fridge',
      category: 'Fruits',
    },
  ],

  addItem: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          id: Date.now().toString(),
        },
      ],
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

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
