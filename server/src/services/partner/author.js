
import Author from '../../models/author';

export default class AuthorService {
  static create = async (partner) => {
    const clientService = new AuthorService();
    if (!partner) throw new Error('Partner is required');
    await clientService.init(partner);
    return clientService;
  }

  init = async (partner) => {
    this.partner = partner;
  }

  findAll = async () => {
    const authors = await Author.find({ partnerId: this.partner.id });
    return authors;
  }

  create = async ({ name }) => {
    const author = await Author.create({ name, partnerId: this.partner.id });
    return author;
  }
}
