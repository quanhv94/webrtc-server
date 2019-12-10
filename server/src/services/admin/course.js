
import Course from '../../models/course';
import Category from '../../models/category';

export default class CourseService {
  static create = async () => {
    const courseService = new CourseService();
    return courseService;
  }

  /**
   * @returns {Promise} return all courses
   */
  findAll = async ({ page = 1, keyword, categoryId, status, partnerId } = {}) => {
    const query = {};
    if (keyword) query.$text = { $search: keyword };
    if (categoryId) {
      const subCategoryIds = await Category.find({ parentId: categoryId }).distinct('_id');
      query.categoryIds = { $in: [categoryId, ...subCategoryIds] };
    }
    if (status) query.status = status;
    if (partnerId) query.partnerId = partnerId;
    const courses = await Course.paginate(query, {
      page,
      limit: 30,
      populate: ['author', 'partner',
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
          populate: ['icon', 'document'],
        },
      });
    return course;
  }

  /**
   * @returns {Promise<Number>} return all courses
   */
  count = (query = {}) => Course.countDocuments(query)

  toggleCourseActive = async ({ courseId, active }) => {
    await Course.updateOne({ _id: courseId }, { active });
  }

  toggleCourseGlobal = async ({ courseId, isGlobal }) => {
    await Course.updateOne({ _id: courseId }, { isGlobal });
  }

  changeCourseStatus = async ({ courseId, status }) => {
    await Course.updateOne({ _id: courseId }, { status });
  }
}
