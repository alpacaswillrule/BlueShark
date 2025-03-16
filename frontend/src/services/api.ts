import axios from 'axios';
import { Location, Rating, FilterOptions } from '../types';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Assuming Flask runs on port 5000
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Get locations with filtering
export const getLocations = async (
  filters: FilterOptions,
  userLat?: number,
  userLng?: number,
  includeExternal: boolean = true
): Promise<Location[]> => {
  try {
    const params: Record<string, any> = { 
      ...filters,
      include_external: includeExternal
    };
    
    if (userLat && userLng) {
      params.lat = userLat;
      params.lng = userLng;
    }
    
    const response = await api.get('/locations', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting locations:', error);
    return [];
  }
};

// Get external locations specifically
export const getExternalLocations = async (
  lat: number,
  lng: number,
  radius: number = 10
): Promise<Location[]> => {
  try {
    const params = {
      lat,
      lng,
      radius
    };
    
    const response = await api.get('/external-locations', { params });
    return response.data;
  } catch (error) {
    console.error('Error getting external locations:', error);
    return [];
  }
};

// Refresh external data
export const refreshExternalData = async (): Promise<boolean> => {
  try {
    const response = await api.post('/refresh-external-data');
    return response.status === 202;
  } catch (error) {
    console.error('Error refreshing external data:', error);
    return false;
  }
};

// Get ratings for a specific location
export const getRatings = async (locationId: string): Promise<Rating[]> => {
  try {
    const response = await api.get(`/ratings/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting ratings:', error);
    return [];
  }
};

// Submit a new rating
export const submitRating = async (
  rating: Omit<Rating, 'id' | 'timestamp'>,
  isNewLocation: boolean = false,
  locationData?: Partial<Location>
): Promise<boolean> => {
  try {
    const payload = {
      rating,
      isNewLocation,
      locationData,
    };
    
    const response = await api.post('/ratings', payload);
    return response.status === 201;
  } catch (error) {
    console.error('Error submitting rating:', error);
    return false;
  }
};
