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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: string
          reason: string
          result: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          reason: string
          result: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          reason?: string
          result?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      expense_shares: {
        Row: {
          amount: number
          expense_id: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_shares_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string
          created_by: string
          currency: string
          deleted_at: string | null
          description: string
          expense_date: string
          id: string
          idempotency_key: string
          paid_by: string
          plan_id: string
          split_type: Database["public"]["Enums"]["split_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by: string
          currency?: string
          deleted_at?: string | null
          description: string
          expense_date?: string
          id?: string
          idempotency_key: string
          paid_by: string
          plan_id: string
          split_type?: Database["public"]["Enums"]["split_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string
          created_by?: string
          currency?: string
          deleted_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          idempotency_key?: string
          paid_by?: string
          plan_id?: string
          split_type?: Database["public"]["Enums"]["split_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_places: {
        Row: {
          created_at: string
          id: string
          note: string | null
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_places_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_redemptions: {
        Row: {
          id: string
          invitation_id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          id?: string
          invitation_id: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          id?: string
          invitation_id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_redemptions_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitation_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          max_uses: number
          plan_id: string
          revoked_at: string | null
          role_granted: Database["public"]["Enums"]["member_role"]
          token_hash: string
          use_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          max_uses?: number
          plan_id: string
          revoked_at?: string | null
          role_granted?: Database["public"]["Enums"]["member_role"]
          token_hash: string
          use_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          max_uses?: number
          plan_id?: string
          revoked_at?: string | null
          role_granted?: Database["public"]["Enums"]["member_role"]
          token_hash?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: Database["public"]["Enums"]["place_category"]
          created_at: string
          created_by: string
          id: string
          name: string
          price_level: number | null
          provider: string
          provider_place_id: string | null
          url: string | null
        }
        Insert: {
          address?: string | null
          category?: Database["public"]["Enums"]["place_category"]
          created_at?: string
          created_by: string
          id?: string
          name: string
          price_level?: number | null
          provider?: string
          provider_place_id?: string | null
          url?: string | null
        }
        Update: {
          address?: string | null
          category?: Database["public"]["Enums"]["place_category"]
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          price_level?: number | null
          provider?: string
          provider_place_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_limits: {
        Row: {
          features: Json
          max_active_owned_plans: number | null
          max_members_per_plan: number | null
          tier: string
          updated_at: string
        }
        Insert: {
          features?: Json
          max_active_owned_plans?: number | null
          max_members_per_plan?: number | null
          tier: string
          updated_at?: string
        }
        Update: {
          features?: Json
          max_active_owned_plans?: number | null
          max_members_per_plan?: number | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_members: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          plan_id: string
          role: Database["public"]["Enums"]["member_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          plan_id: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          plan_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          status?: Database["public"]["Enums"]["member_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_members_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_places: {
        Row: {
          added_by: string
          created_at: string
          id: string
          note: string | null
          place_id: string
          plan_id: string
          status: Database["public"]["Enums"]["plan_place_status"]
        }
        Insert: {
          added_by: string
          created_at?: string
          id?: string
          note?: string | null
          place_id: string
          plan_id: string
          status?: Database["public"]["Enums"]["plan_place_status"]
        }
        Update: {
          added_by?: string
          created_at?: string
          id?: string
          note?: string | null
          place_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["plan_place_status"]
        }
        Relationships: [
          {
            foreignKeyName: "plan_places_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_places_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          city: string | null
          created_at: string
          currency: string
          end_date: string | null
          estimated_budget: number | null
          id: string
          name: string
          owner_id: string
          premium_sponsored: boolean
          sponsor_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["plan_status"]
          type: Database["public"]["Enums"]["plan_type"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          name: string
          owner_id: string
          premium_sponsored?: boolean
          sponsor_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          end_date?: string | null
          estimated_budget?: number | null
          id?: string
          name?: string
          owner_id?: string
          premium_sponsored?: boolean
          sponsor_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["plan_status"]
          type?: Database["public"]["Enums"]["plan_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          locale: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          locale?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      settlements: {
        Row: {
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          from_user: string
          id: string
          idempotency_key: string
          note: string | null
          plan_id: string
          proposed_by: string
          status: Database["public"]["Enums"]["settlement_status"]
          to_user: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          from_user: string
          id?: string
          idempotency_key: string
          note?: string | null
          plan_id: string
          proposed_by: string
          status?: Database["public"]["Enums"]["settlement_status"]
          to_user: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          from_user?: string
          id?: string
          idempotency_key?: string
          note?: string | null
          plan_id?: string
          proposed_by?: string
          status?: Database["public"]["Enums"]["settlement_status"]
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_grants: {
        Row: {
          authorized_at: string
          end_reason: string | null
          ended_at: string | null
          expires_at: string | null
          id: string
          needs_organizer: boolean
          nonce_hash: string
          organizer_approved_at: string | null
          organizer_approved_by: string | null
          plan_id: string | null
          request_id: string
          revoked_at: string | null
          revoked_by: string | null
          staff_id: string
          start_deadline: string
          started_at: string | null
          target: Database["public"]["Enums"]["support_target"]
          used: boolean
          user_id: string
        }
        Insert: {
          authorized_at?: string
          end_reason?: string | null
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          needs_organizer?: boolean
          nonce_hash: string
          organizer_approved_at?: string | null
          organizer_approved_by?: string | null
          plan_id?: string | null
          request_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          staff_id: string
          start_deadline?: string
          started_at?: string | null
          target: Database["public"]["Enums"]["support_target"]
          used?: boolean
          user_id: string
        }
        Update: {
          authorized_at?: string
          end_reason?: string | null
          ended_at?: string | null
          expires_at?: string | null
          id?: string
          needs_organizer?: boolean
          nonce_hash?: string
          organizer_approved_at?: string | null
          organizer_approved_by?: string | null
          plan_id?: string | null
          request_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          staff_id?: string
          start_deadline?: string
          started_at?: string | null
          target?: Database["public"]["Enums"]["support_target"]
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_grants_organizer_approved_by_fkey"
            columns: ["organizer_approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_grants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_grants_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_grants_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_grants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_notifications: {
        Row: {
          created_at: string
          ends_at: string | null
          grant_id: string
          id: string
          kind: string
          read_at: string | null
          starts_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          grant_id: string
          id?: string
          kind: string
          read_at?: string | null
          starts_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          grant_id?: string
          id?: string
          kind?: string
          read_at?: string | null
          starts_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_notifications_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "support_grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          resolved_at: string | null
          status: string
          topic: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          topic: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          resolved_at?: string | null
          status?: string
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          note: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          revoked_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          note?: string | null
          revoked_at?: string | null
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
      accept_invitation: { Args: { _token: string }; Returns: string }
      add_place_to_plan: {
        Args: {
          _address: string
          _category: Database["public"]["Enums"]["place_category"]
          _name: string
          _note: string
          _plan: string
          _url: string
        }
        Returns: string
      }
      admin_grant_role: {
        Args: {
          _reason: string
          _role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: Json
      }
      admin_list_roles: { Args: { _reason: string }; Returns: Json }
      admin_revoke_role: {
        Args: {
          _reason: string
          _role: Database["public"]["Enums"]["app_role"]
          _user: string
        }
        Returns: Json
      }
      archive_plan: {
        Args: { _archive: boolean; _plan: string }
        Returns: undefined
      }
      assert_support_grant: {
        Args: {
          _grant: string
          _target: Database["public"]["Enums"]["support_target"]
        }
        Returns: string
      }
      create_invitation: { Args: { _plan: string }; Returns: string }
      create_plan: {
        Args: {
          _budget: number
          _city: string
          _end: string
          _name: string
          _start: string
          _type: Database["public"]["Enums"]["plan_type"]
        }
        Returns: string
      }
      delete_expense: { Args: { _expense: string }; Returns: undefined }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_plan_member: { Args: { _plan: string }; Returns: boolean }
      is_support_staff: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _details: Json
          _reason: string
          _result: string
          _target: string
          _target_type: string
        }
        Returns: undefined
      }
      plan_balances: {
        Args: { _plan: string }
        Returns: {
          balance: number
          owed: number
          paid: number
          user_id: string
        }[]
      }
      plan_is_writable: { Args: { _plan: string }; Returns: boolean }
      plan_role: {
        Args: { _plan: string }
        Returns: Database["public"]["Enums"]["member_role"]
      }
      propose_settlement: {
        Args: {
          _amount: number
          _idempotency_key: string
          _plan: string
          _to: string
        }
        Returns: string
      }
      respond_settlement: {
        Args: {
          _id: string
          _status: Database["public"]["Enums"]["settlement_status"]
        }
        Returns: undefined
      }
      revoke_invitation: { Args: { _id: string }; Returns: undefined }
      save_expense: {
        Args: {
          _amount: number
          _category: Database["public"]["Enums"]["expense_category"]
          _date?: string
          _description: string
          _idempotency_key: string
          _paid_by: string
          _plan: string
          _shares: Json
          _split: Database["public"]["Enums"]["split_type"]
        }
        Returns: string
      }
      set_plan_place_status: {
        Args: {
          _plan_place: string
          _status: Database["public"]["Enums"]["plan_place_status"]
        }
        Returns: undefined
      }
      shares_plan_with: { Args: { _other: string }; Returns: boolean }
      support_grant_approve_plan: { Args: { _grant: string }; Returns: Json }
      support_grant_authorize: {
        Args: {
          _plan: string
          _request: string
          _target: Database["public"]["Enums"]["support_target"]
        }
        Returns: Json
      }
      support_grant_revoke: { Args: { _grant: string }; Returns: Json }
      support_portal: {
        Args: {
          _action: string
          _id?: string
          _plan?: string
          _target?: Database["public"]["Enums"]["support_target"]
          _token?: string
          _topic?: string
        }
        Returns: Json
      }
      support_request_accept: { Args: { _request: string }; Returns: Json }
      support_request_create: { Args: { _topic: string }; Returns: Json }
      support_session_end: { Args: { _grant: string }; Returns: Json }
      support_session_start: {
        Args: { _grant: string; _token: string }
        Returns: Json
      }
      support_view_account: { Args: { _grant: string }; Returns: Json }
      support_view_plan: { Args: { _grant: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "support"
      expense_category: "food" | "transport" | "lodging" | "tickets" | "other"
      member_role: "owner" | "admin" | "member"
      member_status: "active" | "left" | "removed"
      place_category:
        | "restaurant"
        | "activity"
        | "lodging"
        | "sight"
        | "transport"
        | "other"
      plan_place_status: "proposed" | "chosen" | "discarded"
      plan_status: "draft" | "active" | "closed"
      plan_type:
        | "dinner"
        | "getaway"
        | "trip"
        | "celebration"
        | "activity"
        | "other"
      settlement_status: "proposed" | "confirmed" | "rejected" | "cancelled"
      split_type: "equal" | "custom"
      support_target: "account" | "plan"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "support"],
      expense_category: ["food", "transport", "lodging", "tickets", "other"],
      member_role: ["owner", "admin", "member"],
      member_status: ["active", "left", "removed"],
      place_category: [
        "restaurant",
        "activity",
        "lodging",
        "sight",
        "transport",
        "other",
      ],
      plan_place_status: ["proposed", "chosen", "discarded"],
      plan_status: ["draft", "active", "closed"],
      plan_type: [
        "dinner",
        "getaway",
        "trip",
        "celebration",
        "activity",
        "other",
      ],
      settlement_status: ["proposed", "confirmed", "rejected", "cancelled"],
      split_type: ["equal", "custom"],
      support_target: ["account", "plan"],
    },
  },
} as const
