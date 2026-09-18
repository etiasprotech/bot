const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const P = require('pino');

require('./server.js');

const BOT_NAME = "ETIAS-AI";
const PREFIX = ".";
const OWNER_NUMBER = "263778810589"; // CHANGE YOUR NUMBER
const OWNER = `${OWNER_NUMBER}@s.whatsapp.net`;

const commands = new Map();
const cmdPath = path.join(__dirname, 'commands');

if (fs.existsSync(cmdPath)) {
  fs.readdirSync(cmdPath).forEach(file => {
    if (file.endsWith('.js')) {
      try {
        const cmd = require(path.join(cmdPath, file));
        // supports both export styles
        const name = cmd.name || file.replace('.js','').toLowerCase();
        commands.set(name, cmd);
      } catch(e){
        console.log(`[CMD LOAD ERROR] ${file}: ${e.message}`);
      }
    }
  });
  console.log(`[COMMANDS] Loaded: ${[...commands.keys()].join(', ')}`);
} else {
  console.log(`[COMMANDS] No commands folder found!`);
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0"]
  });

  if (!sock.authState.creds.registered) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const code = await sock.requestPairingCode(OWNER_NUMBER);
      console.log(`\n==========================`);
      console.log(`[PAIR CODE] ${code}`);
      console.log(`==========================\n`);
    } catch (e) {
      console.log("[PAIR ERROR]", e.message);
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('[CONNECTION] Closed, reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`[BOT] ${BOT_NAME} Connected!`);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const jid = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;

    // ====== AUTO VV ======
    const viewOnce = msg.message.viewOnceMessageV2?.message || msg.message.viewOnceMessage?.message || msg.message.viewOnceMessageV2Extension?.message;
    if (viewOnce) {
      try {
        const content = viewOnce;
        const type = Object.keys(content)[0];
        const buffer = await sock.downloadMediaMessage({ message: content });
        const caption = `👁️ *VIEW ONCE REVEALED*\nFrom: @${jid.split('@')[0]}`;
        if (type === 'imageMessage') await sock.sendMessage(jid, { image: buffer, caption, mentions: [jid] });
        if (type === 'videoMessage') await sock.sendMessage(jid, { video: buffer, caption, mentions: [jid] });
      } catch (e) {
        console.log('[VV ERROR]', e.message);
      }
      return;
    }

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";

    console.log(`[MSG] ${jid} | ${isFromMe? 'ME' : 'OTHER'} | ${text}`);

    if (!text.startsWith(PREFIX)) return;

    // Allow owner to use bot from same number
    if (isFromMe &&!jid.includes(OWNER_NUMBER)) {
       // optional: ignore own messages in other chats
    }

    const args = text.slice(PREFIX.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    // SIMPLE PING FOR TEST
    if (cmdName === 'ping') {
      await sock.sendMessage(jid, { text: `*Pong!* 🏓\n${BOT_NAME} is online\n${new Date().toLocaleString()}` }, { quoted: msg });
      return;
    }

    const command = commands.get(cmdName);
    if (!command) {
      console.log(`[CMD] Command not found: ${cmdName}`);
      return;
    }

    try {
      console.log(`[CMD] Executing: ${cmdName}`);
      await command.execute(sock, msg, args);
    } catch (e) {
      console.log('[CMD ERROR]', e);
      await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: msg });
    }
  });
}

startBot();
