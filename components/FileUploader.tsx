import React, { useCallback, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Film, Music, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { FileUploadItem, SUPPORTED_MIME_TYPES } from '../types';
import { MAX_FILE_SIZE_MB } from '../constants';

interface FileUploaderProps {
  files: FileUploadItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileUploadItem[]>>;
  isProcessing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ files, setFiles, isProcessing }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileType = (file: File): FileUploadItem['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFiles = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newFiles: FileUploadItem[] = Array.from(incomingFiles).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      type: getFileType(file),
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      status: 'pending'
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, [setFiles]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isProcessing) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => {
        const fileToRemove = prev.find(f => f.id === id);
        if (fileToRemove?.previewUrl) {
            URL.revokeObjectURL(fileToRemove.previewUrl);
        }
        return prev.filter((f) => f.id !== id);
    });
  };

  const getIcon = (type: FileUploadItem['type']) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Film className="w-5 h-5" />;
      case 'audio': return <Music className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer
          ${isProcessing ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 bg-white'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept={Object.keys(SUPPORTED_MIME_TYPES).join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isProcessing}
        />
        
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
        </div>
        
        <h3 className="text-lg font-semibold text-slate-800">
          Click or Drag files to upload
        </h3>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          Support PDF, DOCX, TXT, Images, Audio (MP3/WAV) & Video (MP4).
          <br />Max file size: {MAX_FILE_SIZE_MB}MB
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
          {files.map((item) => (
            <div key={item.id} className="group relative flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all">
              {/* Preview/Icon */}
              <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded-md overflow-hidden flex items-center justify-center text-slate-500">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  getIcon(item.type)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.file.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs text-slate-400 uppercase">{item.file.name.split('.').pop()}</span>
                   <span className="text-xs text-slate-300">•</span>
                   <span className="text-xs text-slate-400">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 pr-2">
                 {item.status === 'uploading' && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                 {item.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                 {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                 
                 {item.status === 'pending' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                 )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};