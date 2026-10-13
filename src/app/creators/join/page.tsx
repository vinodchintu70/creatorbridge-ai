import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function JoinCreatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-850">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Join as an AI Creator</h1>
            <Badge variant="accent">Milestone 3 Preview</Badge>
          </div>
          <p className="text-sm text-zinc-400">
            Showcase your generative tools, LoRA models, ComfyUI node recipes, and verified commercial credentials.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            ← Back to Overview
          </Button>
        </Link>
      </div>

      <div className="py-16 text-center max-w-lg mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Creator Onboarding & Verification Portal</CardTitle>
            <CardDescription>
              This view will enable creators to build rich profiles with per-project workflow documentation and attach verifiable trust evidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-2">
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="default">Profile Metadata</Badge>
              <Badge variant="default">Upload AI Media</Badge>
              <Badge variant="default">Document Seeds & Nodes</Badge>
              <Badge variant="success">Verification Check</Badge>
            </div>
            <Link href="/" className="mt-4">
              <Button variant="secondary" size="sm" className="w-full">
                Return to Landing Shell
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
