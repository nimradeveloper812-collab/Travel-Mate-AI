import os
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com"
BASE_URL = f"https://{RAPIDAPI_HOST}/api/v1"

def get_headers():
    return {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }

def get_airport_entity_id(city: str):
    url = f"{BASE_URL}/flights/searchAirport"
    querystring = {"query": city}
    response = requests.get(url, headers=get_headers(), params=querystring)
    response.raise_for_status()
    data = response.json()
    if data and "data" in data and len(data["data"]) > 0:
        return data["data"][0]["skyId"], data["data"][0]["entityId"]
    return None, None

def search_flights(origin: str, destination: str, date: str, return_date: str = None, adults: int = 1):
    origin_sky_id, origin_entity_id = get_airport_entity_id(origin)
    dest_sky_id, dest_entity_id = get_airport_entity_id(destination)
    
    if not origin_entity_id or not dest_entity_id:
        raise ValueError("Could not find airport for given cities")
        
    url = f"{BASE_URL}/flights/searchFlights"
    querystring = {
        "originSkyId": origin_sky_id,
        "destinationSkyId": dest_sky_id,
        "originEntityId": origin_entity_id,
        "destinationEntityId": dest_entity_id,
        "date": date,
        "adults": adults
    }
    if return_date:
        querystring["returnDate"] = return_date
        
    response = requests.get(url, headers=get_headers(), params=querystring)
    if response.status_code == 429:
        raise Exception("Search limit reached for today, try tomorrow")
    response.raise_for_status()
    return response.json()

def get_hotel_entity_id(city: str):
    url = f"{BASE_URL}/hotels/searchDestination"
    querystring = {"query": city}
    response = requests.get(url, headers=get_headers(), params=querystring)
    response.raise_for_status()
    data = response.json()
    if data and "data" in data and len(data["data"]) > 0:
        return data["data"][0]["entityId"]
    return None

def search_hotels(city: str, checkin: str, checkout: str, adults: int = 1):
    entity_id = get_hotel_entity_id(city)
    if not entity_id:
        raise ValueError("Could not find destination for hotels")
        
    url = f"{BASE_URL}/hotels/searchHotels"
    querystring = {
        "entityId": entity_id,
        "checkin": checkin,
        "checkout": checkout,
        "adults": adults
    }
    response = requests.get(url, headers=get_headers(), params=querystring)
    if response.status_code == 429:
        raise Exception("Search limit reached for today, try tomorrow")
    response.raise_for_status()
    return response.json()
