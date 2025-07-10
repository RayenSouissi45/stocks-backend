import { Injectable, NotFoundException } from '@nestjs/common';
import yahooFinance from 'yahoo-finance2';

@Injectable()
export class YahooService {
  async getStockBySymbol(symbol: string) {
    try {
      const [info, historicalData] = await Promise.all([
        yahooFinance.quoteSummary(symbol, {
          modules: [
            'price',
            'financialData',
            'summaryDetail',
            'defaultKeyStatistics',
            'recommendationTrend',
            'earnings',
            'calendarEvents',
            'upgradeDowngradeHistory',
          ],
        }),
        yahooFinance.historical(symbol, {
          period1: this.getDateDaysAgo(30), // Last 30 days for short-term performance
          period2: new Date(),
          interval: '1d',
        }),
      ]);

      if (!info || !info.price) {
        return null;
      }

      const currentPrice = info.price?.regularMarketPrice;
      const targetMean = info.financialData?.targetMeanPrice;
      const targetHigh = info.financialData?.targetHighPrice;
      const targetLow = info.financialData?.targetLowPrice;

      // Calculate various performance metrics
      const performance = await this.calculatePerformanceMetrics(symbol);
      const volumeInfo = this.calculateVolumeMetrics(info, historicalData);
      const dividendInfo = this.getDividendInfo(info);
      const volatilityMetrics = this.calculateVolatility(historicalData);

      const earningsDateArray = info.calendarEvents?.earnings?.earningsDate;
      const nextEarningsDate =
        Array.isArray(earningsDateArray) && earningsDateArray.length > 0
          ? earningsDateArray[0]
          : null;

      return {
        // Basic Info
        name: info.price?.longName || info.price?.shortName || symbol,
        symbol: symbol.toUpperCase(),
        current_price: currentPrice,
        previous_close: info.price?.regularMarketPreviousClose,
        open_price: info.price?.regularMarketOpen,

        // Market Data
        market_cap: info.price?.marketCap,
        volume: info.price?.regularMarketVolume,
        avg_volume: info.summaryDetail?.averageVolume,
        ...volumeInfo,

        // Valuation
        pe_ratio: info.summaryDetail?.trailingPE,
        forward_pe: info.summaryDetail?.forwardPE,
        peg_ratio: info.defaultKeyStatistics?.pegRatio,
        eps: info.defaultKeyStatistics?.trailingEps,
        forward_eps: info.defaultKeyStatistics?.forwardEps,
        price_to_book: info.defaultKeyStatistics?.priceToBook,
        price_to_sales: info.summaryDetail?.priceToSalesTrailing12Months,

        // Performance
        week52_high: info.summaryDetail?.fiftyTwoWeekHigh,
        week52_low: info.summaryDetail?.fiftyTwoWeekLow,
        ...performance,

        // Risk/Reward
        beta: info.summaryDetail?.beta,
        ...volatilityMetrics,

        // Dividends
        ...dividendInfo,

        // Analyst Data
        recommendation: info.financialData?.recommendationKey || 'N/A',
        target_mean: targetMean,
        target_high: targetHigh,
        target_low: targetLow,
        upside_potential:
          targetMean && currentPrice
            ? ((targetMean - currentPrice) / currentPrice) * 100
            : null,
        analyst_ratings: {
          strong_buy: info.recommendationTrend?.trend?.[0]?.strongBuy ?? null,
          buy: info.recommendationTrend?.trend?.[0]?.buy ?? null,
          hold: info.recommendationTrend?.trend?.[0]?.hold ?? null,
          sell: info.recommendationTrend?.trend?.[0]?.sell ?? null,
          strong_sell: info.recommendationTrend?.trend?.[0]?.strongSell ?? null,
          recent_upgrades:
            info.upgradeDowngradeHistory?.history?.filter(
              (x) => x.action === 'up',
            )?.length ?? 0,
          recent_downgrades:
            info.upgradeDowngradeHistory?.history?.filter(
              (x) => x.action === 'down',
            )?.length ?? 0,
        },

        // Corporate Info
        next_earnings_date: nextEarningsDate,
        shares_outstanding: info.defaultKeyStatistics?.sharesOutstanding,
        float: info.defaultKeyStatistics?.floatShares,
        held_by_institutions:
          info.defaultKeyStatistics?.heldPercentInstitutions,
      };
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      return null;
    }
  }

  private async calculatePerformanceMetrics(symbol: string) {
    try {
      const periods = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        YTD: this.getDaysSinceYearStart(),
        '1Y': 365,
      };

      const results = {};

      for (const [label, days] of Object.entries(periods)) {
        const history = await yahooFinance.historical(symbol, {
          period1: this.getDateDaysAgo(days),
          period2: new Date(),
          interval: '1d',
        });

        if (history?.length > 1) {
          const oldPrice = history[0]?.close;
          const newPrice = history[history.length - 1]?.close;
          if (oldPrice && newPrice) {
            results[`performance_${label.toLowerCase()}`] =
              ((newPrice - oldPrice) / oldPrice) * 100;
          }
        }
      }

      // Add 10Y performance separately since it's a special case
      const performance10y = await this.calculate10YPerformance(symbol);
      if (performance10y) {
        results['performance_10y'] = performance10y;
      }

      return results;
    } catch (err) {
      console.error(`Error calculating performance for ${symbol}:`, err);
      return {};
    }
  }

  private calculateVolumeMetrics(info, historicalData) {
    if (!historicalData || historicalData.length < 5) return {};

    const recentVolumes = historicalData
      .slice(-5)
      .map((d) => d.volume)
      .filter(Boolean);

    const avgRecentVolume =
      recentVolumes.length > 0
        ? recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length
        : null;

    return {
      volume_avg_5day: avgRecentVolume,
      volume_vs_avg:
        avgRecentVolume && info.price?.regularMarketVolume
          ? info.price.regularMarketVolume / avgRecentVolume - 1
          : null,
    };
  }

  private getDividendInfo(info) {
    return {
      dividend_rate: info.summaryDetail?.dividendRate,
      dividend_yield: info.summaryDetail?.dividendYield,
      dividend_date: info.calendarEvents?.dividendDate,
      ex_dividend_date: info.summaryDetail?.exDividendDate,
      payout_ratio: info.summaryDetail?.payoutRatio,
      dividend_growth: info.summaryDetail?.dividendGrowth,
    };
  }

  private calculateVolatility(historicalData) {
    if (!historicalData || historicalData.length < 10) return {};

    const closes = historicalData
      .slice(-10)
      .map((d) => d.close)
      .filter(Boolean);

    if (closes.length < 2) return {};

    const avg = closes.reduce((a, b) => a + b, 0) / closes.length;
    const variance =
      closes.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / closes.length;
    const stdDev = Math.sqrt(variance);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;

    return {
      volatility_10day: stdDev,
      volatility_pct: (stdDev / avgPrice) * 100,
    };
  }

  private getDateDaysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private getDaysSinceYearStart(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
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

  private getDateYearsAgo(years: number): Date {
    const date = new Date();
    date.setFullYear(date.getFullYear() - years);
    return date;
  }
}
