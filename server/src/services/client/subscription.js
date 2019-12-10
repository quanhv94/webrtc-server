
import Subscription from '../../models/subscription';
import Course, { courseStatuses } from '../../models/course';

export default class SubscriptionService {
  static create = async (client) => {
    const subscriptionService = new SubscriptionService();
    if (!client) throw new Error('Client is required');
    await subscriptionService.init(client);
    return subscriptionService;
  }

  init = async (client) => {
    this.client = client;
  }

  /**
   * @returns {Promise<Boolean>}
   */

  isSubscribed = async (courseId) => {
    const clientId = this.client._id;
    return Subscription.exists({
      courseId,
      clientId,
    });
  }

  /**
   * @returns {Promise<Boolean>}
   */
  subscribe = async (courseId) => {
    if (await this.isSubscribed(courseId)) {
      throw new Error('Bạn đã đăng ký khoá học này rồi');
    }
    const clientId = this.client._id;
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Khoá học không tồn tại');
    if (course.status !== courseStatuses.updating) throw new Error('Khoá học không thể đăng ký');
    await Subscription.create({
      courseId,
      clientId,
      partnerId: course.partnerId,
    });
    return true;
  }

  /**
   * @returns {Promise<Boolean>}
   */
  unsubscribe = async (courseId) => {
    const clientId = this.client._id;
    await Subscription.deleteOne({
      courseId,
      clientId,
    });
    return true;
  }

  /**
   * @returns {Promise<Array<String>>}
   */
  getSubscribedCourseIds = async () => {
    const ids = await Subscription.find({ clientId: this.client.id })
      .distinct('courseId');
    return ids.map(x => `${x}`);
  }
}
