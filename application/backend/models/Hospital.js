// models/Hospital.js
const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  contactNumber: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Invalid contact number']
  },
  email: {
    type: String,
    match: [/.+\@.+\..+/, 'Invalid email address']
  },
  establishedYear: Number,
  logo: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Hospital', hospitalSchema);
