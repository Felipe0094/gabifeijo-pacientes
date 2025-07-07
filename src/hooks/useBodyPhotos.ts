import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BodyPhoto {
  id: string;
  patient_id: string;
  photo_url: string;
  photo_date: string;
  photo_type: 'front' | 'side' | 'back';
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export const useBodyPhotos = (patientId: string) => {
  return useQuery({
    queryKey: ['body-photos', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_photos')
        .select('*')
        .eq('patient_id', patientId)
        .order('photo_date', { ascending: false });
      
      if (error) throw error;
      return data as BodyPhoto[];
    },
    enabled: !!patientId,
  });
};

export const useUploadBodyPhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      patientId, 
      photoDate, 
      photoType 
    }: { 
      file: File; 
      patientId: string; 
      photoDate: string; 
      photoType: 'front' | 'side' | 'back'; 
    }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `patient/${patientId}/body/${photoType}_${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(fileName);
      
      console.log('URL pública gerada para foto corporal:', publicUrl);
      if (!publicUrl) {
        throw new Error('Erro ao obter URL pública da foto. Upload pode ter falhado.');
      }
      
      // Save to database
      const { data, error } = await supabase
        .from('body_photos')
        .insert([{
          patient_id: patientId,
          photo_url: fileName,
          photo_date: photoDate,
          photo_type: photoType,
          file_size: file.size
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Erro Supabase insert body_photos:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['body-photos', variables.patientId] });
    },
  });
};

export const useUpdateProfilePhoto = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, patientId }: { file: File; patientId: string }) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `patient/${patientId}/profile/avatar_${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-photos')
        .getPublicUrl(fileName);
      
      // Update patient profile
      const { data, error } = await supabase
        .from('patients')
        .update({ profile_photo_url: publicUrl })
        .eq('id', patientId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};
