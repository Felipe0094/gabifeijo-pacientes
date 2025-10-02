import React, { useState } from 'react';
import { Calendar, Eye, X, Trash, GitCompare, Check } from 'lucide-react';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface BodyPhotoGalleryProps {
  patientId: string;
  onOpenUploader?: () => void;
}

function useSupabaseImage(path: string | null) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!path) return;
    let revoked = false;
    supabase.storage.from('patient-photos').download(path).then(({ data, error }) => {
      if (data && !revoked) {
        const blobUrl = URL.createObjectURL(data);
        setUrl(blobUrl);
        // Clean up
        return () => {
          revoked = true;
          URL.revokeObjectURL(blobUrl);
        };
      }
    });
    // eslint-disable-next-line
  }, [path]);
  return url;
}

function PhotoThumbnail({ 
  photo, 
  date, 
  onClick, 
  onDelete, 
  isDeleting,
  isSelected,
  onToggleSelection,
  isComparisonMode
}: {
  photo: any;
  date: string;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isSelected?: boolean;
  onToggleSelection?: () => void;
  isComparisonMode?: boolean;
}) {
  const path = photo.photo_url.startsWith('http')
    ? photo.photo_url.replace('https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/', '')
    : photo.photo_url;
  const thumbUrl = useSupabaseImage(path);
  const getTypeLabel = (type: string) => {
    const labels = { front: 'Frente', side: 'Lateral', back: 'Costas' };
    return labels[type as keyof typeof labels] || type;
  };
  
  return (
    <div className="flex flex-col items-center group relative">
      <div
        className={`cursor-pointer relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
        onClick={isComparisonMode ? onToggleSelection : onClick}
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={`${getTypeLabel(photo.photo_type)} - ${date}`}
            className="w-16 h-24 object-cover rounded shadow hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-16 h-24 bg-gray-200 animate-pulse rounded" />
        )}
        {isComparisonMode && (
          <div className="absolute top-1 right-1">
            {isSelected ? (
              <div className="bg-blue-500 text-white rounded-full p-1">
                <Check className="h-3 w-3" />
              </div>
                         ) : (
               <div className="bg-gray-300 text-gray-600 rounded-full p-1">
                 <GitCompare className="h-3 w-3" />
               </div>
             )}
          </div>
        )}
      </div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="text-xs font-medium text-gray-600">
          {getTypeLabel(photo.photo_type)}
        </span>
        <button
          className="bg-white bg-opacity-80 rounded-full p-1 hover:bg-red-100 transition-colors z-10"
          title="Remover foto"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={isDeleting}
        >
          <Trash className="h-4 w-4 text-red-600" />
        </button>
      </div>
    </div>
  );
}

const BodyPhotoGallery: React.FC<BodyPhotoGalleryProps> = ({ patientId, onOpenUploader }) => {
  const { data: photos, isLoading, error, refetch } = useBodyPhotos(patientId);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      // Remove do banco
      const { error } = await supabase.from('body_photos').delete().eq('id', photoId);
      if (error) throw error;
    },
    onSuccess: (data, photoId) => {
      refetch();
      // Se a foto removida estava aberta no modal, fecha o modal
      if (selectedPhoto && photos && photos.some(p => p.id === photoId && p.photo_url === selectedPhoto)) {
        setSelectedPhoto(null);
      }
      // Remove da seleção de comparação se estava selecionada
      setSelectedPhotos(prev => prev.filter(id => id !== photoId));
    },
  });

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    if (comparisonMode) {
      setSelectedPhotos([]);
    }
  };

  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else if (prev.length < 2) {
        return [...prev, photoId];
      }
      return prev;
    });
  };

  const openComparison = () => {
    if (selectedPhotos.length === 2) {
      setSelectedPhoto('comparison');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-red-600">
        Erro ao carregar fotos. Tente novamente.
        <button className="block mx-auto mt-4 px-4 py-2 bg-green-600 text-white rounded" onClick={() => refetch()}>
          Recarregar
        </button>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 text-center text-gray-500">
        Nenhuma foto encontrada.
        {onOpenUploader && (
          <button
            onClick={onOpenUploader}
            className="block mx-auto mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
          >
            Enviar Fotos
          </button>
        )}
      </div>
    );
  }

  // Função para ordenar fotos por tipo (frente, lateral, costas)
  const sortPhotosByType = (photos: any[]) => {
    const typeOrder = { front: 1, side: 2, back: 3 };
    return photos.sort((a, b) => {
      const orderA = typeOrder[a.photo_type as keyof typeof typeOrder] || 999;
      const orderB = typeOrder[b.photo_type as keyof typeof typeOrder] || 999;
      return orderA - orderB;
    });
  };

  // Group photos by date
  const photosByDate = photos.reduce((acc, photo) => {
    const date = photo.photo_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(photo);
    return acc;
  }, {} as Record<string, typeof photos>);

  // Ordenar fotos por tipo em cada data
  Object.keys(photosByDate).forEach(date => {
    photosByDate[date] = sortPhotosByType(photosByDate[date]);
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 max-h-[510px] overflow-y-auto">
      {/* Controles de comparação */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleComparisonMode}
          className={`px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${
            comparisonMode 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <GitCompare className="h-4 w-4 inline mr-2" />
          {comparisonMode ? 'Sair do Modo Comparação' : 'Modo Comparação'}
        </button>
        
        {comparisonMode && selectedPhotos.length === 2 && (
          <button
            onClick={openComparison}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm"
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Comparar
          </button>
        )}
      </div>

      {comparisonMode && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            Selecione 2 fotos para comparar ({selectedPhotos.length}/2)
          </p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(photosByDate)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, datePhotos]) => (
          <div key={date} className="bg-white rounded-xl shadow p-4">
            <h4 className="text-md font-medium text-gray-700 flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateBR(date)}</span>
            </h4>
            <div className="grid grid-cols-3 items-end justify-items-center gap-4">
              {datePhotos.map((photo) => (
                <PhotoThumbnail
                  key={photo.id}
                  photo={photo}
                  date={date}
                  onClick={() => setSelectedPhoto(photo.photo_url.startsWith('http')
                    ? photo.photo_url.replace('https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/', '')
                    : photo.photo_url)}
                  onDelete={() => {
                    if (window.confirm('Tem certeza que deseja remover esta foto?')) {
                      deletePhoto.mutate(photo.id);
                    }
                  }}
                  isDeleting={deletePhoto.isPending}
                  isSelected={selectedPhotos.includes(photo.id)}
                  onToggleSelection={() => togglePhotoSelection(photo.id)}
                  isComparisonMode={comparisonMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Photo modal */}
      {selectedPhoto && selectedPhoto !== 'comparison' && (
        <PhotoModal path={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}

      {/* Comparison modal */}
      {selectedPhoto === 'comparison' && selectedPhotos.length === 2 && (
        <ComparisonModal 
          photoIds={selectedPhotos} 
          photos={photos}
          onClose={() => setSelectedPhoto(null)} 
        />
      )}
    </div>
  );
};

function PhotoModal({ path, onClose }: { path: string; onClose: () => void }) {
  const url = useSupabaseImage(path);
  // Fechar com ESC
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        {url ? (
          <img
            src={url}
            alt="Foto ampliada"
            className="max-w-full max-h-[600px] object-contain rounded-lg"
          />
        ) : (
          <div className="w-[300px] h-[400px] bg-gray-200 animate-pulse rounded" />
        )}
      </div>
    </div>
  );
}

function ComparisonModal({ 
  photoIds, 
  photos, 
  onClose 
}: { 
  photoIds: string[]; 
  photos: any[];
  onClose: () => void; 
}) {
  const selectedPhotos = photos.filter(photo => photoIds.includes(photo.id));
  
  // Fechar com ESC
  React.useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getTypeLabel = (type: string) => {
    const labels = { front: 'Frente', side: 'Lateral', back: 'Costas' };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-6xl max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>
        
        <div className="grid grid-cols-2 gap-8">
          {selectedPhotos.map((photo, index) => {
            const path = photo.photo_url.startsWith('http')
              ? photo.photo_url.replace('https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/', '')
              : photo.photo_url;
            const url = useSupabaseImage(path);
            
            return (
              <div key={photo.id} className="flex flex-col items-center">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {getTypeLabel(photo.photo_type)} - {formatDateBR(photo.photo_date)}
                  </h3>
                </div>
                {url ? (
                  <img
                    src={url}
                    alt={`Comparação ${index + 1}`}
                    className="max-w-full max-h-[600px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-[300px] h-[400px] bg-gray-200 animate-pulse rounded" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Função utilitária para garantir data correta
function formatDateBR(date: string) {
  if (!date) return '';
  // Aceita 'YYYY-MM-DD' ou Date
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  if (d instanceof Date && !isNaN(d.getTime())) {
    return d.toLocaleDateString('pt-BR');
  }
  return date;
}

export default BodyPhotoGallery;
