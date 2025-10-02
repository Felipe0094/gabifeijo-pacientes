export type Database = {
  public: {
    Tables: {
      blood_tests: {
        Row: {
          id: string
          patient_id: string
          test_date: string
          laboratory: string | null
          hemoglobin: number | null
          hematocrit: number | null
          red_blood_cells: number | null
          white_blood_cells: number | null
          platelets: number | null
          testosterone_total: number | null
          testosterone_free: number | null
          shbg: number | null
          tsh: number | null
          t3: number | null
          t4: number | null
          cholesterol_total: number | null
          hdl: number | null
          ldl: number | null
          triglycerides: number | null
          apolipoprotein_a: number | null
          apolipoprotein_b: number | null
          vitamin_d: number | null
          vitamin_b12: number | null
          homocysteine: number | null
          creatinine: number | null
          urea: number | null
          tgo_ast: number | null
          tgp_alt: number | null
          total_protein: number | null
          albumin: number | null
          sodium: number | null
          potassium: number | null
          magnesium: number | null
          phosphorus: number | null
          fasting_glucose: number | null
          hba1c: number | null
          fasting_insulin: number | null
          glucose: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          test_date: string
          laboratory?: string | null
          hemoglobin?: number | null
          hematocrit?: number | null
          red_blood_cells?: number | null
          white_blood_cells?: number | null
          platelets?: number | null
          testosterone_total?: number | null
          testosterone_free?: number | null
          shbg?: number | null
          tsh?: number | null
          t3?: number | null
          t4?: number | null
          cholesterol_total?: number | null
          hdl?: number | null
          ldl?: number | null
          triglycerides?: number | null
          apolipoprotein_a?: number | null
          apolipoprotein_b?: number | null
          vitamin_d?: number | null
          vitamin_b12?: number | null
          homocysteine?: number | null
          creatinine?: number | null
          urea?: number | null
          tgo_ast?: number | null
          tgp_alt?: number | null
          total_protein?: number | null
          albumin?: number | null
          sodium?: number | null
          potassium?: number | null
          magnesium?: number | null
          phosphorus?: number | null
          fasting_glucose?: number | null
          hba1c?: number | null
          fasting_insulin?: number | null
          glucose?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          test_date?: string
          laboratory?: string | null
          hemoglobin?: number | null
          hematocrit?: number | null
          red_blood_cells?: number | null
          white_blood_cells?: number | null
          platelets?: number | null
          testosterone_total?: number | null
          testosterone_free?: number | null
          shbg?: number | null
          tsh?: number | null
          t3?: number | null
          t4?: number | null
          cholesterol_total?: number | null
          hdl?: number | null
          ldl?: number | null
          triglycerides?: number | null
          apolipoprotein_a?: number | null
          apolipoprotein_b?: number | null
          vitamin_d?: number | null
          vitamin_b12?: number | null
          homocysteine?: number | null
          creatinine?: number | null
          urea?: number | null
          tgo_ast?: number | null
          tgp_alt?: number | null
          total_protein?: number | null
          albumin?: number | null
          sodium?: number | null
          potassium?: number | null
          magnesium?: number | null
          phosphorus?: number | null
          fasting_glucose?: number | null
          hba1c?: number | null
          fasting_insulin?: number | null
          glucose?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blood_tests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      body_photos: {
        Row: {
          created_at: string
          file_size: number
          id: string
          patient_id: string
          photo_date: string
          photo_type: string
          photo_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_size: number
          id?: string
          patient_id: string
          photo_date: string
          photo_type: string
          photo_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_size?: number
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
          bmi: number | null
          body_fat_percent: number | null
          created_at: string
          hip_cm: number | null
          id: string
          measurement_date: string
          muscle_mass_percent: number | null
          notes: string | null
          patient_id: string
          updated_at: string
          visceral_fat_rating: number | null
          waist_cm: number | null
          water_percent: number | null
          weight_kg: number | null
        }
        Insert: {
          abdomen_cm?: number | null
          bmi?: number | null
          body_fat_percent?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measurement_date: string
          muscle_mass_percent?: number | null
          notes?: string | null
          patient_id: string
          updated_at?: string
          visceral_fat_rating?: number | null
          waist_cm?: number | null
          water_percent?: number | null
          weight_kg?: number | null
        }
        Update: {
          abdomen_cm?: number | null
          bmi?: number | null
          body_fat_percent?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_percent?: number | null
          notes?: string | null
          patient_id?: string
          updated_at?: string
          visceral_fat_rating?: number | null
          waist_cm?: number | null
          water_percent?: number | null
          weight_kg?: number | null
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
          avg_weight_kg: number | null
          created_at: string
          end_date: string
          id: string
          patient_id: string
          start_date: string
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
          avg_weight_kg?: number | null
          created_at?: string
          end_date: string
          id?: string
          patient_id: string
          start_date: string
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
          avg_weight_kg?: number | null
          created_at?: string
          end_date?: string
          id?: string
          patient_id?: string
          start_date?: string
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
          athlete_mode: boolean
          birth_date: string
          created_at: string
          email: string
          gender: number
          height_cm: number
          id: string
          name: string
          profile_photo_url: string
          updated_at: string
        }
        Insert: {
          activity_level?: number
          athlete_mode?: boolean
          birth_date: string
          created_at?: string
          email: string
          gender: number
          height_cm: number
          id?: string
          name: string
          profile_photo_url?: string
          updated_at?: string
        }
        Update: {
          activity_level?: number
          athlete_mode?: boolean
          birth_date?: string
          created_at?: string
          email?: string
          gender?: number
          height_cm?: number
          id?: string
          name?: string
          profile_photo_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      scale_measurements: {
        Row: {
          abdomen_cm: number | null
          bmi: number | null
          body_fat_percent: number | null
          created_at: string
          hip_cm: number | null
          id: string
          measurement_date: string
          muscle_mass_percent: number | null
          notes: string | null
          patient_id: string
          updated_at: string
          visceral_fat_rating: number | null
          waist_cm: number | null
          water_percent: number | null
          weight_kg: number | null
        }
        Insert: {
          abdomen_cm?: number | null
          bmi?: number | null
          body_fat_percent?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measurement_date: string
          muscle_mass_percent?: number | null
          notes?: string | null
          patient_id: string
          updated_at?: string
          visceral_fat_rating?: number | null
          waist_cm?: number | null
          water_percent?: number | null
          weight_kg?: number | null
        }
        Update: {
          abdomen_cm?: number | null
          bmi?: number | null
          body_fat_percent?: number | null
          created_at?: string
          hip_cm?: number | null
          id?: string
          measurement_date?: string
          muscle_mass_percent?: number | null
          notes?: string | null
          patient_id?: string
          updated_at?: string
          visceral_fat_rating?: number | null
          waist_cm?: number | null
          water_percent?: number | null
          weight_kg?: number | null
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

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never