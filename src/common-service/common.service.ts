import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { CacheKeyName } from 'src/common/constants';
import { Cache, CachingConfig } from 'cache-manager';

@Injectable()
export class CommonService {
  private readonly logger = new Logger(CommonService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async clearCacheConfig() {
    await Promise.all([
      this.cacheManager.del(CacheKeyName.GET_CONFIG.NAME),
      this.cacheManager.del(CacheKeyName.GET_FULL_CONFIG.NAME),
    ]);
  }

  async clearCache() {
    for (const [key] of Object.entries(CacheKeyName)) {
      try {
        const cacheName = CacheKeyName[key]['NAME'];
        await this.cacheManager.del(cacheName);
      } catch (error) {
        this.logError(error);
      }
    }
  }

  async setCache(key: string, data: any, options?: CachingConfig) {
    try {
      await this.cacheManager.set(key, data, options);
    } catch (error) {
      this.logError(error);
    }
  }

  getCache(key: string) {
    return this.cacheManager.get(key) as any;
  }

  logError(error: Error) {
    this.logger.error(error.message, error.stack);
  }

  logPromise(promises: any[], results: any[]) {
    for (let index = 0; index < promises.length; index++) {
      const promise = promises[index];
      if (promise && promise.op && promise.op === 'updateOne') {
        if (
          results[index].matchedCount === 0
          // results[index].modifiedCount === 0
        ) {
          this.logger.debug(
            `logPromise(): updateOne ${promise.model.modelName}`,
            promise._conditions,
          );
          this.logger.debug(promise._update);
          this.logger.debug(results[index]);
          throw Error('logPromise(): Update fail');
        }
      }
    }
  }
}
