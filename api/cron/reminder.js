// api/cron/reminder.js
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
  INTI: [{ day: 1, time: '15:00', title: 'Latihan Rutin', description: 'Latihan Rutin Pagaska' }],
  INFOKOM: [
    { day: 2, time: '07:00', title: 'Selasa Nusantara', description: 'Kegiatan Rutin INFOKOM' },
    { day: 4, time: '07:00', title: 'Kamis Jas Merah', description: 'Proker Video Sejarah' }
  ],
  GK3: [{ day: 3, time: '07:00', title: 'Rabu Baris-berbaris', description: 'Proker Video GK3' }]
};

function getDayName(dayNumber) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayNumber];
}

module.exports = async (req, res) => {
  // Cepat return kalau method selain GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type } = req.query;
  
  // Validasi cepat
  if (!type || !ADMIN_CONFIG[type]) {
    return res.status(400).json({ 
      error: 'Invalid category',
      available: Object.keys(ADMIN_CONFIG)
    });
  }

  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN not configured' });
  }

  try {
    const bot = new TelegramBot(BOT_TOKEN);
    const config = ADMIN_CONFIG[type];
    const today = new Date().getDay();
    const task = TASKS_SCHEDULE[type]?.find(t => t.day === today);

    if (!task) {
      return res.json({ 
        status: 'skipped', 
        message: `No task for ${type} today (${getDayName(today)})` 
      });
    }

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Sudah Dikerjakan', callback_data: `task_done_${type}` },
          { text: '⏳ Belum Dimulai', callback_data: `task_pending_${type}` }
        ],
        [
          { text: '❌ Tidak Bisa Dikerjakan', callback_data: `task_failed_${type}` }
        ]
      ]
    };

    const text = `
${config.color} *REMINDER ${config.name}* ${config.color}
────────────────────────────────
📅 *Hari:* ${getDayName(task.day)}
🕐 *Jam:* ${task.time}
🎯 *Kegiatan:* ${task.title}
📝 *Deskripsi:* ${task.description}

👥 *Admin:* ${config.admins.map(id => `\`${id}\``).join(', ')}

⚠️ Silakan konfirmasi status tugas!
`;

    const msg = await bot.sendMessage(GROUP_CHAT_ID, text, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    return res.json({
      status: 'success',
      category: type,
      messageId: msg.message_id,
      task: task.title
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message,
      category: type
    });
  }
};
