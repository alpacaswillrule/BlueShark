import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Location, Rating, FilterOptions } from '../types';
import { getLocations, getRatings } from '../services/api';
import '../styles/InfoWindow.css';

// Get Google Maps API key from environment variables
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Map container style
const containerStyle = {
  width: '100%',
  height: '100%'
};

// Default center (can be updated with user's location)
const defaultCenter = {
  lat: 40.7128, // New York City
  lng: -74.0060
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

  // Fetch locations when filters or includeExternal change
  useEffect(() => {
    const fetchLocations = async () => {
      if (userLocation) {
        const data = await getLocations(filters, userLocation.lat, userLocation.lng, includeExternal);
        setLocations(data);
      } else {
        const data = await getLocations(filters, undefined, undefined, includeExternal);
        setLocations(data);
      }
    };

    fetchLocations();
  }, [filters, userLocation, includeExternal]);

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
    
    // Try to use custom icons from the custom_icons folder
    // Fall back to default markers if custom icons are not available
    let iconName = type;
    
    // Add source suffix for external data
    if (source) {
      iconName = `${type}_${source}`;
    }
    
    const customIconPath = `/custom_icons/${iconName}.png`;
    
    // Create an image element to check if the custom icon exists
    const img = new Image();
    img.src = customIconPath;
    
    // If the custom icon exists, use it with custom size for user-submitted locations
    if (img.complete) {
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
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={userLocation || defaultCenter}
      zoom={12}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {/* Render location markers */}
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          icon={getMarkerIcon(location)}
          onClick={() => setSelectedLocation(location)}
        />
      ))}

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
  ) : (
    <div>Loading Map...</div>
  );
};

export default Map;
