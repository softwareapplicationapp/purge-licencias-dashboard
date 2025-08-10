import React from 'react';
import { AlertTriangle, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import type { License } from '../types/License';

interface LicenseDeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedLicenses: License[];
  isDeleting: boolean;
  deleteResult?: {
    success: boolean;
    message: string;
    data?: {
      deleted_count: number;
      deleted_licenses: Array<{
        serial: string;
        license: string;
      }>;
    };
  } | null;
}

export const LicenseDeleteConfirmation: React.FC<LicenseDeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedLicenses,
  isDeleting,
  deleteResult
}) => {
  if (!isOpen) return null;

  // If we have a result, show the result screen
  if (deleteResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {deleteResult.success ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-red-500" />
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {deleteResult.success ? '¡Licencias Eliminadas!' : 'Error al Eliminar'}
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
            {deleteResult.success && deleteResult.data ? (
              <>
                {/* Summary */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2">Eliminación Exitosa</h3>
                  <p className="text-green-700">
                    Se eliminaron exitosamente {deleteResult.data.deleted_count} licencia{deleteResult.data.deleted_count > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Details */}
                {deleteResult.data.deleted_licenses && deleteResult.data.deleted_licenses.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Licencias Eliminadas</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {deleteResult.data.deleted_licenses.map((license, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="font-mono text-sm text-gray-900">{license.serial}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  {license.license}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-red-800">{deleteResult.message}</p>
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
  }

  // Show confirmation screen
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Confirmar Eliminación</h2>
            <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <p className="text-red-800 font-medium mb-2">
              ¿Estás seguro de que quieres eliminar {selectedLicenses.length} licencia{selectedLicenses.length > 1 ? 's' : ''}?
            </p>
            <div className="text-sm text-red-700 space-y-1">
              {selectedLicenses.slice(0, 5).map(license => (
                <div key={license.id} className="font-mono">
                  • {license.serial} ({license.license})
                </div>
              ))}
              {selectedLicenses.length > 5 && (
                <div className="text-red-600">
                  ... y {selectedLicenses.length - 5} más
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-amber-800">
                <p className="font-medium">¡Advertencia!</p>
                <p className="text-sm">Las licencias eliminadas no podrán ser recuperadas. Asegúrate de que realmente quieres eliminarlas.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Eliminar {selectedLicenses.length} licencia{selectedLicenses.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};