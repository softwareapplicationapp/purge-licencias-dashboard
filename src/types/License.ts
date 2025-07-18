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

export type LicenseType = 'WEEK' | 'MONTH' | 'LIFETIME' | 'LIFETIME_PRO' | 'PREMIUM';

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