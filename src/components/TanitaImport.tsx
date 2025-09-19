
import React from 'react';
import { Upload, Folder, CheckCircle, AlertCircle, User, Scale } from 'lucide-react';
import { useTanitaImport, TanitaPatientData } from '@/hooks/useTanitaImport';
import { Button } from '@/components/ui/button';

interface TanitaImportProps {
  onDataImported?: (data: TanitaPatientData[]) => void;
}

const TanitaImport: React.FC<TanitaImportProps> = ({ onDataImported }) => {
  const { importing, importedData, importTanitaData } = useTanitaImport();

  const handleSelectFolder = async () => {
    try {
      // @ts-ignore - File System Access API
      const directoryHandle = await window.showDirectoryPicker();
      await importTanitaData(directoryHandle);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Erro ao selecionar pasta:', error);
      }
    }
  };

  const handleUseData = () => {
    if (onDataImported && importedData.length > 0) {
      onDataImported(importedData);
    }
  };

  const getGenderText = (gender: number) => {
    return gender === 1 ? 'Masculino' : 'Feminino';
  };

  const getActivityLevelText = (level: number) => {
    const levels = ['Sedentário', 'Levemente ativo', 'Moderadamente ativo', 'Muito ativo', 'Extremamente ativo'];
    return levels[level] || 'Não informado';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Upload className="h-5 w-5 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Importar Dados da Balança Tanita BC-601</h3>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Como importar:</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Conecte a balança Tanita BC-601 ao computador</li>
          <li>Localize a pasta raiz dos dados da balança</li>
          <li>Clique em "Selecionar Pasta" e escolha a pasta que contém TANITA/GRAPHV1</li>
          <li>O sistema irá processar automaticamente os arquivos PROF1-4.CSV e DATA1-4.CSV</li>
          <li>Revise os dados importados e clique em "Usar Dados" para continuar</li>
        </ol>
      </div>

      {/* Botão de seleção */}
      <div className="text-center">
        <Button
          onClick={handleSelectFolder}
          disabled={importing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
        >
          <Folder className="h-5 w-5 mr-2" />
          {importing ? 'Processando...' : 'Selecionar Pasta'}
        </Button>
      </div>

      {/* Resultados da importação */}
      {importedData.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">
                Dados importados com sucesso!
              </p>
              <p className="text-sm text-green-700">
                {importedData.length} perfis encontrados com medições
              </p>
            </div>
          </div>

          {/* Lista de perfis importados */}
          <div className="space-y-3">
            {importedData.map((patient) => (
              <div key={patient.slot} className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        Slot {patient.slot} - Código {patient.codigoPerfil}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {patient.medicoes.length} medições encontradas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Scale className="h-4 w-4" />
                    <span>Tanita BC-601</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Nascimento:</span>
                    <p className="font-medium">{patient.perfil.dataNascimento}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Gênero:</span>
                    <p className="font-medium">{getGenderText(patient.perfil.genero)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Altura:</span>
                    <p className="font-medium">{patient.perfil.altura} cm</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Atividade:</span>
                    <p className="font-medium">{getActivityLevelText(patient.perfil.atividade)}</p>
                  </div>
                </div>

                {patient.perfil.modoAtleta && (
                  <div className="mt-2">
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Modo Atleta
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleUseData}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Usar Dados Importados
            </Button>
          </div>
        </div>
      )}

      {/* Suporte ao navegador */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Esta funcionalidade requer um navegador moderno com suporte à File System Access API (Chrome, Edge).
          </p>
        </div>
      </div>
    </div>
  );
};

export default TanitaImport;
