const axios = require('axios');
const yts = require('yt-search');

module.exports.name = "play";
module.exports.execute = async (sock, msg, args) => {
  const chatId = msg.key.remoteJid;
  const query = args.join(' ').trim();
  if (!query) {
    return sock.sendMessage(chatId, { text: '❌ Usage: .play <song name>' }, { quoted: msg });
  }
  try {
    await sock.sendMessage(chatId, { text: `🔎 _Searching: ${query}_` }, { quoted: msg });
    
    let video;
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      video = { url: query, title: 'YouTube Audio', author: { name: 'Unknown' }, timestamp: 'Unknown', ago: '2024', views: 0, thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' };
    } else {
      const search = await yts(query);
      if (!search.videos.length) return sock.sendMessage(chatId, { text: '❌ No results found.' }, { quoted: msg });
      video = search.videos[0];
    }

    const caption =
`┏━━━━━━━━━━━━━━━━━┓
┃ 🤖 *ETIAS-AI* ┃
┗━━━━━━━━━━━━━━━━━┛

*🎵 Title:* ${video.title}
*👤 Artist:* ${video.author.name}
*⏱️ Duration:* ${video.timestamp}
*👁️ Views:* ${video.views.toLocaleString()}

> *POWERED BY ETIAS-TECH*`;

    await sock.sendMessage(chatId, { image: { url: video.thumbnail }, caption }, { quoted: msg });

    const apiUrl = `https://api.princetechn.com/api/download/mp3?apikey=prince&url=${encodeURIComponent(video.url)}`;
    const res = await axios.get(apiUrl, { timeout: 30000 });
    const audioUrl = res.data?.result?.download || res.data?.download || res.data?.url || res.data?.result?.url;

    if (!audioUrl) throw new Error('No download link from API');

    const audio = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 90000 });
    
    await sock.sendMessage(chatId, {
      audio: Buffer.from(audio.data),
      mimetype: 'audio/mpeg',
      fileName: `${video.title}.mp3`
    }, { quoted: msg });

  } catch (e) {
    console.log('[PLAY]', e.message);
    await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: msg });
  }
};
