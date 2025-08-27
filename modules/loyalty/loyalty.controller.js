const User = require('../user/user.model');
const Wash = require('../wash/wash.model');
const Payment = require('../payment/payment.model');

// ========================================
// LOYALTY POINTS SYSTEM
// ========================================

// GET /api/loyalty/points
exports.getPointsSystem = async (req, res) => {
  try {
    const { userId } = req.query;

    if (userId) {
      // Get specific user's points
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userPoints = {
        userId: user._id,
        userName: user.name,
        currentPoints: user.loyaltyPoints || 0,
        totalEarned: user.totalLoyaltyPoints || 0,
        totalRedeemed: user.redeemedPoints || 0,
        level: getUserLevel(user.loyaltyPoints || 0),
        nextLevel: getNextLevel(user.loyaltyPoints || 0),
        pointsToNextLevel: getPointsToNextLevel(user.loyaltyPoints || 0)
      };

      res.json({
        success: true,
        message: 'User points retrieved successfully',
        data: userPoints
      });
    } else {
      // Get points system configuration
      const pointsSystem = {
        earnRate: {
          perOrder: 10,
          perRiyal: 1,
          bonusMultiplier: 1.5
        },
        levels: [
          { name: 'برونزي', minPoints: 0, maxPoints: 99, discount: 5 },
          { name: 'فضي', minPoints: 100, maxPoints: 499, discount: 10 },
          { name: 'ذهبي', minPoints: 500, maxPoints: 999, discount: 15 },
          { name: 'بلاتيني', minPoints: 1000, maxPoints: 1999, discount: 20 },
          { name: 'الماس', minPoints: 2000, maxPoints: null, discount: 25 }
        ],
        expiration: {
          enabled: true,
          months: 12
        }
      };

      res.json({
        success: true,
        message: 'Points system configuration retrieved successfully',
        data: pointsSystem
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/loyalty/points/earn
exports.earnPoints = async (req, res) => {
  try {
    const { userId, orderId, amount, points } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate points to earn
    const pointsToEarn = points || Math.floor(amount * 1); // 1 point per riyal

    // Update user points
    user.loyaltyPoints = (user.loyaltyPoints || 0) + pointsToEarn;
    user.totalLoyaltyPoints = (user.totalLoyaltyPoints || 0) + pointsToEarn;
    await user.save();

    const pointsTransaction = {
      userId: user._id,
      orderId,
      type: 'earn',
      points: pointsToEarn,
      amount,
      timestamp: new Date().toISOString(),
      description: `Earned ${pointsToEarn} points from order #${orderId}`
    };

    res.json({
      success: true,
      message: 'Points earned successfully',
      data: {
        newBalance: user.loyaltyPoints,
        earned: pointsToEarn,
        transaction: pointsTransaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/loyalty/points/redeem
exports.redeemPoints = async (req, res) => {
  try {
    const { userId, points, orderId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if ((user.loyaltyPoints || 0) < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Update user points
    user.loyaltyPoints = (user.loyaltyPoints || 0) - points;
    user.redeemedPoints = (user.redeemedPoints || 0) + points;
    await user.save();

    const pointsTransaction = {
      userId: user._id,
      orderId,
      type: 'redeem',
      points: -points,
      timestamp: new Date().toISOString(),
      description: `Redeemed ${points} points for order #${orderId}`
    };

    res.json({
      success: true,
      message: 'Points redeemed successfully',
      data: {
        newBalance: user.loyaltyPoints,
        redeemed: points,
        transaction: pointsTransaction
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// REWARDS MANAGEMENT
// ========================================

// GET /api/loyalty/rewards
exports.getRewards = async (req, res) => {
  try {
    const { userId, category } = req.query;

    const rewards = [
      {
        id: 1,
        name: 'خصم 10% على الطلب التالي',
        description: 'خصم 10% على قيمة الطلب التالي',
        category: 'discount',
        pointsRequired: 100,
        value: 10,
        type: 'percentage',
        isActive: true,
        image: 'discount-icon.png'
      },
      {
        id: 2,
        name: 'غسيل مجاني',
        description: 'غسيل خارجي مجاني',
        category: 'service',
        pointsRequired: 200,
        value: 50,
        type: 'service',
        isActive: true,
        image: 'free-wash-icon.png'
      },
      {
        id: 3,
        name: 'خصم 25 ريال',
        description: 'خصم 25 ريال على أي طلب',
        category: 'discount',
        pointsRequired: 250,
        value: 25,
        type: 'fixed',
        isActive: true,
        image: 'money-icon.png'
      },
      {
        id: 4,
        name: 'ترقية الباقة',
        description: 'ترقية مجانية للباقة الأعلى',
        category: 'upgrade',
        pointsRequired: 500,
        value: 100,
        type: 'upgrade',
        isActive: true,
        image: 'upgrade-icon.png'
      }
    ];

    let filteredRewards = rewards;
    if (category) {
      filteredRewards = rewards.filter(reward => reward.category === category);
    }

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userPoints = user.loyaltyPoints || 0;
        filteredRewards = filteredRewards.map(reward => ({
          ...reward,
          canRedeem: userPoints >= reward.pointsRequired
        }));
      }
    }

    res.json({
      success: true,
      message: 'Rewards retrieved successfully',
      data: filteredRewards
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/loyalty/rewards/redeem
exports.redeemReward = async (req, res) => {
  try {
    const { userId, rewardId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mock reward data
    const reward = {
      id: rewardId,
      name: 'خصم 10% على الطلب التالي',
      pointsRequired: 100,
      value: 10,
      type: 'percentage'
    };

    if ((user.loyaltyPoints || 0) < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points for this reward'
      });
    }

    // Update user points
    user.loyaltyPoints = (user.loyaltyPoints || 0) - reward.pointsRequired;
    user.redeemedPoints = (user.redeemedPoints || 0) + reward.pointsRequired;
    await user.save();

    const rewardRedemption = {
      userId: user._id,
      rewardId,
      rewardName: reward.name,
      pointsSpent: reward.pointsRequired,
      value: reward.value,
      type: reward.type,
      redeemedAt: new Date().toISOString(),
      status: 'active'
    };

    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: {
        newBalance: user.loyaltyPoints,
        redemption: rewardRedemption
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// LOYALTY LEVELS
// ========================================

// GET /api/loyalty/levels
exports.getLoyaltyLevels = async (req, res) => {
  try {
    const { userId } = req.query;

    const levels = [
      {
        name: 'برونزي',
        minPoints: 0,
        maxPoints: 99,
        discount: 5,
        benefits: ['خصم 5% على جميع الخدمات'],
        color: '#CD7F32'
      },
      {
        name: 'فضي',
        minPoints: 100,
        maxPoints: 499,
        discount: 10,
        benefits: ['خصم 10% على جميع الخدمات', 'أولوية في الطلبات'],
        color: '#C0C0C0'
      },
      {
        name: 'ذهبي',
        minPoints: 500,
        maxPoints: 999,
        discount: 15,
        benefits: ['خصم 15% على جميع الخدمات', 'أولوية في الطلبات', 'خدمة VIP'],
        color: '#FFD700'
      },
      {
        name: 'بلاتيني',
        minPoints: 1000,
        maxPoints: 1999,
        discount: 20,
        benefits: ['خصم 20% على جميع الخدمات', 'أولوية في الطلبات', 'خدمة VIP', 'خصومات حصرية'],
        color: '#E5E4E2'
      },
      {
        name: 'الماس',
        minPoints: 2000,
        maxPoints: null,
        discount: 25,
        benefits: ['خصم 25% على جميع الخدمات', 'أولوية في الطلبات', 'خدمة VIP', 'خصومات حصرية', 'خدمة شخصية'],
        color: '#B9F2FF'
      }
    ];

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userPoints = user.loyaltyPoints || 0;
        const currentLevel = levels.find(level =>
          userPoints >= level.minPoints &&
          (level.maxPoints === null || userPoints <= level.maxPoints)
        );

        const userLevelInfo = {
          currentLevel,
          userPoints,
          nextLevel: levels.find(level => level.minPoints > userPoints),
          pointsToNextLevel: currentLevel && currentLevel.maxPoints ?
            currentLevel.maxPoints - userPoints + 1 : 0
        };

        res.json({
          success: true,
          message: 'User loyalty level retrieved successfully',
          data: userLevelInfo
        });
        return;
      }
    }

    res.json({
      success: true,
      message: 'Loyalty levels retrieved successfully',
      data: levels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// DISCOUNTS
// ========================================

// GET /api/loyalty/discounts
exports.getDiscounts = async (req, res) => {
  try {
    const { userId } = req.query;

    const discounts = [
      {
        id: 1,
        name: 'خصم الولاء',
        description: 'خصم حسب مستوى الولاء',
        type: 'loyalty',
        value: 10,
        isActive: true,
        conditions: ['مستوى فضى أو أعلى']
      },
      {
        id: 2,
        name: 'خصم النقاط',
        description: 'خصم مقابل استبدال النقاط',
        type: 'points',
        value: 25,
        isActive: true,
        conditions: ['100 نقطة = 10 ريال']
      },
      {
        id: 3,
        name: 'خصم العضويات',
        description: 'خصم خاص لأعضاء البرنامج',
        type: 'membership',
        value: 15,
        isActive: true,
        conditions: ['عضوية نشطة']
      }
    ];

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userLevel = getUserLevel(user.loyaltyPoints || 0);
        const availableDiscounts = discounts.map(discount => ({
          ...discount,
          available: checkDiscountAvailability(discount, user, userLevel)
        }));

        res.json({
          success: true,
          message: 'User discounts retrieved successfully',
          data: availableDiscounts
        });
        return;
      }
    }

    res.json({
      success: true,
      message: 'Discounts retrieved successfully',
      data: discounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// MEMBERSHIP MANAGEMENT
// ========================================

// GET /api/loyalty/memberships
exports.getMemberships = async (req, res) => {
  try {
    const { userId } = req.query;

    const memberships = [
      {
        id: 1,
        name: 'العضوية الأساسية',
        description: 'عضوية مجانية مع مزايا أساسية',
        price: 0,
        duration: 'lifetime',
        benefits: ['نقاط الولاء', 'خصم 5%'],
        isActive: true
      },
      {
        id: 2,
        name: 'العضوية الفضية',
        description: 'عضوية مدفوعة مع مزايا إضافية',
        price: 99,
        duration: 'yearly',
        benefits: ['نقاط الولاء', 'خصم 10%', 'أولوية في الطلبات'],
        isActive: true
      },
      {
        id: 3,
        name: 'العضوية الذهبية',
        description: 'عضوية VIP مع جميع المزايا',
        price: 199,
        duration: 'yearly',
        benefits: ['نقاط الولاء', 'خصم 15%', 'أولوية في الطلبات', 'خدمة VIP'],
        isActive: true
      }
    ];

    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const userMembership = {
          userId: user._id,
          currentMembership: user.membership || 'basic',
          membershipExpiry: user.membershipExpiry,
          isActive: user.membershipExpiry ? new Date() < new Date(user.membershipExpiry) : true
        };

        res.json({
          success: true,
          message: 'User membership retrieved successfully',
          data: {
            userMembership,
            availableMemberships: memberships
          }
        });
        return;
      }
    }

    res.json({
      success: true,
      message: 'Memberships retrieved successfully',
      data: memberships
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/loyalty/memberships/subscribe
exports.subscribeMembership = async (req, res) => {
  try {
    const { userId, membershipId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Mock membership data
    const membership = {
      id: membershipId,
      name: 'العضوية الفضية',
      price: 99,
      duration: 'yearly'
    };

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    // Update user membership
    user.membership = membership.name.toLowerCase();
    user.membershipExpiry = expiryDate;
    await user.save();

    const subscription = {
      userId: user._id,
      membershipId,
      membershipName: membership.name,
      startDate: new Date().toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'active'
    };

    res.json({
      success: true,
      message: 'Membership subscribed successfully',
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// LOYALTY REPORTS
// ========================================

// GET /api/loyalty/reports
exports.getLoyaltyReports = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const reports = {
      period,
      totalMembers: 1250,
      activeMembers: 980,
      totalPointsEarned: 45000,
      totalPointsRedeemed: 28000,
      averagePointsPerMember: 36,
      topEarners: [
        { userId: 'user1', name: 'أحمد محمد', points: 450 },
        { userId: 'user2', name: 'محمد علي', points: 380 },
        { userId: 'user3', name: 'فاطمة أحمد', points: 320 }
      ],
      levelDistribution: [
        { level: 'برونزي', count: 450, percentage: 36 },
        { level: 'فضي', count: 380, percentage: 30.4 },
        { level: 'ذهبي', count: 250, percentage: 20 },
        { level: 'بلاتيني', count: 120, percentage: 9.6 },
        { level: 'الماس', count: 50, percentage: 4 }
      ]
    };

    res.json({
      success: true,
      message: 'Loyalty reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// LOYALTY STATISTICS
// ========================================

// GET /api/loyalty/statistics
exports.getLoyaltyStatistics = async (req, res) => {
  try {
    const statistics = {
      totalMembers: 1250,
      activeMembers: 980,
      inactiveMembers: 270,
      totalPointsInSystem: 17000,
      averagePointsPerMember: 36,
      redemptionRate: 62.2,
      averageOrderValue: 85,
      retentionRate: 78.5,
      monthlyGrowth: 12.3
    };

    res.json({
      success: true,
      message: 'Loyalty statistics retrieved successfully',
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getUserLevel(points) {
  if (points >= 2000) return 'الماس';
  if (points >= 1000) return 'بلاتيني';
  if (points >= 500) return 'ذهبي';
  if (points >= 100) return 'فضي';
  return 'برونزي';
}

function getNextLevel(points) {
  if (points < 100) return { name: 'فضي', pointsNeeded: 100 - points };
  if (points < 500) return { name: 'ذهبي', pointsNeeded: 500 - points };
  if (points < 1000) return { name: 'بلاتيني', pointsNeeded: 1000 - points };
  if (points < 2000) return { name: 'الماس', pointsNeeded: 2000 - points };
  return null;
}

function getPointsToNextLevel(points) {
  const nextLevel = getNextLevel(points);
  return nextLevel ? nextLevel.pointsNeeded : 0;
}

function checkDiscountAvailability(discount, user, userLevel) {
  switch (discount.type) {
    case 'loyalty':
      return ['فضي', 'ذهبي', 'بلاتيني', 'الماس'].includes(userLevel);
    case 'points':
      return (user.loyaltyPoints || 0) >= 100;
    case 'membership':
      return user.membership && user.membership !== 'basic';
    default:
      return true;
  }
}
