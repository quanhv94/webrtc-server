import _ from 'lodash';
import arrayMove from 'array-move';
import Section from '../../models/section';
import Lesson from '../../models/lesson';
import File, { fileStatuses } from '../../models/file';
import Document from '../../models/document';

export default class SectionService {
  static create = async (partner) => {
    const sectionService = new SectionService();
    if (!partner) throw new Error('Partner is required');
    await sectionService.init(partner);
    return sectionService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findById = async (sectionId) => Section.findById(sectionId)

  create = async ({ courseId, name, description }) => {
    const lastSection = await Section.findOne({ courseId }).sort('-sortNo');
    const section = await Section.create({
      partnerId: this.partner.id,
      courseId,
      name,
      description,
      sortNo: _.get(lastSection, 'sortNo', 0) + 1,
    });
    return this.findById(section.id);
  }

  update = async ({ sectionId, name, description }) => {
    await Section.updateOne({
      _id: sectionId,
      partnerId: this.partner._id,
    }, {
      name,
      description,
    });
    return this.findById(sectionId);
  }

  move = async ({ sectionId, position }) => {
    const currentSection = await Section.findById(sectionId);
    let sections = await Section.find({
      courseId: currentSection.courseId,
      partnerId: this.partner.id,
    }).sort('sortNo');
    const from = _.findIndex(sections, x => x.id === sectionId);
    const to = position;
    sections = arrayMove(sections, from, to);
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];
      section.sortNo = i;
      await section.save();
    }
    return sections;
  }

  delete = async (sectionId) => {
    const section = await Section.findOne({ _id: sectionId, partnerId: this.partner.id });
    const lessons = await Lesson.find({ sectionId });
    for (const lesson of lessons) {
      const document = Document.findById(lesson.documentId);
      if (document) {
        await File.updateOne({ _id: document.fileId }, { status: fileStatuses.removed });
        await Document.deleteOne({ _id: document.id });
      }
      await Lesson.deleteOne({ _id: lesson.id });
    }
    await Section.deleteOne({ _id: section.id });
    const sections = await Section.find({ courseId: section.courseId }).sort('sortNo');
    for (let i = 0; i < sections.length; i += 1) {
      sections[i].sortNo = i;
      await sections[i].save();
    }
    return true;
  }
}
