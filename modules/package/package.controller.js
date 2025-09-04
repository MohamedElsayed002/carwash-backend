const UserPackage = require("./userPackage.model");
const Wash = require("../wash/wash.model");
const User = require("../user/user.model");
const Package = require("./package.model");
const WashingPlace = require("../washingPlace/washingPlace.model");
const { sendNotification } = require("../../services/notification");


// controllers/packageController.js
// controllers/packageController.js
const mongoose = require('mongoose');

// ----------------- price table -----------------
const packagePrices = {
  small: {
    basic: { price: 150, originalPrice: 235, savings: 85, washes: 5, paidWashes: 4, freeWashes: 1 },
    advanced: { price: 280, originalPrice: 420, savings: 140, washes: 10, paidWashes: 8, freeWashes: 2 },
    premium: { price: 490, originalPrice: 770, savings: 280, washes: 18, paidWashes: 14, freeWashes: 4 },
    vip: { price: 150, originalPrice: 235, savings: 85, washes: 1, paidWashes: 1, freeWashes: 0 }
  },
  medium: {
    basic: { price: 180, originalPrice: 270, savings: 90, washes: 5, paidWashes: 4, freeWashes: 1 },
    advanced: { price: 320, originalPrice: 480, savings: 160, washes: 10, paidWashes: 8, freeWashes: 2 },
    premium: { price: 530, originalPrice: 830, savings: 300, washes: 18, paidWashes: 14, freeWashes: 4 },
    vip: { price: 150, originalPrice: 235, savings: 85, washes: 1, paidWashes: 1, freeWashes: 0 }
  },
  large: {
    basic: { price: 220, originalPrice: 330, savings: 110, washes: 5, paidWashes: 4, freeWashes: 1 },
    advanced: { price: 360, originalPrice: 540, savings: 180, washes: 10, paidWashes: 8, freeWashes: 2 },
    premium: { price: 570, originalPrice: 890, savings: 320, washes: 18, paidWashes: 14, freeWashes: 4 },
    vip: { price: 150, originalPrice: 235, savings: 85, washes: 1, paidWashes: 1, freeWashes: 0 }
  }
};

// --------------- name -> key map ----------------
const nameToKey = {
  'الباقة الأساسية': 'basic',
  'الباقة المتقدمة': 'advanced',
  'الباقة الشاملة': 'premium',
  'الباقة VIP': 'vip',
  'الباقة vip': 'vip',
  'الباقة Vip': 'vip'
};

// --------------- staticPackages (exact array) --------------
const staticPackages = [
  {
    "_id": "68a51a102389fb217ed65ef3",
    "name": "الباقة الأساسية",
    "basePrice": 150,
    "originalPrice": 235,
    "features": ["غسيل  خارجي","مسار خاص و سريع للعضاء","تلميع و اهتمام خاص"],
    "popular": false,
    "washes": 5,
    "savings": 20,
    "duration": 30,
    "size": "medium",
    "__v": 0,
    "createdAt": "2025-08-20T00:42:56.846Z",
    "updatedAt": "2025-08-22T18:56:01.199Z"
  },
  {
    "_id": "68a51a102389fb217ed65ef4",
    "name": "الباقة المتقدمة",
    "basePrice": 280,
    "originalPrice": 420,
    "features": ["شامله مميزات باقه سابقه","غسيل خارجي و داخلي"],
    "popular": true,
    "washes": 10,
    "savings": 30,
    "duration": 45,
    "size": "medium",
    "__v": 0,
    "createdAt": "2025-08-20T00:42:56.846Z",
    "updatedAt": "2025-08-22T18:51:07.014Z"
  },
  {
    "_id": "68a51a102389fb217ed65ef5",
    "name": "الباقة الشاملة",
    "basePrice": 490,
    "originalPrice": 770,
    "features": ["شامله مميزات باقات السابقه"],
    "popular": false,
    "washes": 18,
    "savings": 40,
    "duration": 60,
    "size": "large",
    "__v": 0,
    "createdAt": "2025-08-20T00:42:56.847Z",
    "updatedAt": "2025-08-22T18:51:46.341Z"
  },
  {
    "_id": "68a51a102389fb217ed65ef6",
    "name": "الباقة VIP",
    "basePrice": 150,
    "originalPrice": 235,
    "features": ["غسيل شامل", "تلميع فاخر", "شمع حماية", "معطر فاخر"],
    "popular": false,
    "washes": 1,
    "savings": 50,
    "duration": 90,
    "size": "large",
    "__v": 0,
    "createdAt": "2025-08-20T00:42:56.847Z",
    "updatedAt": "2025-08-22T18:57:10.414Z"
  }
];

// --------------- optional Mongoose model -------------------
let PackageModel = null;
try {
  PackageModel = require('../models/Package'); // adjust path if needed
} catch (err) {
  PackageModel = null;
}

// debug: print staticPackages length when server starts (remove later)
console.log('controllers/packageController.js loaded — staticPackages.length =', staticPackages.length);

// ---------------- helpers ----------------
function mapPackagePrices(pkg, size) {
  const key = nameToKey[pkg.name];
  if (!key) return { ...pkg, size };

  const priceInfo = packagePrices[size] && packagePrices[size][key];
  if (!priceInfo) return { ...pkg, size };

  return {
    ...pkg,
    size,
    basePrice: priceInfo.price,
    originalPrice: priceInfo.originalPrice,
    savings: priceInfo.savings,
    washes: priceInfo.washes,
    paidWashes: priceInfo.paidWashes,
    freeWashes: priceInfo.freeWashes
  };
}

// ---------------- endpoints ----------------

exports.getPackagesBySize = async (req, res) => {
  const size = (req.params.size || req.query.size || 'medium').toLowerCase();
  if (!['small', 'medium', 'large'].includes(size)) {
    return res.status(400).json({ error: 'Invalid size' });
  }

  try {
    const packages = PackageModel ? await PackageModel.find({}).lean() : staticPackages;
    const mapped = packages.map(p => mapPackagePrices(p, size));
    return res.json(mapped);
  } catch (err) {
    console.error('getPackagesBySize error:', err);
    const mapped = staticPackages.map(p => mapPackagePrices(p, size));
    return res.json(mapped);
  }
};

exports.getPackageByIdAndSize = async (req, res) => {
  const { id } = req.params;
  const size = (req.query.size || 'medium').toLowerCase();

  if (!['small', 'medium', 'large'].includes(size)) {
    return res.status(400).json({ error: 'Invalid size' });
  }

  try {
    let pkg = null;

    if (PackageModel) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid package id format.' });
      }
      pkg = await PackageModel.findById(id).lean();
      if (!pkg) return res.status(404).json({ error: 'Package not found.' });
    } else {
      // compare ids as strings (trimmed)
      const normalizedId = String(id).trim();
      console.log('looking for package id (normalized):', normalizedId);
      console.log('staticPackages ids:', staticPackages.map(p => String(p._id)));

      pkg = staticPackages.find(p => String(p._id).trim() === normalizedId);
      if (!pkg) return res.status(404).json({ error: 'Package not found (static).' });
    }

    const mapped = mapPackagePrices(pkg, size);
    return res.json(mapped);
  } catch (err) {
    console.error('getPackageByIdAndSize error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
};


exports.getPackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all packages
exports.getAllPackages = async (req, res) => {
  try {
    // Return static packages for now
    res.json({
      success: true,
      packages: staticPackages,
      count: staticPackages.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
