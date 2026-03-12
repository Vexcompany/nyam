// api/cron/ultah.js
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || "-1003381086612";

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const bot = new TelegramBot(BOT_TOKEN);
    
    // Baca database users (simpan di Vercel KV atau database external untuk produksi)
    // Untuk sekarang menggunakan mock data atau baca dari file jika ada
    let users = {};
    try {
      const data = await fs.readFile(path.join(process.cwd(), 'database', 'users.json'), 'utf8');
      users = JSON.parse(data);
    } catch {
      return res.json({ status: 'skipped', message: 'Users database not found' });
    }

    const today = new Date().toLocaleDateString("id-ID", {
      day: '2-digit',
      month: '2-digit'
    }).replace("/", "-");

    const list = Object.values(users).filter(u => u.ultah === today);

    if (!list.length) {
      return res.json({ status: 'skipped', message: 'No birthdays today' });
    }

    const message = `
<b>🎉 ULANG TAHUN HARI INI 🎂</b>

<blockquote>
${list.map(u => `🎈 ${u.nama}`).join('\n')}
</blockquote>

Semoga sehat selalu dan panjang umur
<b>PAGASKA 🐉</b>
`;

    await bot.sendMessage(GROUP_CHAT_ID, message, { parse_mode: 'HTML' });

    return res.json({
      status: 'success',
      birthdays: list.length,
      names: list.map(u => u.nama),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error:`, error);
    return res.status(500).json({ error: error.message });
  }
};
