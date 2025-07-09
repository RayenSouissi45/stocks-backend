import { Controller, Get, Param } from '@nestjs/common';
import { SecForm4Service } from './sec-form4.service';
import { InsiderTrade } from './insider-trade.interface';

@Controller('sec')
export class SecForm4Controller {
  constructor(private readonly secService: SecForm4Service) {}

  @Get('insider-trades/:symbol')
  async getInsiderTrades(@Param('symbol') symbol: string): Promise<
    | {
        symbol: string;
        cik: string;
        insider_trades: InsiderTrade[];
      }
    | { error: string }
    | { message: string }
  > {
    return this.secService.getLatestForm4Filings(symbol.toUpperCase());
  }
}
