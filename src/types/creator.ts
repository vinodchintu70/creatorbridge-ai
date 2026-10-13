export type AITool =
  | 'Flux.1 Dev'
  | 'Runway Gen-3'
  | 'Midjourney v6'
  | 'ComfyUI'
  | 'Kling 1.5'
  | 'ElevenLabs'
  | 'Suno'
  | 'Luma Dream Machine'
  | 'Stable Diffusion XL';

export type CreatorSpecialization =
  | 'AI Commercials'
  | 'Generative Animation'
  | 'Virtual Influencers'
  | 'Product VFX'
  | 'Cinematic Worldbuilding'
  | 'Fashion & Editorial';

export type ContentType = 'Video' | 'Animation' | 'Still Image' | '3D Asset';

export type AspectRatio =
  | '16:9 Landscape'
  | '9:16 Vertical'
  | '1:1 Square'
  | '2.39:1 Cinemascope';

export type CommercialSuitability =
  | 'Full IP Buyout'
  | 'Exclusive Commercial'
  | 'Standard Agency'
  | 'Restricted Editorial';

export interface ProjectWorkflow {
  primaryModel: string;
  prompt: string;
  negativePrompt?: string;
  seed: number;
  sampler: string;
  steps: number;
  cfgScale: number;
  pipelineNodes?: string[];
  consistencyNotes?: string;
  productionTechnique: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  aspectRatio: AspectRatio;
  thumbnailUrl: string;
  mediaType: 'image' | 'video';
  toolsUsed: AITool[];
  workflow: ProjectWorkflow;
  commercialLicense: CommercialSuitability;
  clientOrContext?: string;
}

export type ProvenanceTier =
  | 'demo_evidence'
  | 'self_reported'
  | 'external_linked'
  | 'verified';

export interface VerificationEvidence {
  status: 'verified' | 'unverified';
  provenanceTier?: ProvenanceTier;
  evidenceType?:
    | 'github_repo'
    | 'civitai_model'
    | 'runway_creator_id'
    | 'comfy_workflow_file'
    | 'client_contract';
  evidenceDetail?: string;
  verifiedBadgeText?: string;
  externalUrl?: string;
  provenanceExplanation?: string;
}

export interface Creator {
  id: string;
  userId?: string;
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
  location: string;
  specialization: CreatorSpecialization;
  rateEstimate: string;
  availability: 'Available Now' | 'Within 2 Weeks' | 'Booked';
  skills: string[];
  primaryTools: AITool[];
  commercialSuitability: CommercialSuitability;
  verification: VerificationEvidence;
  portfolio: PortfolioProject[];
}

export interface CreatorFilterState {
  search: string;
  tools: AITool[];
  specializations: CreatorSpecialization[];
  contentTypes: ContentType[];
  aspectRatios: AspectRatio[];
  commercialLicense: CommercialSuitability | 'all';
  verifiedOnly: boolean;
}
