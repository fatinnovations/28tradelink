import { Category } from "@/types/product";

export const categories: Category[] = [
  {
    id: "1",
    name: "Women's Fashion",
    icon: "👗",
    subcategories: [
      { id: "1-1", name: "Dresses", items: ["Casual Dresses", "Party Dresses", "Maxi Dresses"] },
      { id: "1-2", name: "Tops & Blouses", items: ["T-Shirts", "Blouses", "Tank Tops"] },
      { id: "1-3", name: "Bottoms", items: ["Jeans", "Skirts", "Shorts"] },
    ],
  },
  {
    id: "2",
    name: "Men's Fashion",
    icon: "👔",
    subcategories: [
      { id: "2-1", name: "Shirts", items: ["Casual Shirts", "Formal Shirts", "Polo Shirts"] },
      { id: "2-2", name: "Pants", items: ["Jeans", "Chinos", "Shorts"] },
      { id: "2-3", name: "Suits", items: ["Business Suits", "Casual Blazers"] },
    ],
  },
  {
    id: "3",
    name: "Phones & Telecommunications",
    icon: "📱",
    subcategories: [
      { id: "3-1", name: "Mobile Phones", items: ["Smartphones", "Feature Phones"] },
      { id: "3-2", name: "Accessories", items: ["Cases", "Screen Protectors", "Chargers"] },
    ],
  },
  {
    id: "4",
    name: "Computer & Office",
    icon: "💻",
    subcategories: [
      { id: "4-1", name: "Laptops", items: ["Gaming Laptops", "Business Laptops"] },
      { id: "4-2", name: "Tablets", items: ["Android Tablets", "Windows Tablets"] },
    ],
  },
  {
    id: "5",
    name: "Consumer Electronics",
    icon: "🎧",
    subcategories: [
      { id: "5-1", name: "Headphones", items: ["Wireless", "Wired", "Gaming"] },
      { id: "5-2", name: "Speakers", items: ["Bluetooth Speakers", "Smart Speakers"] },
    ],
  },
  {
    id: "6",
    name: "Jewelry & Watches",
    icon: "💎",
    subcategories: [
      { id: "6-1", name: "Necklaces", items: ["Pendants", "Chains", "Chokers"] },
      { id: "6-2", name: "Watches", items: ["Smart Watches", "Analog Watches"] },
    ],
  },
  {
    id: "7",
    name: "Home & Garden",
    icon: "🏠",
    subcategories: [
      { id: "7-1", name: "Home Decor", items: ["Wall Art", "Vases", "Lighting"] },
      { id: "7-2", name: "Kitchen", items: ["Cookware", "Storage", "Utensils"] },
    ],
  },
  {
    id: "8",
    name: "Bags & Shoes",
    icon: "👜",
    subcategories: [
      { id: "8-1", name: "Women's Bags", items: ["Handbags", "Shoulder Bags", "Clutches"] },
      { id: "8-2", name: "Men's Shoes", items: ["Sneakers", "Loafers", "Boots"] },
    ],
  },
  {
    id: "9",
    name: "Toys & Games",
    icon: "🎮",
    subcategories: [
      { id: "9-1", name: "Action Figures", items: ["Anime Figures", "Movie Characters"] },
      { id: "9-2", name: "Board Games", items: ["Strategy Games", "Party Games"] },
    ],
  },
  {
    id: "10",
    name: "Sports & Outdoors",
    icon: "⚽",
    subcategories: [
      { id: "10-1", name: "Fitness", items: ["Gym Equipment", "Yoga", "Running"] },
      { id: "10-2", name: "Outdoor", items: ["Camping", "Hiking", "Cycling"] },
    ],
  },
  {
    id: "11",
    name: "Beauty & Health",
    icon: "💄",
    subcategories: [
      { id: "11-1", name: "Makeup", items: ["Lipstick", "Foundation", "Eyeshadow"] },
      { id: "11-2", name: "Skincare", items: ["Moisturizers", "Serums", "Masks"] },
    ],
  },
  {
    id: "12",
    name: "Automobiles & Motorcycles",
    icon: "🚗",
    subcategories: [
      { id: "12-1", name: "Car Accessories", items: ["Interior", "Exterior", "Electronics"] },
      { id: "12-2", name: "Motorcycle Parts", items: ["Helmets", "Gloves", "Jackets"] },
    ],
  },
];
