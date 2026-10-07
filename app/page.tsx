'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Copy, Check, Download, QrCode, X, FileIcon, ArrowRight, Zap, Shield, Link2 } from 'lucide-react';
import { supabase, type UploadRecord } from '@/lib/supabase';
import { generateSlug, formatFileSize } from '@/lib/upload-helpers';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function HomePage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [uploadedRecord, setUploadedRecord] = useState<UploadRecord | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const uploadFile = useCallback(async (file: File) => {
    setCurrentFile(file);
    setUploadState('uploading');
    setProgress(0);
    setError('');

    let slug = generateSlug();
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${slug}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('raw-files')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      setProgress(100);

      let insertSuccess = false;
      let attempts = 0;
      while (!insertSuccess && attempts < 3) {
        if (attempts > 0) {
          slug = generateSlug();
        }
        const { data, error: insertError } = await supabase
          .from('uploads')
          .insert({
            slug,
            file_path: fileName,
            original_filename: file.name,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === '23505' && attempts < 2) {
            attempts++;
            continue;
          }
          throw new Error(insertError.message);
        }

        if (data) {
          setUploadedRecord(data as UploadRecord);
          insertSuccess = true;
        }
      }

      if (!insertSuccess) {
        throw new Error('Failed to create upload record');
      }

      setUploadState('success');
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadState('error');
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, [uploadFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, [uploadFile]);

  const shareUrl = uploadedRecord
    ? `${window.location.origin}/f/${uploadedRecord.slug}`
    : '';

  useEffect(() => {
    if (showModal && shareUrl) {
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=09090b&color=ffffff&data=${encodeURIComponent(shareUrl)}`);
    }
  }, [showModal, shareUrl]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleReset = useCallback(() => {
    setUploadState('idle');
    setProgress(0);
    setCurrentFile(null);
    setError('');
    setUploadedRecord(null);
    setShowModal(false);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] bg-grid">
      {/* Top nav */}
      <header className="border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-zinc-100 flex items-center justify-center">
              <Upload className="w-4 h-4 text-zinc-900" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-100">Dropfile</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Shield className="w-3.5 h-3.5" />
            <span>No compression · Original files</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 mb-6">
            <Zap className="w-3 h-3 text-zinc-300" />
            <span>Upload anything, share with a link</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-100 mb-3">
            Share files, <span className="text-zinc-500">instantly</span>
          </h1>
          <p className="text-zinc-400 text-base max-w-md mx-auto">
            Drag in any file — PDF, video, archive, image — and get a link to share.
            Files are served as original, untouched data.
          </p>
        </div>

        {/* Upload zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-zinc-400 bg-zinc-800/30 scale-[1.01]'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />

          {uploadState === 'idle' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-16 px-6 flex flex-col items-center justify-center gap-4 cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center justify-center transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
                <Upload className={`w-6 h-6 text-zinc-300 transition-transform ${isDragging ? 'scale-110' : ''}`} />
              </div>
              <div className="text-center">
                <p className="text-zinc-200 font-medium text-sm">
                  {isDragging ? 'Drop to upload' : 'Drop a file or click to browse'}
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  Any format · Up to 2 GB
                </p>
              </div>
            </button>
          )}

          {uploadState === 'uploading' && (
            <div className="py-12 px-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <FileIcon className="w-5 h-5 text-zinc-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100 truncate">
                    {currentFile?.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatFileSize(currentFile?.size || 0)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={progress} className="h-1.5 bg-zinc-800" />
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="py-10 px-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-zinc-100 font-medium text-sm mb-1">Upload complete</p>
              <p className="text-zinc-500 text-xs mb-5 truncate max-w-xs mx-auto">
                {currentFile?.name}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  onClick={() => setShowModal(true)}
                >
                  <Link2 className="w-3.5 h-3.5 mr-1.5" />
                  View share link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-800 hover:bg-zinc-800"
                  onClick={handleReset}
                >
                  Upload another
                </Button>
              </div>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="py-10 px-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-zinc-100 font-medium text-sm mb-1">Upload failed</p>
              <p className="text-zinc-500 text-xs mb-5 max-w-xs mx-auto">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="border-zinc-800 hover:bg-zinc-800"
                onClick={handleReset}
              >
                Try again
              </Button>
            </div>
          )}
        </div>

        {/* Feature strip */}
        <div className="grid grid-cols-3 gap-3 mt-10">
          {[
            { icon: Zap, title: 'Fast', desc: 'Direct upload' },
            { icon: Shield, title: 'Original', desc: 'No compression' },
            { icon: Link2, title: 'Shareable', desc: 'QR + link' },
          ].map((feat) => (
            <div
              key={feat.title}
              className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 p-3 text-center"
            >
              <feat.icon className="w-4 h-4 text-zinc-400 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-zinc-200">{feat.title}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Share link modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="box-border w-[calc(100vw_-_2rem)] max-w-md max-h-[calc(100dvh_-_2rem)] overflow-y-auto bg-zinc-900 border-zinc-800 p-5 sm:p-6">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-zinc-100">Share link ready</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Anyone with this link can download the original file.
            </DialogDescription>
          </DialogHeader>

          {uploadedRecord && (
            <div className="space-y-5">
              {/* QR Code */}
              <div className="flex w-full justify-center">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                  {qrUrl && (
                    <img
                      src={qrUrl}
                      alt="QR code for share link"
                      className="h-40 w-40 max-w-full object-contain"
                      width={160}
                      height={160}
                    />
                  )}
                </div>
              </div>

              {/* Share URL */}
              <div className="min-w-0 space-y-2">
                <div className="flex min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                  <Link2 className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-300 font-mono">
                    {shareUrl}
                  </span>
                </div>

                <Button
                  onClick={handleCopy}
                  className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                  size="default"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy link
                    </>
                  )}
                </Button>
              </div>

              {/* Download link */}
              <a
                href={shareUrl}
                className="flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors pt-1"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Open share page
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
