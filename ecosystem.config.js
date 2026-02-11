module.exports = {
  apps: [
    {
      name: "beauty-api",
      script: "./server.js",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 5000,
        HOST: "0.0.0.0",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
        HOST: "0.0.0.0",
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
  ],
};
