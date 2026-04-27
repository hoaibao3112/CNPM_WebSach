import fs from 'fs/promises';
import path from 'path';

async function test() {
  const data = await fs.readFile('migrations/district.json', 'utf-8');
  const allDistricts = JSON.parse(data);
  const city_id = '9';
  const districts = allDistricts.filter(d => String(d.city_id) === String(city_id));
  console.log(`Found ${districts.length} districts for city ${city_id}`);
  if (districts.length > 0) {
    console.log('Sample:', districts[0]);
  }
}

test();
