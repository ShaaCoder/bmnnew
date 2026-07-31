'use client';

import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CloudUpload as UploadCloud, X, Loader as Loader2, CircleAlert as AlertCircle, ImagePlus, RefreshCw } from 'lucide-react';

type UploadItem = {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  error: string | null;
};

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
  label?: string;
  bucket?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

function sanitizeFilename(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
}

export default function ImageUploader({ value, onChange, folder = 'uploads', max, label = 'Images', bucket = 'images' }: Props) {
  const [uploading, setUploading] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canAddMore = max === undefined || (value.length + uploading.filter(u => u.uploading).length) < max;

  const uploadFile = useCallback(async (file: File) => {
    if (!ACCEPTED.includes(file.type)) return { url: null, error: `${file.name}: unsupported format. Use JPEG, PNG, WebP, or GIF.` };
    if (file.size > MAX_FILE_SIZE) return { url: null, error: `${file.name}: exceeds 5 MB limit.` };
    const path = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) return { url: null, error: error.message };
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: publicUrl, error: null };
  }, [folder, bucket]);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const toUpload = max !== undefined ? fileArray.slice(0, max - value.length) : fileArray;
    if (toUpload.length === 0) return;
    const items: UploadItem[] = toUpload.map(file => ({ id: `${Date.now()}-${Math.random()}`, file, preview: URL.createObjectURL(file), uploading: true, error: null }));
    setUploading(prev => [...prev, ...items]);
    for (const item of items) {
      const { url, error } = await uploadFile(item.file);
      if (url) { onChange([...value, url]); setUploading(prev => prev.filter(u => u.id !== item.id)); URL.revokeObjectURL(item.preview); }
      else { setUploading(prev => prev.map(u => u.id === item.id ? { ...u, uploading: false, error: error || 'Upload failed' } : u)); }
    }
  }, [value, onChange, uploadFile, max]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (!canAddMore) return;
    processFiles(e.dataTransfer.files);
  }, [canAddMore, processFiles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const removeExisting = (url: string) => onChange(value.filter(u => u !== url));
  const removeUploading = (id: string) => {
    setUploading(prev => { const item = prev.find(u => u.id === id); if (item) URL.revokeObjectURL(item.preview); return prev.filter(u => u.id !== id); });
  };

  const retryUpload = async (item: UploadItem) => {
    setUploading(prev => prev.map(u => u.id === item.id ? { ...u, uploading: true, error: null } : u));
    const { url, error } = await uploadFile(item.file);
    if (url) { onChange([...value, url]); setUploading(prev => prev.filter(u => u.id !== item.id)); URL.revokeObjectURL(item.preview); }
    else { setUploading(prev => prev.map(u => u.id === item.id ? { ...u, uploading: false, error: error || 'Upload failed' } : u)); }
  };

  const isSingleMode = max === 1;
  const hasImage = value.length > 0 || uploading.length > 0;

  if (isSingleMode) {
    return (
      <div>
        <p className="text-xs font-medium text-green-700 mb-1.5">{label}</p>
        {hasImage ? (
          <div className="relative rounded-xl overflow-hidden bg-green-100 aspect-video">
            {uploading[0] ? (
              <div className="w-full h-full relative">
                <img src={uploading[0].preview} alt="" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  {uploading[0].error ? (
                    <div className="text-center p-4">
                      <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1.5" />
                      <p className="text-white text-xs mb-2">{uploading[0].error}</p>
                      <div className="flex gap-2 justify-center">
                        <button type="button" onClick={() => retryUpload(uploading[0])} className="flex items-center gap-1 bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/30 transition"><RefreshCw className="w-3 h-3" /> Retry</button>
                        <button type="button" onClick={() => removeUploading(uploading[0].id)} className="flex items-center gap-1 bg-red-500/70 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 transition"><X className="w-3 h-3" /> Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                      <p className="text-white text-xs">Uploading...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <img src={value[0]} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExisting(value[0])} className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-md"><X className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        ) : (
          <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()} className={`border-2 border-dashed rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${dragging ? 'border-green-400 bg-green-50' : 'border-green-200 bg-green-50 hover:border-green-300'}`}>
            <UploadCloud className={`w-8 h-8 mb-2 transition-colors ${dragging ? 'text-green-500' : 'text-green-300'}`} />
            <p className="text-sm font-medium text-green-600">Click or drag to upload</p>
            <p className="text-xs text-green-400 mt-1">JPEG, PNG, WebP, GIF · max 5 MB</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" className="hidden" onChange={handleInputChange} />
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-green-700 mb-1.5">{label}</p>
      {(value.length > 0 || uploading.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((url, i) => (
            <div key={url} className="relative group w-20 h-20 rounded-xl overflow-hidden bg-green-100 shrink-0">
              <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeExisting(url)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-2.5 h-2.5" /></button>
              {i === 0 && <span className="absolute bottom-0 left-0 right-0 text-center bg-black/50 text-white text-[9px] py-0.5">Cover</span>}
            </div>
          ))}
          {uploading.map((item) => (
            <div key={item.id} className="relative w-20 h-20 rounded-xl overflow-hidden bg-green-100 shrink-0">
              <img src={item.preview} alt="uploading" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {item.error ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400 mb-1" />
                    <button type="button" onClick={() => retryUpload(item)} className="text-[9px] text-white bg-green-500 px-1.5 py-0.5 rounded">Retry</button>
                  </>
                ) : <Loader2 className="w-5 h-5 text-white animate-spin" />}
              </div>
              <button type="button" onClick={() => removeUploading(item.id)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm"><X className="w-2.5 h-2.5" /></button>
            </div>
          ))}
        </div>
      )}
      {canAddMore && (
        <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop} onClick={() => inputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-200 ${dragging ? 'border-green-400 bg-green-50' : 'border-green-200 bg-green-50 hover:border-green-300'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${dragging ? 'bg-green-100' : 'bg-green-200'}`}>
            <ImagePlus className={`w-4 h-4 ${dragging ? 'text-green-600' : 'text-green-500'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-green-700">{value.length === 0 ? 'Upload images' : 'Add more images'}</p>
            <p className="text-xs text-green-400">Click or drag · JPEG, PNG, WebP, GIF · max 5 MB each</p>
          </div>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handleInputChange} />
    </div>
  );
}
