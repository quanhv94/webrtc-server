
import Order, { orderStatuses } from '../../models/order';
import Course from '../../models/course';

export default class OrderService {
  static create = async (client) => {
    const orderService = new OrderService();
    if (!client) throw new Error('Client is required');
    await orderService.init(client);
    return orderService;
  }

  init = async (client) => {
    this.client = client;
  }

  /**
   * @returns {Promise<Boolean>} Check if course is ordered
   */
  async isOrdered(courseId) {
    const clientId = this.client._id;
    const statuses = [orderStatuses.completed, orderStatuses.pending];
    return Order.exists({ courseId, clientId, status: statuses });
  }

  /**
   * @returns {Promise<Boolean>} Check if course is purchasing
   */
  async isPurchasing(courseId) {
    const clientId = this.client._id;
    return Order.exists({ courseId, clientId, status: orderStatuses.pending });
  }

  /**
   * @returns {Promise<Boolean>} Check if course is purchased
   */
  async isPurchased(courseId) {
    const clientId = this.client._id;
    return Order.exists({ courseId, clientId, status: orderStatuses.completed });
  }

  /**
   * @param  {String} courseId
   * @returns {Promise<Boolean>}
   */
  async buyCourse(courseId) {
    if (await this.isOrdered(courseId)) {
      throw new Error('Bạn đã mua khoá học này rồi.');
    }
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Khoá học không tồn tại');
    if (course.price === 0) {
      await Order.create({
        clientId: this.client.id,
        courseId,
        price: course.price,
        partnerId: course.partnerId,
        status: orderStatuses.completed,
        completedAt: Date.now(),
      });
      return true;
    }
    await Order.create({
      clientId: this.client.id,
      courseId,
      partnerId: course.partnerId,
      status: orderStatuses.pending,
      price: course.price,
    });
    return true;
  }

  /**
   * @returns {Promise<Array<String>>}
   */
  getOrderedCourseIds = async () => {
    const statuses = [orderStatuses.completed, orderStatuses.pending];
    const ids = await Order.find({ clientId: this.client.id, status: statuses })
      .distinct('courseId');
    return ids.map(x => `${x}`);
  }

  /**
   * @returns {Promise<Array<String>>}
   */
  getOrderingCourseIds = async () => {
    const ids = await Order.find({ clientId: this.client.id, status: orderStatuses.pending })
      .distinct('courseId');
    return ids.map(x => `${x}`);
  }

  /**
   * @returns {Promise<Array<String>>}
   */
  getPurchasedCourseIds = async () => {
    const ids = await Order.find({ clientId: this.client.id, status: orderStatuses.completed })
      .distinct('courseId');
    return ids.map(x => `${x}`);
  }
}
