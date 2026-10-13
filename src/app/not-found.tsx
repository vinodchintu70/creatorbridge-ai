import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl backdrop-blur text-center flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl">
          🔍
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold text-white tracking-tight">Page Not Found</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The page or creator portfolio you are looking for does not exist or may have been moved.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full justify-center pt-2">
          <Link href="/creators">
            <Button variant="primary" size="sm">
              Explore Creators
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
