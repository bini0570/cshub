import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { query } from './db.js';

dotenv.config();

let bot = null;

// User registration state machine in memory
// Map<telegram_id, { step: string, data: object }>
const registrationSessions = new Map();

/**
 * Generate secure 6-digit random code
 */
function generateLoginCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  bot = new TelegramBot(token, { polling: true });
  console.log('🤖 Telegram Bot started and polling for commands...');

  // Catch polling conflicts gracefully (e.g. during Railway container rotation)
  bot.on('polling_error', (err) => {
    if (err.message && err.message.includes('409 Conflict')) {
      return;
    }
    console.warn('Telegram polling warning:', err.message || err);
  });

  // --- /start Command ---
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const firstName = msg.from.first_name || 'Student';

    try {
      const userRes = await query(`SELECT * FROM users WHERE telegram_id = $1`, [telegramId]);

      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        bot.sendMessage(
          chatId,
          `👋 Welcome back to **CS Hub**, ${user.full_name}!\n\n` +
          `Your student account is active. What would you like to do?\n\n` +
          `🔑 /code - Generate a 6-digit code to log into the web portal\n` +
          `👤 /profile - View your student profile\n` +
          `❓ /help - View all available commands`,
          { parse_mode: 'Markdown' }
        );
      } else {
        bot.sendMessage(
          chatId,
          `🎓 Welcome to **CS Hub**, ${firstName}!\n\n` +
          `CS Hub is your centralized platform for Computer Science course summaries, cheatsheets, tools, and developer resources.\n\n` +
          `To access the web platform, please register your student account:\n` +
          `👉 Type **/register** to begin your registration.`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (err) {
      console.error('Bot /start error:', err);
      bot.sendMessage(chatId, '❌ An error occurred while checking your status. Please try again later.');
    }
  });

  // --- /help Command ---
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId,
      `📖 **CS Hub Bot Commands:**\n\n` +
      `/start - Welcome message and account check\n` +
      `/register - Register your student profile\n` +
      `/code - Generate a 6-digit web login code\n` +
      `/profile - View your registered student details\n` +
      `/cancel - Cancel any ongoing registration`,
      { parse_mode: 'Markdown' }
    );
  });

  // --- /cancel Command ---
  bot.onText(/\/cancel/, (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    if (registrationSessions.has(telegramId)) {
      registrationSessions.delete(telegramId);
      bot.sendMessage(chatId, '🚫 Registration canceled. You can type /register anytime to restart.');
    } else {
      bot.sendMessage(chatId, 'No active process to cancel.');
    }
  });

  // --- /register Command ---
  bot.onText(/\/register/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
      const existing = await query(`SELECT * FROM users WHERE telegram_id = $1`, [telegramId]);
      if (existing.rows.length > 0) {
        bot.sendMessage(
          chatId,
          `ℹ️ You are already registered as **${existing.rows[0].full_name}**!\n` +
          `Use **/code** to log into the website.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      registrationSessions.set(telegramId, {
        step: 'awaiting_name',
        data: {
          telegram_id: telegramId,
          telegram_username: msg.from.username || null,
        },
      });

      bot.sendMessage(
        chatId,
        `📝 **CS Hub Student Registration**\n\n` +
        `Step 1/4: Please enter your **Full Name** (e.g. *Biniyam Eyoel*):`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Bot /register error:', err);
      bot.sendMessage(chatId, '❌ Database error. Please try again.');
    }
  });

  // --- /code Command (Generate Web Login Code) ---
  bot.onText(/\/code/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
      const userRes = await query(`SELECT * FROM users WHERE telegram_id = $1`, [telegramId]);
      if (userRes.rows.length === 0) {
        bot.sendMessage(
          chatId,
          `⚠️ You must register first before generating a login code.\nType **/register** to begin.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      const user = userRes.rows[0];
      const code = generateLoginCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Invalidate old codes
      await query(`UPDATE telegram_auth_codes SET used = TRUE WHERE telegram_id = $1`, [telegramId]);

      // Insert new code
      await query(
        `INSERT INTO telegram_auth_codes (code, telegram_id, user_id, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [code, telegramId, user.id, expiresAt]
      );

      const frontendUrl = process.env.FRONTEND_URL || 'https://your-cshub.vercel.app';
      const quickLoginLink = `${frontendUrl}/login?code=${code}`;

      bot.sendMessage(
        chatId,
        `🔐 **Your CS Hub Login Code:**\n\n` +
        `\`${code}\`\n\n` +
        `⏳ Valid for **10 minutes**.\n\n` +
        `Enter this code on the website login page, or tap the link below:\n` +
        `🔗 [Click here to Login directly](${quickLoginLink})`,
        { parse_mode: 'Markdown', disable_web_page_preview: true }
      );
    } catch (err) {
      console.error('Bot /code error:', err);
      bot.sendMessage(chatId, '❌ Failed to generate login code. Please try again.');
    }
  });

  // --- /profile Command ---
  bot.onText(/\/profile/, async (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id;

    try {
      const userRes = await query(`SELECT * FROM users WHERE telegram_id = $1`, [telegramId]);
      if (userRes.rows.length === 0) {
        bot.sendMessage(chatId, '⚠️ You are not registered yet. Type /register to register.');
        return;
      }

      const u = userRes.rows[0];
      bot.sendMessage(
        chatId,
        `👤 **Student Profile:**\n\n` +
        `• **Name:** ${u.full_name}\n` +
        `• **Student ID:** ${u.student_id}\n` +
        `• **Department:** ${u.department || 'Computer Science'}\n` +
        `• **Academic Year:** Year ${u.academic_year || 1}\n` +
        `• **Role:** ${u.role}\n` +
        `• **Registered:** ${new Date(u.created_at).toLocaleDateString()}\n\n` +
        `Use **/code** whenever you want to sign into the CS Hub website.`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      bot.sendMessage(chatId, '❌ Could not load profile.');
    }
  });

  // --- Message Listener for Interactive Registration Conversation ---
  bot.on('message', async (msg) => {
    const text = msg.text?.trim();
    if (!text || text.startsWith('/')) return; // Ignore slash commands

    const chatId = msg.chat.id;
    const telegramId = msg.from.id;
    const session = registrationSessions.get(telegramId);

    if (!session) return;

    try {
      switch (session.step) {
        case 'awaiting_name': {
          session.data.full_name = text;
          session.step = 'awaiting_student_id';
          bot.sendMessage(
            chatId,
            `✅ Thanks, **${text}**!\n\n` +
            `Step 2/4: Please enter your **Student ID** (e.g. *UGR/9821/14*):`,
            { parse_mode: 'Markdown' }
          );
          break;
        }

        case 'awaiting_student_id': {
          session.data.student_id = text.toUpperCase();
          session.step = 'awaiting_department';
          bot.sendMessage(
            chatId,
            `Step 3/4: Please enter your **Department** (e.g. *Computer Science*, *Software Engineering*, *Information Systems*):`,
            { parse_mode: 'Markdown' }
          );
          break;
        }

        case 'awaiting_department': {
          session.data.department = text;
          session.step = 'awaiting_year';
          bot.sendMessage(
            chatId,
            `Step 4/4: What **Academic Year** are you in? (Enter a number: *1*, *2*, *3*, or *4*):`,
            { parse_mode: 'Markdown' }
          );
          break;
        }

        case 'awaiting_year': {
          const year = parseInt(text, 10);
          if (isNaN(year) || year < 1 || year > 7) {
            bot.sendMessage(chatId, '⚠️ Please enter a valid academic year number (e.g. 1, 2, 3, 4):');
            return;
          }
          session.data.academic_year = year;

          // Save student in PostgreSQL
          const userId = `student-${telegramId}`;
          await query(
            `INSERT INTO users (
              id, telegram_id, telegram_username, student_id,
              full_name, department, academic_year, role
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'student')
            ON CONFLICT (telegram_id) DO UPDATE SET
              student_id = EXCLUDED.student_id,
              full_name = EXCLUDED.full_name,
              department = EXCLUDED.department,
              academic_year = EXCLUDED.academic_year`,
            [
              userId,
              session.data.telegram_id,
              session.data.telegram_username,
              session.data.student_id,
              session.data.full_name,
              session.data.department,
              session.data.academic_year,
            ]
          );

          // Generate initial login code
          const code = generateLoginCode();
          const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
          await query(
            `INSERT INTO telegram_auth_codes (code, telegram_id, user_id, expires_at)
             VALUES ($1, $2, $3, $4)`,
            [code, telegramId, userId, expiresAt]
          );

          registrationSessions.delete(telegramId);

          const frontendUrl = process.env.FRONTEND_URL || 'https://your-cshub.vercel.app';
          const quickLoginLink = `${frontendUrl}/login?code=${code}`;

          bot.sendMessage(
            chatId,
            `🎉 **Registration Complete!**\n\n` +
            `Welcome to CS Hub, **${session.data.full_name}**!\n\n` +
            `Your web login code is: \`${code}\`\n\n` +
            `🔗 [Click here to Login directly on the website](${quickLoginLink})\n\n` +
            `Anytime you need to sign in later, just send **/code** to this bot!`,
            { parse_mode: 'Markdown', disable_web_page_preview: true }
          );
          break;
        }

        default:
          registrationSessions.delete(telegramId);
      }
    } catch (err) {
      console.error('Error during registration step:', err);
      bot.sendMessage(chatId, '❌ An error occurred during registration. Please try again with /register.');
      registrationSessions.delete(telegramId);
    }
  });
}

// Standalone runner if executed directly via `node bot.js`
if (process.argv[1]?.endsWith('bot.js')) {
  console.log('Running Telegram Bot in standalone mode...');
  startTelegramBot();
}
