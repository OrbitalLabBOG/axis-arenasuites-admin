export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      apartments: {
        Row: {
          capacity: number
          created_at: string | null
          floor: number
          id: string
          is_active: boolean | null
          notes: string | null
          number: string
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          floor: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          number: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          floor?: number
          id?: string
          is_active?: boolean | null
          notes?: string | null
          number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          apartment_id: string
          booking_reference: string | null
          breakfast_quantity: number | null
          channel_id: string
          check_in_completed_at: string | null
          check_in_date: string
          check_out_completed_at: string | null
          check_out_date: string
          created_at: string | null
          digital_signature_url: string | null
          guest_id: string
          id: string
          includes_breakfast: boolean | null
          number_of_guests: number | null
          observations: string | null
          price_per_night: number
          status: string
          token: string | null
          updated_at: string | null
        }
        Insert: {
          apartment_id: string
          booking_reference?: string | null
          breakfast_quantity?: number | null
          channel_id: string
          check_in_completed_at?: string | null
          check_in_date: string
          check_out_completed_at?: string | null
          check_out_date: string
          created_at?: string | null
          digital_signature_url?: string | null
          guest_id: string
          id?: string
          includes_breakfast?: boolean | null
          number_of_guests?: number | null
          observations?: string | null
          price_per_night: number
          status?: string
          token?: string | null
          updated_at?: string | null
        }
        Update: {
          apartment_id?: string
          booking_reference?: string | null
          breakfast_quantity?: number | null
          channel_id?: string
          check_in_completed_at?: string | null
          check_in_date?: string
          check_out_completed_at?: string | null
          check_out_date?: string
          created_at?: string | null
          digital_signature_url?: string | null
          guest_id?: string
          id?: string
          includes_breakfast?: boolean | null
          number_of_guests?: number | null
          observations?: string | null
          price_per_night?: number
          status?: string
          token?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          code: string
          commission_rate: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      guests: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string | null
          document_number: string
          document_type: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          id: string
          nationality: string | null
          notes: string | null
          phone: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country: string
          created_at?: string | null
          document_number: string
          document_type: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          id?: string
          nationality?: string | null
          notes?: string | null
          phone: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string | null
          document_number?: string
          document_type?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          id?: string
          nationality?: string | null
          notes?: string | null
          phone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_data: {
        Row: {
          address: string | null
          booking_id: string
          business_name: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          invoice_type: string
          phone: string | null
          state_province: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          booking_id: string
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          invoice_type: string
          phone?: string | null
          state_province?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          booking_id?: string
          business_name?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          invoice_type?: string
          phone?: string | null
          state_province?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_data_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "booking_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_data_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "booking_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_summary: {
        Row: {
          apartment_number: string | null
          balance_due: number | null
          booking_reference: string | null
          channel_name: string | null
          check_in_completed_at: string | null
          check_in_date: string | null
          check_out_completed_at: string | null
          check_out_date: string | null
          created_at: string | null
          document_number: string | null
          email: string | null
          floor: number | null
          guest_name: string | null
          id: string | null
          phone: string | null
          price_per_night: number | null
          status: string | null
          tax_amount: number | null
          taxable_amount: number | null
          total_amount: number | null
          total_nights: number | null
          total_paid: number | null
        }
        Relationships: []
      }
      monthly_kpis: {
        Row: {
          adr: number | null
          channel_name: string | null
          month: string | null
          occupancy_rate: number | null
          revenue_without_tax: number | null
          total_bookings: number | null
          total_nights_sold: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
