import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Trash2, Calendar, TrendingDown, TrendingUp, Activity, MoveRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const DUMMY_HISTORY = [
    { _id: 'w1', date: '2023-10-01', weight: 82.5 },
    { _id: 'w2', date: '2023-10-08', weight: 81.8 },
    { _id: 'w3', date: '2023-10-15', weight: 81.2 },
    { _id: 'w4', date: '2023-10-22', weight: 80.5 },
    { _id: 'w5', date: '2023-10-29', weight: 79.9 },
    { _id: 'w6', date: '2023-11-05', weight: 79.5 },
    { _id: 'w7', date: '2023-11-12', weight: 79.0 },
    { _id: 'w8', date: '2023-11-19', weight: 78.2 },
    { _id: 'w9', date: '2023-11-26', weight: 77.8 },
    { _id: 'current', date: 'Today', weight: 77.5 },
    // Fillers for 90 days visual
    { _id: 'w01', date: '2023-09-01', weight: 84.0 },
    { _id: 'w02', date: '2023-09-15', weight: 83.2 },
].sort((a, b) => new Date(a.date) - new Date(b.date));

const WeightTracker = () => {
    const [weights, setWeights] = useState([]);
    const [newWeight, setNewWeight] = useState('');
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState(30); // 7, 30, 90

    // Placeholder height (cm)
    const heightCm = 175;

    useEffect(() => {
        fetchWeights();
    }, []);

    const fetchWeights = async () => {
        try {
            const res = await axios.get('/api/weight');
            let data = res.data;

            // Ensure sorted by date ascending for chart
            data.sort((a, b) => {
                if (a.date === 'Today') return 1;
                if (b.date === 'Today') return -1;
                return new Date(a.date) - new Date(b.date);
            });
            setWeights(data);
        } catch (err) {
            console.error(err);
            setWeights([]);
        }
    };

    const handleAddWeight = async (e) => {
        e.preventDefault();
        if (!newWeight) return;
        setLoading(true);
        try {
            await axios.post('/api/weight', {
                date: new Date().toISOString().split('T')[0],
                weight: parseFloat(newWeight)
            });
            setNewWeight('');
            fetchWeights();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        if (timeRange === 90) return weights; // Assuming all data for now, ideally filter by date
        // Slice for simplicity with dummy data logic
        // Real logic: filter where date > today - days
        const limit = timeRange === 7 ? 7 : timeRange === 30 ? 15 : 50;
        return weights.slice(-limit);
    };

    const chartData = getFilteredData();

    // Stats
    const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : 0;
    const startWeight = weights.length > 0 ? weights[0].weight : 0;
    const change = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : 0;
    const bmi = currentWeight ? (currentWeight / ((heightCm / 100) * (heightCm / 100))).toFixed(1) : '--';

    let bmiStatus = 'Normal';
    let bmiColor = 'text-blue-400';
    if (bmi < 18.5) { bmiStatus = 'Underweight'; bmiColor = 'text-amber-400'; }
    if (bmi >= 25) { bmiStatus = 'Overweight'; bmiColor = 'text-orange-400'; }
    if (bmi >= 30) { bmiStatus = 'Obese'; bmiColor = 'text-red-400'; }

    return (
        <div className="px-5 md:px-8 py-6 md:py-10 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24 md:pb-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Body Metrics</h1>
                    <p className="text-gray-400 mt-1">Focus on the trend, not the noise.</p>
                </div>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Current"
                    value={`${currentWeight} kg`}
                    icon={Activity}
                    color="text-white"
                    gradient="from-white/10 to-transparent"
                />
                <StatCard
                    label="Change"
                    value={`${change > 0 ? '+' : ''}${change} kg`}
                    icon={change < 0 ? TrendingDown : TrendingDown}
                    color={change < 0 ? 'text-emerald-400' : 'text-orange-400'}
                    gradient={change < 0 ? "from-emerald-500/20 to-transparent" : "from-orange-500/20 to-transparent"}
                />
                <StatCard
                    label="BMI"
                    value={bmi}
                    subvalue={bmiStatus}
                    icon={Activity}
                    color={bmiColor}
                    gradient={`from-${bmiColor.split('-')[1]}-500/20 to-transparent`}
                />
                <StatCard
                    label="Goal"
                    value="75 kg"
                    icon={TrendingUp}
                    color="text-purple-400"
                    gradient="from-purple-500/20 to-transparent"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="h-[400px] w-full bg-neutral-900/50 backdrop-blur-md rounded-[2.5rem] p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-6 z-10 relative">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} /> Weight Trend
                            </h3>
                            <div className="flex bg-neutral-950/50 rounded-xl p-1 border border-white/5">
                                {[
                                    { label: '7D', val: 7 },
                                    { label: '30D', val: 30 },
                                    { label: '3M', val: 90 },
                                ].map((t) => (
                                    <button
                                        key={t.val}
                                        onClick={() => setTimeRange(t.val)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                            timeRange === t.val
                                                ? "bg-neutral-800 text-white shadow-sm"
                                                : "text-gray-500 hover:text-gray-300"
                                        )}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#525252', fontSize: 10, fontWeight: 500 }}
                                        tickFormatter={(val) => val.includes('-') ? val.slice(5) : val}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={['auto', 'auto']}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#525252', fontSize: 10, fontWeight: 500 }}
                                        width={40}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', padding: '12px' }}
                                        itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}
                                        labelStyle={{ color: '#a3a3a3', fontSize: '12px', marginBottom: '4px' }}
                                        cursor={{ stroke: '#ffffff20', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Input Form Restyled */}
                    <form onSubmit={handleAddWeight} className="bg-neutral-900 border border-white/5 rounded-[2.5rem] p-2 flex items-center shadow-lg relative group focus-within:ring-2 ring-blue-500/20 transition-all">
                        <div className="flex-1 relative h-16 bg-neutral-950/50 rounded-[2rem] flex items-center px-6 transition-colors group-focus-within:bg-neutral-950">
                            <span className="text-gray-500 font-medium mr-4">Weight</span>
                            <input
                                type="number"
                                step="0.1"
                                value={newWeight}
                                onChange={(e) => setNewWeight(e.target.value)}
                                placeholder="0.0"
                                className="bg-transparent text-white text-2xl font-bold w-full focus:outline-none placeholder:text-neutral-800"
                            />
                            <span className="text-gray-500 font-bold">kg</span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newWeight}
                            className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 ml-2"
                        >
                            <Plus size={28} strokeWidth={2.5} />
                        </button>
                    </form>
                </div>

                {/* History List Refined */}
                <div className="bg-neutral-900/30 backdrop-blur-md rounded-[2.5rem] border border-white/5 h-[600px] flex flex-col shadow-xl overflow-hidden">
                    <div className="p-6 pb-2 border-b border-white/5 bg-neutral-900/50">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                            History <span className="text-xs bg-neutral-800 text-gray-400 px-2 py-0.5 rounded-full">{weights.length} entries</span>
                        </h3>
                    </div>

                    {/* Custom Scrollbar Container */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {[...weights].reverse().map((entry, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 hover:bg-white/5 rounded-2xl transition-colors group cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-gray-500 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                                        <Calendar size={16} />
                                    </div>
                                    <div>
                                        <span className="block text-white font-bold">{entry.weight} <span className="text-xs text-gray-500 font-normal">kg</span></span>
                                        <span className="text-xs text-gray-500">{entry.date}</span>
                                    </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, subvalue, icon: Icon, color, gradient = "from-white/5 to-transparent" }) => (
    <div className="bg-neutral-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-white/10 transition-all hover:bg-neutral-900/60 shadow-xl">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:scale-125 transition-transform duration-700`} />

        <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
            <div className={`p-2 rounded-xl bg-white/5 backdrop-blur-md border border-white/5 text-white shadow-inner`}>
                <Icon size={16} className={color === 'text-white' ? 'text-gray-300' : color} />
            </div>
        </div>
        <div className={`text-3xl font-bold tracking-tight ${color} relative z-10`}>{value}</div>
        {subvalue && <div className="text-xs text-white/50 mt-2 font-bold uppercase tracking-wider bg-white/5 inline-block px-2 py-1 rounded-lg border border-white/5 relative z-10">{subvalue}</div>}
    </div>
);

export default WeightTracker;
