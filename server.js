const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Path to your local bot image
const BOT_IMAGE_PATH = path.join(__dirname, 'media/bot.jpg');
const BOT_NAME = "ETIAS-AI";

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${BOT_NAME} - Online</title>
      <style>
        body {
          background: #111;
          color: #fff;
          font-family: sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          flex-direction: column;
          margin: 0;
        }
        img {
          width: 150px;
          height: 150px;
          border-radius: 50%;
          border: 4px solid #25D366;
          margin-bottom: 20px;
        }
        h1 { margin: 10px 0 5px 0; }
        p { color: #aaa; }
        .dot {
          width: 10px;
          height: 10px;
          background: #25D366;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          box-shadow: 0 0 10px #25D366;
          animation: blink 1.5s infinite;
        }
        @keyframes blink { 0% {opacity:1} 50% {opacity:0.3} 100% {opacity:1} }
      </style>
    </head>
    <body>
      <img src="/bot-image" />
      <h1><span class="dot"></span>${BOT_NAME}</h1>
      <p>Bot is running successfully!</p>
      <p style="font-size:12px;">${new Date().toLocaleString()}</p>
    </body>
    </html>
  `);
});

// Serve local bot image
app.get('/bot-image', (req, res) => {
  if (fs.existsSync(BOT_IMAGE_PATH)) {
    res.sendFile(BOT_IMAGE_PATH);
  } else {
    res.status(404).send('Bot image not found in /media/bot.jpg');
  }
});

app.get('/ping', (req, res) => {
  res.json({ status: 'online', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});
