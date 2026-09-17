export type FeaturedStore = {
  name: string;
  domain: string;
  logo: string;
};

export type StoreLocation = [number, number];

export const featuredStores: FeaturedStore[] = [
  {
    name: 'MVSE',
    domain: 'mvse.com',
    logo: '/images/store-logo/mvse.jpg',
  },
  {
    name: 'MVSE Athletic',
    domain: 'mvseathletic.com',
    logo: '/images/store-logo/mvse-athletic.jpg',
  },
  {
    name: 'MVSE Tennis',
    domain: 'mvsetennis.com',
    logo: '/images/store-logo/mvse-tennis.jpg',
  },
];

export const currentStore = featuredStores[0];
export const currentStoreLocation: StoreLocation = [43.6532, -79.3832];
