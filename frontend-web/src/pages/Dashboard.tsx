import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Wallet, MapPin, ArrowRight, CloudSun } from 'lucide-react';
import api from '../lib/api';
import { StatsShimmer, CardShimmer } from '../components/Shimmer';

interface Trip {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travel_style: string;
}

interface Stats {
  total_trips: number;
  total_budget: number;
  favorite_destination: string | null;
  recent_trip: Trip | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherAlert, setWeatherAlert] = useState<{
    tripDestination: string;
    startDate: string;
    temp: number;
    description: string;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/trips/stats');
        setStats(response.data);

        // Fetch user's saved trips to see if any trip starts in next 5 days
        const tripsResponse = await api.get('/trips/my-trips');
        const trips = tripsResponse.data || [];
        
        const today = new Date();
        today.setHours(0,0,0,0);

        const soonTrip = trips.find((t: any) => {
          const startDate = new Date(t.start_date);
          startDate.setHours(0,0,0,0);
          const diffTime = startDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 5;
        });

        if (soonTrip) {
          try {
            const weatherRes = await api.post('/weather/search', { city: soonTrip.destination });
            const list = weatherRes.data?.list;
            if (list && list.length > 0) {
              const entry = list[0];
              const temp = Math.round(entry.main.temp);
              const description = entry.weather[0].description.toLowerCase();
              
              let recommendation = '';
              if (description.includes('rain') || description.includes('drizzle') || description.includes('shower') || description.includes('storm')) {
                recommendation = `Rain is expected in ${soonTrip.destination}! Don't forget to pack an umbrella or a raincoat ☔.`;
              } else if (temp < 15) {
                recommendation = `It will be chilly in ${soonTrip.destination} (around ${temp}°C). Make sure to pack warm layers and a jacket 🧥.`;
              } else if (temp > 30) {
                recommendation = `It will be hot in ${soonTrip.destination} (around ${temp}°C). Don't forget sunscreen, sunglasses, and to stay hydrated ☀️.`;
              } else {
                recommendation = `Lovely weather (around ${temp}°C) expected in ${soonTrip.destination}. Enjoy your trip! ✈️`;
              }

              setWeatherAlert({
                tripDestination: soonTrip.destination,
                startDate: soonTrip.start_date,
                temp,
                description: entry.weather[0].description,
                recommendation
              });
            }
          } catch (weatherErr) {
            console.error('Error fetching dashboard weather alert', weatherErr);
          }
        }
      } catch (err) {
        console.error('Error fetching stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <StatsShimmer />
        <CardShimmer />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Welcome Hero Widget */}
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-5 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row md:items-center md:justify-between relative overflow-hidden"
      >
        {/* Subtle Background Globe Vector */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 border-4 border-white/5 rounded-full pointer-events-none" />
        <div className="space-y-2 z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Adventure Awaits!</h2>
          <p className="text-sky-50 font-medium max-w-lg">
            Plan custom itineraries with Gemini AI, lookup flight details, hotel capacities, and real-time weather details on the fly.
          </p>
        </div>
      </motion.div>

      {/* Live Weather Alert Widget */}
      {weatherAlert && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-5 rounded-2xl bg-sky-50/50 border border-sky-100 flex items-start space-x-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-sky-100/80 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
            <CloudSun className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center space-x-2">
              <span>🌤️ Upcoming Trip Weather Alert</span>
              <span className="h-1.5 w-1.5 bg-sky-500 rounded-full animate-ping" />
            </h4>
            <p className="text-sm text-slate-700 font-medium">
              Your trip to <strong className="text-blue-600 font-bold">{weatherAlert.tripDestination}</strong> starts in a few days ({weatherAlert.startDate})!
            </p>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Forecast: {weatherAlert.temp}°C, {weatherAlert.description}
            </p>
            <p className="text-sm text-sky-900 font-bold bg-sky-100/40 p-3 rounded-xl border border-sky-100/60 mt-2">
              💡 Packing Tip: {weatherAlert.recommendation}
            </p>
          </div>
        </motion.div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        
        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Saved Trips</span>
            <span className="text-2xl font-bold text-slate-800">{stats?.total_trips || 0}</span>
          </div>
        </div>

        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Allocated Budget</span>
            <span className="text-2xl font-bold text-slate-800">${stats?.total_budget || 0} USD</span>
          </div>
        </div>

        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Favorite Destination</span>
            <span className="text-2xl font-bold text-slate-800 truncate max-w-[200px] block">
              {stats?.favorite_destination || '—'}
            </span>
          </div>
        </div>

      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="border border-slate-200/60 bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800">Recently Saved Trip</h3>
          
          {stats?.recent_trip ? (
            <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-slate-800">{stats.recent_trip.destination}</h4>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  {stats.recent_trip.start_date} to {stats.recent_trip.end_date}
                </p>
                <div className="flex space-x-4 text-sm text-slate-500 pt-2">
                  <span><strong>Budget:</strong> ${stats.recent_trip.budget}</span>
                  <span><strong>Travel Style:</strong> {stats.recent_trip.travel_style}</span>
                </div>
              </div>
              <a 
                href="/saved-trips"
                className="flex items-center space-x-2 text-sm font-bold text-blue-600 hover:text-blue-700 interactive"
              >
                <span>View Full Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
              No trips saved yet. Go to "Plan Trip" to request an itinerary.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
