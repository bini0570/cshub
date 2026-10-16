import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

let bot = null;

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Start the Telegram Bot instance
 */
export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('⚠️ Cannot start Telegram Bot: TELEGRAM_BOT_TOKEN is missing.');
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://cshub-student.vercel.app';

  // Prevent multiple polling bot instances (Problem 49)
  if (bot) {
    try {
      bot.stopPolling();
    } catch (e) {}
  }

  bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Telegram Bot started and polling for commands...');

  // Catch polling conflicts gracefully (e.g. during Railway container rotation)
  bot.on('polling_error', (err) => {
    if (err.message && err.message.includes('409 Conflict')) {
      return;
    }
    console.warn('Telegram polling warning:', err.message || err);
  });

  // Set global bot menu button for Web App
  try {
    bot.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: '🎓 Open CS Hub',
        web_app: { url: frontendUrl },
      },
    }).catch(() => {});
  } catch (e) {}

  // --- /start Command ---
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const firstName = escapeHtml(msg.from.first_name || 'Student');

    try {
      const userRes = await query(`SELECT * FROM users WHERE telegram_id = $1`, [Number(telegramId)]);

      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];

        // Problem 44 & 45: Check account status
        if (user.status === 'banned' || user.status === 'suspended') {
          await bot.sendMessage(
            chatId,
            `🚫 <b>Account Suspended:</b> Your CS Hub student account has been restricted. Please contact the department administration.`,
            { parse_mode: 'HTML' }
          );
          return;
        }

        // 1. Remove any lingering contact keyboard
        await bot.sendMessage(
          chatId,
          `👋 Welcome back to <b>CS Hub</b>, ${escapeHtml(user.full_name || firstName)}!`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              remove_keyboard: true,
            },
          }
        ).catch(() => {});

        // 2. Ensure chat menu button is configured
        try {
          await bot.setChatMenuButton({
            chat_id: chatId,
            menu_button: {
              type: 'web_app',
              text: '🎓 Open CS Hub',
              web_app: { url: frontendUrl },
            },
          });
        } catch (menuErr) {}

        // 3. Send launch card with inline Web App button
        bot.sendMessage(
          chatId,
          `Your student account is active.\n\nTap the button below to launch the <b>CS Hub Mini App</b>:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 Open Student Web App',
                    web_app: { url: frontendUrl },
                  },
                ],
              ],
            },
          }
        );
      } else {
        // Not registered: prompt to share contact
        bot.sendMessage(
          chatId,
          `🎓 <b>Welcome to CS Hub</b>, ${firstName}!\n\n` +
          `CS Hub is your centralized platform for Computer Science course materials, cheatsheets, developer tools, and career opportunities.\n\n` +
          `To activate your student account, please verify your phone number by tapping the button below:`,
          {
            parse_mode: 'HTML',
            reply_markup: {
              keyboard: [
                [
                  {
                    text: '📱 Share Phone Number to Register',
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        );
      }
    } catch (err) {
      console.error('Bot /start error:', err);
      bot.sendMessage(chatId, '❌ An error occurred. Please try again with /start.');
    }
  });

  // --- Handle Shared Contact (Registration - Problem 7, 47, 48) ---
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const contact = msg.contact;

    if (!contact) return;

    // Contact ownership verification (Problem 7 & 48)
    if (contact.user_id && Number(contact.user_id) !== Number(telegramId)) {
      await bot.sendMessage(
        chatId,
        '❌ <b>Security Alert:</b> You must share your own phone number from your Telegram account to register. Shared third-party contacts are rejected.',
        { parse_mode: 'HTML' }
      );
      return;
    }

    try {
      const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
                       [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') ||
                       'Student';
      const rawPhone = String(contact.phone_number || '').trim();
      const phone = rawPhone.startsWith('+') ? rawPhone : (rawPhone ? `+${rawPhone}` : '');
      const username = msg.from.username || null;
      const userId = `student-${telegramId}`;

      // Enforce phone number uniqueness (Problem 47)
      if (phone) {
        const existingPhone = await query(
          `SELECT id, telegram_id FROM users WHERE phone = $1 AND telegram_id != $2`,
          [phone, Number(telegramId)]
        );
        if (existingPhone.rows.length > 0) {
          await bot.sendMessage(
            chatId,
            '❌ <b>Registration Conflict:</b> This phone number is already registered to another student account.',
            { parse_mode: 'HTML' }
          );
          return;
        }
      }

      // Insert or update student record in DB
      await query(
        `INSERT INTO users (id, telegram_id, telegram_username, full_name, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'student')
         ON CONFLICT (telegram_id) DO UPDATE SET
           full_name = EXCLUDED.full_name,
           telegram_username = EXCLUDED.telegram_username,
           phone = EXCLUDED.phone`,
        [userId, Number(telegramId), username, fullName, phone]
      );

      // Step 1: Dismiss contact-sharing keyboard
      await bot.sendMessage(
        chatId,
        `✅ <b>Phone number verified:</b> <code>${escapeHtml(phone)}</code>`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            remove_keyboard: true,
          },
        }
      ).catch(() => {});

      // Step 2: Set persistent chat menu button to launch Web App
      try {
        await bot.setChatMenuButton({
          chat_id: chatId,
          menu_button: {
            type: 'web_app',
            text: '🎓 Open CS Hub',
            web_app: { url: frontendUrl },
          },
        });
      } catch (menuErr) {}

      // Step 3: Send registration success message with inline Web App launch button
      await bot.sendMessage(
        chatId,
        `🎉 <b>Registration Successful!</b>\n\n` +
        `Welcome to CS Hub, <b>${escapeHtml(fullName)}</b>!\n\n` +
        `Your student profile is active. Tap the button below to launch the <b>CS Hub Mini App</b>:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Open Student Web App',
                  web_app: { url: frontendUrl },
                },
              ],
            ],
          },
        }
      );
    } catch (err) {
      console.error('Contact registration error:', err);
      bot.sendMessage(chatId, '❌ Registration failed due to a database error. Please try again with /start.');
    }
  });

  // --- /login Command for Website Verification (Problem 10 & 11) ---
  bot.onText(/\/login/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
      const userRes = await query(`SELECT * FROM users WHERE telegram_id = $1`, [Number(telegramId)]);
      if (userRes.rows.length === 0) {
        await bot.sendMessage(chatId, '⚠️ You must register first. Please type /start and share your contact.');
        return;
      }

      const user = userRes.rows[0];
      if (user.status === 'banned' || user.status === 'suspended') {
        await bot.sendMessage(chatId, '🚫 Your account is suspended.');
        return;
      }

      // Invalidate any previous unused codes (Problem 10 & 11)
      await query(`UPDATE telegram_auth_codes SET used = TRUE WHERE user_id = $1 AND used = FALSE`, [user.id]);

      // Generate cryptographically secure 6-digit code
      const code = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes TTL

      await query(
        `INSERT INTO telegram_auth_codes (code, telegram_id, user_id, expires_at, used)
         VALUES ($1, $2, $3, $4, FALSE)`,
        [code, Number(telegramId), user.id, expiresAt]
      );

      await bot.sendMessage(
        chatId,
        `🔑 <b>Your Web Login Code:</b>\n\n<code>${code}</code>\n\n` +
        `This code expires in <b>5 minutes</b> and can only be used once. Never share this code with anyone.`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error('/login error:', err);
      bot.sendMessage(chatId, '❌ Failed to generate verification code. Please try again.');
    }
  });

  // --- /profile Command ---
  bot.onText(/\/profile/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
      const userRes = await query(`SELECT * FROM users WHERE telegram_id = $1`, [telegramId]);
      if (userRes.rows.length === 0) {
        bot.sendMessage(chatId, '⚠️ You are not registered yet. Type /start to register.');
        return;
      }

      const user = userRes.rows[0];
      bot.sendMessage(
        chatId,
        `👤 <b>Student Profile</b>\n\n` +
        `• <b>Name:</b> ${escapeHtml(user.full_name)}\n` +
        `• <b>Username:</b> ${user.telegram_username ? '@' + escapeHtml(user.telegram_username) : 'N/A'}\n` +
        `• <b>Phone:</b> <code>${escapeHtml(user.phone || 'Verified')}</code>\n` +
        `• <b>Role:</b> ${escapeHtml(user.role || 'Student')}\n` +
        `• <b>Status:</b> ${escapeHtml(user.status || 'Active')}\n\n` +
        `Tap below to open your Mini App:`,
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Open Student Web App',
                  web_app: { url: frontendUrl },
                },
              ],
            ],
          },
        }
      );
    } catch (err) {
      bot.sendMessage(chatId, '❌ Could not load profile.');
    }
  });

  // --- /help Command ---
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `📖 <b>CS Hub Bot Commands:</b>\n\n` +
      `/start - Start registration or open Student Mini App\n` +
      `/login - Generate a 5-minute one-time login code for the web portal\n` +
      `/profile - View your registered student record\n` +
      `/help - Show this guide`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Open Student Web App',
                web_app: { url: frontendUrl },
              },
            ],
          ],
        },
      }
    );
  });
}

/**
 * Send a document directly to a student's Telegram chat
 */
export async function sendDocumentToUser(telegramId, fileUrlOrPath, caption = '') {
  if (!bot) {
    console.warn('Telegram bot is not initialized');
    return false;
  }
  try {
    await bot.sendDocument(telegramId, fileUrlOrPath, {
      caption: caption || '📚 Study material from CS Hub',
      parse_mode: 'HTML',
    });
    return true;
  } catch (err) {
    console.error('Failed to send document to telegram user:', err.message);
    try {
      await bot.sendMessage(
        telegramId,
        `📚 <b>CS Hub Study Material</b>\n\n${caption}\n\n<a href="${fileUrlOrPath}">Download File</a>`,
        { parse_mode: 'HTML' }
      );
      return true;
    } catch (msgErr) {
      console.error('Failed to send link message fallback:', msgErr.message);
      return false;
    }
  }
}

/**
 * Send a direct notification message to a student
 */
export async function notifyStudent(telegramId, message) {
  if (!bot) return false;
  try {
    await bot.sendMessage(telegramId, message, { parse_mode: 'HTML' });
    return true;
  } catch (err) {
    console.error('Failed to notify student:', err.message);
    return false;
  }
}

/**
 * Broadcast an announcement to all registered students
 */
export async function broadcastToStudents(message) {
  if (!bot) return { sent: 0, failed: 0 };
  try {
    const res = await query('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL');
    let sent = 0;
    let failed = 0;

    for (const row of res.rows) {
      if (row.telegram_id) {
        try {
          await bot.sendMessage(row.telegram_id, message, { parse_mode: 'HTML' });
          sent++;
        } catch (e) {
          failed++;
        }
      }
    }
    return { sent, failed };
  } catch (err) {
    console.error('Broadcast error:', err);
    return { sent: 0, failed: 0, error: err.message };
  }
}

export function getBotInstance() {
  return bot;
}

// Standalone runner if executed directly via `node bot.js`
if (process.argv[1]?.endsWith('bot.js')) {
  console.log('Running Telegram Bot in standalone mode...');
  startTelegramBot();
}
