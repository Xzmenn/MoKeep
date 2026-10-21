import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding FinKaya database...");

  // Clean existing demo data
  const existingUser = await prisma.user.findUnique({
    where: { email: "demo@finkaya.id" },
  });

  if (existingUser) {
    console.log("Cleaning old demo user data...");
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  // 1. Create Demo User
  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: {
      name: "Hayqal Pratama",
      email: "demo@finkaya.id",
      password: hashedPassword,
      currency: "IDR",
      setting: {
        create: {
          theme: "system",
          language: "id",
          currency: "IDR",
          dateFormat: "dd/MM/yyyy",
          emailNotifications: true,
          budgetAlerts: true,
        },
      },
    },
  });

  console.log(`User created: ${user.name} (${user.email})`);

  // 2. Create Accounts
  const accountBca = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Bank BCA Utama",
      type: "BANK",
      balance: 15450000,
      currentBalance: 15450000,
      accountNumber: "8830192831",
      color: "#1e40af",
      icon: "Landmark",
    },
  });

  const accountCash = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Dompet Tunai",
      type: "CASH",
      balance: 850000,
      currentBalance: 850000,
      color: "#15803d",
      icon: "Wallet",
    },
  });

  const accountGopay = await prisma.account.create({
    data: {
      userId: user.id,
      name: "GoPay / OVO",
      type: "EWALLET",
      balance: 450000,
      currentBalance: 450000,
      accountNumber: "081234567890",
      color: "#0284c7",
      icon: "Smartphone",
    },
  });

  const accountCc = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Kartu Kredit Mandiri",
      type: "CREDIT_CARD",
      balance: 0,
      currentBalance: 0,
      accountNumber: "4111-XXXX-XXXX-1234",
      color: "#b91c1c",
      icon: "CreditCard",
    },
  });

  const accountBibit = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Investasi Bibit & Reksadana",
      type: "INVESTMENT",
      balance: 12000000,
      currentBalance: 12000000,
      color: "#7c3aed",
      icon: "PiggyBank",
    },
  });

  // 3. Create Categories & Subcategories
  // INCOME Categories
  const catGaji = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Gaji & Pendapatan Tetap",
      type: "INCOME",
      icon: "BadgeDollarSign",
      color: "#10b981",
      subCategories: {
        create: [{ name: "Gaji Pokok" }, { name: "Tunjangan" }, { name: "THR & Bonus" }],
      },
    },
  });

  const catSideIncome = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Freelance & Usaha Sampingan",
      type: "INCOME",
      icon: "Briefcase",
      color: "#059669",
      subCategories: {
        create: [{ name: "Jasa Web & Koding" }, { name: "Penjualan Online" }],
      },
    },
  });

  const catInvestIncome = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Hasil Investasi & Bunga",
      type: "INCOME",
      icon: "TrendingUp",
      color: "#14b8a6",
      subCategories: {
        create: [{ name: "Dividen Saham" }, { name: "Imbal Hasil Reksadana" }],
      },
    },
  });

  // EXPENSE Categories
  const catMakan = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Makanan & Minuman",
      type: "EXPENSE",
      icon: "UtensilsCrossed",
      color: "#ef4444",
      subCategories: {
        create: [
          { name: "Makan Siang & Malam" },
          { name: "Kopi & Kafe" },
          { name: "Bahan Masak / Groceries" },
          { name: "Jajan & Camilan" },
        ],
      },
    },
  });

  const catTransport = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Transportasi",
      type: "EXPENSE",
      icon: "Car",
      color: "#f97316",
      subCategories: {
        create: [{ name: "Bahan Bakar / Bensin" }, { name: "Ojek Online (Gojek/Grab)" }, { name: "Tol & Parkir" }],
      },
    },
  });

  const catTagihan = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Tagihan & Utilitas",
      type: "EXPENSE",
      icon: "Receipt",
      color: "#eab308",
      subCategories: {
        create: [{ name: "Listrik PLN" }, { name: "Internet WiFi & Pulsa" }, { name: "Langganan Aplikasi (SaaS)" }],
      },
    },
  });

  const catBelanja = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Belanja Kebutuhan",
      type: "EXPENSE",
      icon: "ShoppingCart",
      color: "#ec4899",
      subCategories: {
        create: [{ name: "Pakaian & Sandang" }, { name: "Elektronik & Gadget" }, { name: "Perlengkapan Rumah" }],
      },
    },
  });

  const catHiburan = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Hiburan & Liburan",
      type: "EXPENSE",
      icon: "Film",
      color: "#8b5cf6",
      subCategories: {
        create: [{ name: "Nonton Bioskop" }, { name: "Staycation / Liburan" }, { name: "Hobi & Gaming" }],
      },
    },
  });

  const catKesehatan = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Kesehatan",
      type: "EXPENSE",
      icon: "HeartPulse",
      color: "#06b6d4",
      subCategories: {
        create: [{ name: "Obat & Vitamin" }, { name: "Pemeriksaan Dokter" }],
      },
    },
  });

  // TRANSFER Category
  const catTransfer = await prisma.category.create({
    data: {
      userId: user.id,
      name: "Transfer Antar Rekening",
      type: "TRANSFER",
      icon: "ArrowRightLeft",
      color: "#6366f1",
    },
  });

  // 4. Tags
  const tagRutin = await prisma.tag.create({
    data: { userId: user.id, name: "Rutin", color: "#3b82f6" },
  });
  const tagPenting = await prisma.tag.create({
    data: { userId: user.id, name: "Penting", color: "#ef4444" },
  });
  const tagKerja = await prisma.tag.create({
    data: { userId: user.id, name: "Kerja", color: "#10b981" },
  });
  const tagPribadi = await prisma.tag.create({
    data: { userId: user.id, name: "Pribadi", color: "#8b5cf6" },
  });

  // 5. Budgets for Current Month
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: catMakan.id,
        amount: 2500000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: catTransport.id,
        amount: 1000000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: catTagihan.id,
        amount: 1200000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 90,
      },
      {
        userId: user.id,
        categoryId: catBelanja.id,
        amount: 1500000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 80,
      },
      {
        userId: user.id,
        categoryId: catHiburan.id,
        amount: 800000,
        month: currentMonth,
        year: currentYear,
        alertThreshold: 75,
      },
    ],
  });

  // 6. Savings Goals
  const goalDarurat = await prisma.goal.create({
    data: {
      userId: user.id,
      name: "Dana Darurat 6 Bulan",
      targetAmount: 30000000,
      currentAmount: 14500000,
      deadline: new Date(currentYear, 11, 31),
      accountId: accountBca.id,
      color: "#10b981",
      icon: "ShieldCheck",
      contributions: {
        create: [
          { amount: 5000000, note: "Tabungan awal tahun", date: new Date(currentYear, currentMonth - 2, 1) },
          { amount: 5000000, note: "Dari bonus project", date: new Date(currentYear, currentMonth - 1, 15) },
          { amount: 4500000, note: "Alokasi gaji bulan ini", date: new Date(currentYear, currentMonth - 1, 28) },
        ],
      },
    },
  });

  const goalLaptop = await prisma.goal.create({
    data: {
      userId: user.id,
      name: "Upgrade Laptop M3 Pro",
      targetAmount: 22000000,
      currentAmount: 9000000,
      deadline: new Date(currentYear, 10, 30),
      accountId: accountBibit.id,
      color: "#3b82f6",
      icon: "Laptop",
      contributions: {
        create: [
          { amount: 4000000, note: "DP Tabungan", date: new Date(currentYear, currentMonth - 2, 10) },
          { amount: 5000000, note: "Tabungan freelance", date: new Date(currentYear, currentMonth - 1, 5) },
        ],
      },
    },
  });

  // 7. Realistic Sample Transactions
  const foodSubs = await prisma.subCategory.findMany({ where: { categoryId: catMakan.id } });
  const transSubs = await prisma.subCategory.findMany({ where: { categoryId: catTransport.id } });
  const billSubs = await prisma.subCategory.findMany({ where: { categoryId: catTagihan.id } });

  const transactionsData = [
    {
      userId: user.id,
      type: "INCOME",
      amount: 12500000,
      date: new Date(currentYear, currentMonth - 1, 1),
      accountId: accountBca.id,
      categoryId: catGaji.id,
      note: "Gaji Pokok Bulanan PT Solusi Digital",
      tagId: tagRutin.id,
    },
    {
      userId: user.id,
      type: "INCOME",
      amount: 3800000,
      date: new Date(currentYear, currentMonth - 1, 5),
      accountId: accountBca.id,
      categoryId: catSideIncome.id,
      note: "Pembayaran Project Website E-commerce",
      tagId: tagKerja.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 450000,
      date: new Date(currentYear, currentMonth - 1, 2),
      accountId: accountBca.id,
      categoryId: catTagihan.id,
      subCategoryId: billSubs.find((s) => s.name.includes("Listrik"))?.id,
      note: "Token Listrik Rumah 500k",
      tagId: tagPenting.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 380000,
      date: new Date(currentYear, currentMonth - 1, 3),
      accountId: accountBca.id,
      categoryId: catTagihan.id,
      subCategoryId: billSubs.find((s) => s.name.includes("Internet"))?.id,
      note: "Tagihan IndiHome WiFi 50 Mbps",
      tagId: tagRutin.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 520000,
      date: new Date(currentYear, currentMonth - 1, 4),
      accountId: accountBca.id,
      categoryId: catMakan.id,
      subCategoryId: foodSubs.find((s) => s.name.includes("Bahan"))?.id,
      note: "Belanja Mingguan Superindo",
      tagId: tagPenting.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 45000,
      date: new Date(currentYear, currentMonth - 1, 5),
      accountId: accountCash.id,
      categoryId: catMakan.id,
      subCategoryId: foodSubs.find((s) => s.name.includes("Makan Siang"))?.id,
      note: "Makan Siang Nasi Padang + Es Teh",
      tagId: tagPribadi.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 60000,
      date: new Date(currentYear, currentMonth - 1, 6),
      accountId: accountCash.id,
      categoryId: catTransport.id,
      subCategoryId: transSubs.find((s) => s.name.includes("Bahan Bakar"))?.id,
      note: "Isi Bensin Pertamax Full Tank",
      tagId: tagRutin.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 32000,
      date: new Date(currentYear, currentMonth - 1, 7),
      accountId: accountGopay.id,
      categoryId: catMakan.id,
      subCategoryId: foodSubs.find((s) => s.name.includes("Kopi"))?.id,
      note: "Kopi Kenangan Mantan Large",
      tagId: tagPribadi.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 350000,
      date: new Date(currentYear, currentMonth - 1, 8),
      accountId: accountBca.id,
      categoryId: catBelanja.id,
      note: "Beli Kemeja Kerja Uniqlo",
      tagId: tagPenting.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 110000,
      date: new Date(currentYear, currentMonth - 1, 9),
      accountId: accountGopay.id,
      categoryId: catHiburan.id,
      note: "Tiket XXI + Popcorn",
      tagId: tagPribadi.id,
    },
    {
      userId: user.id,
      type: "EXPENSE",
      amount: 150000,
      date: new Date(currentYear, currentMonth - 1, 10),
      accountId: accountGopay.id,
      categoryId: catKesehatan.id,
      note: "Vitamin C & Suplemen Guardian",
      tagId: tagPenting.id,
    },
  ];

  for (const item of transactionsData) {
    const { tagId, ...tData } = item;
    const createdTx = await prisma.transaction.create({
      data: tData,
    });
    if (tagId) {
      await prisma.transactionTag.create({
        data: {
          transactionId: createdTx.id,
          tagId: tagId,
        },
      });
    }
  }

  // Create a transfer transaction (BCA -> Gopay)
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "TRANSFER",
      amount: 500000,
      date: new Date(currentYear, currentMonth - 1, 3),
      accountId: accountBca.id,
      toAccountId: accountGopay.id,
      categoryId: catTransfer.id,
      note: "Topup saldo GoPay dari BCA",
    },
  });

  // 8. Recurring transaction
  await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
      type: "EXPENSE",
      amount: 380000,
      accountId: accountBca.id,
      categoryId: catTagihan.id,
      frequency: "MONTHLY",
      startDate: new Date(currentYear, currentMonth - 1, 3),
      nextRun: new Date(currentYear, currentMonth, 3),
      note: "Langganan WiFi IndiHome Bulanan",
      isActive: true,
    },
  });

  console.log("Seeding finished successfully!");
  console.log("------------------------------------------");
  console.log("Demo Credentials:");
  console.log("Email    : demo@finkaya.id");
  console.log("Password : password123");
  console.log("------------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
