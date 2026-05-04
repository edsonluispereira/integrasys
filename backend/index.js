import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import manufacturingRoutes from './routes/manufacturing.js';
import financialRoutes from './routes/financial.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import materialRoutes from './routes/materials.js';
import dashboardRoutes from './routes/dashboard.js';
import paymentMethodRoutes from './routes/paymentMethods.js';
import userRoutes from './routes/users.js';
import supplierRoutes from './routes/suppliers.js';
import nfeRoutes from './routes/nfe.js';
import backupRoutes from './routes/backup.js';


// App setup
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Integrasys API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/users', userRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/nfe', nfeRoutes);
app.use('/api/backup', backupRoutes);

// App listen

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
