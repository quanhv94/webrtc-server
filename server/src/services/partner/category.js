
import Category from '../../models/category';

export default class CategoryService {
  static create = async (partner) => {
    const categoryService = new CategoryService();
    if (!partner) throw new Error('Partner is required');
    await categoryService.init(partner);
    return categoryService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  /**
   * @returns {Promise<Array<{children:Array}>>} return category tree
   */
  findAll = async () => {
    const categories = await Category
      .find({ parentId: null })
      .populate({
        path: 'children',
      });
    return categories.map(x => x.toJSON());
  }

  static normalizeSubcategoryOnly = async (categoryIds) => {
    const subcategoryIds = await Category.find({ _id: categoryIds, parentId: { $ne: null } }).distinct('_id');
    return subcategoryIds;
  }
}
