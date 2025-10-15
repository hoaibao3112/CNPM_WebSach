import pool from '../config/connectDatabase.js';

export function pointsFromOrderAmount(amountVnd) {
  const n = Number(amountVnd) || 0;
  return Math.max(0, Math.floor(n / 1000));
}

export function computeTier(points) {
  if (points >= 20000) return 'Vàng';
  if (points >= 5000) return 'Bạc';
  return 'Đồng';
}

export async function addLoyaltyPoints(dbConnOrPool, customerId, amountVnd) {
  const points = pointsFromOrderAmount(amountVnd);
  console.log('[loyalty] addLoyaltyPoints called', { customerId, amountVnd, points });
  if (!customerId || points <= 0) {
    console.log('[loyalty] nothing to add (invalid customerId or points<=0)');
    return { pointsAdded: 0 };
  }

  // Allow passing either a pool or a connection
  const q = async (sql, params) => {
    if (dbConnOrPool && typeof dbConnOrPool.query === 'function') {
      return dbConnOrPool.query(sql, params);
    }
    return pool.query(sql, params);
  };

  try {
    const [rows] = await q('SELECT loyalty_points FROM khachhang WHERE makh = ?', [customerId]);
    const cur = rows && rows[0] ? (rows[0].loyalty_points || 0) : 0;
    const newPoints = cur + points;
    const newTier = computeTier(newPoints);
    const updateRes = await q('UPDATE khachhang SET loyalty_points = ?, loyalty_tier = ? WHERE makh = ?', [newPoints, newTier, customerId]);
    console.log('[loyalty] updated', { customerId, cur, points, newPoints, newTier, updateRes: updateRes && updateRes.affectedRows });
    return { pointsAdded: points, newPoints, newTier };
  } catch (err) {
    console.error('[loyalty] addLoyaltyPoints error', err && err.message ? err.message : err);
    return { pointsAdded: 0, error: err && err.message };
  }
}

export async function subtractLoyaltyPoints(dbConnOrPool, customerId, amountVnd) {
  const points = pointsFromOrderAmount(amountVnd);
  console.log('[loyalty] subtractLoyaltyPoints called', { customerId, amountVnd, points });
  if (!customerId || points <= 0) {
    console.log('[loyalty] nothing to remove (invalid customerId or points<=0)');
    return { pointsRemoved: 0 };
  }

  const q = async (sql, params) => {
    if (dbConnOrPool && typeof dbConnOrPool.query === 'function') {
      return dbConnOrPool.query(sql, params);
    }
    return pool.query(sql, params);
  };

  try {
    const [rows] = await q('SELECT loyalty_points FROM khachhang WHERE makh = ?', [customerId]);
    const cur = rows && rows[0] ? (rows[0].loyalty_points || 0) : 0;
    const newPoints = Math.max(0, cur - points);
    const newTier = computeTier(newPoints);
    const updateRes = await q('UPDATE khachhang SET loyalty_points = ?, loyalty_tier = ? WHERE makh = ?', [newPoints, newTier, customerId]);
    console.log('[loyalty] subtracted', { customerId, cur, points, newPoints, newTier, updateRes: updateRes && updateRes.affectedRows });
    return { pointsRemoved: points, newPoints, newTier };
  } catch (err) {
    console.error('[loyalty] subtractLoyaltyPoints error', err && err.message ? err.message : err);
    return { pointsRemoved: 0, error: err && err.message };
  }
}
