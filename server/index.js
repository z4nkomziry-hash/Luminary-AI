/**
 * Luminary AI - API Server
 * Express.js server for API routes, webhook handling,
 * bot integration, and dynamic operations
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

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://csjtpzptvqoomotqbeuh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzanRwenB0dnFvb21vdHFiZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTE4NzYsImV4cCI6MjEwMDY2Nzg3Nn0.INC3yPbzbFOLP7ocSgtx33V-zHJG9AVvFRX0qjB2ZvE';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6Kcffu3hac3-hHd4aaX-unuMAxrSAZHja2ROaZkhhU1Pg';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8902143839:AAGbI5pwVD5bZGIrON_pZCsJnnPNjFBXJnY';
const APP_URL = process.env.APP_URL || 'https://luminary-ai.vercel.app';
const APP_NAME = process.env.APP_NAME || 'Luminary AI';

let supabase = null;
let supabaseAdmin = null;

try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
            db: { schema: 'public' }
        });
        console.log('✅ Supabase client initialized');
    }
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
            db: { schema: 'public' }
        });
        console.log('✅ Supabase admin client initialized');
    }
} catch (err) {
    console.error('❌ Supabase initialization error:', err.message);
}

const app = express();

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
            console.error(`❌ ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        } else if (NODE_ENV === 'development') {
            console.log(`📡 ${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
});

app.get('/api/health', async (req, res) => {
    try {
        let dbStatus = 'disconnected';
        let userCount = 0;
        if (supabase) {
            const { count, error } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
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
            memory: process.memoryUsage(),
            developer: 'Zaniyar Al-Mzurii'
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        if (!supabase) {
            return res.json({
                totalUsers: Math.floor(Math.random() * 5000) + 1000,
                proUsers: Math.floor(Math.random() * 500) + 100,
                pendingPayments: Math.floor(Math.random() * 20) + 1,
                todayGenerations: Math.floor(Math.random() * 500) + 50,
                monthlyRevenue: (Math.random() * 5000 + 500).toFixed(2),
                isDemo: true,
                timestamp: new Date().toISOString()
            });
        }
        const today = new Date().toISOString().split('T')[0];
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const [totalUsersResult, proUsersResult, pendingPaymentsResult, todayGenerationsResult, monthlyRevenueResult] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
            supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today),
            supabase.from('payment_requests').select('amount').eq('status', 'approved').gte('created_at', firstOfMonth)
        ]);
        const monthlyRevenue = (monthlyRevenueResult.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        res.json({
            totalUsers: totalUsersResult.count || 0,
            proUsers: proUsersResult.count || 0,
            pendingPayments: pendingPaymentsResult.count || 0,
            todayGenerations: todayGenerationsResult.count || 0,
            monthlyRevenue: monthlyRevenue.toFixed(2),
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Stats error:', err.message);
        res.json({
            totalUsers: Math.floor(Math.random() * 5000) + 1000,
            proUsers: Math.floor(Math.random() * 500) + 100,
            pendingPayments: Math.floor(Math.random() * 20) + 1,
            todayGenerations: Math.floor(Math.random() * 500) + 50,
            monthlyRevenue: (Math.random() * 5000 + 500).toFixed(2),
            isDemo: true
        });
    }
});

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, language, task, userId } = req.body;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        if (prompt.length > 2000) {
            return res.status(400).json({ error: 'Prompt must be under 2000 characters' });
        }
        if (userId && supabase) {
            const { data: profile } = await supabase.from('profiles').select('subscription_status, daily_generations_count').eq('user_id', userId).single();
            if (profile && profile.subscription_status !== 'pro' && profile.daily_generations_count >= 5) {
                return res.status(403).json({ error: 'Daily generation limit reached', dailyLimit: true });
            }
        }
        let generatedText;
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            if (GEMINI_API_KEY && GEMINI_API_KEY.length > 10) {
                const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const langPrompts = {
                    'EN': 'You are an expert English assistant.',
                    'KU-BD': 'You are an expert in Kurdish Badini (Kurmanji). Use ONLY Badini vocabulary. Hawar Latin script.',
                    'KU-SO': 'You are an expert in Kurdish Sorani. Use ONLY Sorani vocabulary. Arabic script.',
                    'AR': 'You are an expert Arabic assistant.',
                    'TR': 'You are an expert Turkish assistant.',
                    'FA': 'You are an expert Persian assistant.',
                    'DE': 'You are an expert German assistant.',
                    'FR': 'You are an expert French assistant.',
                    'ES': 'You are an expert Spanish assistant.',
                    'RU': 'You are an expert Russian assistant.',
                    'ZH': 'You are an expert Chinese assistant.',
                    'HI': 'You are an expert Hindi assistant.'
                };
                const taskPrompts = {
                    'generate': 'Generate creative text based on the prompt.',
                    'rewrite': 'Rewrite the text to improve clarity.',
                    'grammar': 'Correct all grammar errors.',
                    'translate': 'Translate accurately.'
                };
                const sysPrompt = (langPrompts[language] || langPrompts['EN']) + '\n\n' + (taskPrompts[task] || taskPrompts['generate']);
                const result = await model.generateContent(sysPrompt + '\n\nUser Input: ' + prompt + '\n\nResponse:');
                generatedText = (await result.response).text();
            } else {
                throw new Error('Gemini API key not configured');
            }
        } catch (geminiErr) {
            console.error('Gemini error:', geminiErr.message);
            const demos = {
                'EN': '✨ Luminary AI Response to: "' + prompt + '"\n\nThis is a demo response. Connect Gemini API for full AI functionality.',
                'KU-BD': '✨ وەڵامی لومیناری ئەی‌آی بۆ: "' + prompt + '"\n\nئەمە وەڵامێکی دیمۆیە.',
                'KU-SO': '✨ وەڵامی لومیناری ئەی‌آی بۆ: "' + prompt + '"\n\nئەمە وەڵامێکی نموونەییە.',
                'AR': '✨ رد Luminary AI: "' + prompt + '"',
                'TR': '✨ Luminary AI Yanıtı: "' + prompt + '"'
            };
            generatedText = demos[language] || demos['EN'];
        }
        if (userId && supabase) {
            await supabase.from('generations').insert({
                user_id: userId, prompt: prompt, response: generatedText,
                language: language || 'EN', task: task || 'generate',
                model: 'gemini-1.5-flash', created_at: new Date().toISOString()
            });
            const { data: profile } = await supabase.from('profiles').select('subscription_status, daily_generations_count').eq('user_id', userId).single();
            if (profile && profile.subscription_status !== 'pro') {
                await supabase.from('profiles').update({
                    daily_generations_count: (profile.daily_generations_count || 0) + 1,
                    updated_at: new Date().toISOString()
                }).eq('user_id', userId);
            }
        }
        res.json({
            success: true,
            text: generatedText,
            language: language || 'EN',
            task: task || 'generate',
            model: 'gemini-1.5-flash',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Generate error:', err.message);
        res.status(500).json({ success: false, error: 'Generation failed', message: err.message });
    }
});

app.post('/api/bot', async (req, res) => {
    try {
        const { message, callback_query } = req.body;
        if (message) {
            console.log('📩 Telegram message:', message.from?.username || message.from?.id);
            const chatId = message.chat?.id;
            const text = message.text || '';
            if (chatId && TELEGRAM_BOT_TOKEN) {
                if (text.startsWith('/start')) {
                    await sendTelegramMessage(chatId, '✨ Welcome to ' + APP_NAME + ' Admin Bot!\n\nUse /status for system stats.\nUse /help for commands.');
                } else if (text.startsWith('/status')) {
                    let statsText = '📊 *' + APP_NAME + ' Status*\n\n';
                    if (supabase) {
                        const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
                        const { count: pro } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro');
                        const { count: pending } = await supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                        statsText += '👥 Users: *' + (users || 0) + '*\n💎 Pro: *' + (pro || 0) + '*\n⏳ Pending: *' + (pending || 0) + '*\n🟢 Online';
                    } else {
                        statsText += '🟡 Demo mode\n🟢 Bot online';
                    }
                    await sendTelegramMessage(chatId, statsText);
                } else if (text.startsWith('/help')) {
                    await sendTelegramMessage(chatId, '📋 Commands:\n/start - Welcome\n/status - Stats\n/help - This help');
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

async function sendTelegramMessage(chatId, text) {
    if (!TELEGRAM_BOT_TOKEN) return;
    try {
        const response = await fetch('https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
        });
        if (!response.ok) {
            const errData = await response.json();
            console.error('Telegram send error:', errData.description);
        }
    } catch (err) {
        console.error('Telegram send failed:', err.message);
    }
}

app.get('/api/vocabulary/topics', (req, res) => {
    res.json([
        { category: 'greetings', word_count: 45, label: '👋 سڵاوکردن' },
        { category: 'numbers_time', word_count: 38, label: '🔢 ژمارە و کات' },
        { category: 'family_relationships', word_count: 52, label: '👨‍👩‍👧‍👦 خێزان' },
        { category: 'shopping_food', word_count: 67, label: '🛒 بازار و خواردن' },
        { category: 'travel_directions', word_count: 43, label: '✈️ گەشت و ئاراستە' },
        { category: 'daily_life', word_count: 55, label: '🏠 ژیانی ڕۆژانە' },
        { category: 'work_business', word_count: 41, label: '💼 کار و بازرگانی' },
        { category: 'emergency', word_count: 28, label: '🚨 پەلامار' },
        { category: 'general', word_count: 120, label: '📖 گشتی' }
    ]);
});

app.get('/api/vocabulary', (req, res) => {
    res.json({
        items: [
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
        ],
        nextCursor: null
    });
});

app.post('/api/ai/chat', (req, res) => {
    const { message, lang } = req.body;
    const replies = {
        'KU-BD': 'سڵاو! ئەم وەڵامێکی نموونەییە بۆ: "' + message + '". ئەمە تواناکانی لومیناری ئەی‌آی نیشان دەدات.',
        'KU-SO': 'سڵاو! ئەمە وەڵامێکی نموونەییە بۆ: "' + message + '".',
        'AR': 'مرحباً! هذا رد تجريبي: "' + message + '"',
        'TR': 'Merhaba! Bu örnek yanıt: "' + message + '"'
    };
    res.json({ reply: replies[lang] || 'Hello! Demo response for: "' + message + '"' });
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        if (supabase) {
            const { data, error } = await supabase.auth.signUp({
                email, password,
                options: { data: { full_name: name || '' }, shouldCreateUser: true }
            });
            if (error) throw error;
            return res.json({ user: data.user, message: 'Account created' });
        }
        res.json({ user: { id: 'demo-' + Date.now(), email, name }, message: 'Account created (demo mode)' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return res.json({ user: data.user, session: data.session, message: 'Logged in' });
        }
        res.json({ user: { id: 'demo-' + Date.now(), email }, message: 'Logged in (demo mode)' });
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out' });
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

app.post('/api/webhooks/supabase', async (req, res) => {
    try {
        const webhookSecret = req.headers['x-webhook-secret'];
        const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || 'luminary-webhook-secret';
        if (webhookSecret !== expectedSecret) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { type, table, record } = req.body;
        console.log('🔔 Webhook:', type, table);
        if (table === 'profiles' && type === 'INSERT' && TELEGRAM_BOT_TOKEN) {
            const adminId = process.env.TELEGRAM_ADMIN_ID || '7296733212';
            await sendTelegramMessage(adminId,
                '🆕 *New User!*\n👤 ' + (record.full_name || 'N/A') + '\n📧 ' + record.email + '\n🆔 `' + (record.user_id || '') + '`'
            );
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/payments/pending', async (req, res) => {
    try {
        if (!supabase) return res.json([]);
        const { data, error } = await supabase.from('payment_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/approve', async (req, res) => {
    try {
        const { paymentId, userId } = req.body;
        if (!supabaseAdmin) return res.json({ success: true, message: 'Demo mode' });
        await supabaseAdmin.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
        await supabaseAdmin.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', userId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments/reject', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!supabaseAdmin) return res.json({ success: true, message: 'Demo mode' });
        await supabaseAdmin.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        const { data, error, count } = await supabase.from('profiles').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
        if (error) throw error;
        res.json({ users: data || [], total: count || 0, page, totalPages: Math.ceil((count || 0) / limit) });
    } catch (err) {
        res.json({ users: [], total: 0, page: 1, totalPages: 0, error: err.message });
    }
});

app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    res.status(err.status || 500).json({ error: 'Internal server error', message: NODE_ENV === 'development' ? err.message : 'Something went wrong' });
});

app.listen(PORT, () => {
    console.log('');
    console.log('✨ ' + APP_NAME + ' API Server');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 Server running on port: ' + PORT);
    console.log('🌐 Environment: ' + NODE_ENV);
    console.log('📡 Health: http://localhost:' + PORT + '/api/health');
    console.log('🗄️ Database: ' + (supabase ? 'Connected' : 'Demo Mode'));
    console.log('🤖 Gemini: ' + (GEMINI_API_KEY && GEMINI_API_KEY.length > 10 ? 'Configured' : 'Not Configured'));
    console.log('📱 Telegram: ' + (TELEGRAM_BOT_TOKEN ? 'Configured' : 'Not Configured'));
    console.log('👨‍💻 Developer: Zaniyar Al-Mzurii');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
});

process.on('SIGINT', () => { console.log('🛑 Shutting down...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('🛑 Shutting down...'); process.exit(0); });

module.exports = app;
