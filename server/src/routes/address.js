import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read JSON files
const readJSONFile = async (filename) => {
  try {
    const filePath = path.join(__dirname, '../../migrations', filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
};

// Get all cities/provinces
router.get('/cities', async (req, res) => {
  try {
    const cities = await readJSONFile('city.json');
    res.json(cities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load cities', message: error.message });
  }
});

// Get districts by city_id
router.get('/districts/:city_id', async (req, res) => {
  try {
    const { city_id } = req.params;
    const allDistricts = await readJSONFile('district.json');
    
    // Filter districts by city_id (convert to string for comparison)
    const districts = allDistricts.filter(d => String(d.city_id) === String(city_id));
    
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load districts', message: error.message });
  }
});

// Get wards by district_id
router.get('/wards/:district_id', async (req, res) => {
  try {
    const { district_id } = req.params;
    const allWards = await readJSONFile('wards.json');
    
    // Filter wards by district_id (convert to string for comparison)
    const wards = allWards.filter(w => String(w.district_id) === String(district_id));
    
    // Add sequential ward_id for each ward if not present
    const wardsWithIds = wards.map((ward, index) => ({
      ward_id: ward.ward_id || `${district_id}_${index}`,
      ward_name: ward.ward_name,
      district_id: ward.district_id
    }));
    
    res.json(wardsWithIds);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load wards', message: error.message });
  }
});

// Get full address details (city, district, ward names) - useful for display
router.get('/full/:city_id/:district_id/:ward_identifier', async (req, res) => {
  try {
    const { city_id, district_id, ward_identifier } = req.params;
    
    const cities = await readJSONFile('city.json');
    const districts = await readJSONFile('district.json');
    const wards = await readJSONFile('wards.json');
    
    // Convert to string for comparison
    const city = cities.find(c => String(c.city_id) === String(city_id));
    const district = districts.find(d => String(d.district_id) === String(district_id));
    
    // Try to find ward by ward_name or generated ward_id
    let ward = null;
    
    // First, filter wards by district_id
    const districtWards = wards.filter(w => String(w.district_id) === String(district_id));
    
    // Try to find by ward_name (case-insensitive)
    ward = districtWards.find(w => String(w.ward_name).toLowerCase() === String(ward_identifier).toLowerCase());
    
    // If not found by name, try by generated ID format (district_id_index)
    if (!ward && ward_identifier.includes('_')) {
      const parts = ward_identifier.split('_');
      const index = parseInt(parts[parts.length - 1]);
      if (!isNaN(index) && districtWards[index]) {
        ward = districtWards[index];
      }
    }
    
    // If still not found, try numeric index
    if (!ward && /^\d+$/.test(ward_identifier)) {
      const index = parseInt(ward_identifier);
      if (!isNaN(index) && districtWards[index]) {
        ward = districtWards[index];
      }
    }
    
    if (!city || !district || !ward) {
      console.log('Address not found:', { 
        city_id, 
        district_id, 
        ward_identifier,
        found: { city: !!city, district: !!district, ward: !!ward },
        availableWards: districtWards.length
      });
      
      // If we have city and district but no ward, return partial result
      if (city && district && districtWards.length > 0) {
        return res.json({
          city: city.city_name,
          district: district.district_name,
          ward: ward_identifier // Return the identifier as-is if ward not found
        });
      }
      
      return res.status(404).json({ 
        error: 'Address not found', 
        details: { city_id, district_id, ward_identifier } 
      });
    }
    
    res.json({
      city: city.city_name,
      district: district.district_name,
      ward: ward.ward_name
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get address details', message: error.message });
  }
});

export default router;
