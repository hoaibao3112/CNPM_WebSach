/**
 * Script để tải và chuyển đổi dữ liệu địa chỉ Việt Nam
 * thành format city.json, district.json, wards.json
 * 
 * Chạy: node generate_address_data.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '../../migrations');

// Tải dữ liệu từ GitHub
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse JSON: ' + e.message));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Vietnam address data...');
  
  const rawData = await fetchData('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
  
  console.log(`Loaded ${rawData.length} provinces`);
  
  const cities = [];
  const districts = [];
  const wards = [];
  
  let cityIdCounter = 1;
  let districtIdCounter = 1;
  
  for (const province of rawData) {
    const cityId = cityIdCounter++;
    cities.push({
      city_id: cityId,
      city_name: province.Name,
      original_id: province.Id
    });
    
    for (const district of province.Districts) {
      const districtId = districtIdCounter++;
      districts.push({
        district_id: districtId,
        district_name: district.Name,
        city_id: cityId,
        original_id: district.Id
      });
      
      for (const ward of district.Wards) {
        wards.push({
          ward_name: ward.Name,
          district_id: districtId,
          original_id: ward.Id
        });
      }
    }
  }
  
  // Đảm bảo thư mục tồn tại
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  // Ghi files
  fs.writeFileSync(path.join(OUTPUT_DIR, 'city.json'), JSON.stringify(cities, null, 2), 'utf-8');
  console.log(`city.json: ${cities.length} cities`);
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'district.json'), JSON.stringify(districts, null, 2), 'utf-8');
  console.log(`district.json: ${districts.length} districts`);
  
  fs.writeFileSync(path.join(OUTPUT_DIR, 'wards.json'), JSON.stringify(wards, null, 2), 'utf-8');
  console.log(`wards.json: ${wards.length} wards`);
  
  console.log('Done! Address data files generated successfully.');
}

main().catch(console.error);
