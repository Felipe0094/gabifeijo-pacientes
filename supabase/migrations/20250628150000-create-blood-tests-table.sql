-- Create blood_tests table
CREATE TABLE IF NOT EXISTS public.blood_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    test_date DATE NOT NULL,
    laboratory TEXT,
    
    -- Hemograma
    hemoglobin DECIMAL(5,2),
    hematocrit DECIMAL(5,2),
    red_blood_cells DECIMAL(5,2),
    white_blood_cells DECIMAL(8,2),
    platelets INTEGER,
    
    -- Hormônios
    testosterone_total DECIMAL(8,2),
    testosterone_free DECIMAL(8,2),
    shbg DECIMAL(8,2),
    tsh DECIMAL(8,3),
    t3 DECIMAL(8,2),
    t4 DECIMAL(8,2),
    
    -- Lipidograma
    cholesterol_total DECIMAL(8,2),
    hdl DECIMAL(8,2),
    ldl DECIMAL(8,2),
    triglycerides DECIMAL(8,2),
    apolipoprotein_a DECIMAL(8,2),
    apolipoprotein_b DECIMAL(8,2),
    
    -- Vitaminas e Metabolismo
    vitamin_d DECIMAL(8,2),
    vitamin_b12 DECIMAL(8,2),
    homocysteine DECIMAL(8,2),
    
    -- Função Renal
    creatinine DECIMAL(8,2),
    urea DECIMAL(8,2),
    
    -- Função Hepática
    tgo_ast DECIMAL(8,2),
    tgp_alt DECIMAL(8,2),
    total_protein DECIMAL(8,2),
    albumin DECIMAL(8,2),
    
    -- Eletrólitos
    sodium DECIMAL(8,2),
    potassium DECIMAL(8,2),
    magnesium DECIMAL(8,2),
    phosphorus DECIMAL(8,2),
    
    -- Glicemia
    fasting_glucose DECIMAL(8,2),
    hba1c DECIMAL(5,2),
    fasting_insulin DECIMAL(8,2),
    
    -- Compatibilidade com campos antigos
    glucose DECIMAL(8,2),
    
    -- Observações
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blood_tests_patient_id ON public.blood_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_blood_tests_test_date ON public.blood_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_blood_tests_patient_date ON public.blood_tests(patient_id, test_date DESC);

-- Enable RLS
ALTER TABLE public.blood_tests ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for full access (adjust as needed for your security requirements)
CREATE POLICY "Enable all operations for blood_tests" ON public.blood_tests
    FOR ALL USING (true) WITH CHECK (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_blood_tests_updated_at
    BEFORE UPDATE ON public.blood_tests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();