import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service';
import { WatchlistItem } from './watchlist-item.interface';

@Controller('watchlist')
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post(':symbol')
  async add(@Param('symbol') symbol: string): Promise<WatchlistItem> {
    return await this.watchlistService.addStock(symbol);
  }

  @Get()
  async getAll(): Promise<WatchlistItem[]> {
    return await this.watchlistService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number): Promise<WatchlistItem> {
    return await this.watchlistService.getOne(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<WatchlistItem> {
    return await this.watchlistService.remove(id);
  }

  @Post(':id/refresh')
  async refresh(@Param('id', ParseIntPipe) id: number): Promise<WatchlistItem> {
    return await this.watchlistService.refresh(id);
  }
}
