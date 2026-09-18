const axios = require('axios');
async function test() {
  let url = "https://www.youtube.com/watch?v=kJQP7kiw5Fk";
  let apis = [
    `https://api.princetechn.com/api/download/mp3?apikey=prince&url=${url}`,
    `https://api.davidcyriltech.my.id/download/ytmp3?url=${url}`,
    `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${url}`
  ];
  for (let api of apis) {
    try {
      let res = await axios.get(api, {timeout:10000});
      console.log(`✅ ${api.split('/')[2]} WORKS ->`, JSON.stringify(res.data).slice(0,100));
    } catch(e) {
      console.log(`❌ ${api.split('/')[2]} FAILED ->`, e.message);
    }
  }
}
test();
