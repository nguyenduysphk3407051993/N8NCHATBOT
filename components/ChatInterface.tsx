import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, AlertCircle, Loader2, Paperclip, X, File, Image as ImageIcon } from 'lucide-react';
import { ChatMessage, MessageRole, SUPPORTED_MIME_TYPES } from '../types';
import { SAMPLE_QUESTIONS } from '../constants';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, files: File[]) => void;
  isLoading: boolean;
  hasConfig: boolean;
  onOpenSettings: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  hasConfig,
  onOpenSettings 
}) => {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, attachedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;
    
    onSendMessage(input.trim(), attachedFiles);
    setInput('');
    setAttachedFiles([]);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  if (!hasConfig) {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Configuration Needed</h3>
            <p className="text-slate-500 max-w-md mb-6">
                Please configure your N8N Webhook URLs to start chatting. You need a "Chat Webhook" URL to send and receive messages.
            </p>
            <button 
                onClick={onOpenSettings}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
                Open Settings
            </button>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Ready to Assist</h3>
            <p className="text-sm text-slate-500 max-w-xs mt-2 mb-8">
              Ask me anything about the documents you uploaded, or attach new ones here.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md">
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(q, [])}
                  className="text-sm text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-200 px-4 py-3 rounded-xl transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
              ${msg.role === MessageRole.USER ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}
            `}>
              {msg.role === MessageRole.USER ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === MessageRole.USER ? 'items-end' : 'items-start'}`}>
                {/* Text Content */}
                {msg.content && (
                    <div className={`
                    rounded-2xl px-5 py-3 text-sm leading-relaxed
                    ${msg.role === MessageRole.USER 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : msg.isError 
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-tl-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'}
                    `}>
                        {msg.content}
                    </div>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                        {msg.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                                {getFileIcon(att.type)}
                                <span className="max-w-[150px] truncate font-medium">{att.name}</span>
                                <span className="text-slate-400">({(att.size / 1024).toFixed(0)}KB)</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        
        {/* Attachment Preview */}
        {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1 animate-in slide-in-from-bottom-2">
                {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white border border-indigo-100 shadow-sm pl-3 pr-2 py-1.5 rounded-lg group">
                        <div className="text-indigo-500">{getFileIcon(file.type)}</div>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]" title={file.name}>{file.name}</span>
                        <button onClick={() => removeFile(index)} className="p-0.5 hover:bg-red-50 rounded-md text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2 max-w-4xl mx-auto">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            multiple
            className="hidden"
            accept={Object.keys(SUPPORTED_MIME_TYPES).join(',')}
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`
                flex-shrink-0 p-3 mb-0.5 rounded-xl transition-all
                ${attachedFiles.length > 0 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}
            `}
            title="Attach files to your prompt"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={attachedFiles.length > 0 ? "Enter a prompt about the files..." : "Type your message..."}
                disabled={isLoading}
                className="w-full pl-5 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-700 placeholder-slate-400 disabled:opacity-60"
            />
            <button
                type="submit"
                disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
                className={`
                absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all
                ${(!input.trim() && attachedFiles.length === 0) || isLoading 
                    ? 'bg-slate-100 text-slate-400' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}
                `}
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};