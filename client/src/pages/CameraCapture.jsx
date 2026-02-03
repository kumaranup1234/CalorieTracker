import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Loader2, Image as ImageIcon, Scan, History, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const CameraCapture = () => {
    const fileInputRef = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recentScans, setRecentScans] = useState([]);
    const [mode, setMode] = useState('scan'); // 'scan' or 'manual'
    const [manualEntry, setManualEntry] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });

    // Load recent scans from local storage or API (mocking for now to match session)
    const fetchHistory = async () => {
        try {
            const res = await axios.get('/api/meals?limit=10');
            // Map DB format to UI format
            const mappedScans = res.data.map(meal => ({
                id: meal._id,
                name: meal.meal_name,
                cal: meal.calories,
                time: new Date(meal.timestamp || meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }));
            setRecentScans(mappedScans);
        } catch (err) {
            console.error("Failed to load history", err);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setSelectedImage(e.target.result);
            reader.readAsDataURL(file);
            analyzeImage(file);
        }
    };



    const analyzeImage = async (file) => {
        setLoading(true);
        const toastId = toast.loading('Analyzing food image...');
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await axios.post('/api/analyze', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setAnalysis(res.data);

            // Add to local recent scans
            setRecentScans(prev => [
                { id: Date.now(), name: res.data.meal_name, cal: res.data.calories, time: "Just now" },
                ...prev
            ]);
            toast.dismiss(toastId);
            toast.success('Food analyzed successfully!');

        } catch (err) {
            console.error(err);
            toast.error("Analysis failed. Please try again.", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    const saveMeal = async () => {
        if (!analysis) return;
        try {
            await axios.post('/api/meals', {
                ...analysis,
                date: new Date().toISOString().split('T')[0]
            });
            setSelectedImage(null);
            setAnalysis(null);
            fetchHistory(); // Refresh the list
            toast.success('Meal logged to your daily total!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save meal.');
        }
    };

    const saveManualMeal = async () => {
        try {
            await axios.post('/api/meals', {
                meal_name: manualEntry.name,
                calories: Number(manualEntry.calories),
                protein: Number(manualEntry.protein),
                carbs: Number(manualEntry.carbs),
                fat: Number(manualEntry.fat),
                reasoning: 'Manual Entry',
                date: new Date().toISOString().split('T')[0]
            });
            setManualEntry({ name: '', calories: '', protein: '', carbs: '', fat: '' });
            fetchHistory();
            toast.success('Manual entry logged!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save manual log.');
        }
    };

    return (
        <div className="px-5 md:px-8 py-6 max-w-6xl mx-auto min-h-screen pb-24 md:pb-10">
            <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Scan className="text-blue-500" /> Food Scanner
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Scanner/Manual Area - Span 2 Columns */}
                <div className="lg:col-span-2 group relative bg-neutral-900/40 backdrop-blur-xl border border-dashed border-white/10 rounded-[2.5rem] overflow-hidden min-h-[500px] flex flex-col items-center justify-start p-8 transition-all hover:border-blue-500/30 hover:bg-neutral-900/60 shadow-2xl">

                    {/* Tab Switcher */}
                    <div className="relative z-50 flex bg-neutral-900 p-1 rounded-2xl mb-8 border border-white/10">
                        <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-2xl"></div>
                        <button
                            onClick={() => setMode('scan')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${mode === 'scan' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Camera size={16} /> Photo Scan
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${mode === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Utensils size={16} /> Manual Log
                        </button>
                    </div>

                    {mode === 'scan' ? (
                        <>
                            {/* Ambient Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-colors duration-700" />

                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                onChange={handleImageSelect}
                                ref={fileInputRef}
                            />

                            <AnimatePresence>
                                {!selectedImage && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center space-y-6 pointer-events-none relative z-10 mt-20"
                                    >
                                        <div className="w-24 h-24 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(0,0,0,0.3)] border border-white/5 group-hover:border-blue-500/30">
                                            <Camera size={40} className="text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-2">Tap to Scan</h3>
                                            <p className="text-gray-400 max-w-[200px] mx-auto leading-relaxed">Take a photo or upload to instantly analyze nutrition.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {selectedImage && (
                                <div className="absolute inset-0 z-30 bg-black">
                                    <img src={selectedImage} alt="Selected" className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />

                                    {/* Cancel Button */}
                                    <button
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setAnalysis(null);
                                        }}
                                        className="absolute top-6 right-6 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 transition-all hover:scale-110"
                                    >
                                        <X size={20} />
                                    </button>

                                    {loading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse"></div>
                                                <Loader2 size={56} className="text-blue-500 animate-spin relative z-10" />
                                            </div>
                                            <p className="text-white font-medium animate-pulse mt-6 tracking-wide uppercase text-xs">AI Analysis in Progress...</p>
                                        </div>
                                    )}

                                    {!loading && analysis && (
                                        <div className="absolute bottom-6 left-0 right-0 mx-auto w-[90%] max-w-sm bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <h2 className="text-2xl font-bold text-white tracking-tight">{analysis.meal_name}</h2>
                                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{analysis.reasoning}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedImage(null)}
                                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {/* Macros Row */}
                                            <div className="flex items-center justify-between gap-4 mb-6 bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <div className="text-center">
                                                    <span className="block text-2xl font-bold text-white">{analysis.calories}</span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Kcal</span>
                                                </div>
                                                <div className="w-px h-8 bg-white/10"></div>
                                                <div className="text-center">
                                                    <span className="block text-lg font-bold text-blue-400">{analysis.protein}g</span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Prot</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-lg font-bold text-emerald-400">{analysis.carbs}g</span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Carb</span>
                                                </div>
                                                <div className="text-center">
                                                    <span className="block text-lg font-bold text-yellow-400">{analysis.fat}g</span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Fat</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={saveMeal}
                                                className="w-full bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 active:scale-[0.98] transition-all"
                                            >
                                                <Check size={20} strokeWidth={3} />
                                                <span>Log Meal</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="w-full max-w-md space-y-6 relative z-10 px-4">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Meal Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Grilled Chicken Salad"
                                        value={manualEntry.name}
                                        onChange={(e) => setManualEntry({ ...manualEntry, name: e.target.value })}
                                        className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Calories</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.calories}
                                            onChange={(e) => setManualEntry({ ...manualEntry, calories: e.target.value })}
                                            className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Protein (g)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.protein}
                                            onChange={(e) => setManualEntry({ ...manualEntry, protein: e.target.value })}
                                            className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-blue-400 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all font-bold text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Carbs (g)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.carbs}
                                            onChange={(e) => setManualEntry({ ...manualEntry, carbs: e.target.value })}
                                            className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-emerald-400 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-bold text-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Fat (g)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={manualEntry.fat}
                                            onChange={(e) => setManualEntry({ ...manualEntry, fat: e.target.value })}
                                            className="w-full bg-neutral-950/50 border border-white/10 rounded-xl p-4 text-rose-400 placeholder-gray-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 transition-all font-bold text-lg"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={saveManualMeal}
                                disabled={!manualEntry.name || !manualEntry.calories}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                            >
                                <Check size={20} strokeWidth={3} />
                                <span>Log Entry</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar - Recent History */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-neutral-900/50 border border-white/5 rounded-[2rem] p-6 h-full min-h-[500px]">
                        <div className="flex items-center gap-2 mb-6 text-gray-400">
                            <History size={16} />
                            <span className="text-sm font-bold uppercase tracking-wider">Recent Scans</span>
                        </div>

                        <div className="space-y-3">
                            {recentScans.map((scan) => (
                                <div key={scan.id} className="bg-neutral-950 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-neutral-800 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center border border-white/5">
                                            <Utensils size={18} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{scan.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-medium">{scan.time}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-white text-sm bg-neutral-900 px-3 py-1 rounded-lg border border-white/5">{scan.cal}</span>
                                </div>
                            ))}
                            {recentScans.length === 0 && (
                                <div className="text-center py-20 opacity-50">
                                    <Utensils size={40} className="mx-auto mb-4 text-gray-600" />
                                    <p className="text-gray-500">No recent scans</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Badge = ({ label, color }) => (
    <span className={`${color} px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm`}>{label}</span>
);

// Helper for icon (needed if Utensils used again)
const UtensilsCopy = ({ size, className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
);

export default CameraCapture;
