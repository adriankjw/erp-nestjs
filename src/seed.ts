import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { User } from './users/user.entity';
import { Product } from './products/product.entity';
import { Warehouse } from './inventory/warehouse.entity';
import { StockItem } from './inventory/stock-item.entity';
import { Customer } from './customers/customer.entity';
import { Supplier } from './suppliers/supplier.entity';
import { UserRole, CustomerType } from './common/enums';

async function seed() {
  const ds = await AppDataSource.initialize();
  console.log('Connected to database, seeding mock data...');

  const userRepo = ds.getRepository(User);
  const productRepo = ds.getRepository(Product);
  const warehouseRepo = ds.getRepository(Warehouse);
  const stockRepo = ds.getRepository(StockItem);
  const customerRepo = ds.getRepository(Customer);
  const supplierRepo = ds.getRepository(Supplier);

  // ---- Users ----
  const usersData = [
    { name: 'Ava Admin', email: 'admin@shop.test', password: 'password123', role: UserRole.ADMIN, department: 'Management' },
    { name: 'Mo Manager', email: 'manager@shop.test', password: 'password123', role: UserRole.MANAGER, department: 'Operations' },
    { name: 'Sam Staff', email: 'staff@shop.test', password: 'password123', role: UserRole.STAFF, department: 'Warehouse' },
  ];
  for (const u of usersData) {
    const exists = await userRepo.findOne({ where: { email: u.email } });
    if (!exists) {
      await userRepo.save(userRepo.create({ ...u, password: await bcrypt.hash(u.password, 10) }));
    }
  }
  console.log('Users seeded (login with admin@shop.test / password123)');

  // ---- Warehouses ----
  let mainWarehouse = await warehouseRepo.findOne({ where: { name: 'Main Fulfillment Center' } });
  if (!mainWarehouse) {
    mainWarehouse = await warehouseRepo.save(
      warehouseRepo.create({ name: 'Main Fulfillment Center', location: 'Kuala Lumpur, MY' }),
    );
  }
  let secondaryWarehouse = await warehouseRepo.findOne({ where: { name: 'North Regional Warehouse' } });
  if (!secondaryWarehouse) {
    secondaryWarehouse = await warehouseRepo.save(
      warehouseRepo.create({ name: 'North Regional Warehouse', location: 'Penang, MY' }),
    );
  }
  console.log('Warehouses seeded');

  // ---- Products ----
  const productsData = [
    { sku: 'SKU-TSHIRT-001', name: 'Classic Cotton T-Shirt', category: 'Apparel', unitPrice: 19.99, costPrice: 7.5, reorderLevel: 20 },
    { sku: 'SKU-MUG-002', name: 'Ceramic Coffee Mug', category: 'Home Goods', unitPrice: 12.5, costPrice: 4.0, reorderLevel: 15 },
    { sku: 'SKU-HEADPHONE-003', name: 'Wireless Headphones', category: 'Electronics', unitPrice: 89.99, costPrice: 45.0, reorderLevel: 10 },
    { sku: 'SKU-NOTEBOOK-004', name: 'Recycled Paper Notebook', category: 'Stationery', unitPrice: 6.99, costPrice: 2.1, reorderLevel: 30 },
    { sku: 'SKU-BACKPACK-005', name: 'Everyday Backpack', category: 'Accessories', unitPrice: 49.99, costPrice: 22.0, reorderLevel: 12 },
  ];
  const savedProducts: Product[] = [];
  for (const p of productsData) {
    let product = await productRepo.findOne({ where: { sku: p.sku } });
    if (!product) product = await productRepo.save(productRepo.create(p));
    savedProducts.push(product);
  }
  console.log('Products seeded');

  // ---- Initial stock ----
  const initialStock = [40, 60, 8, 100, 25]; // deliberately puts headphones below reorder level
  for (let i = 0; i < savedProducts.length; i++) {
    const existing = await stockRepo.findOne({
      where: { product: { id: savedProducts[i].id }, warehouse: { id: mainWarehouse.id } },
    });
    if (!existing) {
      await stockRepo.save(
        stockRepo.create({ product: savedProducts[i], warehouse: mainWarehouse, quantity: initialStock[i] }),
      );
    }
  }
  console.log('Initial stock levels seeded (Wireless Headphones intentionally low, for the low-stock report)');

  // ---- Customers ----
  const customersData = [
    { name: 'Nora Lim', email: 'nora.lim@example.com', phone: '+60-12-345-6789', address: 'Kajang, Selangor, MY', type: CustomerType.RETAIL },
    { name: 'Bright Retail Sdn Bhd', email: 'purchasing@brightretail.example', phone: '+60-3-9876-5432', address: 'Petaling Jaya, Selangor, MY', type: CustomerType.WHOLESALE },
  ];
  for (const c of customersData) {
    const exists = await customerRepo.findOne({ where: { email: c.email } });
    if (!exists) await customerRepo.save(customerRepo.create(c));
  }
  console.log('Customers seeded');

  // ---- Suppliers ----
  const suppliersData = [
    { name: 'Global Textiles Co.', email: 'sales@globaltextiles.example', phone: '+86-21-5555-0101', address: 'Shanghai, CN' },
    { name: 'TechParts Distribution', email: 'orders@techparts.example', phone: '+1-415-555-0199', address: 'San Jose, CA, US' },
  ];
  for (const s of suppliersData) {
    const exists = await supplierRepo.findOne({ where: { email: s.email } });
    if (!exists) await supplierRepo.save(supplierRepo.create(s));
  }
  console.log('Suppliers seeded');

  console.log('\nSeed complete. Warehouses, products, stock, customers, suppliers, and users are ready.');
  console.log('Try logging in via POST /auth/login, then explore /docs for the full API.');

  await ds.destroy();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
