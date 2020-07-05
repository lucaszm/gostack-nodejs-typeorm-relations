import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    // const productIds = Array.from(products, p => p.id);
    /* const productsFound = await this.ormRepository.find({
      where: {
        id: In(productIds),
      },
    }); */

    const productsFound = await this.ormRepository.findByIds(products);

    return productsFound;
  }

  public async updateQuantity(
    productsQuantities: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    /* const products: Product[] = [];

    const updates = productsQuantities.map(async (productQuantity, _) => {
      const product = await this.ormRepository.findOne(productQuantity.id);
      if (product) {
        product.quantity = productQuantity.quantity;
        this.ormRepository.save(product);
        products.push(product);
      }
    });

    await Promise.all(updates);

    return products; */

    const products = await this.ormRepository.save(productsQuantities);

    return products;
  }
}

export default ProductsRepository;
