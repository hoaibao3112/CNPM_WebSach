import pool from '../config/connectDatabase.js';

/**
 * Recompute aggregated preference scores for a single customer using all their consented responses.
 * If a connection is provided, it will be used (caller manages transaction). Otherwise a connection/transaction is created.
 */
export async function recomputePreferencesForCustomer(makh, externalConnection = null) {
  let connection = externalConnection;
  let createdConn = false;
  try {
    if (!connection) {
      connection = await pool.getConnection();
      createdConn = true;
      await connection.beginTransaction();
    }

    // Fetch all consented responses for this customer
    const [responses] = await connection.query(
      `SELECT MaPhanHoi, MaForm FROM phanhoi_sothich WHERE makh = ? AND DongYSuDung = 1`,
      [makh]
    );

    if (!responses || responses.length === 0) {
      // Nothing to do: remove any existing preference rows (optional)
      // We'll leave current scores intact if there are none — caller can decide
      if (createdConn) {
        await connection.commit();
      }
      return { success: true, message: 'No consented responses found', updated: 0 };
    }

    const responseIds = responses.map(r => r.MaPhanHoi);

    // Aggregate scores across all responses
    const [answers] = await connection.query(
      `SELECT lc.MaLuaChon, lc.MaTL, lc.MaTG, lc.HinhThuc, lc.MaKhoangGia,
              lc.NamXBTu, lc.NamXBDen, lc.SoTrangTu, lc.SoTrangDen, lc.TrongSo
       FROM traloi_sothich tl
       JOIN luachon_cauhoi lc ON tl.MaLuaChon = lc.MaLuaChon
       WHERE tl.MaPhanHoi IN (${responseIds.map(() => '?').join(',')})`,
      responseIds
    );

    const newMap = new Map();
    for (let ans of answers) {
      const weight = parseFloat(ans.TrongSo || 1.0);
      if (ans.MaTL) {
        const k = `theloai:${ans.MaTL}`;
        newMap.set(k, (newMap.get(k) || 0) + weight);
      }
      if (ans.MaTG) {
        const k = `tacgia:${ans.MaTG}`;
        newMap.set(k, (newMap.get(k) || 0) + weight);
      }
      if (ans.HinhThuc) {
        const k = `hinhthuc:${ans.HinhThuc}`;
        newMap.set(k, (newMap.get(k) || 0) + weight);
      }
      if (ans.MaKhoangGia) {
        const k = `khoanggia:${ans.MaKhoangGia}`;
        newMap.set(k, (newMap.get(k) || 0) + weight);
      }
      if (ans.NamXBTu && ans.NamXBDen) {
        const k = `namxb:${ans.NamXBTu}-${ans.NamXBDen}`;
        newMap.set(k, (newMap.get(k) || 0) + weight);
      }
      if (ans.SoTrangTu && ans.SoTrangDen) {
        const k = `sotrang:${ans.SoTrangTu}-${ans.SoTrangDen}`;
        newMap.set(k, (newMap.get(k) || 0) + weight);
      }
    }

    // Read existing scores
    const [existingRows] = await connection.query(
      `SELECT LoaiThucThe, KhoaThucThe, DiemSo FROM diem_sothich_khachhang WHERE makh = ?`,
      [makh]
    );
    const existingMap = new Map();
    for (let r of existingRows) {
      const key = `${r.LoaiThucThe}:${r.KhoaThucThe}`;
      existingMap.set(key, Number(r.DiemSo || 0));
    }

    const updated = [];

    // Upsert new/updated scores
    for (let [key, score] of newMap.entries()) {
      const [LoaiThucThe, KhoaThucThe] = key.split(':');
      const newScore = Math.round(score);
      const oldScore = existingMap.has(key) ? existingMap.get(key) : 0;

      if (newScore !== oldScore) {
        if (newScore <= 0) {
          await connection.query(
            `DELETE FROM diem_sothich_khachhang WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ?`,
            [makh, LoaiThucThe, KhoaThucThe]
          );
        } else {
          await connection.query(
            `INSERT INTO diem_sothich_khachhang (makh, LoaiThucThe, KhoaThucThe, DiemSo, NgayTao, NgayCapNhat)
             VALUES (?, ?, ?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE DiemSo = VALUES(DiemSo), NgayCapNhat = NOW()`,
            [makh, LoaiThucThe, KhoaThucThe, newScore]
          );
        }

        // Insert history
        try {
          await connection.query(
            `INSERT INTO diem_sothich_history (makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, strategy, form_id, note, changed_at)
             VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NOW())`,
            [makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, 'recompute_full', 'recomputed from all responses']
          );
        } catch (e) {
          console.warn('Could not insert history in recompute:', e.message);
        }

        updated.push({ LoaiThucThe, KhoaThucThe, oldScore, newScore });
      }
    }

    // Delete keys that exist in old but not in new
    for (let [key, oldScore] of existingMap.entries()) {
      if (!newMap.has(key)) {
        const [LoaiThucThe, KhoaThucThe] = key.split(':');
        await connection.query(
          `DELETE FROM diem_sothich_khachhang WHERE makh = ? AND LoaiThucThe = ? AND KhoaThucThe = ?`,
          [makh, LoaiThucThe, KhoaThucThe]
        );
        try {
          await connection.query(
            `INSERT INTO diem_sothich_history (makh, LoaiThucThe, KhoaThucThe, oldScore, newScore, strategy, form_id, note, changed_at)
             VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NOW())`,
            [makh, LoaiThucThe, KhoaThucThe, oldScore, 0, 'recompute_full_delete', 'deleted after recompute']
          );
        } catch (e) {
          console.warn('Could not insert history for deletion in recompute:', e.message);
        }
        updated.push({ LoaiThucThe, KhoaThucThe, oldScore, newScore: 0 });
      }
    }

    if (createdConn) {
      await connection.commit();
    }

    return { success: true, message: 'Recomputed preferences', updatedCount: updated.length, updated };
  } catch (error) {
    if (createdConn && connection) await connection.rollback();
    console.error('Error recomputePreferencesForCustomer:', error);
    throw error;
  } finally {
    if (createdConn && connection) connection.release();
  }
}

export default { recomputePreferencesForCustomer };
