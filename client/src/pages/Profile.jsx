import React, { useState, useEffect } from 'react';
import { User, Settings as SettingsIcon, ChevronRight, Save, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Profile = () => {
    const [settings, setSettings] = useState({
        name: 'Anup',
        program: 'Muscle Gain',
        calorieTarget: 2500,
        proteinTarget: 180,
        carbsTarget: 250,
        fatTarget: 80,
        currentWeight: 75.5,
        goalWeight: 80,
        notifications: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            if (res.data) {
                setSettings(prev => ({ ...prev, ...res.data }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await axios.put('/api/settings', settings);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        try {
            await axios.post('/api/reset');
            window.location.reload(); // Reload to clear states and show fresh app
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to reset account.' });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-blue-500">
            <Loader2 className="animate-spin" size={32} />
        </div>
    );

    return (
        <div className="px-6 md:px-8 py-8 md:py-10 max-w-4xl mx-auto pb-24 md:pb-10">
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2rem] flex items-center justify-center text-3xl font-bold shadow-2xl shadow-blue-600/20 border border-white/10 group-hover:scale-105 transition-transform duration-300">
                            {settings.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-black"></div>
                    </div>

                    <div className="space-y-1">
                        <input
                            type="text"
                            name="name"
                            value={settings.name}
                            onChange={handleChange}
                            className="text-4xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 p-0 text-white placeholder-gray-500 w-full md:w-auto tracking-tight"
                        />
                        <input
                            type="text"
                            name="program"
                            value={settings.program}
                            onChange={handleChange}
                            className="text-blue-400 font-medium text-sm bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1 w-full md:w-auto focus:outline-none focus:border-blue-500/50 transition-colors uppercase tracking-wider"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => fetchSettings()}
                        className="p-4 bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-neutral-800 transition-all shadow-lg active:scale-95"
                        title="Reset Changes"
                    >
                        <RefreshCw size={20} />
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-white/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        Save Changes
                    </button>
                </div>
            </header>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                >
                    {message.text}
                </motion.div>
            )}

            <div className="grid gap-6">
                <Section title="Nutritional Goals">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                        <InputItem label="Daily Calorie Target" name="calorieTarget" value={settings.calorieTarget} onChange={handleChange} unit="kcal" type="number" />
                        <InputItem label="Protein Target" name="proteinTarget" value={settings.proteinTarget} onChange={handleChange} unit="g" type="number" />
                        <InputItem label="Carbs Target" name="carbsTarget" value={settings.carbsTarget} onChange={handleChange} unit="g" type="number" />
                        <InputItem label="Fat Target" name="fatTarget" value={settings.fatTarget} onChange={handleChange} unit="g" type="number" />
                    </div>
                </Section>

                <Section title="Body Metrics">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                        <InputItem label="Current Weight" name="currentWeight" value={settings.currentWeight} onChange={handleChange} unit="kg" type="number" />
                        <InputItem label="Goal Weight" name="goalWeight" value={settings.goalWeight} onChange={handleChange} unit="kg" type="number" />
                    </div>
                </Section>

                <Section title="App Preferences">
                    <div className="p-4 flex items-center justify-between border-b border-white/5 bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors">
                        <span className="text-sm font-medium text-white">Notifications</span>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input
                                type="checkbox"
                                name="notifications"
                                id="toggle"
                                checked={settings.notifications}
                                onChange={handleChange}
                                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer duration-300 ease-in-out"
                                style={{ right: settings.notifications ? '0' : '50%', borderColor: settings.notifications ? '#3b82f6' : '#525252' }}
                            />
                            <label htmlFor="toggle" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-300 ${settings.notifications ? 'bg-blue-600' : 'bg-neutral-700'}`}></label>
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between bg-neutral-900/50 hover:bg-neutral-800/50 transition-colors cursor-not-allowed opacity-60">
                        <span className="text-sm font-medium text-white">Dark Mode</span>
                        <span className="text-xs text-blue-400 font-bold uppercase">On</span>
                    </div>
                </Section>

                <div className="mt-4 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex justify-between items-center group cursor-pointer hover:bg-red-500/10 transition-colors">
                    <div>
                        <h3 className="text-red-400 font-bold mb-1">Danger Zone</h3>
                        <p className="text-red-400/60 text-xs">Irreversible actions for your account</p>
                    </div>
                    <button
                        onClick={() => {
                            toast("Are you sure?", {
                                description: "This will permanently delete all your data.",
                                action: {
                                    label: "Reset",
                                    onClick: () => handleReset(),
                                },
                                cancel: {
                                    label: "Cancel",
                                },
                                duration: 5000,
                            });
                        }}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-bold group-hover:bg-red-500 group-hover:text-white transition-all">
                        Reset Account
                    </button>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, children }) => (
    <div className="space-y-4">
        <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest ml-1 flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-500"></div> {title}
        </h2>
        <div className="bg-neutral-900/40 rounded-[2rem] overflow-hidden border border-white/5 backdrop-blur-xl shadow-xl">
            {children}
        </div>
    </div>
);

const InputItem = ({ label, name, value, onChange, unit, type = "text" }) => (
    <div className="flex items-center justify-between p-6 bg-transparent hover:bg-white/[0.02] transition-colors group focus-within:bg-white/[0.04]">
        <label className="text-sm font-bold text-gray-300 group-focus-within:text-white transition-colors">{label}</label>
        <div className="flex items-center gap-3 bg-neutral-950/50 px-4 py-2 rounded-xl border border-white/5 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-inner">
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className="bg-transparent text-right text-white font-bold w-full max-w-[80px] focus:outline-none text-lg"
            />
            <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">{unit}</span>
        </div>
    </div>
);

export default Profile;
