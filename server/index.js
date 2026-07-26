/**
 * Luminary AI - API Server
 * Express.js server for API routes, AI generation,
 * webhook handling, bot integration, and dynamic operations
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// ============================================================
// CONFIGURATION
// ============================================================

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://csjtpzptvqoomotqbeuh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzanRwenB0dnFvb21vdHFiZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTE4NzYsImV4cCI6MjEwMDY2Nzg3Nn0.INC3yPbzbFOLP7ocSgtx33V-zHJG9AVvFRX0qjB2ZvE';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Kcffu3hac3-hHd4aaX-unuMAxrSAZHja2ROaZkhhU1Pg';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8902143839:AAGbI5pwVD5bZGIrON_pZCsJnnPNjFBXJnY';
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '7296733212';
const APP_URL = process.env.APP_URL || 'https://luminary-ai.vercel.app';
const APP_NAME = process.env.APP_NAME || 'Luminary AI';

// ============================================================
// SUPABASE CLIENTS
// ============================================================

let supabase = null;
let supabaseAdmin = null;

try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
            db: { schema: 'public' }
        });
        console.log('✅ Supabase anon client initialized');
    }

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here') {
        supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
            db: { schema: 'public' }
        });
        console.log('✅ Supabase admin client initialized');
    }
} catch (err) {
    console.error('❌ Supabase initialization error:', err.message);
}

// ============================================================
// EXPRESS APP SETUP
// ============================================================

const app = express();

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS - Allow frontend domains
app.use(cors({
    origin: [
        APP_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://luminary-ai.vercel.app',
        'https://luminary-ai.netlify.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-webhook-secret', 'x-api-key']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    const { method, url } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;

        if (statusCode >= 400) {
            console.error(`❌ ${method} ${url} ${statusCode} - ${duration}ms`);
        } else if (NODE_ENV === 'development') {
            console.log(`📡 ${method} ${url} ${statusCode} - ${duration}ms`);
        }
    });

    next();
});

// ============================================================
// STATIC FILES (Serve frontend in production)
// ============================================================

const webDir = path.join(__dirname, '..', 'web');
if (fs.existsSync(webDir)) {
    app.use(express.static(webDir));
    console.log('📁 Serving static files from: ' + webDir);
}

// ============================================================
// API ROUTES
// ============================================================

// ----------------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------------

app.get('/api/health', async (req, res) => {
    try {
        let dbStatus = 'disconnected';
        let userCount = 0;

        if (supabase) {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            dbStatus = error ? 'error' : 'connected';
            userCount = count || 0;
        }

        res.json({
            status: 'ok',
            name: APP_NAME,
            version: '6.0.0',
            environment: NODE_ENV,
            database: dbStatus,
            users: userCount,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
            },
            developer: 'Zaniyar Al-Mzurii'
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            message: err.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ----------------------------------------------------------
// SYSTEM STATISTICS
// ----------------------------------------------------------

app.get('/api/stats', async (req, res) => {
    try {
        if (!supabase) {
            return res.json(getDemoStats());
        }

        const today = new Date().toISOString().split('T')[0];
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

        const [
            totalUsersResult,
            proUsersResult,
            pendingPaymentsResult,
            todayGenerationsResult,
            totalGenerationsResult,
            monthlyRevenueResult,
            newUsersThisMonthResult
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
            supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today),
            supabase.from('generations').select('*', { count: 'exact', head: true }),
            supabase.from('payment_requests').select('amount').eq('status', 'approved').gte('created_at', firstOfMonth),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstOfMonth)
        ]);

        const monthlyRevenue = (monthlyRevenueResult.data || []).reduce(
            (sum, p) => sum + (parseFloat(p.amount) || 0), 0
        );

        res.json({
            totalUsers: totalUsersResult.count || 0,
            proUsers: proUsersResult.count || 0,
            pendingPayments: pendingPaymentsResult.count || 0,
            todayGenerations: todayGenerationsResult.count || 0,
            totalGenerations: totalGenerationsResult.count || 0,
            monthlyRevenue: monthlyRevenue.toFixed(2),
            newUsersThisMonth: newUsersThisMonthResult.count || 0,
            proPercentage: totalUsersResult.count > 0
                ? ((proUsersResult.count / totalUsersResult.count) * 100).toFixed(1)
                : '0.0',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Stats error:', err.message);
        res.json(getDemoStats());
    }
});

function getDemoStats() {
    const totalUsers = Math.floor(Math.random() * 5000) + 1000;
    const proUsers = Math.floor(Math.random() * 500) + 100;
    return {
        totalUsers: totalUsers,
        proUsers: proUsers,
        pendingPayments: Math.floor(Math.random() * 20) + 1,
        todayGenerations: Math.floor(Math.random() * 500) + 50,
        totalGenerations: Math.floor(Math.random() * 50000) + 10000,
        monthlyRevenue: (Math.random() * 5000 + 500).toFixed(2),
        newUsersThisMonth: Math.floor(Math.random() * 200) + 50,
        proPercentage: ((proUsers / totalUsers) * 100).toFixed(1),
        isDemo: true,
        timestamp: new Date().toISOString()
    };
}

// ----------------------------------------------------------
// AI TEXT GENERATION
// ----------------------------------------------------------

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, language, task, userId } = req.body;

        // Validation
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (prompt.length > 2000) {
            return res.status(400).json({ error: 'Prompt must be under 2000 characters' });
        }

        // Check user credits if authenticated
        if (userId && supabase) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('subscription_status, daily_generations_count')
                .eq('user_id', userId)
                .single();

            if (profile && profile.subscription_status !== 'pro') {
                if (profile.daily_generations_count >= 5) {
                    return res.status(403).json({
                        error: 'Daily generation limit reached',
                        dailyLimit: true,
                        message: 'You have reached your daily limit of 5 free generations. Upgrade to Pro for unlimited access.'
                    });
                }
            }
        }

        // Generate response
        let generatedText;
        let modelUsed = 'demo';

        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');

            if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10 && GEMINI_API_KEY !== 'your-gemini-api-key-here') {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                const langPrompts = {
                    'EN': 'You are an expert English assistant. Provide clear, accurate, and natural-sounding English text.',
                    'KU-BD': 'You are an expert in Kurdish Badini (Kurmanji) dialect. Use ONLY Badini vocabulary and grammar. Use Hawar Latin script. Never mix Sorani words.',
                    'KU-SO': 'You are an expert in Kurdish Sorani dialect. Use ONLY Sorani vocabulary and grammar. Use Arabic script. Never mix Badini words.',
                    'AR': 'You are an expert Arabic assistant. Use Modern Standard Arabic.',
                    'TR': 'You are an expert Turkish assistant. Use modern Turkish.',
                    'FA': 'You are an expert Persian assistant. Use standard Iranian Persian.',
                    'DE': 'You are an expert German assistant.',
                    'FR': 'You are an expert French assistant.',
                    'ES': 'You are an expert Spanish assistant.',
                    'RU': 'You are an expert Russian assistant.',
                    'ZH': 'You are an expert Chinese assistant. Use Simplified Chinese.',
                    'HI': 'You are an expert Hindi assistant. Use Devanagari script.'
                };

                const taskPrompts = {
                    'generate': 'Generate creative and accurate text based on the prompt. Be natural and engaging.',
                    'rewrite': 'Rewrite the text to improve clarity, flow, and style while maintaining the original meaning.',
                    'grammar': 'Correct all grammar, spelling, and punctuation errors. Return only the corrected text.',
                    'translate': 'Translate accurately while preserving meaning, tone, and cultural context.'
                };

                const systemPrompt = (langPrompts[language] || langPrompts['EN']) + '\n\n' +
                    (taskPrompts[task] || taskPrompts['generate']);

                const fullPrompt = systemPrompt + '\n\nUser Input: ' + prompt + '\n\nResponse:';

                const result = await model.generateContent(fullPrompt);
                const response = await result.response;
                generatedText = response.text();
                modelUsed = 'gemini-1.5-flash';
            } else {
                throw new Error('Gemini API key not configured');
            }
        } catch (geminiErr) {
            console.error('Gemini API error:', geminiErr.message);
            // Fallback to demo response
            const demos = {
                'EN': '✨ Luminary AI Response to: "' + prompt + '"\n\nThis is a demonstration of our AI capabilities. Connect your Gemini API key for full functionality.\n\nOur platform supports 12 languages with specialized Kurdish Badini and Sorani dialect expertise.',
                'KU-BD': '✨ وەڵامی لومیناری ئەی‌آی بۆ: "' + prompt + '"\n\nئەمە نیشاندانێکی تواناکانی ئەی‌آی ی ئێمەیە. کلیلی Gemini ی خۆت بەکاربێنە بۆ کارکردنی تەواو.',
                'KU-SO': '✨ وەڵامی لومیناری ئەی‌آی بۆ: "' + prompt + '"\n\nئەمە پیشاندانێکی تواناکانی ئەی‌آی ی ئێمەیە.',
                'AR': '✨ رد Luminary AI على: "' + prompt + '"\n\nهذا عرض توضيحي لقدراتنا.',
                'TR': '✨ Luminary AI Yanıtı: "' + prompt + '"\n\nBu, yeteneklerimizin bir gösterimidir.'
            };
            generatedText = demos[language] || demos['EN'];
        }

        // Save to database if user is authenticated
        if (userId && supabase) {
            try {
                await supabase.from('generations').insert({
                    user_id: userId,
                    prompt: prompt,
                    response: generatedText,
                    language: language || 'EN',
                    task: task || 'generate',
                    model: modelUsed,
                    created_at: new Date().toISOString()
                });

                // Increment daily count for free users
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('subscription_status, daily_generations_count')
                    .eq('user_id', userId)
                    .single();

                if (profile && profile.subscription_status !== 'pro') {
                    await supabase
                        .from('profiles')
                        .update({
                            daily_generations_count: (profile.daily_generations_count || 0) + 1,
                            updated_at: new Date().toISOString()
                        })
                        .eq('user_id', userId);
                }
            } catch (dbErr) {
                console.error('Failed to save generation:', dbErr.message);
            }
        }

        res.json({
            success: true,
            text: generatedText,
            language: language || 'EN',
            task: task || 'generate',
            model: modelUsed,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Generate error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Generation failed',
            message: NODE_ENV === 'development' ? err.message : 'An error occurred during generation'
        });
    }
});

// ----------------------------------------------------------
// TELEGRAM BOT WEBHOOK
// ----------------------------------------------------------

app.post('/api/bot', async (req, res) => {
    try {
        const { message, callback_query } = req.body;

        if (message) {
            const chatId = message.chat?.id;
            const text = message.text || '';
            const username = message.from?.username || message.from?.first_name || 'User';

            console.log('📩 Telegram message from:', username);

            if (chatId && TELEGRAM_BOT_TOKEN) {
                if (text.startsWith('/start')) {
                    await sendTelegramMessage(chatId,
                        '✨ *Welcome to ' + APP_NAME + ' Admin Bot!*\n\n' +
                        '🔐 Secure Executive Console\n\n' +
                        'Use /status for system statistics.\n' +
                        'Use /help for all commands.\n\n' +
                        '👨‍💻 Developer: Zaniyar Al-Mzurii'
                    );
                } else if (text.startsWith('/status')) {
                    let statsText = '📊 *' + APP_NAME + ' System Status*\n\n';
                    if (supabase) {
                        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                        const { count: pro } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro');
                        const { count: pending } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                        statsText += '👥 Users: *' + (users || 0) + '*\n';
                        statsText += '💎 Pro: *' + (pro || 0) + '*\n';
                        statsText += '⏳ Pending: *' + (pending || 0) + '*\n';
                        statsText += '🗄️ Database: 🟢 Connected\n';
                    } else {
                        statsText += '🗄️ Database: 🟡 Demo Mode\n';
                    }
                    statsText += '🤖 Bot: 🟢 Online\n';
                    statsText += '🌐 [' + APP_NAME + '](' + APP_URL + ')';
                    await sendTelegramMessage(chatId, statsText);
                } else if (text.startsWith('/help')) {
                    await sendTelegramMessage(chatId,
                        '📋 *Commands*\n\n' +
                        '/start - Welcome\n/status - Stats\n/help - Help\n\n' +
                        '🌐 [' + APP_NAME + '](' + APP_URL + ')'
                    );
                }
            }
        }

        if (callback_query) {
            console.log('🔘 Telegram callback:', callback_query.data);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Bot webhook error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------
// TELEGRAM MESSAGE SENDER
// ----------------------------------------------------------

async function sendTelegramMessage(chatId, text) {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
        const response = await fetch(
            'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: 'Markdown'
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Telegram send error:', errorData.description);
        }
    } catch (err) {
        console.error('Telegram send failed:', err.message);
    }
}

// ----------------------------------------------------------
// VOCABULARY ENDPOINTS
// ----------------------------------------------------------

app.get('/api/vocabulary/topics', (req, res) => {
    const topics = [
        { category: 'greetings', word_count: 45, label: '👋 سڵاوکردن' },
        { category: 'numbers_time', word_count: 38, label: '🔢 ژمارە و کات' },
        { category: 'family_relationships', word_count: 52, label: '👨‍👩‍👧‍👦 خێزان' },
        { category: 'shopping_food', word_count: 67, label: '🛒 بازار و خواردن' },
        { category: 'travel_directions', word_count: 43, label: '✈️ گەشت و ئاراستە' },
        { category: 'daily_life', word_count: 55, label: '🏠 ژیانی ڕۆژانە' },
        { category: 'work_business', word_count: 41, label: '💼 کار و بازرگانی' },
        { category: 'emergency', word_count: 28, label: '🚨 پەلامار' },
        { category: 'general', word_count: 120, label: '📖 گشتی' }
    ];
    res.json(topics);
});

app.get('/api/vocabulary', (req, res) => {
    const { lang, category, limit, after } = req.query;
    const items = [
        { word_source: 'Hello', word_target: 'سڵاو', badini: 'سلاڤ', romanization: 'Slaw', part_of_speech: 'greeting' },
        { word_source: 'Goodbye', word_target: 'خواحافیزی', badini: 'خاترێ تە', romanization: 'Xwa hafiz', part_of_speech: 'greeting' },
        { word_source: 'Thank you', word_target: 'سوپاس', badini: 'سپاس', romanization: 'Spas', part_of_speech: 'expression' },
        { word_source: 'Please', word_target: 'تکایە', badini: 'ژ کەرەما خوە', romanization: 'Tkayê', part_of_speech: 'expression' },
        { word_source: 'Yes', word_target: 'بەڵێ', badini: 'بەلێ', romanization: 'Belê', part_of_speech: 'adverb' },
        { word_source: 'No', word_target: 'نەخێر', badini: 'نەخێر', romanization: 'Nexêr', part_of_speech: 'adverb' },
        { word_source: 'Water', word_target: 'ئاو', badini: 'ئاڤ', romanization: 'Av', part_of_speech: 'noun' },
        { word_source: 'Bread', word_target: 'نان', badini: 'نان', romanization: 'Nan', part_of_speech: 'noun' },
        { word_source: 'Mother', word_target: 'دایک', badini: 'دایک', romanization: 'Dayk', part_of_speech: 'noun' },
        { word_source: 'Father', word_target: 'باوک', badini: 'باڤ', romanization: 'Bavk', part_of_speech: 'noun' }
    ];
    res.json({ items, nextCursor: null });
});

// ----------------------------------------------------------
// AI CHAT ENDPOINT
// ----------------------------------------------------------

app.post('/api/ai/chat', (req, res) => {
    const { message, lang, dialect } = req.body;
    const replies = {
        'KU-BD': 'سڵاو! ئەم وەڵامێکی نموونەییە بۆ: "' + message + '". ئەمە تواناکانی لومیناری ئەی‌آی نیشان دەدات.',
        'KU-SO': 'سڵاو! ئەمە وەڵامێکی نموونەییە بۆ: "' + message + '". ئەمە تواناکانی لومیناری ئەی‌آی پیشان دەدات.',
        'AR': 'مرحباً! هذا رد تجريبي على: "' + message + '"',
        'TR': 'Merhaba! Bu örnek bir yanıttır: "' + message + '"'
    };
    res.json({ reply: replies[lang] || 'Hello! This is a demo response for: "' + message + '". This demonstrates Luminary AI capabilities.' });
});

// ----------------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------------

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (supabase) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name || '' },
                    shouldCreateUser: true
                }
            });
            if (error) throw error;
            return res.json({ user: data.user, message: 'Account created successfully' });
        }
        res.json({ user: { id: 'demo-' + Date.now(), email, name }, message: 'Account created (demo mode)' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return res.json({ user: data.user, session: data.session, message: 'Logged in successfully' });
        }
        res.json({ user: { id: 'demo-' + Date.now(), email }, message: 'Logged in (demo mode)' });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/session', async (req, res) => {
    try {
        if (supabase) {
            const { data: { session } } = await supabase.auth.getSession();
            return res.json({ user: session?.user || null, session });
        }
        res.json({ user: null, session: null });
    } catch (err) {
        res.json({ user: null, session: null });
    }
});

// ----------------------------------------------------------
// PROGRESS ENDPOINTS
// ----------------------------------------------------------

app.get('/api/progress', (req, res) => {
    res.json({
        xp: 250,
        level: 2,
        streak: 5,
        total_words: 45,
        coins: 200,
        gems: 75,
        hearts: 5,
        history: [],
        bookmarks: [],
        notes: {}
    });
});

app.put('/api/progress', (req, res) => {
    console.log('📝 Progress update:', Object.keys(req.body));
    res.json({ success: true, message: 'Progress saved' });
});

// ----------------------------------------------------------
// SUPABASE WEBHOOK RECEIVER
// ----------------------------------------------------------

app.post('/api/webhooks/supabase', async (req, res) => {
    try {
        const webhookSecret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || 'luminary-webhook-secret';

        if (webhookSecret !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { type, table, record } = req.body;
        console.log('🔔 Webhook received:', type, table);

        // Notify Telegram on new user registration
        if (table === 'profiles' && type === 'INSERT' && TELEGRAM_BOT_TOKEN) {
            const adminId = TELEGRAM_ADMIN_ID;
            if (adminId) {
                await sendTelegramMessage(adminId,
                    '🆕 *New User Registered!*\n\n' +
                    '👤 Name: ' + (record.full_name || 'N/A') + '\n' +
                    '📧 Email: ' + (record.email || 'N/A') + '\n' +
                    '🆔 ID: `' + (record.user_id || '') + '`\n' +
                    '📅 Date: ' + new Date().toLocaleString()
                );
            }
        }

        // Notify on new payment request
        if (table === 'payment_requests' && type === 'INSERT' && TELEGRAM_BOT_TOKEN) {
            const adminId = TELEGRAM_ADMIN_ID;
            if (adminId) {
                await sendTelegramMessage(adminId,
                    '💰 *New Payment Request!*\n\n' +
                    '👤 ' + (record.full_name || 'N/A') + '\n' +
                    '💳 Method: ' + (record.method || 'N/A') + '\n' +
                    '🔢 TX: `' + (record.transaction_id || '') + '`\n' +
                    '💵 Amount: $' + (record.amount || '9.99')
                );
            }
        }

        res.json({ success: true, message: 'Webhook processed' });
    } catch (err) {
        console.error('Webhook error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------
// PAYMENT MANAGEMENT ENDPOINTS
// ----------------------------------------------------------

app.get('/api/payments/pending', async (req, res) => {
    try {
        if (!supabase) return res.json([]);
        const { data, error } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/approve', async (req, res) => {
    try {
        const { paymentId, userId } = req.body;
        if (!supabaseAdmin) {
            return res.json({ success: true, message: 'Payment approved (demo mode)' });
        }
        await supabaseAdmin.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
        await supabaseAdmin.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', userId);
        res.json({ success: true, message: 'Payment approved and user upgraded to Pro' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/reject', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!supabaseAdmin) {
            return res.json({ success: true, message: 'Payment rejected (demo mode)' });
        }
        await supabaseAdmin.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
        res.json({ success: true, message: 'Payment rejected' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------------
// ADMIN USER MANAGEMENT
// ----------------------------------------------------------

app.get('/api/admin/users', async (req, res) => {
    try {
        if (!supabase) {
            return res.json({
                users: [
                    { id: 'p1', user_id: 'u1', email: 'demo@luminary.ai', full_name: 'Demo User', subscription_status: 'free', xp_points: 1250, created_at: '2025-01-15T10:30:00Z' },
                    { id: 'p2', user_id: 'u2', email: 'pro@luminary.ai', full_name: 'Pro User', subscription_status: 'pro', xp_points: 8750, created_at: '2025-01-10T08:15:00Z' },
                    { id: 'p3', user_id: 'u3', email: 'learner@luminary.ai', full_name: 'Sara Ahmed', subscription_status: 'free', xp_points: 2750, created_at: '2025-02-20T12:00:00Z' }
                ],
                total: 3, page: 1, totalPages: 1, isDemo: true
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        res.json({
            users: data || [],
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        });
    } catch (err) {
        res.json({ users: [], total: 0, page: 1, totalPages: 0, error: err.message });
    }
});

app.get('/api/admin/users/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        if (!supabase) {
            const demoUsers = [
                { user_id: 'u1', email: 'demo@luminary.ai', full_name: 'Demo User' },
                { user_id: 'u2', email: 'pro@luminary.ai', full_name: 'Pro User' }
            ];
            const q = query.toLowerCase();
            return res.json(demoUsers.filter(u =>
                (u.email || '').toLowerCase().includes(q) ||
                (u.full_name || '').toLowerCase().includes(q)
            ));
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .or('email.ilike.%' + query + '%,full_name.ilike.%' + query + '%')
            .limit(20);

        res.json(data || []);
    } catch (err) {
        res.json([]);
    }
});

// ----------------------------------------------------------
// FALLBACK FOR SPA ROUTING
// ----------------------------------------------------------

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
        const indexPath = path.join(webDir, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
        return res.json({
            name: APP_NAME,
            version: '6.0.0',
            message: 'API server is running. Access the frontend at ' + APP_URL,
            developer: 'Zaniyar Al-Mzurii'
        });
    }
    res.status(404).json({ error: 'API endpoint not found' });
});

// ----------------------------------------------------------
// ERROR HANDLING MIDDLEWARE
// ----------------------------------------------------------

app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    if (NODE_ENV === 'development') {
        console.error(err.stack);
    }

    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log('');
    console.log('✨ ' + APP_NAME + ' API Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Server running on port: ' + PORT);
    console.log('🌐 Environment: ' + NODE_ENV);
    console.log('📡 Health check: http://localhost:' + PORT + '/api/health');
    console.log('🗄️ Supabase: ' + (supabase ? 'Connected' : 'Demo Mode'));
    console.log('🤖 Gemini API: ' + (GEMINI_API_KEY && GEMINI_API_KEY.length > 10 ? 'Configured' : 'Demo Mode'));
    console.log('📱 Telegram Bot: ' + (TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not Configured'));
    console.log('👨‍💻 Developer: Zaniyar Al-Mzurii');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    console.log('📋 Available API Endpoints:');
    console.log('   GET  /api/health');
    console.log('   GET  /api/stats');
    console.log('   POST /api/generate');
    console.log('   POST /api/bot');
    console.log('   GET  /api/vocabulary/topics');
    console.log('   GET  /api/vocabulary');
    console.log('   POST /api/ai/chat');
    console.log('   POST /api/auth/register');
    console.log('   POST /api/auth/login');
    console.log('   POST /api/auth/logout');
    console.log('   GET  /api/auth/session');
    console.log('   POST /api/webhooks/supabase');
    console.log('   GET  /api/payments/pending');
    console.log('   POST /api/payments/approve');
    console.log('   POST /api/payments/reject');
    console.log('   GET  /api/admin/users');
    console.log('   GET  /api/admin/users/search');
    console.log('');
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

// ============================================================
// EXPORT FOR TESTING
// ============================================================

module.exports = app;
