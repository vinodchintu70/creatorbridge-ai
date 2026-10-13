import { NextRequest, NextResponse } from 'next/server';
import {
  BriefContentType,
  BriefDistributionChannel,
  BriefCommercialUsage,
} from '@/types/brief';
import { AITool } from '@/types/creator';

// Validated constants to check against hallucinations
const VALID_CONTENT_TYPES: BriefContentType[] = [
  'Brand Commercial Video',
  'Social Video Reel / UGC',
  '3D Product VFX',
  'Key Visual Still',
  'Virtual Persona Asset',
  'Generative Animation',
];

const VALID_CHANNELS: BriefDistributionChannel[] = [
  'Instagram / Reels',
  'TikTok',
  'YouTube',
  'Digital OOH / Billboard',
  'Broadcast TV',
  'Brand Website / App',
];

const VALID_ASPECT_RATIOS = [
  '16:9 Landscape (4K UHD 3840x2160)',
  '9:16 Vertical (Mobile 1080x1920)',
  '1:1 Square (1080x1080)',
  '2.39:1 Cinemascope Anamorphic',
  'Multi-Format Deliverable Pack',
];

const VALID_DURATIONS = [
  '15 seconds (High-Velocity Reel)',
  '30 seconds (Standard Commercial)',
  '60 seconds (Brand Anthem)',
  'Static High-Res Still (Single Frame)',
  'Multi-Asset Package (Varying Cuts)',
];

const VALID_TOOLS: AITool[] = [
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

const VALID_COMMERCIAL_LICENSES: BriefCommercialUsage[] = [
  'Full Global IP Buyout',
  '1-Year Digital Exclusive',
  'Standard Agency License',
  'Restricted Social Use',
];

const SYSTEM_PROMPT = `You are an expert AI commercial campaign director for CreatorBridge AI, an AI-native marketplace connecting brands with verified generative creators.
Analyze the user's campaign concept and extract a structured creative brief.

RULES:
1. STRICT TRUTH IN REPORTING:
   - Do NOT invent or hallucinate missing budgets, deadlines, brand names, or commercial licensing terms.
   - If the user did not specify a budget, return budgetMin: null and budgetMax: null.
   - If the user specifies a budget, extract the amounts in Indian Rupees (₹ INR) as whole integer numbers (e.g., 50000, 150000, 250000). If expressed in Indian denominations like Lakhs (e.g., '2.5 Lakhs' or '2.5L'), convert to Rupees (250000).
   - If the user did not specify a deadline, return deadline: null.
   - If the user did not specify a brand or agency name, return brandName: null.
   - If the user did not specify licensing terms, return commercialUsage: null.
   - In "unansweredFields", list all standard fields that were not provided in the user prompt (e.g. ["brandName", "budget", "deadline", "commercialUsage"]).

2. ALLOWED VALUES:
   - contentType MUST be one of: "Brand Commercial Video", "Social Video Reel / UGC", "3D Product VFX", "Key Visual Still", "Virtual Persona Asset", "Generative Animation"
   - channels MUST be from: ["Instagram / Reels", "TikTok", "YouTube", "Digital OOH / Billboard", "Broadcast TV", "Brand Website / App"]
   - aspectRatio MUST be from: ["16:9 Landscape (4K UHD 3840x2160)", "9:16 Vertical (Mobile 1080x1920)", "1:1 Square (1080x1080)", "2.39:1 Cinemascope Anamorphic", "Multi-Format Deliverable Pack"]
   - duration MUST be from: ["15 seconds (High-Velocity Reel)", "30 seconds (Standard Commercial)", "60 seconds (Brand Anthem)", "Static High-Res Still (Single Frame)", "Multi-Asset Package (Varying Cuts)"]
   - preferredTools from: ["Flux.1 Dev", "Runway Gen-3", "Midjourney v6", "ComfyUI", "Kling 1.5", "ElevenLabs", "Suno", "Luma Dream Machine"]
   - requiredSkills from: ["Character Consistency", "Camera Motion Control", "LoRA Training", "ControlNet Precision", "4K Upscaling", "Audio-Driven Lip Sync"]
   - commercialUsage (if mentioned) from: ["Full Global IP Buyout", "1-Year Digital Exclusive", "Standard Agency License", "Restricted Social Use"] or null.

Return ONLY a valid JSON object matching this schema:
{
  "title": string,
  "brandName": string | null,
  "objective": string,
  "targetAudience": string,
  "channels": string[],
  "contentType": string,
  "creativeStyle": string,
  "aspectRatio": string,
  "duration": string,
  "deliverablesCount": number,
  "preferredTools": string[],
  "requiredSkills": string[],
  "commercialUsage": string | null,
  "budgetMin": number | null,
  "budgetMax": number | null,
  "deadline": string | null,
  "creativeConstraints": string,
  "unansweredFields": string[]
}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: "prompt" string is required.' },
        { status: 400 }
      );
    }

    const prompt = body.prompt.trim();
    if (prompt.length < 5) {
      return NextResponse.json(
        { error: 'Prompt is too short. Please provide at least 5 characters describing your campaign concept.' },
        { status: 400 }
      );
    }

    if (prompt.length > 2500) {
      return NextResponse.json(
        { error: 'Prompt exceeds maximum length of 2500 characters.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Gemini API key is not configured on the server. Please add GEMINI_API_KEY to your .env.local file.',
          missingKey: true,
        },
        { status: 503 }
      );
    }

    // Configured Gemini model (gemini-3.7-flash)
    const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

    let rawText: string | null = null;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${SYSTEM_PROMPT}\n\nUser Campaign Concept:\n"""\n${prompt}\n"""`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      // Handle Quota / Rate Limiting (HTTP 429) immediately without retrying
      if (response.status === 429) {
        let quotaDetail = '';
        try {
          const errJson = await response.json();
          if (errJson.error?.message) {
            quotaDetail = ` (${errJson.error.message})`;
          }
        } catch {
          // keep standard message
        }
        return NextResponse.json(
          {
            error: `Gemini API daily request quota exceeded (HTTP 429). Please try again after the daily quota resets in Google AI Studio.${quotaDetail}`,
            isQuotaError: true,
            status: 429,
            model: GEMINI_MODEL,
          },
          { status: 429 }
        );
      }

      // Handle Service Unavailable / High Demand (HTTP 503) explicitly
      if (response.status === 503) {
        return NextResponse.json(
          {
            error:
              'Gemini is temporarily busy. Your prompt has been preserved. Please try again in a few minutes or continue with the manual brief form.',
            isServiceUnavailable: true,
            status: 503,
            model: GEMINI_MODEL,
          },
          { status: 503 }
        );
      }

      if (!response.ok) {
        let errDetail = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          errDetail = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errDetail = await response.text();
        }
        return NextResponse.json(
          {
            error: `Gemini service error (${response.status}): ${errDetail.substring(0, 250)}`,
            model: GEMINI_MODEL,
          },
          { status: response.status >= 400 && response.status < 600 ? response.status : 502 }
        );
      }

      const geminiData = await response.json();
      rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (networkErr: unknown) {
      const message = networkErr instanceof Error ? networkErr.message : 'Network failure';
      return NextResponse.json(
        {
          error: `Failed to connect to Gemini API: ${message}`,
          model: GEMINI_MODEL,
        },
        { status: 502 }
      );
    }

    if (!rawText) {
      return NextResponse.json(
        {
          error: 'Gemini returned an empty response. Please try again.',
          model: GEMINI_MODEL,
        },
        { status: 502 }
      );
    }

    // Parse and sanitize JSON safely
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: 'AI generated a malformed response that could not be parsed as JSON. Please try again.' },
        { status: 502 }
      );
    }

    // Build structured and validated suggestion object
    const unansweredFields: string[] = Array.isArray(parsed.unansweredFields)
      ? (parsed.unansweredFields as string[])
      : [];

    const sanitizeEnum = <T extends string>(val: unknown, allowed: T[], fallback: T): T => {
      return typeof val === 'string' && allowed.includes(val as T) ? (val as T) : fallback;
    };

    const sanitizeArray = <T extends string>(val: unknown, allowed: T[], fallback: T[]): T[] => {
      if (!Array.isArray(val)) return fallback;
      const filtered = val.filter((item): item is T => typeof item === 'string' && allowed.includes(item as T));
      return filtered.length > 0 ? filtered : fallback;
    };

    const contentType = sanitizeEnum(parsed.contentType, VALID_CONTENT_TYPES, 'Brand Commercial Video');
    const channels = sanitizeArray(parsed.channels, VALID_CHANNELS, ['Instagram / Reels', 'TikTok']);
    const aspectRatio = sanitizeEnum(parsed.aspectRatio, VALID_ASPECT_RATIOS, '16:9 Landscape (4K UHD 3840x2160)');
    const duration = sanitizeEnum(parsed.duration, VALID_DURATIONS, '30 seconds (Standard Commercial)');
    const preferredTools = sanitizeArray(parsed.preferredTools, VALID_TOOLS, ['Runway Gen-3', 'Flux.1 Dev']);

    // Ensure unknown fields are tracked accurately
    if (!parsed.brandName && !unansweredFields.includes('brandName')) unansweredFields.push('brandName');
    if ((parsed.budgetMin === null || parsed.budgetMin === undefined) && !unansweredFields.includes('budget')) {
      unansweredFields.push('budget');
    }
    if (!parsed.deadline && !unansweredFields.includes('deadline')) unansweredFields.push('deadline');
    if (!parsed.commercialUsage && !unansweredFields.includes('commercialUsage')) unansweredFields.push('commercialUsage');

    const suggestion = {
      title: typeof parsed.title === 'string' && parsed.title.trim().length > 0
        ? parsed.title.trim()
        : 'Creative AI Campaign Brief',
      brandName: typeof parsed.brandName === 'string' && parsed.brandName.trim().length > 0
        ? parsed.brandName.trim()
        : null,
      objective: typeof parsed.objective === 'string' && parsed.objective.trim().length > 0
        ? parsed.objective.trim()
        : 'Generate high-impact cinematic promotional assets to engage audience.',
      targetAudience: typeof parsed.targetAudience === 'string' && parsed.targetAudience.trim().length > 0
        ? parsed.targetAudience.trim()
        : 'Target demographic seeking premium visual storytelling.',
      channels,
      contentType,
      creativeStyle: typeof parsed.creativeStyle === 'string' && parsed.creativeStyle.trim().length > 0
        ? parsed.creativeStyle.trim()
        : 'Cinematic lighting, high-fidelity photorealism, and seamless motion aesthetics.',
      aspectRatio,
      duration,
      deliverablesCount: typeof parsed.deliverablesCount === 'number' && parsed.deliverablesCount > 0
        ? Math.min(Math.max(parsed.deliverablesCount, 1), 50)
        : 1,
      preferredTools,
      requiredSkills: Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0
        ? (parsed.requiredSkills as string[])
        : ['Character Consistency'],
      commercialUsage: typeof parsed.commercialUsage === 'string' && VALID_COMMERCIAL_LICENSES.includes(parsed.commercialUsage as BriefCommercialUsage)
        ? (parsed.commercialUsage as BriefCommercialUsage)
        : null,
      budgetMin: typeof parsed.budgetMin === 'number' && parsed.budgetMin > 0 ? parsed.budgetMin : null,
      budgetMax: typeof parsed.budgetMax === 'number' && parsed.budgetMax > 0 ? parsed.budgetMax : null,
      deadline: typeof parsed.deadline === 'string' && parsed.deadline.trim().length > 0 ? parsed.deadline.trim() : null,
      creativeConstraints: typeof parsed.creativeConstraints === 'string' ? parsed.creativeConstraints.trim() : '',
      unansweredFields,
    };

    return NextResponse.json({
      success: true,
      suggestion,
      unansweredFields,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
