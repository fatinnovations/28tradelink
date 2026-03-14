export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating: number;
  reviews: number;
  sold: number;
  shipping: string;
  shippingPrice?: number;
  freeShipping: boolean;
  store: string;
  storeRating: number;
  category: string;
  tags?: string[];
  isChoice?: boolean;
  isFlashDeal?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  items?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface Store {
  id: string;
  name: string;
  rating: number;
  followers: number;
  products: number;
  positiveRating: number;
  description?: string;
  established?: string;
  location?: string;
  responseTime?: string;
  shipOnTime?: number;
  banner?: string;
  avatar?: string;
  categories?: string[];
}
