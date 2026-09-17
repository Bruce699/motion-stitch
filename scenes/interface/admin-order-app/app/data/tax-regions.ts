export type TaxRegion = {
  countryCode: string;
  flag: string;
  region: string;
  collecting: boolean;
  service: string;
};

export const taxRegions: TaxRegion[] = [
  {
    countryCode: 'US',
    flag: '🇺🇸',
    region: 'United States',
    collecting: true,
    service: 'Shopify tax',
  },
  {
    countryCode: 'CA',
    flag: '🇨🇦',
    region: 'Canada',
    collecting: true,
    service: 'Basic tax',
  },
  {
    countryCode: 'GB',
    flag: '🇬🇧',
    region: 'United Kingdom',
    collecting: false,
    service: 'Manual tax',
  },
  {
    countryCode: 'DE',
    flag: '🇩🇪',
    region: 'Germany',
    collecting: true,
    service: 'Basic tax',
  },
];
