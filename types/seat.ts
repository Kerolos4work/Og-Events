/**
 * Seat Management Types
 * Centralized type definitions for seat booking system
 */

export type SeatStatus = 'available' | 'booked' | 'reserved' | 'hold' | 'pending_approval';

export interface Seat {
  id: string;
  row_id: string;
  seat_number: string;
  status: SeatStatus;
  category: string;
  booking_id?: string;
  position_x: number;
  position_y: number;
  radius: number;
}

export interface Row {
  id: string;
  zone_id: string;
  row_number: string;
  position_x: number;
  position_y: number;
  seats: Seat[];
}

export interface Area {
  id: string;
  zone_id: string;
  name: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  fill_color: string;
  text_content: string;
}

export interface Zone {
  id: string;
  venue_id: string;
  name: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  areas?: Area[];
  rows: Row[];
}

export interface Category {
  name: string;
  color: string;
  price: number;
  isVisible?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  width: number;
  height: number;
  categories?: Category[];
  zones?: Zone[];
}

export interface MapData extends Venue {
  zones: Zone[];
}

export interface ViewerState {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export interface LegendItem {
  id: string;
  name: string;
  color: string;
  price: number;
  type: 'price' | 'status';
}
