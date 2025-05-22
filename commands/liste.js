const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle
} = require('discord.js');
const { ownerId } = require('../config.json');
const croxydb = require('croxydb');
const moment = require('moment');
require('moment-timezone');
moment.locale('tr');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('liste')
    .setDescription('Takip edilen kullanıcıların listesini gösterir'),
    
  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ 
        content: '<a:zypcarp:1373337642548072458> Bu komutu kullanma yetkiniz yok!', 
        ephemeral: false
      });
    }
    
    const takipListesi = croxydb.get('takipListesi') || {};
    const kullaniciSayisi = Object.keys(takipListesi).length;
    
    if (kullaniciSayisi === 0) {
      return interaction.reply({
        content: '<:liste:1373688657008918649> Takip listesi boş!',
        ephemeral: false
      });
    }
    
    try {
      const kullaniciVaatleri = Object.keys(takipListesi).map(id => 
        interaction.client.users.fetch(id)
      );
      
      const kullanicilar = await Promise.all(kullaniciVaatleri);
      
      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('<:secret5:1373341177591631974> Takip Edilen Kullanıcılar')
        .setDescription(`Toplam ${kullaniciSayisi} kullanıcı takip ediliyor.`)
        .setFooter({ text: '🔍 Takip Sistemi' })
        .setTimestamp();
      
      kullanicilar.forEach((kullanici, index) => {
        const veri = takipListesi[kullanici.id];
        embed.addFields({
          name: `${index + 1}. ${kullanici.tag}`,
          value: `<:liste:1373688657008918649> ID: ${kullanici.id}\n<a:duyuru:1373689354500702239> Log Kanalı: <#${veri.logKanalId}>\n<:tarih:1373689438655217759> Eklenme: ${moment(veri.eklemeTarihi).fromNow()}`,
          inline: false
        });
      });
      
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('takip_kaldir')
            .setLabel(' Takipten Çıkar')
            .setStyle(ButtonStyle.Danger)
        );
      
      await interaction.reply({
        embeds: [embed],
        components: [row],
        ephemeral: false
      });
    } catch (error) {
      console.error('Liste komutunda hata:', error);
      return interaction.reply({
        content: '<a:zypcarp:1373337642548072458> Komut çalıştırılırken bir hata oluştu!',
        ephemeral: false
      });
    }
  }
};