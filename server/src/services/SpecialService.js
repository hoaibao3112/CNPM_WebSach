import pool from '../config/connectDatabase.js';

class SpecialService {
    // --- Chat ---
    async getOrCreateRoom(customerId) {
        const [existing] = await pool.query('SELECT room_id FROM chat_rooms WHERE customer_id = ? LIMIT 1', [customerId]);
        if (existing.length > 0) return existing[0].room_id;

        const [result] = await pool.query('INSERT INTO chat_rooms (customer_id, created_at, updated_at) VALUES (?, NOW(), NOW())', [customerId]);
        return result.insertId;
    }

    async saveMessage(data) {
        const { room_id, sender_id, sender_type, message } = data;
        const [result] = await pool.query(
            'INSERT INTO chat_messages (room_id, sender_id, sender_type, message, created_at) VALUES (?, ?, ?, ?, NOW())',
            [room_id, sender_id, sender_type, message]
        );
        await pool.query('UPDATE chat_rooms SET updated_at = NOW() WHERE room_id = ?', [room_id]);
        return result.insertId;
    }

    // --- Map (Geocoding Proxy) ---
    async geocode(query) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'CNPM_Project/1.0' }
        });
        return await response.json();
    }
}

export default new SpecialService();
