import { Controller, Get, Param, Query } from '@nestjs/common';
import { YahooService } from './yahoo.service';

@Controller('yahoo')
export class StocksController {
  constructor(private readonly yahooService: YahooService) {}

  /**
   * Get single stock by symbol
   * @param symbol Stock symbol (e.g., AAPL)
   * @returns Stock data or error message
   */
  @Get(':symbol')
  async getStock(@Param('symbol') symbol: string) {
    const stock = await this.yahooService.getStockBySymbol(symbol);
    if (!stock) {
      return {
        success: false,
        message: 'Symbol not found',
        data: null,
      };
    }
    return {
      success: true,
      data: stock,
    };
  }

  /**
   * Get multiple stocks by symbols
   * @param symbols Comma-separated list of symbols (e.g., AAPL,MSFT,GOOG)
   * @returns Object containing arrays of successful results and errors
   */
  @Get()
  async getMultipleStocks(@Query('symbols') symbols: string) {
    // Validate input
    if (!symbols || symbols.trim() === '') {
      return {
        success: false,
        message: 'No symbols provided',
        data: null,
      };
    }

    // Split and clean symbols
    const symbolArray = symbols
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s !== '');

    // Limit number of symbols per request
    const MAX_SYMBOLS = 20;
    if (symbolArray.length > MAX_SYMBOLS) {
      return {
        success: false,
        message: `Too many symbols requested (max ${MAX_SYMBOLS})`,
        data: null,
      };
    }

    // Get stocks data
    const { success, errors } =
      await this.yahooService.getMultipleStocks(symbolArray);

    return {
      success: true,
      data: success,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        requested: symbolArray.length,
        successful: success.length,
        failed: errors.length,
      },
    };
  }
}
