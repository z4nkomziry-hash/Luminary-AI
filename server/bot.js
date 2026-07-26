/**
 * Luminary AI - Advanced Telegram Admin Bot
 * Elite Private Executive Console with Grammy Framework
 * Full command handlers, broadcasting, payment processing,
 * and Supabase integration
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

'use strict';

require('dotenv').config();

const { Bot, InlineKeyboard, session, GrammyError, HttpError } = require('grammy');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8902143839:AAGbI5pwVD5bZGIrON_pZCsJnnPNjFBXJnY';
const ADMIN_TELEGRAM_IDS = (process.env.ADMIN_TELEGRAM_IDS || '7296733212').split(',').map(Number).filter(Boolean);
const SUPER_ADMIN_IDS = (process.env.SUPER_ADMIN_IDS || '7296733212').split(',').map(Number).filter(Boolean);
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://csjtpzptvqoomotqbeuh.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.APP_URL || 'https://luminary-ai.vercel.app';
const APP_NAME = process.env.APP_NAME || 'Luminary AI';
const DEVELOPER_NAME = process.env.DEVELOPER_NAME || 'Zaniyar Al-Mzurii';
const DEVELOPER_TELEGRAM = process.env.DEVELOPER_TELEGRAM || 'https://t.me/z_14x';
const TELEGRAM_ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '7296733212';

const ALL_AUTHORIZED_IDS = new Set([...ADMIN_TELEGRAM_IDS, ...SUPER_ADMIN_IDS]);

let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
            db: { schema: 'public' }
        });
        console.log('✅ Bot DB: Supabase connected');
    } catch (err) {
        console.error('❌ Bot DB: Supabase connection failed:', err.message);
    }
} else {
    console.warn('⚠️ Bot DB: Supabase not configured. Standalone mode.');
}

const bot = new Bot(BOT_TOKEN);

bot.use(session({
    initial: () => ({
        awaitingBroadcast: false,
        currentPage: 1
    })
}));

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || !ALL_AUTHORIZED_IDS.has(userId)) {
        return;
    }
    ctx.config = {
        isSuperAdmin: SUPER_ADMIN_IDS.includes(userId),
        isAdmin: true,
        userId: userId,
        username: ctx.from?.username || 'unknown'
    };
    await next();
});

bot.catch(async (err) => {
    const ctx = err.ctx;
    console.error('❌ Bot error:', err.message);
    if (err instanceof GrammyError) {
        console.error('Grammy error:', err.description);
    } else if (err instanceof HttpError) {
        console.error('HTTP error:', err.message);
    }
    if (ctx && ctx.config?.isSuperAdmin) {
        try {
            await ctx.reply('❌ An error occurred: ' + err.message.substring(0, 200));
        } catch (e) {}
    }
});

bot.command('start', async (ctx) => {
    const firstName = ctx.from?.first_name || 'Admin';
    const isSuperAdmin = ctx.config?.isSuperAdmin;

    const keyboard = new InlineKeyboard()
        .text('📊 System Status', 'menu_status').row()
        .text('👥 User Management', 'menu_users').row()
        .text('💰 Payment Requests', 'menu_payments').row()
        .text('🤖 AI Generations', 'menu_generations').row()
        .text('🌐 Zîman Engine', 'menu_ziman').row()
        .text('🔍 Search Database', 'menu_search');

    if (isSuperAdmin) {
        keyboard.row()
            .text('📢 Broadcast', 'menu_broadcast').row()
            .text('⚙️ Settings', 'menu_settings');
    }

    const welcomeMessage =
        '✨ *Welcome to ' + APP_NAME + ' Admin Console*\n\n' +
        '👋 Hello, *' + firstName + '*!\n\n' +
        '🔐 Secure Executive Control Panel\n' +
        '🛡️ Role: ' + (isSuperAdmin ? '👑 Super Admin' : '🔑 Admin') + '\n\n' +
        '👨‍💻 Developer: [' + DEVELOPER_NAME + '](' + DEVELOPER_TELEGRAM + ')\n' +
        '🌐 [' + APP_NAME + '](' + APP_URL + ')\n\n' +
        'Select an option or use commands:\n' +
        '/status • /users • /payments • /search • /help';

    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        link_preview_options: { is_disabled: true }
    });

    console.log('👋 /start from:', ctx.from?.username || ctx.from?.id);
});

bot.command('help', async (ctx) => {
    const isSuperAdmin = ctx.config?.isSuperAdmin;
    let helpText =
        '📋 *' + APP_NAME + ' Bot Commands*\n\n' +
        '/start - Main menu\n' +
        '/help - This help\n' +
        '/status - System stats\n' +
        '/users - List users\n' +
        '/payments - Pending payments\n' +
        '/generations - AI history\n' +
        '/search <query> - Search users\n' +
        '/approve <payment_id> - Approve payment\n' +
        '/reject <payment_id> - Reject payment\n';

    if (isSuperAdmin) {
        helpText +=
            '/broadcast - Send to all users\n' +
            '/ban <user_id> - Ban user\n' +
            '/unban <user_id> - Unban user\n' +
            '/grant <user_id> - Grant Pro\n' +
            '/revoke <user_id> - Revoke Pro\n' +
            '/settings - Bot config\n';
    }

    helpText += '\n👨‍💻 Developer: [' + DEVELOPER_NAME + '](' + DEVELOPER_TELEGRAM + ')';

    await ctx.reply(helpText, {
        parse_mode: 'Markdown',
        link_preview_options: { is_disabled: true }
    });
});

bot.command('status', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading...*', { parse_mode: 'Markdown' });

    try {
        let totalUsers = 0, proUsers = 0, pendingPayments = 0, todayGenerations = 0, totalGenerations = 0;

        if (supabase) {
            const today = new Date().toISOString().split('T')[0];
            const results = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
                supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
                supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today),
                supabase.from('generations').select('*', { count: 'exact', head: true })
            ]);
            totalUsers = results[0].count || 0;
            proUsers = results[1].count || 0;
            pendingPayments = results[2].count || 0;
            todayGenerations = results[3].count || 0;
            totalGenerations = results[4].count || 0;
        } else {
            totalUsers = Math.floor(Math.random() * 5000) + 1000;
            proUsers = Math.floor(Math.random() * 500) + 100;
            pendingPayments = Math.floor(Math.random() * 20) + 1;
            todayGenerations = Math.floor(Math.random() * 500) + 50;
            totalGenerations = Math.floor(Math.random() * 50000) + 10000;
        }

        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const dbStatus = supabase ? '🟢 Connected' : '🟡 Demo Mode';

        const statusText =
            '📊 *' + APP_NAME + ' Status*\n\n' +
            '👥 Users: *' + totalUsers.toLocaleString() + '*\n' +
            '💎 Pro: *' + proUsers.toLocaleString() + '*\n' +
            '⏳ Pending: *' + pendingPayments + '*\n' +
            '🤖 Today: *' + todayGenerations.toLocaleString() + '*\n' +
            '📊 Total: *' + totalGenerations.toLocaleString() + '*\n' +
            '🗄️ DB: ' + dbStatus + '\n' +
            '⏱️ Uptime: ' + h + 'h ' + m + 'm ' + s + 's';

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, statusText, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('users', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading users...*', { parse_mode: 'Markdown' });

    try {
        let users = [];

        if (supabase) {
            const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(15);
            users = data || [];
        } else {
            users = [
                { user_id: 'u1', email: 'demo@luminary.ai', full_name: 'Demo User', subscription_status: 'free', xp_points: 1250, is_banned: false, created_at: '2025-01-15T10:30:00Z' },
                { user_id: 'u2', email: 'pro@luminary.ai', full_name: 'Pro User', subscription_status: 'pro', xp_points: 8750, is_banned: false, created_at: '2025-01-10T08:15:00Z' },
                { user_id: 'u3', email: 'learner@luminary.ai', full_name: 'Sara Ahmed', subscription_status: 'free', xp_points: 2750, is_banned: false, created_at: '2025-02-20T12:00:00Z' }
            ];
        }

        if (users.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No users found.', { parse_mode: 'Markdown' });
            return;
        }

        let text = '👥 *Recent Users (' + users.length + ')*\n\n';
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            const plan = u.subscription_status === 'pro' ? '💎' : '🆓';
            text += (i + 1) + '. ' + plan + ' ' + (u.full_name || 'N/A') + '\n';
            text += '   📧 `' + (u.email || 'N/A') + '`\n';
            text += '   ⭐ ' + (u.xp_points || 0) + ' XP\n\n';
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('payments', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading payments...*', { parse_mode: 'Markdown' });

    try {
        let payments = [];

        if (supabase) {
            const { data } = await supabase.from('payment_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }).limit(10);
            payments = data || [];
        } else {
            payments = [
                { id: 'pay1', user_id: 'u2', full_name: 'Pro User', email: 'pro@luminary.ai', method: 'FIB', transaction_id: 'TX987654321', amount: 9.99, status: 'pending', created_at: new Date().toISOString() },
                { id: 'pay2', user_id: 'u3', full_name: 'Sara Ahmed', email: 'learner@luminary.ai', method: 'FastPay', transaction_id: 'TX123456789', amount: 9.99, status: 'pending', created_at: new Date().toISOString() }
            ];
        }

        if (payments.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No pending payments. ✅', { parse_mode: 'Markdown' });
            return;
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '💰 *Pending Payments (' + payments.length + ')*', { parse_mode: 'Markdown' });

        for (const p of payments) {
            const keyboard = new InlineKeyboard()
                .text('✅ Approve', 'approve_' + p.id)
                .text('❌ Reject', 'reject_' + p.id);

            const paymentText =
                '💳 *Payment Request*\n\n' +
                '👤 ' + (p.full_name || 'N/A') + '\n' +
                '📧 `' + (p.email || 'N/A') + '`\n' +
                '💳 ' + (p.method || 'N/A') + '\n' +
                '🔢 `' + (p.transaction_id || 'N/A') + '`\n' +
                '💵 $' + (p.amount || '9.99') + '\n' +
                '🆔 `' + p.id + '`';

            try {
                await ctx.reply(paymentText, { parse_mode: 'Markdown', reply_markup: keyboard });
            } catch (err) {
                await ctx.reply(paymentText, { parse_mode: 'Markdown', reply_markup: keyboard });
            }
            await sleep(200);
        }
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('generations', async (ctx) => {
    const loadingMsg = await ctx.reply('⏳ *Loading...*', { parse_mode: 'Markdown' });

    try {
        let generations = [];
        if (supabase) {
            const { data } = await supabase.from('generations').select('*').order('created_at', { ascending: false }).limit(10);
            generations = data || [];
        } else {
            generations = [
                { user_id: 'u1', prompt: 'Translate to Kurdish', language: 'KU-SO', task: 'translate', created_at: new Date().toISOString() },
                { user_id: 'u2', prompt: 'Write a blog post', language: 'EN', task: 'generate', created_at: new Date().toISOString() }
            ];
        }

        if (generations.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No generations found.', { parse_mode: 'Markdown' });
            return;
        }

        let text = '🤖 *Recent Generations (' + generations.length + ')*\n\n';
        for (let i = 0; i < generations.length; i++) {
            const g = generations[i];
            text += (i + 1) + '. 👤 `' + (g.user_id || '').substring(0, 8) + '...`\n';
            text += '   📝 ' + (g.prompt || '').substring(0, 50) + '...\n';
            text += '   🌐 ' + (g.language || 'EN') + ' | ' + (g.task || 'generate') + '\n\n';
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('search', async (ctx) => {
    const query = ctx.message?.text?.replace('/search', '').trim();
    if (!query) {
        await ctx.reply('🔍 Please provide a search query.\n\nExample: `/search user@email.com`', { parse_mode: 'Markdown' });
        return;
    }

    const loadingMsg = await ctx.reply('🔍 *Searching: "' + query + '"...*', { parse_mode: 'Markdown' });

    try {
        let results = [];
        if (supabase) {
            const { data } = await supabase.from('profiles').select('*').or('email.ilike.%' + query + '%,full_name.ilike.%' + query + '%').limit(10);
            results = data || [];
        } else {
            const demoUsers = [
                { user_id: 'u1', email: 'demo@luminary.ai', full_name: 'Demo User', subscription_status: 'free', xp_points: 1250, created_at: '2025-01-15T10:30:00Z' },
                { user_id: 'u2', email: 'pro@luminary.ai', full_name: 'Pro User', subscription_status: 'pro', xp_points: 8750, created_at: '2025-01-10T08:15:00Z' }
            ];
            const q = query.toLowerCase();
            results = demoUsers.filter(u => (u.email || '').toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q));
        }

        if (results.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No results for: "' + query + '"', { parse_mode: 'Markdown' });
            return;
        }

        let text = '🔍 *Results (' + results.length + ')*\n\n';
        for (let i = 0; i < results.length; i++) {
            const u = results[i];
            text += (i + 1) + '. 👤 *' + (u.full_name || 'N/A') + '*\n';
            text += '   📧 `' + (u.email || 'N/A') + '`\n';
            text += '   ⭐ ' + (u.subscription_status === 'pro' ? '💎 Pro' : '🆓 Free') + '\n\n';
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('approve', async (ctx) => {
    const paymentId = ctx.message?.text?.replace('/approve', '').trim();
    if (!paymentId) {
        await ctx.reply('⚠️ Please provide a payment ID.\nExample: `/approve pay1`', { parse_mode: 'Markdown' });
        return;
    }
    try {
        if (supabase) {
            const { data: payment } = await supabase.from('payment_requests').select('*').eq('id', paymentId).single();
            if (!payment) { await ctx.reply('❌ Payment not found.', { parse_mode: 'Markdown' }); return; }
            if (payment.status !== 'pending') { await ctx.reply('⚠️ Already processed: ' + payment.status, { parse_mode: 'Markdown' }); return; }
            await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
            await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', payment.user_id);
            await ctx.reply('✅ *Approved!*\n👤 ' + (payment.full_name || 'N/A') + '\n⭐ Upgraded to Pro', { parse_mode: 'Markdown' });
            console.log('✅ Payment approved:', paymentId);
        } else {
            await ctx.reply('✅ Approved (demo): `' + paymentId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('reject', async (ctx) => {
    const paymentId = ctx.message?.text?.replace('/reject', '').trim();
    if (!paymentId) {
        await ctx.reply('⚠️ Please provide a payment ID.\nExample: `/reject pay1`', { parse_mode: 'Markdown' });
        return;
    }
    try {
        if (supabase) {
            await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
            await ctx.reply('❌ *Rejected*\nID: `' + paymentId + '`', { parse_mode: 'Markdown' });
        } else {
            await ctx.reply('❌ Rejected (demo): `' + paymentId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('broadcast', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin only*', { parse_mode: 'Markdown' });
        return;
    }
    ctx.session.awaitingBroadcast = true;
    await ctx.reply('📢 *Broadcast Mode*\n\nSend your message now.\nType /cancel to abort.', { parse_mode: 'Markdown' });
});

bot.command('grant', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) { await ctx.reply('🔒 Super Admin only', { parse_mode: 'Markdown' }); return; }
    const userId = ctx.message?.text?.replace('/grant', '').trim();
    if (!userId) { await ctx.reply('⚠️ Provide user ID: `/grant u1`', { parse_mode: 'Markdown' }); return; }
    try {
        if (supabase) {
            await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', userId);
            await ctx.reply('⭐ Pro granted: `' + userId + '`', { parse_mode: 'Markdown' });
        } else {
            await ctx.reply('⭐ Pro granted (demo): `' + userId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('revoke', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) { await ctx.reply('🔒 Super Admin only', { parse_mode: 'Markdown' }); return; }
    const userId = ctx.message?.text?.replace('/revoke', '').trim();
    if (!userId) { await ctx.reply('⚠️ Provide user ID: `/revoke u1`', { parse_mode: 'Markdown' }); return; }
    try {
        if (supabase) {
            await supabase.from('profiles').update({ subscription_status: 'free' }).eq('user_id', userId);
            await ctx.reply('⬇️ Pro revoked: `' + userId + '`', { parse_mode: 'Markdown' });
        } else {
            await ctx.reply('⬇️ Pro revoked (demo): `' + userId + '`', { parse_mode: 'Markdown' });
        }
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('ban', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) { await ctx.reply('🔒 Super Admin only', { parse_mode: 'Markdown' }); return; }
    const userId = ctx.message?.text?.replace('/ban', '').trim();
    if (!userId) { await ctx.reply('⚠️ Provide user ID: `/ban u1`', { parse_mode: 'Markdown' }); return; }
    try {
        if (supabase) {
            try { await supabase.auth.admin.updateUserById(userId, { ban_duration: '876600h' }); } catch (e) {}
            await supabase.from('profiles').update({ is_banned: true }).eq('user_id', userId);
        }
        await ctx.reply('🚫 Banned: `' + userId + '`', { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.command('unban', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) { await ctx.reply('🔒 Super Admin only', { parse_mode: 'Markdown' }); return; }
    const userId = ctx.message?.text?.replace('/unban', '').trim();
    if (!userId) { await ctx.reply('⚠️ Provide user ID: `/unban u1`', { parse_mode: 'Markdown' }); return; }
    try {
        if (supabase) {
            try { await supabase.auth.admin.updateUserById(userId, { ban_duration: '0h' }); } catch (e) {}
            await supabase.from('profiles').update({ is_banned: false }).eq('user_id', userId);
        }
        await ctx.reply('✅ Unbanned: `' + userId + '`', { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.reply('❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
    }
});

bot.callbackQuery('menu_status', async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply('Use /status for system statistics.'); });
bot.callbackQuery('menu_users', async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply('Use /users to view registered users.'); });
bot.callbackQuery('menu_payments', async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply('Use /payments to view pending payments.'); });
bot.callbackQuery('menu_generations', async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply('Use /generations to view AI history.'); });
bot.callbackQuery('menu_ziman', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('🌐 *Zîman Engine*\n\n📊 12 Languages\n🏴 2 Kurdish Dialects\n⚡ Real-Time\n\n🔗 [Open](' + APP_URL + '/ziman)', { parse_mode: 'Markdown' });
});
bot.callbackQuery('menu_search', async (ctx) => { await ctx.answerCallbackQuery(); await ctx.reply('Use /search <query> to search.'); });
bot.callbackQuery('menu_broadcast', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.config?.isSuperAdmin) { await ctx.reply('🔒 Super Admin only'); return; }
    ctx.session.awaitingBroadcast = true;
    await ctx.reply('📢 Send your broadcast now.');
});
bot.callbackQuery('menu_settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    await ctx.reply(
        '⚙️ *' + APP_NAME + ' Bot*\n\n' +
        '🤖 Status: 🟢 Online\n' +
        '⏱️ Uptime: ' + h + 'h ' + m + 'm\n' +
        '📦 Version: 6.0.0\n' +
        '👨‍💻 [' + DEVELOPER_NAME + '](' + DEVELOPER_TELEGRAM + ')',
        { parse_mode: 'Markdown' }
    );
});

bot.callbackQuery(/^approve_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    await ctx.answerCallbackQuery({ text: 'Processing...' });
    try {
        if (supabase) {
            const { data: payment } = await supabase.from('payment_requests').select('*').eq('id', paymentId).single();
            if (!payment) { await ctx.answerCallbackQuery({ text: 'Not found' }); return; }
            if (payment.status !== 'pending') { await ctx.answerCallbackQuery({ text: 'Already: ' + payment.status }); return; }
            await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
            await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', payment.user_id);
            await ctx.answerCallbackQuery({ text: '✅ Approved!' });
            console.log('✅ Payment approved via button:', paymentId);
        } else {
            await ctx.answerCallbackQuery({ text: '✅ Approved (demo)' });
        }
    } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Error' });
    }
});

bot.callbackQuery(/^reject_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    await ctx.answerCallbackQuery({ text: 'Processing...' });
    try {
        if (supabase) {
            await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
            await ctx.answerCallbackQuery({ text: '❌ Rejected' });
        } else {
            await ctx.answerCallbackQuery({ text: '❌ Rejected (demo)' });
        }
    } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Error' });
    }
});

bot.on('message', async (ctx, next) => {
    if (ctx.session?.awaitingBroadcast && ctx.config?.isSuperAdmin) {
        const text = ctx.message?.text;
        if (!text) return;
        if (text === '/cancel') { ctx.session.awaitingBroadcast = false; await ctx.reply('❌ Cancelled.', { parse_mode: 'Markdown' }); return; }
        ctx.session.awaitingBroadcast = false;
        const statusMsg = await ctx.reply('📢 *Sending...*', { parse_mode: 'Markdown' });
        let sentCount = 0;
        let failCount = 0;
        try {
            let users = [];
            if (supabase) {
                const { data } = await supabase.from('profiles').select('user_id, full_name');
                users = data || [];
            } else {
                users = [{ user_id: 'demo1' }, { user_id: 'demo2' }];
            }
            for (const user of users) {
                try {
                    if (user.user_id && user.user_id !== 'demo1' && user.user_id !== 'demo2') {
                        await ctx.api.sendMessage(user.user_id, '📢 *' + APP_NAME + ' Admin:*\n\n' + text, { parse_mode: 'Markdown' });
                        sentCount++;
                    }
                } catch (e) { failCount++; }
                await sleep(35);
            }
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '✅ *Done!*\n📊 Sent: ' + sentCount + '\n❌ Failed: ' + failCount, { parse_mode: 'Markdown' });
        } catch (err) {
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, '❌ Error: ' + err.message.substring(0, 500), { parse_mode: 'Markdown' });
        }
        return;
    }
    await next();
});

bot.on('message', async (ctx) => {
    const text = ctx.message?.text || '';
    if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();
        const known = ['/start', '/help', '/status', '/users', '/payments', '/generations', '/search', '/approve', '/reject', '/broadcast', '/grant', '/revoke', '/ban', '/unban', '/cancel'];
        if (!known.includes(command)) {
            await ctx.reply('❓ Unknown: `' + command + '`\nUse /help', { parse_mode: 'Markdown' });
        }
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

bot.start({
    onStart: () => {
        console.log('');
        console.log('✨ ' + APP_NAME + ' Admin Bot');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🤖 Bot started successfully');
        console.log('⏰ Started at: ' + new Date().toISOString());
        console.log('👑 Super Admins: ' + (SUPER_ADMIN_IDS.length > 0 ? SUPER_ADMIN_IDS.join(', ') : 'None'));
        console.log('👥 Admins: ' + (ADMIN_TELEGRAM_IDS.length > 0 ? ADMIN_TELEGRAM_IDS.join(', ') : 'None'));
        console.log('🗄️ Database: ' + (supabase ? 'Connected' : 'Standalone'));
        console.log('🌐 Platform: ' + APP_URL);
        console.log('👨‍💻 Developer: ' + DEVELOPER_NAME);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');
    }
});

process.on('SIGINT', () => { console.log('🛑 Shutting down...'); bot.stop(); process.exit(0); });
process.on('SIGTERM', () => { console.log('🛑 Shutting down...'); bot.stop(); process.exit(0); });

module.exports = bot;
