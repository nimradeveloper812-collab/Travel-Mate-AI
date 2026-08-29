import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookmarkCheck,
  Trash2,
  Eye,
  X,
  Calendar,
  Compass,
  Hotel,
  Printer,
  Sparkles,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';


import api from '../lib/api';
import { useToast } from '../context/ToastContext';
import { CardShimmer } from '../components/Shimmer';

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
  weather_json?: string;
  notes_json?: string;
  created_at: string;
}

export default function SavedTrips() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState('All');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [modalTab, setModalTab] = useState<'itinerary' | 'bookings' | 'notes'>('itinerary');
  const [packingChecked, setPackingChecked] = useState<Record<string, boolean>>({});

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips/my-trips');
      setTrips(response.data || []);
    } catch (err) {
      console.error('Error fetching trips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;
    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      if (selectedTrip?.id === id) {
        setSelectedTrip(null);
      }
      success('Trip deleted successfully', 'Deleted');
    } catch (err) {
      toastError('Failed to delete trip itinerary.', 'Error');
    }
  };

  const filteredTrips = trips.filter((t) => {
    const matchesSearch = t.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStyle = styleFilter === 'All' || t.travel_style.toLowerCase() === styleFilter.toLowerCase();
    return matchesSearch && matchesStyle;
  });

  const getParsedData = (jsonStr?: string) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  };

  const toggleChecklist = (key: string) => {
    setPackingChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-white rounded-2xl w-72 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardShimmer key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center space-x-2.5">
            <BookmarkCheck className="w-6 h-6 text-sky-500" />
            <span>Saved Itineraries & Trips</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your saved AI trip plans, flights, accommodations, and personal checklists.
          </p>
        </div>

        {/* Search & Style Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-all w-48 sm:w-60 font-medium"
            />
          </div>

          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold cursor-pointer"
          >
            <option value="All">All Styles</option>
            <option value="Adventure">Adventure</option>
            <option value="Luxury">Luxury</option>
            <option value="Budget">Budget</option>
            <option value="Family">Family</option>
            <option value="Relaxation">Relaxation</option>
          </select>
        </div>
      </div>

      {/* Grid of Saved Trips */}
      {filteredTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const hotels = getParsedData(trip.hotels_json) || [];


            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTrip(trip)}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between space-y-5 hover:-translate-y-1 group relative overflow-hidden"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-600 uppercase tracking-wider">
                      {trip.travel_style}
                    </span>
                    <span className="text-sm font-black text-emerald-600">${trip.budget}</span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {trip.destination}
                  </h3>

                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{trip.start_date} to {trip.end_date}</span>
                  </div>

                  {/* Bookings badges */}
                  {hotels.length > 0 && (
                    <div className="flex items-center space-x-2 pt-1 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 flex items-center space-x-1">
                        <Hotel className="w-3 h-3" />
                        <span>{hotels.length} Hotel{hotels.length > 1 ? 's' : ''}</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700 flex items-center space-x-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Itinerary</span>
                  </span>

                  <button
                    onClick={(e) => handleDelete(trip.id, e)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete Trip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 text-center p-8 space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Compass className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">No Itineraries Found</h3>
            <p className="text-xs text-slate-400">
              {searchQuery || styleFilter !== 'All'
                ? 'Try adjusting your search keywords or style filters.'
                : "You haven't saved any trips yet. Generate your first itinerary in the Plan Trip tab!"}
            </p>
          </div>
          <button
            onClick={() => navigate('/plan-trip')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            Create New Trip
          </button>
        </div>
      )}

      {/* Itinerary Details Modal */}
      <AnimatePresence>
        {selectedTrip && (() => {
          const details = getParsedData(selectedTrip.itinerary_json);
          const hotels = getParsedData(selectedTrip.hotels_json) || [];
          const notesData = getParsedData(selectedTrip.notes_json);

          const defaultChecklist = [
            'Passport & Visa documents',
            'Travel insurance card',
            'Universal outlet adapter & power bank',
            'Comfortable walking shoes',
            'Prescription meds & mini first-aid kit',
            'Local currency & credit cards with no foreign fees'
          ];

          return (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                      {selectedTrip.travel_style} Journey
                    </span>
                    <h3 className="text-2xl font-black text-slate-800">{selectedTrip.destination}</h3>
                    <p className="text-xs text-slate-500 font-semibold">
                      {selectedTrip.start_date} to {selectedTrip.end_date} | Allocated Budget: ${selectedTrip.budget} USD
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedTrip(null)}
                    className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Tab Navigation */}
                <div className="flex border-b border-slate-100 bg-white px-4 sm:px-6 overflow-x-auto no-scrollbar gap-2 sm:gap-4">

                  {[
                    { id: 'itinerary', label: 'Day-by-Day Plan' },
                    { id: 'bookings', label: `Hotels & Stays (${hotels.length})` },
                    { id: 'notes', label: 'Packing Checklist & Notes' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id as any)}
                      className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                        modalTab === tab.id
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  {/* TAB 1: Itinerary */}
                  {modalTab === 'itinerary' && (
                    <div className="space-y-6">
                      {details && details.daily_plan ? (
                        <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                          {details.daily_plan.map((day: any) => (
                            <div key={day.day} className="relative pl-12 space-y-2">
                              <div className="absolute left-2 top-0.5 w-7 h-7 rounded-full bg-blue-600 border-4 border-white shadow-sm flex items-center justify-center text-white text-[11px] font-black z-10">
                                {day.day}
                              </div>
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-bold text-slate-800">{day.title}</h5>
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  ${day.estimated_cost}
                                </span>
                              </div>
                              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
                                <p><strong className="text-slate-800 font-bold">Morning:</strong> {day.morning}</p>
                                <p><strong className="text-slate-800 font-bold">Afternoon:</strong> {day.afternoon}</p>
                                <p><strong className="text-slate-800 font-bold">Evening:</strong> {day.evening}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">{selectedTrip.itinerary_json}</p>
                      )}

                      {details && details.travel_tips && (
                        <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-2">
                          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Suggestions & Tips</h5>
                          <ul className="space-y-1.5 text-xs text-slate-700">
                            {details.travel_tips.map((t: string, i: number) => (
                              <li key={i}>• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Booked Hotels */}
                  {modalTab === 'bookings' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                          <Hotel className="w-4 h-4 text-indigo-500" />
                          <span>Saved Hotel Accommodations ({hotels.length})</span>
                        </h4>
                        {hotels.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {hotels.map((h: any, i: number) => (
                              <div key={i} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                                <p className="font-bold text-slate-800 text-sm">{h.name}</p>
                                <p className="text-amber-500">{'★'.repeat(Math.round(h.stars || 4))}</p>
                                <p className="text-emerald-600 font-black text-sm pt-1">${h.price} / night</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                            No hotels linked to this trip yet. You can find and attach stays in the Hotels tab!
                          </div>
                        )}
                      </div>
                    </div>
                  )}


                  {/* TAB 3: Checklist & Notes */}
                  {modalTab === 'notes' && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-800">Essential Packing Checklist</h4>
                        <div className="space-y-2">
                          {defaultChecklist.map((item, i) => {
                            const isChecked = !!packingChecked[`${selectedTrip.id}-${i}`];
                            return (
                              <div
                                key={i}
                                onClick={() => toggleChecklist(`${selectedTrip.id}-${i}`)}
                                className={`p-3 rounded-xl border flex items-center space-x-3 text-xs font-semibold cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 line-through opacity-75'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <span>{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {notesData?.user_notes && (
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                          <h4 className="text-sm font-bold text-slate-800">Personal Trip Notes</h4>
                          <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                            {notesData.user_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Modal Footer */}
                <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <button
                    onClick={() => window.print()}
                    className="p-2.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer bg-white"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTrip(null);
                      navigate('/chat');
                    }}
                    className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:from-sky-600 hover:to-blue-700 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI About This Trip</span>
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
