import { AITool } from './creator';

export type BriefContentType =
  | 'Brand Commercial Video'
  | 'Social Video Reel / UGC'
  | '3D Product VFX'
  | 'Key Visual Still'
  | 'Virtual Persona Asset'
  | 'Generative Animation';

export type BriefDistributionChannel =
  | 'Instagram / Reels'
  | 'TikTok'
  | 'YouTube'
  | 'Digital OOH / Billboard'
  | 'Broadcast TV'
  | 'Brand Website / App';

export type BriefCommercialUsage =
  | 'Full Global IP Buyout'
  | '1-Year Digital Exclusive'
  | 'Standard Agency License'
  | 'Restricted Social Use'
  | '';

export type BriefModelSafetyPolicy =
  | 'Commercial-Safe Checkpoints Only (Zero Unlicensed LoRAs)'
  | 'Proprietary Brand-Owned LoRAs Only'
  | 'Creator Discretion with Commercial Warranty';

export interface BriefFormData {
  id?: string;
  userId?: string;
  title: string;
  brandName: string;
  objective: string;
  targetAudience: string;
  channels: BriefDistributionChannel[];
  contentType: BriefContentType;
  creativeStyle: string;
  aspectRatio: string;
  duration: string;
  deliverablesCount: number;
  preferredTools: AITool[];
  requiredSkills: string[];
  commercialUsage: BriefCommercialUsage;
  usageTerritory: string;
  usageDuration: string;
  modelSafetyPolicy: BriefModelSafetyPolicy;
  budgetMin: number | '';
  budgetMax: number | '';
  currency?: 'INR' | 'USD';
  deadline: string;
  creativeConstraints: string;
  referenceLinks: string;
  status: 'draft' | 'published';
  invitedCreatorId?: string;
  savedRemotely?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type BriefValidationErrors = Partial<Record<keyof BriefFormData, string>>;
