import Link from 'next/link';
import { FileX, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] bg-grid flex items-center justify-center px-6">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center mx-auto mb-5">
          <FileX className="w-8 h-8 text-zinc-500" />
        </div>
        <h1 className="text-xl font-semibold text-zinc-100 mb-2">File not found</h1>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs mx-auto">
          This share link doesn&apos;t exist or the file has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dropfile
        </Link>
      </div>
    </div>
  );
}
