
import _ from 'lodash';
import ClientType from '../../models/clientType';

export default class ClientTypeService {
  static create = async (client) => {
    const clientTypeService = new ClientTypeService();
    if (!client) throw new Error('Client is required');
    await clientTypeService.init(client);
    return clientTypeService;
  }

  init = async (client) => {
    this.client = client;
    this.clientType = await ClientType.findById(client.clientTypeId);
  }

  /**
   * @returns {Array<String>} return array of accessible categories's id
   */
  getAccessibleCategoryIds = () => {
    const ids = _.get(this.clientType, 'categoryIds', []);
    return ids.map(x => `${x}`);
  }

  /**
   * @returns {Array<String>} return array of accessible categories's id
   */
  getCourseScopeIds = () => {
    const ids = _.get(this.clientType, 'courseScopeIds', []);
    return ids.map(x => `${x}`);
  }
}
