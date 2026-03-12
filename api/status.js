// api/status.js - Untuk monitoring cron-job.org
module.exports = (req, res) => {
  const status = {
    status: 'online',
    service: 'Pagaska AI Cron',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Jakarta',
    version: '1.0.0',
    endpoints: [
      '/api/cron/reminder?type=INTI',
      '/api/cron/reminder?type=INFOKOM', 
      '/api/cron/reminder?type=GK3',
      '/api/cron/warning?type=INTI',
      '/api/cron/warning?type=INFOKOM',
      '/api/cron/warning?type=GK3',
      '/api/cron/ultah'
    ]
  };
  
  res.json(status);
};
