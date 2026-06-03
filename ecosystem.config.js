module.exports = {
  apps: [
    {
      name: 'fitxeno-backend',
      script: './server/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      // Smooth reload configurations
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000
    }
  ]
};
