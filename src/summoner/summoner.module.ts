import { Module } from '@nestjs/common';
import { SummonerController } from './summoner.controller';
import { SummonerService } from './summoner.service';
import { HttpModule } from '@nestjs/axios';
import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';

import { CacheModule } from '@nestjs/cache-manager';

import { TypeOrmExModule } from 'src/customRepo/typeorm-ex.module';
import { SummonerRepository } from './summoner.repository';
import { BullModule } from '@nestjs/bull';
import { SummonerProcessor } from './summoner.processor';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([SummonerRepository]),
    BullModule.registerQueue({
      name: 'summoner',
    }),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,

      // Store-specific configuration:
      host: 'riot-api.6yyfff.clustercfg.use2.cache.amazonaws.com',
      port: 6379,
    }),

    HttpModule,
  ],
  controllers: [SummonerController],
  providers: [SummonerService, SummonerProcessor],
})
export class SummonerModule {}
