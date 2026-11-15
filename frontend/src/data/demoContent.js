const hoursAgo = (hours) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const sellers = {
  aarav: { _id: 'seller-aarav', name: 'Aarav Singh', trustScore: 94, isTrustedSeller: true },
  diya: { _id: 'seller-diya', name: 'Diya Sharma', trustScore: 91, isTrustedSeller: true },
  anaya: { _id: 'seller-anaya', name: 'Anaya Kapoor', trustScore: 86, isTrustedSeller: true },
  kabir: { _id: 'seller-kabir', name: 'Kabir Mehta', trustScore: 78, isTrustedSeller: false }
};

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;
const listing = (id, title, price, category, condition, campusLocation, seller, image, hours, description) => ({ _id: id, title, price, category, condition, campusLocation, seller, images: [img(image)], isVerifiedProduct: true, status: 'active', createdAt: hoursAgo(hours), description });

export const DEMO_PRODUCTS = [
  listing('demo-calculus', 'Engineering Mathematics: Semester 1 Set', 580, 'Books', 'good', 'BH1', sellers.aarav, 'photo-1543002588-bfa74002ed7e', 2, 'Three annotated engineering mathematics books with clean binding and handwritten shortcut notes.'),
  listing('demo-dsa', 'DSA Notes + LeetCode Practice Binder', 420, 'Books', 'like_new', 'Day Scholar', sellers.diya, 'photo-1495446815901-a7297e633e8d', 6, 'Printed notes, solved examples, and a labelled practice binder for placement preparation.'),
  listing('demo-kindle', 'Kindle Paperwhite 11th Gen', 8200, 'Electronics', 'like_new', 'GH3', sellers.anaya, 'photo-1592496001020-d31bd830651b', 4, 'Includes cable and case. No scratches on the screen. Battery lasts multiple days.'),
  listing('demo-casio', 'Casio FX-991CW Scientific Calculator', 1050, 'Electronics', 'good', 'BH4', sellers.aarav, 'photo-1587145820266-a31f14ce1ada', 9, 'Allowed scientific calculator, fully working, with cover and fresh battery.'),
  listing('demo-headphones', 'Sony WH-1000XM5 Headphones', 16900, 'Electronics', 'like_new', 'GH4', sellers.diya, 'photo-1505740420928-5e560c06d30e', 12, 'Active noise cancellation, case, cable, and proof of purchase included.'),
  listing('demo-keyboard', 'Keychron K2 Wireless Keyboard', 4300, 'Electronics', 'good', 'BH7', sellers.kabir, 'photo-1587829741301-dc798b83add3', 18, 'Hot-swappable keyboard with brown switches. Tested for every key.'),
  listing('demo-cycle', 'Campus Bicycle: Single Speed', 3200, 'Miscellaneous', 'good', 'BH2', sellers.aarav, 'photo-1485965120184-e220f721d03e', 3, 'Recently serviced. Good for short campus commutes. Meet near BH2 cycle stand.'),
  listing('demo-lamp', 'Adjustable LED Study Lamp', 650, 'Miscellaneous', 'new', 'Day Scholar', sellers.anaya, 'photo-1507473885765-e6ed057f782c', 20, 'Three color modes and touch controls. Box opened only for photos.'),
  listing('demo-calculator', 'Graphing Calculator TI-84 Plus', 3900, 'Electronics', 'good', 'Staff Residence', sellers.diya, 'photo-1560785496-3c9d27877182', 26, 'Fully working calculator with protective sleeve. Suitable for elective math courses.'),
  listing('demo-jacket', 'Oversized Denim Jacket', 1100, 'Apparel', 'good', 'GH1', sellers.anaya, 'photo-1543076447-215ad9ba6923', 8, 'Washed denim jacket, size M-L fit. No stains or tears.'),
  listing('demo-hoodie', 'LPU Winter Hoodie', 480, 'Apparel', 'good', 'BH9', sellers.kabir, 'photo-1556821840-3a63f95609a7', 31, 'Comfortable black hoodie, size L. Freshly washed and ready to use.'),
  listing('demo-bag', 'Anti-theft Laptop Backpack', 900, 'Miscellaneous', 'like_new', 'GH5', sellers.diya, 'photo-1553062407-98eeb64c6a62', 14, 'Fits a 15 inch laptop, has bottle pockets and a rain cover.'),
  listing('demo-monitor', '24-inch Full HD Monitor', 6400, 'Electronics', 'good', 'BH6', sellers.aarav, 'photo-1527443224154-c4a3942d3acf', 36, 'HDMI monitor for coding, design, or gaming. Stand and power cable included.'),
  listing('demo-coat', 'Formal Blazer: Navy Blue', 1450, 'Apparel', 'like_new', 'Day Scholar', sellers.anaya, 'photo-1591047139829-d91aecb6caea', 24, 'Worn once for a presentation. Fits a medium build. Dry-cleaned.'),
  listing('demo-mug', 'Insulated Coffee Tumbler', 350, 'Miscellaneous', 'new', 'BH10', sellers.kabir, 'photo-1514228742587-6b1558fcca3d', 42, 'Leak-proof tumbler for long library days. Unused, with box.'),
  listing('demo-architecture', 'Architecture Drawing Kit', 780, 'Books', 'good', 'GH2', sellers.diya, 'photo-1513364776144-60967b0f800f', 16, 'Scale ruler, pencils, templates, and drawing sheets for first-year work.')
];

export const DEMO_USER = { id: 'demo-user', name: 'Demo Curator', email: 'demo@lpu.in', role: 'seller', campusLocation: 'BH1', trustScore: 84, isTrustedSeller: true, status: 'verified' };
export const DEMO_LISTINGS = DEMO_PRODUCTS.slice(0, 4);
export const DEMO_PENDING_PRODUCTS = [{ ...DEMO_PRODUCTS[5], _id: 'demo-pending-keyboard', status: 'pending_review', isVerifiedProduct: false, riskLevel: 'medium' }];
export const DEMO_ANALYTICS = { surgeLocations: [{ name: 'BH1', demand: 42 }, { name: 'GH4', demand: 28 }, { name: 'Day Scholar', demand: 18 }], trendingCategories: [{ name: 'Electronics', volume: 1200 }, { name: 'Books', volume: 980 }, { name: 'Apparel', volume: 760 }], activeConnections: 18 };
export const DEMO_CHAT = { chat: { _id: 'demo-chat-1', isIntermediaryActive: false, seller: DEMO_PRODUCTS[0].seller, product: DEMO_PRODUCTS[0] }, messages: [{ _id: 'm1', sender: { _id: DEMO_PRODUCTS[0].seller._id, name: DEMO_PRODUCTS[0].seller.name }, content: 'Hey, the notes are still available. Happy to meet after 4 pm.', createdAt: hoursAgo(1) }, { _id: 'm2', sender: { _id: DEMO_USER.id, name: DEMO_USER.name }, content: 'Great. Is the condition as shown in the photos?', createdAt: hoursAgo(0.5) }] };
