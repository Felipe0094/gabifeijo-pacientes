import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BloodTest {
  id: string;
  patient_id: string;
  test_date: string;
  laboratory?: string | null;
  // Hemograma
  hemoglobin?: number | null;
  hematocrit?: number | null;
  red_blood_cells?: number | null;
  white_blood_cells?: number | null;
  platelets?: number | null;
  // Hormônios
  testosterone_total?: number | null;
  testosterone_free?: number | null;
  shbg?: number | null;
  tsh?: number | null;
  t3?: number | null;
  t4?: number | null;
  // Lipidograma
  cholesterol_total?: number | null;
  hdl?: number | null;
  ldl?: number | null;
  triglycerides?: number | null;
  apolipoprotein_a?: number | null;
  apolipoprotein_b?: number | null;
  // Vitaminas e Metabolismo
  vitamin_d?: number | null;
  vitamin_b12?: number | null;
  homocysteine?: number | null;
  // Função Renal
  creatinine?: number | null;
  urea?: number | null;
  // Função Hepática
  tgo_ast?: number | null;
  tgp_alt?: number | null;
  total_protein?: number | null;
  albumin?: number | null;
  // Eletrólitos
  sodium?: number | null;
  potassium?: number | null;
  magnesium?: number | null;
  phosphorus?: number | null;
  // Glicemia
  fasting_glucose?: number | null;
  hba1c?: number | null;
  fasting_insulin?: number | null;
  // Campos antigos (compatibilidade)
  glucose?: number | null;
  // Observações
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export const usePatientBloodTests = (patientId: string) => {
  return useQuery({
    queryKey: ['blood-tests', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blood_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('test_date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as BloodTest[];
    },
    enabled: !!patientId,
  });
};

export const useCreateBloodTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bloodTest: Omit<BloodTest, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('blood_tests')
        .insert([bloodTest])
        .select()
        .single();
      
      if (error) throw error;
      return data as BloodTest;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blood-tests', variables.patient_id] });
    },
  });
};

export const useUpdateBloodTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...bloodTest }: Partial<BloodTest> & { id: string }) => {
      const { data, error } = await supabase
        .from('blood_tests')
        .update(bloodTest)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BloodTest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blood-tests', data.patient_id] });
    },
  });
};

export const useDeleteBloodTest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blood_tests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      // Invalidate all blood-tests queries since we don't know the patient_id
      queryClient.invalidateQueries({ queryKey: ['blood-tests'] });
    },
  });
};

export const useAllBloodTests = () => {
  return useQuery({
    queryKey: ['all-blood-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blood_tests')
        .select('*')
        .order('test_date', { ascending: false });
      
      if (error) throw error;
      return (data || []) as BloodTest[];
    },
  });
};