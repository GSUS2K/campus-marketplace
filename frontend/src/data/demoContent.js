export const DEMO_PRODUCTS = [
  {
    _id: 'demo-book',
    title: 'Introduction to Algorithms',
    description: 'Clean, lightly used edition with a strong shelf life. Ideal for semester prep.',
    price: 1499,
    category: 'Books',
    condition: 'good',
    campusLocation: 'BH2',
    isVerifiedProduct: true,
    images: [
      'https://picsum.photos/seed/demo-book-a/1200/1500',
      'https://picsum.photos/seed/demo-book-b/1200/1500'
    ],
    seller: {
      _id: 'seller-1',
      name: 'Aarav Singh',
      trustScore: 92,
      isTrustedSeller: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
  },
  {
    _id: 'demo-headphones',
    title: 'Sony WH-1000XM5 Headphones',
    description: 'Bassy, balanced, and perfect for library sessions or travel.',
    price: 17999,
    category: 'Electronics',
    condition: 'like_new',
    campusLocation: 'GH4',
    isVerifiedProduct: true,
    images: [
      'https://picsum.photos/seed/demo-headphones-a/1200/1500',
      'https://picsum.photos/seed/demo-headphones-b/1200/1500'
    ],
    seller: {
      _id: 'seller-2',
      name: 'Diya Sharma',
      trustScore: 88,
      isTrustedSeller: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString()
  },
  {
    _id: 'demo-jacket',
    title: 'Vintage Denim Jacket',
    description: 'A well-faded piece with character. Great for campus evenings.',
    price: 2200,
    category: 'Apparel',
    condition: 'fair',
    campusLocation: 'BH7',
    isVerifiedProduct: false,
    images: [
      'https://picsum.photos/seed/demo-jacket-a/1200/1500',
      'https://picsum.photos/seed/demo-jacket-b/1200/1500'
    ],
    seller: {
      _id: 'seller-3',
      name: 'Kabir Mehta',
      trustScore: 61,
      isTrustedSeller: false
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
  },
  {
    _id: 'demo-lamp',
    title: 'Minimal Desk Lamp',
    description: 'Warm light, clean silhouette, and very little desk footprint.',
    price: 899,
    category: 'Miscellaneous',
    condition: 'new',
    campusLocation: 'Day Scholar',
    isVerifiedProduct: true,
    images: [
      'https://picsum.photos/seed/demo-lamp-a/1200/1500',
      'https://picsum.photos/seed/demo-lamp-b/1200/1500'
    ],
    seller: {
      _id: 'seller-4',
      name: 'Meera Iyer',
      trustScore: 95,
      isTrustedSeller: true
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString()
  }
];

export const DEMO_USER = {
  id: 'demo-user',
  name: 'Demo Curator',
  email: 'demo@lpu.in',
  role: 'seller',
  campusLocation: 'BH1',
  trustScore: 84,
  isTrustedSeller: true,
  status: 'verified'
};

export const DEMO_LISTINGS = [
  {
    ...DEMO_PRODUCTS[0],
    status: 'active'
  },
  {
    ...DEMO_PRODUCTS[2],
    status: 'active'
  }
];

export const DEMO_PENDING_PRODUCTS = [
  {
    ...DEMO_PRODUCTS[1],
    status: 'active',
    riskLevel: 'low'
  }
];

export const DEMO_ANALYTICS = {
  surgeLocations: [
    { name: 'BH1', demand: 42 },
    { name: 'GH4', demand: 28 },
    { name: 'Day Scholar', demand: 18 }
  ],
  trendingCategories: [
    { name: 'Electronics', volume: 1200 },
    { name: 'Books', volume: 980 },
    { name: 'Apparel', volume: 760 }
  ],
  activeConnections: 18
};

export const DEMO_CHAT = {
  chat: {
    _id: 'demo-chat-1',
    isIntermediaryActive: false,
    seller: DEMO_PRODUCTS[0].seller,
    product: DEMO_PRODUCTS[0]
  },
  messages: [
    {
      _id: 'm1',
      sender: { _id: DEMO_PRODUCTS[0].seller._id, name: DEMO_PRODUCTS[0].seller.name },
      content: 'Hey, the book is still available. Happy to meet after 4 pm.',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
    },
    {
      _id: 'm2',
      sender: { _id: DEMO_USER.id, name: DEMO_USER.name },
      content: 'Great. Is the condition as shown in the photos?',
      createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString()
    }
  ]
};
