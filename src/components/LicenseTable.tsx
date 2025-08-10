import React, { useState, useEffect } from 'react';
import { Calendar, Copy, Plus, Minus, Check, X, Search, Filter, Clock, ChevronUp, ChevronDown, Users, Settings } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import type { License } from '../types/License';
import { LicenseAPI } from '../services/api';
import { LicenseUpdateConfirmation } from './LicenseUpdateConfirmation';
import { LicenseDeleteConfirmation } from './LicenseDeleteConfirmation';

interface LicenseTableProps {
  licenses: License[];
  onRefresh: () => void;
}

type SortField = 'serial' | 'license' | 'licensedate' | 'created_at' | 'id';
type SortDirection = 'asc' | 'desc';

export const LicenseTable: React.FC<LicenseTableProps> = ({ licenses, onRefresh }) => {
  const [selectedLicenses, setSelectedLicenses] = useState<number[]>([]);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [customDays, setCustomDays] = useState<{ [key: number]: number }>({});
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showBulkOperations, setShowBulkOperations] = useState<boolean>(false);
  const [bulkDays, setBulkDays] = useState<number>(1);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteResult, setDeleteResult] = useState<any>(null);

  // Filter licenses based on search and filter criteria
  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = searchTerm === '' || 
      license.serial.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = licenseTypeFilter === 'ALL' || license.license === licenseTypeFilter;
    
    const matchesStatus = statusFilter === 'TODOS' || 
      (statusFilter === 'PERMANENTE' && license.licensedate.includes('9999')) ||
      (statusFilter === 'INACTIVA' && license.licensedate.includes('1970')) ||
      (statusFilter === 'TEMPORAL' && !license.licensedate.includes('9999') && !license.licensedate.includes('1970'));
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort licenses
  const sortedLicenses = [...filteredLicenses].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'serial':
        aValue = a.serial.toLowerCase();
        bValue = b.serial.toLowerCase();
        break;
      case 'license':
        aValue = a.license;
        bValue = b.license;
        break;
      case 'licensedate':
        aValue = new Date(a.licensedate).getTime();
        bValue = new Date(b.licensedate).getTime();
        break;
      case 'created_at':
        aValue = new Date(a.created_at || '2000-01-01').getTime();
        bValue = new Date(b.created_at || '2000-01-01').getTime();
        break;
      case 'id':
        aValue = a.id;
        bValue = b.id;
        break;
      default:
        aValue = a.id;
        bValue = b.id;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectLicense = (licenseId: number) => {
    setSelectedLicenses(prev => 
      prev.includes(licenseId) 
        ? prev.filter(id => id !== licenseId)
        : [...prev, licenseId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLicenses.length === sortedLicenses.length) {
      setSelectedLicenses([]);
    } else {
      setSelectedLicenses(sortedLicenses.map(license => license.id));
    }
  };

  const handleBulkUpdateDates = async (operation: 'add' | 'subtract') => {
    if (selectedLicenses.length === 0) return;

    setIsUpdating(true);

    try {
      const result = await LicenseAPI.updateLicenseDates(selectedLicenses, operation, bulkDays);
      
      if (result.success) {
        setUpdateResult(result);
        setShowUpdateModal(true);
        console.log('Bulk update result:', result);
        setSelectedLicenses([]);
      } else {
        setUpdateResult(result);
        setShowUpdateModal(true);
      }
    } catch (error) {
      setUpdateResult({
        success: false,
        message: 'Error al actualizar fechas de licencias'
      });
      setShowUpdateModal(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCustomDaysChange = (licenseId: number, days: number) => {
    setCustomDays(prev => ({
      ...prev,
      [licenseId]: days
    }));
  };

  const handleUpdateCustomDays = async (licenseId: number, operation: 'add' | 'subtract') => {
    const days = customDays[licenseId] || 0;
    if (days === 0) return;

    // Find the license to get its serial
    const license = licenses.find(l => l.id === licenseId);
    if (!license) return;

    setIsUpdating(true);

    try {
      const result = await LicenseAPI.updateLicenseDatesBySerial(license.serial, operation, days);
      
      if (result.success) {
        setUpdateResult(result);
        setShowUpdateModal(true);
        console.log('Individual update result:', result);
        setCustomDays(prev => ({
          ...prev,
          [licenseId]: 0
        }));
      } else {
        setUpdateResult(result);
        setShowUpdateModal(true);
      }
    } catch (error) {
      console.error('Error updating custom days:', error);
      setUpdateResult({
        success: false,
        message: 'Error al actualizar fecha de licencia'
      });
      setShowUpdateModal(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCloseUpdateModal = () => {
    setShowUpdateModal(false);
    setUpdateResult(null);
    // Refresh data after closing modal
    onRefresh();
  };

  const handleDeleteSelected = async () => {
    if (selectedLicenses.length === 0) return;

    setIsDeleting(true);
    setDeleteResult(null);

    try {
      // Get the serials of selected licenses
      const licensesToDelete = licenses.filter(license => selectedLicenses.includes(license.id));
      const serials = licensesToDelete.map(license => license.serial);

      console.log('Deleting licenses with serials:', serials);
      const result = await LicenseAPI.deleteLicenses(serials);
      
      console.log('Delete result:', result);
      setDeleteResult(result);
      
      if (result.success) {
        setSelectedLicenses([]);
      }
    } catch (error) {
      console.error('Error deleting licenses:', error);
      setDeleteResult({
        success: false,
        message: 'Error al eliminar licencias'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteResult(null);
    // Refresh data after closing modal if delete was successful
    if (deleteResult?.success) {
      onRefresh();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    if (dateString.includes('1970')) return 'No Establecido';
    if (dateString.includes('9999')) return 'Permanente';
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getDaysRemaining = (dateString: string) => {
    if (dateString.includes('1970') || dateString.includes('9999')) return null;
    
    const expiryDate = new Date(dateString);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  const getLicenseTypeBadge = (license: string) => {
    const colors = {
      'WEEK': 'bg-blue-100 text-blue-800',
      'MONTH': 'bg-green-100 text-green-800',
      'YEAR': 'bg-indigo-100 text-indigo-800',
      'TRIAL': 'bg-gray-100 text-gray-800',
      'LIFETIME': 'bg-purple-100 text-purple-800',
      'PREMIUM': 'bg-amber-100 text-amber-800',
    };
    return colors[license as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isTemporaryLicense = (license: License) => {
    return ['WEEK', 'MONTH', 'YEAR', 'TRIAL'].includes(license.license) && 
           !license.licensedate.includes('1970') && 
           !license.licensedate.includes('9999');
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </th>
  );

  // Auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Licencias</h2>
          </div>
          
          <button
            onClick={() => setShowBulkOperations(!showBulkOperations)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Operaciones en Lote
          </button>
        </div>

        {/* Bulk Operations Panel */}
        {showBulkOperations && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Operaciones en Lote</h3>
              </div>
              {selectedLicenses.length > 0 && (
                <span className="text-sm text-gray-600 bg-blue-100 px-3 py-1 rounded-full">
                  {selectedLicenses.length} seleccionadas
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Días:</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={bulkDays}
                  onChange={(e) => setBulkDays(parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedLicenses.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar ({selectedLicenses.length})
                </button>
                <button
                  onClick={() => handleBulkUpdateDates('subtract')}
                  disabled={isUpdating || selectedLicenses.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  <Minus className="h-4 w-4" />
                  Restar {bulkDays} día(s)
                </button>
                <button
                  onClick={() => handleBulkUpdateDates('add')}
                  disabled={isUpdating || selectedLicenses.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Añadir {bulkDays} día(s)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={licenseTypeFilter}
              onChange={(e) => setLicenseTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="WEEK">Week</option>
              <option value="MONTH">Month</option>
              <option value="YEAR">Year</option>
              <option value="TRIAL">Trial</option>
              <option value="LIFETIME">Lifetime</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="PERMANENTE">Permanente (9999)</option>
              <option value="INACTIVA">Inactiva (1970)</option>
              <option value="TEMPORAL">Temporal (Week/Month activas)</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600 flex items-center">
            Mostrando {sortedLicenses.length} de {licenses.length} licencias
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              ) : (
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedLicenses.length === sortedLicenses.length && sortedLicenses.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <SortHeader field="serial">Serial</SortHeader>
              <SortHeader field="license">Tipo de Licencia</SortHeader>
              <SortHeader field="licensedate">Fecha de Expiración</SortHeader>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Días Restantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ajustar Días
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedLicenses.map((license, index) => {
              const daysRemaining = getDaysRemaining(license.licensedate);
              const isExpired = daysRemaining !== null && daysRemaining < 0;
              
              return (
                <tr key={`${license.id}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedLicenses.includes(license.id)}
                      onChange={() => handleSelectLicense(license.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        {license.serial}
                      </span>
                      <button
                        onClick={() => copyToClipboard(license.serial)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                        title="Copiar serial"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLicenseTypeBadge(license.license)}`}>
                      {license.license}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatDate(license.licensedate)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {daysRemaining !== null ? (
                      <div className="flex items-center gap-2">
                        <Clock className={`h-4 w-4 ${isExpired ? 'text-red-500' : daysRemaining <= 3 ? 'text-orange-500' : 'text-green-500'}`} />
                        <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : daysRemaining <= 3 ? 'text-orange-600' : 'text-green-600'}`}>
                          {isExpired ? `Expirado hace ${Math.abs(daysRemaining)} día(s)` : `${daysRemaining} día(s)`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {license.licensedate.includes('9999') ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : license.licensedate.includes('1970') ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <Calendar className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-sm text-gray-900">
                        {license.licensedate.includes('9999') ? 'Permanente' : 
                         license.licensedate.includes('1970') ? 'Inactiva' : 'Temporal'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isTemporaryLicense(license) ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={customDays[license.id] || ''}
                          onChange={(e) => handleCustomDaysChange(license.id, parseInt(e.target.value) || 0)}
                          placeholder="Días"
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleUpdateCustomDays(license.id, 'subtract')}
                          disabled={isUpdating || !customDays[license.id]}
                          className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                          title="Restar días"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateCustomDays(license.id, 'add')}
                          disabled={isUpdating || !customDays[license.id]}
                          className="p-1 rounded bg-green-100 text-green-600 hover:bg-green-200 transition-colors disabled:opacity-50"
                          title="Añadir días"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedLicenses.length === 0 && licenses.length > 0 && (
        <div className="p-12 text-center">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay licencias que coincidan con tus filtros</p>
        </div>
      )}
      
      {licenses.length === 0 && (
        <div className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron licencias</p>
        </div>
      )}
      
      {/* Update Confirmation Modal */}
      <LicenseUpdateConfirmation
        isOpen={showUpdateModal}
        onClose={handleCloseUpdateModal}
        result={updateResult}
      />
      
      {/* Delete Confirmation Modal */}
      <LicenseDeleteConfirmation
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteSelected}
        selectedLicenses={licenses.filter(license => selectedLicenses.includes(license.id))}
        isDeleting={isDeleting}
        deleteResult={deleteResult}
      />
    </div>
  );
};