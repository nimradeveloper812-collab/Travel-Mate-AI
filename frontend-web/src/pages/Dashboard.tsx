import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  Calendar,
  Wallet,
  MapPin,
  ArrowRight,
  CloudSun,
  Sparkles,
  BookmarkCheck,
  Hotel,
  PlusCircle
} from 'lucide-react';


import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatsShimmer, CardShimmer } from '../components/Shimmer';

interface Trip {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  travel_style: string;
  itinerary_json: string;
  flights_json?: string;
  hotels_json?: string;
}

interface Stats {
  total_trips: number;
  total_budget: number;
  favorite_destination: string | null;
  recent_trip: Trip | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherAlert, setWeatherAlert] = useState<{
    tripDestination: string;
    startDate: string;
    temp: number;
    description: string;
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tripsRes] = await Promise.all([
          api.get('/trips/stats'),
          api.get('/trips/my-trips')
        ]);
        setStats(statsRes.data);
        const allTrips: Trip[] = tripsRes.data || [];
        setRecentTrips(allTrips.slice(0, 3));

        // Check if any trip is starting soon (within 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const soonTrip = allTrips.find((t) => {
          const startDate = new Date(t.start_date);
          startDate.setHours(0, 0, 0, 0);
          const diffTime = startDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        });

        if (soonTrip) {
          try {
            const weatherRes = await api.post('/weather/search', { city: soonTrip.destination });
            const list = weatherRes.data?.list;
            if (list && list.length > 0) {
              const entry = list[0];
              const temp = Math.round(entry.main.temp);
              const desc = entry.weather[0].description.toLowerCase();

              let recommendation = '';
              if (desc.includes('rain') || desc.includes('storm')) {
                recommendation = `Rain expected in ${soonTrip.destination}. Pack an umbrella, waterproof jacket, and non-slip footwear.`;
              } else if (temp < 15) {
                recommendation = `Crisp weather (around ${temp}°C). Pack warm thermal layers, a sweater, and a scarf.`;
              } else if (temp > 28) {
                recommendation = `Warm & sunny (${temp}°C). Pack lightweight breathable clothing, sunscreen SPF 50+, and sunglasses.`;
              } else {
                recommendation = `Pleasant conditions (${temp}°C) anticipated. Standard casual layers and walking shoes recommended.`;
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
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.name || 'Explorer';

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
      
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white p-6 sm:p-10 shadow-xl shadow-blue-500/15"
      >
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-sky-100 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Travel Concierge Active</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            {getGreeting()}, {displayName}!
          </h2>
          <p className="text-sm sm:text-base text-sky-100/90 font-medium leading-relaxed">
            Ready to design your next journey? Create instant day-by-day itineraries, discover vetted hotel stays, and stay prepared with smart weather forecasts.
          </p>


          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to="/plan-trip"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 font-extrabold text-xs shadow-md hover:bg-sky-50 hover:scale-102 active:scale-98 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Plan New Itinerary</span>
            </Link>
            <Link
              to="/chat"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/20 backdrop-blur-md text-white font-bold text-xs hover:bg-white/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ask AI Copilot</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Live Upcoming Trip Weather & Packing Advisory Alert */}
      {weatherAlert && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50/40 border border-sky-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
              <CloudSun className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                  Upcoming Trip Alert
                </span>
                <span className="text-xs text-slate-500 font-semibold">Starts {weatherAlert.startDate}</span>
              </div>
              <h4 className="text-base font-bold text-slate-800">
                Weather Forecast for <strong className="text-blue-600">{weatherAlert.tripDestination}</strong>: {weatherAlert.temp}°C ({weatherAlert.description})
              </h4>
              <p className="text-xs font-semibold text-slate-600 bg-white/80 p-2.5 rounded-xl border border-sky-100/60">
                💡 <span className="font-bold text-sky-900">Packing Recommendation:</span> {weatherAlert.recommendation}
              </p>
            </div>
          </div>

          <Link
            to="/saved-trips"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shrink-0 transition-colors shadow-sm"
          >
            View Itinerary
          </Link>
        </motion.div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        
        <div className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Saved Trips</span>
            <span className="text-2xl font-black text-slate-800">{stats?.total_trips || 0}</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Allocated Budget</span>
            <span className="text-2xl font-black text-emerald-600">${stats?.total_budget?.toLocaleString() || 0} USD</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs flex items-center space-x-4 hover:border-slate-300 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Top Destination</span>
            <span className="text-2xl font-black text-slate-800 truncate block">
              {stats?.favorite_destination || 'None yet'}
            </span>
          </div>
        </div>

      </div>

      {/* Quick Access Tools */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Quick Travel Utilities</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { to: '/plan-trip', label: 'Plan Itinerary', icon: Compass, color: 'text-sky-500 bg-sky-50' },
            { to: '/saved-trips', label: 'Saved Trips', icon: BookmarkCheck, color: 'text-blue-500 bg-blue-50' },
            { to: '/hotels', label: 'Find Hotels', icon: Hotel, color: 'text-indigo-500 bg-indigo-50' },
            { to: '/weather', label: 'Weather Forecast', icon: CloudSun, color: 'text-amber-500 bg-amber-50' },
          ].map((item, idx) => {

            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.to}
                className="p-5 rounded-2xl bg-white border border-slate-200/70 hover:border-blue-200 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2.5 group"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Trips Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Recent Itineraries</h3>
          <Link
            to="/saved-trips"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View all trips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => navigate('/saved-trips')}
                className="p-6 rounded-3xl bg-white border border-slate-200/70 hover:border-slate-300 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-0.5 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-600 uppercase tracking-wider">
                      {trip.travel_style}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">${trip.budget}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {trip.destination}
                  </h4>
                  <p className="text-xs font-medium text-slate-400">
                    {trip.start_date} to {trip.end_date}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No saved itineraries yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Generate a personalized day-by-day travel plan using our AI planner.
            </p>
            <Link
              to="/plan-trip"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create Your First Trip</span>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
