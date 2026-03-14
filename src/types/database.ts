export interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Store {
  id: string;
  owner_id: string | null;
  name: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  rating: number;
  followers: number;
  products_count: number;
  location: string | null;
  since: number | null;
  positive_feedback: number;
  ship_on_time: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image: string | null;
  images: string[];
  rating: number;
  reviews: number;
  sold: number;
  shipping_price: number;
  free_shipping: boolean;
  is_choice: boolean;
  specifications: Record<string, string>;
  created_at: string;
  updated_at: string;
  store?: Store;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: ShippingAddress;
  payment_method: {
    type: string;
    last4?: string;
  };
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  product?: Product;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  images: string[];
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface StoreFollow {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  store_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  store?: Store;
}
