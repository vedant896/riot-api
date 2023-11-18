import type { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';
import { SummonerModule } from './summoner/summoner.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ConfigService,
    }),
    HttpModule,
    SummonerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
