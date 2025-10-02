import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Calendar, Ruler, Activity, Camera, Plus, FileDown } from 'lucide-react';
import { generatePatientReport } from '@/lib/report';
import { usePatient } from '@/hooks/usePatients';
import { usePatientMeasurements } from '@/hooks/useMeasurements';
import { useBodyPhotos } from '@/hooks/useBodyPhotos';
import { usePatientBloodTests, useCreateBloodTest, useUpdateBloodTest, useDeleteBloodTest, BloodTest } from '@/hooks/useBloodTests';
import ProfilePhotoUploader from './ProfilePhotoUploader';
import BodyPhotoUploader from './BodyPhotoUploader';
import BodyPhotoGallery from './BodyPhotoGallery';
import MeasurementForm from './MeasurementForm';
import PatientTimeline from './PatientTimeline';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';

// Função utilitária para cálculo de métricas de saúde e risco
function calculateHealthMetrics({
  waist_cm, hip_cm, height_cm, weight_kg, bmi, muscle_segments, body_fat_percent, visceral_fat_rating, albumin_g_per_L, triglycerides, hdl, gender, muscle_percent
}: {
  waist_cm?: number,
  hip_cm?: number,
  height_cm?: number,
  weight_kg?: number,
  bmi?: number,
  muscle_segments?: { arms?: number, legs?: number, trunk?: number },
  body_fat_percent?: number,
  visceral_fat_rating?: number,
  albumin_g_per_L?: number,
  triglycerides?: number,
  hdl?: number,
  gender?: number,
  muscle_percent?: number
}) {
  const height_m = height_cm ? height_cm / 100 : undefined;
  const whtR = waist_cm && height_cm ? waist_cm / height_cm : undefined;
  const bri = (waist_cm && height_cm && waist_cm > 0 && height_cm > 0) ? (() => {
    const wc = waist_cm;
    const h = height_cm;
    const denominator = Math.PI * h;
    if (denominator === 0) return undefined;
    const ratio = wc / denominator;
    const insideSqrt = 1 - Math.pow(ratio, 2);
    if (ratio < 0 || ratio > 1 || insideSqrt < 0) return undefined;
    const val = 364.2 - 365.5 * Math.sqrt(insideSqrt);
    return isNaN(val) ? undefined : val;
  })() : undefined;
  const absi = waist_cm && height_m && bmi ? (waist_cm / 100) / (Math.pow(bmi, 2/3) * Math.pow(height_m, 0.5)) : undefined;
  const whr = waist_cm && hip_cm ? waist_cm / hip_cm : undefined;
  const bai = hip_cm && height_m ? (hip_cm / Math.pow(height_m, 1.5)) - 18 : undefined;
  let smi = undefined;
  if (weight_kg !== undefined && muscle_percent !== undefined && height_m) {
    const massa_muscular_kg = weight_kg * (muscle_percent / 100);
    smi = massa_muscular_kg / (height_m ** 2);
  }
  const lms = muscle_segments && weight_kg ? (muscle_segments.legs ?? 0) / weight_kg * 100 : undefined;
  let ffmi = undefined;
  if (weight_kg !== undefined && body_fat_percent !== undefined && height_m) {
    const ffm = weight_kg * (1 - (body_fat_percent / 100));
    ffmi = ffm / (height_m ** 2);
  }
  const gnri = albumin_g_per_L && weight_kg && height_cm ? (1.489 * albumin_g_per_L) + (41.7 * weight_kg / (22 * (height_m! ** 2))) : undefined;
  // Limiares de risco de sarcopenia
  let sarcopenia = false;
  if (smi !== undefined && gender !== undefined) {
    if (gender === 1) { // Homem
      sarcopenia = smi < 7.0;
    } else { // Mulher
      sarcopenia = smi < 5.7;
    }
  }
  // Riscos
  const risks = {
    cardiovascular: whtR !== undefined && whtR > 0.5,
    magreza: bri !== undefined && bri < 3.4,
    obesidade_visceral: bri !== undefined && bri > 6.9,
    sarcopenia,
    metabolic_syndrome: visceral_fat_rating !== undefined && visceral_fat_rating > 12
  };
  return { whtR, bri, absi, whr, bai, gnri, smi, lms, ffmi, risks };
}

// Função utilitária para renderizar régua colorida
function RiskGauge({ value, min, max, greenMin, greenMax, yellowMin, yellowMax, redMin, redMax, step = 0.01, labelMin, labelMax, unit }) {
  if (value === undefined || isNaN(value)) return null;
  // Clamp value
  const clamped = Math.max(min, Math.min(max, value));
  const percent = ((clamped - min) / (max - min)) * 100;
  // Gradiente solicitado para as réguas (mais escuro)
  // De: #fad7ad (laranja claro) para: #abeebd (verde claro)
  let bg = 'from-[#fad7ad] to-[#abeebd]';
  return (
    <div className="mt-2">
      <div className={`relative h-3 rounded-full bg-gradient-to-r ${bg}`} style={{width: '100%'}}>
        <div style={{ left: `calc(${percent}% - 8px)` }} className="absolute top-1/2 -translate-y-1/2">
          <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labelMin ?? min}</span>
        <span>{labelMax ?? max} {unit}</span>
      </div>
    </div>
  );
}

function useSupabaseImage(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
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
  }, [path]);
  return url;
}

function getProfilePhotoUrl(profile_photo_url: string | null | undefined) {
  if (!profile_photo_url) return undefined;
  if (profile_photo_url.startsWith('http')) return profile_photo_url;
  return `https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/${profile_photo_url}`;
}

function getBarColor(type, isLast) {
  if (type === 'gordura') return isLast ? '#fdba74' : '#fff7ed';
  if (type === 'musculo') return isLast ? '#a78bfa' : '#faf5ff';
  return '#e5e7eb';
}

// Classificação de Gordura Corporal Segmentada (%)
function classifyFatSegmentPercent(segment: 'arm' | 'leg' | 'trunk' | 'total', value?: number, gender?: number) {
  if (value === undefined || value === null || isNaN(Number(value))) return '-';
  const v = Number(value);
  const isFemale = gender === 0; // 0 = Feminino, 1 = Masculino
  switch (segment) {
    case 'arm':
      if (isFemale) return v < 18 ? 'Baixo' : (v <= 28 ? 'Adequado' : 'Alto');
      return v < 8 ? 'Baixo' : (v <= 18 ? 'Adequado' : 'Alto');
    case 'leg':
      if (isFemale) return v < 18 ? 'Baixo' : (v <= 28 ? 'Adequado' : 'Alto');
      return v < 10 ? 'Baixo' : (v <= 20 ? 'Adequado' : 'Alto');
    case 'trunk':
      if (isFemale) return v < 22 ? 'Baixo' : (v <= 30 ? 'Adequado' : 'Alto');
      return v < 12 ? 'Baixo' : (v <= 22 ? 'Adequado' : 'Alto');
    case 'total':
      if (isFemale) return v < 20 ? 'Baixo' : (v <= 30 ? 'Adequado' : 'Alto');
      return v < 10 ? 'Baixo' : (v <= 20 ? 'Adequado' : 'Alto');
    default:
      return '-';
  }
}

// Classificação de Massa Muscular Segmentada (kg)
function classifyMuscleSegmentKg(segment: 'arm' | 'leg' | 'trunk' | 'total', kg?: number, gender?: number) {
  if (kg === undefined || kg === null || isNaN(Number(kg))) return '-';
  const v = Number(kg);
  const isFemale = gender === 0; // 0 = Feminino, 1 = Masculino
  switch (segment) {
    case 'arm':
      // cada braço
      return isFemale ? (v < 2.0 ? 'Baixo' : 'Adequado') : (v < 3.0 ? 'Baixo' : 'Adequado');
    case 'leg':
      // cada perna
      return isFemale ? (v < 7.0 ? 'Baixo' : 'Adequado') : (v < 9.0 ? 'Baixo' : 'Adequado');
    case 'trunk':
      return isFemale ? (v < 24.0 ? 'Baixo' : 'Adequado') : (v < 28.0 ? 'Baixo' : 'Adequado');
    case 'total':
      // total usa percentuais (mW%)
      return '-';
    default:
      return '-';
  }
}

const PatientProfile = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: patient, isLoading: patientLoading, error: patientError } = usePatient(id!);
  const { scaleMeasurements, manualMeasurements, isLoading: measurementsLoading } = usePatientMeasurements(id!);
  const { data: bodyPhotos = [] } = useBodyPhotos(id!);
  
  // Blood tests hooks
  const { data: bloodTests = [], isLoading: bloodTestsLoading, error: bloodTestsError } = usePatientBloodTests(id!);
  const createBloodTestMutation = useCreateBloodTest();
  const updateBloodTestMutation = useUpdateBloodTest();
  const deleteBloodTestMutation = useDeleteBloodTest();
  
  // Debug logs
  console.log('Blood tests data:', bloodTests);
  console.log('Blood tests loading:', bloodTestsLoading);
  console.log('Blood tests error:', bloodTestsError);
  
  const [editingManual, setEditingManual] = useState<any | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [selectedCompareIndex1, setSelectedCompareIndex1] = useState(0);
  const [selectedCompareIndex2, setSelectedCompareIndex2] = useState(1);
  
  // Blood tests states
  const [showBloodTestForm, setShowBloodTestForm] = useState(false);
  const [editingBloodTest, setEditingBloodTest] = useState<BloodTest | null>(null);

  // Foto de perfil: garantir ordem dos hooks e valor estável
  const profilePhotoPath = patient && patient.profile_photo_url && !patient.profile_photo_url.startsWith('http')
    ? patient.profile_photo_url
    : null;
  const supabaseProfilePhotoBlobUrl = useSupabaseImage(profilePhotoPath);
  const publicProfilePhotoUrl = patient && patient.profile_photo_url && patient.profile_photo_url.startsWith('http')
    ? patient.profile_photo_url
    : null;

  // NOVO: flags para loading/erro
  const isLoading = patientLoading;
  const isError = patientError || !patient;

  const getAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Number(age);
  };

  const getGenderText = (gender: number) => {
    return gender === 0 ? 'Feminino' : 'Masculino';
  };

  const getActivityLevelText = (level: number) => {
    const levels = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
    return levels[level] || 'Não informado';
  };

  const latestMeasurement = scaleMeasurements[0];

  // Prepare timeline data - combine both manual and scale measurements
  const combinedMeasurements = [
    ...scaleMeasurements.map(measurement => ({
      date: measurement.timestamp,
      type: 'scale' as const,
      data: {
        weight: Number(measurement.weight) || 0,
        bmi: Number(measurement.bmi) || 0,
        bodyFat: Number(measurement.body_fat_percent) || 0,
        muscle: Number(measurement.muscle_mass_percent_total) || 0,
        water: Number(measurement.water_percent) || 0,
        visceralFat: Number(measurement.visceral_fat_rating) || 0,
        bone: Number(measurement.bone_mass_kg) || 0
      }
    })),
    ...manualMeasurements.map(measurement => {
      const data: any = {};
      if (measurement.waist_cm) data.waist = Number(measurement.waist_cm);
      if (measurement.abdomen_cm) data.abdomen = Number(measurement.abdomen_cm);
      if (measurement.arm_right_cm) data.arm_right = Number(measurement.arm_right_cm);
      if (measurement.arm_left_cm) data.arm_left = Number(measurement.arm_left_cm);
      if (measurement.thorax_cm) data.thorax = Number(measurement.thorax_cm);
      if (measurement.hip_cm) data.hip = Number(measurement.hip_cm);
      if (measurement.thigh_right_cm) data.thigh_right = Number(measurement.thigh_right_cm);
      if (measurement.thigh_left_cm) data.thigh_left = Number(measurement.thigh_left_cm);
      if (measurement.calf_right_cm) data.calf_right = Number(measurement.calf_right_cm);
      if (measurement.calf_left_cm) data.calf_left = Number(measurement.calf_left_cm);
      if (measurement.notes) data.observations = measurement.notes;
      return {
        id: measurement.id,
        date: measurement.timestamp,
        type: 'manual' as const,
        data
      };
    })
  ];

  const handleDeleteManual = async (measurement: any) => {
    if (measurement.type === 'manual' && measurement.id) {
      const { error } = await supabase
        .from('manual_measurements')
        .delete()
        .eq('id', measurement.id);
      
      if (error) {
        alert('Erro ao excluir medição: ' + error.message);
        return;
      }
      
      queryClient.invalidateQueries({ queryKey: ['manual-measurements', id] });
      alert('Medição excluída com sucesso!');
    }
  };

  // Blood tests handlers
  const handleDeleteBloodTest = async (testId: string) => {
    if (confirm('Tem certeza que deseja excluir este exame de sangue?')) {
      try {
        await deleteBloodTestMutation.mutateAsync(testId);
        alert('Exame excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir exame:', error);
        alert('Erro ao excluir exame. Tente novamente.');
      }
    }
  };

  // Adicione antes do chartData:
  const metricOptions = [
    { key: 'weight', label: 'Peso (kg)' },
    { key: 'bodyFat', label: 'Gordura (%)' },
    { key: 'muscle', label: 'Músculo (%)' },
    { key: 'waist', label: 'Cintura (cm)' },
    { key: 'abdomen', label: 'Abdômen (cm)' },
  ];
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>(['weight', 'bodyFat', 'muscle']);

  // Adicione antes do chartData:
  const [selectedMeasurementIndex, setSelectedMeasurementIndex] = React.useState(0);

  // Atualize o selectedMeasurementIndex quando scaleMeasurements mudar (default: mais recente)
  React.useEffect(() => {
    setSelectedMeasurementIndex(0);
  }, [scaleMeasurements]);

  // Medição selecionada
  const selectedMeasurement = scaleMeasurements[selectedMeasurementIndex] || scaleMeasurements[0];

  // Atualize chartData para incluir cintura e abdômen:
  const chartData = React.useMemo(() => {
    // Ordenar medições manuais por data ascendente
    const sortedManuals = [...manualMeasurements]
      .filter(m => m.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return scaleMeasurements
      .filter(m => m.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(m => {
        const date = m.timestamp ? new Date(m.timestamp).toLocaleDateString('pt-BR') : '';
        // Buscar a última medição manual anterior ou igual à data da balança
        let lastManual = null;
        for (let i = 0; i < sortedManuals.length; i++) {
          if (new Date(sortedManuals[i].timestamp).getTime() <= new Date(m.timestamp).getTime()) {
            lastManual = sortedManuals[i];
          } else {
            break;
          }
        }
        return {
          date,
        weight: Number(m.weight) || null,
        bodyFat: Number(m.body_fat_percent) || null,
        muscle: Number(m.muscle_mass_percent_total) || null,
          waist: lastManual && lastManual.waist_cm !== undefined ? Number(lastManual.waist_cm) : null,
          abdomen: lastManual && lastManual.abdomen_cm !== undefined ? Number(lastManual.abdomen_cm) : null,
        };
      });
  }, [scaleMeasurements, manualMeasurements]);

  const profilePhotoBlobUrl = useSupabaseImage(patient && patient.profile_photo_url ? (
    patient.profile_photo_url.startsWith('http')
      ? patient.profile_photo_url.replace('https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/', '')
      : patient.profile_photo_url
  ) : null);

  // Gere um array de datas únicas (string) apenas das medições da balança (scaleMeasurements):
  const uniqueScaleDateStrings = Array.from(
    new Set(
      scaleMeasurements
        .filter(m => m.timestamp)
        .map(m => new Date(m.timestamp).toLocaleDateString('pt-BR'))
    )
  ).sort((a, b) => {
    // Ordenar datas string pt-BR decrescente
    const [da, ma, ya] = a.split('/').map(Number);
    const [db, mb, yb] = b.split('/').map(Number);
    return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
  });

  // RENDER PRINCIPAL
  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">Erro ao carregar dados do paciente</div>
          <button 
            onClick={() => window.location.reload()}
            className="text-green-600 hover:text-green-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
      {/* Patient Header */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start space-x-6">
          <div className="relative">
            {patient && patient.profile_photo_url ? (
                <img
                    src={profilePhotoBlobUrl}
                  alt={patient.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-green-200"
                />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
            )}
            <div className="absolute -bottom-2 -right-2">
              <ProfilePhotoUploader patientId={patient.id} />
            </div>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{patient.name}</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{getAge(patient.birth_date)} anos</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>{getGenderText(patient.gender)}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <Ruler className="h-4 w-4" />
                <span>{patient.height_cm} cm</span>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <Activity className="h-4 w-4" />
                <span>{getActivityLevelText(patient.activity_level)}</span>
              </div>
            </div>
            
            {patient.email && (
              <p className="text-gray-600 mt-2">{patient.email}</p>
            )}
            
            {patient.athlete_mode && (
              <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-2">
                Modo Atleta
              </span>
            )}
          </div>
          </div>
          <div className="sm:ml-6">
            <button
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              onClick={async () => {
                const history = scaleMeasurements
                  .slice()
                  .reverse()
                  .map(m => ({
                    date: m.timestamp,
                    weight: Number(m.weight) || undefined,
                    bodyFat: m.body_fat_percent != null ? Number(m.body_fat_percent) : undefined,
                    muscle: m.muscle_mass_percent_total != null ? Number(m.muscle_mass_percent_total) : undefined,
                  }));
                // Buscar URLs da primeira e última foto (se existirem)
                const firstPhoto = bodyPhotos[bodyPhotos.length - 1];
                const lastPhoto = bodyPhotos[0];
                const toPublicUrl = (p: any | undefined) => {
                  if (!p) return undefined;
                  const url = p.photo_url as string;
                  return url.startsWith('http') ? url : `https://deoxrdicmklsgaqzsybm.supabase.co/storage/v1/object/public/patient-photos/${url}`;
                };
                await generatePatientReport({
                  patient: {
                    id: patient.id,
                    name: patient.name,
                    birth_date: patient.birth_date,
                    gender: patient.gender,
                    height_cm: patient.height_cm,
                    email: patient.email,
                    athlete_mode: patient.athlete_mode,
                  },
                  history,
                  latestScale: latestMeasurement ? {
                    timestamp: latestMeasurement.timestamp,
                    weight: latestMeasurement.weight,
                    bmi: latestMeasurement.bmi,
                    body_fat_percent: latestMeasurement.body_fat_percent,
                    water_percent: latestMeasurement.water_percent,
                    muscle_mass_percent_total: latestMeasurement.muscle_mass_percent_total,
                    visceral_fat_rating: latestMeasurement.visceral_fat_rating,
                    bone_mass_kg: latestMeasurement.bone_mass_kg,
                  } : undefined,
                  scaleHistoryFull: scaleMeasurements || [],
                  manualHistoryFull: manualMeasurements || [],
                  bloodTests: bloodTests || [],
                });
              }}
            >
              <FileDown className="h-4 w-4" />
              Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Evolução Gráfica */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Evolução Gráfica</h2>
            {/* Caixa de seleção de métricas */}
            <div className="flex flex-wrap gap-4 mb-4">
              {metricOptions.map(opt => (
                <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(opt.key)}
                    onChange={e => {
                      setSelectedMetrics(sel => {
                        const newSelection = e.target.checked
                          ? [...sel, opt.key]
                          : sel.filter(k => k !== opt.key);
                        
                        // Garantir que a ordem sempre siga metricOptions
                        return metricOptions
                          .map(option => option.key)
                          .filter(key => newSelection.includes(key));
                      });
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} width={40} domain={[0, 120]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} width={40} domain={[0, 120]} tickCount={13} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="bg-white p-2 rounded shadow text-xs">
                          <div className="font-bold mb-1">{label}</div>
                          {metricOptions.filter(opt => selectedMetrics.includes(opt.key)).map(opt => {
                            const p = payload.find(pl => pl.dataKey === opt.key);
                            return p && p.value != null ? (
                              <div key={opt.key} className="flex justify-between gap-2">
                                <span>{opt.label}:</span>
                                <span className="font-mono">{p.value}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      );
                    }}
                  />
              <Legend />
                  {selectedMetrics.map(metricKey => {
                    const option = metricOptions.find(opt => opt.key === metricKey);
                    if (!option) return null;
                    
                    switch (option.key) {
                      case 'weight':
                        return <Bar key="weight" yAxisId="left" dataKey="weight" name="Peso (kg)" fill="#a4d7f1" barSize={20} />;
                      case 'bodyFat':
                        return <Bar key="bodyFat" yAxisId="right" dataKey="bodyFat" name="Gordura (%)" fill="#338fb1" barSize={20} />;
                      case 'muscle':
                        return <Bar key="muscle" yAxisId="right" dataKey="muscle" name="Músculo (%)" fill="#EE827A" barSize={20} />;
                      case 'waist':
                        return <Bar key="waist" yAxisId="left" dataKey="waist" name="Cintura (cm)" fill="#77C282" barSize={20} />;
                      case 'abdomen':
                        return <Bar key="abdomen" yAxisId="left" dataKey="abdomen" name="Abdômen (cm)" fill="#FFDAC3" barSize={20} />;
                      default:
                        return null;
                    }
                  })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latest Measurements */}
          {selectedMeasurement && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Medições</h2>
              {/* Timeline de seleção de data de medição */}
              <div className="w-full flex flex-col items-center my-4">
                <div className="w-full -mx-4 px-4 overflow-x-auto pb-2">
                  <div className="flex flex-row items-center gap-3 pr-4 snap-x snap-mandatory">
                  {scaleMeasurements.map((m, idx) => (
                    <button
                      key={m.id}
                      className={`flex flex-col items-center focus:outline-none snap-start ${selectedMeasurementIndex === idx ? 'text-green-700 font-bold' : 'text-gray-600'}`}
                      onClick={() => setSelectedMeasurementIndex(idx)}
                    >
                      <div className={`w-4 h-4 rounded-full mb-1 border-2 ${selectedMeasurementIndex === idx ? 'bg-green-500 border-green-700' : 'bg-gray-300 border-gray-400'}`}></div>
                      <span className="text-xs whitespace-nowrap">{m.timestamp ? new Date(m.timestamp).toLocaleDateString('pt-BR') : '-'}</span>
                    </button>
                  ))}
                  </div>
                </div>
                <div className="w-full h-px bg-gray-200 mt-1" />
              </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{Number(selectedMeasurement.weight).toFixed(1)}</p>
              <p className="text-sm text-gray-600">Peso (kg)</p>
            </div>
                {selectedMeasurement.bmi && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{Number(selectedMeasurement.bmi).toFixed(1)}</p>
                <p className="text-sm text-gray-600">IMC</p>
              </div>
            )}
                {selectedMeasurement.body_fat_percent && (
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{Number(selectedMeasurement.body_fat_percent).toFixed(1)}%</p>
                    {selectedMeasurement.weight && (
                      <p className="text-sm text-orange-700 font-semibold">{(Number(selectedMeasurement.weight) * Number(selectedMeasurement.body_fat_percent) / 100).toFixed(1)} kg</p>
                    )}
                <p className="text-sm text-gray-600">Gordura</p>
              </div>
            )}
                {selectedMeasurement.muscle_mass_percent_total && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{Number(selectedMeasurement.muscle_mass_percent_total).toFixed(1)}%</p>
                    {selectedMeasurement.weight && (
                      <p className="text-sm text-purple-700 font-semibold">{(Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_mass_percent_total) / 100).toFixed(1)} kg</p>
                    )}
                <p className="text-sm text-gray-600">Músculo</p>
              </div>
            )}
                {selectedMeasurement.water_percent && (
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-600">{Number(selectedMeasurement.water_percent).toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Água</p>
              </div>
            )}
                {selectedMeasurement.visceral_fat_rating !== undefined && (
              <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{Number(selectedMeasurement.visceral_fat_rating)}</p>
                    <p className="text-sm text-gray-600">G. Visceral <span className={Number(selectedMeasurement.visceral_fat_rating) >= 13 ? 'text-red-600 font-bold' : 'text-green-600'}>({Number(selectedMeasurement.visceral_fat_rating) >= 13 ? 'Excessivo' : 'Saudável'})</span></p>
              </div>
            )}
          </div>

              {/* Saúde metabólica, hidratação, óssea, DCI, idade metabólica */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-[#f0fdf4] rounded-lg p-3">
                  <span className="font-bold">Idade Metabólica:</span> {selectedMeasurement.metabolic_age !== undefined ? Number(selectedMeasurement.metabolic_age) : '-'} {patient.birth_date && selectedMeasurement.metabolic_age !== undefined && !isNaN(Number(selectedMeasurement.metabolic_age)) && (
                    <span className={Number(selectedMeasurement.metabolic_age) > getAge(patient.birth_date) ? 'text-red-600 font-bold' : 'text-green-600'}>
                      ({Number(selectedMeasurement.metabolic_age) > getAge(patient.birth_date) ? 'Elevada' : 'Ok'})
                    </span>
                  )}
                </div>
                <div className="bg-[#f0fdf4] rounded-lg p-3">
                  <span className="font-bold">Água Total:</span> {selectedMeasurement.water_percent ?? '-'}%
                </div>
                <div className="bg-[#f0fdf4] rounded-lg p-3">
                  <span className="font-bold">Massa Óssea:</span> {selectedMeasurement.bone_mass_kg ?? '-'} kg
                </div>
                <div className="bg-[#f0fdf4] rounded-lg p-3">
                  <span className="font-bold">DCI:</span> {selectedMeasurement.daily_calorie_maintenance ?? '-'} kcal
                </div>
              </div>

              {(() => {
                const lastManual = manualMeasurements && manualMeasurements.length > 0 ? manualMeasurements[0] : undefined;
                if (!lastManual) return null;
                return (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-[#f0fcf4] rounded-lg p-3">
                      <span className="font-bold">Cintura:</span> {lastManual.waist_cm ? Number(lastManual.waist_cm) + ' cm' : '-'}
                    </div>
                    <div className="bg-[#f0fcf4] rounded-lg p-3">
                      <span className="font-bold">Abdômen:</span> {lastManual.abdomen_cm ? Number(lastManual.abdomen_cm) + ' cm' : '-'}
                    </div>
                    <div className="bg-[#f0fcf4] rounded-lg p-3">
                      <span className="font-bold">Tórax:</span> {lastManual.thorax_cm ? Number(lastManual.thorax_cm) + ' cm' : '-'}
                    </div>
                    <div className="bg-[#f0fcf4] rounded-lg p-3">
                      <span className="font-bold">Quadril:</span> {lastManual.hip_cm ? Number(lastManual.hip_cm) + ' cm' : '-'}
                    </div>
                  </div>
                );
              })()}

              

        {/* Análise Segmentada: Gordura e Músculo */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Gordura */}
          <div
            className="relative rounded-xl border border-gray-100 shadow-lg overflow-hidden h-64"
            style={{
              backgroundImage: "url(/gordura.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Overlay de rótulos */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Left - Braço Esq. */}
              <div className="absolute top-2 left-2 text-[#ea580c] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Gordura Braço Esq.</div>
                <div>
                  {selectedMeasurement?.fat_arm_left != null
                    ? `${Number(selectedMeasurement.fat_arm_left)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.fat_arm_left) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-orange-700">Classificação: {classifyFatSegmentPercent('arm', selectedMeasurement?.fat_arm_left != null ? Number(selectedMeasurement.fat_arm_left) : undefined, patient?.gender)}</div>
              </div>
              {/* Top Right - Braço Dir. */}
              <div className="absolute top-2 right-2 text-right text-[#ea580c] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Gordura Braço Dir.</div>
                <div>
                  {selectedMeasurement?.fat_arm_right != null
                    ? `${Number(selectedMeasurement.fat_arm_right)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.fat_arm_right) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-orange-700">Classificação: {classifyFatSegmentPercent('arm', selectedMeasurement?.fat_arm_right != null ? Number(selectedMeasurement.fat_arm_right) : undefined, patient?.gender)}</div>
              </div>
              {/* Bottom Left - Perna Esq. */}
              <div className="absolute bottom-2 left-2 text-[#ea580c] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Gordura Perna Esq.</div>
                <div>
                  {selectedMeasurement?.fat_leg_left != null
                    ? `${Number(selectedMeasurement.fat_leg_left)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.fat_leg_left) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-orange-700">Classificação: {classifyFatSegmentPercent('leg', selectedMeasurement?.fat_leg_left != null ? Number(selectedMeasurement.fat_leg_left) : undefined, patient?.gender)}</div>
              </div>
              {/* Bottom Right - Perna Dir. */}
              <div className="absolute bottom-2 right-2 text-right text-[#ea580c] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Gordura Perna Dir.</div>
                <div>
                  {selectedMeasurement?.fat_leg_right != null
                    ? `${Number(selectedMeasurement.fat_leg_right)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.fat_leg_right) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-orange-700">Classificação: {classifyFatSegmentPercent('leg', selectedMeasurement?.fat_leg_right != null ? Number(selectedMeasurement.fat_leg_right) : undefined, patient?.gender)}</div>
              </div>
              {/* Center - Tronco */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[#ea580c] text-sm md:text-base font-semibold leading-tight">
                <div>Gordura Tronco</div>
                <div>
                  {selectedMeasurement?.fat_trunk != null
                    ? `${Number(selectedMeasurement.fat_trunk)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.fat_trunk) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-orange-700">Classificação: {classifyFatSegmentPercent('trunk', selectedMeasurement?.fat_trunk != null ? Number(selectedMeasurement.fat_trunk) : undefined, patient?.gender)}</div>
              </div>
            </div>
          </div>

          {/* Card Músculo */}
          <div
            className="relative rounded-xl border border-gray-100 shadow-lg overflow-hidden h-64"
            style={{
              backgroundImage: "url(/musculo.png)",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Overlay de rótulos */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Left - Braço Esq. */}
              <div className="absolute top-2 left-2 text-[#2563eb] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Músculo Braço Esq.</div>
                <div>
                  {selectedMeasurement?.muscle_arm_left != null
                    ? `${Number(selectedMeasurement.muscle_arm_left)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_arm_left) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-blue-700">Classificação: {classifyMuscleSegmentKg('arm', selectedMeasurement?.weight != null && selectedMeasurement?.muscle_arm_left != null ? (Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_arm_left) / 100) : undefined, patient?.gender)}</div>
              </div>
              {/* Top Right - Braço Dir. */}
              <div className="absolute top-2 right-2 text-right text-[#2563eb] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Músculo Braço Dir.</div>
                <div>
                  {selectedMeasurement?.muscle_arm_right != null
                    ? `${Number(selectedMeasurement.muscle_arm_right)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_arm_right) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-blue-700">Classificação: {classifyMuscleSegmentKg('arm', selectedMeasurement?.weight != null && selectedMeasurement?.muscle_arm_right != null ? (Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_arm_right) / 100) : undefined, patient?.gender)}</div>
              </div>
              {/* Bottom Left - Perna Esq. */}
              <div className="absolute bottom-2 left-2 text-[#2563eb] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Músculo Perna Esq.</div>
                <div>
                  {selectedMeasurement?.muscle_leg_left != null
                    ? `${Number(selectedMeasurement.muscle_leg_left)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_leg_left) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-blue-700">Classificação: {classifyMuscleSegmentKg('leg', selectedMeasurement?.weight != null && selectedMeasurement?.muscle_leg_left != null ? (Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_leg_left) / 100) : undefined, patient?.gender)}</div>
              </div>
              {/* Bottom Right - Perna Dir. */}
              <div className="absolute bottom-2 right-2 text-right text-[#2563eb] text-xs md:text-sm font-semibold leading-tight max-w-[46%]">
                <div>Músculo Perna Dir.</div>
                <div>
                  {selectedMeasurement?.muscle_leg_right != null
                    ? `${Number(selectedMeasurement.muscle_leg_right)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_leg_right) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-blue-700">Classificação: {classifyMuscleSegmentKg('leg', selectedMeasurement?.weight != null && selectedMeasurement?.muscle_leg_right != null ? (Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_leg_right) / 100) : undefined, patient?.gender)}</div>
              </div>
              {/* Center - Tronco */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-[#2563eb] text-sm md:text-base font-semibold leading-tight">
                <div>Músculo Tronco</div>
                <div>
                  {selectedMeasurement?.muscle_trunk != null
                    ? `${Number(selectedMeasurement.muscle_trunk)}%${selectedMeasurement?.weight != null ? ` (${(Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_trunk) / 100).toFixed(1)} kg)` : ''}`
                    : '-'}
                </div>
                <div className="text-[10px] md:text-xs font-medium text-blue-700">Classificação: {classifyMuscleSegmentKg('trunk', selectedMeasurement?.weight != null && selectedMeasurement?.muscle_trunk != null ? (Number(selectedMeasurement.weight) * Number(selectedMeasurement.muscle_trunk) / 100) : undefined, patient?.gender)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas de Risco e Saúde Avançadas */}
        {(() => {
          // Buscar última medição manual válida para cintura
          const latestManualWithWaist = manualMeasurements.find(m => Number(m.waist_cm) > 0);
          const latestManualWithWaistAndHip = manualMeasurements.find(m => m.waist_cm && !isNaN(Number(m.waist_cm)) && m.hip_cm && !isNaN(Number(m.hip_cm)));
          const waist = latestManualWithWaist ? Number(latestManualWithWaist.waist_cm) : undefined;
          const hip = latestManualWithWaistAndHip ? Number(latestManualWithWaistAndHip.hip_cm) : undefined;
          const height = patient.height_cm ? Number(patient.height_cm) : undefined;
                const weight = selectedMeasurement.weight ? Number(selectedMeasurement.weight) : undefined;
                const bmi = selectedMeasurement.bmi ? Number(selectedMeasurement.bmi) : undefined;
          const gender = patient.gender;
          const muscle_segments = {
                  arms: (selectedMeasurement.muscle_arm_right ?? 0) + (selectedMeasurement.muscle_arm_left ?? 0),
                  legs: (selectedMeasurement.muscle_leg_right ?? 0) + (selectedMeasurement.muscle_leg_left ?? 0),
                  trunk: selectedMeasurement.muscle_trunk ?? 0
                };
                const body_fat_percent = selectedMeasurement.body_fat_percent ? Number(selectedMeasurement.body_fat_percent) : undefined;
                const visceral_fat_rating = selectedMeasurement.visceral_fat_rating ? Number(selectedMeasurement.visceral_fat_rating) : undefined;
          // Forçar parse para garantir tipo Number e ponto decimal
          const waistNum = waist ? Number(String(waist).replace(',', '.')) : undefined;
          const heightNum = height ? Number(String(height).replace(',', '.')) : undefined;
          // Chamar função de cálculo
          const metrics = calculateHealthMetrics({
            waist_cm: waistNum,
            hip_cm: hip,
            height_cm: heightNum,
            weight_kg: weight,
            bmi,
            muscle_segments,
            body_fat_percent,
                  visceral_fat_rating,
                  gender,
                  muscle_percent: selectedMeasurement.muscle_mass_percent_total ? Number(selectedMeasurement.muscle_mass_percent_total) : undefined
          });
          return (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Métricas de Risco e Saúde</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">WHtR:</span>
                        {metrics.whtR !== undefined ? metrics.whtR.toFixed(2) : '-'} {metrics.risks.cardiovascular && <span className="text-red-600 font-bold">(Risco ↑)</span>}
                  <div className="text-xs text-gray-500">Relação Cintura-Altura</div>
                  <RiskGauge value={metrics.whtR} min={0.3} max={0.7} greenMin={0.4} greenMax={0.5} yellowMin={0.5} yellowMax={0.55} redMin={0.55} redMax={0.7} labelMin="0.3" labelMax="0.7" unit="" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">BRI:</span>
                        {metrics.bri !== undefined && !isNaN(metrics.bri) ? metrics.bri.toFixed(2) : '-'}
                  {metrics.risks.magreza && <span className="text-yellow-600 font-bold ml-1">(Magreza/Sarcopenia)</span>}
                  {metrics.risks.obesidade_visceral && <span className="text-red-600 font-bold ml-1">(Obesidade Visceral)</span>}
                  <div className="text-xs text-gray-500">Índice de Redondeza Corporal</div>
                  <RiskGauge value={metrics.bri} min={2} max={8} greenMin={3.4} greenMax={6.9} yellowMin={2} yellowMax={3.4} redMin={6.9} redMax={8} labelMin="2" labelMax="8" unit="" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">ABSI:</span>
                        {metrics.absi !== undefined ? metrics.absi.toFixed(4) : '-'}
                  <div className="text-xs text-gray-500">Índice de Forma Corporal Ajustado</div>
                  <RiskGauge value={metrics.absi} min={0.06} max={0.09} greenMin={0.07} greenMax={0.08} yellowMin={0.08} yellowMax={0.085} redMin={0.085} redMax={0.09} labelMin="0.06" labelMax="0.09" unit="" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">WHR:</span>
                        {metrics.whr !== undefined ? metrics.whr.toFixed(2) : '-'} {metrics.whr !== undefined && ((gender === 1 && metrics.whr >= 0.9) || (gender === 0 && metrics.whr >= 0.85)) && <span className="text-red-600 font-bold">(Risco ↑)</span>}
                  <div className="text-xs text-gray-500">Relação Cintura-Quadril</div>
                        <RiskGauge value={metrics.whr} min={0.6} max={1} greenMin={0.8} greenMax={0.9} yellowMin={0.9} yellowMax={1.0} redMin={1.0} redMax={1.2} labelMin="0.6" labelMax="1" unit="" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">BAI:</span>
                        {metrics.bai !== undefined ? metrics.bai.toFixed(2) : '-'}
                  <div className="text-xs text-gray-500">Índice de Adiposidade Corporal</div>
                  <RiskGauge value={metrics.bai} min={10} max={40} greenMin={18} greenMax={25} yellowMin={25} yellowMax={30} redMin={30} redMax={40} labelMin="10" labelMax="40" unit="%" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">SMI:</span>
                        {metrics.smi !== undefined ? metrics.smi.toFixed(2) : '-'} {metrics.risks.sarcopenia && <span className="text-red-600 font-bold">(Risco Sarcopenia)</span>}
                  <div className="text-xs text-gray-500">Índice Muscular Esquelético</div>
                  <RiskGauge value={metrics.smi} min={4} max={12} greenMin={7.5} greenMax={10} yellowMin={6.5} yellowMax={7.5} redMin={4} redMax={6.5} labelMin="4" labelMax="12" unit="" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">Leg Muscle Score:</span>
                        {metrics.lms !== undefined ? metrics.lms.toFixed(2) : '-'}
                  <div className="text-xs text-gray-500">Pontuação de Músculo de Perna</div>
                  <RiskGauge value={metrics.lms} min={10} max={40} greenMin={20} greenMax={30} yellowMin={15} yellowMax={20} redMin={10} redMax={15} labelMin="10" labelMax="40" unit="" />
                </div>
                      <div className="bg-[#f9fafb] rounded-lg p-3">
                        <span className="font-bold cursor-help">FFMI:</span>
                        {metrics.ffmi !== undefined ? metrics.ffmi.toFixed(2) : '-'}
                  <div className="text-xs text-gray-500">Índice de Massa Livre de Gordura</div>
                  <RiskGauge value={metrics.ffmi} min={12} max={28} greenMin={17} greenMax={22} yellowMin={22} yellowMax={25} redMin={25} redMax={28} labelMin="12" labelMax="28" unit="" />
                </div>
              </div>
            </div>
          );
        })()}
            </div>
          )}
          {/* Gráfico de barras verticais simples para comparar última e penúltima medição */}
          {scaleMeasurements.length > 1 && (
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Comparação de Gorduras e Músculos (kg)</h2>
                            {/* Seletor de datas para comparação */}
              <div className="w-full flex flex-col items-center my-4">
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    Selecione 2 datas para comparar. Clique em uma data para selecionar/deselecionar.
                  </p>
                </div>

                <div className="w-full -mx-4 px-4 overflow-x-auto pb-2">
                  <div className="flex flex-row items-center gap-3 pr-4 snap-x snap-mandatory">
                  {scaleMeasurements.map((m, idx) => (
                    <button
                      key={m.id + '-compare'}
                      className={`flex flex-col items-center focus:outline-none transition-colors ${
                        selectedCompareIndex1 === idx ? 'text-[#fdba74] font-bold' : 
                        selectedCompareIndex2 === idx ? 'text-[#a78bfa] font-bold' : 
                        'text-gray-600 hover:text-gray-800'
                      }`}
                      onClick={() => {
                        // Seleção livre: alterna entre as duas seleções
                        if (selectedCompareIndex1 === idx) {
                          setSelectedCompareIndex1(-1); // Deseleciona
                        } else if (selectedCompareIndex2 === idx) {
                          setSelectedCompareIndex2(-1); // Deseleciona
                        } else if (selectedCompareIndex1 === -1) {
                          setSelectedCompareIndex1(idx);
                        } else if (selectedCompareIndex2 === -1) {
                          setSelectedCompareIndex2(idx);
                        } else {
                          // Se ambas estão selecionadas, substitui a primeira
                          setSelectedCompareIndex1(idx);
                        }
                      }}
                      onContextMenu={e => {
                        e.preventDefault();
                        // Clique direito também seleciona
                        if (selectedCompareIndex1 === idx) {
                          setSelectedCompareIndex1(-1);
                        } else if (selectedCompareIndex2 === idx) {
                          setSelectedCompareIndex2(-1);
                        } else if (selectedCompareIndex1 === -1) {
                          setSelectedCompareIndex1(idx);
                        } else if (selectedCompareIndex2 === -1) {
                          setSelectedCompareIndex2(idx);
                        } else {
                          setSelectedCompareIndex2(idx);
                        }
                      }}
                    >
                      <div className={`w-4 h-4 rounded-full mb-1 border-2 transition-colors
                        ${selectedCompareIndex1 === idx ? 'bg-[#FFDAC3] border-[#FFDAC3]' :
                          selectedCompareIndex2 === idx ? 'bg-[#a4d7f1] border-[#a4d7f1]' :
                          'bg-gray-300 border-gray-400 hover:border-gray-500'}`}></div>
                      <span className="text-xs whitespace-nowrap">{m.timestamp ? new Date(m.timestamp).toLocaleDateString('pt-BR') : '-'}</span>
                    </button>
                  ))}
                  </div>
                </div>
                <div className="w-full h-px bg-gray-200 mt-1" />
                <div className="text-xs text-gray-500 mt-1 text-center">
                  <span className="mr-2"><span className="inline-block w-3 h-3 rounded-full bg-[#FFDAC3] border border-[#FFDAC3] align-middle mr-1"></span>1ª Seleção</span>
                  <span><span className="inline-block w-3 h-3 rounded-full bg-[#a4d7f1] border border-[#a4d7f1] align-middle mr-1"></span>2ª Seleção</span>
                </div>
              </div>
              {/* Gráficos lado a lado */}
              {selectedCompareIndex1 >= 0 && selectedCompareIndex2 >= 0 ? (
                <div className="flex flex-col md:flex-row gap-8 w-full">
                {/* Gráfico de Gorduras */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-orange-600 mb-2 text-center">Comparação de Gorduras</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={(() => {
                        const m1 = selectedCompareIndex1 >= 0 ? scaleMeasurements[selectedCompareIndex1] : null;
                        const m2 = selectedCompareIndex2 >= 0 ? scaleMeasurements[selectedCompareIndex2] : null;
                        if (!m1 || !m2) return [];
                        return [
                          {
                            name: 'Gordura Total',
                            data1: Number(m1.weight) * Number(m1.body_fat_percent) / 100,
                            data2: Number(m2.weight) * Number(m2.body_fat_percent) / 100,
                          },
                          {
                            name: 'Braço Direito',
                            data1: Number(m1.weight) * Number(m1.fat_arm_right) / 100,
                            data2: Number(m2.weight) * Number(m2.fat_arm_right) / 100,
                          },
                          {
                            name: 'Braço Esquerdo',
                            data1: Number(m1.weight) * Number(m1.fat_arm_left) / 100,
                            data2: Number(m2.weight) * Number(m2.fat_arm_left) / 100,
                          },
                          {
                            name: 'Perna Direita',
                            data1: Number(m1.weight) * Number(m1.fat_leg_right) / 100,
                            data2: Number(m2.weight) * Number(m2.fat_leg_right) / 100,
                          },
                          {
                            name: 'Perna Esquerda',
                            data1: Number(m1.weight) * Number(m1.fat_leg_left) / 100,
                            data2: Number(m2.weight) * Number(m2.fat_leg_left) / 100,
                          },
                          {
                            name: 'Tronco',
                            data1: Number(m1.weight) * Number(m1.fat_trunk) / 100,
                            data2: Number(m2.weight) * Number(m2.fat_trunk) / 100,
                          },
                        ];
                      })()}
                      margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length < 2) return null;
                        const data1 = Number(payload.find(p => p.dataKey === 'data1')?.value ?? 0);
                        const data2 = Number(payload.find(p => p.dataKey === 'data2')?.value ?? 0);
                        const diff = data1 - data2;
                        const m1 = selectedCompareIndex1 >= 0 ? scaleMeasurements[selectedCompareIndex1] : null;
                        const m2 = selectedCompareIndex2 >= 0 ? scaleMeasurements[selectedCompareIndex2] : null;
                        const date1 = m1?.timestamp ? new Date(m1.timestamp).toLocaleDateString('pt-BR') : '';
                        const date2 = m2?.timestamp ? new Date(m2.timestamp).toLocaleDateString('pt-BR') : '';
                        return (
                          <div className="bg-white p-2 rounded shadow text-xs">
                            <div className="font-bold mb-1">{label}</div>
                            <div>{date1}: <span className="font-mono">{data1.toFixed(1)} kg</span></div>
                            <div>{date2}: <span className="font-mono">{data2.toFixed(1)} kg</span></div>
                            <div>Diferença: <span className={diff > 0 ? 'text-red-600 font-bold' : diff < 0 ? 'text-green-600 font-bold' : ''}>{diff > 0 ? '+' : ''}{diff.toFixed(1)} kg</span></div>
                          </div>
                        );
                      }} />
                      <Bar dataKey="data2" name="2ª Data" fill="#a4d7f1" barSize={32} isAnimationActive={false} />
                      <Bar dataKey="data1" name="1ª Data" fill="#FFDAC3" barSize={32} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Gráfico de Músculos */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-[#2563ee] mb-2 text-center">Comparação de Músculos</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={(() => {
                        const m1 = selectedCompareIndex1 >= 0 ? scaleMeasurements[selectedCompareIndex1] : null;
                        const m2 = selectedCompareIndex2 >= 0 ? scaleMeasurements[selectedCompareIndex2] : null;
                        if (!m1 || !m2) return [];
                        return [
                          {
                            name: 'Músculo Total',
                            data1: Number(m1.weight) * Number(m1.muscle_mass_percent_total) / 100,
                            data2: Number(m2.weight) * Number(m2.muscle_mass_percent_total) / 100,
                          },
                          {
                            name: 'Braço Direito',
                            data1: Number(m1.weight) * Number(m1.muscle_arm_right) / 100,
                            data2: Number(m2.weight) * Number(m2.muscle_arm_right) / 100,
                          },
                          {
                            name: 'Braço Esquerdo',
                            data1: Number(m1.weight) * Number(m1.muscle_arm_left) / 100,
                            data2: Number(m2.weight) * Number(m2.muscle_arm_left) / 100,
                          },
                          {
                            name: 'Perna Direita',
                            data1: Number(m1.weight) * Number(m1.muscle_leg_right) / 100,
                            data2: Number(m2.weight) * Number(m2.muscle_leg_right) / 100,
                          },
                          {
                            name: 'Perna Esquerda',
                            data1: Number(m1.weight) * Number(m1.muscle_leg_left) / 100,
                            data2: Number(m2.weight) * Number(m2.muscle_leg_left) / 100,
                          },
                          {
                            name: 'Tronco',
                            data1: Number(m1.weight) * Number(m1.muscle_trunk) / 100,
                            data2: Number(m2.weight) * Number(m2.muscle_trunk) / 100,
                          },
                        ];
                      })()}
                      margin={{ top: 16, right: 24, left: 0, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length < 2) return null;
                        const data1 = Number(payload.find(p => p.dataKey === 'data1')?.value ?? 0);
                        const data2 = Number(payload.find(p => p.dataKey === 'data2')?.value ?? 0);
                        const diff = data1 - data2;
                        const m1 = selectedCompareIndex1 >= 0 ? scaleMeasurements[selectedCompareIndex1] : null;
                        const m2 = selectedCompareIndex2 >= 0 ? scaleMeasurements[selectedCompareIndex2] : null;
                        const date1 = m1?.timestamp ? new Date(m1.timestamp).toLocaleDateString('pt-BR') : '';
                        const date2 = m2?.timestamp ? new Date(m2.timestamp).toLocaleDateString('pt-BR') : '';
                        return (
                          <div className="bg-white p-2 rounded shadow text-xs">
                            <div className="font-bold mb-1">{label}</div>
                            <div>{date1}: <span className="font-mono">{data1.toFixed(1)} kg</span></div>
                            <div>{date2}: <span className="font-mono">{data2.toFixed(1)} kg</span></div>
                            <div>Diferença: <span className={diff > 0 ? 'text-green-600 font-bold' : diff < 0 ? 'text-red-600 font-bold' : ''}>{diff > 0 ? '+' : ''}{diff.toFixed(1)} kg</span></div>
                          </div>
                        );
                      }} />
                      <Bar dataKey="data2" name="2ª Data" fill="#a4d7f1" barSize={32} isAnimationActive={false} />
                      <Bar dataKey="data1" name="1ª Data" fill="#FFDAC3" barSize={32} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg mb-2">Selecione duas datas para comparar</p>
                  <p className="text-sm">Use o seletor acima para escolher quais medições comparar</p>
                </div>
              )}
            </div>
          )}
      {/* Body Photos Section */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        {/* Modal do uploader */}
        {showUploader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-xs font-semibold"
                onClick={() => setShowUploader(false)}
              >
                ✕ Fechar
              </button>
              <BodyPhotoUploader patientId={patient.id} onPhotosUploaded={() => setShowUploader(false)} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Galeria de Progresso</h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
            onClick={() => setShowUploader(true)}
          >
            Enviar Fotos
          </button>
        </div>
        <div className="w-full">
          <BodyPhotoGallery patientId={patient.id} />
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">Evolução</h2>
            <span className="text-gray-500 text-base md:text-lg mt-1 md:mt-0">Timeline de Medições</span>
          </div>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
            onClick={() => {
              setEditingManual(null);
              setShowManualForm(true);
            }}
          >
            Medição Manual
          </button>
        </div>
        <PatientTimeline 
          measurements={combinedMeasurements} 
          onEditManual={(measurement) => {
            if (measurement.type === 'manual') {
              setEditingManual(measurement);
              setShowManualForm(true);
            }
          }}
          onDeleteManual={handleDeleteManual}
        />
      </div>

      {/* Blood Tests */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
            <h2 className="text-xl font-semibold text-gray-800">Exames de Sangue</h2>
            <span className="text-gray-500 text-base md:text-lg mt-1 md:mt-0">Histórico de Exames Laboratoriais</span>
          </div>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
            onClick={() => {
              setShowBloodTestForm(true);
            }}
          >
            Novo Exame
          </button>
        </div>
        
        {/* Blood Tests Content */}
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-4 pr-2">
          {bloodTestsLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p>Carregando exames de sangue...</p>
            </div>
          ) : bloodTestsError ? (
            <div className="text-center py-8 text-red-500">
              <div className="mb-2">⚠️</div>
              <p>Erro ao carregar exames de sangue.</p>
              <p className="text-sm text-gray-500 mt-1">Tente recarregar a página.</p>
            </div>
          ) : bloodTests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">🩸</div>
              <p>Nenhum exame de sangue registrado ainda.</p>
              <p className="text-sm">Clique em "Novo Exame" para adicionar o primeiro exame.</p>
              <p className="text-xs text-blue-500 mt-2">Debug: Array length = {bloodTests.length}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bloodTests.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        Exame de {new Date(test.test_date).toLocaleDateString('pt-BR')}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {test.laboratory && `Laboratório: ${test.laboratory}`}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => {
                          setEditingBloodTest(test);
                          setShowBloodTestForm(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        onClick={() => handleDeleteBloodTest(test.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* Glicemia */}
                    {test.glucose && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Glicose</div>
                        <div className="font-medium">{test.glucose} mg/dL</div>
                      </div>
                    )}
                    {test.fasting_glucose && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Glicose em Jejum</div>
                        <div className="font-medium">{test.fasting_glucose} mg/dL</div>
                      </div>
                    )}
                    {test.hba1c && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">HbA1c</div>
                        <div className="font-medium">{test.hba1c}%</div>
                      </div>
                    )}
                    {test.fasting_insulin && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Insulina em Jejum</div>
                        <div className="font-medium">{test.fasting_insulin} μU/mL</div>
                      </div>
                    )}
                    
                    {/* Lipidograma */}
                    {test.cholesterol_total && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Colesterol Total</div>
                        <div className="font-medium">{test.cholesterol_total} mg/dL</div>
                      </div>
                    )}
                    {test.hdl && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">HDL</div>
                        <div className="font-medium">{test.hdl} mg/dL</div>
                      </div>
                    )}
                    {test.ldl && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">LDL</div>
                        <div className="font-medium">{test.ldl} mg/dL</div>
                      </div>
                    )}
                    {test.triglycerides && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Triglicerídeos</div>
                        <div className="font-medium">{test.triglycerides} mg/dL</div>
                      </div>
                    )}
                    {test.apolipoprotein_a && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Apolipoproteína A</div>
                        <div className="font-medium">{test.apolipoprotein_a} mg/dL</div>
                      </div>
                    )}
                    {test.apolipoprotein_b && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Apolipoproteína B</div>
                        <div className="font-medium">{test.apolipoprotein_b} mg/dL</div>
                      </div>
                    )}
                    
                    {/* Hemograma */}
                    {test.hemoglobin && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Hemoglobina</div>
                        <div className="font-medium">{test.hemoglobin} g/dL</div>
                      </div>
                    )}
                    {test.hematocrit && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Hematócrito</div>
                        <div className="font-medium">{test.hematocrit}%</div>
                      </div>
                    )}
                    {test.red_blood_cells && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Hemácias</div>
                        <div className="font-medium">{test.red_blood_cells} milhões/μL</div>
                      </div>
                    )}
                    {test.white_blood_cells && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Leucócitos</div>
                        <div className="font-medium">{test.white_blood_cells} /μL</div>
                      </div>
                    )}
                    {test.platelets && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Plaquetas</div>
                        <div className="font-medium">{test.platelets} /μL</div>
                      </div>
                    )}
                    
                    {/* Hormônios */}
                    {test.testosterone_total && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Testosterona Total</div>
                        <div className="font-medium">{test.testosterone_total} ng/dL</div>
                      </div>
                    )}
                    {test.testosterone_free && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Testosterona Livre</div>
                        <div className="font-medium">{test.testosterone_free} pg/mL</div>
                      </div>
                    )}
                    {test.shbg && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">SHBG</div>
                        <div className="font-medium">{test.shbg} nmol/L</div>
                      </div>
                    )}
                    {test.tsh && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">TSH</div>
                        <div className="font-medium">{test.tsh} μUI/mL</div>
                      </div>
                    )}
                    {test.t3 && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">T3</div>
                        <div className="font-medium">{test.t3} ng/dL</div>
                      </div>
                    )}
                    {test.t4 && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">T4</div>
                        <div className="font-medium">{test.t4} μg/dL</div>
                      </div>
                    )}
                    
                    {/* Função Renal */}
                    {test.creatinine && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Creatinina</div>
                        <div className="font-medium">{test.creatinine} mg/dL</div>
                      </div>
                    )}
                    {test.urea && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Ureia</div>
                        <div className="font-medium">{test.urea} mg/dL</div>
                      </div>
                    )}
                    
                    {/* Função Hepática */}
                    {test.tgo_ast && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">TGO/AST</div>
                        <div className="font-medium">{test.tgo_ast} U/L</div>
                      </div>
                    )}
                    {test.tgp_alt && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">TGP/ALT</div>
                        <div className="font-medium">{test.tgp_alt} U/L</div>
                      </div>
                    )}
                    {test.total_protein && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Proteínas Totais</div>
                        <div className="font-medium">{test.total_protein} g/dL</div>
                      </div>
                    )}
                    {test.albumin && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Albumina</div>
                        <div className="font-medium">{test.albumin} g/dL</div>
                      </div>
                    )}
                    
                    {/* Eletrólitos */}
                    {test.sodium && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Sódio</div>
                        <div className="font-medium">{test.sodium} mEq/L</div>
                      </div>
                    )}
                    {test.potassium && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Potássio</div>
                        <div className="font-medium">{test.potassium} mEq/L</div>
                      </div>
                    )}
                    {test.magnesium && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Magnésio</div>
                        <div className="font-medium">{test.magnesium} mg/dL</div>
                      </div>
                    )}
                    {test.phosphorus && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Fósforo</div>
                        <div className="font-medium">{test.phosphorus} mg/dL</div>
                      </div>
                    )}
                    
                    {/* Vitaminas e Metabolismo */}
                    {test.vitamin_d && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Vitamina D</div>
                        <div className="font-medium">{test.vitamin_d} ng/mL</div>
                      </div>
                    )}
                    {test.vitamin_b12 && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Vitamina B12</div>
                        <div className="font-medium">{test.vitamin_b12} pg/mL</div>
                      </div>
                    )}
                    {test.homocysteine && (
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-xs text-gray-500">Homocisteína</div>
                        <div className="font-medium">{test.homocysteine} μmol/L</div>
                      </div>
                    )}
                  </div>
                  
                  {test.notes && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <div className="text-xs text-blue-600 font-medium">Observações:</div>
                      <div className="text-sm text-blue-800">{test.notes}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Add/Edit Manual Measurement Form Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{editingManual ? 'Editar Medição' : 'Nova Medição'}</span>
              </h2>
              <button
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-xs font-semibold"
                onClick={() => {
                  setEditingManual(null);
                  setShowManualForm(false);
                }}
              >
                ✕ Fechar
              </button>
            </div>
            <MeasurementForm 
              patientId={patient.id} 
              editingManual={editingManual} 
              onFinishEdit={() => {
                setEditingManual(null);
                setShowManualForm(false);
              }}
              heightCm={patient.height_cm ? Number(patient.height_cm) : undefined}
            />
          </div>
        </div>
      )}

      {/* Add/Edit Blood Test Form Modal */}
      {showBloodTestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>{editingBloodTest ? 'Editar Exame' : 'Novo Exame de Sangue'}</span>
              </h2>
              <button
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 text-xs font-semibold"
                onClick={() => {
                  setEditingBloodTest(null);
                  setShowBloodTestForm(false);
                }}
              >
                ✕ Fechar
              </button>
            </div>
            
            {/* Blood Test Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              
              const bloodTestData = {
                patient_id: id!,
                test_date: formData.get('test_date') as string,
                laboratory: formData.get('laboratory') as string,
                // Hemograma
                hemoglobin: formData.get('hemoglobin') ? Number(formData.get('hemoglobin')) : null,
                hematocrit: formData.get('hematocrit') ? Number(formData.get('hematocrit')) : null,
                red_blood_cells: formData.get('red_blood_cells') ? Number(formData.get('red_blood_cells')) : null,
                white_blood_cells: formData.get('white_blood_cells') ? Number(formData.get('white_blood_cells')) : null,
                platelets: formData.get('platelets') ? Number(formData.get('platelets')) : null,
                // Hormônios
                testosterone_total: formData.get('testosterone_total') ? Number(formData.get('testosterone_total')) : null,
                testosterone_free: formData.get('testosterone_free') ? Number(formData.get('testosterone_free')) : null,
                shbg: formData.get('shbg') ? Number(formData.get('shbg')) : null,
                tsh: formData.get('tsh') ? Number(formData.get('tsh')) : null,
                t3: formData.get('t3') ? Number(formData.get('t3')) : null,
                t4: formData.get('t4') ? Number(formData.get('t4')) : null,
                // Lipidograma
                cholesterol_total: formData.get('cholesterol_total') ? Number(formData.get('cholesterol_total')) : null,
                hdl: formData.get('hdl') ? Number(formData.get('hdl')) : null,
                ldl: formData.get('ldl') ? Number(formData.get('ldl')) : null,
                triglycerides: formData.get('triglycerides') ? Number(formData.get('triglycerides')) : null,
                apolipoprotein_a: formData.get('apolipoprotein_a') ? Number(formData.get('apolipoprotein_a')) : null,
                apolipoprotein_b: formData.get('apolipoprotein_b') ? Number(formData.get('apolipoprotein_b')) : null,
                // Vitaminas
                vitamin_d: formData.get('vitamin_d') ? Number(formData.get('vitamin_d')) : null,
                vitamin_b12: formData.get('vitamin_b12') ? Number(formData.get('vitamin_b12')) : null,
                homocysteine: formData.get('homocysteine') ? Number(formData.get('homocysteine')) : null,
                // Função Renal
                creatinine: formData.get('creatinine') ? Number(formData.get('creatinine')) : null,
                urea: formData.get('urea') ? Number(formData.get('urea')) : null,
                // Função Hepática
                tgo_ast: formData.get('tgo_ast') ? Number(formData.get('tgo_ast')) : null,
                tgp_alt: formData.get('tgp_alt') ? Number(formData.get('tgp_alt')) : null,
                total_protein: formData.get('total_protein') ? Number(formData.get('total_protein')) : null,
                albumin: formData.get('albumin') ? Number(formData.get('albumin')) : null,
                // Eletrólitos
                sodium: formData.get('sodium') ? Number(formData.get('sodium')) : null,
                potassium: formData.get('potassium') ? Number(formData.get('potassium')) : null,
                magnesium: formData.get('magnesium') ? Number(formData.get('magnesium')) : null,
                phosphorus: formData.get('phosphorus') ? Number(formData.get('phosphorus')) : null,
                // Glicemia
                fasting_glucose: formData.get('fasting_glucose') ? Number(formData.get('fasting_glucose')) : null,
                hba1c: formData.get('hba1c') ? Number(formData.get('hba1c')) : null,
                fasting_insulin: formData.get('fasting_insulin') ? Number(formData.get('fasting_insulin')) : null,
                // Observações
                notes: formData.get('notes') as string || null
              };
              
              try {
                if (editingBloodTest) {
                  await updateBloodTestMutation.mutateAsync({
                    id: editingBloodTest.id,
                    ...bloodTestData
                  });
                  alert('Exame atualizado com sucesso!');
                } else {
                  await createBloodTestMutation.mutateAsync(bloodTestData);
                  alert('Exame salvo com sucesso!');
                }
                
                setEditingBloodTest(null);
                setShowBloodTestForm(false);
              } catch (error) {
                console.error('Erro ao salvar exame:', error);
                alert('Erro ao salvar exame. Tente novamente.');
              }
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data do Exame *</label>
                  <input
                    type="date"
                    name="test_date"
                    defaultValue={editingBloodTest?.test_date || new Date().toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Laboratório</label>
                  <input
                    type="text"
                    name="laboratory"
                    defaultValue={editingBloodTest?.laboratory || ''}
                    placeholder="Nome do laboratório"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              {/* Hemograma */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Hemograma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hemoglobina (g/dL)</label>
                    <input
                      type="number"
                      name="hemoglobin"
                      step="0.1"
                      defaultValue={editingBloodTest?.hemoglobin || ''}
                      placeholder="12-16"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hematócrito (%)</label>
                    <input
                      type="number"
                      name="hematocrit"
                      step="0.1"
                      defaultValue={editingBloodTest?.hematocrit || ''}
                      placeholder="36-48"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hemácias (milhões/μL)</label>
                    <input
                      type="number"
                      name="red_blood_cells"
                      step="0.01"
                      defaultValue={editingBloodTest?.red_blood_cells || ''}
                      placeholder="4.0-5.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leucócitos (/μL)</label>
                    <input
                      type="number"
                      name="white_blood_cells"
                      step="1"
                      defaultValue={editingBloodTest?.white_blood_cells || ''}
                      placeholder="4000-11000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plaquetas (/μL)</label>
                    <input
                      type="number"
                      name="platelets"
                      step="1000"
                      defaultValue={editingBloodTest?.platelets || ''}
                      placeholder="150000-450000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hormônios */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Hormônios</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testosterona Total (ng/dL)</label>
                    <input
                      type="number"
                      name="testosterone_total"
                      step="0.1"
                      defaultValue={editingBloodTest?.testosterone_total || ''}
                      placeholder="300-1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Testosterona Livre (pg/mL)</label>
                    <input
                      type="number"
                      name="testosterone_free"
                      step="0.1"
                      defaultValue={editingBloodTest?.testosterone_free || ''}
                      placeholder="8.7-25.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SHBG (nmol/L)</label>
                    <input
                      type="number"
                      name="shbg"
                      step="0.1"
                      defaultValue={editingBloodTest?.shbg || ''}
                      placeholder="18-54"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TSH (μUI/mL)</label>
                    <input
                      type="number"
                      name="tsh"
                      step="0.01"
                      defaultValue={editingBloodTest?.tsh || ''}
                      placeholder="0.27-4.2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">T3 (ng/dL)</label>
                    <input
                      type="number"
                      name="t3"
                      step="0.1"
                      defaultValue={editingBloodTest?.t3 || ''}
                      placeholder="80-200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">T4 (μg/dL)</label>
                    <input
                      type="number"
                      name="t4"
                      step="0.1"
                      defaultValue={editingBloodTest?.t4 || ''}
                      placeholder="5.1-14.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Lipidograma */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Lipidograma</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Colesterol Total (mg/dL)</label>
                    <input
                      type="number"
                      name="cholesterol_total"
                      step="0.1"
                      defaultValue={editingBloodTest?.cholesterol_total || ''}
                      placeholder="< 200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HDL (mg/dL)</label>
                    <input
                      type="number"
                      name="hdl"
                      step="0.1"
                      defaultValue={editingBloodTest?.hdl || ''}
                      placeholder="> 40"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LDL (mg/dL)</label>
                    <input
                      type="number"
                      name="ldl"
                      step="0.1"
                      defaultValue={editingBloodTest?.ldl || ''}
                      placeholder="< 100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Triglicerídeos (mg/dL)</label>
                    <input
                      type="number"
                      name="triglycerides"
                      step="0.1"
                      defaultValue={editingBloodTest?.triglycerides || ''}
                      placeholder="< 150"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apolipoproteína A (mg/dL)</label>
                    <input
                      type="number"
                      name="apolipoprotein_a"
                      step="0.1"
                      defaultValue={editingBloodTest?.apolipoprotein_a || ''}
                      placeholder="120-160"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apolipoproteína B (mg/dL)</label>
                    <input
                      type="number"
                      name="apolipoprotein_b"
                      step="0.1"
                      defaultValue={editingBloodTest?.apolipoprotein_b || ''}
                      placeholder="60-133"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Vitaminas e Metabolismo */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Vitaminas e Metabolismo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vitamina D (ng/mL)</label>
                    <input
                      type="number"
                      name="vitamin_d"
                      step="0.1"
                      defaultValue={editingBloodTest?.vitamin_d || ''}
                      placeholder="30-100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vitamina B12 (pg/mL)</label>
                    <input
                      type="number"
                      name="vitamin_b12"
                      step="0.1"
                      defaultValue={editingBloodTest?.vitamin_b12 || ''}
                      placeholder="200-900"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Homocisteína (μmol/L)</label>
                    <input
                      type="number"
                      name="homocysteine"
                      step="0.1"
                      defaultValue={editingBloodTest?.homocysteine || ''}
                      placeholder="5-15"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Função Renal */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Função Renal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Creatinina (mg/dL)</label>
                    <input
                      type="number"
                      name="creatinine"
                      step="0.01"
                      defaultValue={editingBloodTest?.creatinine || ''}
                      placeholder="0.6-1.2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ureia (mg/dL)</label>
                    <input
                      type="number"
                      name="urea"
                      step="0.1"
                      defaultValue={editingBloodTest?.urea || ''}
                      placeholder="15-40"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Função Hepática */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Função Hepática</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TGO/AST (U/L)</label>
                    <input
                      type="number"
                      name="tgo_ast"
                      step="0.1"
                      defaultValue={editingBloodTest?.tgo_ast || ''}
                      placeholder="10-40"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TGP/ALT (U/L)</label>
                    <input
                      type="number"
                      name="tgp_alt"
                      step="0.1"
                      defaultValue={editingBloodTest?.tgp_alt || ''}
                      placeholder="7-56"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proteína Total (g/dL)</label>
                    <input
                      type="number"
                      name="total_protein"
                      step="0.1"
                      defaultValue={editingBloodTest?.total_protein || ''}
                      placeholder="6.0-8.3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Albumina (g/dL)</label>
                    <input
                      type="number"
                      name="albumin"
                      step="0.1"
                      defaultValue={editingBloodTest?.albumin || ''}
                      placeholder="3.5-5.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Eletrólitos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Eletrólitos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sódio (mEq/L)</label>
                    <input
                      type="number"
                      name="sodium"
                      step="0.1"
                      defaultValue={editingBloodTest?.sodium || ''}
                      placeholder="136-145"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Potássio (mEq/L)</label>
                    <input
                      type="number"
                      name="potassium"
                      step="0.1"
                      defaultValue={editingBloodTest?.potassium || ''}
                      placeholder="3.5-5.1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Magnésio (mg/dL)</label>
                    <input
                      type="number"
                      name="magnesium"
                      step="0.1"
                      defaultValue={editingBloodTest?.magnesium || ''}
                      placeholder="1.7-2.2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fósforo (mg/dL)</label>
                    <input
                      type="number"
                      name="phosphorus"
                      step="0.1"
                      defaultValue={editingBloodTest?.phosphorus || ''}
                      placeholder="2.7-4.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Glicemia */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Glicemia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Glicemia de Jejum (mg/dL)</label>
                    <input
                      type="number"
                      name="fasting_glucose"
                      step="0.1"
                      defaultValue={editingBloodTest?.fasting_glucose || ''}
                      placeholder="70-100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hemoglobina Glicada (%)</label>
                    <input
                      type="number"
                      name="hba1c"
                      step="0.1"
                      defaultValue={editingBloodTest?.hba1c || ''}
                      placeholder="< 5.7"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insulina de Jejum (μU/mL)</label>
                    <input
                      type="number"
                      name="fasting_insulin"
                      step="0.1"
                      defaultValue={editingBloodTest?.fasting_insulin || ''}
                      placeholder="2.6-24.9"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Glicose (mg/dL)</label>
                  <input
                    type="number"
                    name="glucose"
                    step="0.1"
                    defaultValue={editingBloodTest?.glucose || ''}
                    placeholder="70-100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colesterol Total (mg/dL)</label>
                  <input
                    type="number"
                    name="cholesterol_total"
                    step="0.1"
                    defaultValue={editingBloodTest?.cholesterol_total || ''}
                    placeholder="< 200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HDL (mg/dL)</label>
                  <input
                    type="number"
                    name="hdl"
                    step="0.1"
                    defaultValue={editingBloodTest?.hdl || ''}
                    placeholder="> 40"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LDL (mg/dL)</label>
                  <input
                    type="number"
                    name="ldl"
                    step="0.1"
                    defaultValue={editingBloodTest?.ldl || ''}
                    placeholder="< 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Triglicerídeos (mg/dL)</label>
                  <input
                    type="number"
                    name="triglycerides"
                    step="0.1"
                    defaultValue={editingBloodTest?.triglycerides || ''}
                    placeholder="< 150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingBloodTest?.notes || ''}
                  placeholder="Observações adicionais sobre o exame..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBloodTest(null);
                    setShowBloodTestForm(false);
                  }}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createBloodTestMutation.isPending || updateBloodTestMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {(createBloodTestMutation.isPending || updateBloodTestMutation.isPending) && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>
                    {(createBloodTestMutation.isPending || updateBloodTestMutation.isPending) 
                      ? 'Salvando...' 
                      : editingBloodTest ? 'Atualizar' : 'Salvar'} Exame
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default PatientProfile;
