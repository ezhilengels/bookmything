// ============================================================
// BookMyThing – Supabase Database Type Stubs
// Run `supabase gen types typescript` to auto-generate the real version
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string;
          slug: string;
          name: string;
          logo_url: string | null;
          description: string | null;
          timezone: string;
          contact_email: string;
          contact_phone: string | null;
          address: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          logo_url?: string | null;
          description?: string | null;
          timezone?: string;
          contact_email: string;
          contact_phone?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          logo_url?: string | null;
          description?: string | null;
          timezone?: string;
          contact_email?: string;
          contact_phone?: string | null;
          address?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          business_id: string | null;
          role: "super_admin" | "business_admin" | "staff" | "customer";
          name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_id?: string | null;
          role?: "super_admin" | "business_admin" | "staff" | "customer";
          name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string | null;
          role?: "super_admin" | "business_admin" | "staff" | "customer";
          name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          name: string;
          description?: string | null;
          duration_minutes: number;
          price: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          name?: string;
          description?: string | null;
          duration_minutes?: number;
          price?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      working_hours: {
        Row: {
          id: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_start: string | null;
          break_end: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          staff_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          break_start?: string | null;
          break_end?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          staff_id?: string;
          day_of_week?: number;
          start_time?: string;
          end_time?: string;
          break_start?: string | null;
          break_end?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "working_hours_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_leaves: {
        Row: {
          id: string;
          staff_id: string;
          date: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          date: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          date?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_leaves_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          business_id: string;
          service_id: string;
          staff_id: string;
          customer_id: string;
          start_time: string;
          end_time: string;
          status: "new" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes: string | null;
          payment_status: "pending" | "paid" | "failed" | "refunded";
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          cancelled_by: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_id: string;
          service_id: string;
          staff_id: string;
          customer_id: string;
          start_time: string;
          end_time: string;
          status?: "new" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_id?: string;
          service_id?: string;
          staff_id?: string;
          customer_id?: string;
          start_time?: string;
          end_time?: string;
          status?: "new" | "confirmed" | "completed" | "cancelled" | "no_show";
          notes?: string | null;
          payment_status?: "pending" | "paid" | "failed" | "refunded";
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          cancelled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_cancelled_by_fkey";
            columns: ["cancelled_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_logs: {
        Row: {
          id: string;
          booking_id: string;
          actor_id: string | null;
          old_status: string | null;
          new_status: string;
          notes: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          actor_id?: string | null;
          old_status?: string | null;
          new_status: string;
          notes?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          actor_id?: string | null;
          old_status?: string | null;
          new_status?: string;
          notes?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_logs_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "booking_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          booking_id: string;
          type: "confirmation" | "reminder_24h" | "reminder_1h" | "cancellation" | "new_booking";
          channel: "email" | "whatsapp";
          status: "sent" | "failed" | "pending";
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          type: "confirmation" | "reminder_24h" | "reminder_1h" | "cancellation" | "new_booking";
          channel?: "email" | "whatsapp";
          status?: "sent" | "failed" | "pending";
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          type?: "confirmation" | "reminder_24h" | "reminder_1h" | "cancellation" | "new_booking";
          channel?: "email" | "whatsapp";
          status?: "sent" | "failed" | "pending";
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_services: {
        Row: { staff_id: string; service_id: string };
        Insert: { staff_id: string; service_id: string };
        Update: Partial<{ staff_id: string; service_id: string }>;
        Relationships: [
          {
            foreignKeyName: "staff_services_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "staff_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<string, never>;
        Returns: "super_admin" | "business_admin" | "staff" | "customer";
      };
      get_my_business_id: { Args: Record<string, never>; Returns: string | null };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: "super_admin" | "business_admin" | "staff" | "customer";
      booking_status: "new" | "confirmed" | "completed" | "cancelled" | "no_show";
      payment_status: "pending" | "paid" | "failed" | "refunded";
    };
    CompositeTypes: Record<string, never>;
  };
};
