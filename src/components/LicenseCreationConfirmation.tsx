import React from 'react';
import { CheckCircle, AlertCircle, Copy, X, Database, ShoppingCart, Plus, Minus } from 'lucide-react';

interface LicenseCreationResult {
  success: boolean;
  message: string;
  data?: {
    inserted_licenses: Array<{
      serial: string;
      license: string;
      cupon: string;
      licenseType: string;
      table: string;
    }>;
    count: number;
    sellauth_responses: {
      [key: string]: any;
    };
  };
}

interface LicenseCreationConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  result: LicenseCreationResult | null;
  onCreateMore: () => void;
}

export const LicenseCreationConfirmation: React.FC<LicenseCreationConfirmationProps> = ({
  isOpen,
  onClose,
  result,
  onCreateMore
}) => {
  if (!isOpen || !result) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllSerials = () => {
    if (result.data?.inserted_licenses) {
      const serials = result.data.inserted_licenses.map(license => license.serial).join('\n');
      navigator.clipboard.writeText(serials);
    }
  };

  const copyAllCoupons = () => {
    if (result.data?.inserted_licenses) {
      const coupons = result.data.inserted_licenses
        .filter(license => license.cupon)
        .map(license => license.cupon)
        .join('\n');
      navigator.clipboard.writeText(coupons);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {result.success ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <AlertCircle className="h-8 w-8 text-red-500" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {result.success ? '¡Licencias Creadas Exitosamente!' : 'Error al Crear Licencias'}
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
                <h3 className="font-semibold text-green-800 mb-2">Resumen de Creación</h3>
                <p className="text-green-700">
                  Se crearon exitosamente {result.data.count} licencia{result.data.count > 1 ? 's' : ''} 
                  y se añadieron al inventario de SellAuth
                </p>
              </div>

              {/* Bulk Actions */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={copyAllSerials}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  Copiar Todos los Serials
                </button>
                {result.data.inserted_licenses.some(l => l.cupon) && (
                  <button
                    onClick={copyAllCoupons}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar Todos los Cupones
                  </button>
                )}
              </div>

              {/* License Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  Licencias Creadas
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serial</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cupón</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tabla</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.data.inserted_licenses.map((license, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className="font-mono text-sm text-gray-900">{license.serial}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {license.licenseType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {license.cupon ? (
                              <span className="font-mono text-sm text-gray-900">{license.cupon}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                              {license.table}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => copyToClipboard(license.serial)}
                                className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                title="Copiar serial"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              {license.cupon && (
                                <button
                                  onClick={() => copyToClipboard(license.cupon)}
                                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                                  title="Copiar cupón"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SellAuth Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  Estado de Integración SellAuth
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(result.data.sellauth_responses).map(([licenseType, response]) => (
                    <div key={licenseType} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{licenseType}</span>
                        {response.error ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            Error
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Éxito
                          </span>
                        )}
                      </div>
                      {response.error ? (
                        <p className="text-red-600 text-sm">{response.error}</p>
                      ) : (
                        <p className="text-green-600 text-sm">
                          Añadido al inventario de SellAuth ({Array.isArray(response) ? response.length : 'cantidad desconocida'} elementos totales)
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-red-800">{result.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cerrar
          </button>
          {result.success && (
            <button
              onClick={onCreateMore}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Crear Más Licencias
            </button>
          )}
        </div>
      </div>
    </div>
  );
};