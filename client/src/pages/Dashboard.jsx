import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { TrendingUp, Activity, Flame, Utensils, Clock, Droplets, Zap, ChevronRight, BarChart3, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import DailyTasks from '../components/DailyTasks';
import WaterTracker from '../components/WaterTracker';

const Dashboard = () => {
    const [stats, setStats] = useState({
        calories: 0,
        target: 2500,
        protein: 0,
        carbs: 0,
        fat: 0,
        // Fetched Targets from Settings
        proteinTarget: 180,
        carbsTarget: 250,
        fatTarget: 80
    });
    const [meals, setMeals] = useState([]);
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Fetch Today's Meals
            const mealsRes = await axios.get(`/api/meals?date=${today}`);
            let fetchedMeals = mealsRes.data;

            // Sort by time
            fetchedMeals.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setMeals(fetchedMeals);

            // Calculate Totals specifically for Today
            const totals = fetchedMeals.reduce((acc, meal) => ({
                calories: acc.calories + (meal.calories || 0),
                protein: acc.protein + (meal.protein || 0),
                carbs: acc.carbs + (meal.carbs || 0),
                fat: acc.fat + (meal.fat || 0),
            }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

            // 2. Fetch User Settings (Targets)
            const settingsRes = await axios.get('/api/settings');
            const settings = settingsRes.data;

            // 3. Fetch Weekly Stats
            const weeklyRes = await axios.get('/api/stats/weekly');

            // Transform Weekly API Data: Map 7-day API response to chart format
            // API returns [{day: 'Mon', date: '...', cal: 1200}, ...] in correct order
            setWeeklyData(weeklyRes.data);

            // Update Stats State
            setStats(prev => ({
                ...prev,
                ...totals,
                target: settings.calorieTarget || 2500,
                proteinTarget: settings.proteinTarget || 180,
                carbsTarget: settings.carbsTarget || 250,
                fatTarget: settings.fatTarget || 80
            }));

        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    // Derived Data for Charts
    const macroData = [
        { name: 'Protein', value: stats.protein, color: '#3b82f6' },
        { name: 'Carbs', value: stats.carbs, color: '#f59e0b' },
        { name: 'Fat', value: stats.fat, color: '#f43f5e' },
    ];

    return (
        <div className="px-5 md:px-8 py-8 md:py-10 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-10">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Your nutritional command center.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <StatBadge icon={Flame} value={stats.calories} label="kcal" color="text-orange-400" border="border-orange-500/20" bg="bg-orange-500/10" />
                    <StatBadge icon={Zap} value={Math.round(stats.protein)} label="g Protein" color="text-blue-400" border="border-blue-500/20" bg="bg-blue-500/10" />
                </div>
            </header>

            {/* Top Grid: Main Stats + Macro Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calorie Card */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 border border-white/5 relative overflow-hidden flex flex-col justify-between shadow-2xl group"
                >
                    <div className="absolute top-0 right-0 p-64 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-blue-600/10 transition-colors duration-1000" />

                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div>
                            <div className="flex justify-between items-center w-full mb-2">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Activity size={12} /> Daily Summary</h2>
                                <Link to="/analytics" className="text-[10px] font-bold text-blue-400 flex items-center gap-1 hover:text-blue-300 transition-colors">
                                    Details <ChevronRight size={10} />
                                </Link>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-7xl md:text-8xl font-bold text-white tracking-tighter shadow-black drop-shadow-lg">{stats.calories}</span>
                                <span className="text-2xl text-gray-500 font-medium">/ {stats.target}</span>
                            </div>
                        </div>
                        {/* Weekly Micro Chart */}
                        <div className="h-24 w-48 hidden md:block opacity-60 hover:opacity-100 transition-opacity cursor-pointer group/chart">
                            <Link to="/analytics">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyData}>
                                        <Bar dataKey="cal" radius={[4, 4, 0, 0]}>
                                            {weeklyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.date === new Date().toISOString().split('T')[0] ? '#3b82f6' : '#262626'} />
                                            ))}
                                        </Bar>
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.1)', radius: 4 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-2xl z-50">
                                                            <div className="mb-1">
                                                                <p className="text-gray-400 text-[10px] font-bold uppercase">{payload[0].payload.day}</p>
                                                                <p className="text-[9px] text-gray-600">{new Date(payload[0].payload.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                                <span className="text-white font-bold text-sm">{payload[0].value} <span className="text-[10px] text-gray-500 font-normal">kcal</span></span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                                <span>Progress</span>
                                <span>{Math.min(Math.round((stats.calories / stats.target) * 100), 100)}%</span>
                            </div>
                            <div className="h-5 bg-neutral-800 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min((stats.calories / stats.target) * 100, 100)}%` }}
                                    transition={{ duration: 1.2, ease: "circOut" }}
                                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                />
                            </div>
                        </div>

                        {/* Macro Grid - Circular Progress style */}
                        <div className="flex justify-between items-center px-4 pt-4">
                            <MacroCircle label="Protein" value={stats.protein} target={stats.proteinTarget} color="#3b82f6" />
                            <div className="w-px h-12 bg-white/5" />
                            <MacroCircle label="Carbs" value={stats.carbs} target={stats.carbsTarget} color="#f59e0b" />
                            <div className="w-px h-12 bg-white/5" />
                            <MacroCircle label="Fat" value={stats.fat} target={stats.fatTarget} color="#f43f5e" />
                        </div>
                    </div>
                </motion.div>

                {/* Macro Distribution Pie */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-neutral-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/5 flex flex-col relative overflow-hidden shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Macro Split</h3>
                        <BarChart3 size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-h-[220px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={macroData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={6}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {macroData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-white">
                                    {Math.round(stats.protein) + Math.round(stats.carbs) + Math.round(stats.fat)}
                                    <span className="text-sm font-normal text-gray-500 ml-1">g</span>
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Total</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center gap-6 mt-6">
                        {macroData.map((m) => (
                            <div key={m.name} className="flex flex-col items-center gap-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                                <span className="text-xs text-gray-400 font-medium">{m.name}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Middle Section: Daily Tasks & Water */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="md:col-span-2"
                >
                    <DailyTasks />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <WaterTracker />
                </motion.div>
            </div>

            {/* Meals Section - Table for Desktop, Grid for Mobile */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <span className="bg-neutral-800 p-2 rounded-xl text-gray-400"><Utensils size={20} /></span>
                        Today's Logs
                    </h2>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-neutral-900/50 animate-pulse rounded-3xl" />)}
                    </div>
                ) : meals.length === 0 ? (
                    <div className="p-16 text-center border-2 border-dashed border-neutral-800 rounded-[2rem] bg-neutral-900/20">
                        <p className="text-gray-500 font-medium text-lg">No meals logged yet.</p>
                        <p className="text-gray-600 text-sm mt-2">Tap the camera to start tracking.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View (Enhanced) */}
                        <div className="hidden md:block bg-neutral-900/40 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-950/50 text-gray-500 text-xs uppercase tracking-wider font-bold border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-6">Meal</th>
                                        <th className="px-6 py-6 text-center">Calories</th>
                                        <th className="px-6 py-6 text-center">Protein</th>
                                        <th className="px-6 py-6 text-center">Carbs</th>
                                        <th className="px-6 py-6 text-center">Fat</th>
                                        <th className="px-6 py-6 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {meals.map((meal) => {
                                        const dominant = getDominantMacro(meal);
                                        return (
                                            <tr key={meal._id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-2xl bg-neutral-800 overflow-hidden shadow-lg border border-white/5 relative group-hover:scale-105 transition-transform">
                                                            {meal.image_path ? (
                                                                <img src={`/${meal.image_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt="" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-3xl">🥗</div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-white text-lg block">{meal.meal_name}</span>
                                                            <div className="mt-1 flex gap-2">
                                                                {dominant && (
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-${dominant.color}-500/10 text-${dominant.color}-400 border border-${dominant.color}-500/20 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}>
                                                                        High {dominant.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="font-bold text-white bg-neutral-800 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">{meal.calories}</span>
                                                </td>
                                                <td className={`px-6 py-5 text-center font-bold ${dominant?.label === 'Protein' ? 'text-blue-400' : 'text-gray-500'}`}>{Math.round(meal.protein)}g</td>
                                                <td className={`px-6 py-5 text-center font-bold ${dominant?.label === 'Carbs' ? 'text-amber-400' : 'text-gray-500'}`}>{Math.round(meal.carbs)}g</td>
                                                <td className={`px-6 py-5 text-center font-bold ${dominant?.label === 'Fat' ? 'text-rose-400' : 'text-gray-500'}`}>{Math.round(meal.fat)}g</td>
                                                <td className="px-6 py-5 text-right text-gray-500 font-mono text-sm">
                                                    {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View (Polished & Smart) */}
                        <div className="md:hidden grid grid-cols-1 gap-4">
                            {meals.map((meal) => {
                                const dominant = getDominantMacro(meal);
                                return (
                                    <div key={meal._id} className="relative bg-neutral-900/50 border border-white/5 rounded-[2rem] p-5 flex gap-5 items-stretch shadow-lg overflow-hidden active:scale-[0.98] transition-transform">
                                        {/* Background Highlight for dominant macro - subtle */}
                                        {dominant && <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-${dominant.color}-500`} />}

                                        <div className="w-24 h-24 rounded-2xl bg-neutral-800 overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                                            {meal.image_path ? (
                                                <img src={`/${meal.image_path.replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-3xl">🥗</div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white text-lg truncate pr-2">{meal.meal_name}</h4>
                                                    <span className="text-xs font-mono text-gray-500">{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>

                                                {/* Smart Badge */}
                                                {dominant && (
                                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 bg-${dominant.color}-500/10 text-${dominant.color}-400 border border-${dominant.color}-500/20`}>
                                                        High {dominant.label}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-2xl font-bold text-white leading-none">{meal.calories}</span>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Kcal</span>
                                                </div>

                                                <div className="flex gap-4">
                                                    <MiniMacro label="P" value={meal.protein} color="text-blue-400" isDominant={dominant?.label === 'Protein'} />
                                                    <MiniMacro label="C" value={meal.carbs} color="text-amber-400" isDominant={dominant?.label === 'Carbs'} />
                                                    <MiniMacro label="F" value={meal.fat} color="text-rose-400" isDominant={dominant?.label === 'Fat'} />
                                                </div>
                                            </div>
                                        </div>

                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-800" size={20} />
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Logic Helpers
const getDominantMacro = (meal) => {
    const { protein, carbs, fat } = meal;
    const pCal = protein * 4;
    const cCal = carbs * 4;
    const fCal = fat * 9;

    if (pCal >= cCal && pCal >= fCal) return { label: 'Protein', color: 'blue' };
    if (fCal >= cCal && fCal >= pCal) return { label: 'Fat', color: 'rose' };
    return { label: 'Carbs', color: 'amber' };
};

// UI Components
const StatBadge = ({ icon: Icon, value, label, color, border, bg }) => (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${border} ${bg} backdrop-blur-sm`}>
        <Icon size={16} className={color} />
        <span className={`font-bold text-lg ${color}`}>{value}</span>
        <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">{label}</span>
    </div>
);

const MacroCircle = ({ label, value, target, color }) => {
    const percentage = Math.min((value / target) * 100, 100);
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke="#262626"
                        strokeWidth="6"
                        fill="transparent"
                    />
                    <circle
                        cx="40"
                        cy="40"
                        r={radius}
                        stroke={color}
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out group-hover:stroke-[8px]"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-white transition-transform group-hover:scale-110">{Math.round(value)}</span>
                    <span className="text-[10px] text-gray-500">/{target}</span>
                </div>
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
        </div>
    );
};

const MiniMacro = ({ label, value, color, isDominant }) => (
    <div className={`flex flex-col items-center ${isDominant ? 'opacity-100 scale-110' : 'opacity-60'} transition-all`}>
        <span className={`text-sm font-bold ${color}`}>{Math.round(value)}</span>
        <span className="text-[9px] text-gray-500 font-bold">{label}</span>
    </div>
);

export default Dashboard;

