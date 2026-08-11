import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@/libs/env/config.service';

@Injectable()
export class AiClientService {
  constructor(private readonly config: ConfigService) {}

  async post<T>(path: string, body: unknown, requestId: string): Promise<T> {
    return this.send<T>(path, requestId, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async postFile<T>(
    path: string,
    file: { buffer: Buffer; mimeType: string; originalName: string },
    requestId: string,
  ): Promise<T> {
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimeType }),
      file.originalName.replace(/[\r\n"]/g, '_'),
    );
    return this.send<T>(path, requestId, { method: 'POST', body: form });
  }

  private async send<T>(
    path: string,
    requestId: string,
    init: RequestInit,
  ): Promise<T> {
    const baseUrl = this.config.get('HR_AI_BASE_URL');
    const token =
      this.config.get('HR_AI_SERVICE_TOKEN_CURRENT') ||
      this.config.get('HR_AI_SERVICE_TOKEN');
    if (!baseUrl || !token || token.length < 32)
      throw new ServiceUnavailableException(
        'AI service integration is not configured',
      );

    let response: Response;
    try {
      response = await fetch(
        `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`,
        {
          ...init,
          headers: {
            'x-service-token': token,
            'x-request-id': requestId,
            ...(init.headers ?? {}),
          },
          signal: AbortSignal.timeout(
            Number(this.config.get('HR_AI_REQUEST_TIMEOUT_MS') || 60000),
          ),
        },
      );
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error && error.name === 'TimeoutError'
          ? 'AI service request timed out'
          : 'AI service is unavailable',
      );
    }

    if (!response.ok) {
      if (response.status >= 500)
        throw new ServiceUnavailableException('AI service failed');
      throw new BadGatewayException('AI service rejected the request');
    }
    try {
      return (await response.json()) as T;
    } catch {
      throw new BadGatewayException('AI service returned an invalid response');
    }
  }
}
