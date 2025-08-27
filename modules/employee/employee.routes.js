const express = require('express');
const router = express.Router();
const employeeController = require('./employee.controller');
const auth = require('../../middleware/auth');

// ========================================
// EMPLOYEE MANAGEMENT ROUTES
// ========================================

// GET /api/employees - Get all employees
router.get('/', auth, employeeController.getAllEmployees);

// GET /api/employees/:id - Get employee by ID
router.get('/:id', auth, employeeController.getEmployeeById);

// POST /api/employees - Create new employee
router.post('/', auth, employeeController.createEmployee);

// PUT /api/employees/:id - Update employee
router.put('/:id', auth, employeeController.updateEmployee);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', auth, employeeController.deleteEmployee);

// ========================================
// ATTENDANCE MANAGEMENT ROUTES
// ========================================

// GET /api/employees/attendance - Get attendance records
router.get('/attendance', auth, employeeController.getAttendanceRecords);

// POST /api/employees/:id/attendance - Record attendance
router.post('/:id/attendance', auth, employeeController.recordAttendance);

// ========================================
// PERFORMANCE EVALUATION ROUTES
// ========================================

// GET /api/employees/:id/performance - Get employee performance
router.get('/:id/performance', auth, employeeController.getEmployeePerformance);

// POST /api/employees/:id/evaluate - Evaluate employee
router.post('/:id/evaluate', auth, employeeController.evaluateEmployee);

// ========================================
// SALARY MANAGEMENT ROUTES
// ========================================

// PUT /api/employees/:id/salary - Update employee salary
router.put('/:id/salary', auth, employeeController.updateSalary);

// GET /api/employees/salary-report - Get salary report
router.get('/salary-report', auth, employeeController.getSalaryReport);

// ========================================
// LEAVE MANAGEMENT ROUTES
// ========================================

// GET /api/employees/leave-requests - Get leave requests
router.get('/leave-requests', auth, employeeController.getLeaveRequests);

// POST /api/employees/leave-request - Create leave request
router.post('/leave-request', auth, employeeController.createLeaveRequest);

// ========================================
// TRAINING & DEVELOPMENT ROUTES
// ========================================

// GET /api/employees/training - Get training programs
router.get('/training', auth, employeeController.getTrainingPrograms);

// ========================================
// EMPLOYEE REPORTS ROUTES
// ========================================

// GET /api/employees/reports - Get employee reports
router.get('/reports', auth, employeeController.getEmployeeReports);

module.exports = router;
