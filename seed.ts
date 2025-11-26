import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper: Generate random rating (3–5)
const randomRating = () => Math.floor(Math.random() * 3) + 3;

// Helper: Clean image URLs
const cleanUrl = (url: string) => url.trim();

async function main() {
  console.log('🌱 Memulai seeding...\n');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ==================== USERS ====================
  console.log('👥 Membuat users...');

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john@example.com' },
      update: {},
      create: {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        phone: '081234567890',
        avatar: cleanUrl('https://i.pravatar.cc/150?img=1'),
        notificationsEnabled: true,
        darkModeEnabled: false,
        autoPlayVideos: true,
        language: 'id',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane@example.com' },
      update: {},
      create: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        phone: '081234567891',
        avatar: cleanUrl('https://i.pravatar.cc/150?img=2'),
        notificationsEnabled: false,
        darkModeEnabled: true,
        autoPlayVideos: false,
        language: 'en',
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        password: hashedPassword,
        phone: '081234567892',
        avatar: cleanUrl('https://i.pravatar.cc/150?img=3'),
        notificationsEnabled: true,
        darkModeEnabled: false,
        autoPlayVideos: true,
        language: 'id',
      },
    }),
    prisma.user.upsert({
      where: { email: 'dewi@lokal.id' },
      update: {},
      create: {
        name: 'Dewi Lestari',
        email: 'dewi@lokal.id',
        password: hashedPassword,
        phone: '081234567893',
        avatar: cleanUrl('https://i.pravatar.cc/150?img=8'),
        notificationsEnabled: true,
        darkModeEnabled: true,
        autoPlayVideos: false,
        language: 'id',
      },
    }),
  ]);

  console.log(`✅ Berhasil membuat ${users.length} users\n`);

  // ==================== RECIPES ====================
  console.log('🍳 Membuat recipes dengan kategori lengkap...');

  const recipesData = [
    // --- BREAKFAST ---
    {
      title: 'Avocado Toast',
      description: 'Simple and healthy avocado toast perfect for breakfast',
      mainImage:
        'https://images.pexels.com/photos/704569/pexels-photo-704569.jpeg',
      difficulty: 'Mudah',
      category: 'Breakfast',
      prepTime: 15,
      cookTime: 10,
      servings: 2,
      userId: users[0].id,
      ingredients: [
        { name: 'Avocado', quantity: 0.5, unit: 'piece' },
        { name: 'Lemon juice', quantity: 0.5, unit: 'tsp' },
        { name: 'Salt', quantity: 1, unit: 'pinch' },
        { name: 'Black pepper', quantity: 1, unit: 'pinch' },
        { name: 'Sourdough bread', quantity: 1, unit: 'slice' },
      ],
      steps: [
        'Mash avocado with lemon juice, salt, and pepper.',
        'Toast bread until golden.',
        'Spread avocado mixture on toast.',
        'Drizzle with olive oil and serve.',
      ],
    },
    {
      title: 'Nasi Goreng Kampung',
      description: 'Classic Indonesian fried rice with egg and sweet soy sauce',
      mainImage: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52',
      difficulty: 'Mudah',
      category: 'Breakfast',
      prepTime: 10,
      cookTime: 15,
      servings: 2,
      userId: users[3].id,
      ingredients: [
        { name: 'Cooked rice', quantity: 2, unit: 'cups' },
        { name: 'Egg', quantity: 1, unit: 'piece' },
        { name: 'Shallot', quantity: 2, unit: 'cloves' },
        { name: 'Garlic', quantity: 1, unit: 'clove' },
        { name: 'Sweet soy sauce (kecap manis)', quantity: 1, unit: 'tbsp' },
        { name: 'Vegetables', quantity: 0.5, unit: 'cup' },
      ],
      steps: [
        'Sauté shallot and garlic until fragrant.',
        'Add beaten egg, scramble quickly.',
        'Add rice and stir well.',
        'Pour kecap manis, mix until evenly coated.',
        'Garnish with fried shallot and cucumber.',
      ],
    },

    // --- LUNCH ---
    {
      title: 'Mediterranean Tostadas',
      description: 'Fresh and healthy Mediterranean style tostadas',
      mainImage: 'https://images.unsplash.com/photo-1619019187992-b2569e321752',
      difficulty: 'Sedang',
      category: 'Lunch',
      prepTime: 15,
      cookTime: 10,
      servings: 2,
      userId: users[0].id,
      ingredients: [
        { name: 'Cucumber', quantity: 1.5, unit: 'cups' },
        { name: 'Cherry tomatoes', quantity: 1, unit: 'cup' },
        { name: 'Green olives', quantity: 0.5, unit: 'cup' },
        { name: 'Shallot', quantity: 0.25, unit: 'cup' },
        { name: 'Parsley', quantity: 0.25, unit: 'cup' },
        { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
        { name: 'Tortillas', quantity: 4, unit: 'pieces' },
        { name: 'Hummus', quantity: 0.5, unit: 'cup' },
      ],
      steps: [
        'Mix cucumber, tomatoes, olives, shallot, and parsley.',
        'Whisk olive oil with lemon juice, pour over salad.',
        'Spread hummus on toasted tortillas.',
        'Top with salad mixture and serve.',
      ],
    },
    {
      title: 'Soto Ayam',
      description:
        'Traditional Indonesian chicken soup with turmeric and herbs',
      mainImage: 'https://images.unsplash.com/photo-1626082927389-6c8a4a0b5f8e',
      difficulty: 'Sedang',
      category: 'Lunch',
      prepTime: 20,
      cookTime: 40,
      servings: 4,
      userId: users[3].id,
      ingredients: [
        { name: 'Chicken thighs', quantity: 500, unit: 'gram' },
        { name: 'Turmeric', quantity: 1, unit: 'tbsp' },
        { name: 'Lemongrass', quantity: 2, unit: 'stalks' },
        { name: 'Galangal', quantity: 2, unit: 'slices' },
        { name: 'Rice noodles', quantity: 100, unit: 'gram' },
        { name: 'Lime', quantity: 1, unit: 'piece' },
      ],
      steps: [
        'Boil chicken with turmeric, lemongrass, and galangal.',
        'Shred cooked chicken.',
        'Serve broth over rice noodles.',
        'Top with chicken, fried shallots, and lime.',
      ],
    },

    // --- DINNER ---
    {
      title: 'Garlic Butter Salmon',
      description: 'Pan-seared salmon with garlic butter sauce',
      mainImage: 'https://images.unsplash.com/photo-1584913855963-e0b0229af61d',
      difficulty: 'Sulit',
      category: 'Dinner',
      prepTime: 5,
      cookTime: 10,
      servings: 3,
      userId: users[0].id,
      ingredients: [
        { name: 'Salmon fillet', quantity: 1, unit: 'pound' },
        { name: 'Asparagus', quantity: 1, unit: 'bunch' },
        { name: 'Butter', quantity: 1, unit: 'tbsp' },
        { name: 'Olive oil', quantity: 1, unit: 'tbsp' },
        { name: 'Garlic', quantity: 2, unit: 'cloves' },
        { name: 'Lemon juice', quantity: 0.5, unit: 'lemon' },
      ],
      steps: [
        'Heat butter and olive oil in a pan.',
        'Sear salmon skin-side down for 4 minutes.',
        'Flip, add asparagus, cook 3 more minutes.',
        'Add minced garlic and lemon juice, serve hot.',
      ],
    },

    // --- SNACK ---
    {
      title: 'Martabak Manis Mini',
      description: 'Sweet Indonesian pancake with chocolate and cheese',
      mainImage: 'https://images.unsplash.com/photo-1631515231063-5e3a9e7d3f8a',
      difficulty: 'Sedang',
      category: 'Snack',
      prepTime: 30,
      cookTime: 20,
      servings: 6,
      userId: users[3].id,
      ingredients: [
        { name: 'All-purpose flour', quantity: 200, unit: 'gram' },
        { name: 'Sugar', quantity: 2, unit: 'tbsp' },
        { name: 'Instant yeast', quantity: 1, unit: 'tsp' },
        { name: 'Chocolate sprinkles', quantity: 50, unit: 'gram' },
        { name: 'Grated cheese', quantity: 30, unit: 'gram' },
      ],
      steps: [
        'Mix flour, sugar, yeast, and water into batter.',
        'Let rest until bubbly (30 mins).',
        'Pour into oiled pan, cook until golden.',
        'Sprinkle chocolate and cheese, fold, serve warm.',
      ],
    },

    // --- DESSERT ---
    {
      title: 'Chocolate Mousse',
      description: 'Rich and creamy chocolate mousse',
      mainImage:
        'https://images.pexels.com/photos/1707920/pexels-photo-1707920.jpeg',
      difficulty: 'Mudah',
      category: 'Dessert',
      prepTime: 20,
      cookTime: 0,
      servings: 2,
      userId: users[0].id,
      ingredients: [
        { name: 'Dark chocolate', quantity: 100, unit: 'gram' },
        { name: 'Egg yolks', quantity: 2, unit: 'pieces' },
        { name: 'Heavy cream', quantity: 200, unit: 'ml' },
        { name: 'Sugar', quantity: 1, unit: 'tbsp' },
      ],
      steps: [
        'Melt chocolate over double boiler.',
        'Whisk in egg yolks, cook 2 minutes.',
        'Whip cream with sugar to soft peaks.',
        'Fold cream into chocolate, chill 2 hours.',
      ],
    },

    // --- BEVERAGE ---
    {
      title: 'Es Teh Tarik',
      description: 'Iced pulled tea with creamy texture',
      mainImage: 'https://images.unsplash.com/photo-1600857202899-8b5e7d7e7e9a',
      difficulty: 'Mudah',
      category: 'Beverage',
      prepTime: 5,
      cookTime: 5,
      servings: 2,
      userId: users[3].id,
      ingredients: [
        { name: 'Black tea', quantity: 2, unit: 'tbsp' },
        { name: 'Condensed milk', quantity: 2, unit: 'tbsp' },
        { name: 'Evaporated milk', quantity: 1, unit: 'tbsp' },
        { name: 'Ice cubes', quantity: 1, unit: 'cup' },
      ],
      steps: [
        'Brew strong black tea, let cool.',
        'Add condensed and evaporated milk.',
        'Pour between two glasses from height to "pull".',
        'Serve over ice.',
      ],
    },
  ];

  // Buat semua resep
  for (const recipe of recipesData) {
    await prisma.recipe.create({
      data: {
        title: recipe.title,
        description: recipe.description,
        mainImage: cleanUrl(recipe.mainImage), // ← UBAH dari 'image' ke 'mainImage'
        difficulty: recipe.difficulty, // ← TAMBAHKAN field difficulty
        category: recipe.category,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        isPublic: true,
        userId: recipe.userId,
        ingredients: {
          create: recipe.ingredients.map((ing, index) => ({
            name: ing.name,
            quantity: ing.quantity,
            unit: ing.unit,
            order: index, // ← TAMBAHKAN order untuk ingredients
          })),
        },
        steps: {
          create: recipe.steps.map((desc, i) => ({
            stepNumber: i + 1,
            description: desc,
          })),
        },
      },
    });
  }

  console.log(`✅ Berhasil membuat ${recipesData.length} recipes\n`);

  // ==================== FAVORITES & REVIEWS ====================
  console.log('❤️⭐ Membuat favorites dan reviews...');

  const allRecipes = await prisma.recipe.findMany();
  if (allRecipes.length === 0) {
    throw new Error('Tidak ada resep ditemukan untuk favorite/review!');
  }

  // Buat favorites acak
  const favoriteData: Array<{ userId: number; recipeId: number }> = [];
  const reviewData: Array<{
    userId: number;
    recipeId: number;
    rating: number;
    comment: string;
  }> = [];

  // Contoh: John favorit 3 resep pertama
  for (let i = 0; i < Math.min(3, allRecipes.length); i++) {
    favoriteData.push({
      userId: users[0].id,
      recipeId: allRecipes[i].id,
    });
  }

  // Contoh: Jane favorit 2 resep terakhir
  for (let i = Math.max(0, allRecipes.length - 2); i < allRecipes.length; i++) {
    favoriteData.push({
      userId: users[1].id,
      recipeId: allRecipes[i].id,
    });
  }

  // Contoh reviews
  for (let i = 0; i < Math.min(5, allRecipes.length); i++) {
    reviewData.push({
      userId: users[i % users.length].id,
      recipeId: allRecipes[i].id,
      rating: randomRating(),
      comment: `Great recipe! Really enjoyed making this.`,
    });
  }

  await prisma.favorite.createMany({
    data: favoriteData,
    skipDuplicates: true,
  });
  await prisma.review.createMany({
    data: reviewData,
    skipDuplicates: true,
  });

  console.log(`✅ Berhasil membuat ${favoriteData.length} favorites`);
  console.log(`✅ Berhasil membuat ${reviewData.length} reviews\n`);

  // ==================== SUMMARY ====================
  const counts = {
    users: await prisma.user.count(),
    recipes: await prisma.recipe.count(),
    favorites: await prisma.favorite.count(),
    reviews: await prisma.review.count(),
  };

  const categories = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack',
    'Dessert',
    'Beverage',
  ];
  const categoryCounts = await Promise.all(
    categories.map((cat) =>
      prisma.recipe
        .count({ where: { category: cat } })
        .then((c) => ({ cat, c })),
    ),
  );

  console.log('📊 SUMMARY SEEDING:');
  console.log('='.repeat(50));
  console.log(`👥 Users: ${counts.users}`);
  console.log(`🍳 Recipes: ${counts.recipes}`);
  categoryCounts.forEach(({ cat, c }) => console.log(`   - ${cat}: ${c}`));
  console.log(`❤️ Favorites: ${counts.favorites}`);
  console.log(`⭐ Reviews: ${counts.reviews}`);
  console.log('='.repeat(50));
  console.log('\n✨ Seeding selesai!\n');

  console.log('📝 Info Login:');
  users.forEach((u) => {
    console.log(`Email: ${u.email} | Password: password123`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
