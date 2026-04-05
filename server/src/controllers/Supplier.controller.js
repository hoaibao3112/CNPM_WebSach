/**
 * Supplier Controller - Thin controller, delegate to SupplierService
 */
import SupplierService from '../services/Supplier.service.js';
import baseController from './baseController.js';

class SupplierController {
  async getAll(req, res, next) {
    try {
      const suppliers = await SupplierService.getAll();
      return res.status(200).json(suppliers);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const supplier = await SupplierService.getById(req.params.id);
      return res.status(200).json(supplier);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const supplier = await SupplierService.create(req.body);
      return res.status(201).json({ message: 'Thêm nhà cung cấp thành công!', MaNCC: supplier.MaNCC });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      await SupplierService.update(req.params.id, req.body);
      return res.status(200).json({ message: 'Cập nhật nhà cung cấp thành công!', MaNCC: req.params.id });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await SupplierService.delete(req.params.id);
      return res.status(200).json({ message: 'Xóa nhà cung cấp thành công!', MaNCC: req.params.id });
    } catch (error) {
      next(error);
    }
  }

  async search(req, res, next) {
    try {
      const suppliers = await SupplierService.search(req.query.keyword);
      return res.status(200).json(suppliers);
    } catch (error) {
      next(error);
    }
  }

  async advancedSearch(req, res, next) {
    try {
      const results = await SupplierService.advancedSearch(req.query);
      return res.status(200).json({
        message: 'Tìm kiếm thành công!',
        count: results.length,
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new SupplierController();
