export interface InsiderTrade {
  owner: string;
  transaction_date: string;
  transaction_code: string;
  amount: string;
  price: string | null;
  type: 'Acquired' | 'Disposed';
}
