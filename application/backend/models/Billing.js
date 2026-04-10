const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  patientId: {
    type: String,
    required: true,
    trim: true
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
  admissionDate: {
    type: Date,
    required: true
  },
  dischargeDate: {
    type: Date
  },
  charges: {
    bedCharges: {
      dailyRate: {
        type: Number,
        required: true,
        min: [0, 'Daily rate cannot be negative']
      },
      numberOfDays: {
        type: Number,
        required: true,
        min: [1, 'Number of days must be at least 1']
      },
      totalBedCharges: {
        type: Number,
        required: true,
        min: [0, 'Total bed charges cannot be negative']
      }
    },
    medicalCharges: [{
      description: {
        type: String,
        required: true,
        trim: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
      },
      date: {
        type: Date,
        default: Date.now
      },
      category: {
        type: String,
        enum: ['consultation', 'medication', 'procedure', 'test', 'equipment', 'other'],
        default: 'other'
      }
    }],
    additionalCharges: [{
      description: {
        type: String,
        required: true,
        trim: true
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  discounts: {
    insuranceDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Insurance discount cannot be negative']
    },
    hospitalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Hospital discount cannot be negative']
    },
    otherDiscounts: {
      type: Number,
      default: 0,
      min: [0, 'Other discounts cannot be negative']
    }
  },
  netAmount: {
    type: Number,
    required: true,
    min: [0, 'Net amount cannot be negative']
  },
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'bank_transfer', 'insurance', 'cheque'],
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: String,
      trim: true
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  }],
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  balanceAmount: {
    type: Number,
    required: true,
    min: [0, 'Balance amount cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  billStatus: {
    type: String,
    enum: ['draft', 'generated', 'sent', 'paid', 'cancelled'],
    default: 'draft'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate unique bill number
billingSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({
      billNumber: { $regex: `^BILL${year}${month}` }
    });
    this.billNumber = `BILL${year}${month}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Calculate totals before saving
billingSchema.pre('save', function(next) {
  // Calculate total medical charges
  const totalMedicalCharges = this.charges.medicalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  
  // Calculate total additional charges
  const totalAdditionalCharges = this.charges.additionalCharges.reduce((sum, charge) => sum + charge.amount, 0);
  
  // Calculate total amount
  this.totalAmount = this.charges.bedCharges.totalBedCharges + totalMedicalCharges + totalAdditionalCharges;
  
  // Calculate total discounts
  const totalDiscounts = this.discounts.insuranceDiscount + this.discounts.hospitalDiscount + this.discounts.otherDiscounts;
  
  // Calculate net amount
  this.netAmount = Math.max(0, this.totalAmount - totalDiscounts);
  
  // Calculate total paid
  this.totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate balance amount
  this.balanceAmount = Math.max(0, this.netAmount - this.totalPaid);
  
  // Update payment status
  if (this.totalPaid === 0) {
    this.paymentStatus = 'pending';
  } else if (this.totalPaid >= this.netAmount) {
    this.paymentStatus = 'paid';
  } else {
    this.paymentStatus = 'partial';
  }
  
  // Check if overdue
  if (this.paymentStatus !== 'paid' && new Date() > this.dueDate) {
    this.paymentStatus = 'overdue';
  }
  
  next();
});

// Add payment method
billingSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  return this.save();
};

// Add medical charge
billingSchema.methods.addMedicalCharge = function(chargeData) {
  this.charges.medicalCharges.push(chargeData);
  return this.save();
};

// Add additional charge
billingSchema.methods.addAdditionalCharge = function(chargeData) {
  this.charges.additionalCharges.push(chargeData);
  return this.save();
};

// Mark as paid
billingSchema.methods.markAsPaid = function() {
  this.paymentStatus = 'paid';
  this.billStatus = 'paid';
  return this.save();
};

// Virtual for payment percentage
billingSchema.virtual('paymentPercentage').get(function() {
  if (this.netAmount === 0) return 100;
  return Math.round((this.totalPaid / this.netAmount) * 100);
});

// Ensure virtual fields are serialized
billingSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Billing', billingSchema);

