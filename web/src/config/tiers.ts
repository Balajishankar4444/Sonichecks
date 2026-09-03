export type ProductTier = 'FREE' | 'PRO' | 'STUDIO';

export interface TierFeatures {
  id: ProductTier;
  name: string;
  priceEur: number;
  monthlyFileLimit: number;
  maxBatchSize: number;
  allowBatchProcessing: boolean;
  allowBatchMatrix: boolean;
  allowPdfExport: boolean;
  allowCsvExport: boolean;
  allowSha256Certificate: boolean;
  allowHistory: boolean;
  allowCustomProfiles: boolean;
  allowProjects: boolean;
  priorityProcessing: boolean;
  description: string;
  badge?: string;
  ctaText: string;
}

export const TIER_CONFIGS: Record<ProductTier, TierFeatures> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    priceEur: 0,
    monthlyFileLimit: 5,
    maxBatchSize: 1,
    allowBatchProcessing: false,
    allowBatchMatrix: false,
    allowPdfExport: false,
    allowCsvExport: false,
    allowSha256Certificate: false,
    allowHistory: false,
    allowCustomProfiles: false,
    allowProjects: false,
    priorityProcessing: false,
    description: 'For trying Sonichecks with genuine single-file QC.',
    ctaText: 'Start Free'
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    priceEur: 4.99,
    monthlyFileLimit: 100,
    maxBatchSize: 50,
    allowBatchProcessing: true,
    allowBatchMatrix: true,
    allowPdfExport: true,
    allowCsvExport: true,
    allowSha256Certificate: true,
    allowHistory: true,
    allowCustomProfiles: true,
    allowProjects: false,
    priorityProcessing: false,
    description: 'For independent audio professionals needing batch QC and reports.',
    badge: 'Recommended',
    ctaText: 'Choose Pro'
  },
  STUDIO: {
    id: 'STUDIO',
    name: 'Studio',
    priceEur: 14.99,
    monthlyFileLimit: 500,
    maxBatchSize: 200,
    allowBatchProcessing: true,
    allowBatchMatrix: true,
    allowPdfExport: true,
    allowCsvExport: true,
    allowSha256Certificate: true,
    allowHistory: true,
    allowCustomProfiles: true,
    allowProjects: true,
    priorityProcessing: true,
    description: 'For studios and higher-volume workflows with projects.',
    ctaText: 'Choose Studio'
  }
};

export function getTierConfig(tierStr?: string): TierFeatures {
  if (!tierStr) return TIER_CONFIGS.FREE;
  const upper = tierStr.toUpperCase() as ProductTier;
  return TIER_CONFIGS[upper] || TIER_CONFIGS.FREE;
}
