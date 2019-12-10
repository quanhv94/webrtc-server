
import Client from '../../models/client';

export default class ClientService {
  static create = async (partner) => {
    const clientService = new ClientService();
    if (!partner) throw new Error('Partner is required');
    await clientService.init(partner);
    return clientService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findAll = async () => {
    const clients = await Client.find({ partnerId: this.partner.id });
    return clients;
  }

  // eslint-disable-next-line arrow-body-style
  refresh = async () => {
    // TODO refresh partner's clients from IMS
    return this.getClients();
  }
}
