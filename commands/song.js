const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports.name = "song";
module.exports.execute = async (sock, msg, args) => {
  const chatId = msg.key.remoteJid;
  const query = args.join(' ').trim();
  if (!query) return sock.sendMessage(chatId, { text: '❌ Usage: .song <song name>' }, { quoted: msg });

  let tempFile = null;
  try {
    await sock.sendMessage(chatId, { text: `🔎 _Searching: ${query}_` }, { quoted: msg });

    let videoUrl = query;
    let videoInfo;

    if (!ytdl.validateURL(query)) {
      const search = await yts(query);
      if (!search.videos.length) return sock.sendMessage(chatId, { text: '❌ Not found' }, { quoted: msg });
      videoInfo = search.videos[0];
      videoUrl = videoInfo.url;
    }

    if (!videoInfo) {
      const search = await yts(videoUrl);
      videoInfo = search.videos[0] || { title: 'YouTube Audio', author: { name: 'Unknown' }, timestamp: 'Unknown', views: 0, thumbnail: '' };
    }

    const caption = `🎵 *${videoInfo.title}*\n👤 ${videoInfo.author.name}\n⏱️ ${videoInfo.timestamp}\n\n_Downloading directly from YouTube..._`;

    if (videoInfo.thumbnail) {
      await sock.sendMessage(chatId, { image: { url: videoInfo.thumbnail }, caption }, { quoted: msg });
    }

    // Direct ytdl download
    tempFile = path.join(os.tmpdir(), `${Date.now()}.mp3`);
    
    await new Promise((resolve, reject) => {
      const stream = ytdl(videoUrl, { 
        filter: 'audioonly', 
        quality: 'highestaudio',
        highWaterMark: 1 << 25
      });
      const write = fs.createWriteStream(tempFile);
      stream.pipe(write);
      write.on('finish', resolve);
      write.on('error', reject);
      stream.on('error', reject);
      setTimeout(() => reject(new Error('Download timeout 60s')), 60000);
    });

    const stats = fs.statSync(tempFile);
    if (stats.size < 10000) throw new Error('Downloaded file too small, failed');

    // Send as document
    await sock.sendMessage(chatId, {
      document: fs.readFileSync(tempFile),
      mimetype: 'audio/mpeg',
      fileName: `${videoInfo.title}.mp3`.replace(/[^\w\s.-]/gi, ''),
      caption: `✅ *${videoInfo.title}*\n> *POWERED BY ETIAS-TECH*`
    }, { quoted: msg });

    // Send as playable audio
    await sock.sendMessage(chatId, {
      audio: fs.readFileSync(tempFile),
      mimetype: 'audio/mpeg'
    }, { quoted: msg });

    fs.unlinkSync(tempFile);

  } catch (e) {
    console.log('[SONG NO-API]', e.message);
    if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}\n\nFailed to fetch. Try again or use .play` }, { quoted: msg });
  }
};
