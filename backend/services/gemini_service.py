import os
import json
import re
from typing import List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# Initialize Gemini if key is provided
_gemini_client_available = False
if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_client_available = True
    except Exception as e:
        print(f"Warning: Failed to configure Google Generative AI: {e}")

# Global cached model instances for low latency
_cached_chat_model = None
_cached_itinerary_model = None

def _clean_json(text: str) -> str:
    """Strip markdown code fences from Gemini JSON output."""
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\s*```$', '', text)
    return text.strip()

def _get_gemini_model():
    global _cached_chat_model
    if _cached_chat_model:
        return _cached_chat_model
    if not _gemini_client_available:
        return None
    import google.generativeai as genai
    # Prioritize gemini-3.5-flash-lite (ultra-fast low latency) then 3.6-flash
    for model_name in ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash']:
        try:
            m = genai.GenerativeModel(model_name)
            _cached_chat_model = m
            return m
        except Exception:
            continue
    return None



def _generate_fallback_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    """Generates a rich, realistic itinerary with dynamic daily cost distributions and budget feasibility checks."""
    days = max(1, min(days, 30))
    avg_daily = budget / days

    # Budget reality checks & style adaptation
    is_tight_budget = (travel_style == "Luxury" and avg_daily < 120) or (avg_daily < 40)
    
    # Define varied activity sets
    if is_tight_budget:
        activities_pool = [
            ("Free walking tour of historic Old Town & local street market", "Scenic public beach relaxation & picnic with local deli treats", "Panoramic sunset from city viewpoint & affordable night bazaar"),
            ("Self-guided architectural walk & public museum free-entry hours", "Lunch at popular neighborhood street vendor & botanical park stroll", "Evening stroll along lighted waterfront promenade & artisan gelato"),
            ("Local bus excursion to nearby scenic nature trail & temple grounds", "Casual cafe lunch & independent craft market browsing", "Open-air community music performance & street food dinner"),
            ("Morning swim/hike at local nature reserve & photo session", "Afternoon cultural center visit & historic alleyways", "Sunset harbor walk & local night food court exploration"),
            ("Bicycle rental along scenic greenway & heritage quarter", "Local farm food stall lunch & souvenir bargaining", "Cozy evening at local acoustic tea/coffee lounge")
        ]
    elif travel_style == "Luxury":
        activities_pool = [
            ("Private VIP historical walking tour & landmark skip-the-line visit", "Fine dining lunch at renowned waterfront bistro", "Sunset yacht harbor cruise & rooftop champagne lounge"),
            ("Chauffeured scenic excursion to iconic cultural quarter", "Exclusive boutique shopping & bespoke afternoon tea", "Private chef tasting menu & opera/theatre performance"),
            ("Helicopter / panoramic scenic flight over coastal highlights", "Luxury spa wellness treatment & infinity pool cabana", "Gourmet Michelin-curated dinner with sommelier wine pairing"),
            ("Private boat charter to secluded coves & snorkeling reefs", "Artisan gourmet lunch & private art collection viewing", "Seaside candlelit dinner with live private jazz quartet"),
            ("Exclusive guided sunrise tour of heritage monuments", "High-end shopping in luxury fashion district & gourmet lunch", "Celebratory rooftop dining with panoramic skyline night views")
        ]
    elif travel_style == "Adventure":
        activities_pool = [
            ("Guided mountain ridge trek & sunrise lookout climb", "Wilderness river kayaking & scenic riverside picnic", "Campfire barbecue under the stars & stargazing session"),
            ("Off-road 4x4 safari expedition to remote waterfall gorges", "Canyoning or rock climbing with certified mountain guides", "Hearty regional tavern dinner & local craft brew tasting"),
            ("Coastal cliff trail exploration & hidden sea cave swim", "Mountain bike descent through alpine forests", "Sunset beach bonfire with fresh grilled seafood"),
            ("Whitewater rafting adventure through scenic river canyon", "Trailside picnic & wildlife observation hike", "Rustic mountain lodge dinner & storytelling by the hearth"),
            ("Scuba diving / reef exploration at protected marine reserve", "Afternoon coastal zipline course & jungle canopy walk", "Lively local harbor pub with traditional music")
        ]
    elif travel_style == "Family":
        activities_pool = [
            ("Interactive science & history discovery museum", "Family-friendly waterfront park & paddleboat rental", "Themed family dinner & evening boardwalk illumination stroll"),
            ("Local zoo or world-class aquarium excursion", "Hands-on cooking class for traditional regional dishes", "Outdoor cinema or evening puppet / illusionist show"),
            ("Botanical gardens miniature train & butterfly pavilion", "Beach picnic and sandcastle / kayak activities", "Artisan gelato tasting & souvenir craft shopping"),
            ("Theme park or adventure ropes course for all ages", "Casual family lunch at open-air cafe & playground visit", "Evening beach stroll and stargazing"),
            ("Hands-on ceramic craft workshop & local landmark tour", "Picnic lunch in scenic public gardens with duck pond", "Family pizza-making night & board games")
        ]
    else:  # Relaxation
        activities_pool = [
            ("Morning mindful stroll through tranquil botanical gardens", "Thermal hot springs & organic aromatherapy spa treatment", "Seaside promenade sunset walk & candlelit seaside dinner"),
            ("Peaceful tea garden ceremony & historic temple courtyard", "Leisurely brunch followed by private cabana relaxation", "Gentle sunset yoga session & organic farm-to-table dinner"),
            ("Scenic coastal cliff walk & ocean view meditation", "Art gallery immersion & calm reading at heritage bookstore cafe", "Acoustic jazz evening with fine herbal infusions"),
            ("Private beach day with sun lounger & refreshing smoothie bar", "Hydrotherapy pool & soothing full-body massage", "Romantic sunset dinner with soothing ocean waves"),
            ("Sunrise meditation by the water & quiet breakfast buffet", "Botanical conservatory walk & peaceful afternoon siesta", "Calm harbor catamaran cruise with light refreshments")
        ]

    # Generate realistic variable daily budgets that sum up to total budget
    weight_multipliers = []
    for d in range(1, days + 1):
        if d == 1:
            weight = 0.7  # Arrival day (settling in)
        elif d == days and days > 1:
            weight = 0.6  # Departure day
        elif d % 3 == 0:
            weight = 1.3  # Big excursion day
        elif d % 2 == 0:
            weight = 1.1  # Active day
        else:
            weight = 0.9  # Standard leisure day
        weight_multipliers.append(weight)

    total_weight = sum(weight_multipliers)
    daily_plans = []
    current_spent = 0.0

    day_titles = [
        "Arrival, Settling In & First Impressions",
        "Iconic Landmarks & Historic Quarter",
        "Scenic Nature, Waterways & Hidden Gems",
        "Culinary Exploration & Local Culture",
        "Adventure Excursion & Panoramic Lookouts",
        "Arts, Architecture & Craft Markets",
        "Coastal Breezes & Waterfront Leisure",
        "Historic Day-Trip & Heritage Discoveries",
        "Thermal Wellness & Afternoon Relaxation",
        "Local Traditions & Neighborhood Immersion",
        "Island Hopping & Scenic Lookouts",
        "Botanical Wonders & Serene Escapes",
        "Shopping, Souvenirs & Hidden Cafes",
        "Celebratory Sunset Experiences",
        "Final Morning Memories & Departure"
    ]

    for day in range(1, days + 1):
        idx = (day - 1) % len(activities_pool)
        morning_act, afternoon_act, evening_act = activities_pool[idx]
        title_idx = (day - 1) % len(day_titles)
        
        # Calculate variable cost
        if day == days:
            day_cost = round(max(5.0, budget - current_spent), 2)
        else:
            day_cost = round((weight_multipliers[day - 1] / total_weight) * budget, 2)
            current_spent += day_cost

        daily_plans.append({
            "day": day,
            "title": f"Day {day}: {day_titles[title_idx]}",
            "morning": f"Start your morning with {morning_act} in {destination}.",
            "afternoon": f"Spend the afternoon with {afternoon_act}.",
            "evening": f"Conclude your evening with {evening_act}.",
            "estimated_cost": day_cost
        })

    travel_tips = [
        f"Download offline transit maps for {destination} and keep small local currency bills on hand.",
        f"Book top landmarks and cultural sites in {destination} 3-5 days in advance to secure tickets.",
        f"Try authentic local regional eateries and ask resident shopkeepers for their favorite hidden dining spots.",
        f"Pack comfortable walking shoes and weather-appropriate layers for varied outdoor climates."
    ]

    if is_tight_budget:
        travel_tips.insert(0, f"💡 Budget Advisory: An average of ${avg_daily:.1f}/day is a strict budget for {destination}. We tailored activities around self-guided exploration, free landmarks, and local street food to maximize your experience without overspending.")

    return json.dumps({
        "destination": destination,
        "total_days": days,
        "daily_plan": daily_plans,
        "total_estimated_cost": budget,
        "travel_tips": travel_tips
    }, indent=2)

def generate_itinerary(destination: str, days: int, budget: float, travel_style: str) -> str:
    model = _get_gemini_model()
    if not model:
        return _generate_fallback_itinerary(destination, days, budget, travel_style)

    prompt = f"""Create a realistic, detailed {days}-day travel itinerary for {destination}.
Total Budget: ${budget} USD. Travel style: {travel_style}.

Requirements:
1. Distribute daily costs realistically so each day has a realistic varied cost (not equal splits) and the sum equals ${budget}.
2. If the budget is low for {days} days (${budget/days:.1f}/day), realistically adapt the activities (e.g. scenic viewpoints, free cultural sites, street food, public transport) instead of unrealistic luxury claims, and add an honest budget advisory tip.
3. Return ONLY valid JSON in this exact structure (no markdown fences, no extra text):
{{
  "destination": "{destination}",
  "total_days": {days},
  "daily_plan": [
    {{
      "day": 1,
      "title": "Day title here",
      "morning": "Morning activity description",
      "afternoon": "Afternoon activity description",
      "evening": "Evening activity description",
      "estimated_cost": 45.0
    }}
  ],
  "total_estimated_cost": {budget},
  "travel_tips": ["Tip 1", "Tip 2", "Tip 3"]
}}
"""

    try:
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.2, "max_output_tokens": 1500}
        )
        text = _clean_json(response.text)
        json.loads(text)  # Validate JSON parse
        return text
    except Exception as e:
        print(f"Gemini API generation error ({e}), falling back to intelligent travel engine.")
        return _generate_fallback_itinerary(destination, days, budget, travel_style)


def _generate_fallback_chat(message: str, trip_context: str = "") -> str:
    """Intelligent, multi-category realistic travel knowledge engine."""
    msg = message.lower().strip()

    # 1. Non-travel off-topic guardrails (polite humble refusal)
    non_travel_keywords = [
        "code", "python", "javascript", "react", "html", "css", "java", "c++", "sql", "database",
        "math", "calculus", "algebra", "homework", "exam", "physics", "chemistry", "biology",
        "crypto", "bitcoin", "stock market", "trading", "politics", "election", "president",
        "write essay", "write poem", "solve this", "debug"
    ]
    
    if any(kw in msg for kw in non_travel_keywords):
        return (
            "🙏 **TravelMate AI Scope Notice**\n\n"
            "Main aapka dedicated **TravelMate AI Assistant** hoon, aur meri specialization sirf **travel planning, destinations, trip budgets, hotels, flights, weather, aur packing advice** tak mehdood hai.\n\n"
            "Main non-travel ya technical topics mein madad nahi kar sakta, lekin agar aap kisi bhi city, country, trip budget, ya vacation ke mutaliq sawal poochen to mujhe aapki rehnumai karne mein behad khushi hogi! 🌍✈️"
        )

    # 2. Dress & Clothing / Weather / Packing queries
    if any(k in msg for k in ["dress", "cloth", "wear", "outfit", "pack", "shoe", "weather", "temperature", "rain", "winter", "summer", "season"]):
        return (
            "👗 **Realistic Travel Dressing & Weather Guide**\n\n"
            "🌍 **Climate & Fabric Selection:**\n"
            "• **Warm / Tropical (e.g. Bali, Thailand, Dubai):** Breathable natural fabrics (linen, lightweight cotton, rayon). Loose-fitting shirts, shorts, sunglasses, and UV protection hat.\n"
            "• **Cold / Alpine (e.g. Switzerland, Northern Europe):** 3-layer system — thermal base layer, insulating fleece/wool mid-layer, and wind/waterproof outer jacket.\n"
            "• **Cultural & Religious Sites (Temples/Mosques/Churches):** Respectful attire covering shoulders and knees. Carry a light scarf or sarong for quick modesty.\n\n"
            "👟 **Footwear Essentials:**\n"
            "• Broken-in cushioned walking sneakers (15,000+ daily steps).\n"
            "• 1 pair of versatile evening casual shoes + breathable sandals/water shoes.\n\n"
            "💡 *Pro-Tip: Check local 5-day weather forecasts 48 hours before flying to make final luggage adjustments!*"
        )

    # 3. Budget, Money, Costs & Expenses queries
    if any(k in msg for k in ["budget", "cost", "money", "expensive", "cheap", "price", "how much", "dollar", "currency", "saving"]):
        return (
            "💰 **Realistic Trip Budgeting & Financial Blueprint**\n\n"
            "📊 **Standard Daily Cost Tiers (Per Person):**\n"
            "• **Backpacker / Budget:** $30 – $60 / day (Hostels, public transit/buses, local street eateries, free attractions).\n"
            "• **Mid-Range / Comfort:** $100 – $220 / day (3-star boutique hotels, sit-down neighborhood bistros, paid museums, rideshares).\n"
            "• **Luxury:** $350 – $700+ / day (5-star resorts, fine dining/Michelin spots, private guided tours, chauffeur transfers).\n\n"
            "💡 **Smart Money-Saving Tactics:**\n"
            "• Use credit cards with zero foreign transaction fees to avoid 3-4% bank markups.\n"
            "• Purchase multi-day transit passes at airport rail terminals for up to 40% transport savings.\n"
            "• Have a 15% emergency contingency fund for spontaneous excursions or currency fluctuations."
        )

    # 4. Flight & Transportation queries
    if any(k in msg for k in ["flight", "ticket", "airline", "airport", "train", "transit", "metro", "bus", "taxi", "uber"]):
        return (
            "✈️ **Flight & Transport Strategy Guide**\n\n"
            "📍 **Booking Timing:** Best airfare windows are 6–8 weeks in advance for domestic flights and 3–5 months for international routes.\n"
            "📅 **Cheapest Travel Days:** Tuesday and Wednesday departures typically offer 15-20% lower fares compared to weekend flights.\n"
            "🚇 **Local Transit:** Download local city transport apps (Citymapper, Google Maps offline) and purchase rechargeable smart cards at central stations.\n"
            "🧳 **Luggage Strategy:** Ensure carry-on weight complies with strict budget airline limits (usually 7kg/15lbs) to avoid steep gate fees."
        )

    # 5. Food, Dining & Local Cuisine queries
    if any(k in msg for k in ["food", "eat", "restaurant", "cafe", "dish", "dining", "cuisine", "taste", "street food"]):
        return (
            "🍽️ **Culinary & Dining Guide**\n\n"
            "📍 **Finding Authentic Eateries:** Walk 2–3 blocks away from main tourist monuments. Look for bustling spots filled with local families.\n"
            "🌟 **Street Food Safety:** Choose vendors with high turnover and visible cooking grills/woks where meals are prepared fresh and hot.\n"
            "💵 **Tipping Etiquette:**\n"
            "• USA/Canada: 15–20% standard.\n"
            "• Europe: Rounding up or 5–10% for great service.\n"
            "• Japan/East Asia: Tipping is not customary and can be considered impolite."
        )

    # 6. Context-Aware response if a trip is active
    if trip_context:
        return (
            f"🌟 **Personalized Travel Advice for Your Trip**\n\n"
            f"Regarding your inquiry:\n"
            f"📍 **Pacing:** Avoid packing more than 2 major landmark visits per half-day to prevent travel burnout.\n"
            f"🎟️ **Reservations:** Book high-demand attractions 4–7 days ahead to skip 2-hour entrance queues.\n"
            f"🌦️ **Weather Prep:** Always carry a compact umbrella and portable 10,000mAh battery pack for map navigation.\n\n"
            f"Feel free to ask for neighborhood recommendations, day trip extensions, or food specialties!"
        )

    # 7. General Friendly Travel Assistant response
    return (
        f"🧭 **TravelMate AI Assistant**\n\n"
        f"Regarding your travel query:\n\n"
        f"📍 **Destination Insight:** Research local transit options and check seasonal weather trends before departing.\n"
        f"🎒 **Preparation:** Ensure passport has at least 6 months validity from departure date.\n"
        f"💵 **Financials:** Inform your bank of international travel and keep emergency cash in local currency.\n\n"
        f"Feel free to specify a city or ask about budgets, itineraries, packing checklists, or flights!"
    )

def chat_with_ai(message: str, history: list, trip_context: str = "") -> str:
    model = _get_gemini_model()
    
    if not model:
        return _generate_fallback_chat(message, trip_context)

    system_prompt = (
        "You are TravelMate AI, an elite, highly knowledgeable, and polite travel consultant.\n\n"
        "STRICT SCOPE & GUARDRAILS:\n"
        "1. You ONLY answer questions related to travel, tourism, vacation planning, destination guides, trip budgets, dressing/clothing for climates, weather, flights, hotels, food/dining, packing, and safety.\n"
        "2. NON-TRAVEL TOPICS: If the user asks about coding, programming, math, physics, homework, general politics, crypto, or non-travel subjects, you MUST politely and humbly decline with a warm response:\n"
        "'I am your dedicated TravelMate AI assistant, specialized purely in travel planning, destination guides, trip budgets, packing, and weather advice. I cannot assist with non-travel questions, but I would be thrilled to help you explore any city, plan a dream vacation, or budget your next trip!'\n\n"
        "REALISM & ACCURACY:\n"
        "- Give realistic and practical advice for budgets (realistic per-day costs), dress codes (cultural modesty vs tropical/cold wear), and seasonal weather.\n"
        "- Use clean formatting with clear headings, bullet points, and travel emojis (📍 ✈️ 🏨 📅 🍽️ 💡 💵 🌟)."
    )
    
    if trip_context:
        system_prompt += f"\n\nACTIVE TRIP CONTEXT:\n{trip_context}"

    chat_history = []
    for msg in history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            chat_history.append({"role": "user", "parts": [content]})
        elif role == "model":
            chat_history.append({"role": "model", "parts": [content]})

    try:
        chat = model.start_chat(history=chat_history)
        full_message = f"{system_prompt}\n\nUser Question: {message}"
        response = chat.send_message(
            full_message,
            generation_config={"temperature": 0.3, "max_output_tokens": 600}
        )
        return response.text
    except Exception as e:
        print(f"Gemini chat error ({e}), utilizing intelligent assistant fallback.")
        return _generate_fallback_chat(message, trip_context)



