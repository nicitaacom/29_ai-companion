export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      category: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      companion: {
        Row: {
          category_id: string
          created_at: string
          description: string
          id: string
          instructions: string
          name: string
          seed: string
          src: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description: string
          id?: string
          instructions: string
          name: string
          seed: string
          src: string
          updated_at?: string
          user_id?: string
          username: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string
          id?: string
          instructions?: string
          name?: string
          seed?: string
          src?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_companion_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          companion_id: string
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          companion_id: string
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          companion_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscription: {
        Row: {
          id: string
          stripe_current_period_end: string | null
          stripe_customerid: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          stripe_current_period_end?: string | null
          stripe_customerid?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          stripe_current_period_end?: string | null
          stripe_customerid?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          providers: string[]
          role: string[]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          providers?: string[]
          role?: string[]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          providers?: string[]
          role?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      role: "user" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
