import type { LicenseCreationData, LicenseType } from '../types/License';

export class LicenseGenerator {
  static generateRandomUsername(length: number = 15): string {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomUsername = '';
    for (let i = 0; i < length; i++) {
      randomUsername += characters[Math.floor(Math.random() * characters.length)];
    }
    return randomUsername;
  }

  static generateCouponCode(length: number = 5): string {
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomString = 'PURGE';
    for (let i = 0; i < length; i++) {
      randomString += characters[Math.floor(Math.random() * characters.length)];
    }
    return randomString;
  }

  static generateLicenses(licenseType: LicenseType, numLicenses: number): LicenseCreationData[] {
    const licenses: LicenseCreationData[] = [];
    
    for (let i = 0; i < numLicenses; i++) {
      const serial = this.generateRandomUsername();
      let cupon = '';
      
      // Generate coupon for WEEK, MONTH, WEEKSUB, MONTHSUB
      if (licenseType === 'WEEK' || licenseType === 'MONTH') {
        cupon = this.generateCouponCode();
      }
      
      // For LIFETIME_PRO, we use LIFETIME as the license type but it goes to apipro table
      const actualLicenseType = licenseType === 'LIFETIME_PRO' ? 'LIFETIME' : licenseType;
      
      licenses.push({
        serial,
        license: actualLicenseType,
        cupon,
        licenseType: licenseType // Add this to help PHP determine which table to use
      });
    }
    
    return licenses;
  }

  static getLicenseDisplayName(licenseType: LicenseType): string {
    switch (licenseType) {
      case 'WEEK':
        return 'Licencia Week';
      case 'MONTH':
        return 'Licencia Month';
      case 'LIFETIME':
        return 'Licencia Lifetime';
      case 'LIFETIME_PRO':
        return 'Licencia Lifetime Pro';
      default:
        return licenseType;
    }
  }

  static getLicenseColor(licenseType: LicenseType): string {
    switch (licenseType) {
      case 'WEEK':
        return 'bg-blue-500';
      case 'MONTH':
        return 'bg-green-500';
      case 'LIFETIME':
        return 'bg-purple-500';
      case 'LIFETIME_PRO':
        return 'bg-gold-500';
      default:
        return 'bg-gray-500';
    }
  }
}