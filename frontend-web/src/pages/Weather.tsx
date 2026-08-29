import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CloudSun,
  Search,
  MapPin,
  Droplets,
  Sun,
  CloudRain,
  Cloud,
  Lightbulb
} from 'lucide-react';

import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { StatsShimmer } from '../components/Shimmer';

interface ForecastItem {
  dt: number;
  main: { temp: number; feels_like?: number; humidity?: number };
  weather: { description: string; main?: string }[];
}

const popularCities = ['Tokyo', 'Zurich', 'London', 'Paris', 'Rome', 'Honolulu', 'Bali', 'Reykjavik'];

export default function Weather() {
  const { success, error: toastError } = useToast();
  const [city, setCity] = useState('Zurich');
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastItem[] | null>(null);
  const [cityName, setCityName] = useState('');

  const fetchWeather = async (targetCity: string) => {
    if (!targetCity.trim()) return;
    setLoading(true);
    setForecast(null);

    try {
      const response = await api.post('/weather/search', { city: targetCity });
      const list = response.data?.list;
      if (list && list.length > 0) {
        // Sample 1 reading per 24 hours (every 8 steps)
        const dailyForecast: ForecastItem[] = [];
        for (let i = 0; i < list.length; i += 8) {
          dailyForecast.push(list[i]);
        }
        setForecast(dailyForecast);
        setCityName(`${response.data.city?.name || targetCity}, ${response.data.city?.country || 'International'}`);
        success(`Retrieved 5-day forecast for ${targetCity}`, 'Weather Updated');
      } else {
        setForecast([]);
      }
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to fetch weather forecast.', 'Weather Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather('Zurich');
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(city);
  };

  const getConditionIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain') || desc.includes('drizzle')) return <CloudRain className="w-8 h-8 text-blue-500" />;
    if (desc.includes('cloud')) return <Cloud className="w-8 h-8 text-slate-400" />;
    return <Sun className="w-8 h-8 text-amber-500" />;
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
          <CloudSun className="w-6 h-6 text-sky-500" />
          <span>Global Weather & Packing Forecaster</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspect 5-day metric forecasts for any global destination and receive automated packing recommendations.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <div className="flex-1 relative flex items-center">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Search destination city (e.g. Kyoto, London, Honolulu)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Get Forecast</span>
              </>
            )}
          </button>
        </form>

        {/* City Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Popular:</span>
          {popularCities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCity(c);
                fetchWeather(c);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading && <StatsShimmer />}

      {/* Results View */}
      {forecast && !loading && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
                  5-Day Forecast
                </span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{cityName}</h3>
              </div>
            </div>

            {forecast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {forecast.map((item, idx) => {
                  const dateObj = new Date(item.dt * 1000);
                  const dayName = dateObj.toLocaleDateString([], { weekday: 'short' });
                  const dateString = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const temp = Math.round(item.main.temp);
                  const desc = item.weather[0]?.description || 'Clear';

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all text-center space-y-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-800 block uppercase">{dayName}</span>
                        <span className="text-[10px] font-semibold text-slate-400 block">{dateString}</span>
                      </div>

                      <div className="flex justify-center py-1">
                        {getConditionIcon(desc)}
                      </div>

                      <div>
                        <span className="text-3xl font-black text-slate-800 block">{temp}°C</span>
                        <span className="text-[11px] font-semibold text-slate-500 capitalize block truncate">
                          {desc}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-center space-x-2 text-[10px] font-bold text-slate-400">
                        <Droplets className="w-3 h-3 text-sky-400" />
                        <span>{item.main.humidity || 60}% Humidity</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
                No forecast data available for this location.
              </div>
            )}
          </div>

          {/* Smart Packing Advisor based on current destination forecast */}
          {forecast.length > 0 && (() => {
            const avgTemp = Math.round(forecast.reduce((acc, curr) => acc + curr.main.temp, 0) / forecast.length);
            const hasRain = forecast.some((f) => f.weather[0]?.description?.toLowerCase().includes('rain'));

            return (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50 border border-sky-100 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-sky-800 uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>Automated AI Packing Guidelines for {cityName.split(',')[0]}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 font-medium">
                  <div className="p-3 bg-white/80 rounded-xl border border-sky-100/60 space-y-1">
                    <span className="font-bold text-slate-800 block">Apparel</span>
                    <p className="text-[11px] text-slate-600">
                      {avgTemp < 15
                        ? 'Thermal underlayers, wool sweater, and a wind-resistant coat.'
                        : avgTemp > 25
                        ? 'Lightweight linen/cotton shirts, shorts, and breathable walking footwear.'
                        : 'Comfortable casual layers, a light cardigan, and denim/chinos.'}
                    </p>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-sky-100/60 space-y-1">
                    <span className="font-bold text-slate-800 block">Weather Protection</span>
                    <p className="text-[11px] text-slate-600">
                      {hasRain
                        ? 'Compact travel umbrella and water-resistant footwear recommended.'
                        : 'Polarized sunglasses and SPF 50 broad spectrum sunscreen.'}
                    </p>
                  </div>

                  <div className="p-3 bg-white/80 rounded-xl border border-sky-100/60 space-y-1">
                    <span className="font-bold text-slate-800 block">Tech & Essentials</span>
                    <p className="text-[11px] text-slate-600">
                      Portable power bank, universal adapter, and reusable insulated water flask.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}
