import React, { useState } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { LicenseCreator } from './components/LicenseCreator';
import { LicenseTable } from './components/LicenseTable';
import { useLicenses } from './hooks/useLicenses';
import { useAuth } from './hooks/useAuth';
import { Plus, List, BarChart3 } from 'lucide-react';

type ActiveTab = 'dashboard' | 'create' | 'manage';

function App() {
  const { isAuthenticated, isLoading, login, logout } = useAuth();
  const { licenses, loading, error, refetch } = useLicenses();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Panel Principal', icon: BarChart3 },
    { id: 'create' as ActiveTab, label: 'Crear Licencias', icon: Plus },
    { id: 'manage' as ActiveTab, label: 'Gestionar Licencias', icon: List },
  ];

  const handleLicenseCreated = () => {
    console.log('App: Licencia creada, actualizando licencias...');
    refetch();
    setActiveTab('manage');
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <Dashboard licenses={licenses} onRefresh={refetch} />
          )}
          
          {activeTab === 'create' && (
            <LicenseCreator onLicenseCreated={handleLicenseCreated} />
          )}
          
          {activeTab === 'manage' && (
            <LicenseTable licenses={licenses} onRefresh={refetch} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;