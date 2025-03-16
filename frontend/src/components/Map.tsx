import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location, Rating, FilterOptions } from '../types';
import { getLocations, getRatings } from '../services/api';
import '../styles/InfoWindow.css';

// Get Google Maps API key from environment variables
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
console.log('Google Maps API Key:', googleMapsApiKey ? 'Key is set' : 'Key is NOT set');

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (can be updated with user's location)
const defaultCenter = {
  lat: 42.3601, // Boston
  lng: -71.0589
};

// Custom map styles for Blue Shark theme
const mapStyles = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#ADD8E6' }] // Light blue water
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#FFFFFF' }] // White landscape
  },
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ color: '#FFC0CB' }] // Pink POI icons
  },
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ color: '#FFC0CB' }] // Pink transit icons
  }
];

interface MapProps {
  filters: FilterOptions;
  includeExternal?: boolean;
}

const Map: React.FC<MapProps> = ({ filters, includeExternal = true }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationRatings, setLocationRatings] = useState<Rating[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showRefreshButton, setShowRefreshButton] = useState<boolean>(false);
  
  // Use a ref to track if we've already loaded locations
  const locationsLoadedRef = useRef<boolean>(false);
  
  // Use a ref to store all locations we've ever received
  const allLocationsRef = useRef<Record<string, Location>>({});
  
  // Track the last filter type to know when to clear the cache
  const lastFilterTypeRef = useRef<string | null>(null);
  
  // Debug re-renders
  useEffect(() => {
    console.log('Map component rendered');
  });

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;  // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;  // Distance in km
    return distance;
  }, []);

  // Apply filtering immediately when component mounts or filters change
  useEffect(() => {
    console.log('DIRECT FILTER EFFECT TRIGGERED');
    console.log('Current filter type:', filters.type);
    console.log('Total locations available:', allLocations.length);
    
    // Apply filtering directly
    let filtered = [...allLocations];
    
    // Filter by type if a type filter is active
    if (filters.type) {
      console.log(`Filtering by type: ${filters.type}`);
      filtered = filtered.filter(location => location.type === filters.type);
    }
    
    // Log the results
    console.log(`FILTERED to ${filtered.length} locations`);
    
    // Log types of filtered locations
    const typeCount: Record<string, number> = {};
    filtered.forEach(loc => {
      typeCount[loc.type] = (typeCount[loc.type] || 0) + 1;
    });
    console.log('Types after filtering:', typeCount);
    
    // Update filtered locations
    setFilteredLocations(filtered);
    
  }, [allLocations, filters.type]);
  
  // Function to fetch locations
  const fetchLocations = useCallback(async () => {
    // Skip if already loading
    if (isLoading) {
      console.log('Already loading locations, skipping fetch');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('=== FETCH LOCATIONS START ===');
      
      // Check if filter type has changed, if so clear the cache
      const currentFilterType = filters.type || 'all';
      if (lastFilterTypeRef.current !== currentFilterType) {
        console.log(`Filter type changed from ${lastFilterTypeRef.current} to ${currentFilterType}, clearing cache`);
        allLocationsRef.current = {};
        lastFilterTypeRef.current = currentFilterType;
      }
      
      // Fetch new data from API
      let newData: Location[] = [];
      
      if (userLocation) {
        console.log('Fetching locations with user location:', userLocation);
        console.log('Filters:', filters);
        console.log('Include external:', includeExternal);
        
        newData = await getLocations(filters, userLocation.lat, userLocation.lng, includeExternal);
      } else {
        console.log('Fetching locations without user location');
        console.log('Filters:', filters);
        console.log('Include external:', includeExternal);
        
        newData = await getLocations(filters, undefined, undefined, includeExternal);
      }
      
      // Mark that we've loaded locations
      locationsLoadedRef.current = true;
      
      console.log(`Locations fetched: ${newData.length} total locations`);
      
      // Check for valid coordinates
      const validLocations = newData.filter(loc => 
        typeof loc.lat === 'number' && 
        typeof loc.lng === 'number' && 
        !isNaN(loc.lat) && 
        !isNaN(loc.lng)
      );
      
      console.log(`Locations with valid coordinates: ${validLocations.length}/${newData.length}`);
      
      if (validLocations.length < newData.length) {
        console.warn('Some locations have invalid coordinates!');
        console.warn('Invalid locations:', newData.filter(loc => 
          typeof loc.lat !== 'number' || 
          typeof loc.lng !== 'number' || 
          isNaN(loc.lat) || 
          isNaN(loc.lng)
        ));
      }
      
      // If we got valid data, merge it with our cache
      if (validLocations.length > 0) {
        // Add timestamp to each location
        const timestampedLocations = validLocations.map(loc => ({
          ...loc,
          _fetchTimestamp: Date.now()
        }));
        
        // Convert array to record for easier merging
        const newLocationsRecord = timestampedLocations.reduce((acc, location) => {
          acc[location.id] = location;
          return acc;
        }, {} as Record<string, Location>);
        
        // Merge with existing cache
        allLocationsRef.current = {
          ...allLocationsRef.current,
          ...newLocationsRecord
        };
        
        console.log(`Cache now contains ${Object.keys(allLocationsRef.current).length} locations`);
      }
      
      // If no locations were returned and cache is empty, add some mock data for testing
      if (Object.keys(allLocationsRef.current).length === 0) {
        console.log('No locations in cache, adding mock data');
        
        // Add mock police stations
        const mockPoliceStations: Location[] = [
          {
            id: 'mock-police-1',
            name: 'Mock Police Station 1',
            type: 'police',
            address: '123 Main St, Boston, MA',
            lat: 42.3601 + 0.01,
            lng: -71.0589 + 0.01,
            positive_count: 5,
            neutral_count: 2,
            negative_count: 1,
            total_ratings: 8,
            source: 'csv',
            external_id: 'mock-1',
            last_updated: Date.now()
          },
          {
            id: 'mock-police-2',
            name: 'Mock Police Station 2',
            type: 'police',
            address: '456 Oak St, Boston, MA',
            lat: 42.3601 - 0.01,
            lng: -71.0589 - 0.01,
            positive_count: 3,
            neutral_count: 1,
            negative_count: 2,
            total_ratings: 6,
            source: 'csv',
            external_id: 'mock-2',
            last_updated: Date.now()
          }
        ];
        
        // Add mock restrooms
        const mockRestrooms: Location[] = [
          {
            id: 'mock-restroom-1',
            name: 'Mock Restroom 1',
            type: 'restroom',
            address: '789 Pine St, Boston, MA',
            lat: 42.3601 + 0.02,
            lng: -71.0589 + 0.02,
            positive_count: 7,
            neutral_count: 1,
            negative_count: 0,
            total_ratings: 8,
            source: 'refuge_restrooms',
            external_id: 'mock-3',
            last_updated: Date.now(),
            ada_accessible: true,
            unisex: true
          }
        ];
        
        // Only add mock data that matches the current filter type
        let mockData: Location[] = [];
        
        if (!filters.type || filters.type === 'police') {
          console.log('Adding mock police stations');
          mockData = [...mockData, ...mockPoliceStations];
        }
        
        if (!filters.type || filters.type === 'restroom') {
          console.log('Adding mock restrooms');
          mockData = [...mockData, ...mockRestrooms];
        }
        
        console.log(`Adding ${mockData.length} mock locations to cache`);
        mockData.forEach(location => {
          allLocationsRef.current[location.id] = location;
        });
      }
      
      console.log('=== FETCH LOCATIONS END ===');
      
      // Get all locations from cache
      const locations = Object.values(allLocationsRef.current);
      
      // Update state with all locations
      setAllLocations(locations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      
      // Even if the API call fails, we still have our cache
      const locations = Object.values(allLocationsRef.current);
      
      if (locations.length > 0) {
        console.log(`Using ${locations.length} cached locations due to API error`);
        setAllLocations(locations);
      } else {
        setAllLocations([]);
      }
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  }, [filters, userLocation, includeExternal, isLoading, setIsLoading]);
  
  // Function to clear the cache and refresh data
  const refreshData = useCallback(() => {
    console.log('Manually refreshing data and clearing cache');
    allLocationsRef.current = {};
    fetchLocations();
  }, [fetchLocations]);

  // Fetch locations only on initial mount
  useEffect(() => {
    console.log('INITIAL FETCH TRIGGERED');
    console.log('Fetching all locations on mount');
    
    // Fetch locations once on mount
    fetchLocations();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Error getting location');
        }
      );
    }
  }, []);

  // Fetch ratings when a location is selected
  useEffect(() => {
    const fetchRatings = async () => {
      if (selectedLocation) {
        const ratings = await getRatings(selectedLocation.id);
        setLocationRatings(ratings);
      }
    };

    fetchRatings();
  }, [selectedLocation]);

  const onLoad = useCallback((map: google.maps.Map) => {
    map.setOptions({
      styles: mapStyles
    });
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    // Clean up Google Maps resources
    if (map && window.google?.maps?.event) {
      // Remove all event listeners
      window.google.maps.event.clearInstanceListeners(map);
    }
    
    // Clear state
    setMap(null);
    setAllLocations([]);
    setFilteredLocations([]);
    setSelectedLocation(null);
    setLocationRatings([]);
  }, [map]);

  // Calculate the normalized rating (0-5 scale)
  const calculateRating = (location: Location): number => {
    if (location.total_ratings === 0) return 0;
    
    const positiveWeight = location.positive_count;
    const negativeWeight = -1 * location.negative_count;
    const totalWeight = positiveWeight + negativeWeight;
    
    return (totalWeight / location.total_ratings + 1) / 2 * 5;
  };

  // Get marker icon based on location type and source
  const getMarkerIcon = (location: Location): google.maps.Icon => {
    const { type, source } = location;
    console.log(`Getting marker icon for location: ${location.name}, type: ${type}, source: ${source || 'user'}`);
    
    // Use custom icons from the custom_icons folder based on type
    // We know we have police.png, restroom.png, and resturant.png (note the typo)
    let iconPath = '';
    
    switch (type) {
      case 'police':
        iconPath = '/custom_icons/police.png';
        break;
      case 'restroom':
        iconPath = '/custom_icons/restroom.png';
        break;
      case 'restaurant':
        // Note: The file has a typo (resturant.png)
        iconPath = '/custom_icons/resturant.png';
        break;
      default:
        // Fallback to default Google marker for unknown types
        return {
          url: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
          scaledSize: new google.maps.Size(40, 40),
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(20, 40)
        };
    }
    
    // For user-submitted locations, make the icons larger
    const size = !source ? 50 : 40;
    
    return {
      url: iconPath,
      scaledSize: new google.maps.Size(size, size),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(size/2, size/2)
    };
  };

  // Render the map
  return isLoaded ? (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Filter type indicator */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>
          Showing: {filters.type ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1) : 'All Locations'} 
          ({filteredLocations.length} locations)
        </span>
      </div>

      {/* Refresh button */}
      <div 
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading ? 0.7 : 1
        }}
        onClick={isLoading ? undefined : refreshData}
        title={isLoading ? "Loading..." : "Refresh locations"}
      >
        <span 
          role="img" 
          aria-label="refresh" 
          style={{ 
            fontSize: '20px',
            animation: isLoading ? 'spin 1s linear infinite' : 'none'
          }}
        >
          🔄
        </span>
        <span style={{ marginLeft: '5px', fontWeight: 'bold' }}>
          {isLoading ? 'Loading...' : 'Refresh'}
        </span>
      </div>
      
      {/* Refresh button */}
      <div 
        style={{
          position: 'absolute',
          top: '60px',
          right: '10px',
          zIndex: 1000,
          backgroundColor: '#4CAF50', // Green background
          color: 'white',
          borderRadius: '4px',
          padding: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isLoading ? 0.7 : 1
        }}
        onClick={isLoading ? undefined : refreshData}
        title={isLoading ? "Loading..." : "Refresh Data"}
      >
        <span style={{ fontWeight: 'bold' }}>
          {isLoading ? 'Loading...' : 'Refresh Data'}
        </span>
      </div>
      
      {/* Add CSS animation for the loading spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            key="user-location"
            position={userLocation}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
              scaledSize: new google.maps.Size(40, 40),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(20, 40)
            }}
            onClick={() => console.log('User location clicked')}
          />
        )}
        
        {/* Render location markers */}
        {(() => { 
          console.log('=== RENDERING MARKERS ===');
          console.log(`Rendering ${filteredLocations.length} filtered locations`);
          
          // Log types of locations being rendered
          const typeCount: Record<string, number> = {};
          filteredLocations.forEach(loc => {
            typeCount[loc.type] = (typeCount[loc.type] || 0) + 1;
          });
          console.log('Types of locations being rendered:', typeCount);
          
          return null; 
        })()}
        
        {filteredLocations.length > 0 ? (
          // Render markers for filtered locations
          filteredLocations.map((location, index) => {
              console.log(`Rendering marker ${index}: ${location.name}, lat: ${location.lat}, lng: ${location.lng}, type: ${location.type}, source: ${location.source || 'user'}`);
              
              // Skip locations with invalid coordinates
              if (typeof location.lat !== 'number' || 
                  typeof location.lng !== 'number' || 
                  isNaN(location.lat) || 
                  isNaN(location.lng)) {
                console.warn(`Skipping marker ${index} due to invalid coordinates:`, location);
                return null;
              }
              
              // Get the icon for this location
              const icon = getMarkerIcon(location);
              console.log(`Marker ${index} icon:`, icon);
              
              return (
                <Marker
                  key={location.id}
                  position={{ lat: location.lat, lng: location.lng }}
                  icon={icon}
                  zIndex={1000} // Ensure markers are on top
                  onClick={() => {
                    console.log('Marker clicked:', location);
                    setSelectedLocation(location);
                  }}
                />
              );
            })
        ) : (
          <Marker
            key="no-locations-marker"
            position={defaultCenter}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(40, 40),
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(20, 40)
            }}
            label={{
              text: 'No locations found',
              color: 'white',
              fontWeight: 'bold'
            }}
            onClick={() => console.log('No locations marker clicked')}
          />
        )}
        {(() => { console.log('=== MARKERS RENDERED ==='); return null; })()}

        {/* Render info window for selected location */}
        {selectedLocation && (
          <InfoWindow
            position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}
            onCloseClick={() => setSelectedLocation(null)}
          >
            <div className="info-window">
              <h3>{selectedLocation.name}</h3>
              <p>{selectedLocation.address}</p>
              
              {selectedLocation.source && (
                <div className="source-tag">
                  Source: {selectedLocation.source.replace('_', ' ')}
                </div>
              )}
              
              {selectedLocation.type === 'restroom' && (
                <div className="restroom-details">
                  {selectedLocation.ada_accessible && <div className="tag ada">ADA Accessible</div>}
                  {selectedLocation.unisex && <div className="tag unisex">Unisex</div>}
                </div>
              )}
              
              <p>
                Rating: {calculateRating(selectedLocation).toFixed(1)} / 5
                ({selectedLocation.total_ratings} ratings)
              </p>
              
              <div className="rating-breakdown">
                <div>Positive: {selectedLocation.positive_count}</div>
                <div>Neutral: {selectedLocation.neutral_count}</div>
                <div>Negative: {selectedLocation.negative_count}</div>
              </div>
              
              <h4>Recent Comments:</h4>
              <div className="comments">
                {locationRatings.length > 0 ? (
                  locationRatings
                    .filter(rating => rating.comment)
                    .slice(0, 3)
                    .map(rating => (
                      <div key={rating.id} className="comment">
                        <div className={`sentiment ${rating.sentiment}`}>
                          {rating.sentiment}
                        </div>
                        <div className="comment-text">{rating.comment}</div>
                      </div>
                    ))
                ) : (
                  <p>No comments yet.</p>
                )}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  ) : (
    <div>Loading Map...</div>
  );
};

export default Map;
