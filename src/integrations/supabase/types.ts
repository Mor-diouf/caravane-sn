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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json
        }
        Relationships: []
      }
      bookings: {
        Row: {
          amount_fcfa: number
          caravan_id: string
          created_at: string
          id: string
          payer_phone: string | null
          passenger_name: string | null
          reference: string
          seats: number
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_fcfa?: number
          caravan_id: string
          created_at?: string
          id?: string
          payer_phone?: string | null
          passenger_name?: string | null
          reference: string
          seats?: number
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          caravan_id?: string
          created_at?: string
          id?: string
          payer_phone?: string | null
          passenger_name?: string | null
          reference?: string
          seats?: number
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
        ]
      }
      caravans: {
        Row: {
          about: string | null
          amenities: string[]
          created_at: string
          departure_at: string
          dropoff: string
          from_label: string
          id: string
          image_url: string | null
          is_hidden: boolean
          organizer_id: string
          payment_link: string | null
          pickup: string
          price_fcfa: number
          seats_left: number
          status: Database["public"]["Enums"]["caravan_status"]
          to_label: string
          total_seats: number
          university_id: string | null
          updated_at: string
        }
        Insert: {
          about?: string | null
          amenities?: string[]
          created_at?: string
          departure_at: string
          dropoff: string
          from_label: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          organizer_id: string
          payment_link?: string | null
          pickup: string
          price_fcfa: number
          seats_left: number
          status?: Database["public"]["Enums"]["caravan_status"]
          to_label: string
          total_seats: number
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          about?: string | null
          amenities?: string[]
          created_at?: string
          departure_at?: string
          dropoff?: string
          from_label?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          organizer_id?: string
          payment_link?: string | null
          pickup?: string
          price_fcfa?: number
          seats_left?: number
          status?: Database["public"]["Enums"]["caravan_status"]
          to_label?: string
          total_seats?: number
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caravans_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caravans_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          amount_refunded_fcfa: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          opened_by: string
          organizer_id: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          subject: string
        }
        Insert: {
          amount_refunded_fcfa?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_by: string
          organizer_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          subject: string
        }
        Update: {
          amount_refunded_fcfa?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          opened_by?: string
          organizer_id?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          caravan_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          caravan_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          caravan_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_members: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          role: Database["public"]["Enums"]["team_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          role?: Database["public"]["Enums"]["team_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_members_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          commission_rate: number
          created_at: string
          description: string | null
          documents: Json
          id: string
          is_pro: boolean
          name: string
          owner_id: string | null
          phone: string | null
          rating: number
          status: Database["public"]["Enums"]["organizer_status"]
          university_id: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          whatsapp: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          description?: string | null
          documents?: Json
          id?: string
          is_pro?: boolean
          name: string
          owner_id?: string | null
          phone?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["organizer_status"]
          university_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          whatsapp?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          description?: string | null
          documents?: Json
          id?: string
          is_pro?: boolean
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number
          status?: Database["public"]["Enums"]["organizer_status"]
          university_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizers_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_fcfa: number
          booking_id: string
          commission_fcfa: number
          created_at: string
          external_ref: string | null
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount_fcfa: number
          booking_id: string
          commission_fcfa?: number
          created_at?: string
          external_ref?: string | null
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount_fcfa?: number
          booking_id?: string
          commission_fcfa?: number
          created_at?: string
          external_ref?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_fcfa: number
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          organizer_id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_status"]
        }
        Insert: {
          amount_fcfa: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          organizer_id: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Update: {
          amount_fcfa?: number
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          organizer_id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payouts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          auto_approve_organizers: boolean
          commission_rate: number
          free_enabled: boolean
          id: boolean
          min_payout_fcfa: number
          orange_enabled: boolean
          support_phone: string
          updated_at: string
          wave_enabled: boolean
        }
        Insert: {
          auto_approve_organizers?: boolean
          commission_rate?: number
          free_enabled?: boolean
          id?: boolean
          min_payout_fcfa?: number
          orange_enabled?: boolean
          support_phone?: string
          updated_at?: string
          wave_enabled?: boolean
        }
        Update: {
          auto_approve_organizers?: boolean
          commission_rate?: number
          free_enabled?: boolean
          id?: boolean
          min_payout_fcfa?: number
          orange_enabled?: boolean
          support_phone?: string
          updated_at?: string
          wave_enabled?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_blocked: boolean
          notify_departures: boolean
          notify_promos: boolean
          notify_whatsapp: boolean
          phone: string | null
          preferred_payment: Database["public"]["Enums"]["payment_method"]
          student_id: string | null
          university_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_blocked?: boolean
          notify_departures?: boolean
          notify_promos?: boolean
          notify_whatsapp?: boolean
          phone?: string | null
          preferred_payment?: Database["public"]["Enums"]["payment_method"]
          student_id?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_blocked?: boolean
          notify_departures?: boolean
          notify_promos?: boolean
          notify_whatsapp?: boolean
          phone?: string | null
          preferred_payment?: Database["public"]["Enums"]["payment_method"]
          student_id?: string | null
          university_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          caravan_id: string | null
          comment: string | null
          created_at: string
          id: string
          organizer_id: string
          rating: number
          reported_reason: string | null
          status: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Insert: {
          caravan_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          organizer_id: string
          rating: number
          reported_reason?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id: string
        }
        Update: {
          caravan_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          organizer_id?: string
          rating?: number
          reported_reason?: string | null
          status?: Database["public"]["Enums"]["review_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_caravan_id_fkey"
            columns: ["caravan_id"]
            isOneToOne: false
            referencedRelation: "caravans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          booking_id: string
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          id: string
          qr_code: string
          status: Database["public"]["Enums"]["ticket_status"]
        }
        Insert: {
          booking_id: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          qr_code: string
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Update: {
          booking_id?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          id?: string
          qr_code?: string
          status?: Database["public"]["Enums"]["ticket_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          abbr: string
          city: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbr: string
          city: string
          created_at?: string
          id: string
          name: string
        }
        Update: {
          abbr?: string
          city?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_booking: {
        Args: { _booking_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_booking: {
        Args: { _caravan_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organizer_member: {
        Args: { _organizer_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "organizer" | "admin"
      booking_status: "pending" | "confirmed" | "cancelled" | "refunded"
      caravan_status: "draft" | "pending" | "published" | "full" | "completed" | "cancelled"
      dispute_status: "open" | "investigating" | "resolved" | "rejected"
      organizer_status: "pending" | "approved" | "suspended" | "rejected"
      payment_method: "wave" | "orange" | "free"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payout_status: "requested" | "approved" | "paid" | "rejected"
      review_status: "published" | "reported" | "hidden"
      team_role: "manager" | "finance" | "scanner" | "support"
      ticket_status: "valid" | "used" | "void"
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
    Enums: {
      app_role: ["student", "organizer", "admin"],
      booking_status: ["pending", "confirmed", "cancelled", "refunded"],
      caravan_status: ["draft", "pending", "published", "full", "completed", "cancelled"],
      dispute_status: ["open", "investigating", "resolved", "rejected"],
      organizer_status: ["pending", "approved", "suspended", "rejected"],
      payment_method: ["wave", "orange", "free"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_status: ["requested", "approved", "paid", "rejected"],
      review_status: ["published", "reported", "hidden"],
      team_role: ["manager", "finance", "scanner", "support"],
      ticket_status: ["valid", "used", "void"],
    },
  },
} as const
