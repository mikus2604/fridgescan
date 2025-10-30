export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'viewer'
          joined_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'viewer'
          joined_at?: string
        }
      }
      household_invites: {
        Row: {
          id: string
          household_id: string
          invite_code: string
          created_by: string
          expires_at: string
          max_uses: number
          used_count: number
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          invite_code: string
          created_by: string
          expires_at: string
          max_uses?: number
          used_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          invite_code?: string
          created_by?: string
          expires_at?: string
          max_uses?: number
          used_count?: number
          created_at?: string
        }
      }
      storage_locations: {
        Row: {
          id: string
          household_id: string
          name: string
          icon: string | null
          color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          icon?: string | null
          color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          name?: string
          icon?: string | null
          color?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          barcode: string
          name: string
          brand: string | null
          category: string | null
          image_url: string | null
          cached_at: string
          ttl_days: number
        }
        Insert: {
          id?: string
          barcode: string
          name: string
          brand?: string | null
          category?: string | null
          image_url?: string | null
          cached_at?: string
          ttl_days?: number
        }
        Update: {
          id?: string
          barcode?: string
          name?: string
          brand?: string | null
          category?: string | null
          image_url?: string | null
          cached_at?: string
          ttl_days?: number
        }
      }
      inventory_items: {
        Row: {
          id: string
          household_id: string
          storage_location_id: string | null
          product_id: string | null
          name: string
          quantity_current: number
          quantity_unit: string
          expiry_date: string | null
          purchase_date: string | null
          notes: string | null
          photo_url: string | null
          added_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          storage_location_id?: string | null
          product_id?: string | null
          name: string
          quantity_current: number
          quantity_unit: string
          expiry_date?: string | null
          purchase_date?: string | null
          notes?: string | null
          photo_url?: string | null
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          storage_location_id?: string | null
          product_id?: string | null
          name?: string
          quantity_current?: number
          quantity_unit?: string
          expiry_date?: string | null
          purchase_date?: string | null
          notes?: string | null
          photo_url?: string | null
          added_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_history: {
        Row: {
          id: string
          inventory_item_id: string
          user_id: string | null
          quantity_used: number
          quantity_remaining: number
          action_type: 'used' | 'added' | 'removed'
          created_at: string
        }
        Insert: {
          id?: string
          inventory_item_id: string
          user_id?: string | null
          quantity_used: number
          quantity_remaining: number
          action_type: 'used' | 'added' | 'removed'
          created_at?: string
        }
        Update: {
          id?: string
          inventory_item_id?: string
          user_id?: string | null
          quantity_used?: number
          quantity_remaining?: number
          action_type?: 'used' | 'added' | 'removed'
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
