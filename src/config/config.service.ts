import { Injectable, Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class ConfigService implements TypeOrmOptionsFactory {
  private readonly envConfig: { [key: string]: string };
  private readonly logger = new Logger('Config');

  constructor() {
    try {
      this.envConfig = dotenv.parse(fs.readFileSync('.env'));
    } catch (e) {
      this.envConfig = process.env;
    }
    process.env = Object.assign(process.env, this.envConfig);
  }

  async createTypeOrmOptions(): Promise<TypeOrmModuleOptions> {
    return {
      type: 'postgres',
      host: this.envConfig.POSTGRES_HOST,
      port: parseInt(this.envConfig.POSTGRES_PORT, 10),
      username: this.envConfig.POSTGRES_USER,
      password: this.envConfig.POSTGRES_PASS,
      database: this.envConfig.POSTGRES_DB,
      synchronize: false,
      keepConnectionAlive: true,
      logging: false,
      entities: [__dirname + '/../*/entities/*.entity{.ts,.js}'],
      // migrationsTableName: 'migration',
      // migrations: ['src/migration/*.ts'],
    };
  }
  /**
   * Get config value by its key with promise
   * @param key: string
   */
  public async get(key: string): Promise<string> {
    return this.envConfig[key] ? this.envConfig[key] : null;
  }

  /**
   * Get config value by its key without promise
   * @param key
   */
  public getValue(key: string): string {
    return this.envConfig[key] ? this.envConfig[key] : null;
  }
}
