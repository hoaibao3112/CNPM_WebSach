// Helper script to convert CA certificate to Base64
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Place your downloaded isrgrootx1.pem file in the same directory
const certPath = path.join(__dirname, 'isrgrootx1.pem');

if (!fs.existsSync(certPath)) {
    console.error('❌ Certificate file not found:', certPath);
    console.log('📥 Download it from: https://letsencrypt.org/certs/isrgrootx1.pem');
    process.exit(1);
}

const certContent = fs.readFileSync(certPath, 'utf8');
const base64Cert = Buffer.from(certContent).toString('base64');

console.log('✅ Base64-encoded certificate:');
console.log('');
console.log(base64Cert);
console.log('');
console.log('📋 Copy the above value and set it as DB_SSL_CA_BASE64 on Render');
