'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BriefFormData,
  BriefValidationErrors,
} from '@/types/brief';
import { creatorService } from '@/services/creatorService';
import { validateBrief } from '@/utils/validateBrief';
import { briefStorage } from '@/services/briefStorage';
import { briefService } from '@/services/briefService';
import { BriefForm } from '@/components/briefs/BriefForm';
import { BriefPreviewCard } from '@/components/briefs/BriefPreviewCard';
import { BriefPublishSuccessModal } from '@/components/briefs/BriefPublishSuccessModal';
import { Button } from '@/components/ui/Button';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AIBriefCopilot, GeneratedBriefSuggestion } from '@/components/briefs/AIBriefCopilot';
import { formatBudgetRange } from '@/utils/formatCurrency';

const INITIAL_BRIEF_DATA: BriefFormData = {
  title: '',
  brandName: '',
  objective: '',
  targetAudience: '',
  channels: [],
  contentType: 'Brand Commercial Video',
  creativeStyle: '',
  aspectRatio: '16:9 Landscape (4K UHD 3840x2160)',
  duration: '30 seconds (Standard Commercial)',
  deliverablesCount: 1,
  preferredTools: [],
  requiredSkills: [],
  commercialUsage: '',
  usageTerritory: '',
  usageDuration: '',
  modelSafetyPolicy: 'Commercial-Safe Checkpoints Only (Zero Unlicensed LoRAs)',
  budgetMin: '',
  budgetMax: '',
  currency: 'INR',
  deadline: '',
  creativeConstraints: '',
  referenceLinks: '',
  status: 'draft',
};

function BriefBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedCreatorId = searchParams.get('invitedCreatorId') || undefined;

  const [activeTab, setActiveTab] = useState<'edit' | 'review'>('edit');
  const [formData, setFormData] = useState<BriefFormData>(INITIAL_BRIEF_DATA);
  const [errors, setErrors] = useState<BriefValidationErrors>({});
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [publishedBrief, setPublishedBrief] = useState<BriefFormData | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [unansweredAIFields, setUnansweredAIFields] = useState<string[]>([]);
  const [isConfirmedDefaults, setIsConfirmedDefaults] = useState(false);

  // Invited Creator matching
  const invitedCreator = useMemo(() => {
    if (!invitedCreatorId) return null;
    return creatorService.getCreatorById(invitedCreatorId);
  }, [invitedCreatorId]);

  // Load existing draft on mount
  useEffect(() => {
    queueMicrotask(() => {
      const savedDraft = briefStorage.loadDraft();
      if (savedDraft) {
        setFormData((prev) => ({
          ...prev,
          ...savedDraft,
          invitedCreatorId: invitedCreatorId || savedDraft.invitedCreatorId,
        }));
      } else if (invitedCreatorId) {
        setFormData((prev) => ({
          ...prev,
          invitedCreatorId,
        }));
      }
    });
  }, [invitedCreatorId]);

  // Handle Save Draft
  const handleSaveDraft = () => {
    briefStorage.saveDraft(formData);
    setSaveStatusMessage('Draft saved to local browser storage.');
    setTimeout(() => setSaveStatusMessage(null), 3000);
  };

  // Handle Form Change & auto-clear resolved errors
  const handleFormChange = (updated: BriefFormData) => {
    setFormData(updated);
    if (Object.keys(errors).length > 0) {
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        let hasChanges = false;
        (Object.keys(prevErrors) as (keyof BriefFormData)[]).forEach((field) => {
          const val = updated[field];
          if (val !== undefined && val !== null && val !== '') {
            if (Array.isArray(val)) {
              if (val.length > 0) {
                delete nextErrors[field];
                hasChanges = true;
              }
            } else if (typeof val === 'string') {
              if (val.trim().length > 0) {
                delete nextErrors[field];
                hasChanges = true;
              }
            } else if (typeof val === 'number') {
              delete nextErrors[field];
              hasChanges = true;
            }
          }
        });
        return hasChanges ? nextErrors : prevErrors;
      });
    }
  };

  // Proceed to review
  const handleProceedToReview = () => {
    const { isValid, errors: validationErrors } = validateBrief(formData);
    setErrors(validationErrors);

    if (isValid) {
      setActiveTab('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const errorCount = Object.keys(validationErrors).length;
      setSaveStatusMessage(`Please complete the ${errorCount} required field(s) below before reviewing.`);
      setTimeout(() => setSaveStatusMessage(null), 4000);
    }
  };

  // Handle Publish Brief
  const handlePublishBrief = async () => {
    if (isPublishing) return;

    const { isValid, errors: validationErrors } = validateBrief(formData);
    setErrors(validationErrors);

    if (!isValid) {
      setActiveTab('edit');
      const errorCount = Object.keys(validationErrors).length;
      setSaveStatusMessage(`Cannot publish: Please fix ${errorCount} required field(s) in the form.`);
      setTimeout(() => setSaveStatusMessage(null), 4000);
      return;
    }

    if (!isConfirmedDefaults) {
      setSaveStatusMessage('Please review and check the confirmation box below to verify specifications before publishing.');
      setTimeout(() => setSaveStatusMessage(null), 5000);
      return;
    }

    setIsPublishing(true);
    try {
      const published = await briefService.publishBrief(formData);
      setPublishedBrief(published);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.warn('Error during publishBrief:', err);
      setSaveStatusMessage('Failed to publish brief. Please try again.');
      setTimeout(() => setSaveStatusMessage(null), 4000);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleResetForm = () => {
    briefStorage.clearDraft();
    setFormData(INITIAL_BRIEF_DATA);
    setErrors({});
    setUnansweredAIFields([]);
    setIsConfirmedDefaults(false);
    setActiveTab('edit');
  };

  // Handle AI brief suggestions
  const handleApplySuggestions = (suggestion: GeneratedBriefSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      title: suggestion.title || prev.title,
      brandName: suggestion.brandName || prev.brandName,
      objective: suggestion.objective || prev.objective,
      targetAudience: suggestion.targetAudience || prev.targetAudience,
      channels: suggestion.channels && suggestion.channels.length > 0 ? suggestion.channels : prev.channels,
      contentType: suggestion.contentType || prev.contentType,
      creativeStyle: suggestion.creativeStyle || prev.creativeStyle,
      aspectRatio: suggestion.aspectRatio || prev.aspectRatio,
      duration: suggestion.duration || prev.duration,
      deliverablesCount: suggestion.deliverablesCount || prev.deliverablesCount,
      preferredTools:
        suggestion.preferredTools && suggestion.preferredTools.length > 0
          ? suggestion.preferredTools
          : prev.preferredTools,
      requiredSkills:
        suggestion.requiredSkills && suggestion.requiredSkills.length > 0
          ? suggestion.requiredSkills
          : prev.requiredSkills,
      commercialUsage: suggestion.commercialUsage || prev.commercialUsage,
      budgetMin:
        suggestion.budgetMin !== null && suggestion.budgetMin !== undefined
          ? suggestion.budgetMin
          : prev.budgetMin,
      budgetMax:
        suggestion.budgetMax !== null && suggestion.budgetMax !== undefined
          ? suggestion.budgetMax
          : prev.budgetMax,
      deadline: suggestion.deadline || prev.deadline,
      creativeConstraints: suggestion.creativeConstraints || prev.creativeConstraints,
      usageTerritory: prev.usageTerritory,
      usageDuration: prev.usageDuration,
      currency: prev.currency || 'INR',
    }));

    setUnansweredAIFields(suggestion.unansweredFields || []);

    const missingCount = suggestion.unansweredFields?.length || 0;
    if (missingCount > 0) {
      setSaveStatusMessage(
        `✓ AI brief suggestions applied. Note: ${missingCount} required field(s) were unspecified by AI and need your input.`
      );
    } else {
      setSaveStatusMessage('✓ AI brief suggestions applied to form.');
    }
    setTimeout(() => setSaveStatusMessage(null), 5000);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-850">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
              <Link href="/" className="hover:text-zinc-200 transition-colors">
                CreatorBridge.ai
              </Link>
              <span>/</span>
              <Link href="/briefs" className="text-zinc-400 hover:text-purple-400 transition-colors">
                Campaigns
              </Link>
              <span>/</span>
              <span className="text-purple-400">New Brief</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-medium self-start backdrop-blur">
              <span className="inline-block w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Commercial Campaign Brief</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Create a Campaign Brief
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Define your project deliverables, budget, and commercial licensing terms.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            <Link href="/briefs">
              <Button variant="outline" size="sm">
                View All Campaigns →
              </Button>
            </Link>
            <Link href="/creators">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Explore Creators
              </Button>
            </Link>
          </div>
        </div>

        {/* 2-Step Workflow Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'edit'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-400 font-mono text-xs flex items-center justify-center font-bold">
                1
              </span>
              <span>Edit Brief</span>
            </button>

            <button
              type="button"
              onClick={handleProceedToReview}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === 'review'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span className="h-5 w-5 rounded-full bg-purple-600/30 text-purple-400 font-mono text-xs flex items-center justify-center font-bold">
                2
              </span>
              <span>Review Details</span>
            </button>
          </div>

          {saveStatusMessage && (
            <div className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-700 text-purple-300">
              {saveStatusMessage}
            </div>
          )}
        </div>

        {/* Step 1: Form Editing */}
        {activeTab === 'edit' && (
          <div className="flex flex-col gap-8">
            <AIBriefCopilot onApplySuggestions={handleApplySuggestions} />

            <div id="brief-form-section" className="scroll-mt-6">
              <BriefForm
                data={formData}
                errors={errors}
                onChange={handleFormChange}
                onSaveDraft={handleSaveDraft}
                onProceedToReview={handleProceedToReview}
                creatorName={invitedCreator?.name}
                unansweredAIFields={unansweredAIFields}
              />
            </div>
          </div>
        )}

        {/* Step 2: Live Preview & Publication Confirmation */}
        {activeTab === 'review' && (
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="text-xs text-zinc-300">
                Review your campaign specifications and licensing terms before final publication.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('edit')}
              >
                ← Back to Edit
              </Button>
            </div>

            <BriefPreviewCard
              data={formData}
              creatorName={invitedCreator?.name}
            />

            {/* Product Defaults & Specifications Confirmation */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-sm font-semibold text-white">
                  Publication Review & Product Defaults Confirmation
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Please confirm that you have reviewed the campaign specifications, commercial-use terms, and product-required defaults before final publication.
              </p>
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="confirmDefaults"
                  checked={isConfirmedDefaults}
                  onChange={(e) => setIsConfirmedDefaults(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="confirmDefaults" className="text-xs text-zinc-300 cursor-pointer leading-relaxed">
                  <strong className="text-white">I confirm the campaign specifications, usage rights, and project defaults:</strong>
                  <span className="block text-zinc-400 mt-1 font-mono text-[11px] space-y-0.5">
                    <span>• Brand Name: <strong className="text-zinc-200">{formData.brandName || 'Not specified'}</strong></span>
                    <br />
                    <span>• Aspect Ratio: <strong className="text-zinc-200">{formData.aspectRatio}</strong> (Product Default)</span>
                    <br />
                    <span>• Safety Policy: <strong className="text-zinc-200">{formData.modelSafetyPolicy}</strong> (Product Default)</span>
                    <br />
                    <span>• Usage Rights: <strong className="text-zinc-200">{formData.commercialUsage || 'Not selected'}</strong> (Territory: {formData.usageTerritory || 'Not entered'}, Duration: {formData.usageDuration || 'Not entered'})</span>
                    <br />
                    <span>• Budget: <strong className="text-zinc-200">{formatBudgetRange(formData.budgetMin, formData.budgetMax, formData.currency || 'INR')}</strong></span>
                  </span>
                </label>
              </div>
            </div>

            {/* Bottom Final Publish Action */}
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-white">
                  Ready to publish this creative brief?
                </span>
                <span className="text-xs text-zinc-400">
                  {isSupabaseConfigured()
                    ? 'This brief will be recorded to your live Supabase database and cached locally.'
                    : 'This brief will be recorded to your local browser storage for creator matching.'}
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setActiveTab('edit')}
                  disabled={isPublishing}
                  className="flex-1 sm:flex-none"
                >
                  Edit Further
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handlePublishBrief}
                  disabled={!isConfirmedDefaults || isPublishing}
                  className={`flex-1 sm:flex-none ${!isConfirmedDefaults || isPublishing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isPublishing ? 'Publishing...' : 'Publish Brief ✓'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      <BriefPublishSuccessModal
        brief={publishedBrief}
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push('/briefs');
        }}
        onResetForm={handleResetForm}
        invitedCreatorName={invitedCreator?.name}
      />
    </div>
  );
}

export default function CreateBriefPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-zinc-400">
          Loading Campaign Brief Builder...
        </div>
      }
    >
      <BriefBuilderContent />
    </Suspense>
  );
}
