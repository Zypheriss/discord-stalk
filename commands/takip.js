const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { ownerId } = require('../config.json');
const croxydb = require('croxydb');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('moment-timezone');
moment.locale('tr');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('takip')
    .setDescription('Bir kullanıcıyı takibe al')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Takip edilecek kullanıcı').setRequired(true))
    .addChannelOption(option =>
      option.setName('logkanal').setDescription('Aktivitelerin gönderileceği kanal').setRequired(true)),

  async execute(interaction) {
    if (interaction.user.id !== ownerId) {
      return interaction.reply({ 
        content: '<a:zypcarp:1373337642548072458> Bu komutu kullanma yetkiniz yok!', 
        flags: 64 
      });
    }

    const hedefKullanici = interaction.options.getUser('kullanıcı');
    const logKanal = interaction.options.getChannel('logkanal');

    if (logKanal.type !== ChannelType.GuildText) {
      return interaction.reply({
        content: '<a:zypcarp:1373337642548072458> Log kanalı bir metin kanalı olmalıdır!',
        flags: 64
      });
    }

    await interaction.deferReply({ flags: 64 });

    try {
      const takipListesi = croxydb.get('takipListesi') || {};

      if (takipListesi[hedefKullanici.id]) {
        return interaction.editReply({
          content: `<a:uyari:1373688536363958415> ${hedefKullanici.tag} zaten takip ediliyor!\nLog Kanalı: <#${takipListesi[hedefKullanici.id].logKanalId}>`,
          flags: 64
        });
      }
      const eklemeTarihiISO = new Date().toISOString();
      const eklemeTarihiGosterim = moment().format('dddd, D MMMM YYYY HH:mm');

      takipListesi[hedefKullanici.id] = {
        kullaniciId: hedefKullanici.id,
        logKanalId: logKanal.id,
        eklemeTarihi: eklemeTarihiISO,
        ekleyenId: interaction.user.id
      };

      croxydb.set('takipListesi', takipListesi);

      const embed = new EmbedBuilder()
        .setColor(0x2ECC71)
        .setAuthor({ 
          name: hedefKullanici.tag, 
          iconURL: hedefKullanici.displayAvatarURL({ dynamic: true }) 
        })
        .setDescription(`👀 ${hedefKullanici.tag} takibe alındı!`)
        .addFields(
          { name: '<:liste:1373688657008918649> Eklenme Tarihi', value: eklemeTarihiGosterim, inline: true },
          { name: '<:secret5:1373341177591631974> Ekleyen', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ text: '🔍 Takip Sistemi' })
        .setTimestamp();

      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(`https://discord.com/users/${hedefKullanici.id}`, { 
        waitUntil: 'networkidle2' 
      });
      await new Promise(resolve => setTimeout(resolve, 2000));

      const screenshotPath = path.join(tempDir, `${hedefKullanici.id}.png`);
      await page.screenshot({ path: screenshotPath });
      await browser.close();

      await logKanal.send({ 
        embeds: [embed],
        files: [screenshotPath]
      });

      fs.unlinkSync(screenshotPath);

      return interaction.editReply({
        content: `<:tikicon:1373337779248955563> ${hedefKullanici.tag} başarıyla takibe alındı!\nAktiviteleri ${logKanal} kanalında görüntülenecek.`,
        flags: 64
      });
    } catch (error) {
      console.error('Takip komutunda hata:', error);
      return interaction.editReply({
        content: `<a:zypcarp:1373337642548072458> Hata oluştu: ${error.message}`,
        flags: 64
      });
    }
  }
};
