const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Copy image assets from frontend/assets/ to backend/uploads/
  const frontendAssetsDir = path.join(__dirname, '../../frontend/assets');
  const backendUploadsDir = path.join(__dirname, '../uploads');

  if (!fs.existsSync(backendUploadsDir)) {
    fs.mkdirSync(backendUploadsDir, { recursive: true });
  }

  const assetsToCopy = [
    'gs_logo.jpg',
    'happy_store.webp',
    'product_img1.png',
    'product_img2.png',
    'product_img3.png',
    'product_img4.png',
    'product_img5.png',
    'product_img6.png',
    'product_img7.png',
    'product_img8.png',
    'product_img9.png',
    'product_img10.png',
    'product_img11.png',
    'product_img12.png',
  ];

  console.log('Copying image assets to uploads directory...');
  for (const filename of assetsToCopy) {
    const srcFile = path.join(frontendAssetsDir, filename);
    const destFile = path.join(backendUploadsDir, filename);

    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, destFile);
      console.log(`Copied ${filename}`);
    } else {
      console.warn(`Source asset not found: ${srcFile}`);
    }
  }

  // 2. Create Admin User
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('password123', salt);

  const adminEmail = 'admin@redragon.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Alok Singh',
        email: adminEmail,
        password: hashedPassword,
        image: '/uploads/gs_logo.jpg',
        role: 'admin',
      },
    });
    console.log('Created Admin User (admin@redragon.com / password123)');
  }

  // 3. Create Seller User & Store
  const sellerEmail = 'seller@redragon.com';
  let seller = await prisma.user.findUnique({ where: { email: sellerEmail } });
  if (!seller) {
    seller = await prisma.user.create({
      data: {
        name: 'Happy Seller',
        email: sellerEmail,
        password: hashedPassword,
        image: 'https://ui-avatars.com/api/?name=Happy+Seller',
        role: 'user',
      },
    });
    console.log('Created Seller User (seller@redragon.com / password123)');
  }

  let store = await prisma.store.findUnique({ where: { userId: seller.id } });
  if (!store) {
    store = await prisma.store.create({
      data: {
        userId: seller.id,
        name: 'Happy Shop',
        username: 'happyshop',
        description: "At Happy Shop, we believe shopping should be simple, smart, and satisfying. Whether you're hunting for the latest fashion trends, top-notch electronics, home essentials, or unique lifestyle products — we've got it all under one digital roof.",
        address: '3rd Floor, Happy Shop , New Building, 123 street , c sector , NY, US',
        email: 'happyshop@example.com',
        contact: '+0 1234567890',
        logo: '/uploads/happy_store.webp',
        status: 'approved',
        isActive: true,
      },
    });
    console.log('Created Store "Happy Shop"');
  }

  // 4. Create Demo Products
  const productsData = [
    {
      id: "prod_1",
      name: "Modern table lamp",
      description: "Modern table lamp with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty. Enhance your audio experience with this earbuds. Indulge yourself in a world of pure sound with 50 hours of uninterrupted playtime.",
      mrp: 40,
      price: 29,
      images: ["/uploads/product_img1.png", "/uploads/product_img2.png", "/uploads/product_img3.png", "/uploads/product_img4.png"],
      category: "Decoration",
      inStock: true,
    },
    {
      id: "prod_2",
      name: "Smart speaker gray",
      description: "Smart speaker with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 50,
      price: 29,
      images: ["/uploads/product_img2.png"],
      category: "Speakers",
      inStock: true,
    },
    {
      id: "prod_3",
      name: "Smart watch white",
      description: "Smart watch with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 60,
      price: 29,
      images: ["/uploads/product_img3.png"],
      category: "Watch",
      inStock: true,
    },
    {
      id: "prod_4",
      name: "Wireless headphones",
      description: "Wireless headphones with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 70,
      price: 29,
      images: ["/uploads/product_img4.png"],
      category: "Headphones",
      inStock: true,
    },
    {
      id: "prod_5",
      name: "Smart watch black",
      description: "Smart watch with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 49,
      price: 29,
      images: ["/uploads/product_img5.png"],
      category: "Watch",
      inStock: true,
    },
    {
      id: "prod_6",
      name: "Security Camera",
      description: "Security Camera with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 59,
      price: 29,
      images: ["/uploads/product_img6.png"],
      category: "Camera",
      inStock: true,
    },
    {
      id: "prod_7",
      name: "Smart Pen for iPad",
      description: "Smart Pen for iPad with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 89,
      price: 29,
      images: ["/uploads/product_img7.png"],
      category: "Pen",
      inStock: true,
    },
    {
      id: "prod_8",
      name: "Home Theater",
      description: "Home Theater with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 99,
      price: 29,
      images: ["/uploads/product_img8.png"],
      category: "Theater",
      inStock: true,
    },
    {
      id: "prod_9",
      name: "Apple Wireless Earbuds",
      description: "Apple Wireless Earbuds with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 89,
      price: 29,
      images: ["/uploads/product_img9.png"],
      category: "Earbuds",
      inStock: true,
    },
    {
      id: "prod_10",
      name: "Apple Smart Watch",
      description: "Apple Smart Watch with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 179,
      price: 29,
      images: ["/uploads/product_img10.png"],
      category: "Watch",
      inStock: true,
    },
    {
      id: "prod_11",
      name: "RGB Gaming Mouse",
      description: "RGB Gaming Mouse with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 39,
      price: 29,
      images: ["/uploads/product_img11.png"],
      category: "Mouse",
      inStock: true,
    },
    {
      id: "prod_12",
      name: "Smart Home Cleaner",
      description: "Smart Home Cleaner with a sleek design. It's perfect for any room. It's made of high-quality materials and comes with a lifetime warranty.",
      mrp: 199,
      price: 29,
      images: ["/uploads/product_img12.png"],
      category: "Cleaner",
      inStock: true,
    },
  ];

  console.log('Seeding products...');
  for (const prodData of productsData) {
    const existingProd = await prisma.product.findUnique({ where: { id: prodData.id } });
    if (!existingProd) {
      await prisma.product.create({
        data: {
          ...prodData,
          storeId: store.id,
        },
      });
      console.log(`Created product: ${prodData.name}`);
    }
  }

  // 5. Create basic coupons
  const couponsData = [
    { code: "NEW20", description: "20% Off for New Users", discount: 20, forNewUser: true, isPublic: true, expiresAt: new Date('2028-12-31') },
    { code: "RED10", description: "10% Off for All Users", discount: 10, forNewUser: false, isPublic: true, expiresAt: new Date('2028-12-31') },
  ];

  console.log('Seeding coupons...');
  for (const couponData of couponsData) {
    const existingCoupon = await prisma.coupon.findUnique({ where: { code: couponData.code } });
    if (!existingCoupon) {
      await prisma.coupon.create({
        data: couponData,
      });
      console.log(`Created coupon: ${couponData.code}`);
    }
  }

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
