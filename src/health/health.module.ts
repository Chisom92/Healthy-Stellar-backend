import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PostgresHealthIndicator } from './indicators/postgres.indicator';
import { RedisHealthIndicator } from './indicators/redis.indicator';
import { IpfsHealthIndicator } from './indicators/ipfs.indicator';
import { StellarHealthIndicator } from './indicators/stellar.indicator';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [
    PostgresHealthIndicator,
    RedisHealthIndicator,
    IpfsHealthIndicator,
    StellarHealthIndicator,
  ],
})
export class HealthModule {}
