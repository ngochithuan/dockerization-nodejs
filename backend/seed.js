require("dotenv").config();
const mongoose = require("mongoose");
const { connectDB } = require("./src/config/db");
const Drink = require("./src/models/Drink");
const { SIZES, STATUSES, DEFAULT_IMAGE_URL } = Drink;

// Mọi timestamp đều phải trước ngày 10/10/2026
const LIMIT_DATE = new Date(2026, 9, 10).getTime();
const START_DATE = new Date(2024, 0, 1).getTime();

const DRINKS = [
  { name: "Cà phê đen đá", category: "Cà phê", description: "Cà phê phin truyền thống pha đậm, uống cùng đá.", price: 20000 },
  { name: "Cà phê sữa đá", category: "Cà phê", description: "Cà phê phin hòa quyện cùng sữa đặc béo ngậy.", price: 25000 },
  { name: "Bạc xỉu", category: "Cà phê", description: "Nhiều sữa, ít cà phê, vị ngọt dịu dễ uống.", price: 29000 },
  { name: "Cà phê muối", category: "Cà phê", description: "Cà phê đậm đà phủ lớp kem muối mặn nhẹ.", price: 35000 },
  { name: "Cà phê trứng", category: "Cà phê", description: "Đặc sản Hà Nội với lớp kem trứng bông mịn.", price: 40000 },
  { name: "Trà đào cam sả", category: "Trà", description: "Trà đen thơm mát kết hợp đào miếng, cam và sả.", price: 45000 },
  { name: "Trà vải", category: "Trà", description: "Trà xanh nhài ngọt thanh cùng quả vải tươi.", price: 42000 },
  { name: "Trà chanh", category: "Trà", description: "Trà xanh pha chanh tươi giải nhiệt mùa hè.", price: 15000 },
  { name: "Trà sen vàng", category: "Trà", description: "Trà ô long ướp sen, thêm hạt sen bùi và kem sữa.", price: 49000 },
  { name: "Trà sữa trân châu đường đen", category: "Trà sữa", description: "Trà sữa béo thơm cùng trân châu nấu đường đen.", price: 45000 },
  { name: "Trà sữa matcha", category: "Trà sữa", description: "Matcha Nhật Bản hòa cùng sữa tươi và trân châu trắng.", price: 48000 },
  { name: "Trà sữa khoai môn", category: "Trà sữa", description: "Vị khoai môn bùi béo, màu tím bắt mắt.", price: 42000 },
  { name: "Sinh tố bơ", category: "Sinh tố", description: "Bơ sáp xay mịn cùng sữa đặc, béo ngậy.", price: 40000 },
  { name: "Sinh tố xoài", category: "Sinh tố", description: "Xoài cát chín xay cùng sữa chua mát lạnh.", price: 38000 },
  { name: "Sinh tố dâu", category: "Sinh tố", description: "Dâu tây Đà Lạt xay cùng sữa tươi.", price: 42000 },
  { name: "Nước ép cam", category: "Nước ép", description: "Cam sành vắt tươi nguyên chất, giàu vitamin C.", price: 30000 },
  { name: "Nước ép dưa hấu", category: "Nước ép", description: "Dưa hấu tươi ép mát lạnh, không thêm đường.", price: 28000 },
  { name: "Nước ép cà rốt", category: "Nước ép", description: "Cà rốt tươi ép nguyên chất, tốt cho mắt.", price: 30000 },
  { name: "Nước mía", category: "Nước giải khát", description: "Nước mía ép tươi thêm chút tắc thơm.", price: 12000 },
  { name: "Rau má đậu xanh", category: "Nước giải khát", description: "Rau má xay cùng đậu xanh và nước cốt dừa.", price: 25000 },
  { name: "Sữa chua đánh đá", category: "Sữa chua", description: "Sữa chua lên men tự nhiên đánh cùng đá bào.", price: 25000 },
  { name: "Sữa chua việt quất", category: "Sữa chua", description: "Sữa chua dẻo kết hợp sốt việt quất chua ngọt.", price: 35000 },
  { name: "Đá xay cookies", category: "Đá xay", description: "Đá xay sữa cùng bánh quy sô-cô-la và kem tươi.", price: 55000 },
  { name: "Matcha đá xay", category: "Đá xay", description: "Matcha đá xay phủ kem tươi mềm mịn.", price: 55000 },
  { name: "Sô-cô-la nóng", category: "Đồ uống nóng", description: "Sô-cô-la đậm vị pha cùng sữa nóng.", price: 39000 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function buildMockDrinks() {
  return DRINKS.map((drink) => {
    // created_at < updated_at < 10/10/2026
    const createdAt = randomInt(START_DATE, LIMIT_DATE - 2);
    const updatedAt = randomInt(createdAt + 1, LIMIT_DATE - 1);

    return {
      ...drink,
      size: randomItem(SIZES),
      image_url: DEFAULT_IMAGE_URL,
      status: randomItem(STATUSES),
      created_at: new Date(createdAt),
      updated_at: new Date(updatedAt),
    };
  });
}

async function seed() {
  await connectDB();

  // 1. Xóa db nếu có
  await mongoose.connection.dropDatabase();
  console.log(`Dropped database "${mongoose.connection.name}"`);

  // 2. Tạo db (tạo collection + index)
  await Drink.createCollection();
  await Drink.syncIndexes();
  console.log(`Created collection "${Drink.collection.collectionName}"`);

  // 3. Thêm dữ liệu mockup
  const drinks = await Drink.insertMany(buildMockDrinks());
  console.log(`Inserted ${drinks.length} drinks`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
