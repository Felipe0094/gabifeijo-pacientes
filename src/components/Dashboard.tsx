import React from 'react';
import { Users, TrendingUp, Calendar, FileText, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { useAllMeasurements } from '@/hooks/useMeasurements';

const Dashboard = () => {
  // Mock data - será substituído por dados reais posteriormente
  const { data: patients = [], isLoading: patientsLoading } = usePatients();
  const { data: allMeasurements = [], isLoading: measurementsLoading } = useAllMeasurements();
  const now = new Date();
  const last30Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
  const measurementsLastMonth = allMeasurements.filter(m => m.type === 'scale' && new Date(m.timestamp) >= last30Days).length;
  const stats = {
    totalPatients: patients.length,
    measurementsLastMonth,
    pendingConsultations: 0,
    completedGoals: 0
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-800">
          Bem-vinda, <span className="text-green-600">Gabriela!</span>
        </h1>
        <p className="text-lg text-gray-600">
          Acompanhe a evolução dos seus pacientes de forma simples e eficiente
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pacientes</p>
              <p className="text-3xl font-bold text-green-600">{patientsLoading ? '...' : stats.totalPatients}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Medições no último mês</p>
              <p className="text-3xl font-bold text-blue-600">{measurementsLoading ? '...' : stats.measurementsLastMonth}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultas Pendentes</p>
              <p className="text-3xl font-bold text-orange-600">0</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Metas Alcançadas</p>
              <p className="text-3xl font-bold text-purple-600">0</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Painel Personalizado */}
      <div
        className="relative rounded-xl p-6 md:p-12 shadow-lg border border-gray-100 flex items-center justify-center min-h-[320px] md:min-h-[560px] mt-8"
        style={{
          backgroundImage: `url('/gabi.png')`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'white',
        }}
      >
        <div className="relative z-10 flex items-center justify-center w-full h-full">
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
