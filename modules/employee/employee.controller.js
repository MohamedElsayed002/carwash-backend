const User = require('../user/user.model');
const Wash = require('../wash/wash.model');

// ========================================
// EMPLOYEE MANAGEMENT
// ========================================

// GET /api/employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, branch } = req.query;
    const skip = (page - 1) * limit;

    let filter = { role: { $in: ['employee', 'manager', 'admin'] } };
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (branch) filter.branch = branch;

    const employees = await User.find(filter)
      .select('name email phone role status branch createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      message: 'Employees retrieved successfully',
      data: {
        employees,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total
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

// GET /api/employees/:id
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await User.findById(id)
      .select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee retrieved successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      branch,
      salary,
      position,
      hireDate
    } = req.body;

    // Check if email already exists
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    const employee = new User({
      name,
      email,
      phone,
      role: role || 'employee',
      branch,
      salary,
      position,
      hireDate: hireDate || new Date(),
      status: 'active'
    });

    await employee.save();

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const employee = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const employee = await User.findByIdAndDelete(id);
    
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// ATTENDANCE MANAGEMENT
// ========================================

// GET /api/employees/attendance
exports.getAttendanceRecords = async (req, res) => {
  try {
    const { date, employeeId, branch } = req.query;
    
    // Mock attendance data
    const attendanceRecords = [
      {
        id: 1,
        employeeId: 'emp_001',
        employeeName: 'أحمد محمد',
        date: date || new Date().toISOString().split('T')[0],
        checkIn: '08:00',
        checkOut: '17:00',
        totalHours: 9,
        status: 'present',
        branch: 'الفرع الرئيسي'
      },
      {
        id: 2,
        employeeId: 'emp_002',
        employeeName: 'محمد علي',
        date: date || new Date().toISOString().split('T')[0],
        checkIn: '08:15',
        checkOut: '16:45',
        totalHours: 8.5,
        status: 'present',
        branch: 'فرع جدة'
      },
      {
        id: 3,
        employeeId: 'emp_003',
        employeeName: 'فاطمة أحمد',
        date: date || new Date().toISOString().split('T')[0],
        checkIn: null,
        checkOut: null,
        totalHours: 0,
        status: 'absent',
        branch: 'الفرع الرئيسي'
      }
    ];

    res.json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/employees/:id/attendance
exports.recordAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, timestamp, location } = req.body;

    const attendanceRecord = {
      employeeId: id,
      type, // 'check-in' or 'check-out'
      timestamp: timestamp || new Date().toISOString(),
      location: location || 'main-branch',
      status: 'recorded'
    };

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      data: attendanceRecord
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// PERFORMANCE EVALUATION
// ========================================

// GET /api/employees/:id/performance
exports.getEmployeePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'month' } = req.query;

    // Get employee's completed orders
    const completedOrders = await Wash.countDocuments({
      assignedEmployee: id,
      status: 'completed'
    });

    // Mock performance data
    const performance = {
      employeeId: id,
      period,
      metrics: {
        totalOrders: completedOrders,
        completedOrders: completedOrders,
        averageRating: 4.5,
        efficiency: 85,
        customerSatisfaction: 4.3
      },
      achievements: [
        {
          title: 'أفضل موظف الشهر',
          description: 'أعلى تقييم من العملاء',
          date: '2024-01-15'
        },
        {
          title: 'أسرع في الإنجاز',
          description: 'أقل وقت متوسط للطلبات',
          date: '2024-01-10'
        }
      ],
      areas: [
        {
          area: 'سرعة العمل',
          score: 85,
          improvement: '+5%'
        },
        {
          area: 'جودة العمل',
          score: 90,
          improvement: '+2%'
        },
        {
          area: 'التواصل مع العملاء',
          score: 88,
          improvement: '+3%'
        }
      ]
    };

    res.json({
      success: true,
      message: 'Employee performance retrieved successfully',
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/employees/:id/evaluate
exports.evaluateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      evaluatorId,
      rating,
      comments,
      areas,
      goals,
      nextReviewDate
    } = req.body;

    const evaluation = {
      employeeId: id,
      evaluatorId,
      rating,
      comments,
      areas,
      goals,
      nextReviewDate,
      evaluationDate: new Date().toISOString(),
      status: 'completed'
    };

    res.json({
      success: true,
      message: 'Employee evaluation completed successfully',
      data: evaluation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// SALARY MANAGEMENT
// ========================================

// PUT /api/employees/:id/salary
exports.updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { salary, effectiveDate, reason } = req.body;

    const salaryUpdate = {
      employeeId: id,
      newSalary: salary,
      effectiveDate: effectiveDate || new Date().toISOString(),
      reason,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: salaryUpdate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET /api/employees/salary-report
exports.getSalaryReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const salaryReport = {
      period: `${month}/${year}`,
      totalEmployees: 25,
      totalSalary: 125000,
      averageSalary: 5000,
      breakdown: [
        {
          role: 'مدير',
          count: 3,
          totalSalary: 25000,
          averageSalary: 8333
        },
        {
          role: 'موظف',
          count: 22,
          totalSalary: 100000,
          averageSalary: 4545
        }
      ],
      bonuses: 15000,
      deductions: 5000,
      netPayroll: 135000
    };

    res.json({
      success: true,
      message: 'Salary report retrieved successfully',
      data: salaryReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// LEAVE MANAGEMENT
// ========================================

// GET /api/employees/leave-requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;

    const leaveRequests = [
      {
        id: 1,
        employeeId: 'emp_001',
        employeeName: 'أحمد محمد',
        type: 'إجازة سنوية',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        days: 5,
        reason: 'رحلة عائلية',
        status: 'pending',
        submittedAt: '2024-01-20T10:00:00Z'
      },
      {
        id: 2,
        employeeId: 'emp_002',
        employeeName: 'محمد علي',
        type: 'إجازة مرضية',
        startDate: '2024-01-25',
        endDate: '2024-01-27',
        days: 3,
        reason: 'مرض',
        status: 'approved',
        submittedAt: '2024-01-24T14:30:00Z'
      }
    ];

    res.json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: leaveRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// POST /api/employees/leave-request
exports.createLeaveRequest = async (req, res) => {
  try {
    const {
      employeeId,
      type,
      startDate,
      endDate,
      reason
    } = req.body;

    const leaveRequest = {
      id: Date.now(),
      employeeId,
      type,
      startDate,
      endDate,
      days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
      reason,
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: leaveRequest
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// TRAINING & DEVELOPMENT
// ========================================

// GET /api/employees/training
exports.getTrainingPrograms = async (req, res) => {
  try {
    const trainingPrograms = [
      {
        id: 1,
        title: 'تدريب على خدمة العملاء',
        description: 'تحسين مهارات التواصل مع العملاء',
        duration: '3 أيام',
        instructor: 'د. سارة أحمد',
        startDate: '2024-02-15',
        endDate: '2024-02-17',
        status: 'upcoming',
        participants: 15
      },
      {
        id: 2,
        title: 'تدريب على المعدات الجديدة',
        description: 'تعلم استخدام معدات الغسيل الحديثة',
        duration: '1 يوم',
        instructor: 'م. خالد محمد',
        startDate: '2024-01-30',
        endDate: '2024-01-30',
        status: 'completed',
        participants: 20
      }
    ];

    res.json({
      success: true,
      message: 'Training programs retrieved successfully',
      data: trainingPrograms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========================================
// EMPLOYEE REPORTS
// ========================================

// GET /api/employees/reports
exports.getEmployeeReports = async (req, res) => {
  try {
    const { type, period } = req.query;

    const reports = {
      attendance: {
        totalEmployees: 25,
        present: 22,
        absent: 2,
        late: 1,
        attendanceRate: 88
      },
      performance: {
        averageRating: 4.3,
        topPerformers: 5,
        needsImprovement: 2,
        averageEfficiency: 85
      },
      turnover: {
        newHires: 3,
        terminations: 1,
        turnoverRate: 4
      }
    };

    res.json({
      success: true,
      message: 'Employee reports retrieved successfully',
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
