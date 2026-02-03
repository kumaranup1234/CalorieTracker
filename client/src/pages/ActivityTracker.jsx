import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity as ActivityIcon, Flame, Clock, Zap, Plus, Sparkles, Calendar, Trash2, Settings, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const ActivityTracker = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({
        totalBurn: 0,
        weeklyBurn: 0,
        weeklyGoal: 2000 // Default, will fetch from settings
    });
    const [personalBests, setPersonalBests] = useState({ longestRun: 0, maxCalories: 0 });

    // Form State
    const [inputMode, setInputMode] = useState('text'); // 'text' (default mobile friendly) or 'ai'
    const [aiQuery, setAiQuery] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [editingGoal, setEditingGoal] = useState(false);
    const [newGoal, setNewGoal] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        minutes: '',
        calories: '',
        description: ''
    });

    useEffect(() => {
        fetchActivities();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            if (res.data.weeklyBurnGoal) {
                setStats(prev => ({ ...prev, weeklyGoal: res.data.weeklyBurnGoal }));
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };

    const updateWeeklyGoal = async () => {
        if (!newGoal || isNaN(newGoal)) return;
        try {
            await axios.put('/api/settings', { weeklyBurnGoal: Number(newGoal) });
            setStats(prev => ({ ...prev, weeklyGoal: Number(newGoal) }));
            setEditingGoal(false);
            toast.success('Weekly goal updated!');
        } catch (err) {
            toast.error('Failed to update goal');
        }
    };

    const fetchActivities = async () => {
        try {
            const res = await axios.get('/api/activity');
            let fetched = res.data;

            // Sort by time descending
            fetched.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            setActivities(fetched);
            calculateStats(fetched);
            calculatePersonalBests(fetched);
        } catch (err) {
            console.error("Failed to fetch activities", err);
        }
    };

    const calculateStats = (data) => {
        const today = new Date().toISOString().split('T')[0];

        // Today's Burn
        const todayBurn = data
            .filter(a => a.date === today)
            .reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

        // Weekly Burn (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weekBurn = data
            .filter(a => new Date(a.date) >= sevenDaysAgo)
            .reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);

        setStats(prev => ({ ...prev, totalBurn: todayBurn, weeklyBurn: weekBurn }));
    };

    const calculatePersonalBests = (data) => {
        let longestRun = 0;
        let maxCalories = 0;

        data.forEach(act => {
            // Heuristic for longest run (assuming name contains 'run' and we have rough distance or just duration as proxy)
            // For now, simpler: Max Calories in one session
            if (act.caloriesBurned > maxCalories) maxCalories = act.caloriesBurned;

            // Check if it's a run for duration based 'longest run' proxy if distance isn't explicitly stored
            if (act.name.toLowerCase().includes('run')) {
                // Mocking calculation: assume 10km/h avg for simplicity if no distance field, 
                // but actually we don't have distance. Let's track 'Longest Workout' instead.
                if (act.durationMinutes > longestRun) longestRun = act.durationMinutes;
            }
        });

        // Actually, let's just do Max Duration and Max Calories for generic bests
        const maxDuration = data.reduce((max, obj) => (obj.durationMinutes > max ? obj.durationMinutes : max), 0);

        setPersonalBests({
            longestDuration: maxDuration,
            maxCalories
        });
    };

    const handleAiEstimate = async () => {
        if (!aiQuery) return;
        setLoadingAi(true);
        const toastId = toast.loading('Asking Gemini AI...');
        try {
            const res = await axios.post('/api/activity/estimate', { query: aiQuery });
            const data = res.data;

            // Validation: If AI fails to return calories (unsuccessful estimate)
            if (!data.calories || data.calories === 0) {
                throw new Error("AI returned no calories");
            }

            // Auto-Save Immediately
            await axios.post('/api/activity', {
                name: data.name || 'Workout',
                description: aiQuery,
                caloriesBurned: Number(data.calories),
                durationMinutes: Number(data.duration) || 30,
                date: new Date().toISOString().split('T')[0],
                type: 'ai'
            });

            setAiQuery('');
            fetchActivities();
            toast.success(`${data.name} logged (${data.calories} kcal)!`, { id: toastId });

        } catch (err) {
            console.error(err);
            toast.error('Could not estimate activity. Please try manual entry.', { id: toastId });
            // Optionally switch to manual mode so user can enter it
            setInputMode('manual');
        } finally {
            setLoadingAi(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name || !formData.calories) {
            toast.error('Please enter name and calories');
            return;
        }
        try {
            await axios.post('/api/activity', {
                name: formData.name,
                description: formData.description,
                caloriesBurned: Number(formData.calories),
                durationMinutes: Number(formData.minutes),
                date: new Date().toISOString().split('T')[0],
                type: aiQuery ? 'ai' : 'manual'
            });

            // Reset
            setFormData({ name: '', minutes: '', calories: '', description: '' });
            setAiQuery('');
            setInputMode('ai');
            fetchActivities();
            toast.success('Workout logged successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save activity');
        }
    };

    // Chart Data (Last 7 days)
    const chartData = [6, 5, 4, 3, 2, 1, 0].map(daysAgo => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        const dateStr = d.toISOString().split('T')[0];
        const dayBurn = activities
            .filter(a => a.date === dateStr)
            .reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            date: dateStr,
            burn: dayBurn
        };
    });

    const weeklyProgress = Math.min((stats.weeklyBurn / stats.weeklyGoal) * 100, 100);

    return (
        <div className="px-5 md:px-8 py-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-10">
            <header className="flex flex-col md:flex-row justify-between md:items-end gap-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent inline-flex items-center gap-3">
                        <Flame className="text-orange-500" /> Training & Activity
                    </h1>
                    <p className="text-gray-400 mt-2">Track your burn. AI powered estimations.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-neutral-900/50 border border-white/5 px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Today's Burn</span>
                        <span className="text-2xl font-bold text-orange-500">{Math.round(stats.totalBurn)} <span className="text-xs text-gray-500">kcal</span></span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-[2rem] p-6 border border-white/5 shadow-xl">
                        <div className="flex bg-neutral-950/50 p-1 rounded-xl mb-6 border border-white/5">
                            <button
                                onClick={() => setInputMode('ai')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'ai' ? 'bg-neutral-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <Sparkles size={14} /> AI Estimate
                            </button>
                            <button
                                onClick={() => setInputMode('manual')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${inputMode === 'manual' ? 'bg-neutral-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <ActivityIcon size={14} /> Manual
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {inputMode === 'ai' ? (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">What did you do?</label>
                                    <textarea
                                        value={aiQuery}
                                        onChange={(e) => setAiQuery(e.target.value)}
                                        placeholder="e.g., 45 min weight lifting, high intensity"
                                        className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white placeholder:text-neutral-700 resize-none focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                    <button
                                        onClick={handleAiEstimate}
                                        disabled={loadingAi || !aiQuery}
                                        className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loadingAi ? 'Estimating...' : <><Sparkles size={18} /> Calculate Burn</>}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="manual"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Activity Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                                            placeholder="Running, Yoga..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Duration (m)</label>
                                            <input
                                                type="number"
                                                value={formData.minutes}
                                                onChange={(e) => setFormData({ ...formData, minutes: e.target.value })}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Calories</label>
                                            <input
                                                type="number"
                                                value={formData.calories}
                                                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                                    >
                                        <Plus size={20} /> Log Activity
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Weekly Goal Progress Card */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-lg mt-6 group">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />

                        <div className="relative z-20 w-full flex justify-between items-center mb-4">
                            <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Weekly Goal</h3>
                            <button
                                onClick={() => {
                                    setEditingGoal(!editingGoal);
                                    if (!editingGoal) setNewGoal(stats.weeklyGoal);
                                }}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                            >
                                <Edit3 size={14} />
                            </button>
                        </div>

                        {editingGoal ? (
                            <div className="relative z-20 w-full flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                                <label className="text-xs text-gray-500">Set weekly calorie burn target:</label>
                                <input
                                    type="number"
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    className="bg-neutral-950 border border-white/10 rounded-xl px-4 py-2 text-white text-center font-bold text-xl focus:border-orange-500 outline-none"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingGoal(false)} className="flex-1 py-2 bg-neutral-800 rounded-lg text-xs font-bold text-gray-400">Cancel</button>
                                    <button onClick={updateWeeklyGoal} className="flex-1 py-2 bg-orange-500 rounded-lg text-xs font-bold text-white">Save</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="relative w-48 h-48 flex items-center justify-center z-10 my-2">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="96" cy="96" r="80" stroke="#262626" strokeWidth="12" fill="transparent" />
                                        <circle cx="96" cy="96" r="80" stroke="#f97316" strokeWidth="12" fill="transparent" strokeDasharray="502" strokeDashoffset={502 - (502 * (weeklyProgress / 100))} strokeLinecap="round" className="drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-1000 ease-out" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-white">{Math.round(weeklyProgress)}%</span>
                                        <span className="text-xs text-gray-500 uppercase font-bold mt-1">{stats.weeklyBurn} / {stats.weeklyGoal}</span>
                                    </div>
                                </div>
                                <p className="text-gray-500 text-sm mt-4 text-center max-w-[90%] relative z-10">
                                    {weeklyProgress >= 100 ? "Goal crushed! Amazing work! 🔥" : "Keep moving to hit your weekly target."}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Personal Bests (Dynamic) */}
                    <div className="glass-panel p-6 rounded-[2rem] relative overflow-hidden mt-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Flame size={14} className="text-yellow-500" /> Personal Bests
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-xl border border-white/5">
                                <span className="text-sm font-bold text-gray-300">Longest Session</span>
                                <span className="text-sm font-mono text-emerald-400">{personalBests.longestDuration || 0} min</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-xl border border-white/5">
                                <span className="text-sm font-bold text-gray-300">Max Burn</span>
                                <span className="text-sm font-mono text-orange-400">{personalBests.maxCalories || 0} kcal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Graphs & History */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Chart */}
                    <div className="h-80 w-full bg-neutral-900/50 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/5 shadow-xl relative overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <ActivityIcon size={14} /> Weekly Burn
                            </h3>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#ea580c" stopOpacity={0.8} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#525252', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="glass-panel p-4 rounded-xl border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
                                                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500">
                                                                <Flame size={16} fill="currentColor" />
                                                            </div>
                                                            <div>
                                                                <span className="block text-xl font-bold text-white">{payload[0].value}</span>
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Calories</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="burn" radius={[6, 6, 6, 6]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.date === new Date().toISOString().split('T')[0] ? '#f97316' : '#262626'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* History List */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-gray-500" /> Recent Activities
                        </h3>
                        <div className="grid gap-3">
                            {activities.map((act) => (
                                <div key={act._id} className="bg-neutral-900/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-neutral-900 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center text-2xl">
                                            {act.name.toLowerCase().includes('run') ? '🏃' :
                                                act.name.toLowerCase().includes('weight') ? '🏋️' :
                                                    act.name.toLowerCase().includes('yoga') ? '🧘' :
                                                        act.name.toLowerCase().includes('cycle') ? '🚴' : '🔥'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{act.name}</h4>
                                            <p className="text-xs text-gray-500 font-medium">{act.durationMinutes} min • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <span className="block font-bold text-orange-500 text-lg">{act.caloriesBurned}</span>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Kcal</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && (
                                <div className="text-center py-10 text-gray-500">No activities logged yet.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityTracker;
