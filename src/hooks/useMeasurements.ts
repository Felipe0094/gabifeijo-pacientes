import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ManualMeasurement {
  id: string;
  patient_id: string;
  timestamp: string;
  waist_cm?: number;
  abdomen_cm?: number;
  arm_right_cm?: number;
  arm_left_cm?: number;
  thorax_cm?: number;
  hip_cm?: number;
  thigh_cm?: number;
  calf_cm?: number;
  thigh_right_cm?: number;
  thigh_left_cm?: number;
  calf_right_cm?: number;
  calf_left_cm?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScaleMeasurement {
  id: string;
  patient_id: string;
  timestamp: string;
  weight: number;
  bmi?: number;
  body_fat_percent?: number;
  visceral_fat_rating?: number;
  water_percent?: number;
  bone_mass_kg?: number;
  muscle_mass_percent_total?: number;
  fat_arm_right?: number;
  fat_arm_left?: number;
  fat_leg_right?: number;
  fat_leg_left?: number;
  fat_trunk?: number;
  muscle_arm_right?: number;
  muscle_arm_left?: number;
  muscle_leg_right?: number;
  muscle_leg_left?: number;
  muscle_trunk?: number;
  metabolic_age?: number;
  daily_calorie_maintenance?: number;
  segment_data_json?: any;
  created_at: string;
  updated_at: string;
}

export const usePatientMeasurements = (patientId: string) => {
  const manualQuery = useQuery({
    queryKey: ['manual-measurements', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('manual_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data as ManualMeasurement[];
    },
    enabled: !!patientId,
  });

  const scaleQuery = useQuery({
    queryKey: ['scale-measurements', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scale_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      return data as ScaleMeasurement[];
    },
    enabled: !!patientId,
  });

  return {
    manualMeasurements: manualQuery.data || [],
    scaleMeasurements: scaleQuery.data || [],
    isLoading: manualQuery.isLoading || scaleQuery.isLoading,
    error: manualQuery.error || scaleQuery.error,
  };
};

export const useCreateManualMeasurement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (measurement: Omit<ManualMeasurement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('manual_measurements')
        .insert([measurement])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manual-measurements', variables.patient_id] });
    },
  });
};

export const useCreateScaleMeasurement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (measurement: Omit<ScaleMeasurement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('scale_measurements')
        .insert([measurement])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['scale-measurements', variables.patient_id] });
    },
  });
};

// Novo hook para buscar todas as medições do sistema (manuais e balança)
export const useAllMeasurements = () => {
  return useQuery({
    queryKey: ['all-measurements'],
    queryFn: async () => {
      const [manualRes, scaleRes] = await Promise.all([
        supabase.from('manual_measurements').select('*'),
        supabase.from('scale_measurements').select('*'),
      ]);
      if (manualRes.error) throw manualRes.error;
      if (scaleRes.error) throw scaleRes.error;
      const manual = (manualRes.data || []).map(m => ({ ...m, type: 'manual' }));
      const scale = (scaleRes.data || []).map(m => ({ ...m, type: 'scale' }));
      // Unir e ordenar por timestamp decrescente
      return [...manual, ...scale].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });
};
