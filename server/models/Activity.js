import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
    userId: { type: String, default: 'default_user' },
    name: { type: String, required: true }, // e.g., "Running", "Weight Lifting"
    description: { type: String }, // Raw input e.g., "Ran 5km in 30 mins"
    caloriesBurned: { type: Number, required: true },
    durationMinutes: { type: Number, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD for easier querying
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['manual', 'ai'], default: 'manual' }
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
