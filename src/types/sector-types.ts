// TECHNOLOGY / SaaS
export interface SaaSMetrics {
  arr: number;
  nrr: number;
  grr: number;
  logoChurnRate: number;
  revenueChurnRate: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  magicNumber: number;
  quickRatio: number;
  paybackPeriodMonths: number;
  grossMargin: number;
}

export interface CohortData {
  cohort: string;
  periods: (number | null)[];
  customerCount: number;
  averageRevenuePerCustomer: number;
}

// MANUFACTURING
export interface ProductionMetrics {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  capacity: number;
  utilization: number;
  throughput: number;
  yield: number;
  scrapRate: number;
  cycleTime: number;
}

export interface BOMItem {
  id: string;
  parentId: string | null;
  componentId: string;
  componentName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  level: number;
}

// RETAIL
export interface RetailMetrics {
  sameStoreSalesGrowth: number;
  footTraffic: number;
  conversionRate: number;
  basketSize: number;
  averageUnitRetail: number;
  sellThroughRate: number;
  inventoryTurnover: number;
  GMROI: number;
  shrinkRate: number;
  promotionalROI: number;
}

// FINANCIAL SERVICES
export interface BankingMetrics {
  netInterestMargin: number;
  roa: number;
  roe: number;
  efficiencyRatio: number;
  cet1Ratio: number;
  tier1Ratio: number;
  tier2Ratio: number;
  totalCapitalRatio: number;
  leverageRatio: number;
  lcr: number;
  nsfr: number;
}

export interface LoanLossReserve {
  period: string;
  grossLoans: number;
  allowanceBalance: number;
  chargeOffs: number;
  recoveries: number;
  provisionExpense: number;
  netChargeOffs: number;
  coverageRatio: number;
  reserveRatio: number;
}

// HEALTHCARE
export interface HospitalMetrics {
  patientVolume: number;
  admissions: number;
  patientDays: number;
  averageLengthOfStay: number;
  bedOccupancyRate: number;
  caseMixIndex: number;
  rvus: number;
  grossRevenue: number;
  netRevenue: number;
  denialRate: number;
  readmissionRate: number;
  payerMix: { payer: string; percentage: number }[];
}

// REAL ESTATE
export interface PropertyMetrics {
  noi: number;
  capRate: number;
  occupancyRate: number;
  averageRent: number;
  leaseYield: number;
  walt: number;
  irr: number;
  equityMultiple: number;
  debtYield: number;
  dscr: number;
  camRecoveryRate: number;
}

// ENERGY
export interface EnergyMetrics {
  productionVolume: number;
  unitCost: number;
  commodityPrice: number;
  refineryMargin: number;
  findingCost: number;
  reserveReplacementRatio: number;
  renewablesCapacity: number;
}

// CONSTRUCTION
export interface JobCostMetrics {
  originalBudget: number;
  revisedBudget: number;
  actualCost: number;
  earnedValue: number;
  plannedValue: number;
  spi: number;
  cpi: number;
  percentComplete: number;
  changeOrderCount: number;
  changeOrderValue: number;
  retention: number;
  backlog: number;
}

// INSURANCE
export interface InsuranceMetrics {
  grossWrittenPremium: number;
  netWrittenPremium: number;
  earnedPremium: number;
  lossRatio: number;
  expenseRatio: number;
  combinedRatio: number;
  lossTriangles: number[][];
  reserveAdequacy: number;
  policyRetentionRate: number;
}

// TELECOM
export interface TelecomMetrics {
  arpu: number;
  voluntaryChurn: number;
  involuntaryChurn: number;
  subscriberAcquisitionCost: number;
  networkCostPerGB: number;
  networkCostPerSubscriber: number;
  spectrumAmortization: number;
}

// ESG
export interface ESGMetrics {
  scope1Emissions: number;
  scope2Emissions: number;
  scope3Emissions: number;
  totalCarbonFootprint: number;
  carbonIntensity: number;
  waterUsage: number;
  wasteGenerated: number;
  wasteRecycled: number;
  renewableEnergyPercent: number;
  diversityScore: number;
  safetyIncidentRate: number;
}

// WORKFORCE
export interface HeadcountInput {
  current: number;
  hires: { period: string; count: number }[];
  attrition: number;
  rampTime: number;
}

export interface AttritionForecast {
  period: string;
  startingHeadcount: number;
  hires: number;
  departures: number;
  endingHeadcount: number;
  attritionRate: number;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'file' | 'api' | 'db' | 'manual';
  status: 'active' | 'inactive' | 'error';
  lastSync?: string;
}

export interface AssetInput {
  id: string;
  name: string;
  cost: number;
  salvageValue: number;
  usefulLife: number; // in years
  startDate: string;
  depreciationMethod: 'straight_line' | 'double_declining' | 'sum_of_years';
}

export interface DepreciationSchedule {
  period: string;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

export interface WorkforceData {
  id: string;
  gender: 'male' | 'female' | 'non_binary' | 'other';
  ethnicity: string;
  isManagement: boolean;
  department: string;
}
