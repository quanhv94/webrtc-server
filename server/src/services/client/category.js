
import Category from '../../models/category';
import ClientTypeService from './clientType';

export default class CategoryService {
  static create = async (client) => {
    const categoryService = new CategoryService();
    if (!client) throw new Error('Client is required');
    await categoryService.init(client);
    return categoryService;
  }

  init = async (client) => {
    this.client = client;
    this.clientTypeService = await ClientTypeService.create(client);
  }

  /**
   * @returns {Promise<Array<{children:Array}>>} return category tree that client could access
   */
  getCategories = async () => {
    const categories = await Category
      .find({ parentId: null })
      .populate({
        path: 'children',
        match: {
          _id: this.clientTypeService.getAccessibleCategoryIds(),
        },
      });
    return categories
      .filter(x => x.children && x.children.length)
      .map(x => x.toJSON());
  }

  /**
   * @returns {Promise<Object>} return category with children by category's id
   */

  getCategoryById = async (categoryId) => {
    const categories = await this.getCategories();
    for (const category of categories) {
      if (`${categoryId}` === `${category.id}`) {
        return category;
      }
      for (const subcategory of category.children) {
        if (`${categoryId}` === `${subcategory.id}`) {
          return subcategory;
        }
      }
    }
    return null;
  }

  /**
   * @returns {Promise<Array>} return array of subcategories
   */
  getSubcategoriesByParentId = async (categoryId) => {
    const parentCategory = await this.getCategoryById(categoryId);
    if (!parentCategory) return [];
    const subcategories = parentCategory.children || [];
    return subcategories;
  }

  /**
   * @returns {Promise<Array>} return array of subcategories'ids by parent category's id
   */
  getSubcategoryIdsByParentId = async (categoryId) => {
    const subcategories = await this.getSubcategoriesByParentId(categoryId);
    return subcategories.map(x => x.id);
  }
}
