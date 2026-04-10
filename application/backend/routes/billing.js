const express = require('express');
const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/billing
// @desc    Get all billing records with filters
// @access  Private (Staff)
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { 
      paymentStatus, 
      billStatus, 
      department, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    let filter = { isActive: true };
    
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (billStatus) filter.billStatus = billStatus;
    if (department) filter.departmentName = department;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { billNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bills = await Billing.find(filter)
      .populate('patient', 'firstName lastName patientId contactNumber')
      .populate('department', 'name')
      .populate('generatedBy', 'firstName lastName fullName')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Billing.countDocuments(filter);

    res.json({
      bills,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get billing records error:', error);
    res.status(500).json({
      message: 'Failed to get billing records',
      error: 'GET_BILLING_ERROR'
    });
  }
});

// @route   GET /api/billing/:id
// @desc    Get billing record by ID
// @access  Private (Staff)
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId contactNumber dateOfBirth gender address')
      .populate('department', 'name description')
      .populate('generatedBy', 'firstName lastName fullName')
      .populate('payments.receivedBy', 'firstName lastName fullName');

    if (!bill) {
      return res.status(404).json({
        message: 'Billing record not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    res.json({ bill });
  } catch (error) {
    console.error('Get billing record error:', error);
    res.status(500).json({
      message: 'Failed to get billing record',
      error: 'GET_BILL_ERROR'
    });
  }
});

// @route   POST /api/billing/:id/charges/medical
// @desc    Add medical charge to bill
// @access  Private (Staff)
router.post('/:id/charges/medical', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { description, amount, category } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        message: 'Description and amount are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: 'Billing record not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    if (bill.billStatus === 'paid' || bill.billStatus === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot add charges to paid or cancelled bill',
        error: 'BILL_FINALIZED'
      });
    }

    const medicalCharge = {
      description,
      amount: parseFloat(amount),
      category: category || 'other',
      date: new Date()
    };

    await bill.addMedicalCharge(medicalCharge);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('billing-updated', {
      billId: bill._id,
      billNumber: bill.billNumber,
      patientName: bill.patientName,
      totalAmount: bill.totalAmount,
      netAmount: bill.netAmount
    });

    res.json({
      message: 'Medical charge added successfully',
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        totalAmount: bill.totalAmount,
        netAmount: bill.netAmount,
        balanceAmount: bill.balanceAmount
      }
    });
  } catch (error) {
    console.error('Add medical charge error:', error);
    res.status(500).json({
      message: 'Failed to add medical charge',
      error: 'ADD_MEDICAL_CHARGE_ERROR'
    });
  }
});

// @route   POST /api/billing/:id/charges/additional
// @desc    Add additional charge to bill
// @access  Private (Staff)
router.post('/:id/charges/additional', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { description, amount } = req.body;

    if (!description || !amount) {
      return res.status(400).json({
        message: 'Description and amount are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const bill = await Billing.findById(req.params.id);
    console.log(bill)
    console.log(req.params.id)

    if (!bill) {
      return res.status(404).json({
        message: 'Billing record not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    if (bill.billStatus === 'paid' || bill.billStatus === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot add charges to paid or cancelled bill',
        error: 'BILL_FINALIZED'
      });
    }

    const additionalCharge = {
      description,
      amount: parseFloat(amount),
      date: new Date()
    };

    await bill.addAdditionalCharge(additionalCharge);

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('billing-updated', {
      billId: bill._id,
      billNumber: bill.billNumber,
      patientName: bill.patientName,
      totalAmount: bill.totalAmount,
      netAmount: bill.netAmount
    });

    res.json({
      message: 'Additional charge added successfully',
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        totalAmount: bill.totalAmount,
        netAmount: bill.netAmount,
        balanceAmount: bill.balanceAmount
      }
    });
  } catch (error) {
    console.error('Add additional charge error:', error);
    res.status(500).json({
      message: 'Failed to add additional charge',
      error: 'ADD_ADDITIONAL_CHARGE_ERROR'
    });
  }
});

// @route   POST /api/billing/:id/payments
// @desc    Add payment to bill
// @access  Private (Staff)
router.post('/:id/payments', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, notes } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({
        message: 'Amount and payment method are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: 'Billing record not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    if (bill.billStatus === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot add payment to cancelled bill',
        error: 'BILL_CANCELLED'
      });
    }

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      return res.status(400).json({
        message: 'Payment amount must be greater than zero',
        error: 'INVALID_AMOUNT'
      });
    }

    if (paymentAmount > bill.balanceAmount) {
      return res.status(400).json({
        message: 'Payment amount cannot exceed balance amount',
        error: 'AMOUNT_EXCEEDS_BALANCE',
        balanceAmount: bill.balanceAmount
      });
    }

    const payment = {
      amount: paymentAmount,
      paymentMethod,
      transactionId,
      receivedBy: req.user._id,
      notes,
      paymentDate: new Date()
    };

    await bill.addPayment(payment);

    // Check if bill is fully paid
    if (bill.paymentStatus === 'paid') {
      bill.billStatus = 'paid';
      await bill.save();
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('payment-received', {
      billId: bill._id,
      billNumber: bill.billNumber,
      patientName: bill.patientName,
      paymentAmount,
      totalPaid: bill.totalPaid,
      balanceAmount: bill.balanceAmount,
      paymentStatus: bill.paymentStatus
    });

    res.json({
      message: 'Payment added successfully',
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        totalPaid: bill.totalPaid,
        balanceAmount: bill.balanceAmount,
        paymentStatus: bill.paymentStatus,
        billStatus: bill.billStatus
      },
      payment: {
        amount: paymentAmount,
        paymentMethod,
        transactionId,
        receivedBy: req.user.fullName
      }
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      message: 'Failed to add payment',
      error: 'ADD_PAYMENT_ERROR'
    });
  }
});

// @route   PUT /api/billing/:id/discounts
// @desc    Apply discounts to bill
// @access  Private (Staff)
router.put('/:id/discounts', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { insuranceDiscount, hospitalDiscount, otherDiscounts } = req.body;

    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: 'Billing record not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    if (bill.billStatus === 'paid' || bill.billStatus === 'cancelled') {
      return res.status(400).json({
        message: 'Cannot modify discounts for paid or cancelled bill',
        error: 'BILL_FINALIZED'
      });
    }

    // Update discounts
    if (insuranceDiscount !== undefined) {
      bill.discounts.insuranceDiscount = Math.max(0, parseFloat(insuranceDiscount));
    }
    if (hospitalDiscount !== undefined) {
      bill.discounts.hospitalDiscount = Math.max(0, parseFloat(hospitalDiscount));
    }
    if (otherDiscounts !== undefined) {
      bill.discounts.otherDiscounts = Math.max(0, parseFloat(otherDiscounts));
    }

    await bill.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('billing-updated', {
      billId: bill._id,
      billNumber: bill.billNumber,
      patientName: bill.patientName,
      totalAmount: bill.totalAmount,
      netAmount: bill.netAmount,
      balanceAmount: bill.balanceAmount
    });

    res.json({
      message: 'Discounts applied successfully',
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        totalAmount: bill.totalAmount,
        discounts: bill.discounts,
        netAmount: bill.netAmount,
        balanceAmount: bill.balanceAmount
      }
    });
  } catch (error) {
    console.error('Apply discounts error:', error);
    res.status(500).json({
      message: 'Failed to apply discounts',
      error: 'APPLY_DISCOUNTS_ERROR'
    });
  }
});

// @route   PUT /api/billing/:id/status
// @desc    Update bill status
// @access  Private (Staff)
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { billStatus } = req.body;

    if (!billStatus) {
      return res.status(400).json({
        message: 'Bill status is required',
        error: 'MISSING_BILL_STATUS'
      });
    }

    const bill = await Billing.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: 'Billing record not found',
        error: 'BILL_NOT_FOUND'
      });
    }

    const oldStatus = bill.billStatus;
    bill.billStatus = billStatus;

    await bill.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('bill-status-updated', {
      billId: bill._id,
      billNumber: bill.billNumber,
      patientName: bill.patientName,
      oldStatus,
      newStatus: billStatus
    });

    res.json({
      message: 'Bill status updated successfully',
      bill: {
        id: bill._id,
        billNumber: bill.billNumber,
        billStatus: bill.billStatus
      }
    });
  } catch (error) {
    console.error('Update bill status error:', error);
    res.status(500).json({
      message: 'Failed to update bill status',
      error: 'UPDATE_BILL_STATUS_ERROR'
    });
  }
});

// @route   GET /api/billing/stats/summary
// @desc    Get billing statistics summary
// @access  Private (Staff)
router.get('/stats/summary', authenticateToken, requireStaff, async (req, res) => {
  try {
    const paymentStats = await Billing.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netAmount' },
          totalPaid: { $sum: '$totalPaid' }
        }
      }
    ]);

    const billStats = await Billing.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$billStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const departmentStats = await Billing.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$departmentName',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPaid' }
        }
      }
    ]);

    // Calculate totals
    const totals = await Billing.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$netAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalBalance: { $sum: '$balanceAmount' }
        }
      }
    ]);

    res.json({
      paymentStats,
      billStats,
      departmentStats,
      totals: totals[0] || {
        totalBills: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get billing stats error:', error);
    res.status(500).json({
      message: 'Failed to get billing statistics',
      error: 'GET_BILLING_STATS_ERROR'
    });
  }
});

// @route   GET /api/billing/overdue
// @desc    Get overdue bills
// @access  Private (Staff)
router.get('/overdue', authenticateToken, requireStaff, async (req, res) => {
  try {
    const overdueBills = await Billing.find({
      isActive: true,
      paymentStatus: { $in: ['pending', 'partial'] },
      dueDate: { $lt: new Date() }
    })
    .populate('patient', 'firstName lastName patientId contactNumber')
    .populate('department', 'name')
    .sort({ dueDate: 1 });

    // Update payment status to overdue
    await Billing.updateMany(
      {
        isActive: true,
        paymentStatus: { $in: ['pending', 'partial'] },
        dueDate: { $lt: new Date() }
      },
      { paymentStatus: 'overdue' }
    );

    res.json({
      overdueBills,
      total: overdueBills.length,
      totalOverdueAmount: overdueBills.reduce((sum, bill) => sum + bill.balanceAmount, 0)
    });
  } catch (error) {
    console.error('Get overdue bills error:', error);
    res.status(500).json({
      message: 'Failed to get overdue bills',
      error: 'GET_OVERDUE_BILLS_ERROR'
    });
  }
});

module.exports = router;

