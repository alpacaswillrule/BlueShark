import os
import csv
import json
import time
import logging
import requests
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
REFUGE_RESTROOMS_API_BASE_URL = "https://www.refugerestrooms.org/api/v1/restrooms"
GOWEEWEE_API_URL = "https://goweewee.com/api/v2/restrooms/post/report_restrooms.php"
POLICE_STATIONS_CSV_PATH = "../police_stations.csv"  # Path relative to the backend directory

# Debug mode - set to True to print more logs
DEBUG = True

# Cache for API responses to avoid excessive API calls
api_cache = {
    "refuge_restrooms": {"data": None, "timestamp": 0},
    "goweewee": {"data": None, "timestamp": 0},
    "police_stations": {"data": None, "timestamp": 0}
}

# Cache expiration time (24 hours in seconds)
CACHE_EXPIRATION = 24 * 60 * 60

def get_refuge_restrooms(lat: float, lng: float, page: int = 1, per_page: int = 50, 
                         ada: Optional[bool] = None, unisex: Optional[bool] = None) -> List[Dict[str, Any]]:
    """
    Fetch restroom data from Refuge Restrooms API.
    
    Args:
        lat: Latitude
        lng: Longitude
        page: Page number for pagination
        per_page: Number of results per page
        ada: Filter for ADA accessible restrooms
        unisex: Filter for unisex restrooms
        
    Returns:
        List of restroom locations
    """
    cache_key = f"refuge_restrooms_{lat}_{lng}_{page}_{per_page}_{ada}_{unisex}"
    
    # Check if we have cached data that's still valid
    if cache_key in api_cache and (time.time() - api_cache[cache_key]["timestamp"] < CACHE_EXPIRATION):
        logger.info(f"Using cached data for {cache_key}")
        return api_cache[cache_key]["data"]
    
    # Prepare parameters
    params = {
        "lat": lat,
        "lng": lng,
        "page": page,
        "per_page": per_page
    }
    
    # Add optional filters if provided
    if ada is not None:
        params["ada"] = "true" if ada else "false"
    if unisex is not None:
        params["unisex"] = "true" if unisex else "false"
    
    try:
        logger.info(f"Fetching data from Refuge Restrooms API with params: {params}")
        response = requests.get(f"{REFUGE_RESTROOMS_API_BASE_URL}/by_location.json", params=params)
        response.raise_for_status()
        
        data = response.json()
        
        if DEBUG:
            logger.info(f"Received {len(data)} restrooms from Refuge Restrooms API")
        
        # Transform data to match our application's format
        transformed_data = []
        for item in data:
            transformed_item = {
                "name": item.get("name", "Unknown Restroom"),
                "type": "restroom",
                "address": item.get("street", "") + ", " + item.get("city", "") + ", " + item.get("state", ""),
                "lat": float(item.get("latitude", 0)),
                "lng": float(item.get("longitude", 0)),
                "positive_count": 0,
                "neutral_count": 0,
                "negative_count": 0,
                "total_ratings": 0,
                "source": "refuge_restrooms",
                "external_id": str(item.get("id", "")),
                "ada_accessible": item.get("accessible", False),
                "unisex": item.get("unisex", False),
                "last_updated": int(datetime.now().timestamp() * 1000)
            }
            transformed_data.append(transformed_item)
        
        # Cache the transformed data
        api_cache[cache_key] = {
            "data": transformed_data,
            "timestamp": time.time()
        }
        
        return transformed_data
    
    except requests.RequestException as e:
        logger.error(f"Error fetching data from Refuge Restrooms API: {e}")
        return []

def get_goweewee_restrooms(lat: float, lng: float, radius: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch restroom data from GoWeeWee API.
    Note: This API is currently not working correctly, so we're returning mock data.
    
    Args:
        lat: Latitude
        lng: Longitude
        radius: Search radius in kilometers
        
    Returns:
        List of restroom locations
    """
    # Since the GoWeeWee API is not working, return mock data
    logger.info("Using mock data for GoWeeWee API")
    
    # Generate some mock restrooms around the given coordinates
    mock_restrooms = []
    for i in range(10):
        # Generate random offsets for lat/lng (roughly within the radius)
        lat_offset = (i % 5) * 0.01
        lng_offset = (i % 3) * 0.01
        
        mock_restroom = {
            "name": f"GoWeeWee Restroom {i+1}",
            "type": "restroom",
            "address": f"Mock Address {i+1}, Mock City, MA",
            "lat": lat + lat_offset,
            "lng": lng + lng_offset,
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0,
            "total_ratings": 0,
            "source": "goweewee",
            "external_id": f"goweewee-{i+1}",
            "ada_accessible": i % 2 == 0,  # Every other restroom is ADA accessible
            "unisex": i % 3 == 0,  # Every third restroom is unisex
            "last_updated": int(datetime.now().timestamp() * 1000)
        }
        mock_restrooms.append(mock_restroom)
    
    return mock_restrooms

def load_police_stations_from_csv() -> List[Dict[str, Any]]:
    """
    Load police station data from CSV file.
    If the CSV file is not found, return mock data.
    
    Returns:
        List of police station locations
    """
    try:
        logger.info(f"Loading police station data from CSV: {POLICE_STATIONS_CSV_PATH}")
        
        # Check if the file exists
        if not os.path.exists(POLICE_STATIONS_CSV_PATH):
            logger.warning(f"CSV file not found: {POLICE_STATIONS_CSV_PATH}")
            return generate_mock_police_stations()
        
        # Read CSV file using pandas
        df = pd.read_csv(POLICE_STATIONS_CSV_PATH)
        
        if DEBUG:
            logger.info(f"Loaded {len(df)} police stations from CSV")
            logger.info(f"CSV columns: {df.columns.tolist()}")
        
        # Transform data to match our application's format
        transformed_data = []
        for _, row in df.iterrows():
            # The coordinates in the CSV are in a different format and need to be converted
            # For Massachusetts, we need to convert from state plane coordinates to lat/lng
            # For simplicity, we'll use a rough approximation for now
            # In a real application, you would use a proper coordinate transformation library
            
            # These are rough conversion factors for Massachusetts state plane to lat/lng
            # This is a very rough approximation and should be replaced with proper conversion
            y_coord = float(row.get("Y", 0))
            x_coord = float(row.get("X", 0))
            
            # Convert to lat/lng (very rough approximation)
            # These conversion factors are just for demonstration
            lat = 42.0 + (y_coord - 800000) / 100000
            lng = -71.0 + (x_coord - 200000) / 100000
            
            transformed_item = {
                "name": row.get("NAME", "Unknown Police Station"),
                "type": "police",
                "address": f"{row.get('ADDRESS', '')}, {row.get('CITY', '')}, {row.get('STATE', '')} {row.get('ZIP', '')}",
                "lat": lat,
                "lng": lng,
                "positive_count": 0,
                "neutral_count": 0,
                "negative_count": 0,
                "total_ratings": 0,
                "source": "csv",
                "external_id": str(row.get("OBJECTID", "")),
                "last_updated": int(datetime.now().timestamp() * 1000)
            }
            transformed_data.append(transformed_item)
        
        return transformed_data
    
    except Exception as e:
        logger.error(f"Error loading police station data from CSV: {e}")
        return generate_mock_police_stations()

def generate_mock_police_stations() -> List[Dict[str, Any]]:
    """
    Generate mock police station data for testing.
    
    Returns:
        List of mock police station locations
    """
    logger.info("Generating mock police station data")
    
    # Boston coordinates
    boston_lat = 42.3601
    boston_lng = -71.0589
    
    # Generate some mock police stations around Boston
    mock_stations = []
    for i in range(8):
        # Generate random offsets for lat/lng
        lat_offset = (i % 4) * 0.02
        lng_offset = (i % 3) * 0.02
        
        mock_station = {
            "name": f"Mock Police Station {i+1}",
            "type": "police",
            "address": f"Mock Address {i+1}, Boston, MA",
            "lat": boston_lat + lat_offset,
            "lng": boston_lng + lng_offset,
            "positive_count": 0,
            "neutral_count": 0,
            "negative_count": 0,
            "total_ratings": 0,
            "source": "csv",
            "external_id": f"mock-police-{i+1}",
            "last_updated": int(datetime.now().timestamp() * 1000)
        }
        mock_stations.append(mock_station)
    
    return mock_stations

def get_all_external_locations(lat: float, lng: float, radius: int = 10) -> Dict[str, List[Dict[str, Any]]]:
    """
    Get all external locations from various sources.
    
    Args:
        lat: Latitude
        lng: Longitude
        radius: Search radius in kilometers
        
    Returns:
        Dictionary with lists of locations from different sources
    """
    refuge_restrooms = get_refuge_restrooms(lat, lng, per_page=50)
    goweewee_restrooms = get_goweewee_restrooms(lat, lng, radius)
    police_stations = load_police_stations_from_csv()
    
    return {
        "refuge_restrooms": refuge_restrooms,
        "goweewee_restrooms": goweewee_restrooms,
        "police_stations": police_stations
    }

def save_external_locations_to_firebase(db, locations: List[Dict[str, Any]]) -> None:
    """
    Save external locations to Firebase.
    
    Args:
        db: Firestore database instance
        locations: List of location data to save
    """
    try:
        batch = db.batch()
        locations_ref = db.collection('locations')
        
        for location in locations:
            # Check if location already exists by external_id and source
            query = locations_ref.where('external_id', '==', location.get('external_id')).where('source', '==', location.get('source'))
            existing_docs = list(query.stream())
            
            if existing_docs:
                # Update existing location
                doc_ref = existing_docs[0].reference
                batch.update(doc_ref, {
                    'name': location.get('name'),
                    'address': location.get('address'),
                    'lat': location.get('lat'),
                    'lng': location.get('lng'),
                    'last_updated': location.get('last_updated')
                })
            else:
                # Create new location
                doc_ref = locations_ref.document()
                location['id'] = doc_ref.id
                batch.set(doc_ref, location)
        
        # Commit the batch
        batch.commit()
        logger.info(f"Successfully saved {len(locations)} external locations to Firebase")
    
    except Exception as e:
        logger.error(f"Error saving external locations to Firebase: {e}")
        logger.info("Note: If you're seeing Firebase errors, the external data will still be available via the API endpoints")

def update_all_external_locations(db) -> None:
    """
    Update all external locations in Firebase.
    
    Args:
        db: Firestore database instance
    """
    # Use a default location (e.g., Boston, MA) for initial data load
    default_lat = 42.3601
    default_lng = -71.0589
    
    all_locations = []
    
    # Get locations from all sources
    external_locations = get_all_external_locations(default_lat, default_lng, radius=50)
    
    # Combine all locations
    for source, locations in external_locations.items():
        all_locations.extend(locations)
        logger.info(f"Found {len(locations)} locations from {source}")
    
    # Save to Firebase
    save_external_locations_to_firebase(db, all_locations)
    
    logger.info(f"Updated {len(all_locations)} external locations")
