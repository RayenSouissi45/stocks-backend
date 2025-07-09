import { Injectable, NotFoundException } from '@nestjs/common';
import yahooFinance from 'yahoo-finance2';

@Injectable()
export class YahooService {
  async getStockBySymbol(symbol: string) {
    try {
      const info = await yahooFinance.quoteSummary(symbol, {
        modules: [
          'price',
          'financialData',
          'summaryDetail',
          'defaultKeyStatistics',
          'recommendationTrend',
          'earnings',
          'calendarEvents',
        ],
      });

      if (!info || !info.price) {
        // Return null or a custom object instead of throwing an error
        return null;
      }

      const currentPrice = info.price?.regularMarketPrice;
      const targetMean = info.financialData?.targetMeanPrice;
      const targetHigh = info.financialData?.targetHighPrice;
      const targetLow = info.financialData?.targetLowPrice;

      const upsidePotential =
        targetMean && currentPrice
          ? ((targetMean - currentPrice) / currentPrice) * 100
          : null;

      const earningsDateArray = info.calendarEvents?.earnings?.earningsDate;
      const nextEarningsDate =
        Array.isArray(earningsDateArray) && earningsDateArray.length > 0
          ? earningsDateArray[0]
          : null;

      const analystRatings = {
        strong_buy: info.recommendationTrend?.trend?.[0]?.strongBuy ?? null,
        buy: info.recommendationTrend?.trend?.[0]?.buy ?? null,
        hold: info.recommendationTrend?.trend?.[0]?.hold ?? null,
        sell: info.recommendationTrend?.trend?.[0]?.sell ?? null,
        strong_sell: info.recommendationTrend?.trend?.[0]?.strongSell ?? null,
      };

      const performance10y = await this.calculate10YPerformance(symbol);

      return {
        name: info.price?.longName || info.price?.shortName || symbol,
        symbol: symbol.toUpperCase(),
        current_price: currentPrice,
        market_cap: info.price?.marketCap,
        pe_ratio: info.summaryDetail?.trailingPE,
        eps: info.defaultKeyStatistics?.trailingEps,
        week52_high: info.summaryDetail?.fiftyTwoWeekHigh,
        week52_low: info.summaryDetail?.fiftyTwoWeekLow,
        beta: info.summaryDetail?.beta,
        recommendation: info.financialData?.recommendationKey || 'N/A',
        target_mean: targetMean,
        target_high: targetHigh,
        target_low: targetLow,
        upside_potential: upsidePotential,
        performance_10y: performance10y,
        analyst_ratings: analystRatings,
        next_earnings_date: nextEarningsDate,
      };
    } catch (error) {
      console.error(error);
      // Return null or a custom object instead of throwing an error
      return null;
    }
  }

  async calculate10YPerformance(symbol: string): Promise<number | null> {
    try {
      const history = await yahooFinance.historical(symbol, {
        period1: this.getDateYearsAgo(10),
        period2: new Date(),
        interval: '1mo',
      });

      if (!history || history.length < 2) {
        return null;
      }

      const oldPrice = history[0]?.close;
      const latestPrice = history[history.length - 1]?.close;

      if (oldPrice && latestPrice) {
        return ((latestPrice - oldPrice) / oldPrice) * 100;
      }

      return null;
    } catch (err) {
      console.error(`Error fetching 10Y performance for ${symbol}:`, err);
      return null;
    }
  }

  getDateYearsAgo(years: number): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  }
}
