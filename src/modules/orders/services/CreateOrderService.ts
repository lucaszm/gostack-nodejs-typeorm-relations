import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import { IProduct as IProductOrder } from '@modules/orders/dtos/ICreateOrderDTO';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsIds = products.map(product => ({ id: product.id }));

    const productsFound = await this.productsRepository.findAllById(
      productsIds,
    );

    if (productsFound.length !== productsIds.length) {
      throw new AppError("One or more products couldn't be found");
    }

    const productQuantities: IUpdateProductsQuantityDTO[] = [];
    const orderProducts: IProductOrder[] = [];

    productsFound.forEach(product => {
      const orderProduct = products.find(p => p.id === product.id);

      if (orderProduct) {
        if (product.quantity < orderProduct.quantity) {
          throw new AppError(
            `There isn't enough stock for the product ${product.name} (in stock: ${orderProduct?.quantity})`,
          );
        }

        productQuantities.push({
          id: orderProduct.id,
          quantity: product.quantity - orderProduct.quantity,
        });

        orderProducts.push({
          price: product.price,
          product_id: product.id,
          quantity: orderProduct.quantity,
        });
      }
    });

    await this.productsRepository.updateQuantity(productQuantities);

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;
