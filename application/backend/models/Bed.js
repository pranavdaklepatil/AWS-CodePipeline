const mongoose = require('mongoose');

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: [true, 'Bed number is required'],
    trim: true,
    maxlength: [10, 'Bed number cannot exceed 10 characters']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  departmentName: {
    type: String,
    required: true,
    enum: ['General', 'ICU']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'cleaning'],
    default: 'available',
    required: true
  },
  position: {
    row: {
      type: Number,
      required: true,
      min: [1, 'Row must be at least 1']
    },
    column: {
      type: Number,
      required: true,
      min: [1, 'Column must be at least 1']
    }
  },
  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  bedType: {
    type: String,
    enum: ['standard', 'deluxe', 'icu', 'ventilator'],
    default: 'standard'
  },
  equipment: [{
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['working', 'maintenance', 'broken'],
      default: 'working'
    }
  }],
  dailyRate: {
    type: Number,
    required: true,
    min: [0, 'Daily rate cannot be negative'],
    default: function() {
      switch(this.bedType) {
        case 'icu': return 5000;
        case 'ventilator': return 8000;
        case 'deluxe': return 3000;
        default: return 2000;
      }
    }
  },
  lastCleaned: {
    type: Date,
    default: Date.now
  },
  lastMaintenance: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique bed numbers within departments
bedSchema.index({ bedNumber: 1, department: 1 }, { unique: true });

// Index for efficient querying
bedSchema.index({ department: 1, status: 1 });
bedSchema.index({ departmentName: 1, status: 1 });

// Virtual for bed identifier
bedSchema.virtual('bedId').get(function() {
  return `${this.departmentName}-${this.bedNumber}`;
});

// Check if bed is available for booking
bedSchema.methods.isAvailable = function() {
  return this.status === 'available' && this.isActive;
};

// Occupy bed with patient
bedSchema.methods.occupyBed = async function(patientId) {
  if (!this.isAvailable()) {
    throw new Error('Bed is not available for occupation');
  }
  
  this.status = 'occupied';
  this.currentPatient = patientId;
  return await this.save();
};

// Release bed
bedSchema.methods.releaseBed = async function() {
  this.status = 'available';
  this.currentPatient = null;
  this.lastCleaned = new Date();
  return await this.save();
};

// Set bed to maintenance
bedSchema.methods.setMaintenance = async function(notes) {
  this.status = 'maintenance';
  this.currentPatient = null;
  this.lastMaintenance = new Date();
  if (notes) this.notes = notes;
  return await this.save();
};

// Pre-save middleware to validate bed occupation
bedSchema.pre('save', function(next) {
  if (this.status === 'occupied' && !this.currentPatient) {
    return next(new Error('Occupied bed must have a current patient'));
  }
  
  if (this.status !== 'occupied' && this.currentPatient) {
    this.currentPatient = null;
  }
  
  next();
});

// Ensure virtual fields are serialized
bedSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Bed', bedSchema);

