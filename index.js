const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientId } = require('./config.json');
const croxydb = require('croxydb');
const moment = require('moment');
require('moment-timezone');
moment.locale('tr');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(` Komut yüklendi: ${command.data.name}`);
  } else {
    console.log(`⚠️ ${filePath} dosyasında gerekli "data" veya "execute" özellikleri eksik!`);
  }
}

const deployCommands = async () => {
  const commands = [];
  
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }
  
  const rest = new REST({ version: '10' }).setToken(token);
  
  try {
    console.log(' Slash komutları yükleniyor...');
    
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    
    console.log(' Slash komutları başarıyla yüklendi!');
  } catch (error) {
    console.error(' Slash komutları yüklenirken hata:', error);
  }
};

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
  const kullaniciId = newPresence.userId;
  const takipListesi = croxydb.get('takipListesi') || {};
  
  if (takipListesi[kullaniciId]) {
    const logKanalId = takipListesi[kullaniciId].logKanalId;
    const logKanal = client.channels.cache.get(logKanalId);
    
    if (!logKanal) return;
    
    const kullanici = await client.users.fetch(kullaniciId);
    if (oldPresence?.status !== newPresence.status) {
      const durumRenkleri = {
        'online': 0x43B581,
        'idle': 0xFAA61A,
        'dnd': 0xF04747,
        'offline': 0x747F8D
      };
      
      const durumEmbed = new EmbedBuilder()
        .setColor(durumRenkleri[newPresence.status])
        .setAuthor({
          name: kullanici.tag,
          iconURL: kullanici.displayAvatarURL({ dynamic: true })
        })
        .setDescription(`<:zyp:1373697469204005016> Durum değişikliği: **${oldPresence?.status || 'bilinmiyor'}** ➜ **${newPresence.status}**`)
        .setFooter({ text: '🔍 Takip Sistemi' })
        .setTimestamp();
      
      logKanal.send({ embeds: [durumEmbed] });
    }
    const eskiAktiviteler = oldPresence?.activities || [];
    const yeniAktiviteler = newPresence.activities || [];
    
    const aktiviteTipleri = {
    0: '<:valorant:1373695919761133589> Oynuyor',
    1: '<a:twitch_gif:1373695481695174839> Yayında',
    2: '<a:zypheriss:1373695240614973531> Dinliyor',
    3: '<:pc:1373695043428421702> İzliyor',
    4: '<:liste:1373688657008918649> Özel Durum',
    5: '<a:kupa1:1373694900943716352> Yarışıyor'
    };
    for (const yeniAktivite of yeniAktiviteler) {
      const eskiAktivite = eskiAktiviteler.find(a => a.type === yeniAktivite.type);
      
      if (!eskiAktivite || 
          eskiAktivite.name !== yeniAktivite.name || 
          eskiAktivite.state !== yeniAktivite.state) {
        
        const aktiviteEmbed = new EmbedBuilder()
          .setColor(0x3498DB)
          .setAuthor({
            name: kullanici.tag,
            iconURL: kullanici.displayAvatarURL({ dynamic: true })
          })
          .setDescription('<:zyp:1373697469204005016> Aktivite güncellendi:')
          .addFields(
            { name: '<:__:1373698038853275709> Tür', value: aktiviteTipleri[yeniAktivite.type], inline: true },
            { name: '<:liste:1373688657008918649> İsim', value: yeniAktivite.name || 'Belirtilmemiş', inline: true }
          )
          .setFooter({ text: '🔍 Takip Sistemi' })
          .setTimestamp();
        
        if (yeniAktivite.state) {
          aktiviteEmbed.addFields({
            name: '<:liste:1373688657008918649> Detay',
            value: yeniAktivite.state,
            inline: false
          });
        }
        
        if (yeniAktivite.details) {
          aktiviteEmbed.addFields({
            name: '<:liste:1373688657008918649> Ek Bilgi',
            value: yeniAktivite.details,
            inline: false
          });
        }
        
        logKanal.send({ embeds: [aktiviteEmbed] });
      }
    }
    for (const eskiAktivite of eskiAktiviteler) {
      if (!yeniAktiviteler.some(a => a.type === eskiAktivite.type)) {
        const aktiviteEmbed = new EmbedBuilder()
          .setColor(0xE74C3C)
          .setAuthor({
            name: kullanici.tag,
            iconURL: kullanici.displayAvatarURL({ dynamic: true })
          })
          .setDescription('🗑️ Aktivite silindi:')
          .addFields(
            { name: '<a:kedi:1373697697583857834> Tür', value: aktiviteTipleri[eskiAktivite.type], inline: true },
            { name: '<:secret5:1373341177591631974> İsim', value: eskiAktivite.name || 'Belirtilmemiş', inline: true }
          )
          .setFooter({ text: '🔍 Takip Sistemi' })
          .setTimestamp();
        
        logKanal.send({ embeds: [aktiviteEmbed] });
      }
    }
  }
});

process.on('unhandledRejection', error => {
  console.error('<a:zypcarp:1373337642548072458> İşlenmeyen hata:', error);
});

if (!croxydb.has('takipListesi')) {
  croxydb.set('takipListesi', {});
}

(async () => {
  await deployCommands();
  client.login(token);
})();