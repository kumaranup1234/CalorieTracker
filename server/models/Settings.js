import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    userId: { type: String, default: 'default_user' }, // Placeholder for future auth
    name: { type: String, default: 'Anup' },
    program: { type: String, default: 'Muscle Gain' },
    calorieTarget: { type: Number, default: 2500 },
    proteinTarget: { type: Number, default: 180 },
    carbsTarget: { type: Number, default: 250 },
    fatTarget: { type: Number, default: 80 },
    currentWeight: { type: Number, default: 75.5 },
    goalWeight: { type: Number, default: 80 },
    theme: { type: String, default: 'dark' },
    notifications: { type: Boolean, default: true },
    weeklyBurnGoal: { type: Number, default: 2000 },
    waterGoal: { type: Number, default: 3000 }
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
