// src/watchlist/watchlist.module.ts
import { Module } from '@nestjs/common';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';
import { YahooModule } from 'src/data-sources/yahoo/yahoo.module';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [YahooModule],
  controllers: [WatchlistController],
  providers: [WatchlistService, PrismaService],
})
export class WatchlistModule {}
