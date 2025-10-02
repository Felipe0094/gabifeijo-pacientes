import React, { useState } from 'react';
import { Calendar, Ruler, Scale } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface MeasurementFormProps {
  patientId: string;
  editingManual?: any | null;
  editingScale?: any | null;
  onFinishEdit?: () => void;
  heightCm?: number;
}

const MeasurementForm: React.FC<MeasurementFormProps> = ({ patientId, editingManual, editingScale, onFinishEdit, heightCm }) => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<'tape' | 'bio'>('tape');
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
    observations: '',
    weight: '',
    bmi: '',
    body_fat_percent: '',
    visceral_fat_rating: '',
    water_percent: '',
    bone_mass_kg: '',
    muscle_mass_percent_total: '',
    fat_arm_right: '',
    fat_arm_left: '',
    fat_leg_right: '',
    fat_leg_left: '',
    fat_trunk: '',
    muscle_arm_right: '',
    muscle_arm_left: '',
    muscle_leg_right: '',
    muscle_leg_left: '',
    muscle_trunk: '',
    metabolic_age: '',
    daily_calorie_maintenance: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bmiTouched, setBmiTouched] = useState(false);

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
        observations: editingManual.data.observations || '',
        weight: '',
        bmi: '',
        body_fat_percent: '',
        visceral_fat_rating: '',
        water_percent: '',
        bone_mass_kg: '',
        muscle_mass_percent_total: '',
        fat_arm_right: '',
        fat_arm_left: '',
        fat_leg_right: '',
        fat_leg_left: '',
        fat_trunk: '',
        muscle_arm_right: '',
        muscle_arm_left: '',
        muscle_leg_right: '',
        muscle_leg_left: '',
        muscle_trunk: '',
        metabolic_age: '',
        daily_calorie_maintenance: ''
      });
      setCategory('tape');
      setEditingId(editingManual.id || null);
    } else if (editingScale) {
      setFormData({
        date: editingScale.date ? editingScale.date.split('T')[0] : '',
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
        observations: '',
        weight: editingScale.data.weight?.toString() || '',
        bmi: editingScale.data.bmi?.toString() || '',
        body_fat_percent: editingScale.data.bodyFat?.toString() || '',
        visceral_fat_rating: editingScale.data.visceralFat?.toString() || '',
        water_percent: editingScale.data.water?.toString() || '',
        bone_mass_kg: editingScale.data.bone?.toString() || '',
        muscle_mass_percent_total: editingScale.data.muscle?.toString() || '',
        fat_arm_right: editingScale.data.fat_arm_right?.toString() || '',
        fat_arm_left: editingScale.data.fat_arm_left?.toString() || '',
        fat_leg_right: editingScale.data.fat_leg_right?.toString() || '',
        fat_leg_left: editingScale.data.fat_leg_left?.toString() || '',
        fat_trunk: editingScale.data.fat_trunk?.toString() || '',
        muscle_arm_right: editingScale.data.muscle_arm_right?.toString() || '',
        muscle_arm_left: editingScale.data.muscle_arm_left?.toString() || '',
        muscle_leg_right: editingScale.data.muscle_leg_right?.toString() || '',
        muscle_leg_left: editingScale.data.muscle_leg_left?.toString() || '',
        muscle_trunk: editingScale.data.muscle_trunk?.toString() || '',
        metabolic_age: editingScale.data.metabolic_age?.toString() || '',
        daily_calorie_maintenance: editingScale.data.daily_calorie_maintenance?.toString() || ''
      });
      setCategory('bio');
      setEditingId(editingScale.id || null);
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
        observations: '',
        weight: '',
        bmi: '',
        body_fat_percent: '',
        visceral_fat_rating: '',
        water_percent: '',
        bone_mass_kg: '',
        muscle_mass_percent_total: '',
        fat_arm_right: '',
        fat_arm_left: '',
        fat_leg_right: '',
        fat_leg_left: '',
        fat_trunk: '',
        muscle_arm_right: '',
        muscle_arm_left: '',
        muscle_leg_right: '',
        muscle_leg_left: '',
        muscle_trunk: '',
        metabolic_age: '',
        daily_calorie_maintenance: ''
      });
      setEditingId(null);
    }
  }, [editingManual, editingScale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (category === 'tape') {
      const { data: existingMeasurement } = await supabase
        .from('manual_measurements')
        .select('id')
        .eq('patient_id', patientId)
        .eq('timestamp', formData.date)
        .maybeSingle();

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
        ({ error } = await supabase
          .from('manual_measurements')
          .update(insertData)
          .eq('id', existingMeasurement.id));
      } else {
        ({ error } = await supabase
          .from('manual_measurements')
          .insert(insertData)
          .select()
          .single());
      }

      if (error) {
        alert('Erro ao salvar medição: ' + error.message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['manual-measurements', patientId] });
    } else {
      const scaleData: any = {
        patient_id: patientId,
        timestamp: formData.date,
        weight: formData.weight ? Number(formData.weight) : 0,
        bmi: formData.bmi ? Number(formData.bmi) : null,
        body_fat_percent: formData.body_fat_percent ? Number(formData.body_fat_percent) : null,
        visceral_fat_rating: formData.visceral_fat_rating ? Number(formData.visceral_fat_rating) : null,
        water_percent: formData.water_percent ? Number(formData.water_percent) : null,
        bone_mass_kg: formData.bone_mass_kg ? Number(formData.bone_mass_kg) : null,
        muscle_mass_percent_total: formData.muscle_mass_percent_total ? Number(formData.muscle_mass_percent_total) : null,
        fat_arm_right: formData.fat_arm_right ? Number(formData.fat_arm_right) : null,
        fat_arm_left: formData.fat_arm_left ? Number(formData.fat_arm_left) : null,
        fat_leg_right: formData.fat_leg_right ? Number(formData.fat_leg_right) : null,
        fat_leg_left: formData.fat_leg_left ? Number(formData.fat_leg_left) : null,
        fat_trunk: formData.fat_trunk ? Number(formData.fat_trunk) : null,
        muscle_arm_right: formData.muscle_arm_right ? Number(formData.muscle_arm_right) : null,
        muscle_arm_left: formData.muscle_arm_left ? Number(formData.muscle_arm_left) : null,
        muscle_leg_right: formData.muscle_leg_right ? Number(formData.muscle_leg_right) : null,
        muscle_leg_left: formData.muscle_leg_left ? Number(formData.muscle_leg_left) : null,
        muscle_trunk: formData.muscle_trunk ? Number(formData.muscle_trunk) : null,
        metabolic_age: formData.metabolic_age ? Number(formData.metabolic_age) : null,
        daily_calorie_maintenance: formData.daily_calorie_maintenance ? Number(formData.daily_calorie_maintenance) : null,
      };

      let error;
      if (editingId) {
        ({ error } = await supabase
          .from('scale_measurements')
          .update(scaleData)
          .eq('id', editingId));
      } else {
        ({ error } = await supabase
          .from('scale_measurements')
          .insert(scaleData)
          .select()
          .single());
      }

      if (error) {
        alert('Erro ao salvar bioimpedância: ' + error.message);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['scale-measurements', patientId] });
    }
    
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
      observations: '',
      weight: '',
      bmi: '',
      body_fat_percent: '',
      visceral_fat_rating: '',
      water_percent: '',
      bone_mass_kg: '',
      muscle_mass_percent_total: '',
      fat_arm_right: '',
      fat_arm_left: '',
      fat_leg_right: '',
      fat_leg_left: '',
      fat_trunk: '',
      muscle_arm_right: '',
      muscle_arm_left: '',
      muscle_leg_right: '',
      muscle_leg_left: '',
      muscle_trunk: '',
      metabolic_age: '',
      daily_calorie_maintenance: ''
    });
    
    if (onFinishEdit) onFinishEdit();
    alert('Medição salva com sucesso!');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'bmi') setBmiTouched(true);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Auto-calcular IMC quando peso muda e houver altura do paciente
  React.useEffect(() => {
    if (category !== 'bio') return;
    const weight = parseFloat(formData.weight);
    const height = typeof heightCm === 'number' ? heightCm : undefined;
    if (!height || !weight || isNaN(weight) || height <= 0) return;
    if (bmiTouched) return;
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    if (isFinite(bmi)) {
      setFormData(prev => ({ ...prev, bmi: bmi.toFixed(1) }));
    }
  }, [formData.weight, heightCm, category, bmiTouched]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          {category === 'tape' ? (
            <Ruler className="h-5 w-5 text-green-600" />
          ) : (
            <Scale className="h-5 w-5 text-green-600" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Adicionar Medição</h3>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 w-full md:w-auto">
        <button
          type="button"
          onClick={() => setCategory('tape')}
          className={`px-4 py-2 text-sm font-medium ${category === 'tape' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Fita métrica
        </button>
        <button
          type="button"
          onClick={() => setCategory('bio')}
          className={`px-4 py-2 text-sm font-medium border-l ${category === 'bio' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
        >
          Bioimpedância
        </button>
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

        {/* Campos por categoria */}
        {category === 'tape' ? (
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
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
            <input type="number" step="0.1" min="0" id="weight" name="weight" value={formData.weight} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 72.3" />
          </div>
          <div>
            <label htmlFor="bmi" className="block text-sm font-medium text-gray-700 mb-2">IMC</label>
            <input type="number" step="0.1" min="0" id="bmi" name="bmi" value={formData.bmi} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 24.1" />
          </div>
          <div>
            <label htmlFor="body_fat_percent" className="block text-sm font-medium text-gray-700 mb-2">Gordura (%)</label>
            <input type="number" step="0.1" min="0" id="body_fat_percent" name="body_fat_percent" value={formData.body_fat_percent} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 28.5" />
          </div>
          <div>
            <label htmlFor="visceral_fat_rating" className="block text-sm font-medium text-gray-700 mb-2">Gordura Visceral</label>
            <input type="number" step="1" min="0" id="visceral_fat_rating" name="visceral_fat_rating" value={formData.visceral_fat_rating} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 10" />
          </div>
          <div>
            <label htmlFor="water_percent" className="block text-sm font-medium text-gray-700 mb-2">Água (%)</label>
            <input type="number" step="0.1" min="0" id="water_percent" name="water_percent" value={formData.water_percent} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 52.1" />
          </div>
          <div>
            <label htmlFor="bone_mass_kg" className="block text sm font-medium text-gray-700 mb-2">Massa Óssea (kg)</label>
            <input type="number" step="0.1" min="0" id="bone_mass_kg" name="bone_mass_kg" value={formData.bone_mass_kg} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 2.8" />
          </div>
          <div>
            <label htmlFor="muscle_mass_percent_total" className="block text-sm font-medium text-gray-700 mb-2">Músculo Total (%)</label>
            <input type="number" step="0.1" min="0" id="muscle_mass_percent_total" name="muscle_mass_percent_total" value={formData.muscle_mass_percent_total} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 34.2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gordura Segmentada (%)</label>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.1" min="0" name="fat_arm_right" value={formData.fat_arm_right} onChange={handleChange} placeholder="Braço Dir." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="fat_arm_left" value={formData.fat_arm_left} onChange={handleChange} placeholder="Braço Esq." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="fat_leg_right" value={formData.fat_leg_right} onChange={handleChange} placeholder="Perna Dir." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="fat_leg_left" value={formData.fat_leg_left} onChange={handleChange} placeholder="Perna Esq." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="fat_trunk" value={formData.fat_trunk} onChange={handleChange} placeholder="Tronco" className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Músculo Segmentado (%)</label>
            <div className="grid grid-cols-2 gap-4">
              <input type="number" step="0.1" min="0" name="muscle_arm_right" value={formData.muscle_arm_right} onChange={handleChange} placeholder="Braço Dir." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="muscle_arm_left" value={formData.muscle_arm_left} onChange={handleChange} placeholder="Braço Esq." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="muscle_leg_right" value={formData.muscle_leg_right} onChange={handleChange} placeholder="Perna Dir." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="muscle_leg_left" value={formData.muscle_leg_left} onChange={handleChange} placeholder="Perna Esq." className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
              <input type="number" step="0.1" min="0" name="muscle_trunk" value={formData.muscle_trunk} onChange={handleChange} placeholder="Tronco" className="col-span-2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
          </div>
          <div>
            <label htmlFor="metabolic_age" className="block text-sm font-medium text-gray-700 mb-2">Idade Metabólica</label>
            <input type="number" step="1" min="0" id="metabolic_age" name="metabolic_age" value={formData.metabolic_age} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 32" />
          </div>
          <div>
            <label htmlFor="daily_calorie_maintenance" className="block text-sm font-medium text-gray-700 mb-2">DCI (kcal)</label>
            <input type="number" step="1" min="0" id="daily_calorie_maintenance" name="daily_calorie_maintenance" value={formData.daily_calorie_maintenance} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200" placeholder="Ex: 1850" />
          </div>
        </div>
        )}

        {/* Observações (somente fita métrica) */}
        {category === 'tape' && (
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duração-200"
              placeholder="Adicione observações sobre a medição, progresso do paciente, etc."
            />
          </div>
        )}

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
