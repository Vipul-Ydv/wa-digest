// pm2 process config — for running wa-digest quietly in the background
// on a laptop or server (Windows, macOS, Linux).
//
// IMPORTANT: link your account first with an interactive run (`npm start`) so
// you can scan the QR. pm2 detaches the terminal, so the QR won't be visible
// under pm2. Once auth_info/ exists, start it with pm2:
//
//   npm install -g pm2
//   pm2 start ecosystem.config.cjs
//   pm2 save           # remember it across restarts
//   pm2 startup        # follow the printed command to launch on boot
//
// Handy: `pm2 logs wa-digest`, `pm2 restart wa-digest`, `pm2 stop wa-digest`.

module.exports = {
  apps: [
    {
      name: 'wa-digest',
      script: 'src/index.js',
      interpreter: 'node',
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
      // The summarizer holds messages in memory only; a small cap is plenty
      // and guards against runaway growth on a long-running machine.
      max_memory_restart: '300M',
    },
  ],
};
