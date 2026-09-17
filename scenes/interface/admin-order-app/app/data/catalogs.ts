export type Catalog = {
  id: string;
  name: string;
};

export const catalogs: Catalog[] = [
  { id: 'mvse-us', name: 'MVSE US' },
  { id: 'mvse-eu', name: 'MVSE EU' },
  { id: 'wholesale', name: 'Wholesale' },
];
