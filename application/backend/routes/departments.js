const express = require('express');
const Department = require('../models/Department');
const Bed = require('../models/Bed');
const { authenticateToken, requireAdmin, requireStaff } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/departments
// @desc    Get all departments with bed availability
// @access  Public
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('headOfDepartment', 'firstName lastName fullName')
      .sort({ name: 1 });

    // Calculate real-time bed counts from Bed collection
    for (let department of departments) {
      const bedCounts = await Bed.aggregate([
        { 
          $match: { 
            department: department._id,
            isActive: true
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const counts = {
        total: 0,
        occupied: 0,
        available: 0,
        maintenance: 0,
        cleaning: 0
      };

      bedCounts.forEach(item => {
        counts[item._id] = item.count;
        counts.total += item.count;
      });

      // Update department with real-time counts
      department.totalBeds = counts.total;
      department.occupiedBeds = counts.occupied;
      department.maintenanceBeds = counts.maintenance + counts.cleaning;
      department.availableBeds = counts.available;

      await department.save();
    }

    res.json({
      departments,
      total: departments.length
    });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({
      message: 'Failed to get departments',
      error: 'GET_DEPARTMENTS_ERROR'
    });
  }
});

// @route   GET /api/departments/:id
// @desc    Get department by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('headOfDepartment', 'firstName lastName fullName');

    if (!department) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // Get real-time bed counts
    const bedCounts = await Bed.aggregate([
      { 
        $match: { 
          department: department._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      total: 0,
      occupied: 0,
      available: 0,
      maintenance: 0,
      cleaning: 0
    };

    bedCounts.forEach(item => {
      counts[item._id] = item.count;
      counts.total += item.count;
    });

    // Update department with real-time counts
    department.totalBeds = counts.total;
    department.occupiedBeds = counts.occupied;
    department.maintenanceBeds = counts.maintenance + counts.cleaning;
    department.availableBeds = counts.available;

    await department.save();

    res.json({ department });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({
      message: 'Failed to get department',
      error: 'GET_DEPARTMENT_ERROR'
    });
  }
});

// @route   POST /api/departments
// @desc    Create new department
// @access  Private (Admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      totalBeds,
      headOfDepartment,
      contactNumber,
      location
    } = req.body;

    // Check if department already exists
    const existingDepartment = await Department.findOne({ name });

    if (existingDepartment) {
      return res.status(400).json({
        message: 'Department already exists',
        error: 'DEPARTMENT_EXISTS'
      });
    }

    const department = new Department({
      name,
      description,
      totalBeds,
      headOfDepartment,
      contactNumber,
      location
    });

    await department.save();

    // Create beds for the department
    const beds = [];
    const bedsPerRow = 5; // 5 beds per row for grid layout
    
    for (let i = 1; i <= totalBeds; i++) {
      const row = Math.ceil(i / bedsPerRow);
      const column = ((i - 1) % bedsPerRow) + 1;
      
      beds.push({
        bedNumber: `${name.substring(0, 3).toUpperCase()}${String(i).padStart(2, '0')}`,
        department: department._id,
        departmentName: name,
        position: { row, column },
        bedType: name === 'ICU' ? 'icu' : 'standard'
      });
    }

    await Bed.insertMany(beds);

    // Populate and return the created department
    await department.populate('headOfDepartment', 'firstName lastName fullName');

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('department-created', department);

    res.status(201).json({
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Create department error:', error);
    
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
      message: 'Department creation failed',
      error: 'CREATE_DEPARTMENT_ERROR'
    });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update department
// @access  Private (Admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      description,
      headOfDepartment,
      contactNumber,
      location
    } = req.body;

    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // Update fields
    if (description !== undefined) department.description = description;
    if (headOfDepartment !== undefined) department.headOfDepartment = headOfDepartment;
    if (contactNumber !== undefined) department.contactNumber = contactNumber;
    if (location !== undefined) department.location = location;

    await department.save();
    await department.populate('headOfDepartment', 'firstName lastName fullName');

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('department-updated', department);

    res.json({
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Update department error:', error);
    
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
      message: 'Department update failed',
      error: 'UPDATE_DEPARTMENT_ERROR'
    });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete department (soft delete)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // Check if department has occupied beds
    const occupiedBeds = await Bed.countDocuments({
      department: department._id,
      status: 'occupied'
    });

    if (occupiedBeds > 0) {
      return res.status(400).json({
        message: 'Cannot delete department with occupied beds',
        error: 'DEPARTMENT_HAS_OCCUPIED_BEDS',
        occupiedBeds
      });
    }

    // Soft delete
    department.isActive = false;
    await department.save();

    // Also deactivate all beds in the department
    await Bed.updateMany(
      { department: department._id },
      { isActive: false }
    );

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('department-deleted', { departmentId: department._id });

    res.json({
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({
      message: 'Department deletion failed',
      error: 'DELETE_DEPARTMENT_ERROR'
    });
  }
});

// @route   GET /api/departments/:id/stats
// @desc    Get department statistics
// @access  Private (Staff)
router.get('/:id/stats', authenticateToken, requireStaff, async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        message: 'Department not found',
        error: 'DEPARTMENT_NOT_FOUND'
      });
    }

    // Get detailed bed statistics
    const bedStats = await Bed.aggregate([
      { 
        $match: { 
          department: department._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          beds: { $push: '$bedNumber' }
        }
      }
    ]);

    // Get bed type distribution
    const bedTypeStats = await Bed.aggregate([
      { 
        $match: { 
          department: department._id,
          isActive: true
        }
      },
      {
        $group: {
          _id: '$bedType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      department: {
        id: department._id,
        name: department.name,
        totalBeds: department.totalBeds,
        availabilityPercentage: department.availabilityPercentage,
        availabilityStatus: department.availabilityStatus
      },
      bedStats,
      bedTypeStats
    });
  } catch (error) {
    console.error('Get department stats error:', error);
    res.status(500).json({
      message: 'Failed to get department statistics',
      error: 'GET_DEPARTMENT_STATS_ERROR'
    });
  }
});

module.exports = router;

