/* eslint-disable max-classes-per-file */

import _ from 'lodash';
import Course, { courseStatuses } from '../../models/course';
import CategoryService from './category';
import ClientTypeService from './clientType';
import OrderService from './order';
import SubscriptionService from './subscription';

export default class CourseService {
  static create = async (client) => {
    const courseService = new CourseService();
    if (!client) throw new Error('Client is required');
    await courseService.init(client);
    return courseService;
  }

  init = async (client) => {
    this.client = client;
    this.clientTypeService = await ClientTypeService.create(client);
    this.categoryService = await CategoryService.create(client);
    this.orderService = await OrderService.create(client);
    this.subscriptionService = await SubscriptionService.create(client);
  }

  /**
   * @param {Object} query
   */
  nomalizeQuery = (query) => ({
    $and: [query, {
      categoryIds: { $in: this.clientTypeService.getAccessibleCategoryIds() },
      courseScopeId: this.clientTypeService.getCourseScopeIds(),
      status: [courseStatuses.published, courseStatuses.updating],
      $or: [{
        partnerId: this.client.partnerId,
      }, {
        isGlobal: true,
      }],
      active: true,
    }],
  })

  /**
   * @returns {Promise<Array>}
   */
  getRecommendedCourses = async (limit = 10, fullDetail) => {
    // Get subscribed courses that published
    const subscribedCourseIds = await this.subscriptionService.getSubscribedCourseIds();
    const orderedCourseIds = await this.orderService.getOrderedCourseIds();
    const subscribedCourses = await Course.find(this.nomalizeQuery({
      _id: {
        $in: subscribedCourseIds,
        $nin: orderedCourseIds,
      },
      status: courseStatuses.published,
    }))
      .populate(['icon', 'author', 'partner'])
      .sort('-createdAt')
      .limit(limit);
    const newCourses = await Course.find(this.nomalizeQuery({
      _id: {
        $nin: [...subscribedCourseIds, ...orderedCourseIds],
      },
      status: courseStatuses.published,
    }))
      .populate(['icon', 'author', 'partner'])
      .sort('-createdAt')
      .limit(limit);
    const courses = _.take(subscribedCourses.concat(newCourses), limit);
    if (fullDetail) await this.populateSection(courses);
    return this.attachAdditionalDataToCourses(courses);
  }

  /**
   * @returns {Promise<Array>}
   */
  getCoursesGroupByCategory = async () => {
    const categories = await this.categoryService.getCategories();
    for (const category of categories) {
      const subcategoryIds = category.children.map(x => x.id);
      const courses = await Course.find(this.nomalizeQuery({
        categoryIds: { $in: subcategoryIds },
      }))
        .sort('-createdAt')
        .populate(['icon', 'author', 'partner'])
        .limit(4);
      category.courses = await this.attachAdditionalDataToCourses(courses);
      delete category.children;
    }
    return categories;
  }

  /**
   * @returns {Promise<Object>}
   */
  search = async ({ keyword = '', page = 1, categoryId } = {}) => {
    const query = {};
    if (categoryId) {
      const subcategoryIds = await this.categoryService.getSubcategoryIdsByParentId(categoryId);
      const categoryIds = [categoryId].concat(subcategoryIds);
      query.categoryIds = { $in: categoryIds };
    }
    if (keyword.match(/tag:/)) {
      query.tags = keyword.split(':')[1].trim();
    } else if (keyword.match(/status:/)) {
      query.status = keyword.split(':')[1].trim();
    } else if (keyword) {
      query.$text = { $search: keyword };
    }
    const result = await Course.paginate(this.nomalizeQuery(query), {
      page,
      limit: 40,
      populate: ['icon', 'author', 'partner'],
    });
    result.docs = await this.attachAdditionalDataToCourses(result.docs);
    return result;
  }

  /**
   * @param {String} courseId
   * @returns {Promise<Object>}
   */
  getCourseDetail = async (courseId) => {
    const course = await Course.findById(courseId)
      .populate(['icon', 'author', 'partner']);
    await this.populateSection(course);
    return this.attachAdditionalDataToCourse(course);
  }

  /**
   * @returns {Promise<Array>}
   */
  getPurchasedCourses = async (fullDetail = false) => {
    const purchasedCourseIds = await this.orderService.getPurchasedCourseIds();
    const courses = await Course.find(this.nomalizeQuery({ _id: purchasedCourseIds }))
      .populate(['icon', 'author', 'partner']);
    if (fullDetail) await this.populateSection(courses);
    return this.attachAdditionalDataToCourses(courses);
  }

  /**
   * @returns {Promise<Number>}
   */
  countPurchasedCourses = async () => {
    const purchasedCourseIds = await this.orderService.getPurchasedCourseIds();
    const count = await Course.countDocuments(this.nomalizeQuery({ _id: purchasedCourseIds }));
    return count;
  }

  /**
   * @returns {Promise<Array>}
   */
  getOrderingCourses = async () => {
    const orderingCourseIds = await this.orderService.getOrderingCourseIds();
    const courses = await Course.find(this.nomalizeQuery({ _id: orderingCourseIds }))
      .populate(['icon', 'author', 'partner']);
    return this.attachAdditionalDataToCourses(courses);
  }

  /**
  * @returns {Promise<Number>}
  */
  countOrderingCourses = async () => {
    const orderingCourseIds = await this.orderService.getOrderingCourseIds();
    const count = await Course.countDocuments(this.nomalizeQuery({ _id: orderingCourseIds }));
    return count;
  }

  /**
   * @returns {Promise<Array>}
   */
  getSubscribedCourses = async () => {
    const subscribedCourseIds = await this.subscriptionService.getSubscribedCourseIds();
    const courses = await Course.find(this.nomalizeQuery({
      _id: subscribedCourseIds,
      status: [courseStatuses.published, courseStatuses.updating],
    }))
      .populate(['icon', 'author', 'partner']);
    return this.attachAdditionalDataToCourses(courses);
  }

  /**
   * @returns {Promise<Number>}
   */
  countSubscribedCourses = async () => {
    const subscribedCourseIds = await this.subscriptionService.getSubscribedCourseIds();
    const count = await Course.countDocuments(this.nomalizeQuery({
      _id: subscribedCourseIds,
      status: [courseStatuses.published, courseStatuses.updating],
    }));
    return count;
  }

  /**
   * @param {Array} courses
   * @returns {Promise<Object>}
   */
  attachAdditionalDataToCourses = async (courses) => {
    const data = [];
    for (const course of courses) {
      data.push(await this.attachAdditionalDataToCourse(course));
    }
    return data;
  }

  /**
   * @param {Object} course
   * @returns {Promise<Object>}
   */
  attachAdditionalDataToCourse = async (course) => {
    course = course.toJSON ? course.toJSON() : course;
    course.isSubscribed = await this.subscriptionService.isSubscribed(course.id);
    course.isOrdered = await this.orderService.isOrdered(course.id);
    course.isPurchased = await this.orderService.isPurchased(course.id);
    course.isPurchasing = await this.orderService.isPurchasing(course.id);
    return course;
  }

  populateSection = async (courses) => {
    await Course.populate(courses, {
      path: 'sections',
      options: {
        sort: 'sortNo',
      },
      populate: {
        path: 'lessons',
        options: {
          sort: 'sortNo',
        },
        populate: [{
          path: 'document',
          populate: 'file',
        }],
      },
    });
    return courses;
  }
}
