import app from './app.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

import { faker } from '@faker-js/faker';
import Order from './modules/order/order.model.js';
import mongoose from 'mongoose';

dotenv.config();
connectDB();

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('Hello, e-commerce Backend!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ------------------ SEED DATA ------------------

const products = ["Burger", "Pizza", "Pasta", "Salad", "Coffee", "Sandwich"];
const attributes = ["spicy", "large", "extra cheese", "no onion", "gluten free"];
const selectionNames = ["Size", "Sauce", "Drink"];
const selectionValues = ["Small", "Medium", "Large", "Coke", "Water", "BBQ", "Mayo"];
const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const randomFrom = arr => arr[Math.floor(Math.random() * arr.length)];

function generateItems() {
  const count = faker.number.int({ min: 1, max: 5 });

  return Array.from({ length: count }, () => ({
    productId: new mongoose.Types.ObjectId(),
    name: randomFrom(products),
    price: faker.number.float({ min: 5, max: 50, precision: 0.01 }),
    attributes: faker.helpers.arrayElements(attributes, {
      min: 1,
      max: 3
    }),
    selections: Array.from(
      { length: faker.number.int({ min: 1, max: 2 }) },
      () => ({
        name: randomFrom(selectionNames),
        value: randomFrom(selectionValues)
      })
    ),
    quantity: faker.number.int({ min: 1, max: 4 })
  }));
}

async function seedOrdersOnce() {
  const existing = await Order.countDocuments();

  if (existing > 0) {
    console.log("📦 Orders already exist — skipping seed");
    return;
  }

  const orders = [];

  for (let i = 0; i < 1000; i++) {

    const from = new Date(2026, 0, 31);
  
    const to = new Date();
    to.setMonth(to.getMonth() - 3);
  
    const start = from < to ? from : to;
    const end = from < to ? to : from;
  
    const createdAt = faker.date.between({
      from: start,
      to: end
    });
  
    orders.push({
      orderNumber: `ORD-${faker.number.int({ min: 100000, max: 999999 })}`,
      userId: new mongoose.Types.ObjectId(),
      locationId: new mongoose.Types.ObjectId(),
      items: generateItems(),
      totalPrice: faker.number.float({ min: 20, max: 200, precision: 0.01 }),
      shippingFee: faker.number.float({ min: 0, max: 10, precision: 0.01 }),
      paymentMethod: "cash",
      status: randomFrom(statuses),
      createdAt,
      updatedAt: createdAt
    });
  }

  await Order.insertMany(orders);
  console.log("✅ Orders seeded successfully!");
}

// seedOrdersOnce().catch(console.error);

