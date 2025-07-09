import { Controller, Post, Delete, Get, Param } from '@nestjs/common';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':symbol')
  add(@Param('symbol') symbol: string) {
    return this.favoritesService.addFavorite(symbol);
  }

  @Delete(':symbol')
  remove(@Param('symbol') symbol: string) {
    return this.favoritesService.removeFavorite(symbol);
  }

  @Get()
  list() {
    return this.favoritesService.listFavorites();
  }

  @Get('yahoo')
  async listDetails() {
    return this.favoritesService.getFavoriteStockDetails();
  }
  @Get('sec-form4')
  async getInsiderTrades() {
    return this.favoritesService.getFavoriteInsiderTrades();
  }
}
