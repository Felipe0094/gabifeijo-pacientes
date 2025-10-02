import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Calendar, Activity, Users } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';

function useSupabaseImage(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) {
      console.log('[useSupabaseImage] path vazio ou nulo:', path);
      return;
    }
    let revoked = false;
    console.log('[useSupabaseImage] Buscando blob do Supabase para path:', path);
    supabase.storage.from('patient-photos').download(path).then(({ data, error }) => {
      if (error) {
        console.error('[useSupabaseImage] Erro ao baixar do Supabase:', error, 'path:', path);
      }
      if (data && !revoked) {
        const blobUrl = URL.createObjectURL(data);
        setUrl(blobUrl);
        console.log('[useSupabaseImage] Blob URL gerado:', blobUrl, 'para path:', path);
        // Clean up
        return () => {
          revoked = true;
          URL.revokeObjectURL(blobUrl);
        };
      } else if (!data) {
        console.warn('[useSupabaseImage] Nenhum dado retornado do Supabase para path:', path);
      }
    });
  }, [path]);
  return url;
}

function PatientAvatar({ name, profile_photo_url }: { name: string, profile_photo_url: string | null }) {
  let profilePhotoPath = null;
  if (profile_photo_url) {
    if (profile_photo_url.startsWith('http')) {
      // Extrai o path relativo da URL pública do Supabase
      profilePhotoPath = profile_photo_url.replace(
        'https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/',
        ''
      );
    } else {
      profilePhotoPath = profile_photo_url;
    }
  }
  const profilePhotoBlobUrl = useSupabaseImage(profilePhotoPath);
  const src = profilePhotoBlobUrl;
  console.log('[PatientAvatar] profile_photo_url recebido:', profile_photo_url);
  console.log('[PatientAvatar] profilePhotoPath extraído:', profilePhotoPath);
  console.log('[PatientAvatar] src final para <img>:', src);
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="w-12 h-12 object-cover rounded-full"
      />
    );
  }
  return (
    <span className="text-white font-bold text-lg">
      {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
    </span>
  );
}

const PatientList = () => {
  const navigate = useNavigate();
  const { data: patients = [], isLoading, error } = usePatients();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Erro ao carregar pacientes</div>
        <button 
          onClick={() => window.location.reload()}
          className="text-green-600 hover:text-green-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const getAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getGenderText = (gender: number) => {
    return gender === 0 ? 'F' : 'M';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Pacientes</h1>
        </div>
        <button
          onClick={() => navigate('/add-patient')}
          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          <UserPlus className="h-5 w-5" />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total de Pacientes</p>
              <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ativos este mês</p>
              <p className="text-2xl font-bold text-gray-800">{patients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Novos este mês</p>
              <p className="text-2xl font-bold text-gray-800">
                {patients.filter(p => {
                  const created = new Date(p.created_at);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Pacientes</h2>
        </div>
        
        {patients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhum paciente cadastrado
            </h3>
            <p className="text-gray-500 mb-6">
              Comece adicionando seu primeiro paciente
            </p>
            <button
              onClick={() => navigate('/add-patient')}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 mx-auto"
            >
              <UserPlus className="h-5 w-5" />
              <span>Adicionar Paciente</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <PatientAvatar name={patient.name} profile_photo_url={patient.profile_photo_url} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {patient.name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                        {getGenderText(patient.gender)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{getAge(patient.birth_date)} anos</span>
                      <span>•</span>
                      <span>{patient.height_cm} cm</span>
                      {patient.email && (
                        <>
                          <span>•</span>
                          <span className="truncate">{patient.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <p>Cadastrado em</p>
                    <p>{new Date(patient.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
