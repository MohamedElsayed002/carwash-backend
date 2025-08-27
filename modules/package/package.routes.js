const express = require('express');
const router = express.Router();
const packageController = require('./package.controller');
const auth = require('../../middleware/auth');


router.get('/', packageController.getAllPackages);
router.get('/get-single-package-id/:id', packageController.getPackageByIdAndSize);
router.get('/get-size-packages/:size', packageController.getPackagesBySize)
// router.post('/',  packageController.c);
// router.get('/', packageController.getPackage);
// router.get('/type/:type', packageController.getPackagesByType);
// router.post('/scan-info', auth, packageController.scanInfo);
// router.post('/scan-qr', auth, packageController.scanQRCode);
// router.post('/start-wash', auth, packageController.startWash);
// router.get('/:id', packageController.getPackage);
// router.put('/:id', auth, packageController.updatePackage);
// router.delete('/:id', auth, packageController.deletePackage);

module.exports = router; 