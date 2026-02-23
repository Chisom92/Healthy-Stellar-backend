import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StellarController } from './controllers/stellar.controller';
import { StellarFeeService } from './services/stellar-fee.service';
import { StellarCacheService } from './services/stellar-cache.service';
import { StellarService } from './services/stellar.service';
import { IpfsService } from './services/ipfs.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [StellarController],
  providers: [StellarFeeService, StellarCacheService, StellarService, IpfsService],
  exports: [StellarFeeService, StellarService, IpfsService],
})
export class StellarModule {}
