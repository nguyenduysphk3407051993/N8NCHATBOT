import { ChatMessage, MessageRole } from "../types";

/**
 * Sends a chat message to the N8N chat webhook.
 * Uses FormData to send files (as binary) and text simultaneously.
 */
export const sendChatMessage = async (
  url: string,
  message: string,
  history: ChatMessage[],
  files: File[] = []
): Promise<string> => {
  if (!url) throw new Error("Chat Webhook URL is not configured.");

  try {
    const sessionId = 'session-' + new Date().toDateString();
    const formData = new FormData();

    // 1. Append Text Data
    formData.append('message', message);
    // Also append as chatInput for compatibility with some N8N chat templates
    formData.append('chatInput', message);
    formData.append('sessionId', sessionId);
    formData.append('history', JSON.stringify(history.map(h => ({ role: h.role, content: h.content }))));

    // 2. Append Files & Metadata using Bracket Notation
    files.forEach((file, index) => {
      // Append the binary file
      formData.append(`file_${index}`, file);

      // We use JSON.stringify for metadata to ensure N8N receives it correctly as a JSON object/string
      // regardless of the body parser configuration.
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        key: `file_${index}`
      };
      
      // Send as a stringified JSON array element or object
      // Using a simple key like 'file_metadata' with JSON content is often more robust in N8N
      // than complex bracket notation if the N8N version doesn't support extended parsing.
      // However, to maintain the previous structure request:
      formData.append(`file_metadata`, JSON.stringify(metadata));
    });

    formData.append('file_count', files.length.toString());

    // 3. Send as multipart/form-data
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorDesc = response.statusText;
      try {
        const errorText = await response.text();
        const errorJson = JSON.parse(errorText);
        // N8N specific error fields
        errorDesc = errorJson.errorMessage || errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
        // Fallback if response is not JSON
      }
      throw new Error(errorDesc);
    }

    // 4. Handle Response (JSON or Text)
    const responseText = await response.text();
    try {
      const data = JSON.parse(responseText);
      // Adapt based on common N8N return structures
      return data.output || data.text || data.message || (typeof data === 'string' ? data : JSON.stringify(data));
    } catch (e) {
      // If response is not JSON, return the raw text
      return responseText;
    }

  } catch (error) {
    console.error("Failed to send message to N8N:", error);
    throw error;
  }
};

/**
 * Uploads files to the N8N ingestion webhook.
 * Uses FormData to send files (as binary) and text simultaneously.
 */
export const uploadFilesToWebhook = async (
  url: string,
  files: File[],
  textContext?: string
): Promise<void> => {
  if (!url) throw new Error("Ingestion Webhook URL is not configured.");

  const sessionId = 'ingestion-' + new Date().toDateString();

  try {
    const formData = new FormData();

    // 1. Append Text Context
    formData.append('message', textContext || "");
    formData.append('chatInput', textContext || "");
    formData.append('sessionId', sessionId);

    // 2. Append Files & Metadata
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
      
      const metadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        key: `file_${index}`
      };
      // Sending metadata as JSON string is safest for N8N Webhook node parsing
      formData.append(`file_metadata`, JSON.stringify(metadata));
    });
    
    formData.append('file_count', files.length.toString());

    // 3. Send
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
        let errorDesc = response.statusText;
        try {
          const errorText = await response.text();
          const errorJson = JSON.parse(errorText);
          errorDesc = errorJson.errorMessage || errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          // Fallback
        }
        throw new Error(errorDesc);
    }
    
    // We assume a 200 OK means success
  } catch (error) {
    console.error("Failed to upload files to N8N:", error);
    throw error;
  }
};