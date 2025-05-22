const { ActivityType } = require('discord.js');
const moment = require('moment');
require('moment-timezone');
moment.locale('tr');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);
    
    client.user.setPresence({
      activities: [{ 
        name: 'kullanıcı aktivitelerini', 
        type: ActivityType.Watching 
      }],
      status: 'dnd',
    });
    
    console.log(`📊 Bot ${client.guilds.cache.size} sunucuda aktif!`);
    console.log(` Başlangıç zamanı: ${moment().format('LLLL')}`);
  },
};