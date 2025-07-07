
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowLeft } from 'lucide-react';
import { useCreatePatient } from '@/hooks/usePatients';
import { useToast } from '@/hooks/use-toast';

const AddPatient = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createPatientMutation = useCreatePatient();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    gender: '',
    height: '',
    athleteMode: false,
    activityLevel: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Map form data to the expected Patient interface
      const patientData = {
        name: formData.name,
        email: formData.email || undefined,
        birth_date: formData.birthDate,
        gender: formData.gender === 'Feminino' ? 0 : 1, // 0=feminino, 1=masculino
        height_cm: parseFloat(formData.height),
        athlete_mode: formData.athleteMode,
        activity_level: getActivityLevelNumber(formData.activityLevel)
      };

      console.log('Enviando dados do paciente:', patientData);

      await createPatientMutation.mutateAsync(patientData);
      
      toast({
        title: "Sucesso!",
        description: "Paciente cadastrado com sucesso.",
      });

      navigate('/patients');
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar paciente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityLevelNumber = (level: string): number => {
    const levels = {
      'Sedentário': 0,
      'Levemente ativo': 1,
      'Moderadamente ativo': 2,
      'Muito ativo': 3,
      'Extremamente ativo': 4
    };
    return levels[level as keyof typeof levels] || 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Novo Paciente</h1>
          <p className="text-gray-600">Preencha os dados do paciente</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Informações Pessoais</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nome Completo */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Digite o nome completo do paciente"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Digite o email do paciente (opcional)"
            />
          </div>

          {/* Data de Nascimento e Gênero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                Data de Nascimento *
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                required
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gênero *
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              >
                <option value="">Selecione o gênero</option>
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
              </select>
            </div>
          </div>

          {/* Altura */}
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
              Altura (cm) *
            </label>
            <input
              type="number"
              id="height"
              name="height"
              required
              min="100"
              max="250"
              step="0.1"
              value={formData.height}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
              placeholder="Ex: 170"
            />
          </div>

          {/* Nível de Atividade */}
          <div>
            <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Atividade Física *
            </label>
            <select
              id="activityLevel"
              name="activityLevel"
              required
              value={formData.activityLevel}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-200"
            >
              <option value="">Selecione o nível de atividade</option>
              <option value="Sedentário">Sedentário</option>
              <option value="Levemente ativo">Levemente ativo</option>
              <option value="Moderadamente ativo">Moderadamente ativo</option>
              <option value="Muito ativo">Muito ativo</option>
              <option value="Extremamente ativo">Extremamente ativo</option>
            </select>
          </div>

          {/* Modo Atleta */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="athleteMode"
              name="athleteMode"
              checked={formData.athleteMode}
              onChange={handleChange}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="athleteMode" className="text-sm font-medium text-gray-700">
              Modo Atleta (para pessoas com alta massa muscular)
            </label>
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Cadastrando...' : 'Cadastrar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatient;
