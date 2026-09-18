module.exports = {
  name: "vv",
  async execute(sock, msg) {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Reply to a *View Once* image / video with.vv"
      }, { quoted: msg });
    }

    // Check viewOnce
    const viewOnce = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessage?.message || quoted.viewOnceMessageV2Extension?.message;
    const content = viewOnce || quoted;

    const type = Object.keys(content)[0]; // imageMessage, videoMessage, audioMessage

    if (!content[type]) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: "❌ That is not a view once message"
      }, { quoted: msg });
    }

    const buffer = await sock.downloadMediaMessage({ message: content });

    if (type === 'imageMessage') {
      await sock.sendMessage(msg.key.remoteJid, {
        image: buffer,
        caption: content[type].caption || ""
      }, { quoted: msg });
    } else if (type === 'videoMessage') {
      await sock.sendMessage(msg.key.remoteJid, {
        video: buffer,
        caption: content[type].caption || ""
      }, { quoted: msg });
    } else if (type === 'audioMessage') {
      await sock.sendMessage(msg.key.remoteJid, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        ptt: content[type].ptt || false
      }, { quoted: msg });
    }
  }
}
