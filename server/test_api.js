import fetch from 'node-fetch';

async function test() {
  const city_id = '9';
  const url = `http://localhost:5000/api/address/districts/${city_id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Error: ${response.status} ${response.statusText}`);
      return;
    }
    const districts = await response.json();
    console.log(`Found ${districts.length} districts for city ${city_id}`);
    if (districts.length > 0) {
      console.log('Sample:', districts[0]);
    }
  } catch (error) {
    console.error('Fetch failed:', error.message);
  }
}

test();
