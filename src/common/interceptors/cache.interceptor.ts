import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_TTL_METADATA_KEY } from '../decorators/cache.decorator';

interface CacheRecord {
  data: any;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, CacheRecord>();
  private readonly defaultTTL = 60_000; // 1 minute 默认缓存时间

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method: string = (request?.method ?? 'GET').toUpperCase();

    if (method !== 'GET') {
      this.evictByUrl(request?.url ?? '');
      return next.handle().pipe(
        tap(() => {
          this.evictByUrl(request?.url ?? '');
        }),
      );
    }

    const ttl = this.resolveTTL(context);
    if (!ttl || ttl <= 0) {
      return next.handle();
    }

    const cacheKey = this.createCacheKey(request);
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return of(cached.data);
    }

    return next.handle().pipe(
      tap((response) => {
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
          ttl,
        });
        this.cleanup();
      }),
    );
  }

  private resolveTTL(context: ExecutionContext): number {
    const handlerTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA_KEY,
      context.getHandler(),
    );
    const controllerTTL = this.reflector.get<number>(
      CACHE_TTL_METADATA_KEY,
      context.getClass(),
    );

    return handlerTTL ?? controllerTTL ?? this.defaultTTL;
  }

  private createCacheKey(request: any): string {
    const url = request?.url ?? '';
    const query = request?.query ?? {};
    return `GET:${url}:${JSON.stringify(query)}`;
  }

  private isExpired(record: CacheRecord): boolean {
    return Date.now() - record.timestamp >= record.ttl;
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictByUrl(url: string) {
    if (!url) {
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.startsWith(`GET:${url}`)) {
        this.cache.delete(key);
      }
    }
  }
}
