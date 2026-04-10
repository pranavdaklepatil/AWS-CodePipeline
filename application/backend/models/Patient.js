const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    // required: true,
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid contact number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    },
    contactNumber: {
      type: String,
      required: [true, 'Emergency contact number is required'],
      trim: true,
      match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid contact number']
    }
  },
  medicalHistory: {
    allergies: [{
      type: String,
      trim: true
    }],
    chronicConditions: [{
      type: String,
      trim: true
    }],
    medications: [{
      name: {
        type: String,
        trim: true
      },
      dosage: {
        type: String,
        trim: true
      },
      frequency: {
        type: String,
        trim: true
      }
    }],
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown'
    }
  },
  admission: {
    admissionDate: {
      type: Date,
      default: Date.now
    },
    dischargeDate: {
      type: Date
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    departmentName: {
      type: String,
      required: true,
      enum: ['General', 'ICU']
    },
    assignedBed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bed',
      required: true
    },
    admittingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reasonForAdmission: {
      type: String,
      required: [true, 'Reason for admission is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
    },
    treatmentPlan: {
      type: String,
      trim: true,
      maxlength: [1000, 'Treatment plan cannot exceed 1000 characters']
    }
  },
  status: {
    type: String,
    enum: ['admitted', 'discharged', 'transferred'],
    default: 'admitted'
  },
  insurance: {
    provider: {
      type: String,
      trim: true
    },
    policyNumber: {
      type: String,
      trim: true
    },
    coverageAmount: {
      type: Number,
      min: [0, 'Coverage amount cannot be negative']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
}, {
  timestamps: true
});

patientSchema.pre('validate', async function(next) {
  if (!this.patientId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      patientId: { $regex: `^PAT${year}` }
    });
    this.patientId = `PAT${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});


// Virtual for full name
patientSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for admission duration
patientSchema.virtual('admissionDuration').get(function() {
  if (!this.admission.admissionDate) return null;
  
  const endDate = this.admission.dischargeDate || new Date();
  const startDate = new Date(this.admission.admissionDate);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Generate unique patient ID
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments({
      patientId: { $regex: `^PAT${year}` }
    });
    this.patientId = `PAT${year}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Discharge patient method
patientSchema.methods.discharge = async function(dischargeDate = new Date()) {
  this.status = 'discharged';
  this.admission.dischargeDate = dischargeDate;
  return await this.save();
};

// Ensure virtual fields are serialized
patientSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Patient', patientSchema);

