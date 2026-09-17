export type CompanyOrderingStatus = 'Approved';

export type Company = {
  id: string;
  name: string;
  orderingStatus: CompanyOrderingStatus;
  locationCount: number;
  mainContact?: string;
  orderCount: number;
  totalSales: string;
};

export const companies: Company[] = [
  {
    id: 'northstar-supply',
    name: 'Northstar Supply',
    orderingStatus: 'Approved',
    locationCount: 3,
    mainContact: 'Maren Fox',
    orderCount: 12,
    totalSales: '€14.820,40',
  },
  {
    id: 'evergreen-workshop',
    name: 'Evergreen Workshop',
    orderingStatus: 'Approved',
    locationCount: 1,
    mainContact: 'Theo Stone',
    orderCount: 6,
    totalSales: '€7.436,15',
  },
  {
    id: 'atlas-studio',
    name: 'Atlas Studio',
    orderingStatus: 'Approved',
    locationCount: 2,
    mainContact: 'Iris Reed',
    orderCount: 4,
    totalSales: '€3.918,00',
  },
  {
    id: 'harbor-retail-group',
    name: 'Harbor Retail Group',
    orderingStatus: 'Approved',
    locationCount: 5,
    orderCount: 18,
    totalSales: '€22.604,75',
  },
];

export function useCompaniesData() {
  return companies;
}
