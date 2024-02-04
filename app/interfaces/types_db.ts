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
          categoryid: string | null
          createdat: string
          description: string | null
          id: string
          instructions: string | null
          name: string | null
          seed: string | null
          src: string
          updatedat: string
          userid: string
          username: string
        }
        Insert: {
          categoryid?: string | null
          createdat?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string | null
          seed?: string | null
          src: string
          updatedat?: string
          userid: string
          username: string
        }
        Update: {
          categoryid?: string | null
          createdat?: string
          description?: string | null
          id?: string
          instructions?: string | null
          name?: string | null
          seed?: string | null
          src?: string
          updatedat?: string
          userid?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_categoryid_fkey"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_category"
            columns: ["categoryid"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          }
        ]
      }
      message: {
        Row: {
          companionid: string | null
          content: string
          createdat: string
          id: string
          role: Database["public"]["Enums"]["role"]
          updatedat: string
          userid: string
        }
        Insert: {
          companionid?: string | null
          content: string
          createdat?: string
          id?: string
          role: Database["public"]["Enums"]["role"]
          updatedat?: string
          userid: string
        }
        Update: {
          companionid?: string | null
          content?: string
          createdat?: string
          id?: string
          role?: Database["public"]["Enums"]["role"]
          updatedat?: string
          userid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_companion"
            columns: ["companionid"]
            isOneToOne: false
            referencedRelation: "companion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_companionid_fkey"
            columns: ["companionid"]
            isOneToOne: false
            referencedRelation: "companion"
            referencedColumns: ["id"]
          }
        ]
      }
      usersubscription: {
        Row: {
          id: string
          stripecurrentperiodend: string | null
          stripecustomerid: string | null
          stripepriceid: string | null
          stripesubscriptionid: string | null
          userid: string
        }
        Insert: {
          id?: string
          stripecurrentperiodend?: string | null
          stripecustomerid?: string | null
          stripepriceid?: string | null
          stripesubscriptionid?: string | null
          userid: string
        }
        Update: {
          id?: string
          stripecurrentperiodend?: string | null
          stripecustomerid?: string | null
          stripepriceid?: string | null
          stripesubscriptionid?: string | null
          userid?: string
        }
        Relationships: []
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
