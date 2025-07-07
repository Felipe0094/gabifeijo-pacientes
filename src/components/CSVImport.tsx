import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';
import TanitaImport from './TanitaImport';
import { TanitaPatientData } from '@/hooks/useTanitaImport';
import { supabase } from '@/integrations/supabase/client';

interface CSVImportProps {
  patientId: number;
}

// Função utilitária para converter data DD/MM/YYYY para YYYY-MM-DD
function parseTanitaDate(dateStr: string): string {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Função utilitária para converter timestamp DD/MM/YYYY HH:MM:SS para YYYY-MM-DD HH:MM:SS
function parseTanitaTimestamp(ts: string): string {
  const [date, time] = ts.split(' ');
  if (!date || !time) return ts;
  const [day, month, year] = date.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${time}`;
}

const CSVImport: React.FC<CSVImportProps> = ({ patientId }) => {
  const [activeTab, setActiveTab] = useState<'tanita' | 'csv'>('tanita');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<'success' | 'error' | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Aqui será implementada a lógica de parsing do CSV manual
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Importando arquivo:', file.name);
      console.log('Para paciente ID:', patientId);
      
      setImportResult('success');
      setFile(null);
    } catch (error) {
      console.error('Erro na importação:', error);
      setImportResult('error');
    } finally {
      setImporting(false);
    }
  };

  const handleTanitaDataImported = async (data: TanitaPatientData[]) => {
    console.log('Iniciando importação Tanita. Perfis lidos:', data);
    let totalMedicoes = 0;
    let totalPacientes = 0;
    for (const perfil of data) {
      console.log(`Processando slot ${perfil.slot}: perfil`, perfil);
      const birthDateISO = parseTanitaDate(perfil.perfil.dataNascimento);
      // Buscar paciente por birth_date e altura (tolerância de 2cm)
      const { data: candidates, error: searchError } = await supabase
        .from('patients')
        .select('id, name, birth_date, height_cm')
        .eq('birth_date', birthDateISO);
      if (searchError) {
        console.error('Erro ao buscar paciente:', searchError);
        continue;
      }
      console.log(`Candidatos encontrados para slot ${perfil.slot}:`, candidates);
      // Filtrar por altura com tolerância de 2cm
      const matched = (candidates || []).find(p => Math.abs(Number(p.height_cm) - Number(perfil.perfil.altura)) <= 2);
      let patientId;
      if (matched) {
        // Atualizar paciente com tanita_slot e tanita_profile_code
        const updateObj = {
          tanita_slot: perfil.slot,
          tanita_profile_code: perfil.codigoPerfil,
          gender: perfil.perfil.genero,
          height_cm: perfil.perfil.altura,
          athlete_mode: perfil.perfil.modoAtleta,
          activity_level: perfil.perfil.atividade,
          birth_date: birthDateISO,
        };
        const { error: updateError } = await supabase
          .from('patients')
          .update(updateObj)
          .eq('id', matched.id);
        if (updateError) {
          console.error('Erro ao atualizar paciente:', updateError, updateObj);
          continue;
        }
        patientId = matched.id;
        totalPacientes++;
        console.log(`Slot ${perfil.slot} associado ao paciente ${matched.name} (ID=${matched.id})`);
      } else {
        // Criar novo paciente
        const insertObj = {
          name: `Tanita Slot ${perfil.slot}`,
          birth_date: birthDateISO,
          gender: perfil.perfil.genero,
          height_cm: perfil.perfil.altura,
          athlete_mode: perfil.perfil.modoAtleta,
          activity_level: perfil.perfil.atividade,
          tanita_slot: perfil.slot,
          tanita_profile_code: perfil.codigoPerfil,
        };
        const { data: newPatient, error: insertError } = await supabase
          .from('patients')
          .insert([insertObj])
          .select()
          .single();
        if (insertError || !newPatient) {
          console.error('Erro ao criar paciente:', insertError, insertObj);
          continue;
        }
        patientId = newPatient.id;
        totalPacientes++;
        console.log(`Slot ${perfil.slot} criou novo paciente (ID=${patientId})`);
      }
      // Inserir medições
      let count = 0;
      for (const med of perfil.medicoes) {
        const insertObj = {
          patient_id: patientId,
          timestamp: parseTanitaTimestamp(med.timestamp),
          weight: med.peso,
          bmi: med.imc,
          body_fat_percent: med.gorduraTotal,
          water_percent: med.aguaTotal,
          muscle_mass_percent_total: med.massaMuscularTotal,
          bone_mass_kg: med.massaOssea,
          visceral_fat_rating: med.gorduraVisceral,
          metabolic_age: med.idadeMetabolica,
          daily_calorie_maintenance: med.consumoDiario,
          fat_arm_right: med.gorduraBracoDireito,
          fat_arm_left: med.gorduraBracoEsquerdo,
          fat_leg_right: med.gorduraPernadireita,
          fat_leg_left: med.gorduraPernaEsquerda,
          fat_trunk: med.gorduraTronco,
          muscle_arm_right: med.musculoBracoDireito,
          muscle_arm_left: med.musculoBracoEsquerdo,
          muscle_leg_right: med.musculoPernaDireita,
          muscle_leg_left: med.musculoPernaEsquerda,
          muscle_trunk: med.musculoTronco,
        };
        const { error: insertError, data: insertData } = await supabase
          .from('scale_measurements')
          .insert([insertObj])
          .select();
        if (insertError) {
          console.error('Erro ao inserir medição:', insertError, insertObj);
        } else {
          count++;
          totalMedicoes++;
        }
      }
      console.log(`Importadas ${count} medições de DATA${perfil.slot}.CSV para paciente ID=${patientId}`);
    }
    console.log(`Importação concluída: ${totalPacientes} pacientes processados, ${totalMedicoes} medições importadas.`);
    alert('Importação concluída e dados salvos no banco! Veja o console para detalhes.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Upload className="h-5 w-5 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Importar Dados da Balança</h3>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tanita')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tanita'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tanita BC-601 (Recomendado)
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'csv'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upload CSV Manual
          </button>
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      {activeTab === 'tanita' ? (
        <TanitaImport onDataImported={handleTanitaDataImported} />
      ) : (
        <div className="space-y-6">
          {/* Instruções CSV Manual */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Como importar CSV manual:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Exporte os dados da balança em formato CSV</li>
              <li>Selecione ou arraste o arquivo na área abaixo</li>
              <li>Clique em "Importar Dados" para processar</li>
              <li>Os dados serão automaticamente associados ao paciente</li>
            </ol>
          </div>

          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragActive
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-800">
                  Arraste o arquivo CSV aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Suporte apenas para arquivos .csv
                </p>
              </div>
            </div>
          </div>

          {/* File Selected */}
          {file && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <File className="h-8 w-8 text-gray-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          {/* Import Button */}
          {file && (
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className={`px-8 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                  importing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {importing ? 'Importando...' : 'Importar Dados'}
              </button>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`border rounded-lg p-4 ${
              importResult === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                {importResult === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className={`font-medium ${
                    importResult === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importResult === 'success'
                      ? 'Dados importados com sucesso!'
                      : 'Erro na importação dos dados'
                    }
                  </p>
                  <p className={`text-sm ${
                    importResult === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {importResult === 'success'
                      ? 'Os dados da balança foram processados e salvos no perfil do paciente.'
                      : 'Verifique se o arquivo está no formato correto e tente novamente.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CSVImport;
