type RawType = {
  userType?: 'admin' | 'user';
};
type UserSeed = {
  userId: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  imageUrl?: string;
  raw?: RawType;
};

//user.entity.ts
export const users: UserSeed[] = [
  {
    userId: 'user_3GgVXzA444E22F8xL3Nf9mIafw8',
    firstName: 'Mizaur',
    lastName: 'Rahaman',
    email: 'md.mizan4392@gmail.com',
    imageUrl:
      'https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zR2dWWTZGSHVnbXVDVm00NUVQVXJLTEFtYzAifQ',
    raw: { userType: 'user' },
  },
  {
    userId: 'user_3HgAZxNO1Q4cCRR1uf1QGEHBv7T',
    firstName: 'MD ',
    lastName: 'Jakir',
    email: 'itsdream678@gmail.com',
    imageUrl:
      'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zR1J6ck5EZklEWk1idzRFaXMzZVVPcnlwNzYiLCJyaWQiOiJ1c2VyXzNIZ0FaeE5PMVE0Y0NSUjF1ZjFRR0VIQnY3VCJ9',
    raw: { userType: 'user' },
  },
  {
    userId: 'user_3HgfXUZeonYC1939RHH0DyCYIdm',
    firstName: 'MD ',
    lastName: 'gree',
    email: 'md.mizan3079@gmail.com',
    imageUrl:
      'https://img.clerk.com/eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zR1J6ck5EZklEWk1idzRFaXMzZVVPcnlwNzYiLCJyaWQiOiJ1c2VyXzNIZ2ZYVVplb25ZQzE5MzlSSEgwRHlDWUlkbSIsImluaXRpYWxzIjoiTUcifQ',
    raw: { userType: 'user' },
  },
];

type Category = {
  id: string;
  name: string;
  image: string;
  description: string;
};

//category.entity.ts
export const categories: Category[] = [
  {
    id: 'home',
    name: 'Home',
    image:
      'https://images.unsplash.com/photo-1505692794405-03f9b4f4d9d2?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=1',
    description: 'Furniture, decor, and everyday essentials for your home.',
  },
  {
    id: 'fashion',
    name: 'Fashion',
    image:
      'https://images.unsplash.com/photo-1520975698519-0f3c6f6cc1b9?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=2',
    description: 'Trendy clothing, accessories, and seasonal style picks.',
  },
  {
    id: 'outdoor',
    name: 'Outdoor',
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=3',
    description: 'Adventure gear, camping essentials, and outdoor living.',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    image:
      'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4',
    description: 'Coffee, kitchen staples, and charming cafe-inspired finds.',
  },
  {
    id: 'stationery',
    name: 'Stationery',
    image:
      'https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=5',
    description: 'Writing tools, planners, and creative studio essentials.',
  },
  {
    id: 'garden',
    name: 'Garden',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=6',
    description: 'Plants, pots, and gardening gear for every green thumb.',
  },
  {
    id: 'furniture',
    name: 'Furniture',
    image:
      'https://images.unsplash.com/photo-1505691723518-36a1fb0b1d8a?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7',
    description: 'Stylish furniture built for comfort and modern interiors.',
  },
  {
    id: 'gifts',
    name: 'Gifts',
    image:
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=8',
    description: 'Thoughtful gift ideas for birthdays, weddings, and more.',
  },
];

type ShopSeed = {
  id: string;
  image: string;
  name: string;
  location: string;
  category: string;
  rating: number;
  createdAt: string;
  description?: string;
};

//shop.entity.ts
export const shops: ShopSeed[] = [
  {
    id: '1',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&auto=format&fit=crop&q=80',
    name: 'Willow Home',
    location: 'San Francisco, CA',
    category: 'Home',
    rating: 4.7,
    createdAt: '2026-06-18T09:23:00Z',
  },
  {
    id: '2',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&auto=format&fit=crop&q=80',
    name: 'Gear & Co',
    location: 'Austin, TX',
    category: 'Outdoor',
    rating: 4.5,
    createdAt: '2026-06-12T13:45:00Z',
  },
  {
    id: '3',
    image:
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1400&auto=format&fit=crop&q=80',
    name: 'Urban Threads',
    location: 'New York, NY',
    category: 'Fashion',
    rating: 4.9,
    createdAt: '2026-05-27T16:20:00Z',
  },
  {
    id: '4',
    image:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1400&auto=format&fit=crop&q=80',
    name: 'Cafe Craft',
    location: 'Portland, OR',
    category: 'Cafe',
    rating: 4.6,
    createdAt: '2026-04-05T11:10:00Z',
  },
  {
    id: '5',
    image:
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1400&auto=format&fit=crop&q=80',
    name: 'Paper & Ink',
    location: 'Seattle, WA',
    category: 'Stationery',
    rating: 4.8,
    createdAt: '2026-03-18T14:55:00Z',
  },
  {
    id: '6',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&auto=format&fit=crop&q=80',
    name: 'The Green Shelf',
    location: 'Chicago, IL',
    category: 'Garden',
    rating: 4.4,
    createdAt: '2026-02-25T10:05:00Z',
  },
  {
    id: '7',
    image:
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&auto=format&fit=crop&q=80',
    name: 'North & Nest',
    location: 'Denver, CO',
    category: 'Home',
    rating: 4.6,
    createdAt: '2026-01-30T09:50:00Z',
  },
  {
    id: '8',
    image:
      'https://images.unsplash.com/photo-1513884923967-4b182ef167ab?w=1400&auto=format&fit=crop&q=80',
    name: 'Bright Goods',
    location: 'Los Angeles, CA',
    category: 'Gifts',
    rating: 4.7,
    createdAt: '2026-01-07T15:30:00Z',
  },
  {
    id: '9',
    image:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1400&auto=format&fit=crop&q=80',
    name: 'Foundry Furnishings',
    location: 'Boston, MA',
    category: 'Furniture',
    rating: 4.3,
    createdAt: '2025-12-21T12:15:00Z',
  },
  {
    id: '10',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1400&auto=format&fit=crop&q=80',
    name: 'Atlas Outfitters',
    location: 'Nashville, TN',
    category: 'Outdoor',
    rating: 4.5,
    createdAt: '2025-11-30T08:40:00Z',
  },
];

export type ProductSeed = {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  shopName?: string;
};
//product.entity.ts
export const products: ProductSeed[] = [
  {
    name: 'Apple iPhone 16 Pro',
    slug: 'apple-iphone-16-pro',
    description: 'Latest Apple smartphone with advanced camera system.',
    category: 'Electronics',
    price: 1299.99,
    stock: 25,
    imageUrl: 'https://picsum.photos/seed/iphone16pro/600/600',
  },
  {
    name: 'Samsung Galaxy S25 Ultra',
    slug: 'samsung-galaxy-s25-ultra',
    description: 'Premium Android smartphone with S Pen support.',
    category: 'Electronics',
    price: 1199.99,
    stock: 18,
    imageUrl: 'https://picsum.photos/seed/galaxys25/600/600',
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    slug: 'sony-wh1000xm5-headphones',
    description: 'Wireless noise-canceling over-ear headphones.',
    category: 'Electronics',
    price: 399.99,
    stock: 40,
    imageUrl: 'https://picsum.photos/seed/sonyheadphones/600/600',
  },
  {
    name: 'Dell XPS 15 Laptop',
    slug: 'dell-xps-15-laptop',
    description: 'High-performance laptop for professionals.',
    category: 'Computers',
    price: 1899.99,
    stock: 12,
    imageUrl: 'https://picsum.photos/seed/dellxps15/600/600',
  },
  {
    name: 'MacBook Air M4',
    slug: 'macbook-air-m4',
    description: 'Lightweight laptop powered by Apple M4 chip.',
    category: 'Computers',
    price: 1499.99,
    stock: 20,
    imageUrl: 'https://picsum.photos/seed/macbookairm4/600/600',
  },
  {
    name: 'Gaming Mechanical Keyboard',
    slug: 'gaming-mechanical-keyboard',
    description: 'RGB mechanical keyboard with blue switches.',
    category: 'Accessories',
    price: 99.99,
    stock: 60,
    imageUrl: 'https://picsum.photos/seed/keyboard/600/600',
  },
  {
    name: 'Wireless Gaming Mouse',
    slug: 'wireless-gaming-mouse',
    description: 'Ergonomic gaming mouse with adjustable DPI.',
    category: 'Accessories',
    price: 59.99,
    stock: 75,
    imageUrl: 'https://picsum.photos/seed/mouse/600/600',
  },
  {
    name: '4K Ultra HD Monitor',
    slug: '4k-ultra-hd-monitor',
    description: '27-inch IPS display with HDR support.',
    category: 'Computers',
    price: 449.99,
    stock: 22,
    imageUrl: 'https://picsum.photos/seed/monitor/600/600',
  },
  {
    name: 'Apple Watch Series 10',
    slug: 'apple-watch-series-10',
    description: 'Smartwatch with advanced health tracking.',
    category: 'Wearables',
    price: 499.99,
    stock: 35,
    imageUrl: 'https://picsum.photos/seed/applewatch10/600/600',
  },
  {
    name: 'Fitbit Charge 7',
    slug: 'fitbit-charge-7',
    description: 'Fitness tracker with heart rate monitoring.',
    category: 'Wearables',
    price: 179.99,
    stock: 45,
    imageUrl: 'https://picsum.photos/seed/fitbit7/600/600',
  },
  {
    name: 'Nike Air Max 270',
    slug: 'nike-air-max-270',
    description: 'Comfortable lifestyle sneakers.',
    category: 'Fashion',
    price: 149.99,
    stock: 55,
    imageUrl: 'https://picsum.photos/seed/nike270/600/600',
  },
  {
    name: 'Adidas Ultraboost 24',
    slug: 'adidas-ultraboost-24',
    description: 'Running shoes with responsive cushioning.',
    category: 'Fashion',
    price: 179.99,
    stock: 42,
    imageUrl: 'https://picsum.photos/seed/ultraboost24/600/600',
  },
  {
    name: "Levi's 511 Slim Jeans",
    slug: 'levis-511-slim-jeans',
    description: 'Classic slim-fit denim jeans.',
    category: 'Fashion',
    price: 79.99,
    stock: 70,
    imageUrl: 'https://picsum.photos/seed/levis511/600/600',
  },
  {
    name: 'Wooden Dining Chair',
    slug: 'wooden-dining-chair',
    description: 'Modern solid wood dining chair.',
    category: 'Furniture',
    price: 129.99,
    stock: 30,
    imageUrl: 'https://picsum.photos/seed/chair/600/600',
  },
  {
    name: 'Minimalist Coffee Table',
    slug: 'minimalist-coffee-table',
    description: 'Oak wood coffee table for living rooms.',
    category: 'Furniture',
    price: 249.99,
    stock: 15,
    imageUrl: 'https://picsum.photos/seed/coffeetable/600/600',
  },
  {
    name: 'LED Desk Lamp',
    slug: 'led-desk-lamp',
    description: 'Adjustable brightness with USB charging port.',
    category: 'Home',
    price: 39.99,
    stock: 80,
    imageUrl: 'https://picsum.photos/seed/desklamp/600/600',
  },
  {
    name: 'Stainless Steel Water Bottle',
    slug: 'stainless-steel-water-bottle',
    description: 'Vacuum insulated reusable water bottle.',
    category: 'Home',
    price: 24.99,
    stock: 120,
    imageUrl: 'https://picsum.photos/seed/waterbottle/600/600',
  },
  {
    name: 'Non-Stick Cookware Set',
    slug: 'non-stick-cookware-set',
    description: '10-piece non-stick cooking set.',
    category: 'Kitchen',
    price: 159.99,
    stock: 28,
    imageUrl: 'https://picsum.photos/seed/cookware/600/600',
  },
  {
    name: 'Espresso Coffee Machine',
    slug: 'espresso-coffee-machine',
    description: 'Automatic espresso maker for home use.',
    category: 'Kitchen',
    price: 349.99,
    stock: 14,
    imageUrl: 'https://picsum.photos/seed/espresso/600/600',
  },
  {
    name: 'Yoga Mat Pro',
    slug: 'yoga-mat-pro',
    description: 'Eco-friendly non-slip yoga mat.',
    category: 'Sports',
    price: 49.99,
    stock: 90,
    imageUrl: 'https://picsum.photos/seed/yogamat/600/600',
  },
  {
    name: 'Adjustable Dumbbell Set',
    slug: 'adjustable-dumbbell-set',
    description: 'Pair of adjustable dumbbells up to 25kg.',
    category: 'Sports',
    price: 299.99,
    stock: 16,
    imageUrl: 'https://picsum.photos/seed/dumbbells/600/600',
  },
  {
    name: 'Mountain Bike Helmet',
    slug: 'mountain-bike-helmet',
    description: 'Lightweight protective cycling helmet.',
    category: 'Sports',
    price: 69.99,
    stock: 50,
    imageUrl: 'https://picsum.photos/seed/helmet/600/600',
  },
  {
    name: 'Organic Green Tea',
    slug: 'organic-green-tea',
    description: 'Premium loose-leaf organic green tea.',
    category: 'Groceries',
    price: 14.99,
    stock: 200,
    imageUrl: 'https://picsum.photos/seed/greentea/600/600',
  },
  {
    name: 'Dark Chocolate Box',
    slug: 'dark-chocolate-box',
    description: 'Assorted premium dark chocolates.',
    category: 'Groceries',
    price: 19.99,
    stock: 110,
    imageUrl: 'https://picsum.photos/seed/chocolate/600/600',
  },
  {
    name: 'Leather Office Backpack',
    slug: 'leather-office-backpack',
    description: 'Premium leather backpack with laptop compartment.',
    category: 'Bags',
    price: 119.99,
    stock: 38,
    imageUrl: 'https://picsum.photos/seed/backpack/600/600',
  },
  {
    name: 'Travel Suitcase 24 Inch',
    slug: 'travel-suitcase-24-inch',
    description: 'Lightweight hard-shell luggage.',
    category: 'Travel',
    price: 139.99,
    stock: 32,
    imageUrl: 'https://picsum.photos/seed/suitcase/600/600',
  },
  {
    name: 'Wireless Bluetooth Speaker',
    slug: 'wireless-bluetooth-speaker',
    description: 'Portable waterproof Bluetooth speaker.',
    category: 'Electronics',
    price: 89.99,
    stock: 58,
    imageUrl: 'https://picsum.photos/seed/speaker/600/600',
  },
  {
    name: 'Smart Home Security Camera',
    slug: 'smart-home-security-camera',
    description: 'Wi-Fi security camera with night vision.',
    category: 'Smart Home',
    price: 79.99,
    stock: 46,
    imageUrl: 'https://picsum.photos/seed/securitycamera/600/600',
  },
  {
    name: 'Robot Vacuum Cleaner',
    slug: 'robot-vacuum-cleaner',
    description: 'Smart robotic vacuum with app control.',
    category: 'Home Appliances',
    price: 429.99,
    stock: 19,
    imageUrl: 'https://picsum.photos/seed/robotvacuum/600/600',
  },
  {
    name: 'Air Fryer XL',
    slug: 'air-fryer-xl',
    description: 'Large-capacity digital air fryer.',
    category: 'Kitchen',
    price: 169.99,
    stock: 27,
    imageUrl: 'https://picsum.photos/seed/airfryer/600/600',
  },
];
