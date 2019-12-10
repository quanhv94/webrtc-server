
import Order, { orderStatuses } from '../../models/order';

export default class OrderService {
  static create = async () => {
    const orderService = new OrderService();
    return orderService;
  }

  /**
   * @returns {Promise} return all orders
   */
  findAll = async ({ page = 1, status, partnerId, clientId } = {}) => {
    const query = {};
    if (status) query.status = status;
    if (partnerId) query.partnerId = partnerId;
    if (clientId) query.clientId = clientId;
    const orders = await Order.paginate(query, {
      page,
      limit: 50,
      populate: ['course', 'partner', 'client'],
    });
    return orders;
  }

  changeOrderStatus = async ({ orderId, status }) => {
    await Order.updateOne({ _id: orderId }, {
      status,
      completedAt: status === orderStatuses.completed ? Date.now() : null,
    });
  }
}
