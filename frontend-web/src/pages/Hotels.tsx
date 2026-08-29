import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Hotel as HotelIcon,
  Search,
  MapPin,
  Check,
  BookmarkCheck,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { TableShimmer } from '../components/Shimmer';

interface HotelItem {
  name: string;
  stars: number;
  price?: number;
}

interface SavedTrip {
  id: number;
  destination: string;
  start_date: string;
  end_date: string;
  travel_style: string;
}

const popularHotelDestinations = ['Paris', 'Tokyo', 'Rome', 'Miami', 'Dubai', 'London', 'Kyoto', 'Bali'];

export default function Hotels() {
  const { success, error: toastError } = useToast();

  const [city, setCity] = useState('Paris');
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState<HotelItem[] | null>(null);
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [saveTripIds, setSaveTripIds] = useState<{ [key: number]: string }>({});
  const [linkedHotels, setLinkedHotels] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const today = new Date();
    const cin = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const cout = new Date(today.getTime() + 19 * 24 * 60 * 60 * 1000);
    setCheckin(cin.toISOString().split('T')[0]);
    setCheckout(cout.toISOString().split('T')[0]);

    const fetchTrips = async () => {
      try {
        const response = await api.get('/trips/my-trips');
        const list = response.data || [];
        setTrips(list);
      } catch (err) {
        console.error('Error fetching trips', err);
      }
    };
    fetchTrips();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setHotels(null);

    try {
      const response = await api.post('/hotels/search', {
        city,
        checkin,
        checkout
      });

      const list = response.data?.data;
      if (list && list.length > 0) {
        setHotels(list);
        // Pre-select first trip for all cards if trips exist
        if (trips.length > 0) {
          const defaultSelections: { [key: number]: string } = {};
          list.forEach((_: any, idx: number) => {
            defaultSelections[idx] = String(trips[0].id);
          });
          setSaveTripIds(defaultSelections);
        }
        success(`Found ${list.length} hotel properties in ${city}`, 'Hotels Found');
      } else {
        setHotels([]);
      }
    } catch (err) {
      toastError('Hotel search timed out or encountered an issue.', 'Search Notice');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToTrip = async (idx: number, hotel: HotelItem) => {
    if (trips.length === 0) {
      toastError('You have no saved trips yet. Go to Plan Trip and save a trip first.', 'No Saved Trips');
      return;
    }

    const tripId = saveTripIds[idx] || String(trips[0].id);
    if (!tripId) {
      toastError('Please select a saved trip from the dropdown.', 'Trip Required');
      return;
    }

    setSavingIdx(idx);
    try {
      await api.post(`/trips/${tripId}/hotels`, {
        name: hotel.name,
        stars: hotel.stars || 4,
        price: hotel.price || 160
      });
      setLinkedHotels((prev) => ({ ...prev, [idx]: true }));
      const targetTrip = trips.find((t) => String(t.id) === String(tripId));
      success(
        `Added "${hotel.name}" to your ${targetTrip ? targetTrip.destination : 'saved'} trip!`,
        'Hotel Linked Successfully'
      );
    } catch (err: any) {
      toastError(err.response?.data?.detail || 'Failed to add hotel to trip.', 'Error');
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
          <HotelIcon className="w-6 h-6 text-sky-500" />
          <span>Hotels & Accommodations</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Discover vetted boutique hotels, resorts, and stays, and attach reservations directly to your saved trips.
        </p>
      </div>

      {/* No Saved Trips Warning Banner */}
      {trips.length === 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">No Saved Trips Found</span>
              <span className="text-amber-700 text-[11px]">
                To link hotels, first create and save an itinerary in the Plan Trip tab.
              </span>
            </div>
          </div>
          <Link
            to="/plan-trip"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shrink-0 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create a Trip</span>
          </Link>
        </div>
      )}

      {/* Search Parameters */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Destination City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Paris, Tokyo, Miami"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Check-In Date</label>
            <input
              type="date"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-semibold focus:border-blue-500 focus:bg-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Check-Out Date</label>
            <input
              type="date"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
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
                <span>Search Properties</span>
              </>
            )}
          </button>
        </form>

        {/* Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Top Stays:</span>
          {popularHotelDestinations.map((d, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCity(d)}
              className="text-[11px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {loading && <TableShimmer />}

      {/* Results View */}
      {hotels && !loading && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-800">
              Hotels & Resorts in {city}
            </h3>
            <span className="text-xs font-bold text-slate-400">{hotels.length} properties</span>
          </div>

          {hotels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {hotels.map((h, idx) => {
                const isLinked = linkedHotels[idx];
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-amber-500 text-sm">
                          {'★'.repeat(Math.round(h.stars || 4))}
                          <span className="text-xs text-slate-400 font-semibold ml-1">({h.stars || 4}-Star)</span>
                        </div>
                        <span className="text-sm font-black text-emerald-600">${h.price || 160} / night</span>
                      </div>

                      <h4 className="text-base font-extrabold text-slate-800">{h.name}</h4>
                      <p className="text-xs text-slate-500 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>Prime Neighborhood Location, {city}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      {trips.length > 0 ? (
                        <>
                          <select
                            value={saveTripIds[idx] || String(trips[0].id)}
                            onChange={(e) => setSaveTripIds({ ...saveTripIds, [idx]: e.target.value })}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 truncate"
                          >
                            {trips.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.destination} ({t.start_date})
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleSaveToTrip(idx, h)}
                            disabled={savingIdx === idx}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-xs flex items-center space-x-1.5 ${
                              isLinked
                                ? 'bg-emerald-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {savingIdx === idx ? (
                              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : isLinked ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Linked</span>
                              </>
                            ) : (
                              <>
                                <BookmarkCheck className="w-3.5 h-3.5" />
                                <span>Link Hotel</span>
                              </>
                            )}
                          </button>
                        </>
                      ) : (
                        <Link
                          to="/plan-trip"
                          className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold text-center transition-colors block"
                        >
                          Save a Trip First to Link
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-100 rounded-2xl">
              No hotels found for this city. Try a major metropolitan center.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
