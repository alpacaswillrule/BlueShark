export interface Location {
  id: string;
  name: string;
  type: string; // 'restroom', 'restaurant', or 'police'
  address: string;
  lat: number;
  lng: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  total_ratings: number;
}

export interface Rating {
  id: string;
  location_id: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  comment?: string;
  timestamp: number;
}

export interface FilterOptions {
  type: string | null;
  rating_min: number;
  radius: number; // in km
}

export type MapViewType = 'all' | 'restroom' | 'restaurant' | 'police';
