/**
 * Luminary AI - Database Helper for Telegram Bot
 * Supabase integration for bot commands, queries, and data operations
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

'use strict';

// ============================================================
// DEPENDENCIES
// ============================================================

const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURATION
// ============================================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://csjtpzptvqoomotqbeuh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_NAME = process.env.APP_NAME || 'Luminary AI';

// ============================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================

let supabase = null;
let isConnected = false;
let connectionError = null;

function initDatabase() {
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        try {
            supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'x-application-name': 'luminary-ai-bot',
                        'x-client-version': '6.0.0'
                    }
                }
            });
            isConnected = true;
            console.log('✅ Bot DB: Supabase connected successfully');
            console.log('🔗 URL:', SUPABASE_URL);
            return true;
        } catch (err) {
            isConnected = false;
            connectionError = err.message;
            console.error('❌ Bot DB: Supabase initialization failed:', err.message);
            return false;
        }
    } else {
        isConnected = false;
        connectionError = 'Missing credentials';
        console.warn('⚠️ Bot DB: Supabase credentials not configured');
        console.warn('💡 Bot will run in standalone mode with demo data');
        return false;
    }
}

/**
 * Check if database is connected
 * @returns {boolean}
 */
function isDBConnected() {
    return isConnected && supabase !== null;
}

/**
 * Get database connection status
 * @returns {Object}
 */
function getDBStatus() {
    return {
        connected: isConnected,
        error: connectionError,
        url: SUPABASE_URL ? 'Configured' : 'Not configured',
        timestamp: new Date().toISOString()
    };
}

/**
 * Test database connection with a simple query
 * @returns {Promise<Object>}
 */
async function testConnection() {
    if (!isDBConnected()) {
        return { success: false, error: 'Database not connected', count: 0 };
    }

    try {
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        return {
            success: true,
            error: null,
            count: count || 0,
            message: 'Database connection successful. Profiles count: ' + (count || 0)
        };
    } catch (err) {
        return {
            success: false,
            error: err.message,
            count: 0,
            message: 'Connection test failed: ' + err.message
        };
    }
}

// ============================================================
// STATISTICS FUNCTIONS
// ============================================================

/**
 * Get comprehensive system statistics
 * @returns {Promise<Object|null>}
 */
async function getStats() {
    if (!isDBConnected()) return getDemoStats();

    try {
        const today = new Date().toISOString().split('T')[0];
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString();

        const [
            totalUsersResult,
            freeUsersResult,
            proUsersResult,
            pendingPaymentsResult,
            todayGenerationsResult,
            totalGenerationsResult,
            monthlyRevenueResult,
            newUsersThisMonthResult,
            activeUsersTodayResult,
            bannedUsersResult
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'free'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
            supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today),
            supabase.from('generations').select('*', { count: 'exact', head: true }),
            supabase.from('payment_requests').select('amount').eq('status', 'approved').gte('created_at', firstOfMonth),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', firstOfMonth),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('last_active_at', today),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true)
        ]);

        const monthlyRevenue = (monthlyRevenueResult.data || []).reduce(
            (sum, p) => sum + (parseFloat(p.amount) || 0), 0
        );

        return {
            totalUsers: totalUsersResult.count || 0,
            freeUsers: freeUsersResult.count || 0,
            proUsers: proUsersResult.count || 0,
            pendingPayments: pendingPaymentsResult.count || 0,
            todayGenerations: todayGenerationsResult.count || 0,
            totalGenerations: totalGenerationsResult.count || 0,
            monthlyRevenue: monthlyRevenue.toFixed(2),
            newUsersThisMonth: newUsersThisMonthResult.count || 0,
            activeUsersToday: activeUsersTodayResult.count || 0,
            bannedUsers: bannedUsersResult.count || 0,
            proPercentage: totalUsersResult.count > 0
                ? ((proUsersResult.count / totalUsersResult.count) * 100).toFixed(1)
                : '0.0',
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error('❌ getStats error:', err.message);
        return getDemoStats();
    }
}

function getDemoStats() {
    const totalUsers = Math.floor(Math.random() * 5000) + 1000;
    const proUsers = Math.floor(Math.random() * 500) + 100;
    return {
        totalUsers: totalUsers,
        freeUsers: totalUsers - proUsers,
        proUsers: proUsers,
        pendingPayments: Math.floor(Math.random() * 20) + 1,
        todayGenerations: Math.floor(Math.random() * 500) + 50,
        totalGenerations: Math.floor(Math.random() * 50000) + 10000,
        monthlyRevenue: (Math.random() * 5000 + 500).toFixed(2),
        newUsersThisMonth: Math.floor(Math.random() * 200) + 50,
        activeUsersToday: Math.floor(Math.random() * 300) + 100,
        bannedUsers: Math.floor(Math.random() * 5),
        proPercentage: ((proUsers / totalUsers) * 100).toFixed(1),
        isDemo: true,
        timestamp: new Date().toISOString()
    };
}

// ============================================================
// USER FUNCTIONS
// ============================================================

/**
 * Get users list with pagination
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page
 * @returns {Promise<Object>}
 */
async function getUsers(page = 1, limit = 15) {
    if (!isDBConnected()) {
        return {
            users: getDemoUsers(),
            total: 5,
            page: 1,
            totalPages: 1,
            isDemo: true
        };
    }

    try {
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            users: data || [],
            total: count || 0,
            page: page,
            totalPages: Math.ceil((count || 0) / limit),
            isDemo: false
        };
    } catch (err) {
        console.error('❌ getUsers error:', err.message);
        return {
            users: getDemoUsers(),
            total: 5,
            page: 1,
            totalPages: 1,
            isDemo: true
        };
    }
}

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
async function getUserByEmail(email) {
    if (!isDBConnected()) {
        const demoUsers = getDemoUsers();
        return demoUsers.find(u => u.email === email) || null;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .ilike('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (err) {
        console.error('❌ getUserByEmail error:', err.message);
        return null;
    }
}

/**
 * Get user by ID
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
async function getUserById(userId) {
    if (!isDBConnected()) {
        const demoUsers = getDemoUsers();
        return demoUsers.find(u => u.user_id === userId || u.id === userId) || null;
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (err) {
        console.error('❌ getUserById error:', err.message);

        // Try by profile id
        try {
            const { data: data2 } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            return data2 || null;
        } catch (e) {
            return null;
        }
    }
}

/**
 * Search users by query
 * @param {string} query
 * @returns {Promise<Array>}
 */
async function searchUsers(query) {
    if (!isDBConnected() || !query) {
        const demoUsers = getDemoUsers();
        if (!query) return demoUsers;
        const q = query.toLowerCase();
        return demoUsers.filter(u =>
            (u.email || '').toLowerCase().includes(q) ||
            (u.full_name || '').toLowerCase().includes(q)
        );
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or('email.ilike.%' + query + '%,full_name.ilike.%' + query + '%')
            .limit(15);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ searchUsers error:', err.message);
        return [];
    }
}

/**
 * Ban a user
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function banUser(userId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Ban user', userId);
        return true;
    }

    try {
        // Try Supabase Auth ban
        try {
            await supabase.auth.admin.updateUserById(userId, {
                ban_duration: '876600h' // ~100 years
            });
        } catch (authErr) {
            console.warn('⚠️ Auth ban failed (may not have admin access):', authErr.message);
        }

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({
                is_banned: true,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        console.log('✅ User banned:', userId);
        return true;
    } catch (err) {
        console.error('❌ banUser error:', err.message);
        return false;
    }
}

/**
 * Unban a user
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function unbanUser(userId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Unban user', userId);
        return true;
    }

    try {
        // Try Supabase Auth unban
        try {
            await supabase.auth.admin.updateUserById(userId, {
                ban_duration: '0h'
            });
        } catch (authErr) {
            console.warn('⚠️ Auth unban failed:', authErr.message);
        }

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .update({
                is_banned: false,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        console.log('✅ User unbanned:', userId);
        return true;
    } catch (err) {
        console.error('❌ unbanUser error:', err.message);
        return false;
    }
}

/**
 * Grant Pro subscription
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function grantPremium(userId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Grant premium to', userId);
        return true;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'pro',
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        console.log('⭐ Premium granted to:', userId);
        return true;
    } catch (err) {
        console.error('❌ grantPremium error:', err.message);
        return false;
    }
}

/**
 * Revoke Pro subscription
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function revokePremium(userId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Revoke premium from', userId);
        return true;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_status: 'free',
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        console.log('⬇️ Premium revoked from:', userId);
        return true;
    } catch (err) {
        console.error('❌ revokePremium error:', err.message);
        return false;
    }
}

/**
 * Reset user's daily credits
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function resetUserCredits(userId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Reset credits for', userId);
        return true;
    }

    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                daily_generations_count: 0,
                last_reset_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) throw error;

        console.log('🔄 Credits reset for:', userId);
        return true;
    } catch (err) {
        console.error('❌ resetUserCredits error:', err.message);
        return false;
    }
}

// ============================================================
// PAYMENT FUNCTIONS
// ============================================================

/**
 * Get pending payment requests
 * @returns {Promise<Array>}
 */
async function getPendingPayments() {
    if (!isDBConnected()) return getDemoPayments();

    try {
        const { data, error } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ getPendingPayments error:', err.message);
        return getDemoPayments();
    }
}

/**
 * Get payment by ID
 * @param {string} paymentId
 * @returns {Promise<Object|null>}
 */
async function getPaymentById(paymentId) {
    if (!isDBConnected()) {
        const demoPayments = getDemoPayments();
        return demoPayments.find(p => p.id === paymentId) || null;
    }

    try {
        const { data, error } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    } catch (err) {
        console.error('❌ getPaymentById error:', err.message);
        return null;
    }
}

/**
 * Approve payment and upgrade user
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
async function approvePayment(paymentId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Approve payment', paymentId);
        return { success: true, message: 'Payment approved (demo mode)' };
    }

    try {
        // Get payment details
        const payment = await getPaymentById(paymentId);

        if (!payment) {
            return { success: false, error: 'Payment not found' };
        }

        if (payment.status !== 'pending') {
            return { success: false, error: 'Payment already processed: ' + payment.status };
        }

        // Update payment status
        await supabase
            .from('payment_requests')
            .update({
                status: 'approved',
                updated_at: new Date().toISOString()
            })
            .eq('id', paymentId);

        // Upgrade user to Pro
        if (payment.user_id) {
            await grantPremium(payment.user_id);
        }

        console.log('✅ Payment approved:', paymentId);
        return {
            success: true,
            message: 'Payment approved and user upgraded to Pro',
            payment: payment
        };
    } catch (err) {
        console.error('❌ approvePayment error:', err.message);
        return { success: false, error: err.message };
    }
}

/**
 * Reject a payment
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
async function rejectPayment(paymentId) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Reject payment', paymentId);
        return { success: true, message: 'Payment rejected (demo mode)' };
    }

    try {
        const payment = await getPaymentById(paymentId);

        if (!payment) {
            return { success: false, error: 'Payment not found' };
        }

        if (payment.status !== 'pending') {
            return { success: false, error: 'Payment already processed: ' + payment.status };
        }

        await supabase
            .from('payment_requests')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', paymentId);

        console.log('❌ Payment rejected:', paymentId);
        return {
            success: true,
            message: 'Payment rejected',
            payment: payment
        };
    } catch (err) {
        console.error('❌ rejectPayment error:', err.message);
        return { success: false, error: err.message };
    }
}

// ============================================================
// GENERATION FUNCTIONS
// ============================================================

/**
 * Get generation history
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getGenerations(page = 1, limit = 15) {
    if (!isDBConnected()) {
        return [
            { id: 'g1', user_id: 'u1', prompt: 'Translate to Kurdish', language: 'KU-SO', task: 'translate', created_at: new Date().toISOString() },
            { id: 'g2', user_id: 'u2', prompt: 'Write a blog post about AI', language: 'EN', task: 'generate', created_at: new Date().toISOString() }
        ];
    }

    try {
        const offset = (page - 1) * limit;

        const { data, error } = await supabase
            .from('generations')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ getGenerations error:', err.message);
        return [];
    }
}

/**
 * Save a generation to history
 * @param {Object} generationData
 * @returns {Promise<Object|null>}
 */
async function saveGeneration(generationData) {
    if (!isDBConnected()) {
        console.log('📝 Demo: Save generation');
        return { id: 'demo-' + Date.now(), ...generationData };
    }

    try {
        const { data, error } = await supabase
            .from('generations')
            .insert({
                user_id: generationData.userId,
                prompt: generationData.prompt,
                response: generationData.response,
                language: generationData.language || 'EN',
                task: generationData.task || 'generate',
                model: generationData.model || 'gemini-1.5-flash',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('❌ saveGeneration error:', err.message);
        return null;
    }
}

// ============================================================
// BROADCAST FUNCTIONS
// ============================================================

/**
 * Get all user emails/IDs for broadcast
 * @returns {Promise<Array>}
 */
async function getAllUsersForBroadcast() {
    if (!isDBConnected()) {
        return [
            { email: 'demo@luminary.ai', user_id: 'demo1' },
            { email: 'pro@luminary.ai', user_id: 'demo2' }
        ];
    }

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('email, user_id, full_name')
            .not('email', 'is', null);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ getAllUsersForBroadcast error:', err.message);
        return [];
    }
}

/**
 * Get all user Telegram IDs for broadcast
 * @returns {Promise<Array>}
 */
async function getAllTelegramIds() {
    if (!isDBConnected()) return [];

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .not('user_id', 'is', null);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ getAllTelegramIds error:', err.message);
        return [];
    }
}

// ============================================================
// ANALYTICS FUNCTIONS
// ============================================================

/**
 * Get user growth data for charts
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>}
 */
async function getUserGrowth(days = 30) {
    if (!isDBConnected()) return [];

    try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', since.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ getUserGrowth error:', err.message);
        return [];
    }
}

/**
 * Get generations by language
 * @returns {Promise<Array>}
 */
async function getGenerationsByLanguage() {
    if (!isDBConnected()) return [];

    try {
        const { data, error } = await supabase
            .from('generations')
            .select('language');

        if (error) throw error;

        // Count by language
        const counts = {};
        (data || []).forEach(g => {
            counts[g.language] = (counts[g.language] || 0) + 1;
        });

        return Object.entries(counts).map(([lang, count]) => ({
            language: lang,
            count: count
        }));
    } catch (err) {
        console.error('❌ getGenerationsByLanguage error:', err.message);
        return [];
    }
}

/**
 * Get daily active users
 * @param {number} days
 * @returns {Promise<Array>}
 */
async function getDailyActiveUsers(days = 7) {
    if (!isDBConnected()) return [];

    try {
        const since = new Date();
        since.setDate(since.getDate() - days);

        const { data, error } = await supabase
            .from('profiles')
            .select('last_active_at')
            .gte('last_active_at', since.toISOString());

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('❌ getDailyActiveUsers error:', err.message);
        return [];
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getDemoUsers() {
    return [
        {
            id: 'p1', user_id: 'u1', email: 'demo@luminary.ai',
            full_name: 'Demo User', subscription_status: 'free',
            xp_points: 1250, is_banned: false,
            daily_generations_count: 3,
            created_at: '2025-01-15T10:30:00Z',
            last_active_at: new Date().toISOString()
        },
        {
            id: 'p2', user_id: 'u2', email: 'pro@luminary.ai',
            full_name: 'Pro User', subscription_status: 'pro',
            xp_points: 8750, is_banned: false,
            daily_generations_count: 128,
            created_at: '2025-01-10T08:15:00Z',
            last_active_at: new Date().toISOString()
        },
        {
            id: 'p3', user_id: 'u3', email: 'learner@luminary.ai',
            full_name: 'Sara Ahmed', subscription_status: 'free',
            xp_points: 2750, is_banned: false,
            daily_generations_count: 5,
            created_at: '2025-02-20T12:00:00Z',
            last_active_at: new Date().toISOString()
        },
        {
            id: 'p4', user_id: 'u4', email: 'ahmed@luminary.ai',
            full_name: 'Ahmed Hassan', subscription_status: 'pro',
            xp_points: 5200, is_banned: false,
            daily_generations_count: 45,
            created_at: '2025-03-01T09:00:00Z',
            last_active_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'p5', user_id: 'u5', email: 'spam@luminary.ai',
            full_name: 'Banned User', subscription_status: 'free',
            xp_points: 100, is_banned: true,
            daily_generations_count: 0,
            created_at: '2025-04-10T14:00:00Z',
            last_active_at: '2025-04-10T14:00:00Z'
        }
    ];
}

function getDemoPayments() {
    return [
        {
            id: 'pay1', user_id: 'u2', full_name: 'Pro User',
            email: 'pro@luminary.ai', method: 'FIB',
            transaction_id: 'TX987654321', amount: 9.99,
            status: 'pending',
            created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 'pay2', user_id: 'u3', full_name: 'Sara Ahmed',
            email: 'learner@luminary.ai', method: 'FastPay',
            transaction_id: 'TX123456789', amount: 9.99,
            status: 'pending',
            created_at: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: 'pay3', user_id: 'u4', full_name: 'Ahmed Hassan',
            email: 'ahmed@luminary.ai', method: 'USDT',
            transaction_id: '0xabcdef1234567890', amount: 9.99,
            status: 'pending',
            created_at: new Date(Date.now() - 259200000).toISOString()
        }
    ];
}

// ============================================================
// EXPORT MODULE
// ============================================================

// Initialize on load
initDatabase();

module.exports = {
    // Connection
    supabase,
    initDatabase,
    isDBConnected,
    getDBStatus,
    testConnection,

    // Statistics
    getStats,

    // Users
    getUsers,
    getUserByEmail,
    getUserById,
    searchUsers,
    banUser,
    unbanUser,
    grantPremium,
    revokePremium,
    resetUserCredits,

    // Payments
    getPendingPayments,
    getPaymentById,
    approvePayment,
    rejectPayment,

    // Generations
    getGenerations,
    saveGeneration,

    // Broadcast
    getAllUsersForBroadcast,
    getAllTelegramIds,

    // Analytics
    getUserGrowth,
    getGenerationsByLanguage,
    getDailyActiveUsers,

    // Demo data
    getDemoUsers,
    getDemoPayments
};
