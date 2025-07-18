import type { LicenseCreationData, APIResponse, License } from '../types/License';

const API_BASE_URL = 'https://purgerecoil.club/kz/API';

export class LicenseAPI {
  static async createLicenses(licenses: LicenseCreationData[]): Promise<APIResponse> {
    try {
      console.log('Sending licenses to API:', licenses);
      console.log('API URL:', `${API_BASE_URL}/addlicenses_sellauth.php`);
      const response = await fetch(`${API_BASE_URL}/addlicenses_sellauth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenses),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);
      const responseText = await response.text();
      console.log('API Response text:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed API response:', data);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        // If response is not JSON, use the text as message
        data = { message: responseText };
      }

      return {
        success: true,
        message: 'Licenses created successfully',
        data
      };
    } catch (error) {
      console.error('Error creating licenses:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async fetchLicenses(): Promise<APIResponse> {
    try {
      console.log('Fetching licenses from API...');
      console.log('Fetch URL:', `${API_BASE_URL}/getlicenses.php`);
      const response = await fetch(`${API_BASE_URL}/getlicenses.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Fetch response status:', response.status);
      if (!response.ok) {
        console.error('Fetch response not ok:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Fetch response text:', responseText);
      
      const data = JSON.parse(responseText);
      console.log('Parsed fetch response:', data);
      console.log('Number of licenses fetched:', data.length);
      
      return {
        success: true,
        message: 'Licenses fetched successfully',
        data
      };
    } catch (error) {
      console.error('Error fetching licenses:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
  static async updateLicenseDates(licenseIds: number[], operation: 'add' | 'subtract', days: number = 1): Promise<APIResponse> {
    try {
      console.log('Updating license dates:', { licenseIds, operation, days });
      const response = await fetch(`${API_BASE_URL}/update_license_date.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_by_ids',
          operation,
          licenseIds,
          days
        }),
      });

      console.log('API Response status:', response.status);
      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      // Clean the response text by removing any extra characters after JSON
      const cleanedResponse = responseText.trim();
      let jsonText = cleanedResponse;
      
      // Find the last } character to truncate any extra content
      const lastBraceIndex = cleanedResponse.lastIndexOf('}');
      if (lastBraceIndex !== -1 && lastBraceIndex < cleanedResponse.length - 1) {
        jsonText = cleanedResponse.substring(0, lastBraceIndex + 1);
        console.log('Cleaned JSON text:', jsonText);
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(jsonText);
        console.log('Parsed JSON:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        console.error('Character at position 270:', responseText.charAt(270));
        console.error('Characters around position 270:', responseText.substring(265, 275));
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      return {
        success: true,
        message: data.message || 'License dates updated successfully',
        data
      };
    } catch (error) {
      console.error('Error updating license dates:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  static async updateLicenseDatesBySerial(serial: string, operation: 'add' | 'subtract', days: number = 1): Promise<APIResponse> {
    try {
      console.log('Updating license date by serial:', { serial, operation, days });
      const response = await fetch(`${API_BASE_URL}/update_license_date.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_by_serial',
          operation,
          serial,
          days
        }),
      });

      console.log('API Response status:', response.status);
      const responseText = await response.text();
      console.log('API Response text:', responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed JSON:', data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text that failed to parse:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      return {
        success: true,
        message: data.message || 'License date updated successfully',
        data
      };
    } catch (error) {
      console.error('Error updating license date:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}