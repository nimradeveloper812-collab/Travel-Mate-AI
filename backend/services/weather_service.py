import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5/forecast"

def get_weather_forecast(city: str):
    if not OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not configured. Please add it to your environment variables.")

    querystring = {
        "q": city,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
        "cnt": 40  # 5 days × 8 readings per day
    }
    try:
        response = requests.get(BASE_URL, params=querystring, timeout=15)
        if response.status_code == 404:
            raise ValueError(f"City '{city}' not found. Please check the spelling and try again.")
        if response.status_code == 401:
            raise ValueError("Invalid OpenWeatherMap API key. Please check your configuration.")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise Exception("Weather request timed out. Please try again.")
    except requests.exceptions.HTTPError as e:
        raise Exception(f"Weather API error: {str(e)}")
