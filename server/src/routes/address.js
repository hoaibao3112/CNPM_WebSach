import express from 'express';
import logger from '../utils/logger.js';
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
    logger.error(`Error reading ${filename}:`, error);
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
    const cities = await readJSONFile('city.json');
    const allDistricts = await readJSONFile('district.json');

    // Find the city first (robust lookup)
    const city = cities.find(c => 
      String(c.city_id).trim() === String(city_id).trim() || 
      String(c.original_id).trim() === String(city_id).trim() ||
      String(c.city_name).trim().toLowerCase() === String(city_id).trim().toLowerCase()
    );

    if (!city) {
      logger.warn(`⚠️ City not found for ID: ${city_id}`);
      return res.json([]);
    }

    // Filter districts by the resolved city_id
    const districts = allDistricts.filter(d => String(d.city_id) === String(city.city_id));

    res.json(districts);
  } catch (error) {
    logger.error('Error loading districts:', error);
    res.status(500).json({ error: 'Failed to load districts', message: error.message });
  }
});

// Get wards by district_id
router.get('/wards/:district_id', async (req, res) => {
  try {
    const { district_id } = req.params;
    const districts = await readJSONFile('district.json');
    const allWards = await readJSONFile('wards.json');

    // Find the district first (robust lookup)
    const district = districts.find(d => 
      String(d.district_id).trim() === String(district_id).trim() || 
      String(d.original_id).trim() === String(district_id).trim() ||
      String(d.district_name).trim().toLowerCase() === String(district_id).trim().toLowerCase()
    );

    if (!district) {
      logger.warn(`⚠️ District not found for ID: ${district_id}`);
      return res.json([]);
    }

    // Filter wards by the resolved district_id
    const wards = allWards.filter(w => String(w.district_id) === String(district.district_id));

    // Add sequential ward_id for each ward if not present
    const wardsWithIds = wards.map((ward, index) => ({
      ward_id: ward.ward_id || `${district.district_id}_${index}`,
      ward_name: ward.ward_name,
      district_id: ward.district_id
    }));

    res.json(wardsWithIds);
  } catch (error) {
    logger.error('Error loading wards:', error);
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
    const city = cities.find(c => String(c.city_id) === String(city_id) || String(c.original_id) === String(city_id));
    const district = districts.find(d => String(d.district_id) === String(district_id) || String(d.original_id) === String(district_id));

    // Try to find ward - NOTE: wards.json has NO ward_id field, only ward_name and district_id
    let ward = null;

    // First, filter wards by district_id
    const filterDistrictId = district ? district.district_id : district_id; const districtWards = wards.filter(w => String(w.district_id) === String(filterDistrictId));

    // PRIORITY 1: Try to find by ward_name (case-insensitive and normalized)
    if (ward_identifier) {
      const normalizedIdentifier = String(ward_identifier).toLowerCase().trim()
        .replace(/phường/gi, '').replace(/xã/gi, '').replace(/thị trấn/gi, '').trim();

      ward = districtWards.find(w => {
        const normalizedWardName = String(w.ward_name).toLowerCase().trim()
          .replace(/phường/gi, '').replace(/xã/gi, '').replace(/thị trấn/gi, '').trim();
        return normalizedWardName === normalizedIdentifier ||
          normalizedWardName.includes(normalizedIdentifier) ||
          normalizedIdentifier.includes(normalizedWardName);
      });

      if (ward) {
        logger.info(`✅ Found ward by name: ${ward.ward_name}`);
      }
    }

    if (!ward) { ward = districtWards.find(w => String(w.original_id) === String(ward_identifier)); } // PRIORITY 2: If numeric, treat as index in the filtered array
    if (!ward && /^\d+$/.test(ward_identifier)) {
      const index = parseInt(ward_identifier);
      // Check if it's a reasonable index (0 to array length)
      if (!isNaN(index) && index >= 0 && index < districtWards.length) {
        ward = districtWards[index];
        logger.info(`✅ Found ward by index ${index}: ${ward.ward_name}`);
      } else {
        // If index is out of bounds, try to find by matching the number in ward_name
        ward = districtWards.find(w => w.ward_name && w.ward_name.includes(ward_identifier));
        if (ward) {
          logger.info(`✅ Found ward by number in name: ${ward.ward_name}`);
        }
      }
    }

    if (!city || !district || !ward) {
      logger.info('⚠️ Address not found:', {
        city_id,
        district_id,
        ward_identifier,
        found: { city: !!city, district: !!district, ward: !!ward },
        availableWards: districtWards.length,
        sampleWards: districtWards.slice(0, 3).map(w => ({ name: w.ward_name }))
      });

      // If we have city and district but no ward, return partial result with the ward identifier
      if (city && district) {
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
