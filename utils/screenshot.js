const { EmbedBuilder } = require('discord.js');
const croxydb = require('croxydb');
const { profilResmiCek } = require('./screenshot');
const moment = require('moment');
require('moment-timezone');
moment.locale('tr');

/**
 * 
 * @param {Object} client 
 * @param {Object} eskiDurum 
 * @param {Object} yeniDurum 
 */
async function aktiviteTakip(client, eskiDurum, yeniDurum) {
  const kullaniciId = yeniDurum.userId;
  const takipListesi = croxydb.get('takipListesi') || {};
  
  if (!takipListesi[kullaniciId]) return;
  
  const logKanalId = takipListesi[kullaniciId].logKanalId;
  const logKanal = client.channels.cache.get(logKanalId);
  
  if (!logKanal) return;
  
  const kullanici = await client.users.fetch(kullaniciId);
  await durumDegisikligiKontrol(kullanici, eskiDurum, yeniDurum, logKanal);
  await aktiviteDegisikligiKontrol(kullanici, eskiDurum, yeniDurum, logKanal);
}
async function durumDegisikligiKontrol(kullanici, eskiDurum, yeniDurum, logKanal) {
  if (eskiDurum?.status !== yeniDurum.status) {
    const durumRenkleri = {
      'online': 0x43B581,
      'idle': 0xFAA61A,
      'dnd': 0xF04747,
      'offline': 0x747F8D
    };
    
    const durumEmbed = new EmbedBuilder()
      .setColor(durumRenkleri[yeniDurum.status])
      .setAuthor({
        name: kullanici.tag,
        iconURL: kullanici.displayAvatarURL({ dynamic: true })
      })
      .setDescription(` Durum değişikliği: **${eskiDurum?.status || 'bilinmiyor'}** ➜ **${yeniDurum.status}**`)
      .setFooter({ text: '<:secret4:1372505933795688479> Takip Sistemi' })
      .setTimestamp();
    
    await logKanal.send({ embeds: [durumEmbed] });
  }
}
async function aktiviteDegisikligiKontrol(kullanici, eskiDurum, yeniDurum, logKanal) {
  const eskiAktiviteler = eskiDurum?.activities || [];
  const yeniAktiviteler = yeniDurum.activities || [];
  
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
        .setDescription(' Aktivite güncellendi:')
        .addFields(
          { name: '<a:uyari:1373688536363958415> Tür', value: aktiviteTipleri[yeniAktivite.type], inline: true },
          { name: '<:secret5:1373341177591631974> İsim', value: yeniAktivite.name || 'Belirtilmemiş', inline: true }
        )
        .setFooter({ text: '🔍 Takip Sistemi' })
        .setTimestamp();
      
      if (yeniAktivite.state) {
        aktiviteEmbed.addFields({
          name: '<:tarih:1373689438655217759> Detay',
          value: yeniAktivite.state,
          inline: false
        });
      }
      
      if (yeniAktivite.details) {
        aktiviteEmbed.addFields({
          name: '<:tarih:1373689438655217759> Ek Bilgi',
          value: yeniAktivite.details,
          inline: false
        });
      }
      if (yeniAktivite.type === 0 || yeniAktivite.type === 4) {
        const screenshotPath = await profilResmiCek(kullanici.id);
        if (screenshotPath) {
          await logKanal.send({ 
            embeds: [aktiviteEmbed],
            files: [screenshotPath]
          });
          fs.unlinkSync(screenshotPath);
        } else {
          await logKanal.send({ embeds: [aktiviteEmbed] });
        }
      } else {
        await logKanal.send({ embeds: [aktiviteEmbed] });
      }
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
        .setDescription('<:uzgun_cop:1373689541730238627> Aktivite silindi:')
        .addFields(
          { name: '<:liste:1373688657008918649> Tür', value: aktiviteTipleri[eskiAktivite.type], inline: true },
          { name: '<:secret5:1373341177591631974> İsim', value: eskiAktivite.name || 'Belirtilmemiş', inline: true }
        )
        .setFooter({ text: '<:secret4:1372505933795688479> Takip Sistemi' })
        .setTimestamp();
      
      await logKanal.send({ embeds: [aktiviteEmbed] });
    }
  }
}

module.exports = { aktiviteTakip };