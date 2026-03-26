'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { uploadImage, deleteImage } from '@/lib/supabase';

interface ImageUploaderProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  folder?: string;
  label?: string;
}

export default function ImageUploader({
  value,
  onChange,
  multiple = false,
  folder = 'general',
  label = 'Image',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const images = multiple
    ? (Array.isArray(value) ? value : []).filter(Boolean)
    : [typeof value === 'string' ? value : ''].filter(Boolean);

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Type non supporte: ${file.type}. Utilisez JPG, PNG, WebP ou GIF.`;
    }
    if (file.size > MAX_SIZE) {
      return `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 5 MB.`;
    }
    return null;
  };

  const handleUpload = useCallback(async (files: FileList | File[]) => {
    setError('');
    const fileArray = Array.from(files);

    // Validate all files
    for (const file of fileArray) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of fileArray) {
        const url = await uploadImage(file, folder);
        urls.push(url);
      }

      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        onChange([...current, ...urls]);
      } else {
        onChange(urls[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  }, [folder, multiple, value, onChange]);

  const handleRemove = useCallback(async (urlToRemove: string) => {
    // Only delete from Supabase if it's a Supabase URL
    if (urlToRemove.includes('supabase.co')) {
      try {
        await deleteImage(urlToRemove);
      } catch {
        // Continue even if delete fails
      }
    }

    if (multiple) {
      const current = Array.isArray(value) ? value : [];
      onChange(current.filter((u) => u !== urlToRemove));
    } else {
      onChange('');
    }
  }, [multiple, value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>

      {/* Image previews */}
      {images.length > 0 && (
        <div className={`mb-3 ${multiple ? 'grid grid-cols-3 gap-2' : ''}`}>
          {images.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <div className="relative aspect-square">
                <Image
                  src={url}
                  alt={`Image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="200px"
                  unoptimized={url.includes('supabase.co')}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      {(multiple || images.length === 0) && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-violet-500 bg-violet-50'
              : 'border-gray-300 hover:border-violet-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
              <p className="text-sm text-gray-500">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-sm text-gray-500">
                <span className="text-violet-600 font-medium">Cliquez</span> ou glissez-deposez
              </p>
              <p className="text-xs text-gray-400">JPG, PNG, WebP ou GIF (max 5 MB)</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={multiple}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUpload(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
