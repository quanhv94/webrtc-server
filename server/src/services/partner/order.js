
import Order from '../../models/order';

export default class OrderService {
  static create = async (partner) => {
    const orderService = new OrderService();
    if (!partner) throw new Error('Partner is required');
    await orderService.init(partner);
    return orderService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findAll = async ({ page = 1, status, clientId } = {}) => {
    const query = { partnerId: this.partner.id };
    if (status) query.status = status;
    if (clientId) query.clientId = clientId;
    const orders = await Order.paginate(query, {
      page,
      limit: 50,
      populate: ['course', 'partner', 'client'],
    });
    return orders;
  }

  findById = async (orderId) => {
    const order = await Order.findById(orderId)
      .populate('course')
      .populate('client');
    return order;
  }

  changeStatus = async ({ id, status }) => {
    await Order.updateOne({
      _id: id,
      partnerId: this.partner._id,
    }, {
      status,
    });
    return this.findById(id);
  }
}
