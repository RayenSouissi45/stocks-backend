import { Injectable, NotFoundException } from '@nestjs/common';
import { YahooService } from '../data-sources/yahoo/yahoo.service';
import { PrismaService } from '../prisma.service';
import { SecForm4Service } from 'src/data-sources/sec-form4/sec-form4.service';

export interface InsiderTradeResult {
  symbol: string;
  cik?: string;
  message?: string;
  error?: string;
  insider_trades: {
    owner: string;
    transaction_date: string;
    transaction_code: string;
    amount: string;
    price: string | null;
    type: 'Acquired' | 'Disposed';
  }[];
}
@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly yahooService: YahooService,
    private readonly secForm4Service: SecForm4Service,
  ) {}

  async addFavorite(symbol: string) {
    symbol = symbol.toUpperCase();

    try {
      // First check if the favorite already exists
      const existingFavorite = await this.prisma.favorite.findFirst({
        where: { symbol },
      });

      if (existingFavorite) {
        return {
          success: true,
          message: `${symbol} is already in favorites`,
          alreadyExists: true,
        };
      }

      // If not exists, create new favorite
      const newFavorite = await this.prisma.favorite.create({
        data: { symbol },
      });

      return {
        success: true,
        message: `${symbol} added to favorites`,
        data: newFavorite,
      };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return {
        success: false,
        message: 'Failed to add favorite',
        error: error.message,
      };
    }
  }

  async removeFavorite(symbol: string) {
    symbol = symbol.toUpperCase();

    try {
      // First check if the favorite exists
      const favorite = await this.prisma.favorite.findUnique({
        where: { symbol },
      });

      if (!favorite) {
        return {
          success: true,
          message: `${symbol} was not found in favorites`,
          notFound: true,
        };
      }

      // If exists, proceed with deletion
      await this.prisma.favorite.delete({
        where: { symbol },
      });

      return {
        success: true,
        message: `${symbol} removed from favorites`,
        data: favorite,
      };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return {
        success: false,
        message: 'Failed to remove favorite',
        error: error.message,
      };
    }
  }

  async listFavorites(): Promise<string[]> {
    const favorites = await this.prisma.favorite.findMany();
    return favorites.map((fav) => fav.symbol);
  }

  async getFavoriteStockDetails() {
    const symbols = await this.listFavorites();
    const details: any[] = [];
    for (const symbol of symbols) {
      const stock = await this.yahooService.getStockBySymbol(symbol);
      details.push(stock);
    }
    return details;
  }
  async getFavoriteInsiderTrades(): Promise<InsiderTradeResult[]> {
    const symbols = await this.listFavorites();
    const results: InsiderTradeResult[] = [];

    for (const symbol of symbols) {
      try {
        const data = await this.secForm4Service.getLatestForm4Filings(symbol);
        results.push(data);
      } catch (error) {
        results.push({
          symbol,
          error: `Failed to fetch insider trades: ${error.message}`,
          insider_trades: [],
        });
      }
    }

    return results;
  }
}
