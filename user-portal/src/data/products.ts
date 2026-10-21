export interface Product {
  id: string;
  title: string;
  image: string;
  type: string;
  price?: number;
  profit?: number;
}

export { PRODUCT_CATALOG } from '../../../admin-portal/src/data/products';
export { TEMPLATE_M_1 } from '../../../admin-portal/src/pages/OrdersTasking';
