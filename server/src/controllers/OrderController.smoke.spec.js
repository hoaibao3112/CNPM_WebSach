import OrderController from './OrderController.js';
import OrderService from '../services/OrderService.js';
import baseController from './baseController.js';

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
};

describe('OrderController smoke tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('place-order: returns vnpay payload', async () => {
    const req = {
      body: { paymentMethod: 'VNPAY' },
      user: { makh: 19 },
      ip: '127.0.0.1',
    };
    const res = createMockResponse();

    jest.spyOn(OrderService, 'placeOrder').mockResolvedValue({ orderId: 1001, finalTotalAmount: 250000 });
    jest.spyOn(OrderService, 'finalizeCheckout').mockResolvedValue({
      responseType: 'raw',
      statusCode: 200,
      payload: { success: true, orderId: 1001, paymentUrl: 'http://mock-vnpay' },
    });

    await OrderController.placeOrder(req, res);

    expect(OrderService.placeOrder).toHaveBeenCalledTimes(1);
    expect(OrderService.finalizeCheckout).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, orderId: 1001 }));
  });

  test('update-status: delegates to service and returns success envelope', async () => {
    const req = {
      params: { id: '12' },
      body: { status: 'Đã xác nhận' },
    };
    const res = createMockResponse();

    jest.spyOn(OrderService, 'updateOrderStatus').mockResolvedValue({ id: 12, status: 'Đã xác nhận' });
    const sendSuccessSpy = jest.spyOn(baseController, 'sendSuccess').mockReturnValue({ ok: true });

    await OrderController.updateOrderStatus(req, res);

    expect(OrderService.updateOrderStatus).toHaveBeenCalledWith('12', 'Đã xác nhận');
    expect(sendSuccessSpy).toHaveBeenCalledWith(res, { id: 12, status: 'Đã xác nhận' }, 'Cập nhật trạng thái thành công');
  });

  test('delete-order: delegates to service and returns success envelope', async () => {
    const req = {
      params: { id: '30' },
    };
    const res = createMockResponse();

    jest.spyOn(OrderService, 'deleteOrder').mockResolvedValue({ id: 30 });
    const sendSuccessSpy = jest.spyOn(baseController, 'sendSuccess').mockReturnValue({ ok: true });

    await OrderController.deleteOrder(req, res);

    expect(OrderService.deleteOrder).toHaveBeenCalledWith('30');
    expect(sendSuccessSpy).toHaveBeenCalledWith(res, { id: 30 }, 'Xóa đơn hàng thành công');
  });

  test('vnpay_return: redirects success url from service result', async () => {
    const req = {
      query: {
        vnp_TxnRef: '77',
        vnp_ResponseCode: '00',
        vnp_Amount: '1000000',
      },
    };
    const res = createMockResponse();

    const oldUrl = process.env.CLIENT_CUSTOMER_URL;
    process.env.CLIENT_CUSTOMER_URL = 'http://localhost:5501';

    jest.spyOn(OrderService, 'processVNPayReturn').mockResolvedValue({
      orderId: '77',
      amount: 10000,
      rspCode: '00',
      status: 'success',
    });

    await OrderController.vnpayReturn(req, res);

    expect(OrderService.processVNPayReturn).toHaveBeenCalledWith(req.query);
    expect(res.redirect).toHaveBeenCalledWith(
      'http://localhost:5501/GiaoDien/order-confirmation.html?orderId=77&amount=10000&status=success',
    );

    process.env.CLIENT_CUSTOMER_URL = oldUrl;
  });
});
