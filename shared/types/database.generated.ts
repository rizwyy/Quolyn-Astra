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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          balance_due: number
          created_at: string
          cycle_days: number
          id: string
          last_delivered: string
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          owner_id: string
          phone: string
          place_name: string | null
          price: number
        }
        Insert: {
          address?: string | null
          balance_due?: number
          created_at?: string
          cycle_days?: number
          id?: string
          last_delivered?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          phone: string
          place_name?: string | null
          price?: number
        }
        Update: {
          address?: string | null
          balance_due?: number
          created_at?: string
          cycle_days?: number
          id?: string
          last_delivered?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          phone?: string
          place_name?: string | null
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string
          business_type: string
          created_at: string
          id: string
        }
        Insert: {
          business_name: string
          business_type: string
          created_at?: string
          id: string
        }
        Update: {
          business_name?: string
          business_type?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      quolyn_activity_logs: {
        Row: {
          actor_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          event: string
          id: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          event: string
          id?: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          event?: string
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_activity_logs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_catalogue_imports: {
        Row: {
          created_at: string
          file_path: string
          id: string
          state: string
          summary: Json
          workspace_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          state?: string
          summary?: Json
          workspace_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          state?: string
          summary?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_catalogue_imports_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_customers: {
        Row: {
          address: string
          contact_name: string
          created_at: string
          currency: string
          demo_key: string | null
          discount_bps: number
          email: string
          id: string
          name: string
          notes: string
          payment_terms: string
          phone: string
          tax_reference: string
          workspace_id: string
        }
        Insert: {
          address?: string
          contact_name?: string
          created_at?: string
          currency?: string
          demo_key?: string | null
          discount_bps?: number
          email?: string
          id?: string
          name: string
          notes?: string
          payment_terms?: string
          phone?: string
          tax_reference?: string
          workspace_id: string
        }
        Update: {
          address?: string
          contact_name?: string
          created_at?: string
          currency?: string
          demo_key?: string | null
          discount_bps?: number
          email?: string
          id?: string
          name?: string
          notes?: string
          payment_terms?: string
          phone?: string
          tax_reference?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_customers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_enquiries: {
        Row: {
          analysis_notes: Json
          created_at: string
          customer_id: string | null
          delivery_date: string | null
          demo_key: string | null
          id: string
          notes: string
          original_text: string
          received_date: string
          source: string
          title: string
          workspace_id: string
        }
        Insert: {
          analysis_notes?: Json
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          demo_key?: string | null
          id?: string
          notes?: string
          original_text: string
          received_date?: string
          source: string
          title: string
          workspace_id: string
        }
        Update: {
          analysis_notes?: Json
          created_at?: string
          customer_id?: string | null
          delivery_date?: string | null
          demo_key?: string | null
          id?: string
          notes?: string
          original_text?: string
          received_date?: string
          source?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_enquiries_workspace_id_customer_id_fkey"
            columns: ["workspace_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "quolyn_customers"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_enquiries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_enquiry_lines: {
        Row: {
          brand: string | null
          clarification: string
          corrections: number
          delivery: string | null
          description: string
          enquiry_id: string
          exclusion_reason: string
          id: string
          manual: boolean
          missing: Json
          original_text: string
          position: number
          product_id: string | null
          quantity: number | null
          requirements: Json
          sku: string | null
          state: string
          unit: string | null
          workspace_id: string
        }
        Insert: {
          brand?: string | null
          clarification?: string
          corrections?: number
          delivery?: string | null
          description: string
          enquiry_id: string
          exclusion_reason?: string
          id?: string
          manual?: boolean
          missing?: Json
          original_text?: string
          position?: number
          product_id?: string | null
          quantity?: number | null
          requirements?: Json
          sku?: string | null
          state?: string
          unit?: string | null
          workspace_id: string
        }
        Update: {
          brand?: string | null
          clarification?: string
          corrections?: number
          delivery?: string | null
          description?: string
          enquiry_id?: string
          exclusion_reason?: string
          id?: string
          manual?: boolean
          missing?: Json
          original_text?: string
          position?: number
          product_id?: string | null
          quantity?: number | null
          requirements?: Json
          sku?: string | null
          state?: string
          unit?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_enquiry_lines_workspace_id_enquiry_id_fkey"
            columns: ["workspace_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "quolyn_enquiries"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_enquiry_lines_workspace_id_product_id_fkey"
            columns: ["workspace_id", "product_id"]
            isOneToOne: false
            referencedRelation: "quolyn_products"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      quolyn_match_candidates: {
        Row: {
          created_at: string
          id: string
          line_id: string
          product_id: string
          reasons: Json
          strength: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_id: string
          product_id: string
          reasons?: Json
          strength: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          line_id?: string
          product_id?: string
          reasons?: Json
          strength?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_match_candidates_workspace_id_line_id_fkey"
            columns: ["workspace_id", "line_id"]
            isOneToOne: false
            referencedRelation: "quolyn_enquiry_lines"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_match_candidates_workspace_id_product_id_fkey"
            columns: ["workspace_id", "product_id"]
            isOneToOne: false
            referencedRelation: "quolyn_products"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      quolyn_product_aliases: {
        Row: {
          alias: string
          id: string
          product_id: string
          workspace_id: string
        }
        Insert: {
          alias: string
          id?: string
          product_id: string
          workspace_id: string
        }
        Update: {
          alias?: string
          id?: string
          product_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_product_aliases_workspace_id_product_id_fkey"
            columns: ["workspace_id", "product_id"]
            isOneToOne: false
            referencedRelation: "quolyn_products"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      quolyn_products: {
        Row: {
          active: boolean
          attributes: Json
          brand: string
          category: string
          cost_minor: number | null
          cost_unit: string | null
          coverage: number | null
          coverage_unit: string | null
          currency: string
          description: string
          id: string
          lead_time: string
          manufacturer_code: string | null
          name: string
          pack_unit: string | null
          price_minor: number | null
          price_unit: string
          price_updated_at: string
          selling_unit: string
          sku: string | null
          source: string
          stock_status: string
          tax_bps: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          attributes?: Json
          brand?: string
          category?: string
          cost_minor?: number | null
          cost_unit?: string | null
          coverage?: number | null
          coverage_unit?: string | null
          currency?: string
          description?: string
          id?: string
          lead_time?: string
          manufacturer_code?: string | null
          name: string
          pack_unit?: string | null
          price_minor?: number | null
          price_unit?: string
          price_updated_at?: string
          selling_unit?: string
          sku?: string | null
          source?: string
          stock_status?: string
          tax_bps?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          attributes?: Json
          brand?: string
          category?: string
          cost_minor?: number | null
          cost_unit?: string | null
          coverage?: number | null
          coverage_unit?: string | null
          currency?: string
          description?: string
          id?: string
          lead_time?: string
          manufacturer_code?: string | null
          name?: string
          pack_unit?: string | null
          price_minor?: number | null
          price_unit?: string
          price_updated_at?: string
          selling_unit?: string
          sku?: string | null
          source?: string
          stock_status?: string
          tax_bps?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_products_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      quolyn_quote_counters: {
        Row: {
          value: number
          workspace_id: string
        }
        Insert: {
          value?: number
          workspace_id: string
        }
        Update: {
          value?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_quote_counters_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_quote_documents: {
        Row: {
          created_at: string
          id: string
          path: string
          quote_id: string
          quote_version: number
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          quote_id: string
          quote_version: number
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          quote_id?: string
          quote_version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_quote_documents_workspace_id_quote_id_fkey"
            columns: ["workspace_id", "quote_id"]
            isOneToOne: false
            referencedRelation: "quolyn_quotes"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      quolyn_quote_lines: {
        Row: {
          data: Json
          description: string
          discount_bps: number | null
          enquiry_line_id: string | null
          id: string
          included: boolean
          position: number
          price_minor: number | null
          price_unit: string | null
          product_id: string | null
          quantity: number | null
          quote_id: string
          reviewed: boolean
          tax_bps: number | null
          unit: string | null
          workspace_id: string
        }
        Insert: {
          data: Json
          description: string
          discount_bps?: number | null
          enquiry_line_id?: string | null
          id?: string
          included?: boolean
          position: number
          price_minor?: number | null
          price_unit?: string | null
          product_id?: string | null
          quantity?: number | null
          quote_id: string
          reviewed?: boolean
          tax_bps?: number | null
          unit?: string | null
          workspace_id: string
        }
        Update: {
          data?: Json
          description?: string
          discount_bps?: number | null
          enquiry_line_id?: string | null
          id?: string
          included?: boolean
          position?: number
          price_minor?: number | null
          price_unit?: string | null
          product_id?: string | null
          quantity?: number | null
          quote_id?: string
          reviewed?: boolean
          tax_bps?: number | null
          unit?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_quote_lines_workspace_id_enquiry_line_id_fkey"
            columns: ["workspace_id", "enquiry_line_id"]
            isOneToOne: false
            referencedRelation: "quolyn_enquiry_lines"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_quote_lines_workspace_id_product_id_fkey"
            columns: ["workspace_id", "product_id"]
            isOneToOne: false
            referencedRelation: "quolyn_products"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_quote_lines_workspace_id_quote_id_fkey"
            columns: ["workspace_id", "quote_id"]
            isOneToOne: false
            referencedRelation: "quolyn_quotes"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      quolyn_quotes: {
        Row: {
          accepted_at: string | null
          created_at: string
          currency: string
          customer_id: string | null
          enquiry_id: string | null
          expiry_date: string | null
          id: string
          issue_date: string
          notes: string
          number: string
          parent_id: string | null
          rejected_at: string | null
          request_id: string
          revision: number
          sent_at: string | null
          snapshot: Json
          status: string
          terms: string
          total_minor: number | null
          updated_at: string
          validation: Json
          version: number
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          currency: string
          customer_id?: string | null
          enquiry_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string
          number: string
          parent_id?: string | null
          rejected_at?: string | null
          request_id: string
          revision?: number
          sent_at?: string | null
          snapshot?: Json
          status?: string
          terms?: string
          total_minor?: number | null
          updated_at?: string
          validation?: Json
          version?: number
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          enquiry_id?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string
          notes?: string
          number?: string
          parent_id?: string | null
          rejected_at?: string | null
          request_id?: string
          revision?: number
          sent_at?: string | null
          snapshot?: Json
          status?: string
          terms?: string
          total_minor?: number | null
          updated_at?: string
          validation?: Json
          version?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_quotes_workspace_id_customer_id_fkey"
            columns: ["workspace_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "quolyn_customers"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_quotes_workspace_id_enquiry_id_fkey"
            columns: ["workspace_id", "enquiry_id"]
            isOneToOne: false
            referencedRelation: "quolyn_enquiries"
            referencedColumns: ["workspace_id", "id"]
          },
          {
            foreignKeyName: "quolyn_quotes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quolyn_quotes_workspace_id_parent_id_fkey"
            columns: ["workspace_id", "parent_id"]
            isOneToOne: false
            referencedRelation: "quolyn_quotes"
            referencedColumns: ["workspace_id", "id"]
          },
        ]
      }
      quolyn_units: {
        Row: {
          base_factor: number
          code: string
          dimension: string
          id: string
          label: string
          workspace_id: string
        }
        Insert: {
          base_factor: number
          code: string
          dimension: string
          id?: string
          label: string
          workspace_id: string
        }
        Update: {
          base_factor?: number
          code?: string
          dimension?: string
          id?: string
          label?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_units_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_workspace_members: {
        Row: {
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quolyn_workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "quolyn_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      quolyn_workspaces: {
        Row: {
          address: string
          created_at: string
          currency: string
          discount_warning_bps: number
          id: string
          logo_path: string | null
          margin_warning_bps: number
          name: string
          quote_prefix: string
          tax_bps: number | null
          terms: string
          validity_days: number
        }
        Insert: {
          address?: string
          created_at?: string
          currency?: string
          discount_warning_bps?: number
          id?: string
          logo_path?: string | null
          margin_warning_bps?: number
          name: string
          quote_prefix?: string
          tax_bps?: number | null
          terms?: string
          validity_days?: number
        }
        Update: {
          address?: string
          created_at?: string
          currency?: string
          discount_warning_bps?: number
          id?: string
          logo_path?: string | null
          margin_warning_bps?: number
          name?: string
          quote_prefix?: string
          tax_bps?: number | null
          terms?: string
          validity_days?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analysis_limit: { Args: { w: string }; Returns: undefined }
      catalogue_page: {
        Args: {
          active_filter?: string
          brand_filter?: string
          category_filter?: string
          page_number?: number
          q?: string
          w: string
        }
        Returns: Json
      }
      combine_lines: {
        Args: { source_id: string; target_id: string; w: string }
        Returns: undefined
      }
      create_workspace: { Args: { p_name: string }; Returns: string }
      dashboard_metrics: { Args: { w: string }; Returns: Json }
      record_document: {
        Args: { p: string; q: string; v: number; w: string }
        Returns: undefined
      }
      save_quote: { Args: { p: Json; w: string }; Returns: string }
      search_products: {
        Args: { q: string; w: string }
        Returns: {
          active: boolean
          attributes: Json
          brand: string
          category: string
          cost_minor: number | null
          cost_unit: string | null
          coverage: number | null
          coverage_unit: string | null
          currency: string
          description: string
          id: string
          lead_time: string
          manufacturer_code: string | null
          name: string
          pack_unit: string | null
          price_minor: number | null
          price_unit: string
          price_updated_at: string
          selling_unit: string
          sku: string | null
          source: string
          stock_status: string
          tax_bps: number | null
          updated_at: string
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "quolyn_products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      store_analysis: {
        Args: { e: string; replace_reviewed?: boolean; result: Json; w: string }
        Returns: undefined
      }
      suggest_products: {
        Args: { l: string; q: string; w: string }
        Returns: {
          active: boolean
          attributes: Json
          brand: string
          category: string
          cost_minor: number | null
          cost_unit: string | null
          coverage: number | null
          coverage_unit: string | null
          currency: string
          description: string
          id: string
          lead_time: string
          manufacturer_code: string | null
          name: string
          pack_unit: string | null
          price_minor: number | null
          price_unit: string
          price_updated_at: string
          selling_unit: string
          sku: string | null
          source: string
          stock_status: string
          tax_bps: number | null
          updated_at: string
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "quolyn_products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      transition_quote: {
        Args: { q: string; target: string; v: number; w: string }
        Returns: undefined
      }
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
    Enums: {},
  },
} as const
