// api/webhook.js
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;

// Simpan respon sementara (gunakan Vercel KV untuk produksi)
const responses = new Map();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const bot = new TelegramBot(BOT_TOKEN);
    const { callback_query } = req.body;

    if (!callback_query) {
      return res.json({ ok: true });
    }

    const { data, from, message } = callback_query;
    const match = data.match(/^task_(done|pending|failed)_(.+)$/);

    if (!match) {
      await bot.answerCallbackQuery(callback_query.id, 'Invalid action');
      return res.json({ ok: true });
    }

    const [, status, category] = match;
    const fromId = from.id;
    const firstName = from.first_name;

    // Validasi admin (simplified)
    const ADMIN_CONFIG = {
      INTI: { admins: [5895716664] },
      INFOKOM: { admins: [8193445272, 5895716664] },
      GK3: { admins: [5895716664] }
    };

    const config = ADMIN_CONFIG[category];
    if (!config || !config.admins.includes(fromId)) {
      await bot.answerCallbackQuery(
        callback_query.id,
        '❌ Anda bukan admin kategori ' + category,
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
    if (!responses.has(key)) {
      responses.set(key, new Map());
    }
    responses.get(key).set(String(fromId), statusLabel[status]);

    await bot.answerCallbackQuery(
      callback_query.id,
      `${statusLabel[status]} - Tercatat!`
    );

    // Update pesan dengan status terbaru
    const responseList = Array.from(responses.get(key).entries())
      .map(([id, stat]) => `• ${id}: ${stat}`)
      .join('\n');

    const updatedText = message.text + `\n\n📊 *Update Status:*\n${responseList}`;

    await bot.editMessageText(updatedText, {
      chat_id: message.chat.id,
      message_id: message.message_id,
      parse_mode: 'Markdown',
      reply_markup: message.reply_markup
    }).catch(() => {});

    console.log(`✔️ Admin ${firstName} (${fromId}) merespons ${category}: ${statusLabel[status]}`);

    return res.json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};
