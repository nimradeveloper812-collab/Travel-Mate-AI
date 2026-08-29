import os
import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "").strip()
RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com"
BASE_URL = f"https://{RAPIDAPI_HOST}/api/v1"

def get_headers():
    return {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST
    }

def _get_fallback_flights(origin: str, destination: str, date: str):
    return {
        "data": {
            "itineraries": [
                {
                    "id": "fl-1",
                    "legs": [{
                        "carriers": {"marketing": [{"name": "SkyWings International"}]},
                        "departure": f"{date}T08:30:00",
                        "arrival": f"{date}T12:45:00",
                        "stopCount": 0
                    }],
                    "price": {"formatted": "$380"}
                },
                {
                    "id": "fl-2",
                    "legs": [{
                        "carriers": {"marketing": [{"name": "Global Express Air"}]},
                        "departure": f"{date}T11:15:00",
                        "arrival": f"{date}T15:30:00",
                        "stopCount": 0
                    }],
                    "price": {"formatted": "$420"}
                },
                {
                    "id": "fl-3",
                    "legs": [{
                        "carriers": {"marketing": [{"name": "AeroVoyage"}]},
                        "departure": f"{date}T17:00:00",
                        "arrival": f"{date}T22:15:00",
                        "stopCount": 1
                    }],
                    "price": {"formatted": "$295"}
                }
            ]
        }
    }

def _get_fallback_hotels(city: str):
    return {
        "data": [
            {"name": f"The Grand {city.title()} Hotel & Suites", "stars": 5, "price": 240},
            {"name": f"{city.title()} Boutique Central Inn", "stars": 4, "price": 160},
            {"name": f"Harbor View Riverside Lodge {city.title()}", "stars": 4, "price": 195},
            {"name": f"Urban Traveler Cozy Hotel", "stars": 3, "price": 95}
        ]
    }

def get_airport_entity_id(city: str):
    if not RAPIDAPI_KEY:
        return None, None
    url = f"{BASE_URL}/flights/searchAirport"
    querystring = {"query": city}
    try:
        response = requests.get(url, headers=get_headers(), params=querystring, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data and "data" in data and len(data["data"]) > 0:
            return data["data"][0]["skyId"], data["data"][0]["entityId"]
        return None, None
    except Exception:
        return None, None

def search_flights(origin: str, destination: str, date: str, return_date: str = None, adults: int = 1):
    if not RAPIDAPI_KEY:
        return _get_fallback_flights(origin, destination, date)

    try:
        origin_sky_id, origin_entity_id = get_airport_entity_id(origin)
        dest_sky_id, dest_entity_id = get_airport_entity_id(destination)

        if not origin_entity_id or not dest_entity_id:
            return _get_fallback_flights(origin, destination, date)

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

        response = requests.get(url, headers=get_headers(), params=querystring, timeout=12)
        if response.status_code == 200:
            return response.json()
        return _get_fallback_flights(origin, destination, date)
    except Exception:
        return _get_fallback_flights(origin, destination, date)

def get_hotel_entity_id(city: str):
    if not RAPIDAPI_KEY:
        return None
    url = f"{BASE_URL}/hotels/searchDestination"
    querystring = {"query": city}
    try:
        response = requests.get(url, headers=get_headers(), params=querystring, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data and "data" in data and len(data["data"]) > 0:
            return data["data"][0]["entityId"]
        return None
    except Exception:
        return None

def search_hotels(city: str, checkin: str, checkout: str, adults: int = 1):
    if not RAPIDAPI_KEY:
        return _get_fallback_hotels(city)

    try:
        entity_id = get_hotel_entity_id(city)
        if not entity_id:
            return _get_fallback_hotels(city)

        url = f"{BASE_URL}/hotels/searchHotels"
        querystring = {
            "entityId": entity_id,
            "checkin": checkin,
            "checkout": checkout,
            "adults": adults
        }
        response = requests.get(url, headers=get_headers(), params=querystring, timeout=12)
        if response.status_code == 200:
            return response.json()
        return _get_fallback_hotels(city)
    except Exception:
        return _get_fallback_hotels(city)

