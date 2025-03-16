from flask import Flask, request, jsonify, make_response
import firebase_admin
from firebase_admin import credentials, firestore
import os
import schedule
import threading
import time
import logging
from datetime import datetime
import math

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import Firebase configuration
from firebase_config import cred
from external_apis import (
    get_refuge_restrooms,
    get_goweewee_restrooms,
    load_police_stations_from_csv,
    get_all_external_locations,
    save_external_locations_to_firebase,
    update_all_external_locations
)

# Initialize Flask app
app = Flask(__name__)

# CORS helper functions
def _build_cors_preflight_response():
    response = make_response()
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add('Access-Control-Allow-Headers', "*")
    response.headers.add('Access-Control-Allow-Methods', "*")
    return response

def _corsify_actual_response(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    return response

# Initialize Firestore DB
db = firestore.client()

# Schedule periodic updates of external data
def run_scheduler():
    """Run the scheduler in a separate thread."""
    while True:
        schedule.run_pending()
        time.sleep(1)

# Schedule the update_all_external_locations function to run daily
schedule.every(24).hours.do(lambda: update_all_external_locations(db, max_restrooms=1000))

# Start the scheduler in a separate thread
scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

# Run an initial update of external locations
try:
    # Fetch more restrooms (up to 1000) to ensure we have good coverage
    update_all_external_locations(db, max_restrooms=1000)
    logger.info("Initial external locations update completed")
except Exception as e:
    logger.error(f"Error during initial external locations update: {e}")
    logger.info("External data will still be available via the API endpoints")

# Calculate distance between two points using Haversine formula
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of the earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (
        math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
        math.sin(dLon / 2) * math.sin(dLon / 2)
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c  # Distance in km
    return distance

# API Routes
@app.route('/api/locations', methods=['GET', 'OPTIONS'])
def get_locations():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    try:
        # Get filter parameters
        location_type = request.args.get('type')
        rating_min = float(request.args.get('rating_min', 0))
        radius = float(request.args.get('radius', 0))
        user_lat = request.args.get('lat')
        user_lng = request.args.get('lng')
        include_external = request.args.get('include_external', 'true').lower() == 'true'
        
        # Initialize locations list
        locations = []
        
        try:
            # Query Firestore for user-submitted locations
            locations_ref = db.collection('locations')
            query = locations_ref
            
            # Apply type filter if provided
            if location_type and location_type != 'all':
                query = query.where('type', '==', location_type)
                
            # Execute query
            for doc in query.stream():
                location = doc.to_dict()
                location['id'] = doc.id
                
                # Skip external locations if not requested
                if not include_external and location.get('source'):
                    continue
                
                # Calculate normalized rating (0-5 scale)
                if location.get('total_ratings', 0) > 0:
                    positive_weight = location.get('positive_count', 0)
                    negative_weight = -1 * location.get('negative_count', 0)
                    total_weight = positive_weight + negative_weight
                    normalized_rating = (total_weight / location['total_ratings'] + 1) / 2 * 5
                    
                    # Filter by minimum rating
                    if normalized_rating < rating_min:
                        continue
                elif rating_min > 0 and not location.get('source'):
                    # Skip user-submitted locations with no ratings if minimum rating is set
                    # But keep external locations even if they have no ratings
                    continue
                    
                # Filter by distance if user location is provided
                if user_lat and user_lng and radius > 0:
                    try:
                        user_lat_float = float(user_lat)
                        user_lng_float = float(user_lng)
                        distance = calculate_distance(
                            user_lat_float, user_lng_float, 
                            location.get('lat', 0), location.get('lng', 0)
                        )
                        if distance > radius:
                            continue
                    except (ValueError, TypeError):
                        pass  # Skip distance calculation if coordinates are invalid
                        
                locations.append(location)
        except Exception as e:
            logger.error(f"Error querying Firestore: {e}")
            # Continue with external data even if Firestore fails
        
        # If external data is requested and we have user coordinates, fetch it directly
        if include_external and user_lat and user_lng:
            try:
                user_lat_float = float(user_lat)
                user_lng_float = float(user_lng)
                radius_val = float(radius) if radius > 0 else 10
                
                logger.info(f"Fetching external locations with lat={user_lat_float}, lng={user_lng_float}, radius={radius_val}")
                
                # Get external locations
                external_data = get_all_external_locations(user_lat_float, user_lng_float, int(radius_val))
                
                # Log the number of locations from each source
                for source, source_locations in external_data.items():
                    logger.info(f"Found {len(source_locations)} locations from {source}")
                    # Log a sample of locations from each source
                    if len(source_locations) > 0:
                        sample = source_locations[0]
                        logger.info(f"Sample {source} location: name={sample.get('name')}, lat={sample.get('lat')}, lng={sample.get('lng')}")
                
                # Add external locations to the results
                external_count = 0
                filtered_out = 0
                
                for source, source_locations in external_data.items():
                    for location in source_locations:
                        # Apply type filter if provided
                        if location_type and location_type != 'all' and location.get('type') != location_type:
                            filtered_out += 1
                            continue
                            
                        # Filter by distance if radius is provided
                        if radius > 0:
                            distance = calculate_distance(
                                user_lat_float, user_lng_float,
                                location.get('lat', 0), location.get('lng', 0)
                            )
                            if distance > radius_val:
                                filtered_out += 1
                                continue
                                
                        # Add a unique ID if not present
                        if 'id' not in location:
                            location['id'] = f"{source}-{location.get('external_id', '')}"
                            
                        locations.append(location)
                        external_count += 1
                
                logger.info(f"Added {external_count} external locations to response, filtered out {filtered_out}")
            except Exception as e:
                logger.error(f"Error fetching external locations: {e}")
                logger.exception(e)  # Log the full stack trace
            
        logger.info(f"Returning {len(locations)} total locations")
        response = jsonify(locations)
        return _corsify_actual_response(response)
    except Exception as e:
        logger.error(f"Error in get_locations: {e}")
        response = jsonify({'error': str(e)})
        return _corsify_actual_response(response), 500

@app.route('/api/ratings/<location_id>', methods=['GET', 'OPTIONS'])
def get_ratings(location_id):
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    try:
        ratings_ref = db.collection('ratings')
        query = ratings_ref.where('location_id', '==', location_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(10)
        
        ratings = []
        for doc in query.stream():
            rating = doc.to_dict()
            rating['id'] = doc.id
            ratings.append(rating)
            
        response = jsonify(ratings)
        return _corsify_actual_response(response)
    except Exception as e:
        response = jsonify({'error': str(e)})
        return _corsify_actual_response(response), 500

@app.route('/api/external-locations', methods=['GET', 'OPTIONS'])
def get_external_locations():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    try:
        # Get parameters
        lat = request.args.get('lat')
        lng = request.args.get('lng')
        radius = float(request.args.get('radius', 10))
        
        if not lat or not lng:
            response = jsonify({'error': 'Latitude and longitude are required'})
            return _corsify_actual_response(response), 400
            
        lat = float(lat)
        lng = float(lng)
        
        # Get external locations
        external_locations = get_all_external_locations(lat, lng, radius)
        
        # Log the number of locations from each source
        for source, locations in external_locations.items():
            logger.info(f"Found {len(locations)} locations from {source}")
        
        # Flatten the results
        all_locations = []
        for source, locations in external_locations.items():
            all_locations.extend(locations)
            
        # Save to Firebase in the background
        threading.Thread(target=save_external_locations_to_firebase, args=(db, all_locations), daemon=True).start()
        
        response = jsonify(all_locations)
        return _corsify_actual_response(response)
    except Exception as e:
        logger.error(f"Error in get_external_locations: {e}")
        response = jsonify({'error': str(e)})
        return _corsify_actual_response(response), 500

@app.route('/api/debug/external-locations', methods=['GET', 'OPTIONS'])
def debug_external_locations():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    """Debug endpoint to get external locations without saving to Firebase."""
    try:
        # Get parameters
        lat = request.args.get('lat', '42.3601')  # Default to Boston
        lng = request.args.get('lng', '-71.0589')
        source = request.args.get('source')  # Optional source filter
        
        lat = float(lat)
        lng = float(lng)
        
        # Get external locations
        if source == 'refuge':
            locations = get_refuge_restrooms(lat, lng, per_page=50)
            response = jsonify({
                'source': 'refuge_restrooms',
                'count': len(locations),
                'locations': locations
            })
            return _corsify_actual_response(response)
        elif source == 'goweewee':
            locations = get_goweewee_restrooms(lat, lng)
            response = jsonify({
                'source': 'goweewee',
                'count': len(locations),
                'locations': locations
            })
            return _corsify_actual_response(response)
        elif source == 'police':
            locations = load_police_stations_from_csv()
            response = jsonify({
                'source': 'police_stations',
                'count': len(locations),
                'locations': locations
            })
            return _corsify_actual_response(response)
        else:
            # Get all sources
            external_locations = get_all_external_locations(lat, lng)
            result = {}
            
            for source, locations in external_locations.items():
                result[source] = {
                    'count': len(locations),
                    'sample': locations[:5] if locations else []
                }
                
            response = jsonify(result)
            return _corsify_actual_response(response)
    except Exception as e:
        logger.error(f"Error in debug_external_locations: {e}")
        response = jsonify({'error': str(e)})
        return _corsify_actual_response(response), 500

@app.route('/api/refresh-external-data', methods=['POST', 'OPTIONS'])
def refresh_external_data():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    try:
        # Run the update in a background thread
        threading.Thread(target=update_all_external_locations, args=(db,), daemon=True).start()
        response = jsonify({'success': True, 'message': 'External data refresh started'})
        return _corsify_actual_response(response), 202
    except Exception as e:
        response = jsonify({'error': str(e)})
        return _corsify_actual_response(response), 500

@app.route('/api/ratings', methods=['POST', 'OPTIONS'])
def submit_rating():
    if request.method == "OPTIONS":
        return _build_cors_preflight_response()
    try:
        data = request.json
        rating_data = data.get('rating', {})
        is_new_location = data.get('isNewLocation', False)
        location_data = data.get('locationData', {})
        
        # Add timestamp to rating
        rating_data['timestamp'] = int(datetime.now().timestamp() * 1000)
        
        # Add rating to Firestore
        rating_ref = db.collection('ratings').document()
        rating_ref.set(rating_data)
        
        # Update or create location
        if is_new_location and location_data:
            # Create new location
            location_ref = db.collection('locations').document()
            
            # Initialize rating counts
            sentiment = rating_data.get('sentiment')
            location_data['positive_count'] = 1 if sentiment == 'positive' else 0
            location_data['neutral_count'] = 1 if sentiment == 'neutral' else 0
            location_data['negative_count'] = 1 if sentiment == 'negative' else 0
            location_data['total_ratings'] = 1
            
            location_ref.set(location_data)
            
            # Update the rating with the new location ID
            rating_ref.update({'location_id': location_ref.id})
            
            response = jsonify({'success': True, 'location_id': location_ref.id})
            return _corsify_actual_response(response), 201
        else:
            # Update existing location
            location_ref = db.collection('locations').document(rating_data.get('location_id'))
            location = location_ref.get()
            
            if location.exists:
                # Update rating counts
                sentiment = rating_data.get('sentiment')
                updates = {
                    'total_ratings': firestore.Increment(1)
                }
                
                if sentiment == 'positive':
                    updates['positive_count'] = firestore.Increment(1)
                elif sentiment == 'neutral':
                    updates['neutral_count'] = firestore.Increment(1)
                elif sentiment == 'negative':
                    updates['negative_count'] = firestore.Increment(1)
                    
                location_ref.update(updates)
                
                response = jsonify({'success': True})
                return _corsify_actual_response(response), 201
            else:
                response = jsonify({'error': 'Location not found'})
                return _corsify_actual_response(response), 404
    except Exception as e:
        response = jsonify({'error': str(e)})
        return _corsify_actual_response(response), 500

if __name__ == '__main__':
    app.run(debug=True)
