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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          member_id: string | null
          new_value: Json | null
          old_value: Json | null
          staff_id: string | null
        }
        Insert: {
          activity: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          member_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          staff_id?: string | null
        }
        Update: {
          activity?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          member_id?: string | null
          new_value?: Json | null
          old_value?: Json | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          message: string
          publish_date: string | null
          status: Database["public"]["Enums"]["announcement_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          message: string
          publish_date?: string | null
          status?: Database["public"]["Enums"]["announcement_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          message?: string
          publish_date?: string | null
          status?: Database["public"]["Enums"]["announcement_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      class_categories: {
        Row: {
          class_count: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          class_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          class_count?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      classes: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          id: string
          level: Database["public"]["Enums"]["class_level"] | null
          name: string
          status: string | null
          type: Database["public"]["Enums"]["class_type"] | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          level?: Database["public"]["Enums"]["class_level"] | null
          name: string
          status?: string | null
          type?: Database["public"]["Enums"]["class_type"] | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          id?: string
          level?: Database["public"]["Enums"]["class_level"] | null
          name?: string
          status?: string | null
          type?: Database["public"]["Enums"]["class_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "class_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_attended: string | null
          last_contacted: string | null
          last_name: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          times_contacted: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_attended?: string | null
          last_contacted?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          times_contacted?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_attended?: string | null
          last_contacted?: string | null
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          times_contacted?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          categories: string[] | null
          contact_number: string | null
          created_at: string | null
          id: string
          location_id: string
          name: string
          status: Database["public"]["Enums"]["location_status"] | null
          updated_at: string | null
        }
        Insert: {
          categories?: string[] | null
          contact_number?: string | null
          created_at?: string | null
          id?: string
          location_id: string
          name: string
          status?: Database["public"]["Enums"]["location_status"] | null
          updated_at?: string | null
        }
        Update: {
          categories?: string[] | null
          contact_number?: string | null
          created_at?: string | null
          id?: string
          location_id?: string
          name?: string
          status?: Database["public"]["Enums"]["location_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      member_attendance: {
        Row: {
          check_in_time: string | null
          check_in_type: string | null
          created_at: string | null
          id: string
          location_id: string | null
          member_id: string
          member_package_id: string | null
          schedule_id: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_in_type?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          member_id: string
          member_package_id?: string | null
          schedule_id?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_in_type?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          member_id?: string
          member_package_id?: string | null
          schedule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_attendance_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_attendance_member_package_id_fkey"
            columns: ["member_package_id"]
            isOneToOne: false
            referencedRelation: "member_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_attendance_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      member_billing: {
        Row: {
          amount: number
          billing_date: string | null
          created_at: string | null
          description: string | null
          id: string
          member_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          billing_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          billing_date?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          member_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_billing_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_billing_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      member_contracts: {
        Row: {
          contract_type: string | null
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          is_signed: boolean | null
          member_id: string
          signed_date: string | null
        }
        Insert: {
          contract_type?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_signed?: boolean | null
          member_id: string
          signed_date?: string | null
        }
        Update: {
          contract_type?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_signed?: boolean | null
          member_id?: string
          signed_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_contracts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_injuries: {
        Row: {
          created_at: string | null
          id: string
          injury_date: string | null
          injury_description: string
          is_active: boolean | null
          member_id: string
          notes: string | null
          recovery_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          injury_date?: string | null
          injury_description: string
          is_active?: boolean | null
          member_id: string
          notes?: string | null
          recovery_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          injury_date?: string | null
          injury_description?: string
          is_active?: boolean | null
          member_id?: string
          notes?: string | null
          recovery_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_injuries_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          member_id: string
          note: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          member_id: string
          note: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          member_id?: string
          note?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      member_packages: {
        Row: {
          activation_date: string | null
          created_at: string | null
          expiry_date: string | null
          id: string
          member_id: string
          package_id: string
          purchase_date: string | null
          sessions_remaining: number | null
          sessions_used: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          activation_date?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          member_id: string
          package_id: string
          purchase_date?: string | null
          sessions_remaining?: number | null
          sessions_used?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          activation_date?: string | null
          created_at?: string | null
          expiry_date?: string | null
          id?: string
          member_id?: string
          package_id?: string
          purchase_date?: string | null
          sessions_remaining?: number | null
          sessions_used?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_packages_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      member_suspensions: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          member_id: string
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          member_id: string
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          member_id?: string
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_suspensions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          is_new: boolean | null
          last_name: string
          member_id: string
          member_since: string | null
          most_attended_category: string | null
          nickname: string | null
          notes: string | null
          phone: string | null
          register_location_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          status: Database["public"]["Enums"]["member_status"] | null
          tax_id: string | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_new?: boolean | null
          last_name: string
          member_id: string
          member_since?: string | null
          most_attended_category?: string | null
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          register_location_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          tax_id?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          is_new?: boolean | null
          last_name?: string
          member_id?: string
          member_since?: string | null
          most_attended_category?: string | null
          nickname?: string | null
          notes?: string | null
          phone?: string | null
          register_location_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["member_status"] | null
          tax_id?: string | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_register_location_id_fkey"
            columns: ["register_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          access_days: Json | null
          all_categories: boolean | null
          any_day_any_time: boolean | null
          categories: string[] | null
          created_at: string | null
          description_en: string | null
          description_th: string | null
          expiration_days: number
          id: string
          infinite_purchase_limit: boolean | null
          infinite_quantity: boolean | null
          is_popular: boolean | null
          name_en: string
          name_th: string | null
          price: number
          quantity: number | null
          recurring_payment: boolean | null
          sessions: number | null
          status: Database["public"]["Enums"]["package_status"] | null
          term_days: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at: string | null
          usage_type: Database["public"]["Enums"]["usage_type"] | null
          user_purchase_limit: number | null
        }
        Insert: {
          access_days?: Json | null
          all_categories?: boolean | null
          any_day_any_time?: boolean | null
          categories?: string[] | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          expiration_days: number
          id?: string
          infinite_purchase_limit?: boolean | null
          infinite_quantity?: boolean | null
          is_popular?: boolean | null
          name_en: string
          name_th?: string | null
          price: number
          quantity?: number | null
          recurring_payment?: boolean | null
          sessions?: number | null
          status?: Database["public"]["Enums"]["package_status"] | null
          term_days: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at?: string | null
          usage_type?: Database["public"]["Enums"]["usage_type"] | null
          user_purchase_limit?: number | null
        }
        Update: {
          access_days?: Json | null
          all_categories?: boolean | null
          any_day_any_time?: boolean | null
          categories?: string[] | null
          created_at?: string | null
          description_en?: string | null
          description_th?: string | null
          expiration_days?: number
          id?: string
          infinite_purchase_limit?: boolean | null
          infinite_quantity?: boolean | null
          is_popular?: boolean | null
          name_en?: string
          name_th?: string | null
          price?: number
          quantity?: number | null
          recurring_payment?: boolean | null
          sessions?: number | null
          status?: Database["public"]["Enums"]["package_status"] | null
          term_days?: number
          type?: Database["public"]["Enums"]["package_type"]
          updated_at?: string | null
          usage_type?: Database["public"]["Enums"]["usage_type"] | null
          user_purchase_limit?: number | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          applicable_packages: string[] | null
          created_at: string | null
          discount_type: string | null
          discount_value: number
          end_date: string | null
          id: string
          name: string
          promo_code: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["promotion_status"] | null
          type: Database["public"]["Enums"]["promotion_type"] | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          applicable_packages?: string[] | null
          created_at?: string | null
          discount_type?: string | null
          discount_value: number
          end_date?: string | null
          id?: string
          name: string
          promo_code?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["promotion_status"] | null
          type?: Database["public"]["Enums"]["promotion_type"] | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          applicable_packages?: string[] | null
          created_at?: string | null
          discount_type?: string | null
          discount_value?: number
          end_date?: string | null
          id?: string
          name?: string
          promo_code?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["promotion_status"] | null
          type?: Database["public"]["Enums"]["promotion_type"] | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      roles: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          access_level: Database["public"]["Enums"]["access_level"]
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"]
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rooms: {
        Row: {
          categories: string[] | null
          created_at: string | null
          id: string
          layout_type: Database["public"]["Enums"]["room_layout_type"] | null
          location_id: string | null
          max_capacity: number | null
          name: string
          name_th: string | null
          status: Database["public"]["Enums"]["room_status"] | null
          updated_at: string | null
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          id?: string
          layout_type?: Database["public"]["Enums"]["room_layout_type"] | null
          location_id?: string | null
          max_capacity?: number | null
          name: string
          name_th?: string | null
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          id?: string
          layout_type?: Database["public"]["Enums"]["room_layout_type"] | null
          location_id?: string | null
          max_capacity?: number | null
          name?: string
          name_th?: string | null
          status?: Database["public"]["Enums"]["room_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule: {
        Row: {
          capacity: number | null
          checked_in: number | null
          class_id: string
          created_at: string | null
          end_time: string
          id: string
          location_id: string | null
          qr_code: string | null
          room_id: string | null
          scheduled_date: string
          start_time: string
          status: Database["public"]["Enums"]["schedule_status"] | null
          trainer_id: string | null
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          checked_in?: number | null
          class_id: string
          created_at?: string | null
          end_time: string
          id?: string
          location_id?: string | null
          qr_code?: string | null
          room_id?: string | null
          scheduled_date: string
          start_time: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          checked_in?: number | null
          class_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          location_id?: string | null
          qr_code?: string | null
          room_id?: string | null
          scheduled_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["schedule_status"] | null
          trainer_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          section: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          section: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          section?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          location_id: string | null
          nickname: string | null
          phone: string | null
          role_id: string | null
          status: Database["public"]["Enums"]["staff_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          location_id?: string | null
          nickname?: string | null
          phone?: string | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          location_id?: string | null
          nickname?: string | null
          phone?: string | null
          role_id?: string | null
          status?: Database["public"]["Enums"]["staff_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          location_id: string | null
          member_id: string | null
          notes: string | null
          order_name: string
          package_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          staff_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          tax_invoice_url: string | null
          transaction_id: string
          transfer_slip_url: string | null
          type: Database["public"]["Enums"]["package_type"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          location_id?: string | null
          member_id?: string | null
          notes?: string | null
          order_name: string
          package_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tax_invoice_url?: string | null
          transaction_id: string
          transfer_slip_url?: string | null
          type?: Database["public"]["Enums"]["package_type"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          location_id?: string | null
          member_id?: string | null
          notes?: string | null
          order_name?: string
          package_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tax_invoice_url?: string | null
          transaction_id?: string
          transfer_slip_url?: string | null
          type?: Database["public"]["Enums"]["package_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_minimize: boolean | null
          name: string
          track_metric: string | null
          training_category: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_minimize?: boolean | null
          name: string
          track_metric?: string | null
          training_category?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_minimize?: boolean | null
          name?: string
          track_metric?: string | null
          training_category?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_access_level: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["access_level"]
      }
      has_min_access_level: {
        Args: {
          _min_level: Database["public"]["Enums"]["access_level"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      access_level:
        | "level_1_minimum"
        | "level_2_operator"
        | "level_3_manager"
        | "level_4_master"
      announcement_status: "active" | "scheduled" | "completed"
      app_role: "owner" | "admin" | "trainer" | "front_desk"
      class_level: "all_levels" | "beginner" | "intermediate" | "advanced"
      class_type: "class" | "pt"
      gender: "male" | "female" | "other"
      lead_status:
        | "new"
        | "contacted"
        | "interested"
        | "not_interested"
        | "converted"
      location_status: "open" | "closed"
      member_status: "active" | "suspended" | "on_hold" | "inactive"
      notification_type:
        | "booking_confirmed"
        | "class_cancellation"
        | "payment_received"
        | "member_registration"
        | "package_expiring"
      package_status: "on_sale" | "scheduled" | "drafts" | "archive"
      package_type: "unlimited" | "session" | "pt"
      payment_method: "credit_card" | "bank_transfer" | "qr_promptpay"
      promotion_status: "active" | "scheduled" | "drafts" | "archive"
      promotion_type: "discount" | "promo_code"
      risk_level: "high" | "medium" | "low"
      room_layout_type: "open" | "fixed"
      room_status: "open" | "closed"
      schedule_status: "scheduled" | "cancelled" | "completed"
      staff_status: "active" | "pending" | "terminated"
      transaction_status: "paid" | "pending" | "voided" | "needs_review"
      usage_type: "class_only" | "gym_checkin_only" | "both"
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
      access_level: [
        "level_1_minimum",
        "level_2_operator",
        "level_3_manager",
        "level_4_master",
      ],
      announcement_status: ["active", "scheduled", "completed"],
      app_role: ["owner", "admin", "trainer", "front_desk"],
      class_level: ["all_levels", "beginner", "intermediate", "advanced"],
      class_type: ["class", "pt"],
      gender: ["male", "female", "other"],
      lead_status: [
        "new",
        "contacted",
        "interested",
        "not_interested",
        "converted",
      ],
      location_status: ["open", "closed"],
      member_status: ["active", "suspended", "on_hold", "inactive"],
      notification_type: [
        "booking_confirmed",
        "class_cancellation",
        "payment_received",
        "member_registration",
        "package_expiring",
      ],
      package_status: ["on_sale", "scheduled", "drafts", "archive"],
      package_type: ["unlimited", "session", "pt"],
      payment_method: ["credit_card", "bank_transfer", "qr_promptpay"],
      promotion_status: ["active", "scheduled", "drafts", "archive"],
      promotion_type: ["discount", "promo_code"],
      risk_level: ["high", "medium", "low"],
      room_layout_type: ["open", "fixed"],
      room_status: ["open", "closed"],
      schedule_status: ["scheduled", "cancelled", "completed"],
      staff_status: ["active", "pending", "terminated"],
      transaction_status: ["paid", "pending", "voided", "needs_review"],
      usage_type: ["class_only", "gym_checkin_only", "both"],
    },
  },
} as const
