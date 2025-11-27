// Serviço de integração com n8n
import axios from 'axios';
import { N8nConfig, N8nRequest, N8nResponse } from './types';

export class N8nService {
  private config: N8nConfig;

  constructor(config: N8nConfig) {
    this.config = config;
  }

  /**
   * Envia uma mensagem de texto para o webhook n8n
   */
  async sendMessage(message: string): Promise<N8nResponse> {
    try {
      const payload: N8nRequest = {
        message,
        session_id: this.config.sessionId,
      };

      // Comunicação direta com o webhook do n8n
      if (!this.config.webhookUrl) {
        throw new Error('Webhook URL is not configured. Please set it in the settings.');
      }
      try {
        const response = await axios.post(this.config.webhookUrl, payload, {
          headers: {
            'Content-Type': 'application/json',
            ...(this.config.authToken && {
              Authorization: `Bearer ${this.config.authToken}`,
            }),
          },
          responseType: 'json',
          validateStatus: () => true,
        });
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const details = {
            message: error.message,
            code: error.code,
            response: error.response ? JSON.stringify(error.response.data) : undefined,
          };
          try {
            console.error('Axios error details:', details);
          } catch (logErr) {
            console.error('Axios error (logging failed):', error.message);
          }
        } else {
          console.error('Unexpected error during webhook communication:', error);
        }
        return {
          type: 'text',
          error: 'Failed to communicate with the webhook. Please verify the URL and network connectivity.',
        };
      }
    } catch (error) {
      console.error('Error during webhook communication:', error);
      return {
        type: 'text',
        error: 'Failed to communicate with the webhook. Please verify the URL and network connectivity.',
      };
    }
  }

  /**
   * Envia um arquivo para o webhook n8n
   */
  async sendFile(
    file: File,
    additionalMessage?: string
  ): Promise<N8nResponse> {
    try {
      // Enviar arquivo como multipart/form-data (como um arquivo real)
      const form = new FormData();
      form.append('file', file, file.name);
      form.append('fileName', file.name);
      form.append('fileType', file.type || 'application/octet-stream');
      form.append('message', additionalMessage || '');
      form.append('session_id', this.config.sessionId || '');

      // Ensure the webhook URL is valid and log it for debugging
      if (!this.config.webhookUrl) {
        throw new Error('Webhook URL is not configured. Please set it in the settings.');
      }
      console.log('Using webhook URL:', this.config.webhookUrl);

      // Add detailed error handling for network issues
      try {
        console.log('Sending form-data payload to webhook. URL:', this.config.webhookUrl);

        const headers: Record<string, string> = {
          // Let the browser/axios set the Content-Type with boundary for FormData
          ...(this.config.authToken && { Authorization: `Bearer ${this.config.authToken}` }),
        };

        const response = await axios.post(this.config.webhookUrl, form, {
          headers,
          // Accept any response type
          responseType: 'json',
          validateStatus: () => true, // Accept all HTTP status codes
        });

        // Try to extract output from various possible formats
        let output;
        if (response.data) {
          if (typeof response.data === 'string') {
            // Try to parse as JSON if response is a string
            try {
              const parsed = JSON.parse(response.data);
              output = parsed.output || parsed.Resposta || parsed[0]?.output;
            } catch (e) {
              output = response.data;
            }
          } else if (Array.isArray(response.data)) {
            output = response.data[0]?.output || response.data[0]?.Resposta;
          } else {
            output = response.data.output || response.data.Resposta;
          }
        }

        if (output) {
          console.log('Extracted output from webhook:', output);
          return {
            type: 'text',
            output,
          };
        }

        // Log and return an error if the expected format is not found
        console.error('Unexpected webhook response format:', JSON.stringify(response.data, null, 2));
        return {
          type: 'text',
          error: 'Webhook response does not contain output.',
        };
      } catch (error) {
        console.error('Error during webhook communication:', error);
        return {
          type: 'text',
          error: 'Failed to communicate with the webhook. Please verify the URL and network connectivity.',
        };
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      return {
        type: 'text',
        error: 'Erro ao enviar arquivo. Verifique a configuração do n8n.',
      };
    }
  }

  /**
   * Converte arquivo para base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo "data:image/png;base64," ou similar
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Atualiza a configuração do serviço
   */
  updateConfig(config: N8nConfig) {
    this.config = config;
  }
}
