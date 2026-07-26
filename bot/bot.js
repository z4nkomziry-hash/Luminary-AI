/**
 * Luminary AI - Advanced Telegram Admin Bot
 * Elite Private Executive Console with Grammy Framework
 * Full command handlers, broadcasting, payment processing,
 * and Supabase integration
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

'use strict';

// ============================================================
// ENVIRONMENT SETUP
// ============================================================

require('dotenv').config();

// ============================================================
// DEPENDENCIES
// ============================================================

const { Bot, InlineKeyboard, session, GrammyError, HttpError } = require('grammy');
const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURATION
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8902143839:AAGbI5pwVD5bZGIrON_pZCsJnnPNjFBXJnY';
const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || '7296733212').split(',').map(Number).filter(Boolean);
const SUPER_ADMIN_IDS = (process.env.SUPER_ADMIN_IDS || '7296733212').split(',').map(Number).filter(Boolean);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://csjtpzptvqoomotqbeuh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.APP_URL || 'https://luminary-ai.vercel.app';
const APP_NAME = process.env.APP_NAME || 'Luminary AI';
const DEVELOPER_NAME = process.env.DEVELOPER_NAME || 'Zaniyar Al-Mzurii';
const DEVELOPER_TELEGRAM = process.env.DEVELOPER_TELEGRAM || 'https://t.me/z_14x';
const DEVELOPER_WHATSAPP = process.env.DEVELOPER_WHATSAPP || 'https://wa.me/9647506045491';
const DEVELOPER_EMAIL = process.env.DEVELOPER_EMAIL || 'z.14x@outlook.com';

// All authorized user IDs
const ALL_AUTHORIZED_IDS = new Set([...ADMIN_TELEGRAM_IDS, ...SUPER_ADMIN_IDS]);

// ============================================================
// SUPABASE CLIENT
// ============================================================

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            db: {
                schema: 'public'
            }
        });
        console.log('✅ Bot DB: Supabase connected');
    } catch (err) {
        console.error('❌ Bot DB: Supabase connection failed:', err.message);
    }
} else {
    console.warn('⚠️ Bot DB: Supabase not configured. Running in standalone mode.');
}

// ============================================================
// BOT INITIALIZATION
// ============================================================

const bot = new Bot(BOT_TOKEN);

// Session middleware for storing temporary state
bot.use(session({
    initial: () => ({
        awaitingBroadcast: false,
        awaitingSearch: false,
        currentPage: 1,
        lastCommand: null
    })
}));

// ============================================================
// AUTH MIDDLEWARE - Silent Ignore for Unauthorized Users
// ============================================================

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;

    // Check if user is authorized
    if (!userId || !ALL_AUTHORIZED_IDS.has(userId)) {
        // SILENTLY IGNORE - Do not reply at all
        return;
    }

    // Attach role configuration to context
    ctx.config = {
        isSuperAdmin: SUPER_ADMIN_IDS.includes(userId),
        isAdmin: true,
        userId: userId,
        username: ctx.from?.username || 'unknown'
    };

    await next();
});

// ============================================================
// ERROR HANDLER
// ============================================================

bot.catch(async (err) => {
    const ctx = err.ctx;
    console.error('❌ Bot error:', err.message);

    if (err instanceof GrammyError) {
        console.error('Grammy error:', err.description);
    } else if (err instanceof HttpError) {
        console.error('HTTP error:', err.message);
    }

    // Notify admin of critical errors
    if (ctx && ctx.config?.isSuperAdmin) {
        try {
            await ctx.reply('❌ An error occurred: ' + err.message.substring(0, 200));
        } catch (e) {
            // Silent
        }
    }
});

// ============================================================
// /start - Interactive Main Menu with Welcome Message
// ============================================================

bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'Admin';
    const isSuperAdmin = ctx.config?.isSuperAdmin;

    const keyboard = new InlineKeyboard()
        .text('📊 System Status', 'menu_status').row()
        .text('👥 User Management', 'menu_users').row()
        .text('💰 Payment Requests', 'menu_payments').row()
        .text('🤖 AI Generations', 'menu_generations').row()
        .text('🌐 Zîman Engine', 'menu_ziman').row()
        .text('🔍 Search Database', 'menu_search').row();

    if (isSuperAdmin) {
        keyboard.row()
            .text('📢 Broadcast Message', 'menu_broadcast').row()
            .text('⚙️ Bot Settings', 'menu_settings');
    }

    const welcomeMessage =
        '✨ *Welcome to ' + APP_NAME + ' Admin Console*\n\n' +
        '👋 Hello, *' + firstName + '*!\n\n' +
        '🔐 Secure Executive Control Panel\n' +
        '📊 Real-time Platform Management\n' +
        '🤖 AI-Powered Analytics\n' +
        '🛡️ Role: ' + (isSuperAdmin ? '👑 Super Admin' : '🔑 Admin') + '\n\n' +
        '👨‍💻 Developer: [' + DEVELOPER_NAME + '](' + DEVELOPER_TELEGRAM + ')\n' +
        '🌐 [' + APP_NAME + '](' + APP_URL + ')\n\n' +
        'Select an option below or use commands:\n' +
        '/status • /users • /payments • /search • /help';

    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true }
    });

    console.log('👋 /start from:', ctx.from?.username || ctx.from?.id);
});

// ============================================================
// /help - Command List
// ============================================================

bot.command('help', async (ctx) => {
    const isSuperAdmin = ctx.config?.isSuperAdmin;

    let helpText =
        '📋 *' + APP_NAME + ' Bot Commands*\n\n' +
        '🔹 *General Commands*\n' +
        '/start - Main menu with interactive buttons\n' +
        '/help - This help message\n' +
        '/status - System statistics overview\n' +
        '/users - List recent registered users\n' +
        '/payments - View pending payment requests\n' +
        '/generations - View AI generation history\n' +
        '/search <query> - Search users by email or name\n\n' +
        '🔹 *Payment Actions*\n' +
        '/approve <payment_id> - Approve a payment\n' +
        '/reject <payment_id> - Reject a payment\n\n';

    if (isSuperAdmin) {
        helpText +=
            '🔹 *Super Admin Commands*\n' +
            '/broadcast - Send message to all users\n' +
            '/ban <user_id> - Ban a user\n' +
            '/unban <user_id> - Unban a user\n' +
            '/grant <user_id> - Grant Pro subscription\n' +
            '/revoke <user_id> - Revoke Pro subscription\n' +
            '/settings - Bot configuration\n\n';
    }

    helpText +=
        '👨‍💻 Developer: [' + DEVELOPER_NAME + '](' + DEVELOPER_TELEGRAM + ')\n' +
        '🌐 Platform: [' + APP_NAME + '](' + APP_URL + ')';

    await ctx.reply(helpText, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true }
    });
});

// ============================================================
// /status - System Statistics
// ============================================================

bot.command('status', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading system status...*', { parse_mode: 'Markdown' });

    try {
        let stats;

        if (supabase) {
            const today = new Date().toISOString().split('T')[0];
            const [
                { count: totalUsers },
                { count: freeUsers },
                { count: proUsers },
                { count: pendingPayments },
                { count: todayGenerations },
                { count: totalGenerations }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'free'),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
                supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today),
                supabase.from('generations').select('*', { count: 'exact', head: true })
            ]);

            stats = {
                totalUsers: totalUsers || 0,
                freeUsers: freeUsers || 0,
                proUsers: proUsers || 0,
                pendingPayments: pendingPayments || 0,
                todayGenerations: todayGenerations || 0,
                totalGenerations: totalGenerations || 0
            };
        } else {
            stats = {
                totalUsers: Math.floor(Math.random() * 5000) + 1000,
                freeUsers: Math.floor(Math.random() * 4000) + 800,
                proUsers: Math.floor(Math.random() * 500) + 100,
                pendingPayments: Math.floor(Math.random() * 20) + 1,
                todayGenerations: Math.floor(Math.random() * 500) + 50,
                totalGenerations: Math.floor(Math.random() * 50000) + 10000
            };
        }

        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        const uptimeStr = hours + 'h ' + minutes + 'm ' + seconds + 's';

        const dbStatus = supabase ? '🟢 Connected' : '🟡 Demo Mode';

        const statusText =
            '📊 *' + APP_NAME + ' System Status*\n\n' +
            '👥 *Users*\n' +
            '   Total Registered: *' + stats.totalUsers.toLocaleString() + '*\n' +
            '   Free Users: *' + stats.freeUsers.toLocaleString() + '*\n' +
            '   Pro Users: *' + stats.proUsers.toLocaleString() + '*\n\n' +
            '🤖 *AI Activity*\n' +
            '   Today: *' + stats.todayGenerations.toLocaleString() + '*\n' +
            '   Total: *' + stats.totalGenerations.toLocaleString() + '*\n\n' +
            '💰 *Payments*\n' +
            '   Pending: *' + stats.pendingPayments + '*\n\n' +
            '🔧 *System*\n' +
            '   Database: ' + dbStatus + '\n' +
            '   Bot Uptime: *' + uptimeStr + '*\n' +
            '   Platform: 🟢 Online';

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, statusText, {
            parse_mode: 'Markdown',
            link_preview_options: { is_disabled: true }
        });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '❌ *Error loading status*\n\n' + err.message.substring(0, 500),
            { parse_mode: 'Markdown' }
        );
    }

    console.log('📊 /status from:', ctx.from?.username);
});

// ============================================================
// /users - List Recent Users
// ============================================================

bot.command('users', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading users...*', { parse_mode: 'Markdown' });

    try {
        let users = [];

        if (supabase) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(15);

            users = data || [];
        } else {
            users = getDemoUsers();
        }

        if (users.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
                '📭 *No users found*', { parse_mode: 'Markdown' });
            return;
        }

        let text = '👥 *Recent Users (' + users.length + ')*\n\n';

        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            const plan = u.subscription_status === 'pro' ? '💎' : '🆓';
            const status = u.is_banned ? ' 🚫' : '';

            text += (i + 1) + '. ' + plan + ' ' + (u.full_name || 'N/A') + status + '\n';
            text += '   📧 `' + (u.email || 'N/A') + '`\n';
            text += '   🆔 `' + (u.user_id || u.id || 'N/A').substring(0, 12) + '...`\n';
            text += '   ⭐ ' + (u.xp_points || 0) + ' XP | 📅 ' + formatDate(u.created_at) + '\n\n';
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '❌ *Error loading users*\n\n' + err.message.substring(0, 500),
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================================
// /payments - Pending Payment Requests
// ============================================================

bot.command('payments', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading payment requests...*', { parse_mode: 'Markdown' });

    try {
        let payments = [];

        if (supabase) {
            const { data } = await supabase
                .from('payment_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(10);

            payments = data || [];
        } else {
            payments = getDemoPayments();
        }

        if (payments.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
                '📭 *No pending payments*\n\nAll payment requests have been processed. ✅',
                { parse_mode: 'Markdown' });
            return;
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '💰 *Pending Payments (' + payments.length + ')*\n\nSelect a payment to approve or reject:',
            { parse_mode: 'Markdown' });

        // Send each payment as a separate message with action buttons
        for (const p of payments) {
            const keyboard = new InlineKeyboard()
                .text('✅ Approve', 'approve_' + p.id)
                .text('❌ Reject', 'reject_' + p.id);

            const paymentText =
                '💳 *Payment Request*\n\n' +
                '👤 Name: *' + (p.full_name || 'N/A') + '*\n' +
                '📧 Email: `' + (p.email || 'N/A') + '`\n' +
                '💳 Method: *' + (p.method || 'N/A') + '*\n' +
                '🔢 TX ID: `' + (p.transaction_id || 'N/A') + '`\n' +
                '💵 Amount: *$' + (p.amount || '9.99') + '*\n' +
                '📅 Date: ' + formatDate(p.created_at) + '\n' +
                '🆔 Payment ID: `' + p.id + '`';

            try {
                if (p.receipt_url && p.receipt_url.startsWith('http')) {
                    await ctx.replyWithPhoto(p.receipt_url, {
                        caption: paymentText,
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                } else {
                    await ctx.reply(paymentText, {
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    });
                }
            } catch (err) {
                await ctx.reply(paymentText, {
                    parse_mode: 'Markdown',
                    reply_markup: keyboard
                });
            }

            // Small delay to avoid rate limiting
            await sleep(200);
        }
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '❌ *Error loading payments*\n\n' + err.message.substring(0, 500),
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================================
// /generations - AI Generation History
// ============================================================

bot.command('generations', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading generation history...*', { parse_mode: 'Markdown' });

    try {
        let generations = [];

        if (supabase) {
            const { data } = await supabase
                .from('generations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            generations = data || [];
        } else {
            generations = [
                { user_id: 'u1', prompt: 'Translate to Kurdish', language: 'KU-SO', task: 'translate', created_at: new Date().toISOString() },
                { user_id: 'u2', prompt: 'Write a blog post', language: 'EN', task: 'generate', created_at: new Date().toISOString() }
            ];
        }

        if (generations.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
                '📭 *No generations found*', { parse_mode: 'Markdown' });
            return;
        }

        let text = '🤖 *Recent AI Generations (' + generations.length + ')*\n\n';

        for (let i = 0; i < generations.length; i++) {
            const g = generations[i];
            text += (i + 1) + '. 👤 `' + (g.user_id || 'N/A').substring(0, 8) + '...`\n';
            text += '   📝 ' + (g.prompt || 'N/A').substring(0, 60) + '...\n';
            text += '   🌐 ' + (g.language || 'EN') + ' | ' + (g.task || 'generate') + '\n';
            text += '   📅 ' + formatDate(g.created_at) + '\n\n';
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '❌ *Error loading generations*\n\n' + err.message.substring(0, 500),
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================================
// /search <query> - Search Database
// ============================================================

bot.command('search', async (ctx) => {
    const query = ctx.message?.text?.replace('/search', '').trim();

    if (!query) {
        await ctx.reply(
            '🔍 *Search Database*\n\n' +
            'Please provide a search query.\n\n' +
            'Example: `/search user@email.com`\n' +
            'Example: `/search John`',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    const loadingMsg = await ctx.reply('🔍 *Searching: "' + query + '"...*', { parse_mode: 'Markdown' });

    try {
        let results = [];

        if (supabase) {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .or('email.ilike.%' + query + '%,full_name.ilike.%' + query + '%')
                .limit(10);

            results = data || [];
        } else {
            const demoUsers = getDemoUsers();
            results = demoUsers.filter(u =>
                (u.email || '').toLowerCase().includes(query.toLowerCase()) ||
                (u.full_name || '').toLowerCase().includes(query.toLowerCase())
            );
        }

        if (results.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
                '📭 *No results found for:* "' + query + '"', { parse_mode: 'Markdown' });
            return;
        }

        let text = '🔍 *Search Results (' + results.length + ')*\n\n';

        for (let i = 0; i < results.length; i++) {
            const u = results[i];
            const plan = u.subscription_status === 'pro' ? '💎 Pro' : '🆓 Free';

            text += (i + 1) + '. 👤 *' + (u.full_name || 'N/A') + '*\n';
            text += '   📧 `' + (u.email || 'N/A') + '`\n';
            text += '   🆔 `' + (u.user_id || u.id || 'N/A') + '`\n';
            text += '   ⭐ ' + plan + ' | XP: ' + (u.xp_points || 0) + '\n';
            text += '   📅 Joined: ' + formatDate(u.created_at) + '\n\n';
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '❌ *Search error*\n\n' + err.message.substring(0, 500),
            { parse_mode: 'Markdown' }
        );
    }
});

// ============================================================
// /approve <payment_id> - Approve Payment
// ============================================================

bot.command('approve', async (ctx) => {
    const paymentId = ctx.message?.text?.replace('/approve', '').trim();

    if (!paymentId) {
        await ctx.reply('⚠️ Please provide a payment ID.\n\nExample: `/approve pay1`', { parse_mode: 'Markdown' });
        return;
    }

    try {
        if (supabase) {
            const { data: payment } = await supabase
                .from('payment_requests')
                .select('*')
                .eq('id', paymentId)
                .single();

            if (!payment) {
                await ctx.reply('❌ Payment not found: `' + paymentId + '`', { parse_mode: 'Markdown' });
                return;
            }

            if (payment.status !== 'pending') {
                await ctx.reply('⚠️ Payment already processed. Status: *' + payment.status + '*', { parse_mode: 'Markdown' });
                return;
            }

            await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
            await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', payment.user_id);

            await ctx.reply(
                '✅ *Payment Approved!*\n\n' +
                '👤 ' + (payment.full_name || 'N/A') + '\n' +
                '💳 ' + (payment.method || 'N/A') + '\n' +
                '💵 $' + (payment.amount || '9.99') + '\n' +
                '⭐ User upgraded to Pro',
                { parse_mode: 'Markdown' }
            );

            console.log('✅ Payment approved:', paymentId);
        } else {
            await ctx.reply('✅ Payment approved (demo mode): `' + paymentId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

// ============================================================
// /reject <payment_id> - Reject Payment
// ============================================================

bot.command('reject', async (ctx) => {
    const paymentId = ctx.message?.text?.replace('/reject', '').trim();

    if (!paymentId) {
        await ctx.reply('⚠️ Please provide a payment ID.\n\nExample: `/reject pay1`', { parse_mode: 'Markdown' });
        return;
    }

    try {
        if (supabase) {
            await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
            await ctx.reply('❌ *Payment Rejected*\n\nID: `' + paymentId + '`', { parse_mode: 'Markdown' });
            console.log('❌ Payment rejected:', paymentId);
        } else {
            await ctx.reply('❌ Payment rejected (demo mode): `' + paymentId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

// ============================================================
// /broadcast - Send Message to All Users (Super Admin Only)
// ============================================================

bot.command('broadcast', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required* for broadcast functionality.', { parse_mode: 'Markdown' });
        return;
    }

    ctx.session.awaitingBroadcast = true;
    await ctx.reply(
        '📢 *Broadcast Mode Activated*\n\n' +
        'Please send the message you want to broadcast to all users.\n\n' +
        'Type `/cancel` to abort.\n\n' +
        '⚠️ This will send the message to ALL registered users.',
        { parse_mode: 'Markdown' }
    );
});

// ============================================================
// /grant <user_id> - Grant Pro Subscription (Super Admin)
// ============================================================

bot.command('grant', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required*', { parse_mode: 'Markdown' });
        return;
    }

    const userId = ctx.message?.text?.replace('/grant', '').trim();

    if (!userId) {
        await ctx.reply('⚠️ Please provide a user ID.\n\nExample: `/grant u2`', { parse_mode: 'Markdown' });
        return;
    }

    try {
        if (supabase) {
            const { data: user } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('user_id', userId)
                .single();

            if (!user) {
                await ctx.reply('❌ User not found: `' + userId + '`', { parse_mode: 'Markdown' });
                return;
            }

            await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', userId);
            await ctx.reply('⭐ *Pro Granted!*\n\n👤 ' + (user.full_name || userId) + '\n📧 ' + (user.email || 'N/A'), { parse_mode: 'Markdown' });
        } else {
            await ctx.reply('⭐ Pro granted (demo mode): `' + userId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

// ============================================================
// /revoke <user_id> - Revoke Pro Subscription (Super Admin)
// ============================================================

bot.command('revoke', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required*', { parse_mode: 'Markdown' });
        return;
    }

    const userId = ctx.message?.text?.replace('/revoke', '').trim();

    if (!userId) {
        await ctx.reply('⚠️ Please provide a user ID.\n\nExample: `/revoke u2`', { parse_mode: 'Markdown' });
        return;
    }

    try {
        if (supabase) {
            await supabase.from('profiles').update({ subscription_status: 'free' }).eq('user_id', userId);
            await ctx.reply('⬇️ *Pro Revoked*\n\nUser: `' + userId + '` downgraded to Free plan.', { parse_mode: 'Markdown' });
        } else {
            await ctx.reply('⬇️ Pro revoked (demo mode): `' + userId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

// ============================================================
// /ban <user_id> - Ban User (Super Admin)
// ============================================================

bot.command('ban', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required*', { parse_mode: 'Markdown' });
        return;
    }

    const userId = ctx.message?.text?.replace('/ban', '').trim();

    if (!userId) {
        await ctx.reply('⚠️ Please provide a user ID.\n\nExample: `/ban u1`', { parse_mode: 'Markdown' });
        return;
    }

    try {
        if (supabase && supabase.auth && supabase.auth.admin) {
            await supabase.auth.admin.updateUserById(userId, { ban_duration: '876600h' });
        }
        if (supabase) {
            await supabase.from('profiles').update({ is_banned: true }).eq('user_id', userId);
        }
        await ctx.reply('🚫 *User Banned*\n\nUser: `' + userId + '` has been banned.', { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

// ============================================================
// /unban <user_id> - Unban User (Super Admin)
// ============================================================

bot.command('unban', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required*', { parse_mode: 'Markdown' });
        return;
    }

    const userId = ctx.message?.text?.replace('/unban', '').trim();

    if (!userId) {
        await ctx.reply('⚠️ Please provide a user ID.\n\nExample: `/unban u1`', { parse_mode: 'Markdown' });
        return;
    }

    try {
        if (supabase && supabase.auth && supabase.auth.admin) {
            await supabase.auth.admin.updateUserById(userId, { ban_duration: '0h' });
        }
        if (supabase) {
            await supabase.from('profiles').update({ is_banned: false }).eq('user_id', userId);
        }
        await ctx.reply('✅ *User Unbanned*\n\nUser: `' + userId + '` has been unbanned.', { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

// ============================================================
// INLINE KEYBOARD HANDLERS
// ============================================================

bot.callbackQuery('menu_status', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Use /status to view system statistics.');
});

bot.callbackQuery('menu_users', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Use /users to view registered users.');
});

bot.callbackQuery('menu_payments', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Use /payments to view pending payment requests.');
});

bot.callbackQuery('menu_generations', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Use /generations to view AI generation history.');
});

bot.callbackQuery('menu_ziman', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
        '🌐 *Zîman Engine — Powered by ' + APP_NAME + '*\n\n' +
        '📊 12 Languages Supported\n' +
        '🏴 2 Kurdish Dialects (Badini & Sorani)\n' +
        '⚡ Real-Time Translation\n' +
        '🎯 99.9% Accuracy\n\n' +
        '🔗 [Open Zîman Engine](' + APP_URL + '/ziman)',
        { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
    );
});

bot.callbackQuery('menu_search', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
        '🔍 *Search Database*\n\nUse /search command:\n`/search user@email.com`\n`/search John`',
        { parse_mode: 'Markdown' }
    );
});

bot.callbackQuery('menu_broadcast', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 Super Admin only.');
        return;
    }
    ctx.session.awaitingBroadcast = true;
    await ctx.reply('📢 Send your broadcast message now. Type /cancel to abort.');
});

bot.callbackQuery('menu_settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);

    await ctx.reply(
        '⚙️ *' + APP_NAME + ' Bot Settings*\n\n' +
        '🤖 Status: 🟢 Online\n' +
        '⏱️ Uptime: ' + h + 'h ' + m + 'm\n' +
        '🆔 Your ID: `' + (ctx.from?.id || 'N/A') + '`\n' +
        '👑 Role: ' + (ctx.config?.isSuperAdmin ? 'Super Admin' : 'Admin') + '\n' +
        '📦 Version: 6.0.0\n' +
        '🌐 Platform: [' + APP_NAME + '](' + APP_URL + ')\n' +
        '👨‍💻 Developer: [' + DEVELOPER_NAME + '](' + DEVELOPER_TELEGRAM + ')',
        { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
    );
});

// ============================================================
// APPROVE / REJECT PAYMENT CALLBACKS (Inline Buttons)
// ============================================================

bot.callbackQuery(/^approve_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    await ctx.answerCallbackQuery({ text: 'Processing...' });

    try {
        if (supabase) {
            const { data: payment } = await supabase
                .from('payment_requests')
                .select('*')
                .eq('id', paymentId)
                .single();

            if (!payment) {
                await ctx.answerCallbackQuery({ text: 'Payment not found' });
                return;
            }

            if (payment.status !== 'pending') {
                await ctx.answerCallbackQuery({ text: 'Already processed: ' + payment.status });
                return;
            }

            await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
            await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', payment.user_id);

            await ctx.answerCallbackQuery({ text: '✅ Approved!' });

            // Edit the original message to show approval
            try {
                await ctx.editMessageCaption({
                    caption: (ctx.callbackQuery.message?.caption || '') + '\n\n✅ *APPROVED*',
                    parse_mode: 'Markdown'
                });
            } catch (e) {
                // Message might not have caption
            }

            console.log('✅ Payment approved via button:', paymentId);
        } else {
            await ctx.answerCallbackQuery({ text: '✅ Approved (demo mode)' });
        }
    } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Error: ' + err.message.substring(0, 50) });
    }
});

bot.callbackQuery(/^reject_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    await ctx.answerCallbackQuery({ text: 'Processing...' });

    try {
        if (supabase) {
            await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
            await ctx.answerCallbackQuery({ text: '❌ Rejected' });

            try {
                await ctx.editMessageCaption({
                    caption: (ctx.callbackQuery.message?.caption || '') + '\n\n❌ *REJECTED*',
                    parse_mode: 'Markdown'
                });
            } catch (e) {
                // Message might not have caption
            }

            console.log('❌ Payment rejected via button:', paymentId);
        } else {
            await ctx.answerCallbackQuery({ text: '❌ Rejected (demo mode)' });
        }
    } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Error: ' + err.message.substring(0, 50) });
    }
});

// ============================================================
// BROADCAST MESSAGE HANDLER
// ============================================================

bot.on('message', async (ctx, next) => {
    // Handle broadcast message input
    if (ctx.session?.awaitingBroadcast && ctx.config?.isSuperAdmin) {
        const text = ctx.message?.text;

        if (!text) return;

        // Check for cancel
        if (text === '/cancel') {
            ctx.session.awaitingBroadcast = false;
            await ctx.reply('❌ *Broadcast cancelled.*', { parse_mode: 'Markdown' });
            return;
        }

        // Reset broadcast state
        ctx.session.awaitingBroadcast = false;

        const statusMsg = await ctx.reply('📢 *Sending broadcast...* This may take a moment.', { parse_mode: 'Markdown' });

        let sentCount = 0;
        let failCount = 0;

        try {
            let users = [];

            if (supabase) {
                const { data } = await supabase.from('profiles').select('email, user_id');
                users = data || [];
            } else {
                // Demo mode - just simulate
                users = [{ email: 'demo@luminary.ai' }, { email: 'pro@luminary.ai' }];
            }

            if (users.length === 0) {
                await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id,
                    '📭 No users found to send broadcast to.', { parse_mode: 'Markdown' });
                return;
            }

            for (const user of users) {
                try {
                    // Try to send via Telegram if user has started the bot
                    if (user.user_id) {
                        await ctx.api.sendMessage(user.user_id,
                            '📢 *Message from ' + APP_NAME + ' Admin:*\n\n' + text,
                            { parse_mode: 'Markdown' }
                        );
                        sentCount++;
                    }
                } catch (e) {
                    failCount++;
                }

                // Rate limiting - 30 messages per second max
                await sleep(35);
            }

            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id,
                '✅ *Broadcast Complete!*\n\n' +
                '📊 Sent: *' + sentCount + '*\n' +
                '❌ Failed: *' + failCount + '*\n' +
                '👥 Total: *' + users.length + '*',
                { parse_mode: 'Markdown' }
            );

            console.log('📢 Broadcast sent to ' + sentCount + '/' + users.length + ' users');
        } catch (err) {
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id,
                '❌ *Broadcast failed:* ' + err.message.substring(0, 500),
                { parse_mode: 'Markdown' }
            );
        }

        return;
    }

    // If not a broadcast, continue to next middleware
    await next();
});

// ============================================================
// CATCH-ALL FOR UNKNOWN COMMANDS
// ============================================================

bot.on('message', async (ctx) => {
    const text = ctx.message?.text || '';

    // Only respond to commands
    if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();
        const knownCommands = [
            '/start', '/help', '/status', '/users', '/payments',
            '/generations', '/search', '/approve', '/reject',
            '/broadcast', '/grant', '/revoke', '/ban', '/unban', '/cancel'
        ];

        if (!knownCommands.includes(command)) {
            await ctx.reply(
                '❓ *Unknown command:* `' + command + '`\n\n' +
                'Use /help to see available commands.',
                { parse_mode: 'Markdown' }
            );
        }
    }
});

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getDemoUsers() {
    return [
        { id: 'p1', user_id: 'u1', email: 'demo@luminary.ai', full_name: 'Demo User', subscription_status: 'free', xp_points: 1250, is_banned: false, created_at: '2025-01-15T10:30:00Z' },
        { id: 'p2', user_id: 'u2', email: 'pro@luminary.ai', full_name: 'Pro User', subscription_status: 'pro', xp_points: 8750, is_banned: false, created_at: '2025-01-10T08:15:00Z' },
        { id: 'p3', user_id: 'u3', email: 'learner@luminary.ai', full_name: 'Sara Ahmed', subscription_status: 'free', xp_points: 2750, is_banned: false, created_at: '2025-02-20T12:00:00Z' },
        { id: 'p4', user_id: 'u4', email: 'ahmed@luminary.ai', full_name: 'Ahmed Hassan', subscription_status: 'pro', xp_points: 5200, is_banned: false, created_at: '2025-03-01T09:00:00Z' },
        { id: 'p5', user_id: 'u5', email: 'spam@luminary.ai', full_name: 'Banned User', subscription_status: 'free', xp_points: 100, is_banned: true, created_at: '2025-04-10T14:00:00Z' }
    ];
}

function getDemoPayments() {
    return [
        { id: 'pay1', user_id: 'u2', full_name: 'Pro User', email: 'pro@luminary.ai', method: 'FIB', transaction_id: 'TX987654321', amount: 9.99, status: 'pending', created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'pay2', user_id: 'u3', full_name: 'Sara Ahmed', email: 'learner@luminary.ai', method: 'FastPay', transaction_id: 'TX123456789', amount: 9.99, status: 'pending', created_at: new Date(Date.now() - 172800000).toISOString() }
    ];
}

// ============================================================
// START BOT
// ============================================================

bot.start({
    onStart: () => {
        console.log('');
        console.log('✨ ' + APP_NAME + ' Admin Bot');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🤖 Bot started successfully');
        console.log('⏰ Started at: ' + new Date().toISOString());
        console.log('👑 Super Admins: ' + (SUPER_ADMIN_IDS.length > 0 ? SUPER_ADMIN_IDS.join(', ') : 'None configured'));
        console.log('👥 Admins: ' + (ADMIN_TELEGRAM_IDS.length > 0 ? ADMIN_TELEGRAM_IDS.join(', ') : 'None configured'));
        console.log('🗄️ Database: ' + (supabase ? 'Connected' : 'Standalone/Demo Mode'));
        console.log('🌐 Platform: ' + APP_URL);
        console.log('👨‍💻 Developer: ' + DEVELOPER_NAME);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
        console.log('📋 Available commands:');
        console.log('   /start, /help, /status, /users, /payments');
        console.log('   /generations, /search, /approve, /reject');
        console.log('   /broadcast, /grant, /revoke, /ban, /unban');
        console.log('');
        console.log('🔒 Bot is ready. Only authorized admins can interact.');
        console.log('');
    }
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================

process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    bot.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down bot...');
    bot.stop();
    process.exit(0);
});

// ============================================================
// EXPORT FOR WEBHOOK / MODULE USE
// ============================================================

module.exports = bot;
