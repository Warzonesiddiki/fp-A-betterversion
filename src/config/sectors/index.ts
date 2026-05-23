import { technologyConfig } from './technology';
import { manufacturingConfig } from './manufacturing';
import { retailConfig } from './retail';
import { bankingConfig } from './banking';
import { healthcareConfig } from './healthcare';
import { energyConfig } from './energy';
import { realestateConfig } from './realestate';
import { constructionConfig } from './construction';
import { insuranceConfig } from './insurance';
import { telecomConfig } from './telecom';
import { logisticsConfig } from './logistics';
import { hospitalityConfig } from './hospitality';
import { governmentConfig } from './government';
import { educationConfig } from './education';
import { agricultureConfig } from './agriculture';

export interface SectorKPI {
  id: string;
  label: string;
  format: 'currency' | 'percent' | 'number';
  target: number;
  lowerIsBetter?: boolean;
}

export interface SectorConfig {
  id: string;
  name: string;
  description: string;
  defaultKPIs: SectorKPI[];
  enabledModules: string[];
  sidebarOrder: string[];
  defaultCurrency: string;
}

export const sectorRegistry: Record<string, SectorConfig> = {
  technology: technologyConfig,
  manufacturing: manufacturingConfig,
  retail: retailConfig,
  banking: bankingConfig,
  healthcare: healthcareConfig,
  energy: energyConfig,
  realestate: realestateConfig,
  construction: constructionConfig,
  insurance: insuranceConfig,
  telecom: telecomConfig,
  logistics: logisticsConfig,
  hospitality: hospitalityConfig,
  government: governmentConfig,
  education: educationConfig,
  agriculture: agricultureConfig,
};

export function getSectorConfig(id: string): SectorConfig | null {
  return sectorRegistry[id] || null;
}

export function getAllSectors(): SectorConfig[] {
  return Object.values(sectorRegistry);
}

export function validateConfig(config: SectorConfig): boolean {
  if (!config.id || !config.name) return false;
  if (!config.defaultKPIs || config.defaultKPIs.length < 5) return false;
  if (!config.enabledModules || config.enabledModules.length < 3) return false;
  if (!config.sidebarOrder || config.sidebarOrder.length < 10) return false;

  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
  if (!validCurrencies.includes(config.defaultCurrency)) return false;

  return true;
}
