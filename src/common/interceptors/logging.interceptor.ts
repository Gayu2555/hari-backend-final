import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const now = Date.now();

    this.logger.log(`→ ${method} ${url}`);

    // Log body untuk non-multipart requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = headers['content-type'] || '';

      if (!contentType.includes('multipart/form-data')) {
        const sanitizedBody = { ...body };
        if (sanitizedBody.password) sanitizedBody.password = '***';
        this.logger.debug(`Body: ${JSON.stringify(sanitizedBody)}`);
      } else {
        this.logger.debug('Body: [multipart/form-data]');
        if (body && typeof body === 'object') {
          const fieldCount = Object.keys(body).length;
          this.logger.debug(`Fields count: ${fieldCount}`);
        }
      }
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - now;
          this.logger.log(`← ${method} ${url} - ${responseTime}ms ✅`);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(
            `← ${method} ${url} - ${responseTime}ms ❌ ${error.message}`,
          );
        },
      }),
    );
  }
}
