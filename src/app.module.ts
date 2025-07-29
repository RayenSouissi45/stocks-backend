import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YahooModule } from './data-sources/yahoo/yahoo.module';
import { FavoritesModule } from './favorites/favorites.module';
import { SecModule } from './data-sources/sec-form4/sec-form4.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [YahooModule, FavoritesModule, SecModule, WatchlistModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
