import _ from 'lodash';
import arrayMove from 'array-move';
import Lesson from '../../models/lesson';
import File, { fileStatuses } from '../../models/file';
import Document from '../../models/document';

export default class LessonService {
  static create = async (partner) => {
    const lessonService = new LessonService();
    if (!partner) throw new Error('Partner is required');
    await lessonService.init(partner);
    return lessonService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findById = async (lessonId) => Lesson.findById(lessonId)

  create = async ({ courseId, sectionId, documentId, name, description }) => {
    const lastLesson = await Lesson.findOne({ courseId }).sort('-sortNo');
    const lesson = await Lesson.create({
      partnerId: this.partner.id,
      courseId,
      sectionId,
      documentId,
      name,
      description,
      sortNo: _.get(lastLesson, 'sortNo', 0) + 1,
    });
    return this.findById(lesson.id);
  }

  update = async ({ lessonId, name, description }) => {
    await Lesson.updateOne({
      _id: lessonId,
      partnerId: this.partner._id,
    }, {
      name,
      description,
    });
    return this.findById(lessonId);
  }

  move = async ({ lessonId, position }) => {
    const currentLesson = await Lesson.findById(lessonId);
    let lessons = await Lesson.find({
      courseId: currentLesson.courseId,
      sectionId: currentLesson.sectionId,
      partnerId: this.partner.id,
    }).sort('sortNo');
    const from = _.findIndex(lessons, x => x.id === lessonId);
    const to = position;
    lessons = arrayMove(lessons, from, to);
    for (let i = 0; i < lessons.length; i += 1) {
      const lesson = lessons[i];
      lesson.sortNo = i;
      await lesson.save();
    }
    return lessons;
  }

  delete = async (lessonId) => {
    const lesson = await Lesson.findOne({ _id: lessonId, partnerId: this.partner.id });
    const document = Document.findById(lesson.documentId);
    if (document) {
      await File.updateOne({ _id: document.fileId }, { status: fileStatuses.removed });
      await Document.deleteOne({ _id: document.id });
    }
    await Lesson.deleteOne({ _id: lesson.id });
    return true;
  }
}
