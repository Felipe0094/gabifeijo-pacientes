import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface TanitaProfile {
  slot: number;
  codigoPerfil: string;
  perfil: {
    dataNascimento: string;
    genero: number; // 1=masculino, 2=feminino
    altura: number;
    modoAtleta: boolean;
    atividade: number;
  };
}

export interface TanitaMeasurement {
  timestamp: string;
  peso: number;
  imc: number;
  gorduraTotal: number;
  aguaTotal: number;
  massaMuscularTotal: number;
  massaOssea: number;
  gorduraVisceral: number;
  idadeMetabolica: number;
  consumoDiario: number;
  // Medições por segmento
  gorduraBracoDireito: number;
  gorduraBracoEsquerdo: number;
  gorduraPernadireita: number;
  gorduraPernaEsquerda: number;
  gorduraTronco: number;
  musculoBracoDireito: number;
  musculoBracoEsquerdo: number;
  musculoPernaDireita: number;
  musculoPernaEsquerda: number;
  musculoTronco: number;
}

export interface TanitaPatientData {
  slot: number;
  codigoPerfil: string;
  perfil: TanitaProfile['perfil'];
  medicoes: TanitaMeasurement[];
}

export const useTanitaImport = () => {
  const [importing, setImporting] = useState(false);
  const [importedData, setImportedData] = useState<TanitaPatientData[]>([]);
  const { toast } = useToast();

  const parseProfileData = (csvContent: string, slot: number): TanitaProfile | null => {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length === 0) return null;

      const data = lines[0]; // Primeira linha contém o perfil
      const fields = data.split(',');
      
      let profile: any = {};
      let codigoPerfil = '';

      // Parse dos campos conforme formato Tanita
      for (let i = 0; i < fields.length; i += 2) {
        const key = fields[i];
        const value = fields[i + 1];
        
        if (!key || !value) continue;

        switch (key) {
          case 'DB': // Data de nascimento
            profile.dataNascimento = value.replace(/"/g, '');
            break;
          case 'GE': // Gênero
            profile.genero = parseInt(value);
            break;
          case 'Hm': // Altura
            profile.altura = parseFloat(value);
            break;
          case 'AL': // Nível de atividade
            profile.atividade = parseInt(value);
            break;
          case 'Bt': // Modo atleta
            profile.modoAtleta = parseInt(value) === 1;
            break;
          case 'CS': // Código do perfil
            codigoPerfil = value;
            break;
        }
      }

      console.log(`Perfil carregado: slot ${slot}, CS=${codigoPerfil}`);

      return {
        slot,
        codigoPerfil,
        perfil: profile
      };
    } catch (error) {
      console.error(`Erro ao processar perfil do slot ${slot}:`, error);
      return null;
    }
  };

  const parseMeasurementData = (csvContent: string, slot: number): TanitaMeasurement[] => {
    try {
      const lines = csvContent.trim().split('\n');
      const measurements: TanitaMeasurement[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;

        const fields = line.split(',');
        let measurement: any = {};
        let date = '';
        let time = '';

        // Parse dos campos conforme formato Tanita
        for (let i = 0; i < fields.length; i += 2) {
          const key = fields[i];
          const value = fields[i + 1];
          
          if (!key || !value) continue;

          switch (key) {
            case 'DT': // Data
              date = value.replace(/"/g, '');
              break;
            case 'Ti': // Hora
              time = value.replace(/"/g, '');
              break;
            case 'Wk': // Peso
              measurement.peso = parseFloat(value);
              break;
            case 'MI': // IMC
              measurement.imc = parseFloat(value);
              break;
            case 'FW': // Gordura total %
              measurement.gorduraTotal = parseFloat(value);
              break;
            case 'ww': // Água total %
              measurement.aguaTotal = parseFloat(value);
              break;
            case 'mW': // Massa muscular total %
              measurement.massaMuscularTotal = parseFloat(value);
              break;
            case 'bW': // Massa óssea kg
              measurement.massaOssea = parseFloat(value);
              break;
            case 'IF': // Gordura visceral
              measurement.gorduraVisceral = parseInt(value);
              break;
            case 'rA': // Idade metabólica
              measurement.idadeMetabolica = parseInt(value);
              break;
            case 'rD': // Consumo diário
              measurement.consumoDiario = parseInt(value);
              break;
            case 'Fr': // Gordura braço direito
              measurement.gorduraBracoDireito = parseFloat(value);
              break;
            case 'Fl': // Gordura braço esquerdo
              measurement.gorduraBracoEsquerdo = parseFloat(value);
              break;
            case 'FR': // Gordura perna direita
              measurement.gorduraPernadireita = parseFloat(value);
              break;
            case 'FL': // Gordura perna esquerda
              measurement.gorduraPernaEsquerda = parseFloat(value);
              break;
            case 'FT': // Gordura tronco
              measurement.gorduraTronco = parseFloat(value);
              break;
            case 'mr': // Músculo braço direito
              measurement.musculoBracoDireito = parseFloat(value);
              break;
            case 'ml': // Músculo braço esquerdo
              measurement.musculoBracoEsquerdo = parseFloat(value);
              break;
            case 'mR': // Músculo perna direita
              measurement.musculoPernaDireita = parseFloat(value);
              break;
            case 'mL': // Músculo perna esquerda
              measurement.musculoPernaEsquerda = parseFloat(value);
              break;
            case 'mT': // Músculo tronco
              measurement.musculoTronco = parseFloat(value);
              break;
          }
        }

        if (date && time && measurement.peso) {
          measurement.timestamp = `${date} ${time}`;
          measurements.push(measurement as TanitaMeasurement);
        }
      }

      console.log(`Importadas ${measurements.length} medições do slot ${slot}`);
      return measurements;
    } catch (error) {
      console.error(`Erro ao processar medições do slot ${slot}:`, error);
      return [];
    }
  };

  const importTanitaData = async (directoryHandle: FileSystemDirectoryHandle) => {
    setImporting(true);
    setImportedData([]);

    try {
      // Verificar se existe a estrutura TANITA/GRAPHV1 OU apenas GRAPHV1 (caso o usuário selecione TANITA)
      let graphHandle: FileSystemDirectoryHandle;
      try {
        // Tenta pegar GRAPHV1 dentro da pasta selecionada (caso o usuário selecione TANITA)
        graphHandle = await directoryHandle.getDirectoryHandle('GRAPHV1');
      } catch {
        // Se não encontrar, tenta pegar TANITA/GRAPHV1 (caso o usuário selecione a raiz)
        const tanitaHandle = await directoryHandle.getDirectoryHandle('TANITA');
        graphHandle = await tanitaHandle.getDirectoryHandle('GRAPHV1');
      }

      // Acessar pastas SYSTEM e DATA
      console.log('Tentando acessar SYSTEM em', graphHandle);
      const systemHandle = await graphHandle.getDirectoryHandle('SYSTEM');
      console.log('SYSTEM encontrado');
      console.log('Tentando acessar DATA em', graphHandle);
      const dataHandle = await graphHandle.getDirectoryHandle('DATA');
      console.log('DATA encontrado');

      const consolidatedData: TanitaPatientData[] = [];

      // Processar slots de 1 a 4
      for (let slot = 1; slot <= 4; slot++) {
        try {
          console.log(`Tentando acessar PROF${slot}.CSV em SYSTEM`);
          const profileFile = await systemHandle.getFileHandle(`PROF${slot}.CSV`);
          console.log(`PROF${slot}.CSV encontrado`);
          const profileContent = await profileFile.getFile().then(f => f.text());
          const profile = parseProfileData(profileContent, slot);

          if (!profile) {
            console.log(`Slot ${slot}: perfil não encontrado ou inválido`);
            continue;
          }

          console.log(`Tentando acessar DATA${slot}.CSV em DATA`);
          const dataFile = await dataHandle.getFileHandle(`DATA${slot}.CSV`);
          console.log(`DATA${slot}.CSV encontrado`);
          const dataContent = await dataFile.getFile().then(f => f.text());
          const measurements = parseMeasurementData(dataContent, slot);

          if (measurements.length === 0) {
            console.log(`Slot ${slot}: nenhuma medição encontrada`);
            continue;
          }

          // Consolidar dados do paciente
          consolidatedData.push({
            slot: profile.slot,
            codigoPerfil: profile.codigoPerfil,
            perfil: profile.perfil,
            medicoes: measurements
          });

        } catch (error) {
          console.log(`Slot ${slot}: arquivos não encontrados ou erro no processamento`, error);
        }
      }

      setImportedData(consolidatedData);
      
      toast({
        title: 'Importação concluída',
        description: `${consolidatedData.length} perfis importados com sucesso`,
      });

      console.log('Dados consolidados:', consolidatedData);
      
    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    importedData,
    importTanitaData
  };
};
