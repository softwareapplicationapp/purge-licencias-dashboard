import React from 'react';
import { CheckCircle, AlertCircle, X, Calendar, Clock } from 'lucide-react';

interface UpdateResult {
  success: boolean;
  message: string;
  data?: {
    operation?: string;
    days?: number;
    updated_licenses?: Array<{
      id: number;
      serial: string;
      old_date: string;
      new_date: string;
      table: string;
    }>;
    total_updated?: number;
  };
}

interface LicenseUpdateConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  result: UpdateResult | null;
}

export const LicenseUpdateConfirmation: React.FC<LicenseUpdateConfirmationProps> = ({
  isOpen,
  onClose,
  result,
}) => {
  if (!isOpen || !result) return null;

  // Debug logging
  console.log('Modal received result:', result);
  console.log('Result data:', result.data);
  
  // Check if it's an individual operation (has serial directly) or bulk operation (has updated_licenses array)
  const actualData = result.data?.data || result.data; // Handle nested data structure
  const isIndividualOperation = actualData?.serial;
  const isBulkOperation = actualData?.updated_licenses && actualData.updated_licenses.length > 0;
  
  console.log('Is individual operation:', isIndividualOperation);
  console.log('Is bulk operation:', isBulkOperation);
  console.log('Individual data:', actualData?.serial ? actualData : null);
  console.log('Bulk data:', actualData?.updated_licenses ? actualData.updated_licenses : null);
  console.log('Actual data structure:', actualData);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getOperationText = (operation: string) => {
    return operation === 'add' ? 'añadidos' : 'restados';
  };

  // Get data based on operation type
  let operationData, daysValue, operationValue;
  
  if (isIndividualOperation) {
    // Individual operation - data is directly in result.data
    operationData = {
      serial: actualData.serial,
      old_date: actualData.old_date,
      new_date: actualData.new_date,
      table: actualData.table
    };
    daysValue = actualData.days;
    operationValue = actualData.operation;
  } else if (isBulkOperation) {
    // Bulk operation - data is in result.data.updated_licenses array
    operationData = actualData.updated_licenses[0];
    daysValue = actualData.days;
    operationValue = actualData.operation;
  }
  
  console.log('Operation data:', operationData);
  console.log('Days value:', daysValue);
  console.log('Operation value:', operationValue);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {result.success ? '¡Fechas Actualizadas!' : 'Error en Actualización'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {result.success && result.data ? (
            <>
              {/* Summary */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">
                  {isBulkOperation ? 'Operación en Lote Completada' : 'Actualización Individual Completada'}
                </h3>
                <p className="text-green-700">
                  {isBulkOperation ? (
                    `Se han ${getOperationText(operationValue || 'add')} ${daysValue || 0} día(s) a ${actualData?.total_updated || 0} licencia(s)`
                  ) : (
                    `Se han ${getOperationText(operationValue || 'add')} ${daysValue || 0} día(s) a la licencia ${operationData?.serial || 'N/A'}`
                  )}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Detalles de la Actualización
                </h3>
                
                {isBulkOperation && actualData?.updated_licenses ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Anterior</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Nueva</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {actualData.updated_licenses.map((license, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm text-gray-900">{license.serial}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">{formatDate(license.old_date)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-900 font-medium">{formatDate(license.new_date)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                                {license.table}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Individual Operation */
                  operationData && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Serial:</span>
                        <span className="font-mono text-sm text-gray-900">{operationData.serial}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Fecha Anterior:</span>
                        <span className="text-sm text-gray-600">{formatDate(operationData.old_date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Fecha Nueva:</span>
                        <span className="text-sm text-green-600 font-medium">{formatDate(operationData.new_date)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tabla:</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{operationData.table}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-red-800">{result.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};