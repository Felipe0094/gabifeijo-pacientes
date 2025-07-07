import React, { useState } from 'react';
import { Calendar, Ruler } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface MeasurementFormProps {
  patientId: string;
  editingManual?: any | null;
  onFinishEdit?: () => void;
}

const MeasurementForm: React.FC<MeasurementFormProps> = ({ patientId, editingManual, onFinishEdit }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    waist: '',
    abdomen: '',
    arm_right: '',
    arm_left: '',
    thorax: '',
    hip: '',
    thigh_right: '',
    thigh_left: '',
    calf_right: '',
    calf_left: '',
    observations: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Preenche o formulário ao editar
  React.useEffect(() => {
    if (editingManual) {
      setFormData({
        date: editingManual.date ? editingManual.date.split('T')[0] : '',
        waist: editingManual.data.waist?.toString() || '',
        abdomen: editingManual.data.abdomen?.toString() || '',
        arm_right: editingManual.data.arm_right?.toString() || '',
        arm_left: editingManual.data.arm_left?.toString() || '',
        thorax: editingManual.data.thorax?.toString() || '',
        hip: editingManual.data.hip?.toString() || '',
        thigh_right: editingManual.data.thigh_right?.toString() || '',
        thigh_left: editingManual.data.thigh_left?.toString() || '',
        calf_right: editingManual.data.calf_right?.toString() || '',
        calf_left: editingManual.data.calf_left?.toString() || '',
        observations: editingManual.data.observations || ''
      });
      setEditingId(editingManual.id || null);
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        waist: '',
        abdomen: '',
        arm_right: '',
        arm_left: '',
        thorax: '',
        hip: '',
        thigh_right: '',
        thigh_left: '',
        calf_right: '',
        calf_left: '',
        observations: ''
      });
      setEditingId(null);
    }
  }, [editingManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se já existe uma medição na mesma data
    const { data: existingMeasurements } = await supabase
      .from('manual_measurements')
      .select('id')
      .eq('patient_id', patientId)
      .eq('timestamp', formData.date);
    
    const existingMeasurement = existingMeasurements?.[0];
    
    const insertData = {
      patient_id: patientId,
      timestamp: formData.date,
      waist_cm: formData.waist ? Number(formData.waist) : null,
      abdomen_cm: formData.abdomen ? Number(formData.abdomen) : null,
      arm_right_cm: formData.arm_right ? Number(formData.arm_right) : null,
      arm_left_cm: formData.arm_left ? Number(formData.arm_left) : null,
      thorax_cm: formData.thorax ? Number(formData.thorax) : null,
      hip_cm: formData.hip ? Number(formData.hip) : null,
      thigh_right_cm: formData.thigh_right ? Number(formData.thigh_right) : null,
      thigh_left_cm: formData.thigh_left ? Number(formData.thigh_left) : null,
      calf_right_cm: formData.calf_right ? Number(formData.calf_right) : null,
      calf_left_cm: formData.calf_left ? Number(formData.calf_left) : null,
      notes: formData.observations || null
    };
    
    let error;
    if (existingMeasurement) {
      // Update - já existe medição nesta data
      ({ error } = await supabase
        .from('manual_measurements')
        .update(insertData)
        .eq('id', existingMeasurement.id));
    } else {
      // Insert - nova medição
      ({ error } = await supabase
        .from('manual_measurements')
        .insert([insertData]));
    }
    
    if (error) {
      alert('Erro ao salvar medição: ' + error.message);
      return;
    }
    
    // Invalida a query para atualizar automaticamente
    queryClient.invalidateQueries({ queryKey: ['manual-measurements', patientId] });
    
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      waist: '',
      abdomen: '',
      arm_right: '',
      arm_left: '',
      thorax: '',
      hip: '',
      thigh_right: '',
      thigh_left: '',
      calf_right: '',
      calf_left: '',
      observations: ''
    });
    
    if (onFinishEdit) onFinishEdit();
    alert(existingMeasurement ? 'Medição atualizada com sucesso!' : 'Nova medição salva com sucesso!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <Ruler className="h-5 w-5 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Nova Medição Manual</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Data da Medição *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="date"
              name="date"
              required
              value={formData.date}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
            />
          </div>
        </div>

        {/* Medições em Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="waist" className="block text-sm font-medium text-gray-700 mb-2">
              Cintura (cm)
            </label>
            <input
              type="number"
              id="waist"
              name="waist"
              step="0.1"
              min="0"
              value={formData.waist}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 68.5"
            />
          </div>

          <div>
            <label htmlFor="abdomen" className="block text-sm font-medium text-gray-700 mb-2">
              Abdômen (cm)
            </label>
            <input
              type="number"
              id="abdomen"
              name="abdomen"
              step="0.1"
              min="0"
              value={formData.abdomen}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 72.0"
            />
          </div>

          <div>
            <label htmlFor="arm_right" className="block text-sm font-medium text-gray-700 mb-2">
              Braço Direito (cm)
            </label>
            <input
              type="number"
              id="arm_right"
              name="arm_right"
              step="0.1"
              min="0"
              value={formData.arm_right}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 28.5"
            />
          </div>

          <div>
            <label htmlFor="arm_left" className="block text-sm font-medium text-gray-700 mb-2">
              Braço Esquerdo (cm)
            </label>
            <input
              type="number"
              id="arm_left"
              name="arm_left"
              step="0.1"
              min="0"
              value={formData.arm_left}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 28.0"
            />
          </div>

          <div>
            <label htmlFor="thorax" className="block text-sm font-medium text-gray-700 mb-2">
              Tórax (cm)
            </label>
            <input
              type="number"
              id="thorax"
              name="thorax"
              step="0.1"
              min="0"
              value={formData.thorax}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 80.0"
            />
          </div>

          <div>
            <label htmlFor="hip" className="block text-sm font-medium text-gray-700 mb-2">
              Quadril (cm)
            </label>
            <input
              type="number"
              id="hip"
              name="hip"
              step="0.1"
              min="0"
              value={formData.hip}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 95.0"
            />
          </div>

          <div>
            <label htmlFor="thigh_right" className="block text-sm font-medium text-gray-700 mb-2">
              Coxa Direita (cm)
            </label>
            <input
              type="number"
              id="thigh_right"
              name="thigh_right"
              step="0.1"
              min="0"
              value={formData.thigh_right}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 58.5"
            />
          </div>

          <div>
            <label htmlFor="thigh_left" className="block text-sm font-medium text-gray-700 mb-2">
              Coxa Esquerda (cm)
            </label>
            <input
              type="number"
              id="thigh_left"
              name="thigh_left"
              step="0.1"
              min="0"
              value={formData.thigh_left}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 58.0"
            />
          </div>

          <div>
            <label htmlFor="calf_right" className="block text-sm font-medium text-gray-700 mb-2">
              Panturrilha Direita (cm)
            </label>
            <input
              type="number"
              id="calf_right"
              name="calf_right"
              step="0.1"
              min="0"
              value={formData.calf_right}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 35.0"
            />
          </div>

          <div>
            <label htmlFor="calf_left" className="block text-sm font-medium text-gray-700 mb-2">
              Panturrilha Esquerda (cm)
            </label>
            <input
              type="number"
              id="calf_left"
              name="calf_left"
              step="0.1"
              min="0"
              value={formData.calf_left}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 35.0"
            />
          </div>
        </div>

        {/* Observações */}
        <div>
          <label htmlFor="observations" className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            id="observations"
            name="observations"
            rows={4}
            value={formData.observations}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
            placeholder="Adicione observações sobre a medição, progresso do paciente, etc."
          />
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
          >
            Salvar Medição
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeasurementForm;
