import React, { useState, useRef } from 'react';
import { Camera, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadBodyPhoto } from '@/hooks/useBodyPhotos';

interface BodyPhotoUploaderProps {
  patientId: string;
  onPhotosUploaded?: () => void;
}

const BodyPhotoUploader: React.FC<BodyPhotoUploaderProps> = ({
  patientId,
  onPhotosUploaded
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFiles, setSelectedFiles] = useState<{
    front?: File;
    side?: File;
    back?: File;
  }>({});
  
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null)
  };

  const uploadBodyPhoto = useUploadBodyPhoto();

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
      return false;
    }

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo 5MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (type: 'front' | 'side' | 'back') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!validateFile(file)) {
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const handleUploadAll = async () => {
    const filesToUpload = Object.entries(selectedFiles).filter(([_, file]) => file);
    
    if (filesToUpload.length === 0) {
      toast.error('Selecione pelo menos uma foto para fazer upload.');
      return;
    }

    try {
      const uploadPromises = filesToUpload.map(([photoType, file]) =>
        uploadBodyPhoto.mutateAsync({
          file: file!,
          patientId,
          photoDate: selectedDate,
          photoType: photoType as 'front' | 'side' | 'back'
        })
      );

      await Promise.all(uploadPromises);
      
      toast.success(`${filesToUpload.length} foto(s) corporal(is) adicionada(s) com sucesso!`);
      console.log(`${filesToUpload.length} fotos corporais adicionadas para paciente ${patientId}, data ${selectedDate}`);
      
      setSelectedFiles({});
      onPhotosUploaded?.();
    } catch (error) {
      console.error('Erro ao fazer upload das fotos:', error);
      toast.error('Erro ao fazer upload das fotos. Tente novamente.');
    }
  };

  const renderPhotoSlot = (type: 'front' | 'side' | 'back', label: string) => {
    const file = selectedFiles[type];
    const previewUrl = file ? URL.createObjectURL(file) : null;

    return (
      <div className="flex flex-col items-center space-y-2">
        <div
          className="w-24 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors flex items-center justify-center overflow-hidden"
          onClick={() => fileInputRefs[type].current?.click()}
        >
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt={`Preview ${label}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <span className="text-xs text-gray-500">Adicionar</span>
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <input
          ref={fileInputRefs[type]}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect(type)}
          className="hidden"
        />
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 w-full max-w-3xl">
      <div className="flex items-center space-x-2 mb-4">
        <Camera className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-800">Fotos Corporais</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <label className="text-sm font-medium text-gray-700">Data das fotos:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="flex justify-center space-x-6">
          {renderPhotoSlot('front', 'Frente')}
          {renderPhotoSlot('side', 'Lateral')}
          {renderPhotoSlot('back', 'Costas')}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleUploadAll}
            disabled={uploadBodyPhoto.isPending || Object.keys(selectedFiles).length === 0}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadBodyPhoto.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>
              {uploadBodyPhoto.isPending ? 'Enviando...' : 'Enviar Fotos'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BodyPhotoUploader;
