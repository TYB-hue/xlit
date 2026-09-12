export type Product = {
  slug: string;
  images: string[];
  name: string;
  price: string;
  collection: string;
  stockMessage: string;
  colors: string[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  reviews: { name: string; text: string; stars: number }[];
  details: { title: string; content: string }[];
};

export const products: Product[] = [
  {
    slug: 'tshirt-1', 
    images: ['1.png', '1.png', '1.png', '1.png'], 
    name: 'Tshirt', 
    price: '1000 le', 
    collection: 'XLIT original',
    stockMessage: 'Low stock · selling fast',
    colors: ['Black', 'Washed black', 'Charcoal'],
     sizes: ['S', 'M', 'L', 'XL'], 
     rating: 4.9, reviewCount: 128,
    
    reviews: [{ name: 'Tariq', text: 'Highly satisfied. Will order again.', stars: 5 }, { name: 'Fatima', text: 'Love this product. The quality is excellent.', stars: 5 }, { name: 'Omar', text: 'Perfect fit and even better in person.', stars: 5 }, { name: 'Salma', text: 'The details are incredible. Highly recommended.', stars: 5 }],
    
    details: [{ title: 'Product details', content: 'Heavyweight cotton construction with a relaxed, everyday fit.' }, { title: 'Size chart', content: 'True to size. Choose one size up for an oversized fit.' }, { title: 'Washing instructions', content: 'Wash cold inside out. Hang dry to preserve the print.' }, { title: 'Delivery', content: 'Orders are prepared in 2–4 business days.' }],
  },
  {
    slug: 'tshirt-2', images: ['2.png', '2.png', '2.png', '2.png'], name: 'Tshirt', price: '1000 le', collection: 'XLIT original', stockMessage: 'Low stock · selling fast', colors: ['Black', 'Vintage black'], sizes: ['S', 'M', 'L', 'XL'], rating: 4.8, reviewCount: 96,
    reviews: [{ name: 'Amina', text: 'The print looks even better in person.', stars: 5 }, { name: 'Youssef', text: 'Great material and a perfect everyday fit.', stars: 5 }], details: [{ title: 'Product details', content: 'Soft, heavyweight cotton designed for daily wear.' }, { title: 'Size chart', content: 'True to size. Size up for an oversized fit.' }, { title: 'Washing instructions', content: 'Wash cold inside out and hang dry.' }, { title: 'Delivery', content: 'Orders are prepared in 2–4 business days.' }],
  },
  {
    slug: 'tshirt-3', images: ['3.png', '3.png', '3.png', '3.png'], name: 'Tshirt', price: '1000 le', collection: 'XLIT original', stockMessage: 'Low stock · selling fast', colors: ['Black', 'Charcoal'], sizes: ['S', 'M', 'L', 'XL'], rating: 4.9, reviewCount: 84,
    reviews: [{ name: 'Lina', text: 'Unique design and excellent quality.', stars: 5 }, { name: 'Hassan', text: 'Comfortable fit. I will get another one.', stars: 5 }], details: [{ title: 'Product details', content: 'Heavyweight cotton with a relaxed silhouette.' }, { title: 'Size chart', content: 'True to size. Size up for an oversized fit.' }, { title: 'Washing instructions', content: 'Wash cold inside out and hang dry.' }, { title: 'Delivery', content: 'Orders are prepared in 2–4 business days.' }],
  },
  {
    slug: 'tshirt-4', images: ['4.png', '4.1.png', ], 
    name: 'Tshirt', price: '1000 le', collection: 'XLIT original', stockMessage: 'Low stock · selling fast', colors: ['Off white'], 
    sizes: ['S', 'M', 'L', 'XL'], rating: 4.7, reviewCount: 67,
    reviews: [{ name: 'Nour', text: 'The color and graphic are exactly as expected.', stars: 5 }, { name: 'Adam', text: 'A standout piece with a very nice fit.', stars: 5 }], details: [{ title: 'Product details', content: 'A lightweight cotton piece with a relaxed fit.' }, { title: 'Size chart', content: 'True to size. Size up for an oversized fit.' }, { title: 'Washing instructions', content: 'Wash cold inside out and hang dry.' }, { title: 'Delivery', content: 'Orders are prepared in 2–4 business days.' }],
  },
  
];
