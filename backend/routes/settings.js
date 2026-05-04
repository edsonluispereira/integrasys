import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get settings
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.companySettings.findFirst();
    if (!settings) {
      return res.json({});
    }
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update or create settings
router.put('/', async (req, res) => {
  const { 
    name, cnpj, address, phone, email, logo_data,
    ie, im, crt, ibge_city_code, certificate_pfx, certificate_pass 
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'O nome da empresa é obrigatório.' });
  }

  try {
    const existingSettings = await prisma.companySettings.findFirst();
    const data = { 
      name, cnpj, address, phone, email, logo_data,
      ie, im, crt, ibge_city_code, certificate_pfx, certificate_pass
    };

    let settings;
    if (existingSettings) {
      settings = await prisma.companySettings.update({
        where: { id: existingSettings.id },
        data
      });
    } else {
      settings = await prisma.companySettings.create({
        data
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
