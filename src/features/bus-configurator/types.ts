export type SeatCategory = 'standard' | 'window' | 'aisle' | 'vip' | 'disabled';
export type SeatStatus = 'available' | 'reserved' | 'blocked' | 'selected' | 'occupied';

export interface BusSeat {
  id: string;
  number: number | string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: SeatCategory;
  price?: number | undefined;
  status: SeatStatus;
}

export interface BusDoor {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  side: 'left' | 'right';
  label: string;
}

export interface BusDriver {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
}

export interface BusLayout {
  id: string;
  name: string;
  type: 'minibus' | 'standard' | 'vip' | 'custom';
  capacity: number;
  width: number;
  height: number;
  seats: BusSeat[];
  doors: BusDoor[];
  driverArea: BusDriver;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface BusPreset {
  id: string;
  name: string;
  description: string;
  capacity: number;
  width: number;
  height: number;
  seats: Omit<BusSeat, 'id'>[];
  doors: Omit<BusDoor, 'id'>[];
  driverArea: BusDriver;
}

export interface SavedBusTemplate {
  id: string;
  name: string;
  capacity: number;
  layout: BusLayout;
  createdAt: string;
  updatedAt: string;
}
