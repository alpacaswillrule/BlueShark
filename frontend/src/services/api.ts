import axios from 'axios';
import { Location, Rating, FilterOptions } from '../types';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: 'http://localhost:8000/api', // FastAPI runs on port 8000
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
    console.log('getLocations called with:', { filters, userLat, userLng, includeExternal });
    
    const params: Record<string, any> = { 
      ...filters,
      include_external: includeExternal
    };
    
    if (userLat && userLng) {
      params.lat = userLat;
      params.lng = userLng;
    }
    
    console.log('Making API request to /locations with params:', params);
    
    const response = await api.get('/locations', { params });
    
    console.log('API response received:', response.status);
    console.log('Response data:', response.data);
    
    // Check if the response data is an array
    if (!Array.isArray(response.data)) {
      console.error('API response is not an array:', response.data);
      return [];
    }
    
    // Check if the locations have valid coordinates
    const validLocations = response.data.filter(location => {
      const hasValidCoords = 
        typeof location.lat === 'number' && 
        typeof location.lng === 'number' &&
        !isNaN(location.lat) && 
        !isNaN(location.lng);
      
      if (!hasValidCoords) {
        console.warn('Location missing valid coordinates:', location);
      }
      
      return hasValidCoords;
    });
    
    console.log(`Filtered ${response.data.length - validLocations.length} locations with invalid coordinates`);
    console.log(`Returning ${validLocations.length} valid locations`);
    
    return validLocations;
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
