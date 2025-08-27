const express = require('express');
const router = express.Router();
const carController = require('./car.controller');
const auth = require('../../middleware/auth');

router.get('/get-user-cars',auth,carController.getUserCars)
router.post('/', auth, carController.createCar);
router.get('/', auth, carController.getCars);
router.get('/:id', auth, carController.getCar);
router.put('/:id', auth, carController.updateCar);
router.delete('/:id', auth, carController.deleteCar);

module.exports = router; 