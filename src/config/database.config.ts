import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AuditSubscriber } from '../common/subscribers/audit.subscriber';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    const sslEnabled = this.configService.get<string>('DB_SSL_ENABLED', 'true') === 'true';

    return {
      type: 'postgres', // changed from 'postgres'
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),

      // SSL/TLS Configuration for encrypted connections (HIPAA requirement)
      // ssl: sslEnabled
      //   ? {
      //       rejectUnauthorized: isProduction,
      //       ca: this.configService.get<string>('DB_SSL_CA'),
      //       cert: this.configService.get<string>('DB_SSL_CERT'),
      //       key: this.configService.get<string>('DB_SSL_KEY'),
      //     }
      //   : false,
      ssl: false,

      // Entity and Migration paths
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      subscribers: [AuditSubscriber],

      // Security: Never use synchronize in production
      synchronize: false,

      // Migrations should be run manually with proper audit trail
      migrationsRun: false,

      // Logging configuration for audit trail
      logging: isProduction ? ['error', 'warn', 'migration'] : true,
      logger: 'advanced-console',

      // Connection pool configuration for HIPAA compliance
      extra: {
        // Maximum connection pool size
        max: this.configService.get<number>('DB_POOL_MAX', 20),
        // Minimum connection pool size
        min: this.configService.get<number>('DB_POOL_MIN', 2),
        // Connection timeout (30 seconds)
        connectionTimeoutMillis: 30000,
        // Idle timeout (10 minutes) - automatically close idle connections
        idleTimeoutMillis: 600000,
        // Statement timeout (60 seconds) - prevent long-running queries
        statement_timeout: 60000,
        // Application name for audit logging
        application_name: 'healthy-stellar-backend',
        // Enable SSL mode
        ...(sslEnabled && { sslmode: 'require' }),
      },

      // Connection retry strategy
      retryAttempts: 3,
      retryDelay: 3000,

      // Transaction management
      maxQueryExecutionTime: 10000,

      // Enable automatic query result caching (optional, can improve performance)
      cache: {
        type: 'database',
        tableName: 'query_cache',
        duration: 60000, // 1 minute
      },
    };
  }
}

// DataSource configuration for TypeORM CLI (migrations)
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl:
    process.env.DB_SSL_ENABLED === 'true'
      ? {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          ca: process.env.DB_SSL_CA,
          cert: process.env.DB_SSL_CERT,
          key: process.env.DB_SSL_KEY,
        }
      : false,

  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  subscribers: [AuditSubscriber],

  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
};

// Export configured DataSource for CLI
export default new DataSource(dataSourceOptions);
