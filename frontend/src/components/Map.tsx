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
  const [locations, setLocations] = useState<Location[]>([]);
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

  // Filter locations in memory based on current filters
  const filterLocationsInMemory = useCallback((allLocations: Location[], currentFilters: FilterOptions): Location[] => {
    return allLocations.filter(location => {
      // Filter by type
      if (currentFilters.type && location.type !== currentFilters.type) {
        return false;
      }
      
      // Filter by rating
      if (currentFilters.rating_min > 0) {
        // Calculate normalized rating
        if (location.total_ratings > 0) {
          const positiveWeight = location.positive_count;
          const negativeWeight = -1 * location.negative_count;
          const totalWeight = positiveWeight + negativeWeight;
          const normalizedRating = (totalWeight / location.total_ratings + 1) / 2 * 5;
          
          if (normalizedRating < currentFilters.rating_min) {
            return false;
          }
        } else if (!location.source) {
          // Skip user-submitted locations with no ratings if minimum rating is set
          // But keep external locations even if they have no ratings
          return false;
        }
      }
      
      // Filter by distance if user location is provided
      if (userLocation && currentFilters.radius > 0) {
        const distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          location.lat, location.lng
        );
        
        if (distance > currentFilters.radius) {
          return false;
        }
      }
      
      return true;
    });
  }, [userLocation, calculateDistance]);
  
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
          },
          {
            id: 'mock-restroom-2',
            name: 'Mock Restroom 2',
            type: 'restroom',
            address: '101 Elm St, Boston, MA',
            lat: 42.3601 - 0.02,
            lng: -71.0589 - 0.02,
            positive_count: 2,
            neutral_count: 3,
            negative_count: 1,
            total_ratings: 6,
            source: 'goweewee',
            external_id: 'mock-4',
            last_updated: Date.now(),
            ada_accessible: false,
            unisex: true
          }
        ];
        
        // Add mock data to cache
        const mockData = [...mockPoliceStations, ...mockRestrooms];
        mockData.forEach(location => {
          allLocationsRef.current[location.id] = location;
        });
      }
      
      console.log('=== FETCH LOCATIONS END ===');
      
      // Get all locations from cache
      const allLocations = Object.values(allLocationsRef.current);
      
      // Apply filters in memory
      const filteredLocations = filterLocationsInMemory(allLocations, filters);
      console.log(`Filtered to ${filteredLocations.length} locations based on current filters`);
      
      // Update state with filtered locations
      setLocations(filteredLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      
      // Even if the API call fails, we still have our cache
      const allLocations = Object.values(allLocationsRef.current);
      const filteredLocations = filterLocationsInMemory(allLocations, filters);
      
      if (filteredLocations.length > 0) {
        console.log(`Using ${filteredLocations.length} cached locations due to API error`);
        setLocations(filteredLocations);
      } else {
        setLocations([]);
      }
    } finally {
      // Reset loading state
      setIsLoading(false);
    }
  }, [filters, userLocation, includeExternal, filterLocationsInMemory, isLoading, setIsLoading]);
  
  // Function to clear the cache and refresh data
  const refreshData = useCallback(() => {
    console.log('Manually refreshing data and clearing cache');
    allLocationsRef.current = {};
    fetchLocations();
  }, [fetchLocations]);

  // Fetch locations when filters or includeExternal change
  useEffect(() => {
    // Call the fetchLocations function
    fetchLocations();
  }, [fetchLocations]);

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
    setLocations([]);
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
  const getMarkerIcon = (location: Location): google.maps.Icon | string => {
    const { type, source } = location;
    console.log(`Getting marker icon for location: ${location.name}, type: ${type}, source: ${source || 'user'}`);
    
    // Try to use custom icons from the custom_icons folder
    // Fall back to default markers if custom icons are not available
    let iconName = type;
    
    // Add source suffix for external data
    if (source) {
      iconName = `${type}_${source}`;
    }
    
    const customIconPath = `/custom_icons/${iconName}.png`;
    console.log(`Checking for custom icon at: ${customIconPath}`);
    
    // Create an image element to check if the custom icon exists
    const img = new Image();
    img.src = customIconPath;
    
    // If the custom icon exists, use it with custom size for user-submitted locations
    if (img.complete) {
      console.log(`Custom icon found for ${location.name}`);
      // For user-submitted locations, make the icons larger
      if (!source) {
        return {
          url: customIconPath,
          scaledSize: new google.maps.Size(40, 40), // Larger size for user-submitted locations
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(20, 40)
        };
      }
      return customIconPath;
    } else {
      console.log(`No custom icon found for ${location.name}, using default`);
    }
    
    // For user-submitted locations, make the default icons larger
    if (!source) {
      let iconUrl = '';
      
      // Default markers by type
      switch (type) {
        case 'restroom':
          iconUrl = 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
          break;
        case 'restaurant':
          iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
          break;
        case 'police':
          iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
          break;
        default:
          iconUrl = 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
      }
      
      return {
        url: iconUrl,
        scaledSize: new google.maps.Size(40, 40), // Larger size for user-submitted locations
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(20, 40)
      };
    }
    
    // Otherwise, use default markers with different colors based on source
    if (source === 'refuge_restrooms' && type === 'restroom') {
      return 'http://maps.google.com/mapfiles/ms/icons/lightblue-dot.png';
    } else if (source === 'goweewee' && type === 'restroom') {
      return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    } else if (source === 'csv' && type === 'police') {
      return 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png';
    }
    
    // Default markers by type
    switch (type) {
      case 'restroom':
        return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
      case 'restaurant':
        return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
      case 'police':
        return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
      default:
        return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
    }
  };

  // Render the map
  return isLoaded ? (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
        {(() => { console.log('=== RENDERING MARKERS ===', locations.length, 'locations'); return null; })()}
        {locations.length > 0 ? (
          locations.map((location, index) => {
            console.log(`Marker ${index}: ${location.name}, lat: ${location.lat}, lng: ${location.lng}, type: ${location.type}, source: ${location.source || 'user'}`);
            
            // Skip locations with invalid coordinates
            if (typeof location.lat !== 'number' || 
                typeof location.lng !== 'number' || 
                isNaN(location.lat) || 
                isNaN(location.lng)) {
              console.warn(`Skipping marker ${index} due to invalid coordinates:`, location);
              return null;
            }
            
            // Log the marker icon
            const icon = getMarkerIcon(location);
            console.log(`Marker ${index} icon:`, icon);
            
            // Create a marker with a visible label for debugging
            // For string icons, convert them to Icon objects with explicit size
            const finalIcon = typeof icon === 'string' ? {
              url: icon,
              scaledSize: new google.maps.Size(50, 50), // Make markers larger
              origin: new google.maps.Point(0, 0),
              anchor: new google.maps.Point(25, 50)
            } : {
              ...icon,
              scaledSize: new google.maps.Size(50, 50), // Make markers larger
              anchor: new google.maps.Point(25, 50)
            };
            
            console.log(`Final icon for marker ${index}:`, finalIcon);
            
            return (
              <Marker
                key={location.id}
                position={{ lat: location.lat, lng: location.lng }}
                icon={finalIcon}
                label={{
                  text: `${index}`,
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
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
