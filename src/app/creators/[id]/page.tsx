import { redirect } from 'next/navigation';
import { MOCK_CREATORS } from '@/data/mockCreators';

export function generateStaticParams() {
  return MOCK_CREATORS.map((creator) => ({
    id: creator.id,
  }));
}

interface CreatorRouteProps {
  params: Promise<{ id: string }>;
}

/**
 * Dynamic route handler for direct creator links (/creators/:id).
 * Seamlessly routes to the unified Explore Creators directory (/creators?creator=:id),
 * activating the creator portfolio view without 404s or blank screens.
 */
export default async function CreatorRoutePage({ params }: CreatorRouteProps) {
  const { id } = await params;
  redirect(`/creators?creator=${encodeURIComponent(id)}`);
}
