// src/sec/sec-form4.service.ts

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as xml2js from 'xml2js';

interface InsiderTrade {
  owner: string;
  transaction_date: string;
  transaction_code: string;
  amount: string;
  price: string | null;
  type: 'Acquired' | 'Disposed';
}

@Injectable()
export class SecForm4Service {
  private readonly logger = new Logger(SecForm4Service.name);

  private readonly userAgent = 'Rayen Souissi rayensouissi18@gmail.com'; // 🔁 Replace this for SEC compliance

  private async getCikFromSymbol(symbol: string): Promise<string | null> {
    try {
      const url = 'https://www.sec.gov/files/company_tickers.json';
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
      });

      for (const key in data) {
        const item = data[key];
        if (item.ticker.toUpperCase() === symbol.toUpperCase()) {
          return item.cik_str.toString().padStart(10, '0');
        }
      }

      return null;
    } catch (error) {
      this.logger.warn(`Failed to fetch CIK for ${symbol}: ${error.message}`);
      return null;
    }
  }

  async getLatestForm4Filings(symbol: string) {
    try {
      const cik = await this.getCikFromSymbol(symbol);
      if (!cik) {
        return {
          message: `No CIK found for symbol "${symbol}"`,
          symbol,
          insider_trades: [],
        };
      }

      const feedUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
      const { data } = await axios.get(feedUrl, {
        headers: { 'User-Agent': this.userAgent },
      });

      const filings = data?.filings?.recent;
      if (!filings || !filings.form) {
        return {
          message: `No Form 4 filings found for "${symbol}"`,
          symbol,
          insider_trades: [],
        };
      }

      const results: InsiderTrade[] = [];
      let checkedCount = 0;

      for (let i = 0; i < filings.accessionNumber.length; i++) {
        if (filings.form[i] !== '4') continue;

        const accession = filings.accessionNumber[i];
        const accessionSlug = accession.replace(/-/g, '');
        const basePath = `https://www.sec.gov/Archives/edgar/data/${parseInt(
          cik,
        )}/${accessionSlug}`;

        try {
          const indexUrl = `${basePath}/index.json`;
          const indexRes = await axios.get(indexUrl, {
            headers: { 'User-Agent': this.userAgent },
            timeout: 5000,
          });

          const files = indexRes.data?.directory?.item;
          if (!files || !Array.isArray(files)) continue;

          const xmlFiles = files.filter((f) => f.name.endsWith('.xml'));

          for (const file of xmlFiles) {
            try {
              const formUrl = `${basePath}/${file.name}`;
              const xmlResponse = await axios.get(formUrl, {
                headers: { 'User-Agent': this.userAgent },
                timeout: 5000,
              });

              const parsed = await xml2js.parseStringPromise(xmlResponse.data, {
                explicitArray: false,
                mergeAttrs: true,
              });

              if (!parsed?.ownershipDocument) continue;

              const reportingOwner =
                parsed.ownershipDocument?.reportingOwner?.reportingOwnerId
                  ?.rptOwnerName ?? 'Unknown';

              const transactions =
                parsed.ownershipDocument?.nonDerivativeTable
                  ?.nonDerivativeTransaction;

              const formatted: InsiderTrade[] = Array.isArray(transactions)
                ? transactions.map((tx) => ({
                    owner: reportingOwner,
                    transaction_date: tx.transactionDate?.value ?? 'N/A',
                    transaction_code:
                      tx.transactionCoding?.transactionCode ?? 'Unknown',
                    amount:
                      tx.transactionAmounts?.transactionShares?.value ?? '0',
                    price:
                      tx.transactionAmounts?.transactionPricePerShare?.value ??
                      null,
                    type:
                      tx.transactionAcquiredDisposedCode?.value === 'A'
                        ? 'Acquired'
                        : 'Disposed',
                  }))
                : [];

              results.push(...formatted);
              break; // one .xml file is enough
            } catch (err: any) {
              this.logger.warn(
                `Error parsing XML for ${symbol} - ${file.name}: ${err.message}`,
              );
              continue;
            }
          }
        } catch (err: any) {
          this.logger.warn(
            `Failed index.json for ${symbol} - ${accession}: ${err.message}`,
          );
          continue;
        }

        checkedCount++;
        if (results.length >= 10 || checkedCount >= 20) break;
      }

      return {
        symbol,
        cik,
        insider_trades: results,
      };
    } catch (error: any) {
      this.logger.error(`Unexpected error for ${symbol}: ${error.message}`);
      return {
        message: `Failed to retrieve insider trades for "${symbol}"`,
        symbol,
        insider_trades: [],
      };
    }
  }
}
