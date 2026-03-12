// api/cron/reminder.js
const TelegramBot = require('node-telegram-bot-api');

// ═══════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || "-1003381086612";

const ADMIN_CONFIG = {
  INTI: {
    admins: [5895716664],
    members: [111111111, 222222222, 333333333],
    name: 'INTI',
    emoji: '🗂️',
    color: '⚪',
    targetId: "-1003381086612"
  },
  INFOKOM: {
    admins: [8193445272, 5895716664],
    members: [6613152462, 5070361794, 8053375986],
    name: 'INFOKOM',
    emoji: '💻',
    color: '🔵',
    targetId: "-1003381086612"
  },
  GK3: {
    admins: [5895716664],
    members: [111111111, 222222222, 333333333],
    name: 'GK3',
    emoji: '🇮🇩',
    color: '🔴',
    targetId: "-1003381086612"
  },
  DISARDA: {
    admins: [5895716664],
    members: [111111111, 222222222, 333333333],
    name: 'DISARDA',
    emoji: '👕',
    color: '🟢',
    targetId: "-1003381086612"
  }
};

const TASKS_SCHEDULE = {
  INTI: [
    { day: 1, time: '15:00', title: 'Latihan Rutin', description: 'Latihan Rutin Pagaska' }
  ],
  INFOKOM: [
    { day: 2, time: '07:00', title: 'Selasa Nusantara', description: 'Kegiatan Rutin INFOKOM' },
    { day: 4, time: '07:00', title: 'Kamis Jas Merah', description: 'Proker Video Sejarah' }
  ],
  GK3: [
    { day: 3, time: '07:00', title: 'Rabu Baris-berbaris', description: 'Proker Video GK3' }
  ]
};

// ═══════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════

function getDayName(dayNumber) {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[dayNumber];
}

function getTodayTask(category) {
  const today = new Date().getDay();
  const tasks = TASKS_SCHEDULE[category];
  if (!tasks) return null;
  return tasks.find(t => t.day === today);
}

function buildReminderText(category) {
  const config = ADMIN_CONFIG[category];
  const task = getTodayTask(category);
  
  if (!config) return '❌ Data tidak ditemukan';
  
  if (!task) {
    return `${config.color} *REMINDER ${config.name}* ${config.color}\n\n❌ Tidak ada tugas terjadwal hari ini.`;
  }

  return `
${config.color} *REMINDER ${config.name}* ${config.color}
────────────────────────────────

📅 *Hari:* ${getDayName(task.day)}
🕐 *Jam:* ${task.time}
🎯 *Kegiatan:* ${task.title}
📝 *Deskripsi:* ${task.description}

👥 *Admin ${config.name}:*
${config.admins.map(id => `• ID: \\`${id}\\``).join('\n')}

⚠️ *Perhatian:*
Silakan konfirmasi status tugas ini segera.

${config.emoji} Reminder dikirim ke semua admin ${config.name}
`;
}

// ═══════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════

module.exports = async (req, res) => {
  // Cek authorization (opsional tapi direkomendasikan)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type } = req.query;
  
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
    const task = getTodayTask(type);

    if (!task) {
      return res.json({ 
        status: 'skipped', 
        message: `No task scheduled for ${type} today` 
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

    const reminderText = buildReminderText(type);

    const msg = await bot.sendMessage(GROUP_CHAT_ID, reminderText, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard
    });

    console.log(`✅ Reminder ${type} sent: ${msg.message_id}`);
    
    return res.json({
      status: 'success',
      category: type,
      messageId: msg.message_id,
      task: task.title,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Error sending reminder ${type}:`, error);
    return res.status(500).json({
      status: 'error',
      category: type,
      error: error.message
    });
  }
};
