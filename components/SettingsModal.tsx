import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Key } from 'lucide-react';
import { WebhookConfig } from '../types';
import { DEFAULT_CONFIG, LOCAL_STORAGE_CONFIG_KEY } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: WebhookConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState<WebhookConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure we display the default config in the inputs if the stored values are empty
        setConfig({
          ingestionUrl: parsed.ingestionUrl || DEFAULT_CONFIG.ingestionUrl,
          chatUrl: parsed.chatUrl || DEFAULT_CONFIG.chatUrl
        });
      } catch (e) {
        setConfig(DEFAULT_CONFIG);
      }
    } else {
        setConfig(DEFAULT_CONFIG);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-bold text-slate-900">Configuration</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ingestion Webhook URL
            </label>
            <p className="text-xs text-slate-500 mb-2">
              The N8N workflow URL that handles file uploads and processing (e.g., Vector Store creation).
            </p>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={config.ingestionUrl}
                onChange={(e) => setConfig({ ...config, ingestionUrl: e.target.value })}
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Chat Webhook URL
            </label>
            <p className="text-xs text-slate-500 mb-2">
              The N8N workflow URL that receives questions and returns answers.
            </p>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={config.chatUrl}
                onChange={(e) => setConfig({ ...config, chatUrl: e.target.value })}
                placeholder="https://your-n8n-instance.com/webhook/..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};