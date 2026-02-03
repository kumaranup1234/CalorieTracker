import express from 'express';
import multer from 'multer';
import { analyzeFoodImage, estimateBurn } from './geminiService.js';
import Meal from './models/Meal.js';
import Weight from './models/Weight.js';
import Settings from './models/Settings.js';
import Activity from './models/Activity.js';
import Todo from './models/Todo.js';
import Water from './models/Water.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    },
});
const upload = multer({ storage });

// --- Analysis Routes ---

router.post('/analyze', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const imagePath = req.file.path;
        const analysisResult = await analyzeFoodImage(imagePath, req.file.mimetype);

        res.json({
            ...analysisResult,
            imagePath: imagePath
        });

    } catch (error) {
        console.error('Analysis failed:', error);
        res.status(500).json({ error: 'Failed to analyze food image' });
    }
});

// --- Stats Routes ---
router.get('/stats/weekly', async (req, res) => {
    try {
        const today = new Date();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }

        const meals = await Meal.find({
            date: { $in: last7Days }
        });

        // Group by date
        const dailyTotals = last7Days.map(date => {
            const dayMeals = meals.filter(m => m.date === date);
            const totals = dayMeals.reduce((acc, m) => ({
                cal: acc.cal + (m.calories || 0),
                protein: acc.protein + (m.protein || 0),
                carbs: acc.carbs + (m.carbs || 0),
                fat: acc.fat + (m.fat || 0)
            }), { cal: 0, protein: 0, carbs: 0, fat: 0 });

            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
            return {
                day: dayName,
                date: date,
                cal: totals.cal,
                protein: Math.round(totals.protein),
                carbs: Math.round(totals.carbs),
                fat: Math.round(totals.fat)
            };
        });

        res.json(dailyTotals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Meal Routes ---

router.get('/meals', async (req, res) => {
    const { date, limit } = req.query;
    try {
        let query = {};
        if (date) {
            query.date = date;
        }

        let mealsQuery = Meal.find(query).sort({ timestamp: -1 });

        if (limit) {
            mealsQuery = mealsQuery.limit(parseInt(limit));
        }

        const meals = await mealsQuery;
        res.json(meals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/meals', async (req, res) => {
    try {
        const meal = new Meal(req.body);
        const savedMeal = await meal.save();
        res.json(savedMeal);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/meals/:id', async (req, res) => {
    try {
        await Meal.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Weight Routes ---

router.get('/weight', async (req, res) => {
    try {
        const logs = await Weight.find().sort({ date: -1 }).limit(30);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/weight', async (req, res) => {
    try {
        const weight = new Weight(req.body);
        const savedWeight = await weight.save();
        res.json(savedWeight);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Settings Routes ---

router.get('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/settings', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Activity Routes ---

router.post('/activity/estimate', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    // Explicit server-side validation check
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing in server environment.");
        return res.status(500).json({ error: 'Server configuration error: Missing AI Key' });
    }

    try {
        const estimate = await estimateBurn(query);
        res.json(estimate);
    } catch (error) {
        console.error("Estimate Error:", error);
        res.status(500).json({ error: 'Estimation failed' });
    }
});

router.post('/activity', async (req, res) => {
    try {
        const activity = new Activity(req.body);
        const saved = await activity.save();
        res.json(saved);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/activity', async (req, res) => {
    try {
        const activities = await Activity.find().sort({ timestamp: -1 }).limit(50);
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Todo Routes ---

router.get('/todos', async (req, res) => {
    const { date } = req.query;
    try {
        const query = date ? { date } : {};
        const todos = await Todo.find(query).sort({ timestamp: 1 });
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/todos', async (req, res) => {
    try {
        const todo = new Todo(req.body);
        const saved = await todo.save();
        res.json(saved);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/todos/:id', async (req, res) => {
    try {
        const updated = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/todos/:id', async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- Water Routes ---

router.get('/water', async (req, res) => {
    const { date } = req.query;
    try {
        const query = date ? { date } : {};
        const logs = await Water.find(query).sort({ timestamp: 1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/water', async (req, res) => {
    try {
        const entry = new Water(req.body);
        const saved = await entry.save();
        res.json(saved);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/water/:id', async (req, res) => {
    try {
        await Water.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reset', async (req, res) => {
    try {
        await Meal.deleteMany({});
        await Weight.deleteMany({});
        await Activity.deleteMany({});
        await Todo.deleteMany({});
        await Water.deleteMany({});
        // Optionally reset settings to default instead of deleting
        await Settings.deleteMany({});

        res.json({ success: true, message: 'Account reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
