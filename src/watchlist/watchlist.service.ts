// src/watchlist/watchlist.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { YahooService } from 'src/data-sources/yahoo/yahoo.service';
import { PrismaService } from 'src/prisma.service';
import { WatchlistItem } from './watchlist-item.interface';

@Injectable()
export class WatchlistService {
  constructor(
    private readonly yahooService: YahooService,
    private readonly prisma: PrismaService,
  ) {}

  async addStock(symbol: string): Promise<WatchlistItem> {
    symbol = symbol.toUpperCase();

    try {
      // First check if already exists
      const existing = await this.prisma.watchlist.findUnique({
        where: { symbol },
      });
      if (existing) return existing;

      // Get stock data from YahooService
      const stockData = await this.yahooService.getStockBySymbol(symbol);
      if (!stockData) {
        throw new NotFoundException(`Stock ${symbol} not found`);
      }

      // Create new watchlist item
      const newItem = await this.prisma.watchlist.create({
        data: {
          symbol,
          data: stockData,
        },
      });

      return newItem;
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  }

  async getAll(): Promise<WatchlistItem[]> {
    return this.prisma.watchlist.findMany();
  }

  async getOne(id: number): Promise<WatchlistItem> {
    const item = await this.prisma.watchlist.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException(`Watchlist item ${id} not found`);
    return item;
  }

  async remove(id: number): Promise<WatchlistItem> {
    try {
      return await this.prisma.watchlist.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Watchlist item ${id} not found`);
    }
  }

  async refresh(id: number): Promise<WatchlistItem> {
    const item = await this.getOne(id);
    const updatedData = await this.yahooService.getStockBySymbol(item.symbol);
    if (!updatedData) {
      throw new NotFoundException(`Failed to refresh data for ${item.symbol}`);
    }

    return this.prisma.watchlist.update({
      where: { id },
      data: { data: updatedData },
    });
  }
}
