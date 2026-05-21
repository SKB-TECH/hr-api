import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  statusCode: number;
  timestamp: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map(data => {
        const isPaginated = data && data.data && data.meta;
        return {
          success: true,
          message: data?.message || 'Request successful',
          statusCode,
          timestamp: new Date().toISOString(),
          data: isPaginated ? data.data : (data?.message ? data.data : data),
          meta: isPaginated ? data.meta : undefined,
        };
      }),
    );
  }
}
