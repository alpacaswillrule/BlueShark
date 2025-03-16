import os
import pandas as pd
import requests
import json
from pprint import pprint

# Constants
REFUGE_RESTROOMS_API_BASE_URL = "https://www.refugerestrooms.org/api/v1/restrooms"
POLICE_STATIONS_CSV_PATH = "../police_stations.csv"  # Path relative to the script

# Test function for Refuge Restrooms API
def test_refuge_restrooms(lat=42.3601, lng=-71.0589, page=1, per_page=5):
    print("\n=== Testing Refuge Restrooms API ===")
    params = {
        "lat": lat,
        "lng": lng,
        "page": page,
        "per_page": per_page
    }
    
    try:
        print(f"Fetching data with params: {params}")
        response = requests.get(f"{REFUGE_RESTROOMS_API_BASE_URL}/by_location.json", params=params)
        response.raise_for_status()
        
        data = response.json()
        print(f"Received {len(data)} restrooms")
        
        # Print first item as sample
        if data:
            print("\nSample restroom data:")
            pprint(data[0])
            
            # Check if coordinates are present and valid
            print("\nChecking coordinates:")
            for i, item in enumerate(data[:3]):  # Check first 3 items
                lat = item.get("latitude")
                lng = item.get("longitude")
                print(f"Item {i+1}: lat={lat}, lng={lng}, type={type(lat)}, {type(lng)}")
        
        return data
    except Exception as e:
        print(f"Error: {e}")
        return None

# Test function for CSV loading
def test_csv_loading():
    print("\n=== Testing Police Stations CSV Loading ===")
    
    try:
        # Check if file exists
        if not os.path.exists(POLICE_STATIONS_CSV_PATH):
            print(f"CSV file not found: {POLICE_STATIONS_CSV_PATH}")
            print(f"Current working directory: {os.getcwd()}")
            return None
        
        # Read CSV file
        df = pd.read_csv(POLICE_STATIONS_CSV_PATH)
        print(f"Successfully loaded CSV with {len(df)} rows")
        print(f"Columns: {df.columns.tolist()}")
        
        # Print first few rows
        print("\nFirst 3 rows:")
        print(df.head(3))
        
        # Test coordinate conversion
        print("\nTesting coordinate conversion:")
        for i, row in df.head(3).iterrows():
            x_coord = float(row.get("X", 0))
            y_coord = float(row.get("Y", 0))
            
            # Boston coordinates as reference point
            boston_x = 236217.47
            boston_y = 901349.05
            boston_lat = 42.3601
            boston_lng = -71.0589
            
            # Calculate offsets and apply scaling factors
            x_offset = x_coord - boston_x
            y_offset = y_coord - boston_y
            
            # These scaling factors are from the original code
            x_scale = 0.000015
            y_scale = 0.000009
            
            # Apply conversion
            lng = boston_lng + (x_offset * x_scale)
            lat = boston_lat + (y_offset * y_scale)
            
            print(f"Row {i+1}: X={x_coord}, Y={y_coord} -> lat={lat}, lng={lng}")
            
            # Try alternative conversion factors to see if they produce more reasonable results
            alt_x_scale = 0.00001
            alt_y_scale = 0.00001
            
            alt_lng = boston_lng + (x_offset * alt_x_scale)
            alt_lat = boston_lat + (y_offset * alt_y_scale)
            
            print(f"  Alternative conversion: lat={alt_lat}, lng={alt_lng}")
        
        return df
    except Exception as e:
        print(f"Error: {e}")
        return None

# Test mock GoWeeWee data
def test_mock_goweewee(lat=42.3601, lng=-71.0589):
    print("\n=== Testing Mock GoWeeWee Data ===")
    
    # Generate some mock restrooms around the given coordinates
    mock_restrooms = []
    for i in range(3):  # Just generate 3 for testing
        # Generate offsets for lat/lng
        lat_offset = (i % 5) * 0.01
        lng_offset = (i % 3) * 0.01
        
        mock_restroom = {
            "name": f"GoWeeWee Restroom {i+1}",
            "type": "restroom",
            "address": f"Mock Address {i+1}, Mock City, MA",
            "lat": lat + lat_offset,
            "lng": lng + lng_offset,
            "source": "goweewee",
            "external_id": f"goweewee-{i+1}"
        }
        mock_restrooms.append(mock_restroom)
    
    print(f"Generated {len(mock_restrooms)} mock restrooms")
    pprint(mock_restrooms)
    return mock_restrooms

# Test the transformed data format that would be sent to the frontend
def test_transformed_data():
    print("\n=== Testing Data Transformation ===")
    
    # Get sample data from each source
    refuge_data = test_refuge_restrooms(per_page=2)
    csv_data = test_csv_loading()
    mock_data = test_mock_goweewee()
    
    # Transform Refuge Restrooms data
    transformed_refuge = []
    if refuge_data:
        print("\nTransforming Refuge Restrooms data:")
        for item in refuge_data[:2]:
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
                "unisex": item.get("unisex", False)
            }
            transformed_refuge.append(transformed_item)
            print(f"Original lat/lng: {item.get('latitude')}/{item.get('longitude')}")
            print(f"Transformed lat/lng: {transformed_item['lat']}/{transformed_item['lng']}")
    
    # Transform Police Stations data
    transformed_police = []
    if csv_data is not None:
        print("\nTransforming Police Stations data:")
        for i, row in csv_data.head(2).iterrows():
            # Get the X and Y coordinates
            x_coord = float(row.get("X", 0))
            y_coord = float(row.get("Y", 0))
            
            # Boston coordinates as reference point
            boston_x = 236217.47
            boston_y = 901349.05
            boston_lat = 42.3601
            boston_lng = -71.0589
            
            # Calculate offsets and apply scaling factors
            x_offset = x_coord - boston_x
            y_offset = y_coord - boston_y
            
            # These scaling factors are from the original code
            x_scale = 0.000015
            y_scale = 0.000009
            
            # Apply conversion
            lng = boston_lng + (x_offset * x_scale)
            lat = boston_lat + (y_offset * y_scale)
            
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
                "external_id": str(row.get("OBJECTID", ""))
            }
            transformed_police.append(transformed_item)
            print(f"Original X/Y: {x_coord}/{y_coord}")
            print(f"Transformed lat/lng: {lat}/{lng}")
    
    return {
        "refuge_restrooms": transformed_refuge,
        "police_stations": transformed_police,
        "goweewee_restrooms": mock_data
    }

# Run all tests
def run_all_tests():
    refuge_data = test_refuge_restrooms()
    csv_data = test_csv_loading()
    mock_data = test_mock_goweewee()
    transformed_data = test_transformed_data()
    
    # Save results to a JSON file for inspection
    results = {
        "refuge_restrooms_raw": refuge_data[:2] if refuge_data else None,
        "police_stations_raw": csv_data.head(2).to_dict('records') if csv_data is not None else None,
        "goweewee_restrooms_raw": mock_data,
        "transformed_data": transformed_data
    }
    
    with open("debug_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    
    print("\n=== All test results saved to debug_results.json ===")

if __name__ == "__main__":
    run_all_tests()
