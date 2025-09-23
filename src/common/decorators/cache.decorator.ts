import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_METADATA_KEY = 'cache-ttl';

export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA_KEY, ttl);
