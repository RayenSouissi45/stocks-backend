import { Controller, Get, Param } from '@nestjs/common';
import { YahooService } from './yahoo.service';

@Controller('yahoo')
export class StocksController {
  constructor(private readonly yahooService: YahooService) {}

  @Get(':symbol')
  async getStock(@Param('symbol') symbol: string) {
    const stock = await this.yahooService.getStockBySymbol(symbol);
    // Return a custom object if stock is not found, do not throw NotFoundException
    console.log('Stock data:', stock);
    if (!stock) {
      return { message: 'Symbol not found', data: null };
    }
    return stock;
  }
}
