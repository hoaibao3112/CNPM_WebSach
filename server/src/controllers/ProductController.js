import ProductService from '../services/ProductService.js';
import baseController from './baseController.js';

class ProductController {
    async getAll(req, res) {
        try {
            const filters = {
                category: req.query.category,
                search: req.query.search
            };
            const products = await ProductService.getAllProducts(filters);
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy danh sách sản phẩm', 500, error.message);
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const product = await ProductService.getProductById(id);
            return baseController.sendSuccess(res, product);
        } catch (error) {
            return baseController.sendError(res, error.message, 404);
        }
    }

    async create(req, res) {
        try {
            const productId = await ProductService.createProduct(req.body);
            return baseController.sendSuccess(res, { productId }, 'Tạo sản phẩm thành công', 201);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi tạo sản phẩm', 500, error.message);
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            await ProductService.updateProduct(id, req.body);
            return baseController.sendSuccess(res, null, 'Cập nhật sản phẩm thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await ProductService.deleteProduct(id);
            return baseController.sendSuccess(res, null, 'Xóa sản phẩm thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }
    async getSorted(req, res) {
        try {
            const { type } = req.params;
            const products = await ProductService.getSortedProducts(type);
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm sắp xếp', 500, error.message);
        }
    }

    async getByCategory(req, res) {
        try {
            const { id } = req.params;
            const products = await ProductService.getProductsByCategory(id);
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm theo danh mục', 500, error.message);
        }
    }

    async getRecommendations(req, res) {
        try {
            const products = await ProductService.getRecommendations(req.query);
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy gợi ý sản phẩm', 500, error.message);
        }
    }

    async getLowStock(req, res) {
        try {
            const products = await ProductService.getLowStockProducts();
            return baseController.sendSuccess(res, products);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm sắp hết hàng', 500, error.message);
        }
    }

    // Get new products (for customer frontend)
    async getNew(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 12;
            const products = await ProductService.getSortedProducts('new');
            const limitedProducts = products.slice(0, limit);
            return baseController.sendSuccess(res, limitedProducts);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm mới', 500, error.message);
        }
    }

    // Get promotion products (for customer frontend)
    async getPromotionProducts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 12;
            const products = await ProductService.getSortedProducts('promotion');
            const limitedProducts = products.slice(0, limit);
            return baseController.sendSuccess(res, limitedProducts);
        } catch (error) {
            return baseController.sendError(res, 'Lỗi khi lấy sản phẩm khuyến mãi', 500, error.message);
        }
    }

    async updateMinStock(req, res) {
        try {
            const { id } = req.params;
            const { MinSoLuong } = req.body;
            await ProductService.updateMinStock(id, MinSoLuong);
            return baseController.sendSuccess(res, null, 'Cập nhật ngưỡng tồn kho thành công');
        } catch (error) {
            return baseController.sendError(res, error.message, 400);
        }
    }
}

export default new ProductController();
