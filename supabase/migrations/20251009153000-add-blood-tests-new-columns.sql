-- Add new columns to blood_tests for extended lab panel
ALTER TABLE public.blood_tests
  ADD COLUMN IF NOT EXISTS vldl DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS folate DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS ferritin DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS uric_acid DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS bilirubin_total DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS bilirubin_direct DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS bilirubin_indirect DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS alkaline_phosphatase DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS ggt DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS ldh DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS c_reactive_protein DECIMAL(8,2);