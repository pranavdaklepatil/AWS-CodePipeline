const express = require('express');
const Bed = require('../models/Bed');
const Department = require('../models/Department');
const Patient = require('../models/Patient');
const { authenticateToken, requireStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/beds
// @desc    Get all beds with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { department, status, departmentName } = req.query;
    
    let filter = { isActive: true };
    
    if (department) filter.department = department;
    if (departmentName) filter.departmentName = departmentName;
    if (status) filter.status = status;

    const beds = await Bed.find(filter)
      .populate('department', 'name description')
      .populate('currentPatient', 'firstName lastName patientId')
      .sort({ departmentName: 1, 'position.row': 1, 'position.column': 1 });

    res.json({
      beds,
      total: beds.length
    });
  } catch (error) {
    console.error('Get beds error:', error);
    res.status(500).json({
      message: 'Failed to get beds',
      error: 'GET_BEDS_ERROR'
    });
  }
});

// @route   GET /api/beds/department/:departmentId/grid
// @desc    Get bed grid layout for department (movie ticket style)
// @access  Public
router.get('/department/:departmentId/grid', async (req, res) => {
  try {
    const { departmentId } = req.params;

    // Verify department exists
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    const beds = await Bed.find({
      department: departmentId,
      isActive: true
    })
    .populate('currentPatient', 'firstName lastName patientId')
    .sort({ 'position.row': 1, 'position.column': 1 });

    // Organize beds into grid layout
    const grid = {};
    let maxRow = 0;
    let maxColumn = 0;

    beds.forEach(bed => {
      const row = bed.position.row;
      const column = bed.position.column;
      
      if (!grid[row]) grid[row] = {};
      grid[row][column] = {
        id: bed._id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        bedType: bed.bedType,
        dailyRate: bed.dailyRate,
        isAvailable: bed.isAvailable(),
        currentPatient: bed.currentPatient ? {
          id: bed.currentPatient._id,
          name: bed.currentPatient.fullName,
          patientId: bed.currentPatient.patientId
        } : null,
        equipment: bed.equipment,
        lastCleaned: bed.lastCleaned,
        notes: bed.notes
      };
      
      maxRow = Math.max(maxRow, row);
      maxColumn = Math.max(maxColumn, column);
    });

    // Convert to array format for easier frontend rendering
    const gridArray = [];
    for (let row = 1; row <= maxRow; row++) {
      const rowData = [];
      for (let column = 1; column <= maxColumn; column++) {
        rowData.push(grid[row] && grid[row][column] ? grid[row][column] : null);
      }
      gridArray.push(rowData);
    }

    // Calculate availability statistics
    const stats = {
      total: beds.length,
      available: beds.filter(bed => bed.status === 'available').length,
      occupied: beds.filter(bed => bed.status === 'occupied').length,
      maintenance: beds.filter(bed => bed.status === 'maintenance').length,
      cleaning: beds.filter(bed => bed.status === 'cleaning').length
    };

    stats.availabilityPercentage = stats.total > 0 ? Math.round((stats.available / stats.total) * 100) : 0;
    
    // Determine color status
    let colorStatus = 'red';
    if (stats.availabilityPercentage >= 60) colorStatus = 'green';
    else if (stats.availabilityPercentage >= 30) colorStatus = 'yellow';

    res.json({
      department: {
        id: department._id,
        name: department.name,
        description: department.description
      },
      grid: gridArray,
      dimensions: {
        rows: maxRow,
        columns: maxColumn
      },
      stats: {
        ...stats,
        colorStatus
      }
    });
  } catch (error) {
    console.error('Get bed grid error:', error);
    res.status(500).json({
      message: 'Failed to get bed grid',
      error: 'GET_BED_GRID_ERROR'
    });
  }
});

// @route   GET /api/beds/:id
// @desc    Get bed by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('department', 'name description')
      .populate('currentPatient', 'firstName lastName patientId dateOfBirth gender');

    if (!bed) {
      return res.status(404).json({
        message: 'Bed not found',
        error: 'BED_NOT_FOUND'
      });
    }

    res.json({ bed });
  } catch (error) {
    console.error('Get bed error:', error);
    res.status(500).json({
      message: 'Failed to get bed',
      error: 'GET_BED_ERROR'
    });
  }
});

// @route   POST /api/beds
// @desc    Create new bed
// @access  Private (Staff)
router.post('/', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      bedNumber,
      department,
      departmentName,
      position,
      bedType,
      equipment,
      dailyRate
    } = req.body;

    // Verify department exists
    const departmentDoc = await Department.findById(department);
    if (!departmentDoc) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // Check if bed number already exists in department
    const existingBed = await Bed.findOne({
      bedNumber,
      department,
      isActive: true
    });

    if (existingBed) {
      return res.status(400).json({
        message: 'Bed number already exists in this department',
        error: 'BED_EXISTS'
      });
    }

    // Check if position is already occupied
    const existingPosition = await Bed.findOne({
      department,
      'position.row': position.row,
      'position.column': position.column,
      isActive: true
    });

    if (existingPosition) {
      return res.status(400).json({
        message: 'Position already occupied',
        error: 'POSITION_OCCUPIED'
      });
    }

    const bed = new Bed({
      bedNumber,
      department,
      departmentName,
      position,
      bedType,
      equipment,
      dailyRate
    });

    await bed.save();
    await bed.populate('department', 'name description');

    // Update department bed count
    await departmentDoc.updateBedCounts();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('bed-created', bed);
    io.emit('department-updated', departmentDoc);

    res.status(201).json({
      message: 'Bed created successfully',
      bed
    });
  } catch (error) {
    console.error('Create bed error:', error);
    
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
      message: 'Bed creation failed',
      error: 'CREATE_BED_ERROR'
    });
  }
});

// @route   PUT /api/beds/:id/status
// @desc    Update bed status
// @access  Private (Staff)
router.put('/:id/status', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const bed = await Bed.findById(req.params.id)
      .populate('department')
      .populate('currentPatient');

    if (!bed) {
      return res.status(404).json({
        message: 'Bed not found',
        error: 'BED_NOT_FOUND'
      });
    }

    const oldStatus = bed.status;

    // Validate status change
    if (status === 'occupied' && !bed.currentPatient) {
      return res.status(400).json({
        message: 'Cannot mark bed as occupied without a patient',
        error: 'NO_PATIENT_ASSIGNED'
      });
    }

    // Update bed status
    bed.status = status;
    if (notes) bed.notes = notes;

    // Handle specific status changes
    switch (status) {
      case 'maintenance':
        bed.currentPatient = null;
        bed.lastMaintenance = new Date();
        break;
      case 'cleaning':
        bed.currentPatient = null;
        bed.lastCleaned = new Date();
        break;
      case 'available':
        bed.currentPatient = null;
        bed.lastCleaned = new Date();
        break;
    }

    await bed.save();

    // Update department bed counts
    await bed.department.updateBedCounts();

    // Emit real-time updates
    const io = req.app.get('io');
    io.emit('bed-status-updated', {
      bedId: bed._id,
      oldStatus,
      newStatus: status,
      departmentId: bed.department._id
    });
    io.emit('department-updated', bed.department);

    res.json({
      message: 'Bed status updated successfully',
      bed: {
        id: bed._id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        notes: bed.notes
      }
    });
  } catch (error) {
    console.error('Update bed status error:', error);
    res.status(500).json({
      message: 'Bed status update failed',
      error: 'UPDATE_BED_STATUS_ERROR'
    });
  }
});

// @route   PUT /api/beds/:id/occupy
// @desc    Occupy bed with patient
// @access  Private (Staff)
router.put('/:id/occupy', authenticateToken, requireStaff, async (req, res) => {
  try {
    const { patientId } = req.body;

    const bed = await Bed.findById(req.params.id).populate('department');

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
        currentStatus: bed.status
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found',
        error: 'PATIENT_NOT_FOUND'
      });
    }

    // Check if patient is already assigned to another bed
    const existingBed = await Bed.findOne({
      currentPatient: patientId,
      status: 'occupied'
    });

    if (existingBed) {
      return res.status(400).json({
        message: 'Patient is already assigned to another bed',
        error: 'PATIENT_ALREADY_ASSIGNED',
        currentBed: existingBed.bedNumber
      });
    }

    // Occupy the bed
    await bed.occupyBed(patientId);
    await bed.populate('currentPatient', 'firstName lastName patientId');

    // Update department bed counts
    await bed.department.updateBedCounts();

    // Emit real-time updates
    const io = req.app.get('io');
    io.emit('bed-occupied', {
      bedId: bed._id,
      bedNumber: bed.bedNumber,
      patient: {
        id: patient._id,
        name: patient.fullName,
        patientId: patient.patientId
      },
      departmentId: bed.department._id
    });
    io.emit('department-updated', bed.department);

    res.json({
      message: 'Bed occupied successfully',
      bed: {
        id: bed._id,
        bedNumber: bed.bedNumber,
        status: bed.status,
        currentPatient: {
          id: patient._id,
          name: patient.fullName,
          patientId: patient.patientId
        }
      }
    });
  } catch (error) {
    console.error('Occupy bed error:', error);
    res.status(500).json({
      message: 'Bed occupation failed',
      error: 'OCCUPY_BED_ERROR'
    });
  }
});

// @route   PUT /api/beds/:id/release
// @desc    Release bed (discharge patient)
// @access  Private (Staff)
router.put('/:id/release', authenticateToken, requireStaff, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id)
      .populate('department')
      .populate('currentPatient');

    if (!bed) {
      return res.status(404).json({
        message: 'Bed not found',
        error: 'BED_NOT_FOUND'
      });
    }

    if (bed.status !== 'occupied') {
      return res.status(400).json({
        message: 'Bed is not occupied',
        error: 'BED_NOT_OCCUPIED',
        currentStatus: bed.status
      });
    }

    const releasedPatient = bed.currentPatient;

    // Release the bed
    await bed.releaseBed();

    // Update department bed counts
    await bed.department.updateBedCounts();

    // Emit real-time updates
    const io = req.app.get('io');
    io.emit('bed-released', {
      bedId: bed._id,
      bedNumber: bed.bedNumber,
      releasedPatient: releasedPatient ? {
        id: releasedPatient._id,
        name: releasedPatient.fullName,
        patientId: releasedPatient.patientId
      } : null,
      departmentId: bed.department._id
    });
    io.emit('department-updated', bed.department);

    res.json({
      message: 'Bed released successfully',
      bed: {
        id: bed._id,
        bedNumber: bed.bedNumber,
        status: bed.status
      },
      releasedPatient: releasedPatient ? {
        id: releasedPatient._id,
        name: releasedPatient.fullName,
        patientId: releasedPatient.patientId
      } : null
    });
  } catch (error) {
    console.error('Release bed error:', error);
    res.status(500).json({
      message: 'Bed release failed',
      error: 'RELEASE_BED_ERROR'
    });
  }
});

// @route   DELETE /api/beds/:id
// @desc    Delete bed (soft delete)
// @access  Private (Staff)
router.delete('/:id', authenticateToken, requireStaff, async (req, res) => {
  try {
    const bed = await Bed.findById(req.params.id).populate('department');

    if (!bed) {
      return res.status(404).json({
        message: 'Bed not found',
        error: 'BED_NOT_FOUND'
      });
    }

    if (bed.status === 'occupied') {
      return res.status(400).json({
        message: 'Cannot delete occupied bed',
        error: 'BED_OCCUPIED'
      });
    }

    // Soft delete
    bed.isActive = false;
    await bed.save();

    // Update department bed counts
    await bed.department.updateBedCounts();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('bed-deleted', {
      bedId: bed._id,
      departmentId: bed.department._id
    });
    io.emit('department-updated', bed.department);

    res.json({
      message: 'Bed deleted successfully'
    });
  } catch (error) {
    console.error('Delete bed error:', error);
    res.status(500).json({
      message: 'Bed deletion failed',
      error: 'DELETE_BED_ERROR'
    });
  }
});

module.exports = router;

