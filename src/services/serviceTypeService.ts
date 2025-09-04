// Service Type Management Service
export interface ServiceTypeConfig {
  predefined: string[];
  custom: string[];
}

class ServiceTypeService {
  private readonly STORAGE_KEY = 'anjaneya_service_types';

  // Default service types
  private readonly DEFAULT_SERVICE_TYPES: ServiceTypeConfig = {
    predefined: ['Bore Drilling', 'Repair', 'Flushing', 'Earth Purpose'],
    custom: []
  };

  // Get all service types (predefined + custom)
  getAllServiceTypes(): string[] {
    const config = this.getServiceTypeConfig();
    return [...config.predefined, ...config.custom];
  }

  // Get service type configuration
  getServiceTypeConfig(): ServiceTypeConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure we have the required structure
        return {
          predefined: parsed.predefined || this.DEFAULT_SERVICE_TYPES.predefined,
          custom: parsed.custom || []
        };
      }
    } catch (error) {
      console.error('Error loading service types:', error);
    }
    return this.DEFAULT_SERVICE_TYPES;
  }

  // Save service type configuration
  saveServiceTypeConfig(config: ServiceTypeConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving service types:', error);
      throw new Error('Failed to save service types');
    }
  }

  // Add custom service type
  addCustomServiceType(serviceType: string): boolean {
    const config = this.getServiceTypeConfig();
    const trimmedType = serviceType.trim();
    
    // Check if already exists
    if (config.predefined.includes(trimmedType) || config.custom.includes(trimmedType)) {
      return false; // Already exists
    }
    
    config.custom.push(trimmedType);
    this.saveServiceTypeConfig(config);
    return true;
  }

  // Remove custom service type
  removeCustomServiceType(serviceType: string): boolean {
    const config = this.getServiceTypeConfig();
    const index = config.custom.indexOf(serviceType);
    
    if (index > -1) {
      config.custom.splice(index, 1);
      this.saveServiceTypeConfig(config);
      return true;
    }
    
    return false; // Not found
  }

  // Check if service type exists
  serviceTypeExists(serviceType: string): boolean {
    const config = this.getServiceTypeConfig();
    return config.predefined.includes(serviceType) || config.custom.includes(serviceType);
  }

  // Reset to defaults
  resetToDefaults(): void {
    this.saveServiceTypeConfig(this.DEFAULT_SERVICE_TYPES);
  }
}

// Export singleton instance
export const serviceTypeService = new ServiceTypeService();
