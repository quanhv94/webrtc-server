
import CourseScope from '../../models/courseScope';

export default class CourseScopeService {
  static create = async (partner) => {
    const courseScopeService = new CourseScopeService();
    if (!partner) throw new Error('Partner is required');
    await courseScopeService.init(partner);
    return courseScopeService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findAll = async () => {
    const courseScopes = await CourseScope.find({ partnerId: this.partner.id }).sort('-createdAt');
    return courseScopes;
  }

  findById = async (courseScopeId) => {
    const courseScope = await CourseScope.findById(courseScopeId);
    return courseScope;
  }

  create = async ({ name, color, description }) => {
    const courseScope = await CourseScope.create({
      partnerId: this.partner.id,
      name,
      color,
      description,
    });
    return this.findById(courseScope.id);
  }

  update = async ({ id, name, color, description }) => {
    await CourseScope.updateOne({
      _id: id,
      partnerId: this.partner._id,
    }, {
      name,
      color,
      description,
    });
    return this.findById(id);
  }

  delete = async (id) => {
    await CourseScope.deleteOne({ _id: id, partnerId: this.partner.id });
    return true;
  }
}
