import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema({
    date: {
        type: String, // YYYY-MM-DD
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    meal_name: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        required: true
    },
    protein: Number,
    carbs: Number,
    fat: Number,
    image_path: String,
    analysis_raw: mongoose.Schema.Types.Mixed // Store the full JSON from API just in case
});

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;
