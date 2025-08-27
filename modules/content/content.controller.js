const Content = require('./content.model');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/content';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// GET /api/content/homepage (Get homepage content)
exports.getHomepageContent = async (req, res) => {
    try {
        const content = await Content.findOne({
            type: 'homepage',
            isActive: true
        }).sort({ version: -1 });

        if (!content) {
            return res.json({
                success: true,
                data: {
                    title: 'Car Washer - Professional Car Washing Services',
                    content: {
                        hero: {
                            title: 'Professional Car Washing Services',
                            subtitle: 'Keep your car clean and shiny with our premium washing services',
                            ctaText: 'Book Now',
                            ctaLink: '/packages'
                        },
                        features: [
                            {
                                title: 'Professional Service',
                                description: 'Expert car washing with attention to detail',
                                icon: 'car-wash'
                            },
                            {
                                title: 'Multiple Packages',
                                description: 'Choose from various washing packages',
                                icon: 'package'
                            },
                            {
                                title: 'Convenient Locations',
                                description: 'Multiple branches across the city',
                                icon: 'location'
                            }
                        ]
                    },
                    metadata: {
                        description: 'Professional car washing services with multiple packages and convenient locations',
                        keywords: ['car wash', 'car cleaning', 'professional service']
                    }
                }
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/content/homepage (Save homepage content)
exports.saveHomepageContent = async (req, res) => {
    try {
        const { title, content, metadata } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Get current version
        const currentContent = await Content.findOne({
            type: 'homepage'
        }).sort({ version: -1 });

        const newVersion = currentContent ? currentContent.version + 1 : 1;

        // Deactivate previous version
        if (currentContent) {
            currentContent.isActive = false;
            await currentContent.save();
        }

        // Create new content
        const newContent = new Content({
            type: 'homepage',
            title,
            content,
            metadata,
            version: newVersion,
            publishedAt: new Date(),
            publishedBy: req.user._id
        });

        await newContent.save();

        res.status(201).json({
            success: true,
            message: 'Homepage content saved successfully',
            data: newContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/content/services (Get services content)
exports.getServicesContent = async (req, res) => {
    try {
        const content = await Content.findOne({
            type: 'services',
            isActive: true
        }).sort({ version: -1 });

        if (!content) {
            return res.json({
                success: true,
                data: {
                    title: 'Our Services',
                    content: {
                        services: [
                            {
                                name: 'Basic Wash',
                                description: 'Exterior wash with basic cleaning',
                                price: 50,
                                duration: '30 minutes',
                                features: ['Exterior wash', 'Tire cleaning', 'Window cleaning']
                            },
                            {
                                name: 'Premium Wash',
                                description: 'Complete exterior and interior cleaning',
                                price: 100,
                                duration: '60 minutes',
                                features: ['Exterior wash', 'Interior cleaning', 'Tire dressing', 'Air freshener']
                            },
                            {
                                name: 'VIP Wash',
                                description: 'Premium service with extra attention to detail',
                                price: 150,
                                duration: '90 minutes',
                                features: ['Premium wash', 'Waxing', 'Interior detailing', 'Tire shine']
                            }
                        ]
                    }
                }
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/content/services (Save services content)
exports.saveServicesContent = async (req, res) => {
    try {
        const { title, content, metadata } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Get current version
        const currentContent = await Content.findOne({
            type: 'services'
        }).sort({ version: -1 });

        const newVersion = currentContent ? currentContent.version + 1 : 1;

        // Deactivate previous version
        if (currentContent) {
            currentContent.isActive = false;
            await currentContent.save();
        }

        // Create new content
        const newContent = new Content({
            type: 'services',
            title,
            content,
            metadata,
            version: newVersion,
            publishedAt: new Date(),
            publishedBy: req.user._id
        });

        await newContent.save();

        res.status(201).json({
            success: true,
            message: 'Services content saved successfully',
            data: newContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/content/packages (Get packages content)
exports.getPackagesContent = async (req, res) => {
    try {
        const content = await Content.findOne({
            type: 'packages',
            isActive: true
        }).sort({ version: -1 });

        if (!content) {
            return res.json({
                success: true,
                data: {
                    title: 'Washing Packages',
                    content: {
                        packages: [
                            {
                                name: 'Single Wash',
                                description: 'One-time car wash service',
                                price: 75,
                                washes: 1,
                                validity: '1 day'
                            },
                            {
                                name: 'Monthly Package',
                                description: '10 washes per month',
                                price: 500,
                                washes: 10,
                                validity: '30 days'
                            },
                            {
                                name: 'Yearly Package',
                                description: 'Unlimited washes for one year',
                                price: 2000,
                                washes: 'unlimited',
                                validity: '365 days'
                            }
                        ]
                    }
                }
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/content/packages (Save packages content)
exports.savePackagesContent = async (req, res) => {
    try {
        const { title, content, metadata } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Get current version
        const currentContent = await Content.findOne({
            type: 'packages'
        }).sort({ version: -1 });

        const newVersion = currentContent ? currentContent.version + 1 : 1;

        // Deactivate previous version
        if (currentContent) {
            currentContent.isActive = false;
            await currentContent.save();
        }

        // Create new content
        const newContent = new Content({
            type: 'packages',
            title,
            content,
            metadata,
            version: newVersion,
            publishedAt: new Date(),
            publishedBy: req.user._id
        });

        await newContent.save();

        res.status(201).json({
            success: true,
            message: 'Packages content saved successfully',
            data: newContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// POST /api/content/upload-image (Upload image)
exports.uploadImage = async (req, res) => {
    try {
        upload.single('file')(req, res, async function (err) {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const imageUrl = `/uploads/content/${req.file.filename}`;

            res.json({
                success: true,
                message: 'Image uploaded successfully',
                data: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    url: imageUrl
                }
            });
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/content/:type (Get content by type)
exports.getContentByType = async (req, res) => {
    try {
        const { type } = req.params;

        const content = await Content.findOne({
            type,
            isActive: true
        }).sort({ version: -1 });

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// GET /api/content (Get all content)
exports.getAllContent = async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (type) {
            filter.type = type;
        }

        const content = await Content.find(filter)
            .populate('publishedBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Content.countDocuments(filter);

        res.json({
            success: true,
            data: {
                content,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
