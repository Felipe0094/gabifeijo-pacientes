import React from 'react';
import { Calendar, Scale, Ruler, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';

interface Measurement {
  id?: string;
  date: string;
  type: 'manual' | 'scale';
  data: any;
}

interface PatientTimelineProps {
  measurements: Measurement[];
  onEditManual?: (measurement: any) => void;
  onDeleteManual?: (measurement: any) => void;
  onEditScale?: (measurement: any) => void;
  onDeleteScale?: (measurement: any) => void;
}

const PatientTimeline: React.FC<PatientTimelineProps> = ({ measurements, onEditManual, onDeleteManual, onEditScale, onDeleteScale }) => {
  // Agrupar medições por data
  const groupedMeasurements = measurements.reduce((groups, measurement) => {
    const dateKey = measurement.date.split('T')[0]; // YYYY-MM-DD
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(measurement);
    return groups;
  }, {} as Record<string, Measurement[]>);

  // Ordenar datas (mais recente primeiro)
  const sortedDates = Object.keys(groupedMeasurements).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    // Para datas UTC, extrair apenas a parte da data (YYYY-MM-DD) para evitar conversão de fuso horário
    const dateOnly = dateString.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  const renderMeasurementCard = (measurement: Measurement, index: number) => {
    const isManual = measurement.type === 'manual';
    
    return (
      <div key={`${measurement.date}-${measurement.type}-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isManual ? (
              <Ruler className="h-4 w-4 text-green-600" />
            ) : (
              <Scale className="h-4 w-4 text-blue-600" />
            )}
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              isManual 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {isManual ? 'Medição Manual' : 'Balança Tanita'}
            </span>
          </div>
          {isManual && onEditManual && (
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-xs font-semibold"
                onClick={() => onEditManual(measurement)}
              >
                Editar
              </button>
              {onDeleteManual && (
                <button
                  className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs font-semibold"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta medição?')) {
                      onDeleteManual(measurement);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          {!isManual && (onEditScale || onDeleteScale) && (
            <div className="flex space-x-2">
              {onEditScale && (
                <button
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-xs font-semibold"
                  onClick={() => onEditScale(measurement)}
                >
                  Editar
                </button>
              )}
              {onDeleteScale && (
                <button
                  className="px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-xs font-semibold"
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir esta medição?')) {
                      onDeleteScale(measurement);
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Manual measurements */}
        {isManual && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {measurement.data.waist && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Cintura</p>
                <p className="font-semibold text-gray-800">{measurement.data.waist} cm</p>
              </div>
            )}
            {measurement.data.abdomen && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Abdômen</p>
                <p className="font-semibold text-gray-800">{measurement.data.abdomen} cm</p>
              </div>
            )}
            {measurement.data.thorax && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Tórax</p>
                <p className="font-semibold text-gray-800">{measurement.data.thorax} cm</p>
              </div>
            )}
            {measurement.data.arm_right && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Braço Dir.</p>
                <p className="font-semibold text-gray-800">{measurement.data.arm_right} cm</p>
              </div>
            )}
            {measurement.data.arm_left && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Braço Esq.</p>
                <p className="font-semibold text-gray-800">{measurement.data.arm_left} cm</p>
              </div>
            )}
            {measurement.data.hip && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Quadril</p>
                <p className="font-semibold text-gray-800">{measurement.data.hip} cm</p>
              </div>
            )}
            {measurement.data.thigh_right && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Coxa Dir.</p>
                <p className="font-semibold text-gray-800">{measurement.data.thigh_right} cm</p>
              </div>
            )}
            {measurement.data.thigh_left && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Coxa Esq.</p>
                <p className="font-semibold text-gray-800">{measurement.data.thigh_left} cm</p>
              </div>
            )}
            {measurement.data.calf_right && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Pant. Dir.</p>
                <p className="font-semibold text-gray-800">{measurement.data.calf_right} cm</p>
              </div>
            )}
            {measurement.data.calf_left && (
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Pant. Esq.</p>
                <p className="font-semibold text-gray-800">{measurement.data.calf_left} cm</p>
              </div>
            )}
          </div>
        )}

        {/* Scale measurements */}
        {!isManual && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {measurement.data.weight && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Peso</p>
                <p className="font-semibold text-gray-800">{measurement.data.weight} kg</p>
              </div>
            )}
            {measurement.data.bmi && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">IMC</p>
                <p className="font-semibold text-gray-800">{measurement.data.bmi}</p>
              </div>
            )}
            {measurement.data.bodyFat && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">% Gordura</p>
                <p className="font-semibold text-gray-800">{measurement.data.bodyFat}%</p>
              </div>
            )}
            {measurement.data.muscle && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">% Músculo</p>
                <p className="font-semibold text-gray-800">{measurement.data.muscle}%</p>
              </div>
            )}
            {measurement.data.water && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">% Água</p>
                <p className="font-semibold text-gray-800">{measurement.data.water}%</p>
              </div>
            )}
            {measurement.data.visceralFat && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">G. Visceral</p>
                <p className="font-semibold text-gray-800">{measurement.data.visceralFat}</p>
              </div>
            )}
            {measurement.data.bone && (
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-gray-600">Massa Óssea</p>
                <p className="font-semibold text-gray-800">{measurement.data.bone} kg</p>
              </div>
            )}
          </div>
        )}

        {/* Observations */}
        {measurement.data.observations && (
          <div className="mt-3 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-700">
              <strong>Observações:</strong> {measurement.data.observations}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderDateGroup = (dateKey: string, measurements: Measurement[], index: number) => {
    return (
      <div key={dateKey} className="relative">
        <div className="flex items-start">
          {/* Date group */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDate(dateKey)}
              </h3>
            </div>
            
            <div className="space-y-3">
              {measurements.map((measurement, measurementIndex) => 
                renderMeasurementCard(measurement, measurementIndex)
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-h-[510px] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">Timeline de Medições</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Manual</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Balança</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {sortedDates.length > 0 ? (
          sortedDates.map((dateKey, index) => 
            renderDateGroup(dateKey, groupedMeasurements[dateKey], index)
          )
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Nenhuma medição encontrada
            </h3>
            <p className="text-gray-500">
              Adicione a primeira medição para começar a acompanhar a evolução
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTimeline;
