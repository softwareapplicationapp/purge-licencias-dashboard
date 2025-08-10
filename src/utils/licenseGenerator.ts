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
      if (['WEEK', 'MONTH', 'YEAR', 'TRIAL'].includes(licenseType)) {
        cupon = this.generateCouponCode();
      }
      
      // All license types go to apipro table now
      const actualLicenseType = licenseType;
      
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
      case 'YEAR':
        return 'Licencia Year';
      case 'TRIAL':
        return 'Licencia Trial';
      case 'LIFETIME':
        return 'Licencia Lifetime';
      case 'PREMIUM':
        return 'Licencia Premium';
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
      case 'YEAR':
        return 'bg-indigo-500';
      case 'TRIAL':
        return 'bg-gray-500';
      case 'LIFETIME':
        return 'bg-purple-500';
      case 'PREMIUM':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  }
}