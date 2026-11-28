// Seed catalogue: computers and computer components ONLY (10 categories × 10 products).
// Prices in VND. Each product gets 2–4 variants with their own price, cost and stock.

export const CATEGORIES = [
  { slug: 'laptop', name: 'Laptop' },
  { slug: 'desktop-pc', name: 'PC để bàn' },
  { slug: 'monitor', name: 'Màn hình' },
  { slug: 'cpu', name: 'CPU' },
  { slug: 'gpu', name: 'Card đồ họa' },
  { slug: 'ram', name: 'RAM' },
  { slug: 'storage', name: 'Ổ cứng SSD/HDD' },
  { slug: 'mainboard', name: 'Mainboard' },
  { slug: 'psu', name: 'Nguồn PSU' },
  { slug: 'pc-case', name: 'Vỏ case' },
];

// v(name, price) — variant shorthand
const v = (name, price) => ({ name, price });

export const PRODUCTS = {
  laptop: [
    {
      name: 'ASUS ROG Strix G16 G614',
      brand: 'ASUS',
      tags: ['gaming', 'rtx', 'high-refresh'],
      specs: { CPU: 'Intel Core i7-14650HX', 'Màn hình': '16" QHD+ 240Hz', RAM: '16GB DDR5 5600', 'Ổ cứng': 'SSD 1TB PCIe 4.0', 'Trọng lượng': '2.5 kg' },
      variants: [v('RTX 4060 8GB / 16GB / 1TB', 42_990_000), v('RTX 4070 8GB / 16GB / 1TB', 49_990_000), v('RTX 4070 8GB / 32GB / 1TB', 53_490_000)],
    },
    {
      name: 'Dell XPS 14 9440',
      brand: 'Dell',
      tags: ['ultrabook', 'creator', 'oled'],
      specs: { CPU: 'Intel Core Ultra 7 155H', 'Màn hình': '14.5" 3.2K OLED 120Hz cảm ứng', RAM: 'LPDDR5x 7467', 'Ổ cứng': 'SSD PCIe 4.0', 'Trọng lượng': '1.68 kg' },
      variants: [v('16GB / 512GB / Platinum', 46_990_000), v('32GB / 1TB / Graphite', 55_990_000)],
    },
    {
      name: 'Lenovo Legion 5 16IRX9',
      brand: 'Lenovo',
      tags: ['gaming', 'rtx'],
      specs: { CPU: 'Intel Core i7-14650HX', 'Màn hình': '16" WQXGA 165Hz', RAM: 'DDR5 5600', 'Ổ cứng': 'SSD 1TB', 'Trọng lượng': '2.4 kg' },
      variants: [v('RTX 4060 / 16GB / 1TB', 38_490_000), v('RTX 4070 / 32GB / 1TB', 46_990_000)],
    },
    {
      name: 'HP Victus 15-fa1000',
      brand: 'HP',
      tags: ['gaming', 'sinh-vien'],
      specs: { CPU: 'Intel Core i5-13420H', 'Màn hình': '15.6" FHD 144Hz', RAM: '16GB DDR4 3200', 'Ổ cứng': 'SSD 512GB', 'Trọng lượng': '2.29 kg' },
      variants: [v('RTX 3050 6GB / 16GB / 512GB', 19_990_000), v('RTX 4050 6GB / 16GB / 512GB', 22_990_000)],
    },
    {
      name: 'Apple MacBook Air 13 M3',
      brand: 'Apple',
      tags: ['ultrabook', 'van-phong', 'macos'],
      specs: { CPU: 'Apple M3 8 nhân CPU / 8 nhân GPU', 'Màn hình': '13.6" Liquid Retina', RAM: 'Bộ nhớ hợp nhất', 'Ổ cứng': 'SSD', 'Trọng lượng': '1.24 kg' },
      variants: [v('8GB / 256GB / Midnight', 26_990_000), v('16GB / 512GB / Starlight', 35_990_000), v('16GB / 512GB / Space Gray', 35_990_000)],
    },
    {
      name: 'Apple MacBook Pro 14 M4 Pro',
      brand: 'Apple',
      tags: ['creator', 'macos', 'workstation'],
      specs: { CPU: 'Apple M4 Pro 12 nhân CPU / 16 nhân GPU', 'Màn hình': '14.2" Liquid Retina XDR 120Hz', RAM: '24GB bộ nhớ hợp nhất', 'Ổ cứng': 'SSD', 'Trọng lượng': '1.6 kg' },
      variants: [v('24GB / 512GB / Space Black', 49_990_000), v('24GB / 1TB / Silver', 55_990_000)],
    },
    {
      name: 'Acer Nitro V 15 ANV15-51',
      brand: 'Acer',
      tags: ['gaming', 'sinh-vien'],
      specs: { CPU: 'Intel Core i5-13420H', 'Màn hình': '15.6" FHD IPS 144Hz', RAM: '8GB DDR5', 'Ổ cứng': 'SSD 512GB', 'Trọng lượng': '2.1 kg' },
      variants: [v('RTX 2050 / 8GB / 512GB', 17_490_000), v('RTX 4050 / 16GB / 512GB', 22_490_000)],
    },
    {
      name: 'MSI Modern 14 C13M',
      brand: 'MSI',
      tags: ['van-phong', 'sinh-vien'],
      specs: { CPU: 'Intel Core i5-1335U', 'Màn hình': '14" FHD IPS', RAM: 'DDR4 3200', 'Ổ cứng': 'SSD NVMe', 'Trọng lượng': '1.4 kg' },
      variants: [v('8GB / 512GB / Classic Black', 12_990_000), v('16GB / 512GB / Beige Rose', 14_490_000)],
    },
    {
      name: 'Lenovo ThinkPad X1 Carbon Gen 12',
      brand: 'Lenovo',
      tags: ['doanh-nhan', 'ultrabook'],
      specs: { CPU: 'Intel Core Ultra 7 155U', 'Màn hình': '14" 2.8K OLED', RAM: 'LPDDR5x', 'Ổ cứng': 'SSD PCIe 4.0', 'Trọng lượng': '1.09 kg' },
      variants: [v('16GB / 512GB', 44_990_000), v('32GB / 1TB', 52_990_000)],
    },
    {
      name: 'ASUS Zenbook 14 OLED UX3405',
      brand: 'ASUS',
      tags: ['ultrabook', 'oled', 'van-phong'],
      specs: { CPU: 'Intel Core Ultra 5 125H', 'Màn hình': '14" 3K OLED 120Hz', RAM: 'LPDDR5x 7467', 'Ổ cứng': 'SSD 1TB', 'Trọng lượng': '1.2 kg' },
      variants: [v('Ultra 5 / 16GB / 512GB', 24_990_000), v('Ultra 7 / 32GB / 1TB', 31_990_000)],
    },
  ],

  'desktop-pc': [
    {
      name: 'Dell OptiPlex 7010 SFF',
      brand: 'Dell',
      tags: ['van-phong', 'doanh-nghiep'],
      specs: { CPU: 'Intel Core i5-13500', RAM: 'DDR4 3200', 'Ổ cứng': 'SSD 512GB', 'Đồ họa': 'Intel UHD 770', 'Hệ điều hành': 'Windows 11 Pro' },
      variants: [v('8GB / 512GB', 15_990_000), v('16GB / 512GB', 17_490_000)],
    },
    {
      name: 'HP Pavilion TP01-4000',
      brand: 'HP',
      tags: ['gia-dinh', 'van-phong'],
      specs: { CPU: 'Intel Core i5-13400', RAM: 'DDR4 3200', 'Ổ cứng': 'SSD 512GB', 'Đồ họa': 'Intel UHD 730', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('8GB / 512GB', 13_490_000), v('16GB / 1TB', 15_990_000)],
    },
    {
      name: 'Lenovo IdeaCentre 5 14IRB8',
      brand: 'Lenovo',
      tags: ['gia-dinh'],
      specs: { CPU: 'Intel Core i7-13700', RAM: 'DDR4', 'Ổ cứng': 'SSD 512GB', 'Đồ họa': 'Intel UHD 770', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('16GB / 512GB', 19_990_000), v('16GB / 1TB', 21_490_000)],
    },
    {
      name: 'ASUS ROG Strix G13CHR',
      brand: 'ASUS',
      tags: ['gaming', 'rtx'],
      specs: { CPU: 'Intel Core i7-14700F', RAM: 'DDR5 5600', 'Ổ cứng': 'SSD 1TB', 'Đồ họa': 'NVIDIA GeForce RTX', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('RTX 4060 Ti / 16GB', 39_990_000), v('RTX 4070 Super / 32GB', 49_990_000)],
    },
    {
      name: 'MSI MAG Infinite S3 14th',
      brand: 'MSI',
      tags: ['gaming', 'rtx'],
      specs: { CPU: 'Intel Core i5-14400F', RAM: 'DDR5', 'Ổ cứng': 'SSD 1TB', 'Đồ họa': 'NVIDIA GeForce RTX', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('RTX 4060 / 16GB', 27_990_000), v('RTX 4060 Ti / 16GB', 31_490_000)],
    },
    {
      name: 'Acer Aspire TC-1780',
      brand: 'Acer',
      tags: ['van-phong', 'gia-dinh'],
      specs: { CPU: 'Intel Core i3-13100', RAM: 'DDR4', 'Ổ cứng': 'SSD 512GB', 'Đồ họa': 'Intel UHD 730', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('8GB / 512GB', 9_990_000), v('16GB / 512GB', 11_290_000)],
    },
    {
      name: 'Apple Mac mini M4',
      brand: 'Apple',
      tags: ['macos', 'creator', 'mini-pc'],
      specs: { CPU: 'Apple M4 10 nhân CPU / 10 nhân GPU', RAM: 'Bộ nhớ hợp nhất', 'Ổ cứng': 'SSD', 'Cổng kết nối': 'Thunderbolt 4, HDMI', 'Hệ điều hành': 'macOS' },
      variants: [v('16GB / 256GB', 14_990_000), v('16GB / 512GB', 19_990_000), v('24GB / 512GB', 24_990_000)],
    },
    {
      name: 'Dell XPS Desktop 8960',
      brand: 'Dell',
      tags: ['creator', 'rtx'],
      specs: { CPU: 'Intel Core i9-14900K', RAM: 'DDR5 5600', 'Ổ cứng': 'SSD 2TB', 'Đồ họa': 'NVIDIA GeForce RTX 4070', 'Hệ điều hành': 'Windows 11 Pro' },
      variants: [v('32GB / 1TB', 58_990_000), v('64GB / 2TB', 69_990_000)],
    },
    {
      name: 'HP Victus 15L TG02',
      brand: 'HP',
      tags: ['gaming'],
      specs: { CPU: 'AMD Ryzen 5 8500G', RAM: 'DDR5', 'Ổ cứng': 'SSD 512GB', 'Đồ họa': 'NVIDIA GeForce RTX 4060', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('16GB / 512GB', 23_990_000), v('16GB / 1TB', 25_490_000)],
    },
    {
      name: 'Lenovo Legion Tower 5i Gen 8',
      brand: 'Lenovo',
      tags: ['gaming', 'rtx'],
      specs: { CPU: 'Intel Core i7-14700F', RAM: 'DDR5 5600', 'Ổ cứng': 'SSD 1TB', 'Đồ họa': 'NVIDIA GeForce RTX', 'Hệ điều hành': 'Windows 11 Home' },
      variants: [v('RTX 4060 Ti / 16GB', 37_990_000), v('RTX 4070 / 32GB', 44_990_000)],
    },
  ],

  monitor: [
    { name: 'LG UltraGear 27GR83Q', brand: 'LG', tags: ['gaming', 'high-refresh'], specs: { 'Tấm nền': 'IPS', 'Độ phân giải': 'QHD 2560×1440', 'Tần số quét': '240Hz', 'Thời gian phản hồi': '1ms GtG', 'Cổng': 'HDMI 2.1, DP 1.4' }, variants: [v('27 inch', 9_490_000), v('27 inch + giá treo', 10_290_000)] },
    { name: 'Samsung Odyssey G5 G55C', brand: 'Samsung', tags: ['gaming', 'curved'], specs: { 'Tấm nền': 'VA cong 1000R', 'Độ phân giải': 'QHD 2560×1440', 'Tần số quét': '165Hz', 'Thời gian phản hồi': '1ms MPRT', 'Cổng': 'HDMI, DP' }, variants: [v('27 inch', 6_290_000), v('32 inch', 7_690_000)] },
    { name: 'Dell UltraSharp U2723QE', brand: 'Dell', tags: ['do-hoa', 'van-phong', '4k'], specs: { 'Tấm nền': 'IPS Black', 'Độ phân giải': '4K 3840×2160', 'Tần số quét': '60Hz', 'Màu sắc': '98% DCI-P3', 'Cổng': 'USB-C 90W, HDMI, DP' }, variants: [v('27 inch', 13_990_000), v('32 inch (U3223QE)', 19_490_000)] },
    { name: 'ASUS TUF Gaming VG27AQ3A', brand: 'ASUS', tags: ['gaming', 'high-refresh'], specs: { 'Tấm nền': 'Fast IPS', 'Độ phân giải': 'QHD 2560×1440', 'Tần số quét': '180Hz', 'Thời gian phản hồi': '1ms GtG', 'Cổng': 'HDMI 2.0, DP 1.2' }, variants: [v('27 inch', 5_790_000), v('27 inch + giá treo', 6_590_000)] },
    { name: 'MSI MAG 274QRF QD E2', brand: 'MSI', tags: ['gaming', 'high-refresh'], specs: { 'Tấm nền': 'Rapid IPS Quantum Dot', 'Độ phân giải': 'QHD 2560×1440', 'Tần số quét': '180Hz', 'Thời gian phản hồi': '1ms GtG', 'Cổng': 'HDMI, DP, USB-C' }, variants: [v('27 inch', 7_290_000), v('27 inch + giá treo', 8_090_000)] },
    { name: 'Gigabyte M27Q X', brand: 'Gigabyte', tags: ['gaming', 'kvm'], specs: { 'Tấm nền': 'SS IPS', 'Độ phân giải': 'QHD 2560×1440', 'Tần số quét': '240Hz', 'Tính năng': 'KVM switch', 'Cổng': 'HDMI 2.0, DP, USB-C' }, variants: [v('27 inch', 8_490_000), v('27 inch + giá treo', 9_290_000)] },
    { name: 'LG 27UP850N-W', brand: 'LG', tags: ['do-hoa', '4k'], specs: { 'Tấm nền': 'IPS', 'Độ phân giải': '4K 3840×2160', 'Tần số quét': '60Hz', 'Màu sắc': '95% DCI-P3, HDR400', 'Cổng': 'USB-C 96W, HDMI, DP' }, variants: [v('27 inch', 9_990_000), v('32 inch (32UP83A)', 12_490_000)] },
    { name: 'Samsung ViewFinity S8 S80UA', brand: 'Samsung', tags: ['van-phong', '4k'], specs: { 'Tấm nền': 'IPS', 'Độ phân giải': '4K 3840×2160', 'Tần số quét': '60Hz', 'Màu sắc': '98% sRGB, HDR10', 'Cổng': 'USB-C 90W, HDMI, DP' }, variants: [v('27 inch', 8_990_000), v('32 inch', 11_490_000)] },
    { name: 'AOC 24G2SP', brand: 'AOC', tags: ['gaming', 'sinh-vien'], specs: { 'Tấm nền': 'IPS', 'Độ phân giải': 'FHD 1920×1080', 'Tần số quét': '165Hz', 'Thời gian phản hồi': '1ms MPRT', 'Cổng': 'HDMI, DP, VGA' }, variants: [v('24 inch', 3_290_000), v('27 inch (27G2SP)', 4_290_000)] },
    { name: 'ViewSonic VX2479-HD-PRO', brand: 'ViewSonic', tags: ['gaming', 'sinh-vien'], specs: { 'Tấm nền': 'IPS', 'Độ phân giải': 'FHD 1920×1080', 'Tần số quét': '180Hz', 'Thời gian phản hồi': '1ms MPRT', 'Cổng': 'HDMI, DP' }, variants: [v('24 inch', 2_990_000), v('27 inch (VX2779)', 3_790_000)] },
  ],

  cpu: [
    { name: 'Intel Core i9-14900K', brand: 'Intel', tags: ['gaming', 'workstation', 'lga1700'], specs: { Socket: 'LGA1700', 'Số nhân/luồng': '24 nhân / 32 luồng', 'Xung tối đa': '6.0 GHz', 'Bộ nhớ đệm': '36MB Intel Smart Cache', TDP: '125W (PBP)' }, variants: [v('Box chính hãng', 14_490_000), v('Tray bảo hành 36 tháng', 13_690_000)] },
    { name: 'Intel Core i7-14700K', brand: 'Intel', tags: ['gaming', 'lga1700'], specs: { Socket: 'LGA1700', 'Số nhân/luồng': '20 nhân / 28 luồng', 'Xung tối đa': '5.6 GHz', 'Bộ nhớ đệm': '33MB', TDP: '125W' }, variants: [v('Box chính hãng', 10_490_000), v('Tray bảo hành 36 tháng', 9_890_000)] },
    { name: 'Intel Core i5-14600K', brand: 'Intel', tags: ['gaming', 'lga1700'], specs: { Socket: 'LGA1700', 'Số nhân/luồng': '14 nhân / 20 luồng', 'Xung tối đa': '5.3 GHz', 'Bộ nhớ đệm': '24MB', TDP: '125W' }, variants: [v('Box chính hãng', 7_690_000), v('Tray bảo hành 36 tháng', 7_190_000)] },
    { name: 'Intel Core i5-14400F', brand: 'Intel', tags: ['gaming', 'gia-re', 'lga1700'], specs: { Socket: 'LGA1700', 'Số nhân/luồng': '10 nhân / 16 luồng', 'Xung tối đa': '4.7 GHz', 'Bộ nhớ đệm': '20MB', TDP: '65W' }, variants: [v('Box kèm tản nhiệt', 4_590_000), v('Tray bảo hành 36 tháng', 4_190_000)] },
    { name: 'Intel Core Ultra 7 265K', brand: 'Intel', tags: ['workstation', 'lga1851'], specs: { Socket: 'LGA1851', 'Số nhân/luồng': '20 nhân / 20 luồng', 'Xung tối đa': '5.5 GHz', 'Bộ nhớ đệm': '30MB', TDP: '125W' }, variants: [v('Box chính hãng', 9_990_000), v('Tray bảo hành 36 tháng', 9_390_000)] },
    { name: 'AMD Ryzen 9 9950X', brand: 'AMD', tags: ['workstation', 'am5'], specs: { Socket: 'AM5', 'Số nhân/luồng': '16 nhân / 32 luồng', 'Xung tối đa': '5.7 GHz', 'Bộ nhớ đệm': '80MB (L2+L3)', TDP: '170W' }, variants: [v('Box chính hãng', 16_490_000), v('Tray bảo hành 36 tháng', 15_690_000)] },
    { name: 'AMD Ryzen 7 9800X3D', brand: 'AMD', tags: ['gaming', 'am5', '3d-vcache'], specs: { Socket: 'AM5', 'Số nhân/luồng': '8 nhân / 16 luồng', 'Xung tối đa': '5.2 GHz', 'Bộ nhớ đệm': '104MB (3D V-Cache)', TDP: '120W' }, variants: [v('Box chính hãng', 13_490_000), v('Tray bảo hành 36 tháng', 12_890_000)] },
    { name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', tags: ['gaming', 'am5', '3d-vcache'], specs: { Socket: 'AM5', 'Số nhân/luồng': '8 nhân / 16 luồng', 'Xung tối đa': '5.0 GHz', 'Bộ nhớ đệm': '104MB (3D V-Cache)', TDP: '120W' }, variants: [v('Box chính hãng', 10_990_000), v('Tray bảo hành 36 tháng', 10_390_000)] },
    { name: 'AMD Ryzen 5 9600X', brand: 'AMD', tags: ['gaming', 'am5'], specs: { Socket: 'AM5', 'Số nhân/luồng': '6 nhân / 12 luồng', 'Xung tối đa': '5.4 GHz', 'Bộ nhớ đệm': '38MB', TDP: '65W' }, variants: [v('Box chính hãng', 6_490_000), v('Tray bảo hành 36 tháng', 6_090_000)] },
    { name: 'AMD Ryzen 5 7600', brand: 'AMD', tags: ['gaming', 'gia-re', 'am5'], specs: { Socket: 'AM5', 'Số nhân/luồng': '6 nhân / 12 luồng', 'Xung tối đa': '5.1 GHz', 'Bộ nhớ đệm': '38MB', TDP: '65W' }, variants: [v('Box kèm tản Wraith Stealth', 5_190_000), v('Tray bảo hành 36 tháng', 4_790_000)] },
  ],

  gpu: [
    { name: 'ASUS ROG Strix GeForce RTX 4090 OC', brand: 'ASUS', tags: ['gaming', 'rtx', '4k', 'workstation'], specs: { GPU: 'NVIDIA GeForce RTX 4090', 'Bộ nhớ': '24GB GDDR6X 384-bit', 'Xung boost': '2640 MHz (OC)', 'Nguồn đề nghị': '1000W', 'Cổng': '2× HDMI 2.1a, 3× DP 1.4a' }, variants: [v('Bản tiêu chuẩn', 62_990_000), v('Bản White Edition', 65_490_000)] },
    { name: 'MSI GeForce RTX 4080 Super Gaming X Slim', brand: 'MSI', tags: ['gaming', 'rtx', '4k'], specs: { GPU: 'NVIDIA GeForce RTX 4080 Super', 'Bộ nhớ': '16GB GDDR6X 256-bit', 'Xung boost': '2610 MHz', 'Nguồn đề nghị': '850W', 'Cổng': 'HDMI 2.1a, 3× DP 1.4a' }, variants: [v('Bản Black', 31_990_000), v('Bản White', 32_990_000)] },
    { name: 'Gigabyte GeForce RTX 4070 Super Windforce OC', brand: 'Gigabyte', tags: ['gaming', 'rtx', '2k'], specs: { GPU: 'NVIDIA GeForce RTX 4070 Super', 'Bộ nhớ': '12GB GDDR6X 192-bit', 'Xung boost': '2505 MHz', 'Nguồn đề nghị': '750W', 'Cổng': 'HDMI 2.1a, 3× DP 1.4a' }, variants: [v('Bản tiêu chuẩn', 16_990_000), v('Bản OC 3 quạt', 17_690_000)] },
    { name: 'ASUS Dual GeForce RTX 4060 Ti', brand: 'ASUS', tags: ['gaming', 'rtx'], specs: { GPU: 'NVIDIA GeForce RTX 4060 Ti', 'Bộ nhớ': 'GDDR6 128-bit', 'Xung boost': '2595 MHz', 'Nguồn đề nghị': '550W', 'Cổng': 'HDMI 2.1a, 3× DP 1.4a' }, variants: [v('8GB', 10_990_000), v('16GB', 12_990_000)] },
    { name: 'MSI GeForce RTX 4060 Ventus 2X', brand: 'MSI', tags: ['gaming', 'rtx', 'gia-re'], specs: { GPU: 'NVIDIA GeForce RTX 4060', 'Bộ nhớ': '8GB GDDR6 128-bit', 'Xung boost': '2460 MHz', 'Nguồn đề nghị': '550W', 'Cổng': 'HDMI 2.1a, 3× DP 1.4a' }, variants: [v('Bản Black OC', 8_290_000), v('Bản White OC', 8_590_000)] },
    { name: 'Sapphire Pulse Radeon RX 7800 XT', brand: 'Sapphire', tags: ['gaming', 'radeon', '2k'], specs: { GPU: 'AMD Radeon RX 7800 XT', 'Bộ nhớ': '16GB GDDR6 256-bit', 'Xung boost': '2430 MHz', 'Nguồn đề nghị': '700W', 'Cổng': '2× HDMI 2.1, 2× DP 2.1' }, variants: [v('Bản Pulse', 13_490_000), v('Bản Nitro+', 14_990_000)] },
    { name: 'PowerColor Hellhound Radeon RX 7900 XTX', brand: 'PowerColor', tags: ['gaming', 'radeon', '4k'], specs: { GPU: 'AMD Radeon RX 7900 XTX', 'Bộ nhớ': '24GB GDDR6 384-bit', 'Xung boost': '2525 MHz', 'Nguồn đề nghị': '850W', 'Cổng': 'HDMI 2.1, 3× DP 2.1' }, variants: [v('Bản Hellhound', 25_990_000), v('Bản Hellhound Spectral White', 26_990_000)] },
    { name: 'Gigabyte GeForce RTX 5070 Gaming OC', brand: 'Gigabyte', tags: ['gaming', 'rtx', '2k'], specs: { GPU: 'NVIDIA GeForce RTX 5070', 'Bộ nhớ': '12GB GDDR7 192-bit', 'Xung boost': '2625 MHz', 'Nguồn đề nghị': '750W', 'Cổng': 'HDMI 2.1b, 3× DP 2.1b' }, variants: [v('Bản Gaming OC', 17_990_000), v('Bản Aero OC (trắng)', 18_690_000)] },
    { name: 'ASUS TUF Gaming GeForce RTX 5080 OC', brand: 'ASUS', tags: ['gaming', 'rtx', '4k'], specs: { GPU: 'NVIDIA GeForce RTX 5080', 'Bộ nhớ': '16GB GDDR7 256-bit', 'Xung boost': '2760 MHz (OC)', 'Nguồn đề nghị': '850W', 'Cổng': '2× HDMI 2.1b, 3× DP 2.1b' }, variants: [v('Bản tiêu chuẩn', 36_990_000), v('Bản OC', 38_490_000)] },
    { name: 'Zotac Gaming GeForce RTX 4070 Twin Edge', brand: 'Zotac', tags: ['gaming', 'rtx', 'sff'], specs: { GPU: 'NVIDIA GeForce RTX 4070', 'Bộ nhớ': '12GB GDDR6X 192-bit', 'Xung boost': '2475 MHz', 'Nguồn đề nghị': '650W', 'Cổng': 'HDMI 2.1, 3× DP 1.4a' }, variants: [v('Bản Twin Edge', 14_490_000), v('Bản Twin Edge OC White', 14_990_000)] },
  ],

  ram: [
    { name: 'Kingston Fury Beast DDR5 5600', brand: 'Kingston', tags: ['ddr5', 'gaming'], specs: { 'Chuẩn': 'DDR5', 'Bus': '5600 MT/s', 'Độ trễ': 'CL40', 'Điện áp': '1.25V', 'Hỗ trợ': 'Intel XMP 3.0' } },
    { name: 'Corsair Vengeance RGB DDR5 6000', brand: 'Corsair', tags: ['ddr5', 'rgb', 'gaming'], specs: { 'Chuẩn': 'DDR5', 'Bus': '6000 MT/s', 'Độ trễ': 'CL36', 'Điện áp': '1.35V', 'Hỗ trợ': 'XMP 3.0, AMD EXPO' } },
    { name: 'G.Skill Trident Z5 RGB DDR5 6400', brand: 'G.Skill', tags: ['ddr5', 'rgb', 'oc'], specs: { 'Chuẩn': 'DDR5', 'Bus': '6400 MT/s', 'Độ trễ': 'CL32', 'Điện áp': '1.40V', 'Hỗ trợ': 'Intel XMP 3.0' } },
    { name: 'Kingston Fury Beast DDR4 3200', brand: 'Kingston', tags: ['ddr4', 'gia-re'], specs: { 'Chuẩn': 'DDR4', 'Bus': '3200 MT/s', 'Độ trễ': 'CL16', 'Điện áp': '1.35V', 'Hỗ trợ': 'XMP 2.0' } },
    { name: 'Corsair Vengeance LPX DDR4 3200', brand: 'Corsair', tags: ['ddr4', 'gia-re'], specs: { 'Chuẩn': 'DDR4', 'Bus': '3200 MT/s', 'Độ trễ': 'CL16', 'Điện áp': '1.35V', 'Tản nhiệt': 'Nhôm low-profile' } },
    { name: 'G.Skill Ripjaws V DDR4 3600', brand: 'G.Skill', tags: ['ddr4', 'gaming'], specs: { 'Chuẩn': 'DDR4', 'Bus': '3600 MT/s', 'Độ trễ': 'CL18', 'Điện áp': '1.35V', 'Hỗ trợ': 'XMP 2.0' } },
    { name: 'TeamGroup T-Force Delta RGB DDR5 6000', brand: 'TeamGroup', tags: ['ddr5', 'rgb'], specs: { 'Chuẩn': 'DDR5', 'Bus': '6000 MT/s', 'Độ trễ': 'CL38', 'Điện áp': '1.25V', 'Hỗ trợ': 'XMP 3.0' } },
    { name: 'Crucial DDR5 5600 UDIMM', brand: 'Crucial', tags: ['ddr5', 'van-phong'], specs: { 'Chuẩn': 'DDR5', 'Bus': '5600 MT/s', 'Độ trễ': 'CL46', 'Điện áp': '1.1V', 'Hỗ trợ': 'On-die ECC' } },
    { name: 'ADATA XPG Lancer RGB DDR5 6000', brand: 'ADATA', tags: ['ddr5', 'rgb', 'gaming'], specs: { 'Chuẩn': 'DDR5', 'Bus': '6000 MT/s', 'Độ trễ': 'CL30', 'Điện áp': '1.35V', 'Hỗ trợ': 'XMP 3.0, AMD EXPO' } },
    { name: 'Kingston Fury Impact DDR5 5600 SODIMM', brand: 'Kingston', tags: ['ddr5', 'laptop'], specs: { 'Chuẩn': 'DDR5 SODIMM (laptop)', 'Bus': '5600 MT/s', 'Độ trễ': 'CL40', 'Điện áp': '1.1V', 'Hỗ trợ': 'Intel XMP 3.0' } },
  ],

  storage: [
    { name: 'Samsung 990 Pro NVMe M.2', brand: 'Samsung', tags: ['nvme', 'pcie4', 'gaming'], kind: 'm2', specs: { 'Chuẩn': 'M.2 2280 NVMe PCIe 4.0', 'Đọc tuần tự': '7450 MB/s', 'Ghi tuần tự': '6900 MB/s', 'Bộ nhớ': 'Samsung V-NAND TLC', 'Bảo hành': '5 năm' }, caps: [['1TB', 2_890_000], ['2TB', 4_890_000], ['4TB', 9_490_000]] },
    { name: 'Samsung 870 EVO SATA 2.5"', brand: 'Samsung', tags: ['sata', 'van-phong'], kind: 'ssd25', specs: { 'Chuẩn': 'SATA III 2.5"', 'Đọc tuần tự': '560 MB/s', 'Ghi tuần tự': '530 MB/s', 'Bộ nhớ': 'V-NAND MLC', 'Bảo hành': '5 năm' }, caps: [['500GB', 1_590_000], ['1TB', 2_490_000], ['2TB', 4_390_000]] },
    { name: 'WD Black SN850X NVMe', brand: 'WD', tags: ['nvme', 'pcie4', 'gaming'], kind: 'm2', specs: { 'Chuẩn': 'M.2 2280 NVMe PCIe 4.0', 'Đọc tuần tự': '7300 MB/s', 'Ghi tuần tự': '6600 MB/s', 'Bộ nhớ': 'BiCS5 TLC', 'Bảo hành': '5 năm' }, caps: [['1TB', 2_690_000], ['2TB', 4_590_000]] },
    { name: 'WD Blue SN580 NVMe', brand: 'WD', tags: ['nvme', 'gia-re'], kind: 'm2', specs: { 'Chuẩn': 'M.2 2280 NVMe PCIe 4.0', 'Đọc tuần tự': '4150 MB/s', 'Ghi tuần tự': '4150 MB/s', 'Bộ nhớ': 'TLC', 'Bảo hành': '5 năm' }, caps: [['500GB', 1_190_000], ['1TB', 1_790_000], ['2TB', 3_290_000]] },
    { name: 'Kingston NV2 NVMe PCIe 4.0', brand: 'Kingston', tags: ['nvme', 'gia-re'], kind: 'm2', specs: { 'Chuẩn': 'M.2 2280 NVMe PCIe 4.0', 'Đọc tuần tự': '3500 MB/s', 'Ghi tuần tự': '2800 MB/s', 'Bộ nhớ': '3D NAND', 'Bảo hành': '3 năm' }, caps: [['500GB', 990_000], ['1TB', 1_590_000], ['2TB', 2_990_000]] },
    { name: 'Crucial P3 Plus NVMe', brand: 'Crucial', tags: ['nvme', 'pcie4'], kind: 'm2', specs: { 'Chuẩn': 'M.2 2280 NVMe PCIe 4.0', 'Đọc tuần tự': '5000 MB/s', 'Ghi tuần tự': '4200 MB/s', 'Bộ nhớ': 'Micron QLC', 'Bảo hành': '5 năm' }, caps: [['1TB', 1_890_000], ['2TB', 3_490_000]] },
    { name: 'Seagate Barracuda 3.5" HDD', brand: 'Seagate', tags: ['hdd', 'luu-tru'], kind: 'hdd', specs: { 'Chuẩn': 'SATA III 3.5"', 'Tốc độ quay': '7200 RPM', 'Bộ nhớ đệm': '256MB', 'Công nghệ': 'Multi-Tier Caching', 'Bảo hành': '2 năm' }, caps: [['1TB', 1_190_000], ['2TB', 1_590_000], ['4TB', 2_590_000]] },
    { name: 'WD Blue 3.5" HDD', brand: 'WD', tags: ['hdd', 'luu-tru'], kind: 'hdd', specs: { 'Chuẩn': 'SATA III 3.5"', 'Tốc độ quay': '5400–7200 RPM', 'Bộ nhớ đệm': '64–256MB', 'Công nghệ': 'NoTouch ramp load', 'Bảo hành': '2 năm' }, caps: [['1TB', 1_150_000], ['2TB', 1_550_000], ['4TB', 2_490_000]] },
    { name: 'Seagate IronWolf NAS HDD', brand: 'Seagate', tags: ['hdd', 'nas', 'luu-tru'], kind: 'hdd', specs: { 'Chuẩn': 'SATA III 3.5" CMR', 'Tốc độ quay': '5400–7200 RPM', 'Bộ nhớ đệm': '256MB', 'Công nghệ': 'AgileArray, IHM', 'Bảo hành': '3 năm' }, caps: [['4TB', 3_090_000], ['8TB', 5_690_000]] },
    { name: 'Kingston KC3000 NVMe PCIe 4.0', brand: 'Kingston', tags: ['nvme', 'pcie4', 'creator'], kind: 'm2', specs: { 'Chuẩn': 'M.2 2280 NVMe PCIe 4.0', 'Đọc tuần tự': '7000 MB/s', 'Ghi tuần tự': '7000 MB/s', 'Bộ nhớ': '3D TLC NAND', 'Bảo hành': '5 năm' }, caps: [['1TB', 2_390_000], ['2TB', 4_290_000]] },
  ],

  mainboard: [
    { name: 'ASUS ROG Strix Z790-E Gaming WiFi II', brand: 'ASUS', tags: ['lga1700', 'ddr5', 'oc'], specs: { Chipset: 'Intel Z790', Socket: 'LGA1700', 'Kích thước': 'ATX', 'Bộ nhớ': '4× DDR5, tối đa 192GB', 'Kết nối': 'WiFi 7, 2.5G LAN, 5× M.2' }, variants: [v('Bản tiêu chuẩn', 13_990_000), v('Bản kèm card mở rộng M.2', 14_690_000)] },
    { name: 'MSI MAG B760 Tomahawk WiFi', brand: 'MSI', tags: ['lga1700', 'gaming'], specs: { Chipset: 'Intel B760', Socket: 'LGA1700', 'Kích thước': 'ATX', 'Bộ nhớ': '4 khe, tối đa 192GB', 'Kết nối': 'WiFi 6E, 2.5G LAN, 3× M.2' }, variants: [v('DDR4', 5_190_000), v('DDR5', 5_590_000)] },
    { name: 'Gigabyte B650 AORUS Elite AX', brand: 'Gigabyte', tags: ['am5', 'ddr5', 'gaming'], specs: { Chipset: 'AMD B650', Socket: 'AM5', 'Kích thước': 'ATX', 'Bộ nhớ': '4× DDR5, tối đa 192GB', 'Kết nối': 'WiFi 6E, 2.5G LAN, 3× M.2' }, variants: [v('Bản V2', 5_890_000), v('Bản ICE (trắng)', 6_290_000)] },
    { name: 'ASUS TUF Gaming B650-Plus WiFi', brand: 'ASUS', tags: ['am5', 'ddr5'], specs: { Chipset: 'AMD B650', Socket: 'AM5', 'Kích thước': 'ATX', 'Bộ nhớ': '4× DDR5, tối đa 192GB', 'Kết nối': 'WiFi 6, 2.5G LAN, 3× M.2' }, variants: [v('Bản WiFi', 5_490_000), v('Bản không WiFi', 4_990_000)] },
    { name: 'MSI PRO B760M-A WiFi', brand: 'MSI', tags: ['lga1700', 'micro-atx', 'gia-re'], specs: { Chipset: 'Intel B760', Socket: 'LGA1700', 'Kích thước': 'Micro-ATX', 'Bộ nhớ': '4 khe, tối đa 192GB', 'Kết nối': 'WiFi 6E, 2.5G LAN, 2× M.2' }, variants: [v('DDR4', 3_290_000), v('DDR5', 3_690_000)] },
    { name: 'ASRock B650M Pro RS WiFi', brand: 'ASRock', tags: ['am5', 'micro-atx', 'gia-re'], specs: { Chipset: 'AMD B650', Socket: 'AM5', 'Kích thước': 'Micro-ATX', 'Bộ nhớ': '4× DDR5, tối đa 128GB', 'Kết nối': 'WiFi 6E, 2.5G LAN, 3× M.2' }, variants: [v('Bản WiFi', 3_990_000), v('Bản không WiFi', 3_590_000)] },
    { name: 'Gigabyte Z790 AORUS Elite AX', brand: 'Gigabyte', tags: ['lga1700', 'ddr5', 'oc'], specs: { Chipset: 'Intel Z790', Socket: 'LGA1700', 'Kích thước': 'ATX', 'Bộ nhớ': '4× DDR5, tối đa 192GB', 'Kết nối': 'WiFi 7, 2.5G LAN, 4× M.2' }, variants: [v('Bản Elite AX', 7_490_000), v('Bản Elite X AX (trắng)', 7_990_000)] },
    { name: 'ASUS Prime B760M-A', brand: 'ASUS', tags: ['lga1700', 'micro-atx', 'van-phong'], specs: { Chipset: 'Intel B760', Socket: 'LGA1700', 'Kích thước': 'Micro-ATX', 'Bộ nhớ': '4 khe, tối đa 128GB', 'Kết nối': '1G LAN, 2× M.2' }, variants: [v('DDR4', 2_790_000), v('DDR5 WiFi', 3_390_000)] },
    { name: 'MSI MPG X870E Carbon WiFi', brand: 'MSI', tags: ['am5', 'ddr5', 'oc'], specs: { Chipset: 'AMD X870E', Socket: 'AM5', 'Kích thước': 'ATX', 'Bộ nhớ': '4× DDR5, tối đa 256GB', 'Kết nối': 'WiFi 7, 5G LAN, 4× M.2, USB4' }, variants: [v('Bản tiêu chuẩn', 12_490_000), v('Bản kèm card M.2 Xpander', 12_990_000)] },
    { name: 'ASUS ROG Strix B850-F Gaming WiFi', brand: 'ASUS', tags: ['am5', 'ddr5', 'gaming'], specs: { Chipset: 'AMD B850', Socket: 'AM5', 'Kích thước': 'ATX', 'Bộ nhớ': '4× DDR5, tối đa 192GB', 'Kết nối': 'WiFi 7, 2.5G LAN, 4× M.2' }, variants: [v('Bản tiêu chuẩn', 7_990_000), v('Bản kèm ăng-ten Q-Antenna', 8_290_000)] },
  ],

  psu: [
    { name: 'Corsair RM850e ATX 3.1', brand: 'Corsair', tags: ['80-plus-gold', 'modular'], specs: { 'Chuẩn': 'ATX 3.1, PCIe 5.1', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm Zero RPM', 'Bảo hành': '7 năm' }, watts: [['750W', 2_690_000], ['850W', 2_990_000], ['1000W', 3_790_000]] },
    { name: 'Corsair RM1000x Shift', brand: 'Corsair', tags: ['80-plus-gold', 'modular', 'high-end'], specs: { 'Chuẩn': 'ATX 3.0, PCIe 5.0', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular (cắm cạnh)', 'Quạt': '140mm Zero RPM', 'Bảo hành': '10 năm' }, watts: [['850W', 4_290_000], ['1000W', 4_890_000], ['1200W', 5_990_000]] },
    { name: 'Cooler Master MWE Gold V2 Full Modular', brand: 'Cooler Master', tags: ['80-plus-gold', 'gia-re'], specs: { 'Chuẩn': 'ATX 3.1', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm HDB', 'Bảo hành': '5 năm' }, watts: [['650W', 1_890_000], ['750W', 2_190_000], ['850W', 2_590_000]] },
    { name: 'Seasonic Focus GX ATX 3', brand: 'Seasonic', tags: ['80-plus-gold', 'modular'], specs: { 'Chuẩn': 'ATX 3.0, PCIe 5.0', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm FDB', 'Bảo hành': '10 năm' }, watts: [['750W', 3_090_000], ['850W', 3_390_000], ['1000W', 4_190_000]] },
    { name: 'MSI MAG A750GL PCIE5', brand: 'MSI', tags: ['80-plus-gold'], specs: { 'Chuẩn': 'ATX 3.0, PCIe 5.0', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm', 'Bảo hành': '7 năm' }, watts: [['650W', 1_990_000], ['750W', 2_290_000], ['850W', 2_690_000]] },
    { name: 'NZXT C850 Gold V2', brand: 'NZXT', tags: ['80-plus-gold', 'modular'], specs: { 'Chuẩn': 'ATX 3.1', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm FDB', 'Bảo hành': '10 năm' }, watts: [['750W', 2_890_000], ['850W', 3_190_000]] },
    { name: 'Gigabyte UD850GM PG5', brand: 'Gigabyte', tags: ['80-plus-gold'], specs: { 'Chuẩn': 'ATX 3.0, PCIe 5.0', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm', 'Bảo hành': '5 năm' }, watts: [['750W', 2_390_000], ['850W', 2_690_000]] },
    { name: 'Thermaltake Toughpower GF A3', brand: 'Thermaltake', tags: ['80-plus-gold', 'modular'], specs: { 'Chuẩn': 'ATX 3.0, PCIe 5.0', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm Hydraulic', 'Bảo hành': '10 năm' }, watts: [['750W', 2_590_000], ['850W', 2_890_000], ['1050W', 3_690_000]] },
    { name: 'be quiet! Pure Power 12 M', brand: 'be quiet!', tags: ['80-plus-gold', 'silent'], specs: { 'Chuẩn': 'ATX 3.1, PCIe 5.1', 'Hiệu suất': '80 Plus Gold', 'Dạng dây': 'Full modular', 'Quạt': '120mm be quiet!', 'Bảo hành': '10 năm' }, watts: [['650W', 2_490_000], ['750W', 2_790_000], ['850W', 3_190_000]] },
    { name: 'ASUS ROG Thor II Platinum', brand: 'ASUS', tags: ['80-plus-platinum', 'high-end', 'rgb'], specs: { 'Chuẩn': 'ATX 3.0, PCIe 5.0', 'Hiệu suất': '80 Plus Platinum', 'Dạng dây': 'Full modular', 'Tính năng': 'Màn hình OLED hiển thị công suất', 'Bảo hành': '10 năm' }, watts: [['1000W', 7_490_000], ['1200W', 8_990_000]] },
  ],

  'pc-case': [
    { name: 'NZXT H5 Flow 2024', brand: 'NZXT', tags: ['mid-tower', 'airflow'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 365mm', 'Quạt kèm theo': '2× 120mm + 1× 120mm đáy', 'Tản nhiệt nước': 'tối đa 360mm', 'Chất liệu': 'Thép, kính cường lực' }, colors: 1_990_000 },
    { name: 'Corsair 4000D Airflow', brand: 'Corsair', tags: ['mid-tower', 'airflow'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 360mm', 'Quạt kèm theo': '2× 120mm AirGuide', 'Tản nhiệt nước': 'tối đa 360mm', 'Chất liệu': 'Thép, kính cường lực' }, colors: 2_290_000 },
    { name: 'Lian Li O11 Dynamic EVO', brand: 'Lian Li', tags: ['mid-tower', 'showcase'], specs: { 'Kích thước': 'Mid-tower E-ATX', 'Hỗ trợ VGA': 'tối đa 426mm', 'Quạt kèm theo': 'Không kèm', 'Tản nhiệt nước': '3× 360mm', 'Chất liệu': 'Nhôm, kính cường lực' }, colors: 3_990_000 },
    { name: 'Cooler Master MasterBox TD500 Mesh V2', brand: 'Cooler Master', tags: ['mid-tower', 'rgb'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 410mm', 'Quạt kèm theo': '3× 120mm ARGB', 'Tản nhiệt nước': 'tối đa 360mm', 'Chất liệu': 'Thép, lưới mesh, kính' }, colors: 2_190_000 },
    { name: 'Fractal Design North', brand: 'Fractal Design', tags: ['mid-tower', 'thiet-ke'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 355mm', 'Quạt kèm theo': '2× 140mm Aspect', 'Tản nhiệt nước': 'tối đa 360mm', 'Chất liệu': 'Thép, gỗ óc chó, kính' }, colors: 3_690_000 },
    { name: 'MSI MAG Forge 120A Airflow', brand: 'MSI', tags: ['mid-tower', 'gia-re', 'rgb'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 330mm', 'Quạt kèm theo': '6× 120mm ARGB', 'Tản nhiệt nước': 'tối đa 240mm', 'Chất liệu': 'Thép, kính cường lực' }, colors: 1_390_000 },
    { name: 'Montech AIR 903 Max', brand: 'Montech', tags: ['mid-tower', 'airflow'], specs: { 'Kích thước': 'Mid-tower E-ATX', 'Hỗ trợ VGA': 'tối đa 400mm', 'Quạt kèm theo': '4× 140mm', 'Tản nhiệt nước': 'tối đa 420mm', 'Chất liệu': 'Thép, lưới mesh, kính' }, colors: 2_390_000 },
    { name: 'Phanteks NV5', brand: 'Phanteks', tags: ['mid-tower', 'showcase'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 400mm', 'Quạt kèm theo': 'Không kèm', 'Tản nhiệt nước': 'tối đa 360mm', 'Chất liệu': 'Thép, kính cường lực panorama' }, colors: 2_690_000 },
    { name: 'ASUS TUF Gaming GT502', brand: 'ASUS', tags: ['mid-tower', 'showcase'], specs: { 'Kích thước': 'Mid-tower ATX', 'Hỗ trợ VGA': 'tối đa 400mm', 'Quạt kèm theo': 'Không kèm', 'Tản nhiệt nước': 'tối đa 360mm', 'Chất liệu': 'Thép, kính cường lực' }, colors: 3_290_000 },
    { name: 'Deepcool CH560 Digital', brand: 'Deepcool', tags: ['mid-tower', 'rgb'], specs: { 'Kích thước': 'Mid-tower E-ATX', 'Hỗ trợ VGA': 'tối đa 380mm', 'Quạt kèm theo': '3× 140mm + 1× 120mm ARGB', 'Tính năng': 'Màn hình nhiệt độ CPU/GPU', 'Chất liệu': 'Thép, lưới mesh, kính' }, colors: 2_590_000 },
  ],
};

/** Expands category-specific shorthand (caps/watts/colors/RAM kits) into variant lists. */
export function variantsFor(category, p) {
  if (p.variants) return p.variants;
  if (p.caps) return p.caps.map(([cap, price]) => v(cap, price));
  if (p.watts) return p.watts.map(([w, price]) => v(w, price));
  if (category === 'pc-case') return [v('Màu đen', p.colors), v('Màu trắng', p.colors + 200_000)];
  if (category === 'ram') {
    const ddr5 = p.specs['Chuẩn'].startsWith('DDR5');
    const base = ddr5 ? 1_590_000 : 890_000;
    const factor = /6400|6000/.test(p.specs.Bus) ? 1.25 : /3600/.test(p.specs.Bus) ? 1.1 : 1;
    const r = (n) => Math.round((n * factor) / 10_000) * 10_000 - 10_000;
    return [v('16GB (2×8GB)', r(base)), v('32GB (2×16GB)', r(base * 1.85)), v('64GB (2×32GB)', r(base * 3.6))];
  }
  throw new Error(`No variants for ${p.name}`);
}

const INTRO = {
  laptop: (p) => `${p.name} là mẫu laptop ${p.tags.includes('gaming') ? 'gaming hiệu năng cao' : 'mỏng nhẹ, bền bỉ'} đến từ ${p.brand}.`,
  'desktop-pc': (p) => `${p.name} là bộ máy tính để bàn nguyên chiếc của ${p.brand}, lắp ráp và kiểm tra sẵn tại nhà máy.`,
  monitor: (p) => `${p.name} là màn hình ${p.specs['Tấm nền']} của ${p.brand} với độ phân giải ${p.specs['Độ phân giải']}.`,
  cpu: (p) => `${p.name} là bộ vi xử lý ${p.brand} dành cho socket ${p.specs.Socket}.`,
  gpu: (p) => `${p.name} sử dụng nhân đồ họa ${p.specs.GPU} với ${p.specs['Bộ nhớ']}.`,
  ram: (p) => `${p.name} là bộ nhớ ${p.specs['Chuẩn']} tốc độ ${p.specs.Bus} của ${p.brand}.`,
  storage: (p) => `${p.name} là ổ lưu trữ chuẩn ${p.specs['Chuẩn']} của ${p.brand}.`,
  mainboard: (p) => `${p.name} là bo mạch chủ chipset ${p.specs.Chipset}, socket ${p.specs.Socket}, kích thước ${p.specs['Kích thước']}.`,
  psu: (p) => `${p.name} là bộ nguồn đạt chuẩn ${p.specs['Hiệu suất']} từ ${p.brand}.`,
  'pc-case': (p) => `${p.name} là vỏ máy tính ${p.specs['Kích thước']} của ${p.brand}.`,
};

const USAGE = {
  laptop: 'Phù hợp cho học tập, làm việc văn phòng, sáng tạo nội dung và giải trí ở mọi nơi.',
  'desktop-pc': 'Cắm điện là dùng ngay: phù hợp cho gia đình, văn phòng, học tập và giải trí.',
  monitor: 'Lựa chọn lý tưởng cho chơi game, làm việc đa nhiệm và xem phim với màu sắc sống động.',
  cpu: 'Đáp ứng tốt chơi game, livestream, dựng video và các tác vụ đa luồng nặng.',
  gpu: 'Chiến mượt các tựa game AAA, hỗ trợ ray tracing, upscale bằng AI và tăng tốc phần mềm đồ họa.',
  ram: 'Nâng cấp dễ dàng, tăng tốc đa nhiệm, chơi game và làm việc với phần mềm nặng.',
  storage: 'Rút ngắn thời gian khởi động, mở ứng dụng và tải game; lưu trữ dữ liệu an toàn lâu dài.',
  mainboard: 'Nền tảng vững chắc để build PC chơi game, làm việc hoặc ép xung.',
  psu: 'Cấp điện ổn định, an toàn cho dàn PC chơi game và máy trạm công suất cao.',
  'pc-case': 'Không gian rộng rãi, đi dây gọn gàng, luồng gió tối ưu cho dàn PC của bạn.',
};

/** ≥ 5 lines of real descriptive text built from the product's own specs. */
export function describe(category, p) {
  const specLines = Object.entries(p.specs).map(([k, val]) => `${k}: ${val}.`);
  return [
    INTRO[category](p),
    ...specLines.slice(0, 4),
    USAGE[category],
    `Hàng chính hãng ${p.brand}, bảo hành theo tiêu chuẩn nhà sản xuất, hỗ trợ đổi mới trong 7 ngày nếu có lỗi phần cứng.`,
  ].join('\n');
}
