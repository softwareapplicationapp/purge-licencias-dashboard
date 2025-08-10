import React, { useState } from 'react';
import { Plus, Minus, Zap, Shield, Crown, Calendar } from 'lucide-react';
import type { LicenseType } from '../types/License';
import { LicenseGenerator } from '../utils/licenseGenerator';
import { LicenseAPI } from '../services/api';
import { LicenseCreationConfirmation } from './LicenseCreationConfirmation';

interface LicenseCreatorProps {
  onLicenseCreated: () => void;
}

export const LicenseCreator: React.FC<LicenseCreatorProps> = ({ onLicenseCreated }) => {
  const [licenseType, setLicenseType] = useState<LicenseType>('WEEK');
  const [numLicenses, setNumLicenses] = useState<number>(1);
  const [adjustDays, setAdjustDays] = useState<number>(0);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [creationResult, setCreationResult] = useState<any>(null);

  const licenseTypes = [
    { value: 'WEEK' as LicenseType, label: 'Licencia Week', icon: Calendar, color: 'bg-blue-500' },
    { value: 'MONTH' as LicenseType, label: 'Licencia Month', icon: Shield, color: 'bg-green-500' },
    { value: 'YEAR' as LicenseType, label: 'Licencia Year', icon: Calendar, color: 'bg-indigo-500' },
    { value: 'TRIAL' as LicenseType, label: 'Licencia Trial', icon: Calendar, color: 'bg-gray-500' },
    { value: 'LIFETIME' as LicenseType, label: 'Licencia Lifetime', icon: Crown, color: 'bg-purple-500' },
    { value: 'PREMIUM' as LicenseType, label: 'Licencia Premium', icon: Zap, color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
  ];

  const handleCreateLicenses = async () => {
    setIsCreating(true);
    setMessage(null);
    console.log('LicenseCreator: Iniciando creación de licencias...');

    try {
      const licenses = LicenseGenerator.generateLicenses(licenseType, numLicenses);
      console.log('Licencias generadas:', licenses);
      
      const result = await LicenseAPI.createLicenses(licenses);
      console.log('LicenseCreator: Resultado de API de creación:', result);
      
      if (result.success) {
        console.log('LicenseCreator: Licencias creadas exitosamente, llamando onLicenseCreated');
        setCreationResult(result);
        setShowConfirmation(true);
        
        // Reiniciar formulario
        setNumLicenses(1);
        setMessage(null);
      } else {
        console.error('LicenseCreator: API devolvió error:', result.message);
        setCreationResult(result);
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Error en handleCreateLicenses:', error);
      const errorResult = {
        success: false,
        message: `Error al crear licencias: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
      setCreationResult(errorResult);
      setShowConfirmation(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setCreationResult(null);
  };

  const handleCreateMore = () => {
    setShowConfirmation(false);
    setCreationResult(null);
    // Llamar onLicenseCreated aquí, para que actualice la lista de licencias
    onLicenseCreated();
    // Mantener el estado actual del formulario para que el usuario pueda crear más rápidamente
  };

  const canAdjustDays = false; // Removed adjust days functionality

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Create New Licenses</h2>
          <h2 className="text-2xl font-bold text-gray-900">Crear Nuevas Licencias</h2>
        </div>

        <div className="space-y-6">
          {/* License Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Licencia</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {licenseTypes.map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  onClick={() => setLicenseType(value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    licenseType === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Licenses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Número de Licencias</label>
            <input
              type="number"
              min="1"
              max="100"
              value={numLicenses}
              onChange={(e) => setNumLicenses(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Adjust Days (only for WEEK and MONTH) */}
          {canAdjustDays && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Ajustar Días</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAdjustDays(Math.max(adjustDays - 1, -30))}
                  className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium min-w-[60px] text-center">
                  {adjustDays > 0 ? `+${adjustDays}` : adjustDays}
                </span>
                <button
                  onClick={() => setAdjustDays(Math.min(adjustDays + 1, 30))}
                  className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ajustar la duración de la licencia en días (±30 días máximo)
              </p>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={handleCreateLicenses}
            disabled={isCreating || numLicenses < 1}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creando Licencias...' : `Crear ${numLicenses} Licencia${numLicenses > 1 ? 's' : ''}`}
          </button>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <LicenseCreationConfirmation
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        result={creationResult}
        onCreateMore={handleCreateMore}
      />
    </>
  );
};