const path = require('path');

const root = __dirname;
const backendPort = process.env.CE_CHATBOT_BACKEND_PORT || '4001';
const frontendPort = process.env.CE_CHATBOT_FRONTEND_PORT || '5174';

module.exports = {
  apps: [
    {
      name: 'policy-chatbot-backend',
      script: path.join(root, 'backend/venv/bin/gunicorn'),
      args: [
        '--workers', '1',
        '--worker-class', 'sync',
        '--timeout', '120',
        '--bind', `0.0.0.0:${backendPort}`,
        '--access-logfile', path.join(root, 'logs/backend-access.log'),
        'app:app',
      ].join(' '),
      cwd: path.join(root, 'backend'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 15000,
      env: {
        PYTHONUNBUFFERED: '1',
      },
      error_file: path.join(root, 'logs/backend-error.log'),
      out_file: path.join(root, 'logs/backend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'policy-chatbot-frontend',
      script: 'npm',
      args: 'run start',
      cwd: path.join(root, 'frontend'),
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: frontendPort,
      },
      error_file: path.join(root, 'logs/frontend-error.log'),
      out_file: path.join(root, 'logs/frontend-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
