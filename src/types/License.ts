export interface License {
  id: number;
  serial: string;
  license: string;
  cupon?: string;
  licensedate: string;
  whitelist?: string;
  created_at?: string;
}

export interface LicenseCreationData {
  serial: string;
  license: string;
  cupon: string;
  licenseType?: LicenseType; // Add this to help backend determine table
}

export type LicenseType = 'WEEK' | 'MONTH' | 'YEAR' | 'LIFETIME' | 'PREMIUM' | 'TRIAL';

export interface CreateLicenseRequest {
  licenseType: LicenseType;
  numLicenses: number;
  adjustDays?: number;
}

export interface APIResponse {
  success: boolean;
  message: string;
  data?: any;
}