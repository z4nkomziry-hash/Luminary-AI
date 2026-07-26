/**
 * Luminary AI - Advanced Telegram Admin Bot
 * Elite Private Executive Console
 * Built with Grammy (Modern Telegram Bot Framework)
 * Developer: Zaniyar Al-Mzurii
 */

require('dotenv').config();
const { Bot, InlineKeyboard, session } = require('grammy');
const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURATION
// ============================================================

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(Number).filter(Boolean);
const SUPER_ADMIN_IDS = (process.env.SUPER_ADMIN_IDS || '').split(',').map(Number).filter(Boolean);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.APP_URL || 'https://luminary-ai.vercel.app';

const ALL_AUTHORIZED = new Set([...ADMIN_IDS, ...SUPER_ADMIN_IDS]);

// Supabase client
const supabase = SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;

// ============================================================
// BOT INITIALIZATION
// ============================================================

const bot = new Bot(BOT_TOKEN);

// ============================================================
// AUTH MIDDLEWARE - Silent ignore for unauthorized users
// ============================================================

bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId || !ALL_AUTHORIZED.has(userId)) {
        return; // Silent ignore
    }
    ctx.config = {
        isSuperAdmin: SUPER_ADMIN_IDS.includes(userId),
        isAdmin: true,
    };
    await next();
});

// ============================================================
// START COMMAND - Interactive Main Menu
// ============================================================

bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard()
        .text('📊 System Status', 'menu_status').row()
        .text('👥 User Management', 'menu_users').row()
        .text('💰 Payment Requests', 'menu_payments').row()
        .text('🌐 Zîman Stats', 'menu_ziman').row()
        .text('🔍 Search Database', 'menu_search').row()
        .text('📢 Broadcast', 'menu_broadcast').row()
        .text('⚙️ Settings', 'menu_settings');

    const welcomeMessage = 
        '✨ *Welcome to Luminary AI Admin Console*\n\n' +
        '🔐 Secure Executive Control Panel\n' +
        '📊 Real-time platform management\n' +
        '🤖 AI-Powered analytics\n\n' +
        'Select an option below:';

    await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard,
    });
});

// ============================================================
// HELP COMMAND
// ============================================================

bot.command('help', async (ctx) => {
    const helpText = 
        '📋 *Luminary AI Bot Commands*\n\n' +
        '/start - Main menu\n' +
        '/status - System statistics\n' +
        '/users - List recent users\n' +
        '/payments - Pending payments\n' +
        '/broadcast - Send message to all users\n' +
        '/search <query> - Search database\n' +
        '/help - This help message\n\n' +
        `🌐 Platform: [Luminary AI](${APP_URL})\n` +
        '👨‍💻 Developer: Zaniyar Al-Mzurii';

    await ctx.reply(helpText, { parse_mode: 'Markdown' });
});

// ============================================================
// STATUS COMMAND
// ============================================================

bot.command('status', async (ctx) => {
    await handleStatusCallback(ctx);
});

// ============================================================
// USERS COMMAND
// ============================================================

bot.command('users', async (ctx) => {
    await handleUsersCallback(ctx);
});

// ============================================================
// PAYMENTS COMMAND
// ============================================================

bot.command('payments', async (ctx) => {
    await handlePaymentsCallback(ctx);
});

// ============================================================
// SEARCH COMMAND
// ============================================================

bot.command('search', async (ctx) => {
    const query = ctx.message?.text?.replace('/search', '').trim();
    if (!query) {
        await ctx.reply('🔍 *Please provide a search query*\n\nExample: `/search user@email.com`', { parse_mode: 'Markdown' });
        return;
    }

    if (!supabase) {
        await ctx.reply('🔴 *Database connection not available*', { parse_mode: 'Markdown' });
        return;
    }

    const loadingMsg = await ctx.reply('🔍 Searching...');

    try {
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(10);

        if (!users || users.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No results found.');
            return;
        }

        let resultText = '🔍 *Search Results:*\n\n';
        users.forEach((u, i) => {
            resultText += `${i + 1}. 👤 ${u.full_name || 'N/A'}\n`;
            resultText += `   📧 \`${u.email}\`\n`;
            resultText += `   ⭐ ${u.subscription_status}\n`;
            resultText += `   🆔 \`${u.user_id}\`\n\n`;
        });

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, resultText, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, `❌ Error: ${err.message}`);
    }
});

// ============================================================
// BROADCAST COMMAND (Super Admin only)
// ============================================================

bot.command('broadcast', async (ctx) => {
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required*', { parse_mode: 'Markdown' });
        return;
    }
    await ctx.reply(
        '📢 *Broadcast Mode Activated*\n\nPlease send the message you want to broadcast to all users.\nSend /cancel to abort.',
        { parse_mode: 'Markdown' }
    );
    ctx.session = { ...ctx.session, awaitingBroadcast: true };
});

// ============================================================
// INLINE KEYBOARD HANDLERS
// ============================================================

bot.callbackQuery('menu_status', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleStatusCallback(ctx);
});

bot.callbackQuery('menu_users', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handleUsersCallback(ctx);
});

bot.callbackQuery('menu_payments', async (ctx) => {
    await ctx.answerCallbackQuery();
    await handlePaymentsCallback(ctx);
});

bot.callbackQuery('menu_ziman', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
        `🌐 *Zîman Engine — Powered by Luminary AI*\n\n` +
        `📊 12 Languages Supported\n` +
        `🏴 2 Kurdish Dialects (Badini & Sorani)\n` +
        `⚡ Real-Time Translation\n` +
        `🎯 99.9% Accuracy\n\n` +
        `🔗 [Open Zîman](${APP_URL}/ziman)`,
        { parse_mode: 'Markdown', link_preview_options: { is_disabled: true } }
    );
});

bot.callbackQuery('menu_search', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('🔍 *Send a search query:*\n\nExample: `/search user@email.com`', { parse_mode: 'Markdown' });
});

bot.callbackQuery('menu_broadcast', async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.config?.isSuperAdmin) {
        await ctx.reply('🔒 *Super Admin access required*', { parse_mode: 'Markdown' });
        return;
    }
    await ctx.reply('📢 *Send your broadcast message now*', { parse_mode: 'Markdown' });
    ctx.session = { ...ctx.session, awaitingBroadcast: true };
});

bot.callbackQuery('menu_settings', async (ctx) => {
    await ctx.answerCallbackQuery();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    await ctx.reply(
        '⚙️ *Luminary AI Bot Settings*\n\n' +
        `🤖 Bot Status: 🟢 Online\n` +
        `⏱️ Uptime: ${hours}h ${minutes}m ${seconds}s\n` +
        `🆔 Your ID: \`${ctx.from?.id}\`\n` +
        `👑 Role: ${ctx.config?.isSuperAdmin ? 'Super Admin' : 'Admin'}\n` +
        `📦 Version: 6.0.0\n` +
        `🌐 Platform: [Luminary AI](${APP_URL})\n` +
        `👨‍💻 Developer: Zaniyar Al-Mzurii`,
        { parse_mode: 'Markdown' }
    );
});

// ============================================================
// APPROVE / REJECT PAYMENT CALLBACKS
// ============================================================

bot.callbackQuery(/^approve_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    if (!supabase) {
        await ctx.answerCallbackQuery({ text: 'Database not available' });
        return;
    }

    try {
        const { data: payment } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (!payment) {
            await ctx.answerCallbackQuery({ text: 'Payment not found' });
            return;
        }

        await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', paymentId);
        await supabase.from('profiles').update({ subscription_status: 'pro' }).eq('user_id', payment.user_id);

        await ctx.answerCallbackQuery({ text: '✅ Approved!' });
        await ctx.reply(`✅ Payment approved!\n👤 ${payment.full_name}\n💳 ${payment.method}\n⭐ Upgraded to Pro`);
    } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Error occurred' });
    }
});

bot.callbackQuery(/^reject_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    if (!supabase) {
        await ctx.answerCallbackQuery({ text: 'Database not available' });
        return;
    }

    try {
        await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', paymentId);
        await ctx.answerCallbackQuery({ text: '❌ Rejected' });
        await ctx.reply('❌ Payment rejected.');
    } catch (err) {
        await ctx.answerCallbackQuery({ text: 'Error occurred' });
    }
});

// ============================================================
// BROADCAST MESSAGE HANDLER
// ============================================================

bot.on('message', async (ctx, next) => {
    if (ctx.session?.awaitingBroadcast && ctx.config?.isSuperAdmin) {
        const text = ctx.message?.text;
        if (!text) return;

        if (text === '/cancel') {
            ctx.session.awaitingBroadcast = false;
            await ctx.reply('❌ Broadcast cancelled.');
            return;
        }

        if (!supabase) {
            await ctx.reply('🔴 Database not available');
            return;
        }

        ctx.session.awaitingBroadcast = false;
        const statusMsg = await ctx.reply('📢 Sending broadcast...');

        try {
            const { data: users } = await supabase.from('profiles').select('email');
            let sentCount = 0;

            if (users) {
                for (const user of users) {
                    try {
                        await ctx.api.sendMessage(user.email,
                            `📢 *Message from Luminary AI Admin:*\n\n${text}`,
                            { parse_mode: 'Markdown' }
                        );
                        sentCount++;
                    } catch (e) {
                        // Skip users who haven't started the bot
                    }
                    await new Promise(r => setTimeout(r, 50));
                }
            }

            await ctx.api.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                `✅ Broadcast complete!\n📊 Sent to: ${sentCount} users`
            );
        } catch (err) {
            await ctx.api.editMessageText(
                ctx.chat.id,
                statusMsg.message_id,
                `❌ Error: ${err.message}`
            );
        }
        return;
    }
    await next();
});

// ============================================================
// HANDLER FUNCTIONS
// ============================================================

async function handleStatusCallback(ctx) {
    const loadingMsg = await ctx.reply('⏳ Loading system status...');

    if (!supabase) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            '🔴 *Database connection not available*\n\n' +
            '🤖 Bot is running in standalone mode.\n' +
            `🌐 Platform: [Luminary AI](${APP_URL})`,
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        const [
            { count: totalUsers },
            { count: freeUsers },
            { count: proUsers },
            { count: pendingPayments },
            { count: todayGenerations },
        ] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'free'),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
            supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
        ]);

        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);

        const statusText =
            '📊 *Luminary AI System Status*\n\n' +
            `👥 Total Users: *${totalUsers || 0}*\n` +
            `🆓 Free Users: *${freeUsers || 0}*\n` +
            `💎 Pro Users: *${proUsers || 0}*\n` +
            `⏳ Pending Payments: *${pendingPayments || 0}*\n` +
            `🤖 Today's Generations: *${todayGenerations || 0}*\n` +
            `🟢 Database: Connected\n` +
            `⏱️ Bot Uptime: ${h}h ${m}m\n\n` +
            `🌐 [Open Luminary AI](${APP_URL})`;

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, statusText, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, `❌ Error: ${err.message}`);
    }
}

async function handleUsersCallback(ctx) {
    if (!supabase) {
        await ctx.reply('🔴 Database not available');
        return;
    }

    const loadingMsg = await ctx.reply('⏳ Loading users...');

    try {
        const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (!users || users.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No users found.');
            return;
        }

        let text = '👥 *Recent Users — Luminary AI*\n\n';
        users.forEach((u, i) => {
            const plan = u.subscription_status === 'pro' ? '💎' : '🆓';
            text += `${i + 1}. ${plan} ${u.full_name || 'N/A'}\n   📧 \`${u.email}\`\n   🆔 \`${u.user_id}\`\n\n`;
        });

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, text, { parse_mode: 'Markdown' });
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, `❌ Error: ${err.message}`);
    }
}

async function handlePaymentsCallback(ctx) {
    if (!supabase) {
        await ctx.reply('🔴 Database not available');
        return;
    }

    const loadingMsg = await ctx.reply('⏳ Loading payment requests...');

    try {
        const { data: payments } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5);

        if (!payments || payments.length === 0) {
            await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, '📭 No pending payments.');
            return;
        }

        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id,
            `💰 *Pending Payments (${payments.length})*\n\nSelect a payment to approve/reject:`,
            { parse_mode: 'Markdown' }
        );

        for (const p of payments) {
            const keyboard = new InlineKeyboard()
                .text('✅ Approve', `approve_${p.id}`)
                .text('❌ Reject', `reject_${p.id}`);

            await ctx.reply(
                `💳 *Payment Request*\n\n` +
                `👤 ${p.full_name}\n` +
                `📧 ${p.email}\n` +
                `💳 Method: ${p.method}\n` +
                `🔢 TX: \`${p.transaction_id}\`\n` +
                `📅 ${new Date(p.created_at).toLocaleDateString()}`,
                { parse_mode: 'Markdown', reply_markup: keyboard }
            );
        }
    } catch (err) {
        await ctx.api.editMessageText(ctx.chat.id, loadingMsg.message_id, `❌ Error: ${err.message}`);
    }
}

// ============================================================
// ERROR HANDLING
// ============================================================

bot.catch((err) => {
    console.error('Bot error:', err.message);
});

// ============================================================
// START BOT
// ============================================================

bot.start({
    onStart: () => {
        console.log('✨ Luminary AI Admin Bot is running...');
        console.log(`⏰ Started at: ${new Date().toISOString()}`);
        console.log(`👑 Super Admins: ${SUPER_ADMIN_IDS.join(', ') || 'None'}`);
        console.log(`👥 Admins: ${ADMIN_IDS.join(', ') || 'None'}`);
        console.log(`🗄️ Database: ${supabase ? 'Connected' : 'Standalone Mode'}`);
        console.log(`🌐 Platform: ${APP_URL}`);
        console.log('👨‍💻 Developer: Zaniyar Al-Mzurii');
    },
});

module.exports = bot;
