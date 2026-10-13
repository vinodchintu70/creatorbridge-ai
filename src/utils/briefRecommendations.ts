import type { BriefContentType, BriefFormData } from '@/types/brief';
import type { AITool } from '@/types/creator';

/**
 * Standard disclaimer for rules-based tool & skill recommendations.
 * Reassures brands while strictly maintaining honesty about creator competence.
 */
export const RECOMMENDATIONS_DISCLAIMER =
  'Suggestions are algorithmic guidance based on your selected deliverables and format. They do not guarantee creator competence or tool compatibility.';

/**
 * Complete canonical list of platform-supported AI generation tools.
 */
export const ALL_AVAILABLE_TOOLS: AITool[] = [
  'Flux.1 Dev',
  'Runway Gen-3',
  'Midjourney v6',
  'ComfyUI',
  'Kling 1.5',
  'ElevenLabs',
  'Suno',
  'Luma Dream Machine',
  'Stable Diffusion XL',
];

/**
 * Canonical catalog of creator skills and technical capabilities recognized by the platform.
 * Aligned with mock creator profiles, project workflows, and production requirements.
 */
export const ALL_AVAILABLE_SKILLS: string[] = [
  'Character Consistency',
  'Camera Motion Control',
  'Cinematic Storytelling',
  'Product Photorealism',
  'Lighting & Compositing',
  'Color Grading',
  '4K Upscaling',
  'ControlNet Precision',
  'LoRA Training',
  'Audio-Driven Lip Sync',
  'Sound Design',
  'Kinetic Motion Loops',
  'Facial Consistency',
  'Editorial Lighting',
  'Inpainting/Outpainting',
  'Stylized Shading',
];

export interface BriefRecommendations {
  suggestedTools: AITool[];
  suggestedSkills: string[];
  rationale: string;
}

/**
 * Baseline recommendations by Content Type.
 */
const BASELINE_BY_CONTENT_TYPE: Record<
  BriefContentType,
  { tools: AITool[]; skills: string[]; rationale: string }
> = {
  'Brand Commercial Video': {
    tools: ['Runway Gen-3', 'Flux.1 Dev', 'ComfyUI', 'Kling 1.5'],
    skills: ['Camera Motion Control', 'Cinematic Storytelling', 'Color Grading', '4K Upscaling'],
    rationale: 'High-fidelity video diffusion, motion vectoring, and commercial color grading.',
  },
  'Social Video Reel / UGC': {
    tools: ['Runway Gen-3', 'Kling 1.5', 'ElevenLabs', 'Midjourney v6'],
    skills: ['Camera Motion Control', 'Audio-Driven Lip Sync', 'Character Consistency', 'Sound Design'],
    rationale: 'Vertical video pacing, synchronized voice, and mobile-first character motion.',
  },
  '3D Product VFX': {
    tools: ['Flux.1 Dev', 'ComfyUI', 'Runway Gen-3', 'Luma Dream Machine'],
    skills: ['Product Photorealism', 'Lighting & Compositing', 'ControlNet Precision', '4K Upscaling'],
    rationale: 'CAD/depth-guided ControlNet pipelines, photorealistic reflections, and product caustics.',
  },
  'Key Visual Still': {
    tools: ['Flux.1 Dev', 'Midjourney v6', 'ComfyUI'],
    skills: ['Editorial Lighting', 'Inpainting/Outpainting', '4K Upscaling', 'ControlNet Precision'],
    rationale: 'Ultra-high-resolution image generation, editorial lighting, and prompt precision.',
  },
  'Virtual Persona Asset': {
    tools: ['Flux.1 Dev', 'ComfyUI', 'Kling 1.5', 'ElevenLabs'],
    skills: ['Character Consistency', 'Facial Consistency', 'Audio-Driven Lip Sync', 'LoRA Training'],
    rationale: 'Facial embedding locks (IP-Adapter/Reactor), custom persona LoRAs, and lip sync.',
  },
  'Generative Animation': {
    tools: ['Kling 1.5', 'ComfyUI', 'Luma Dream Machine', 'Suno'],
    skills: ['Kinetic Motion Loops', 'Stylized Shading', 'Character Consistency', 'Sound Design'],
    rationale: 'Frame interpolation, stylized shading models, and audio-reactive animation loops.',
  },
};

/**
 * Deterministic rules-based recommender for AI tools and creator skills.
 * Evaluates campaign deliverables, content type, distribution channels, aspect ratio,
 * and text keywords in the objective or creative style.
 *
 * Never overwrites user selections. Returns curated suggestions.
 */
export function getSmartToolAndSkillRecommendations(
  data: Partial<BriefFormData>
): BriefRecommendations {
  const contentType = data.contentType || 'Brand Commercial Video';
  const baseline = BASELINE_BY_CONTENT_TYPE[contentType] || BASELINE_BY_CONTENT_TYPE['Brand Commercial Video'];

  const toolsSet = new Set<AITool>(baseline.tools);
  const skillsSet = new Set<string>(baseline.skills);

  const combinedText = `${data.objective || ''} ${data.creativeStyle || ''} ${data.title || ''}`.toLowerCase();

  // 1. Audio, Voice, & Lip-Sync Signals
  if (
    combinedText.includes('voice') ||
    combinedText.includes('speech') ||
    combinedText.includes('dialogue') ||
    combinedText.includes('narrat') ||
    combinedText.includes('speaking') ||
    combinedText.includes('podcast')
  ) {
    toolsSet.add('ElevenLabs');
    skillsSet.add('Audio-Driven Lip Sync');
  }

  // 2. Soundtrack & Music Signals
  if (
    combinedText.includes('music') ||
    combinedText.includes('soundtrack') ||
    combinedText.includes('audio') ||
    combinedText.includes('sound design') ||
    combinedText.includes('beat') ||
    combinedText.includes('score')
  ) {
    toolsSet.add('Suno');
    skillsSet.add('Sound Design');
  }

  // 3. Custom Model & Character Consistency Signals
  if (
    combinedText.includes('lora') ||
    combinedText.includes('character') ||
    combinedText.includes('persona') ||
    combinedText.includes('face') ||
    combinedText.includes('identity') ||
    combinedText.includes('consistency')
  ) {
    skillsSet.add('Character Consistency');
    skillsSet.add('LoRA Training');
    if (combinedText.includes('face') || combinedText.includes('actor') || combinedText.includes('model')) {
      skillsSet.add('Facial Consistency');
    }
  }

  // 4. Product, Packaging, & Hard-Surface Signals
  if (
    combinedText.includes('product') ||
    combinedText.includes('bottle') ||
    combinedText.includes('watch') ||
    combinedText.includes('car') ||
    combinedText.includes('automotive') ||
    combinedText.includes('caustic') ||
    combinedText.includes('macro') ||
    combinedText.includes('glass') ||
    combinedText.includes('packaging')
  ) {
    toolsSet.add('Flux.1 Dev');
    skillsSet.add('Product Photorealism');
    skillsSet.add('Lighting & Compositing');
    skillsSet.add('ControlNet Precision');
  }

  // 5. Cinematic & Camera Direction Signals
  if (
    combinedText.includes('cinematic') ||
    combinedText.includes('anamorphic') ||
    combinedText.includes('35mm') ||
    combinedText.includes('lighting') ||
    combinedText.includes('film') ||
    combinedText.includes('pan') ||
    combinedText.includes('drone')
  ) {
    toolsSet.add('Runway Gen-3');
    skillsSet.add('Camera Motion Control');
    skillsSet.add('Cinematic Storytelling');
    skillsSet.add('Color Grading');
  }

  // 6. Distribution Channel Signals
  const channels = data.channels || [];
  if (channels.includes('Broadcast TV') || channels.includes('Digital OOH / Billboard')) {
    skillsSet.add('4K Upscaling');
    skillsSet.add('Color Grading');
  }
  if (channels.includes('TikTok') || channels.includes('Instagram / Reels')) {
    toolsSet.add('Runway Gen-3');
    if (!skillsSet.has('Camera Motion Control')) {
      skillsSet.add('Camera Motion Control');
    }
  }

  // 7. Aspect Ratio Signals
  if (data.aspectRatio?.includes('9:16')) {
    toolsSet.add('Kling 1.5');
  }

  // Filter to valid canonical items and cap suggestions cleanly
  const suggestedTools = Array.from(toolsSet).filter((t) => ALL_AVAILABLE_TOOLS.includes(t)).slice(0, 5);
  const suggestedSkills = Array.from(skillsSet).filter((s) => ALL_AVAILABLE_SKILLS.includes(s)).slice(0, 6);

  return {
    suggestedTools,
    suggestedSkills,
    rationale: baseline.rationale,
  };
}
