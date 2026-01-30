
const sendSuccess = (res, data, message = 'Success', status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data
    });
};

const sendError = (res, message = 'Error', status = 500, details = null) => {
    return res.status(status).json({
        success: false,
        message,
        error: details
    });
};

export default {
    sendSuccess,
    sendError
};
