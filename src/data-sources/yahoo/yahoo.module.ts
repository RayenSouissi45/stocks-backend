import { Module } from '@nestjs/common';
import { StocksController } from './yahoo.controller';
import { YahooService } from './yahoo.service';

@Module({
  controllers: [StocksController],
  providers: [YahooService],
  exports: [YahooService], // 👈 this makes it accessible to other modules
})
export class YahooModule {}
