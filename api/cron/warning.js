// api/cron/warning.js
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || "-1003381086612";

const ADMIN_CONFIG = {
  INTI: {
    admins: [5895716664],
    name: 'INTI',
    emoji: '🗂️',
    color: '⚪'
  },
  INFOKOM: {
    admins: [8193445272, 5895716664],
    name: 'INFOKOM',
    emoji: '💻',
    color: '🔵'
  },
  GK3: {
    admins: [5895716664],
    name: 'GK3',
    emoji: '🇮🇩',
    color: '🔴'
  }
};

const TASKS_SCHEDULE = {
  INTI: [{ day: 1, time: '15:00', title: 'Latihan Rutin' }],
  INFOKOM: [
    { day: 2, time: '07:00', title: 'Selasa Nusantara' },
    { day: 4, time: '07:00', title: 'Kamis Jas Merah' }
  ],
  GK3: [{ day: 3, time: '07:00', title: 'Rabu Baris-berbaris' }]
};

function getDayName(dayNumber) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayNumber];
}

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type } = req.query;
  
  if (!type || !ADMIN_CONFIG[type]) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const bot = new TelegramBot(BOT_TOKEN);
    const config = ADMIN_CONFIG[type];
    const today = new Date().getDay();
    const task = TASKS_SCHEDULE[type]?.find(t => t.day === today);

    if (!task) {
      return res.json({ status: 'skipped', message: 'No task today' });
    }

    // Simulasi data respon (dalam produksi, simpan di database)
    const warningText = `
⚠️ *WARNING - ${config.name}* ⚠️
────────────────────

🎯 *Tugas:* ${task.title}
⏰ *Status:* Belum ada konfirmasi dari admin

👥 *Admin yang BELUM merespon:*
${config.admins.map(id => `• \\`${id}\\` ❌`).join('\n')}

⚡ *URGENT!* Segera konfirmasi status tugas Anda!
`;

    await bot.sendMessage(GROUP_CHAT_ID, warningText, {
      parse_mode: 'MarkdownV2'
    });

    return res.json({
      status: 'success',
      category: type,
      warning: 'sent',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error:`, error);
    return res.status(500).json({ error: error.message });
  }
};
