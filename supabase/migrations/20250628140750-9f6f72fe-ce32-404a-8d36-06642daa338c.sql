-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  birth_date DATE NOT NULL,
  gender INTEGER NOT NULL, -- 0=feminino, 1=masculino
  height_cm FLOAT NOT NULL,
  athlete_mode BOOLEAN DEFAULT FALSE,
  activity_level INTEGER NOT NULL, -- 1-5 scale
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create manual_measurements table
CREATE TABLE public.manual_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  waist_cm FLOAT,
  abdomen_cm FLOAT,
  arm_right_cm FLOAT,
  arm_left_cm FLOAT,
  thorax_cm FLOAT,
  thigh_right_cm FLOAT,
  thigh_left_cm FLOAT,
  calf_right_cm FLOAT,
  calf_left_cm FLOAT,
  hip_cm FLOAT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scale_measurements table for Tanita BC-601 data
CREATE TABLE public.scale_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  -- Basic measurements
  weight FLOAT NOT NULL,
  bmi FLOAT,
  body_fat_percent FLOAT,
  visceral_fat_rating INTEGER,
  water_percent FLOAT,
  bone_mass_kg FLOAT,
  muscle_mass_percent_total FLOAT,
  -- Segmented fat measurements
  fat_arm_right FLOAT,
  fat_arm_left FLOAT,
  fat_leg_right FLOAT,
  fat_leg_left FLOAT,
  fat_trunk FLOAT,
  -- Segmented muscle measurements
  muscle_arm_right FLOAT,
  muscle_arm_left FLOAT,
  muscle_leg_right FLOAT,
  muscle_leg_left FLOAT,
  muscle_trunk FLOAT,
  -- Additional Tanita data
  metabolic_age INTEGER,
  daily_calorie_maintenance INTEGER,
  segment_data_json JSONB, -- For any additional segmented data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create measurements_aggregation table for performance optimization
CREATE TABLE public.measurements_aggregation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL, -- 'week', 'month', 'quarter'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Aggregated scale data
  avg_weight FLOAT,
  avg_bmi FLOAT,
  avg_body_fat_percent FLOAT,
  avg_visceral_fat_rating FLOAT,
  avg_water_percent FLOAT,
  avg_muscle_mass_percent FLOAT,
  -- Aggregated manual measurements
  avg_waist_cm FLOAT,
  avg_abdomen_cm FLOAT,
  avg_hip_cm FLOAT,
  measurement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, period_type, period_start)
);

-- Create indexes for performance
CREATE INDEX idx_patients_email ON public.patients(email);
CREATE INDEX idx_manual_measurements_patient_timestamp ON public.manual_measurements(patient_id, timestamp DESC);
CREATE INDEX idx_scale_measurements_patient_timestamp ON public.scale_measurements(patient_id, timestamp DESC);
CREATE INDEX idx_measurements_aggregation_patient_period ON public.measurements_aggregation(patient_id, period_type, period_start);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scale_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measurements_aggregation ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - you can restrict later with authentication)
CREATE POLICY "Allow all operations on patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on manual_measurements" ON public.manual_measurements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on scale_measurements" ON public.scale_measurements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on measurements_aggregation" ON public.measurements_aggregation FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_measurements_updated_at BEFORE UPDATE ON public.manual_measurements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scale_measurements_updated_at BEFORE UPDATE ON public.scale_measurements 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_measurements_aggregation_updated_at BEFORE UPDATE ON public.measurements_aggregation 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
