import React, { useState, useEffect } from 'react';
import { MessageSquare, Upload, Settings, Zap, Database, ExternalLink } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { sendChatMessage, uploadFilesToWebhook } from './services/n8nService';
import { ChatMessage, FileUploadItem, MessageRole, WebhookConfig } from './types';
import { DEFAULT_CONFIG, LOCAL_STORAGE_CONFIG_KEY } from './constants';

enum Tab {
  UPLOAD = 'upload',
  CHAT = 'chat'
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.UPLOAD);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<WebhookConfig>(DEFAULT_CONFIG);
  
  // Upload State
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [textContext, setTextContext] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{success: boolean, message: string} | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Load Config
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Fallback to DEFAULT_CONFIG if stored values are empty strings
        setConfig({
          ingestionUrl: parsed.ingestionUrl || DEFAULT_CONFIG.ingestionUrl,
          chatUrl: parsed.chatUrl || DEFAULT_CONFIG.chatUrl
        });
      } catch (e) {
        console.error("Error parsing config", e);
        setConfig(DEFAULT_CONFIG);
      }
    }
  }, []);

  const getN8nErrorAdvice = (errorMsg: string) => {
    if (errorMsg.includes("Unused Respond to Webhook node")) {
        return "N8N CONFIG ERROR: Open your N8N Webhook Node and change 'Respond' to 'Using Respond to Webhook Node'.";
    }
    return null;
  };

  const handleUpload = async () => {
    if (files.length === 0 && !textContext.trim()) return;
    if (!config.ingestionUrl) {
      setIsSettingsOpen(true);
      return;
    }

    setIsProcessingUpload(true);
    setUploadStatus(null);
    
    // Update local file status
    setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' })));

    try {
      const rawFiles = files.map(f => f.file);
      // Sends files as FormData (Binary) + Text in one request
      await uploadFilesToWebhook(config.ingestionUrl, rawFiles, textContext);
      
      setFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
      setUploadStatus({ success: true, message: 'Success! Files and prompt sent to N8N.' });
      
      // Optional: Clear after delay
      setTimeout(() => {
        setFiles([]);
        setTextContext('');
        setUploadStatus(null);
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Upload failed", error);
      
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
      
      let displayMsg = `Failed to upload: ${errorMessage}`;
      const advice = getN8nErrorAdvice(errorMessage);
      if (advice) {
          displayMsg = `${errorMessage}\n\nFIX: ${advice}`;
      }

      setUploadStatus({ 
        success: false, 
        message: displayMsg
      });
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleSendMessage = async (text: string, attachments: File[] = []) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      timestamp: Date.now(),
      attachments: attachments.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
      }))
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsChatLoading(true);

    try {
      // Sends as FormData
      const responseText = await sendChatMessage(config.chatUrl, text, messages, attachments);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Chat failed", error);
      
      let displayMsg = `Error: ${errorMessage}`;
      const advice = getN8nErrorAdvice(errorMessage);
      if (advice) {
          displayMsg += `\n\n💡 ${advice}`;
      }

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: displayMsg,
        timestamp: Date.now(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">N8N Builder</span>
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab(Tab.UPLOAD)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === Tab.UPLOAD 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="font-medium">Knowledge Base</span>
          </button>

          <button
            onClick={() => setActiveTab(Tab.CHAT)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === Tab.CHAT 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Chatbot</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 flex-shrink-0">
           <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900">N8N Builder</span>
           </div>
           <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-600">
             <Settings className="w-6 h-6" />
           </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative w-full flex flex-col">
          
          {/* Tabs for Mobile */}
          <div className="md:hidden flex p-4 pb-0 flex-shrink-0">
            <div className="flex w-full p-1 bg-slate-200 rounded-xl">
                <button 
                onClick={() => setActiveTab(Tab.UPLOAD)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === Tab.UPLOAD ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                Upload
                </button>
                <button 
                onClick={() => setActiveTab(Tab.CHAT)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === Tab.CHAT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                >
                Chat
                </button>
            </div>
          </div>

          {activeTab === Tab.UPLOAD ? (
            <div className="flex flex-col h-full overflow-hidden">
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Train your Assistant</h1>
                            <p className="text-slate-500">
                            Upload documents and provide a prompt/context to send to N8N.
                            </p>
                        </div>

                        {/* Text Input Context */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <label className="block text-sm font-semibold text-slate-700">Additional Text Context / Prompt</label>
                            <textarea
                                value={textContext}
                                onChange={(e) => setTextContext(e.target.value)}
                                disabled={isProcessingUpload}
                                placeholder="Enter context, instructions, or a prompt describing the files..."
                                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-slate-700 text-sm disabled:bg-slate-50 disabled:text-slate-400"
                            />
                        </div>

                        {/* File Uploader */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <label className="block text-sm font-semibold text-slate-700">Attachments</label>
                            <FileUploader 
                                files={files} 
                                setFiles={setFiles} 
                                isProcessing={isProcessingUpload}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar - Now flex item, not absolute */}
                <div className="flex-shrink-0 p-4 md:p-8 border-t border-slate-200 bg-white/80 backdrop-blur-sm z-10">
                    <div className="max-w-3xl mx-auto flex flex-col gap-3">
                        {uploadStatus && (
                            <div className={`p-3 rounded-lg text-sm text-center font-medium whitespace-pre-wrap ${uploadStatus.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {uploadStatus.message}
                            </div>
                        )}
                        <button
                            onClick={handleUpload}
                            disabled={isProcessingUpload || (files.length === 0 && !textContext.trim())}
                            className={`
                            w-full py-4 rounded-xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2
                            ${isProcessingUpload || (files.length === 0 && !textContext.trim())
                                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5'}
                            `}
                        >
                            {isProcessingUpload ? (
                                <><Zap className="w-5 h-5 animate-pulse" /> Sending to N8N...</>
                            ) : (
                                <><Upload className="w-5 h-5" /> Send to N8N</>
                            )}
                        </button>
                        {!config.ingestionUrl && (
                            <p className="text-xs text-center text-slate-400">
                                Configure ingestion webhook in settings to enable upload.
                            </p>
                        )}
                    </div>
                </div>
            </div>
          ) : (
            <div className="flex-1 h-full overflow-hidden max-w-4xl mx-auto w-full p-4 md:p-8">
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isLoading={isChatLoading}
                hasConfig={!!config.chatUrl}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          )}
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={(newConfig) => setConfig(newConfig)}
      />
    </div>
  );
};

export default App;