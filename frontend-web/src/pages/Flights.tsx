import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plane,
  Search
} from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { TableShimmer } from '../components/Shimmer';

interface FlightItem {
  legs: {
    carriers?: any;
    departure: string;
    arrival: string;
    stopCount: number;
  }[];
  price: { formatted: string };
}


const popularRoutes = [
  { from: 'New York', to: 'London' },
  { from: 'San Francisco', to: 'Tokyo' },
  { from: 'Paris', to: 'Rome' },
  { from: 'Dubai', to: 'Bali' },
];

export default function Flights() {
  const { success, error: toastError } = useToast();
  const [origin, setOrigin] = useState('New York');
  const [destination, setDestination] = useState('London');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [flights, setFlights] = useState<FlightItem[] | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [saveTripIds, setSaveTripIds] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    // Default to a date 2 weeks from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);
    setDate(nextDate.toISOString().split('T')[0]);

    const fetchTrips = async () => {
      try {
        const response = await api.get('/trips/my-trips');
        setTrips(response.data || []);
      } catch (err) {
        console.error('Error fetching trips', err);
      }
    };
    fetchTrips();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFlights(null);

    try {
      const response = await api.post('/flights/search', {
        origin,
        destination,
        date
      });

      const itineraries = response.data?.data?.itineraries;
      if (itineraries && itineraries.length > 0) {
        setFlights(itineraries);
        success(`Found ${itineraries.length} flight options for ${origin} → ${destination}`, 'Flights Found');
      } else {
        setFlights([]);
      }
    } catch (err) {
      toastError('Flight search timed out or encountered an issue.', 'Search Notice');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTrip = async (idx: number, flight: FlightItem) => {
    const tripId = saveTripIds[idx];
    if (!tripId) {
      toastError('Please select a saved trip first from the dropdown.', 'Trip Required');
      return;
    }

    setSavingIdx(idx);
    try {
      const leg = flight.legs[0];
      const carrier = (leg as any)?.carriers?.marketing?.[0]?.name || (leg as any)?.carriers?.[0]?.marketing?.[0]?.name || 'SkyWings International';

      
      await api.post(`/trips/${tripId}/flights`, {
        carrier: carrier || 'SkyWings Airline',
        departure: leg.departure,
        arrival: leg.arrival,
        stopCount: leg.stopCount,
        price: flight.price.formatted
      });
      success('Flight added to your trip itinerary successfully!', 'Flight Linked');
    } catch (err) {
      toastError('Failed to add flight to trip.', 'Error');
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
          <Plane className="w-6 h-6 text-sky-500" />
          <span>Flight Finder & Route Tracker</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Find real-time airfares, compare non-stop routes, and link flight bookings directly to your trip itineraries.
        </p>
      </div>

      {/* Search Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Origin City / Airport</label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. New York (JFK)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Destination City</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. London (LHR)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Departure Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 hover:from-sky-500 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Flights</span>
              </>
            )}
          </button>
        </form>

        {/* Popular Route Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Popular Routes:</span>
          {popularRoutes.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOrigin(r.from);
                setDestination(r.to);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              {r.from} → {r.to}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && <TableShimmer />}

      {/* Results View */}
      {flights && !loading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">
              Available Flights: {origin} to {destination}
            </h3>
            <span className="text-xs font-bold text-slate-400">{flights.length} offers</span>
          </div>

          {flights.length > 0 ? (
            <div className="space-y-4">
              {flights.map((fl, idx) => {
                const leg = fl.legs[0];
                const carrier = (leg as any)?.carriers?.marketing?.[0]?.name || (leg as any)?.carriers?.[0]?.marketing?.[0]?.name || 'SkyWings International';
                const depTime = leg?.departure ? new Date(leg.departure).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '08:30 AM';

                const arrTime = leg?.arrival ? new Date(leg.arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '01:45 PM';

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Plane className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-slate-800">{carrier}</h4>
                        <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500">
                          <span>Depart: {depTime}</span>
                          <span>•</span>
                          <span>Arrive: {arrTime}</span>
                          <span>•</span>
                          <span className="text-sky-600 font-bold">
                            {leg?.stopCount === 0 ? 'Non-Stop' : `${leg?.stopCount} Stop(s)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right pr-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Airfare</span>
                        <span className="text-lg font-black text-emerald-600">{fl.price.formatted}</span>
                      </div>

                      {/* Attach to trip controls */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={saveTripIds[idx] || ''}
                          onChange={(e) => setSaveTripIds({ ...saveTripIds, [idx]: e.target.value })}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 max-w-[170px] truncate"
                        >
                          <option value="">Select Trip to Link...</option>
                          {trips.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.destination} ({t.start_date})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleSaveToTrip(idx, fl)}
                          disabled={savingIdx === idx}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
                        >
                          {savingIdx === idx ? 'Adding...' : 'Link to Trip'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
              No flights found for this specific date and route. Try adjusting your departure date or nearby airport.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
