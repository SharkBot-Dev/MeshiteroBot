module.exports = {
  apps : [{
    name: "misskey-food",
    script: "misskey.js",
    env: {
      NODE_ENV: "production"
    },
    exec_mode: "fork", 
    watch: false
  }]
}