const { Events, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { ownerId } = require('../config.json');
const croxydb = require('croxydb');
const moment = require('moment');
require('moment-timezone');
moment.locale('tr');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      
      if (!command) {
        console.error(`<a:zypcarp:1373337642548072458> ${interaction.commandName} komutu bulunamadı.`);
        return;
      }
      
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        const yanit = {
          content: '<a:zypcarp:1373337642548072458> Komut çalıştırılırken bir hata oluştu!',
          ephemeral: true
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(yanit);
        } else {
          await interaction.reply(yanit);
        }
      }
    }
    
    else if (interaction.isButton()) {
      if (interaction.user.id !== ownerId) {
        return interaction.reply({ 
          content: '<a:zypcarp:1373337642548072458> Bu butonu kullanma yetkiniz yok!', 
          ephemeral: true 
        });
      }
      
      if (interaction.customId === 'takip_kaldir') {
        const takipListesi = croxydb.get('takipListesi') || {};
        
        if (Object.keys(takipListesi).length === 0) {
          return interaction.reply({
            content: '📝 Takip listesi zaten boş!',
            ephemeral: true
          });
        }
        
        const secenekler = [];
        
        for (const [kullaniciId, veri] of Object.entries(takipListesi)) {
          try {
            const kullanici = await interaction.client.users.fetch(kullaniciId);
            secenekler.push({
              label: kullanici.tag,
              description: `ID: ${kullaniciId} | Eklenme: ${moment(veri.eklemeTarihi).fromNow()}`,
              value: kullaniciId
            });
          } catch (error) {
            secenekler.push({
              label: `Bilinmeyen Kullanıcı (${kullaniciId})`,
              description: `ID: ${kullaniciId}`,
              value: kullaniciId
            });
          }
        }
        
        const row = new ActionRowBuilder()
          .addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('kullanici_sec')
              .setPlaceholder('🗑️ Takipten çıkarılacak kullanıcıyı seçin')
              .addOptions(secenekler)
          );
        
        await interaction.reply({
          content: '<:secret5:1373341177591631974> Takipten çıkarmak istediğiniz kullanıcıyı seçin:',
          components: [row],
          ephemeral: true
        });
      }
    }
    
    else if (interaction.isStringSelectMenu()) {
      if (interaction.user.id !== ownerId) {
        return interaction.reply({ 
          content: '<a:zypcarp:1373337642548072458> Bu menüyü kullanma yetkiniz yok!', 
          ephemeral: true 
        });
      }
      
      if (interaction.customId === 'kullanici_sec') {
        const secilenId = interaction.values[0];
        const takipListesi = croxydb.get('takipListesi') || {};
        
        if (!takipListesi[secilenId]) {
          return interaction.reply({
            content: '<a:zypcarp:1373337642548072458> Bu kullanıcı zaten takip listesinde değil!',
            ephemeral: true
          });
        }
        
        delete takipListesi[secilenId];
        croxydb.set('takipListesi', takipListesi);
        
        try {
          const kullanici = await interaction.client.users.fetch(secilenId);
          return interaction.reply({
            content: `<:tikicon:1373337779248955563> ${kullanici.tag} takip listesinden çıkarıldı!`,
            ephemeral: true
          });
        } catch (error) {
          return interaction.reply({
            content: `<:tikicon:1373337779248955563> ${secilenId} ID'li kullanıcı takip listesinden çıkarıldı!`,
            ephemeral: true
          });
        }
      }
    }
  },
};