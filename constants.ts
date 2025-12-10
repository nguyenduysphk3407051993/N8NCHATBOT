import { WebhookConfig } from "./types";

export const DEFAULT_CONFIG: WebhookConfig = {
  ingestionUrl: 'https://n8n.edutechnd.org/webhook/n8nchatbot',
  chatUrl: 'https://n8n.edutechnd.org/webhook/n8nchatbot'
};

// Bump version to v2 to force reload of defaults for users with old config cached
export const LOCAL_STORAGE_CONFIG_KEY = 'n8n_chatbot_config_v2';

export const MAX_FILE_SIZE_MB = 50; // 50MB limit

export const SAMPLE_QUESTIONS = [
  "Summarize the documents I just uploaded.",
  "What are the key points in the PDF?",
  "Analyze the tone of the audio file.",
  "Extract data from the image."
];