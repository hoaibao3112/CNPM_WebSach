/**
 * Supplier Service - Business logic cho nhà cung cấp
 * Sử dụng Sequelize ORM
 */
import { NhaCungCap } from '../models/index.js';
import { Op } from 'sequelize';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

class SupplierService {
  /**
   * Lấy tất cả nhà cung cấp
   */
  async getAll() {
    const suppliers = await NhaCungCap.findAll();
    return this._convertTinhTrang(suppliers);
  }

  /**
   * Lấy nhà cung cấp theo mã
   */
  async getById(maNCC) {
    const supplier = await NhaCungCap.findByPk(maNCC);
    if (!supplier) {
      throw new AppError('Không tìm thấy nhà cung cấp', 404);
    }
    return this._convertTinhTrangSingle(supplier);
  }

  /**
   * Thêm nhà cung cấp mới
   */
  async create({ MaNCC, TenNCC, SDT, DiaChi, TinhTrang }) {
    // Validate
    if (!MaNCC || !TenNCC || !SDT || !DiaChi) {
      throw new AppError('Vui lòng cung cấp đầy đủ thông tin bắt buộc!', 400);
    }
    if (!/^\d{10,11}$/.test(SDT)) {
      throw new AppError('Số điện thoại không hợp lệ!', 400);
    }

    // Check duplicate
    const existing = await NhaCungCap.findByPk(MaNCC);
    if (existing) {
      throw new AppError('Mã NCC đã tồn tại! Vui lòng chọn mã khác.', 409);
    }

    const tinhTrangNum = TinhTrang === '1' ? true : (TinhTrang === '0' ? false : true);

    const supplier = await NhaCungCap.create({
      MaNCC, TenNCC, SDT, DiaChi, TinhTrang: tinhTrangNum
    });

    logger.info(`Thêm nhà cung cấp: ${MaNCC}`);
    return supplier;
  }

  /**
   * Cập nhật nhà cung cấp
   */
  async update(maNCC, { TenNCC, SDT, DiaChi, TinhTrang }) {
    if (!TenNCC || !SDT || !DiaChi) {
      throw new AppError('Vui lòng cung cấp đầy đủ thông tin bắt buộc!', 400);
    }
    if (!/^\d{10,11}$/.test(SDT)) {
      throw new AppError('Số điện thoại không hợp lệ!', 400);
    }

    const supplier = await NhaCungCap.findByPk(maNCC);
    if (!supplier) {
      throw new AppError('Không tìm thấy nhà cung cấp để cập nhật!', 404);
    }

    const tinhTrangNum = TinhTrang === '1' ? true : (TinhTrang === '0' ? false : true);

    await supplier.update({ TenNCC, SDT, DiaChi, TinhTrang: tinhTrangNum });

    logger.info(`Cập nhật nhà cung cấp: ${maNCC}`);
    return supplier;
  }

  /**
   * Xóa nhà cung cấp
   */
  async delete(maNCC) {
    const supplier = await NhaCungCap.findByPk(maNCC);
    if (!supplier) {
      throw new AppError('Không tìm thấy nhà cung cấp để xóa!', 404);
    }

    await supplier.destroy();
    logger.info(`Xóa nhà cung cấp: ${maNCC}`);
    return true;
  }

  /**
   * Tìm kiếm nhà cung cấp (fuzzy search)
   */
  async search(keyword) {
    if (!keyword) {
      return this.getAll();
    }

    const suppliers = await NhaCungCap.findAll({
      where: {
        [Op.or]: [
          { MaNCC: { [Op.like]: `%${keyword}%` } },
          { TenNCC: { [Op.like]: `%${keyword}%` } },
          { SDT: { [Op.like]: `%${keyword}%` } },
          { DiaChi: { [Op.like]: `%${keyword}%` } }
        ]
      }
    });

    return this._convertTinhTrang(suppliers);
  }

  /**
   * Tìm kiếm nâng cao
   */
  async advancedSearch({ ten, ma, sdt, diachi }) {
    if (!ten && !ma && !sdt && !diachi) {
      throw new AppError('Vui lòng cung cấp ít nhất một tiêu chí tìm kiếm!', 400);
    }

    const where = {};
    if (ten) where.TenNCC = { [Op.like]: `%${ten}%` };
    if (ma) where.MaNCC = { [Op.like]: `%${ma}%` };
    if (sdt) where.SDT = { [Op.like]: `%${sdt}%` };
    if (diachi) where.DiaChi = { [Op.like]: `%${diachi}%` };

    const suppliers = await NhaCungCap.findAll({ where });
    return this._convertTinhTrang(suppliers);
  }

  // --- Private helpers ---

  _convertTinhTrang(rows) {
    return rows.map(r => this._convertTinhTrangSingle(r));
  }

  _convertTinhTrangSingle(row) {
    const data = row.toJSON ? row.toJSON() : { ...row };
    if (data.TinhTrang && data.TinhTrang.type === 'Buffer') {
      data.TinhTrang = data.TinhTrang.data[0].toString();
    }
    return data;
  }
}

export default new SupplierService();
