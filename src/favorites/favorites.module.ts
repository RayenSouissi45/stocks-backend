import { Module } from '@nestjs/common';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { PrismaService } from '../prisma.service';
import { YahooService } from '../data-sources/yahoo/yahoo.service';
import { SecModule } from 'src/data-sources/sec-form4/sec-form4.module';

@Module({
  imports: [SecModule], // Add this line to import the SecForm4Module
  controllers: [FavoritesController],
  providers: [FavoritesService, PrismaService, YahooService],
})
export class FavoritesModule {}
