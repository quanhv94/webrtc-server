
import ClientType from '../../models/clientType';
import Client from '../../models/client';
import CategoryService from './category';

export default class ClientTypeService {
  static create = async (partner) => {
    const clientTypeService = new ClientTypeService();
    if (!partner) throw new Error('Partner is required');
    await clientTypeService.init(partner);
    return clientTypeService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findAll = async () => {
    const clientTypes = await ClientType.find({ partnerId: this.partner.id })
      .populate('clients')
      .populate({
        path: 'categories',
        populate: 'parent',
      })
      .populate('courseScopes')
      .sort('-createdAt');
    return clientTypes;
  }

  findById = async (clientTypeId) => {
    const clientType = await ClientType.findById(clientTypeId)
      .populate('clients')
      .populate({
        path: 'categories',
        populate: 'parent',
      })
      .populate('courseScopes');
    return clientType;
  }

  create = async ({ name, description, courseScopeIds, categoryIds }) => {
    const clientType = await ClientType.create({
      partnerId: this.partner.id,
      name,
      description,
      courseScopeIds,
      categoryIds: await CategoryService.normalizeSubcategoryOnly(categoryIds),
    });
    return this.findById(clientType.id);
  }

  update = async ({ id, name, description, courseScopeIds, categoryIds }) => {
    await ClientType.updateOne({
      _id: id,
      partnerId: this.partner._id,
    }, {
      name,
      description,
      courseScopeIds,
      categoryIds: await CategoryService.normalizeSubcategoryOnly(categoryIds),
    });
    return this.findById(id);
  }

  updateClients = async ({ clientTypeId, clientIds }) => {
    await Client.updateMany({
      clientTypeId,
      partnerId: this.partner._id,
    }, {
      clientTypeId: null,
    });
    await Client.updateMany({
      _id: clientIds,
      partnerId: this.partner._id,
    }, {
      clientTypeId,
    });
    return this.findById(clientTypeId);
  }

  delete = async (id) => {
    await Client.updateMany({
      clientTypeId: id,
      partnerId: this.partner._id,
    }, {
      clientTypeId: null,
    });
    await ClientType.deleteOne({ _id: id, partnerId: this.partner.id });
    return true;
  }
}
