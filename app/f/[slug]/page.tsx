'use client';

import { useEffect, useState } from 'react';
import { Download, FileIcon, ArrowLeft, Loader2, Check, AlertCircle, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/upload-helpers';
import { supabase, type UploadRecord } from '@/lib/supabase';

export default function FilePage({ params }: { params: { slug: string } }) {
  const [file, setFile] = useState<UploadRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .eq('slug', params.slug)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setFile(data as UploadRecord);
      setLoading(false);
    })();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (notFoundFlag || !file) {
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
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-300 hover:text-zinc-100 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Dropfile
          </a>
        </div>
      </div>
    );
  }

  return <FileContent file={file} />;
}

function FileContent({ file }: { file: UploadRecord }) {
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleDownload = () => {
    setDownloadState('loading');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const downloadUrl = `${supabaseUrl}/functions/v1/download?slug=${encodeURIComponent(file.slug)}`;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.original_filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadState('success');
      setTimeout(() => setDownloadState('idle'), 3000);
    }, 800);
  };

  const fileExt = file.original_filename.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="min-h-screen bg-[#09090b] bg-grid">
      {/* Header */}
      <header className="border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-zinc-900" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-100 group-hover:text-zinc-300 transition-colors">Dropfile</span>
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-lg px-6 py-16 sm:py-24">
        <div className="animate-slide-up">
          {/* File card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            {/* File icon section */}
            <div className="flex flex-col items-center justify-center py-12 border-b border-zinc-800/60">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center mb-4 shadow-lg">
                <FileIcon className="w-9 h-9 text-zinc-300" />
              </div>
              <div className="px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950 text-xs font-medium text-zinc-400 mb-3">
                {fileExt}
              </div>
              <h1 className="text-lg font-semibold text-zinc-100 text-center px-6 break-all leading-snug max-w-full">
                {file.original_filename}
              </h1>
            </div>

            {/* File details */}
            <div className="px-6 py-5">
              <dl className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <dt className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Size</dt>
                  <dd className="text-sm font-medium text-zinc-200">{formatFileSize(file.file_size)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Type</dt>
                  <dd className="text-sm font-medium text-zinc-200 truncate">{file.mime_type}</dd>
                </div>
              </dl>

              {/* Download button */}
              <Button
                onClick={handleDownload}
                disabled={downloadState === 'loading'}
                className="w-full h-11 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 text-sm font-medium"
              >
                {downloadState === 'loading' && (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Preparing download...
                  </>
                )}
                {downloadState === 'idle' && (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download original file
                  </>
                )}
                {downloadState === 'success' && (
                  <>
                    <Check className="w-4 h-4 mr-2 text-emerald-500" />
                    Download started
                  </>
                )}
                {downloadState === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                    Download failed — try again
                  </>
                )}
              </Button>

              <p className="text-xs text-zinc-500 text-center mt-3">
                File is served as the original, uncompressed binary data.
              </p>
            </div>
          </div>

          {/* Share link */}
          <div className="mt-6 flex items-center justify-center">
            <a
              href="/"
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Upload your own file
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
