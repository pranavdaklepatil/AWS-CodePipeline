const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    unique: true,
    trim: true,
    enum: ['General', 'ICU'],
    default: 'General'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  totalBeds: {
    type: Number,
    required: true,
    default: 10,
    min: [1, 'Total beds must be at least 1'],
    max: [100, 'Total beds cannot exceed 100']
  },
  occupiedBeds: {
    type: Number,
    default: 0,
    min: [0, 'Occupied beds cannot be negative']
  },
  availableBeds: {
    type: Number,
    default: function() {
      return this.totalBeds - this.occupiedBeds;
    }
  },
  maintenanceBeds: {
    type: Number,
    default: 0,
    min: [0, 'Maintenance beds cannot be negative']
  },
  headOfDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  contactNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid contact number']
  },
  location: {
    floor: {
      type: Number,
      min: [1, 'Floor must be at least 1']
    },
    wing: {
      type: String,
      trim: true
    },
    room: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
}, {
  timestamps: true
});

// Calculate availability percentage
departmentSchema.virtual('availabilityPercentage').get(function() {
  if (this.totalBeds === 0) return 0;
  return Math.round((this.availableBeds / this.totalBeds) * 100);
});

// Get availability status color
departmentSchema.virtual('availabilityStatus').get(function() {
  const percentage = this.availabilityPercentage;
  if (percentage >= 60) return 'green';
  if (percentage >= 30) return 'yellow';
  return 'red';
});

// Update bed counts
departmentSchema.methods.updateBedCounts = function() {
  this.availableBeds = this.totalBeds - this.occupiedBeds - this.maintenanceBeds;
  return this.save();
};

// Validate bed counts
departmentSchema.pre('save', function(next) {
  if (this.occupiedBeds + this.maintenanceBeds > this.totalBeds) {
    return next(new Error('Occupied and maintenance beds cannot exceed total beds'));
  }
  
  this.availableBeds = this.totalBeds - this.occupiedBeds - this.maintenanceBeds;
  next();
});

// Ensure virtual fields are serialized
departmentSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Department', departmentSchema);

