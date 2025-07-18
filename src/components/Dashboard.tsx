import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Shield, Crown, RefreshCw } from 'lucide-react';
import type { License } from '../types/License';

interface DashboardProps {
  licenses: License[];
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ licenses, onRefresh }) => {
  const [stats, setStats] = useState({
    total: 0,
    week: 0,
    month: 0,
    lifetime: 0,
    premium: 0,
    premium: 0,
    active: 0,
    inactive: 0,
    weekExpiringSoon: 0,
    monthExpiringSoon: 0,
  });

  useEffect(() => {
    // Calculate tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const newStats = {
      total: licenses.length,
      week: licenses.filter(l => l.license === 'WEEK').length,
      month: licenses.filter(l => l.license === 'MONTH').length,
      lifetime: licenses.filter(l => l.license === 'LIFETIME').length,
      premium: licenses.filter(l => l.license === 'PREMIUM').length,
      active: licenses.filter(l => l.licensedate.includes('9999') || (!l.licensedate.includes('1970') && !l.licensedate.includes('9999'))).length,
      inactive: licenses.filter(l => l.licensedate.includes('1970')).length,
      weekExpiringSoon: licenses.filter(l => l.license === 'WEEK' && l.licensedate.startsWith(tomorrowStr)).length,
      monthExpiringSoon: licenses.filter(l => l.license === 'MONTH' && l.licensedate.startsWith(tomorrowStr)).length,
    };
    setStats(newStats);
  }, [licenses]);

  const statCards = [
    {
      title: 'Licencias Totales',
      value: stats.total,
      icon: Shield,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Licencias Activas',
      value: stats.active,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Licencias Semanales (Expiran Mañana)',
      value: stats.weekExpiringSoon,
      icon: BarChart3,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Licencias Mensuales (Expiran Mañana)',
      value: stats.monthExpiringSoon,
      icon: Crown,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Licencias</h1>
          <p className="text-gray-600 mt-1">Gestiona y monitorea tus licencias de producto</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* License Type Distribution */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Tipo de Licencia</h3>
        <div className="space-y-4">
          {[
            { type: 'WEEK', count: stats.week, color: 'bg-blue-500' },
            { type: 'MONTH', count: stats.month, color: 'bg-green-500' },
            { type: 'LIFETIME', count: stats.lifetime, color: 'bg-purple-500' },
            { type: 'PREMIUM', count: stats.premium, color: 'bg-amber-500' },
          ].map((item) => (
            <div key={item.type} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{item.type}</span>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};