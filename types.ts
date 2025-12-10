export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatAttachment {
  name: string;
  type: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isError?: boolean;
  attachments?: ChatAttachment[];
}

export interface WebhookConfig {
  ingestionUrl: string; // URL to upload files/train
  chatUrl: string;      // URL to send chat messages
}

export interface FileUploadItem {
  id: string;
  file: File;
  previewUrl?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
}

export const SUPPORTED_MIME_TYPES = {
  'application/pdf': 'PDF',
  'text/plain': 'TXT',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/msword': 'DOC',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'video/mp4': 'MP4',
  'video/webm': 'WEBM'
};