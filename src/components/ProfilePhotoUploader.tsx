import React, { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateProfilePhoto } from '@/hooks/useBodyPhotos';
import Cropper from 'react-easy-crop';

interface ProfilePhotoUploaderProps {
  patientId: string;
  currentPhotoUrl?: string;
  onPhotoUpdated?: () => void;
}

const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  patientId,
  currentPhotoUrl,
  onPhotoUpdated
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateProfilePhoto = useUpdateProfilePhoto();
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateFile(file)) {
      return;
    }
    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
    setCropModalOpen(true);
  };

  const handleCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  async function getCroppedImg(imageSrc: string, crop: any) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const size = Math.min(crop.width, crop.height);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');
    // Crop circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      size,
      size,
      0,
      0,
      size,
      size
    );
    ctx.restore();
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(new File([blob], selectedFile?.name || 'avatar.png', { type: 'image/png' }));
        }
      }, 'image/png');
    });
  }

  function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', error => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });
  }

  const handleCropSave = async () => {
    if (!imageUrl || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(imageUrl, croppedAreaPixels);
      await updateProfilePhoto.mutateAsync({ file: croppedFile, patientId });
      toast.success('Foto de perfil atualizada com sucesso!');
      onPhotoUpdated?.();
      setCropModalOpen(false);
      setSelectedFile(null);
      setImageUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error('Erro ao fazer upload da foto. Tente novamente.');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        disabled={updateProfilePhoto.isPending}
        className="w-8 h-8 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
      >
        {updateProfilePhoto.isPending ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Upload className="h-4 w-4 text-white" />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={updateProfilePhoto.isPending}
      />

      {cropModalOpen && imageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full flex flex-col items-center">
            <div className="w-64 h-64 relative bg-gray-100 rounded-full overflow-hidden">
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleCropSave}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUploader;
