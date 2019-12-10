
import Course, { courseStatuses } from '../../models/course';
import { documentStatuses } from '../../models/document';
import CategoryService from './category';
import Category from '../../models/category';

export default class CourseService {
  static create = async (partner) => {
    const courseService = new CourseService();
    if (!partner) throw new Error('Partner is required');
    await courseService.init(partner);
    return courseService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  /**
   * @returns {Promise<Number>} return all courses
   */
  count = async (query = {}) => Course.countDocuments({ ...query, partnerId: this.partner.id })

  /**
   * @returns {Promise<Array<{children:Array}>>} return all courses
   */
  findAll = async ({ page = 1, keyword, categoryId, partnerId, status } = {}) => {
    const query = { partnerId: this.partner.id };
    if (keyword) query.$text = { $search: keyword };
    if (categoryId) {
      const subCategoryIds = await Category.find({ parentId: categoryId }).distinct('_id');
      query.categoryIds = { $in: [categoryId, ...subCategoryIds] };
    }
    if (partnerId) query.partnerId = partnerId;
    if (status) query.status = status;
    const courses = await Course.paginate(query, {
      page,
      limit: 30,
      populate: ['author', 'partner', 'courseScope',
        {
          path: 'categories',
          populate: 'parent',
        },
        {
          path: 'sections',
          select: ['name', 'sortNo'],
          options: { sort: 'sortNo' },
          populate: {
            path: 'lessons',
            select: ['name', 'sortNo', 'documentId'],
            populate: {
              path: 'document',
              select: ['status', 'errorMessage'],
            },
            options: { sort: 'sortNo' },
          },
        }],
      sort: '-createdAt',
    });
    return courses;
  }

  findById = async (courseId) => {
    const course = await Course.findById(courseId)
      .populate('icon')
      .populate({
        path: 'sections',
        options: {
          sort: 'sortNo',
        },
        populate: {
          path: 'lessons',
          options: {
            sort: 'sortNo',
          },
          populate: ['icon', {
            path: 'document',
            populate: 'file',
          }],
        },
      });
    return course;
  }

  create = async ({
    name,
    description,
    benefit,
    price,
    courseScopeId,
    authorId,
    rating,
    tags = [],
    categoryIds = [],
  } = {}) => {
    const course = await Course.create({
      name,
      description,
      benefit,
      price,
      courseScopeId,
      authorId,
      rating,
      tags,
      categoryIds: await CategoryService.normalizeSubcategoryOnly(categoryIds),
      partnerId: this.partner.id,
    });
    return this.findById(course.id);
  }

  update = async ({
    courseId,
    name,
    description,
    benefit,
    price,
    courseScopeId,
    authorId,
    rating,
    tags = [],
    categoryIds = [],
  }) => {
    await Course.updateOne({
      _id: courseId,
      partnerId: this.partner._id,
    }, {
      name,
      description,
      benefit,
      price,
      courseScopeId,
      authorId,
      rating,
      tags,
      categoryIds: await CategoryService.normalizeSubcategoryOnly(categoryIds),
    });
    return this.findById(courseId);
  }

  updateIcon = async ({ courseId, fileId }) => {
    await Course.updateOne({ _id: courseId }, { iconId: fileId });
    return this.findById(courseId);
  }

  changeStatus = async ({ courseId, status }) => {
    const course = await this.findById(courseId);
    if (status === courseStatuses.published) {
      if (!course.sections || !course.sections.length) {
        throw new Error('Khoá học chưa có bài giảng');
      }
      course.sections.forEach(section => {
        if (!section.lessons || !section.lessons.length) {
          throw new Error(`Section: [${section.name}] chưa có bài giảng`);
        }
        section.lessons.forEach(lesson => {
          if (!lesson.document || lesson.document.status !== documentStatuses.ready) {
            throw new Error(`Section: [${section.name}], Lesson: [${lesson.name}] chưa có học liệu`);
          }
        });
      });
    }
    course.status = status;
    await course.save();
    return course;
  }

  delete = async (id) => {
    await Course.deleteOne({ _id: id, partnerId: this.partner.id });
    return true;
  }
}
