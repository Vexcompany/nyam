// api/webhook.js - Universal Web Handler
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;

// Simpan respon di memory (gunakan Vercel KV untuk produksi)
global.responses = global.responses || new Map();

const ADMIN_CONFIG = {
  INTI: { admins: [5895716664] },
  INFOKOM: { admins: [8193445272, 5895716664] },
  GK3: { admins: [5895716664] },
  DISARDA: { admins: [5895716664] }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bot = new TelegramBot(BOT_TOKEN);
    const { callback_query, message: msg } = req.body;

    // Handle Callback Query (Tombol inline)
    if (callback_query) {
      const { data, from, message } = callback_query;
      const match = data.match(/^task_(done|pending|failed)_(.+)$/);

      if (!match) {
        await bot.answerCallbackQuery(callback_query.id);
        return res.json({ ok: true });
      }

      const [, status, category] = match;
      const fromId = from.id;
      const config = ADMIN_CONFIG[category];

      // Cek admin
      if (!config || !config.admins.includes(fromId)) {
        await bot.answerCallbackQuery(
          callback_query.id,
          '❌ Anda bukan admin ' + category,
          true
        );
        return res.json({ ok: true });
      }

      const statusLabel = {
        done: '✅ Sudah Dikerjakan',
        pending: '⏳ Belum Dimulai',
        failed: '❌ Tidak Bisa Dikerjakan'
      };

      // Simpan respon
      const key = `${category}_${message.message_id}`;
      if (!global.responses.has(key)) {
        global.responses.set(key, new Map());
      }
      global.responses.get(key).set(String(fromId), statusLabel[status]);

      await bot.answerCallbackQuery(
        callback_query.id,
        `${statusLabel[status]} - Tercatat!`
      );

      // Update pesan dengan status
      const responseList = Array.from(global.responses.get(key).entries())
        .map(([id, stat]) => `• \`${id}\`: ${stat}`)
        .join('\n');

      const updatedText = message.text + `\n\n📊 *Status Update:*\n${responseList}`;

      await bot.editMessageText(updatedText, {
        chat_id: message.chat.id,
        message_id: message.message_id,
        parse_mode: 'Markdown',
        reply_markup: message.reply_markup
      }).catch(() => {});

      return res.json({ ok: true });
    }

    // Handle Regular Messages (Commands)
    if (msg && msg.text) {
      const chatId = msg.chat.id;
      const text = msg.text;

      // Command: /start
      if (text === '/start') {
        await bot.sendMessage(chatId, `
🤖 *PAGASKA AI BOT*

Bot reminder dan manajemen tugas PAGASKA.

*Command Tersedia:*
/remind \\<kategori\\> \\- Kirim reminder manual
/status \\- Cek status bot

*Kategori:* INTI, INFOKOM, GK3, DISARDA
        `, { parse_mode: 'MarkdownV2' });
      }

      // Command: /status
      if (text === '/status') {
        await bot.sendMessage(chatId, '✅ Bot aktif dan berjalan normal!');
      }
    }

    return res.json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};
