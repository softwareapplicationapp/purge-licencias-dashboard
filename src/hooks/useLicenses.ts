import { useState, useEffect } from 'react';
import type { License } from '../types/License';
import { LicenseAPI } from '../services/api';

export const useLicenses = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('useLicenses: Iniciando descarga de licencias...');
      
      const result = await LicenseAPI.fetchLicenses();
      console.log('useLicenses: Resultado de API:', result);
      
      if (result.success && result.data) {
        console.log('useLicenses: Configurando licencias:', result.data);
        setLicenses(result.data);
        // También almacenar en localStorage como respaldo
        localStorage.setItem('licenses', JSON.stringify(result.data));
      } else {
        console.warn('useLicenses: Descarga de API falló o no hay datos, usando respaldo de localStorage');
        // Respaldo a localStorage si la API falla
        const storedLicenses = localStorage.getItem('licenses');
        if (storedLicenses) {
          console.log('useLicenses: Usando licencias almacenadas:', storedLicenses);
          setLicenses(JSON.parse(storedLicenses));
        } else {
          console.log('useLicenses: No se encontraron licencias almacenadas, configurando array vacío');
          setLicenses([]);
        }
      }
    } catch (err) {
      console.error('Error al descargar licencias:', err);
      setError('Error al cargar licencias');
      // Respaldo a localStorage
      const storedLicenses = localStorage.getItem('licenses');
      if (storedLicenses) {
        console.log('useLicenses: Respaldo de error - usando licencias almacenadas');
        setLicenses(JSON.parse(storedLicenses));
      } else {
        console.log('useLicenses: Respaldo de error - no hay licencias almacenadas, configurando array vacío');
        setLicenses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addLicense = (license: License) => {
    setLicenses(prev => {
      const updated = [...prev, license];
      localStorage.setItem('licenses', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLicense = (id: number, updatedLicense: Partial<License>) => {
    setLicenses(prev => {
      const updated = prev.map(license => 
        license.id === id ? { ...license, ...updatedLicense } : license
      );
      localStorage.setItem('licenses', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteLicense = (id: number) => {
    setLicenses(prev => {
      const updated = prev.filter(license => license.id !== id);
      localStorage.setItem('licenses', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  return {
    licenses,
    loading,
    error,
    refetch: fetchLicenses,
    addLicense,
    updateLicense,
    deleteLicense,
  };
};