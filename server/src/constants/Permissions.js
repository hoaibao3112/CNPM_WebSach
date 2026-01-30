export const ACTIONS = {
    READ: 'READ',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

export const RESOURCES = {
    PRODUCT: 'PRODUCT',
    CATEGORY: 'CATEGORY',
    AUTHOR: 'AUTHOR',
    SUPPLIER: 'SUPPLIER',
    RECEIPT: 'RECEIPT',
    ORDER: 'ORDER',
    USER: 'USER',
    CUSTOMER: 'CUSTOMER',
    PROMOTION: 'PROMOTION',
    ROLE: 'ROLE',
    REPORT: 'REPORT',
    RETURN: 'RETURN',
    REFUND: 'REFUND',
    ATTENDANCE: 'ATTENDANCE',
    SALARY: 'SALARY',
    LEAVE: 'LEAVE',
    CHAT: 'CHAT',
    FAQ: 'FAQ'
};

// Helper to generate key string
export const createPermission = (resource, action) => `${resource}_${action}`;

// Mapping from Vietnamese DB values to keys
export const DB_MAP = {
    RESOURCES: {
        'Sản phẩm': RESOURCES.PRODUCT,
        'Thể loại': RESOURCES.CATEGORY,
        'Tác giả': RESOURCES.AUTHOR,
        'Nhà cung cấp': RESOURCES.SUPPLIER,
        'Nhập hàng': RESOURCES.RECEIPT,
        'Đơn hàng': RESOURCES.ORDER,
        'Tài khoản': RESOURCES.USER,
        'Khách hàng': RESOURCES.CUSTOMER,
        'Khuyến mãi': RESOURCES.PROMOTION,
        'Phân quyền': RESOURCES.ROLE,
        'Báo cáo': RESOURCES.REPORT,
        'Trả Hàng': RESOURCES.RETURN,
        'Hoàn tiền đơn hàng': RESOURCES.REFUND,
        'Chấm công': RESOURCES.ATTENDANCE,
        'Bảng lương': RESOURCES.SALARY,
        'Nghỉ phép': RESOURCES.LEAVE,
        'Chat': RESOURCES.CHAT,
        'FAQ': RESOURCES.FAQ,
    },
    ACTIONS: {
        'Xem': ACTIONS.READ,
        'Đọc': ACTIONS.READ,
        'Thêm': ACTIONS.CREATE,
        'Sửa': ACTIONS.UPDATE,
        'Xóa': ACTIONS.DELETE
    }
};
