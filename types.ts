
export interface Bike {
  id: string;
  model: string;
  chassis: string;
  engine: string;
  color: string;
  status: 'available' | 'sold';
  // New fields
  containerId?: string;
  buyingPrice?: number;
  registrationNumber?: string;
  exporterName?: string;
}

export interface Container {
  id: string;
  name: string; // e.g., "Feb 2024 Shipment"
  exporterName: string;
  importDate: string;
  bikeIds: string[];
}

export interface Customer {
  id: string;
  name: string;
  fatherName: string;
  motherName: string;
  phone: string;
  nid: string;
  dob: string;
  photo: string | null;
  address: string;
  notes: string;
  purchasedBikeIds: string[];
}

export interface Sale {
  id: string;
  bikeId: string;
  customerId: string;
  saleDate: string;
  salePrice: number;
  // New field
  registrationDuration: '2 years' | '10 years';
}

export type AppTab = 'dashboard' | 'stock' | 'sales' | 'customers' | 'containers';
