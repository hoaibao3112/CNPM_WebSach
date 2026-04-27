import fetch from 'node-fetch';

async function test() {
  const original_id = '14';
  const url = `http://localhost:5000/api/address/districts/${original_id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Error: ${response.status} ${response.statusText}`);
      return;
    }
    const districts = await response.json();
    console.log(`Found ${districts.length} districts for original_id ${original_id}`);
    if (districts.length > 0) {
      console.log('Sample:', districts[0]);
    }
  } catch (error) {
    console.error('Fetch failed:', error.message);
  }
}

test();
