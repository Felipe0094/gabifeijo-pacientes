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
      body_photos: {
        Row: {
          created_at: string
          file_size: number | null
          id: string
          patient_id: string
          photo_date: string
          photo_type: string
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_size?: number | null
          id?: string
          patient_id: string
          photo_date: string
          photo_type: string
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_size?: number | null
          id?: string
          patient_id?: string
          photo_date?: string
          photo_type?: string
          photo_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_photos_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_measurements: {
        Row: {
          abdomen_cm: number | null
          arm_left_cm: number | null
          arm_right_cm: number | null
          calf_cm: number | null
          created_at: string
          hip_cm: number | null
          id: string
          notes: string | null
          patient_id: string
          thigh_cm: number | null
          timestamp: string
          updated_at: string
          waist_cm: number | null
        }
        Insert: {
          abdomen_cm?: number | null
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          calf_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          thigh_cm?: number | null
          timestamp?: string
          updated_at?: string
          waist_cm?: number | null
        }
        Update: {
          abdomen_cm?: number | null
          arm_left_cm?: number | null
          arm_right_cm?: number | null
          calf_cm?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          thigh_cm?: number | null
          timestamp?: string
          updated_at?: string
          waist_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "manual_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements_aggregation: {
        Row: {
          avg_abdomen_cm: number | null
          avg_bmi: number | null
          avg_body_fat_percent: number | null
          avg_hip_cm: number | null
          avg_muscle_mass_percent: number | null
          avg_visceral_fat_rating: number | null
          avg_waist_cm: number | null
          avg_water_percent: number | null
          avg_weight: number | null
          created_at: string
          id: string
          measurement_count: number | null
          patient_id: string
          period_end: string
          period_start: string
          period_type: string
          updated_at: string
        }
        Insert: {
          avg_abdomen_cm?: number | null
          avg_bmi?: number | null
          avg_body_fat_percent?: number | null
          avg_hip_cm?: number | null
          avg_muscle_mass_percent?: number | null
          avg_visceral_fat_rating?: number | null
          avg_waist_cm?: number | null
          avg_water_percent?: number | null
          avg_weight?: number | null
          created_at?: string
          id?: string
          measurement_count?: number | null
          patient_id: string
          period_end: string
          period_start: string
          period_type: string
          updated_at?: string
        }
        Update: {
          avg_abdomen_cm?: number | null
          avg_bmi?: number | null
          avg_body_fat_percent?: number | null
          avg_hip_cm?: number | null
          avg_muscle_mass_percent?: number | null
          avg_visceral_fat_rating?: number | null
          avg_waist_cm?: number | null
          avg_water_percent?: number | null
          avg_weight?: number | null
          created_at?: string
          id?: string
          measurement_count?: number | null
          patient_id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurements_aggregation_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          activity_level: number
          athlete_mode: boolean | null
          birth_date: string
          created_at: string
          email: string | null
          gender: number
          height_cm: number
          id: string
          name: string
          profile_photo_url: string | null
          updated_at: string
        }
        Insert: {
          activity_level: number
          athlete_mode?: boolean | null
          birth_date: string
          created_at?: string
          email?: string | null
          gender: number
          height_cm: number
          id?: string
          name: string
          profile_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          activity_level?: number
          athlete_mode?: boolean | null
          birth_date?: string
          created_at?: string
          email?: string | null
          gender?: number
          height_cm?: number
          id?: string
          name?: string
          profile_photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scale_measurements: {
        Row: {
          bmi: number | null
          body_fat_percent: number | null
          bone_mass_kg: number | null
          created_at: string
          daily_calorie_maintenance: number | null
          fat_arm_left: number | null
          fat_arm_right: number | null
          fat_leg_left: number | null
          fat_leg_right: number | null
          fat_trunk: number | null
          id: string
          metabolic_age: number | null
          muscle_arm_left: number | null
          muscle_arm_right: number | null
          muscle_leg_left: number | null
          muscle_leg_right: number | null
          muscle_mass_percent_total: number | null
          muscle_trunk: number | null
          patient_id: string
          segment_data_json: Json | null
          timestamp: string
          updated_at: string
          visceral_fat_rating: number | null
          water_percent: number | null
          weight: number
        }
        Insert: {
          bmi?: number | null
          body_fat_percent?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          daily_calorie_maintenance?: number | null
          fat_arm_left?: number | null
          fat_arm_right?: number | null
          fat_leg_left?: number | null
          fat_leg_right?: number | null
          fat_trunk?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_arm_left?: number | null
          muscle_arm_right?: number | null
          muscle_leg_left?: number | null
          muscle_leg_right?: number | null
          muscle_mass_percent_total?: number | null
          muscle_trunk?: number | null
          patient_id: string
          segment_data_json?: Json | null
          timestamp: string
          updated_at?: string
          visceral_fat_rating?: number | null
          water_percent?: number | null
          weight: number
        }
        Update: {
          bmi?: number | null
          body_fat_percent?: number | null
          bone_mass_kg?: number | null
          created_at?: string
          daily_calorie_maintenance?: number | null
          fat_arm_left?: number | null
          fat_arm_right?: number | null
          fat_leg_left?: number | null
          fat_leg_right?: number | null
          fat_trunk?: number | null
          id?: string
          metabolic_age?: number | null
          muscle_arm_left?: number | null
          muscle_arm_right?: number | null
          muscle_leg_left?: number | null
          muscle_leg_right?: number | null
          muscle_mass_percent_total?: number | null
          muscle_trunk?: number | null
          patient_id?: string
          segment_data_json?: Json | null
          timestamp?: string
          updated_at?: string
          visceral_fat_rating?: number | null
          water_percent?: number | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "scale_measurements_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
