import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const ZALO_OA_SEND_URL = 'https://openapi.zalo.me/v2.0/oa/message';

function formatPhone(phone) {
  if (!phone) return null;
  const p = phone.trim();
  if (p.startsWith('+')) return p;
  if (p.startsWith('0')) return '+84' + p.slice(1);
  return '+' + p;
}

async function sendZalo(phone, text) {
  const token = process.env.ZALO_OA_ACCESS_TOKEN;
  if (!token) throw new Error('ZALO_OA_ACCESS_TOKEN not found in env');
  const url = `${ZALO_OA_SEND_URL}?access_token=${encodeURIComponent(token)}`;
  const payload = {
    recipient: { phone },
    message: { text }
  };
  const res = await axios.post(url, payload, { timeout: 10000 });
  return res.data;
}

// Usage: node ./server/src/utils/zalo_test.js <phone> "Message here"
(async () => {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2) {
      console.log('Usage: node ./server/src/utils/zalo_test.js <phone> "Message text"');
      process.exit(1);
    }
    const phone = formatPhone(args[0]);
    const text = args[1];
    console.log('Sending to', phone);
    const result = await sendZalo(phone, text);
    console.log('Result:', result);
  } catch (err) {
    console.error('Error sending Zalo message:', err.message || err);
    process.exit(1);
  }
})();
