
const sendSuccess = (res, data, message = 'Success', status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
};

const sendError = (res, message = 'Error', status = 500, details = null) => {
    console.error(`❌ [API Error] ${message}:`, details);
    return res.status(status).json({
        success: false,
        message,
        error: details || 'Lỗi server nội bộ',
        stack: process.env.NODE_ENV === 'development' ? undefined : undefined // Keep clean for now
    });
};

export default {
    sendSuccess,
    sendError
};
