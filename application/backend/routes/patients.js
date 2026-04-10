const express = require('express');
const Patient = require('../models/Patient');
const Bed = require('../models/Bed');
const Department = require('../models/Department');
const Billing = require('../models/Billing');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/patients
// @desc    Get all patients with filters
// @access  Private (Staff)
router.get('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { status, department, search, page = 1, limit = 10 } = req.query;
    
    let filter = { isActive: true };
    
    if (status) filter.status = status;
    if (department) filter['admission.departmentName'] = department;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { contactNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const patients = await Patient.find(filter)
      .populate('admission.department', 'name')
      .populate('admission.assignedBed', 'bedNumber')
      .populate('admission.admittingDoctor', 'firstName lastName fullName')
      .sort({ 'admission.admissionDate': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(filter);

    res.json({
      patients,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      message: 'Failed to get patients',
      error: 'GET_PATIENTS_ERROR'
    });
  }
});

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private (Staff)
router.get('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('admission.department', 'name description')
      .populate('admission.assignedBed', 'bedNumber bedType dailyRate')
      .populate('admission.admittingDoctor', 'firstName lastName fullName');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        error: 'PATIENT_NOT_FOUND'
      });
    }

    res.json({ patient });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      message: 'Failed to get patient',
      error: 'GET_PATIENT_ERROR'
    });
  }
});

// @route   POST /api/patients/admit
// @desc    Admit new patient
// @access  Private (Staff)
// @route   POST /api/patients/admit
// @desc    Admit new patient
// @access  Private (Staff)
router.post('/admit', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      contactNumber,
      email,
      address,
      emergencyContact,
      medicalHistory,
      departmentId,
      bedId,
      reasonForAdmission,
      diagnosis,
      treatmentPlan,
      insurance
    } = req.body;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // Verify bed exists and is available
    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({
        message: 'Bed not found',
        error: 'BED_NOT_FOUND'
      });
    }

    if (!bed.isAvailable()) {
      return res.status(400).json({
        message: 'Bed is not available',
        error: 'BED_NOT_AVAILABLE',
        bedStatus: bed.status
      });
    }

    if (bed.department.toString() !== departmentId) {
      return res.status(400).json({
        message: 'Bed does not belong to selected department',
        error: 'BED_DEPARTMENT_MISMATCH'
      });
    }

    // Create new patient
    const patient = new Patient({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      contactNumber,
      email,
      address,
      emergencyContact,
      medicalHistory,
      admission: {
        department: departmentId,
        departmentName: department.name,
        assignedBed: bedId,
        admittingDoctor: req.user._id,
        reasonForAdmission,
        diagnosis,
        treatmentPlan
      },
      insurance
    });

    await patient.save();

    // Occupy the bed
    await bed.occupyBed(patient._id);

    // Update department bed counts
    await department.updateBedCounts();

    // Calculate billing amounts
    const totalAmount = bed.dailyRate; // Initial bill = 1 day bed charge
    const netAmount = totalAmount;     // Apply discounts here if needed
    const balanceAmount = netAmount;   // Nothing paid at admission

    // Create initial billing record
    const billing = new Billing({
      patient: patient._id,
      patientName: patient.fullName,
      patientId: patient.patientId,
      department: departmentId,
      departmentName: department.name,
      admissionDate: patient.admission.admissionDate,
      charges: {
        bedCharges: {
          dailyRate: bed.dailyRate,
          numberOfDays: 1,
          totalBedCharges: bed.dailyRate
        },
        medicalCharges: [],
        additionalCharges: []
      },
      totalAmount,
      netAmount,
      balanceAmount,
      generatedBy: req.user._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    // Generate bill number if schema doesn’t auto-generate
    if (!billing.billNumber) {
      billing.billNumber = `BILL-${Date.now()}`;
    }

    await billing.save();

    // Populate patient data for response
    await patient.populate([
      { path: 'admission.department', select: 'name' },
      { path: 'admission.assignedBed', select: 'bedNumber bedType' },
      { path: 'admission.admittingDoctor', select: 'firstName lastName fullName' }
    ]);

    // Emit real-time updates
    const io = req.app.get('io');
    io.emit('patient-admitted', {
      patient: {
        id: patient._id,
        name: patient.fullName,
        patientId: patient.patientId,
        department: department.name,
        bedNumber: bed.bedNumber
      },
      bedId: bed._id,
      departmentId: department._id
    });
    io.emit('bed-occupied', {
      bedId: bed._id,
      bedNumber: bed.bedNumber,
      patient: {
        id: patient._id,
        name: patient.fullName,
        patientId: patient.patientId
      },
      departmentId: department._id
    });
    io.emit('department-updated', department);

    res.status(201).json({
      message: 'Patient admitted successfully',
      patient,
      billing: {
        id: billing._id,
        billNumber: billing.billNumber,
        totalAmount: billing.totalAmount,
        netAmount: billing.netAmount,
        balanceAmount: billing.balanceAmount
      }
    });
  } catch (error) {
    console.error('Patient admission error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));

      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }

    res.status(500).json({
      message: 'Patient admission failed',
      error: 'PATIENT_ADMISSION_ERROR'
    });
  }
});


// @route   PUT /api/patients/:id/discharge
// @desc    Discharge patient (only if bills are cleared)
// @access  Private (Staff)
router.put('/:id/discharge', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { dischargeDate, dischargeSummary } = req.body;

    const patient = await Patient.findById(req.params.id)
      .populate('admission.assignedBed')
      .populate('admission.department');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        error: 'PATIENT_NOT_FOUND'
      });
    }

    if (patient.status !== 'admitted') {
      return res.status(400).json({
        message: 'Patient is not currently admitted',
        error: 'PATIENT_NOT_ADMITTED',
        currentStatus: patient.status
      });
    }

    // Get patient billing
    const billing = await Billing.findOne({
      patient: patient._id,
      billStatus: { $ne: 'cancelled' }
    });

    if (!billing) {
      return res.status(400).json({
        message: 'No billing record found for patient',
        error: 'BILLING_NOT_FOUND'
      });
    }

    // 🚨 Block discharge if pending balance exists
    if (billing.balanceAmount > 0) {
      return res.status(400).json({
        message: 'Patient cannot be discharged until bill is fully paid',
        error: 'PENDING_PAYMENT',
        balanceAmount: billing.balanceAmount
      });
    }

    const discharge = new Date(dischargeDate || Date.now());

    // Mark patient discharged
    await patient.discharge(discharge);

    // Release the bed
    const bed = patient.admission.assignedBed;
    if (bed) {
      await bed.releaseBed();
      await patient.admission.department.updateBedCounts();
    }

    // Update billing with discharge date (already paid)
    billing.dischargeDate = discharge;
    billing.billStatus = 'paid'; // ✅ since cleared
    if (dischargeSummary) {
      billing.notes = dischargeSummary;
    }
    await billing.save();

    // Add discharge summary to patient record
    if (dischargeSummary) {
      patient.admission.treatmentPlan =
        (patient.admission.treatmentPlan || '') +
        '\n\nDischarge Summary: ' +
        dischargeSummary;
      await patient.save();
    }

    // Emit socket events
    const io = req.app.get('io');
    io.emit('patient-discharged', {
      patient: {
        id: patient._id,
        name: patient.fullName,
        patientId: patient.patientId,
        department: patient.admission.departmentName,
        bedNumber: bed ? bed.bedNumber : null
      },
      bedId: bed ? bed._id : null,
      departmentId: patient.admission.department._id,
      dischargeDate: discharge
    });

    if (bed) {
      io.emit('bed-released', {
        bedId: bed._id,
        bedNumber: bed.bedNumber,
        releasedPatient: {
          id: patient._id,
          name: patient.fullName,
          patientId: patient.patientId
        },
        departmentId: patient.admission.department._id
      });
    }

    io.emit('department-updated', patient.admission.department);

    res.json({
      message: 'Patient discharged successfully',
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        name: patient.fullName,
        status: patient.status,
        dischargeDate: patient.admission.dischargeDate
      },
      billing: {
        id: billing._id,
        billNumber: billing.billNumber,
        totalAmount: billing.totalAmount,
        netAmount: billing.netAmount,
        balanceAmount: billing.balanceAmount,
        status: billing.billStatus
      }
    });
  } catch (error) {
    console.error('Patient discharge error:', error);
    res.status(500).json({
      message: 'Patient discharge failed',
      error: 'PATIENT_DISCHARGE_ERROR'
    });
  }
});

// @route   PUT /api/patients/:id
// @desc    Update patient information
// @access  Private (Staff)
router.put('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      contactNumber,
      email,
      address,
      emergencyContact,
      medicalHistory,
      diagnosis,
      treatmentPlan,
      insurance
    } = req.body;

    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        error: 'PATIENT_NOT_FOUND'
      });
    }

    // Update basic information
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (contactNumber) patient.contactNumber = contactNumber;
    if (email) patient.email = email;
    if (address) patient.address = { ...patient.address, ...address };
    if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
    if (medicalHistory) patient.medicalHistory = { ...patient.medicalHistory, ...medicalHistory };
    if (insurance) patient.insurance = { ...patient.insurance, ...insurance };

    // Update admission information
    if (diagnosis) patient.admission.diagnosis = diagnosis;
    if (treatmentPlan) patient.admission.treatmentPlan = treatmentPlan;

    await patient.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('patient-updated', {
      patientId: patient._id,
      name: patient.fullName,
      patientIdNumber: patient.patientId
    });

    res.json({
      message: 'Patient updated successfully',
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        name: patient.fullName,
        contactNumber: patient.contactNumber,
        email: patient.email
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        message: 'Validation error',
        error: 'VALIDATION_ERROR',
        errors
      });
    }

    res.status(500).json({
      message: 'Patient update failed',
      error: 'UPDATE_PATIENT_ERROR'
    });
  }
});

// @route   GET /api/patients/:id/history
// @desc    Get patient admission history
// @access  Private (Staff)
router.get('/:id/history', authenticateToken, requireStaff, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('admission.department', 'name')
      .populate('admission.assignedBed', 'bedNumber')
      .populate('admission.admittingDoctor', 'firstName lastName fullName');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        error: 'PATIENT_NOT_FOUND'
      });
    }

    // Get billing history
    const billingHistory = await Billing.find({ patient: patient._id })
      .populate('generatedBy', 'firstName lastName fullName')
      .sort({ createdAt: -1 });

    res.json({
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        name: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        contactNumber: patient.contactNumber
      },
      admission: patient.admission,
      billingHistory,
      totalBills: billingHistory.length,
      totalAmount: billingHistory.reduce((sum, bill) => sum + bill.netAmount, 0),
      totalPaid: billingHistory.reduce((sum, bill) => sum + bill.totalPaid, 0)
    });
  } catch (error) {
    console.error('Get patient history error:', error);
    res.status(500).json({
      message: 'Failed to get patient history',
      error: 'GET_PATIENT_HISTORY_ERROR'
    });
  }
});

// @route   GET /api/patients/stats/summary
// @desc    Get patient statistics summary
// @access  Private (Staff)
router.get('/stats/summary', authenticateToken, requireStaff, async (req, res) => {
  try {
    const stats = await Patient.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const departmentStats = await Patient.aggregate([
      {
        $match: { 
          isActive: true,
          status: 'admitted'
        }
      },
      {
        $group: {
          _id: '$admission.departmentName',
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      total: 0,
      admitted: 0,
      discharged: 0,
      transferred: 0
    };

    stats.forEach(stat => {
      summary[stat._id] = stat.count;
      summary.total += stat.count;
    });

    res.json({
      summary,
      departmentStats,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get patient stats error:', error);
    res.status(500).json({
      message: 'Failed to get patient statistics',
      error: 'GET_PATIENT_STATS_ERROR'
    });
  }
});

module.exports = router;

