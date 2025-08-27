const Car = require('./car.model');

exports.createCar = async (req, res) => {
  try {
    const car = new Car({ ...req.body, user: req.user._id });
    await car.save();
    res.status(201).json(car);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getCars = async (req, res) => {
  try {
    const cars = await Car.find({ user: req.user._id });
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCar = async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, user: req.user._id });
    if (!car) return res.status(404).json({ error: 'Car not found' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserCars = async (req, res) => {
  console.log("req.user:", req.user.id); // Debug here
  try {
    const cars = await Car.find({ user: req.user.id });
    if (!cars.length) return res.status(404).json({ error: "Car not found" });
    return res.json(cars);
  } catch (error) {
    res.status(500).json({ error });
  }
};


exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!car) return res.status(404).json({ error: 'Car not found' });
    res.json(car);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!car) return res.status(404).json({ error: 'Car not found' });
    res.json({ message: 'Car deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 