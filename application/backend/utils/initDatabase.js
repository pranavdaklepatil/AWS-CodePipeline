const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Bed = require('../models/Bed');
const Patient = require('../models/Patient');
const Billing = require('../models/Billing');
require('dotenv').config();

const initDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI , {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Bed.deleteMany({});
    await Patient.deleteMany({});
    await Billing.deleteMany({});

    // Create demo users
    console.log('Creating demo users...');
    const users = [
      {
        username: 'admin',
        email: 'admin@medgrid.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        department: 'Administration',
        employeeId: 'EMP001'
      },
      {
        username: 'doctor',
        email: 'doctor@medgrid.com',
        password: 'doctor123',
        role: 'doctor',
        firstName: 'John',
        lastName: 'Smith',
        department: 'General',
        employeeId: 'DOC001'
      },
      {
        username: 'nurse',
        email: 'nurse@medgrid.com',
        password: 'nurse123',
        role: 'nurse',
        firstName: 'Sarah',
        lastName: 'Johnson',
        department: 'ICU',
        employeeId: 'NUR001'
      },
      {
        username: 'staff',
        email: 'staff@medgrid.com',
        password: 'staff123',
        role: 'staff',
        firstName: 'Mike',
        lastName: 'Wilson',
        department: 'General',
        employeeId: 'STF001'
      }
    ];
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} demo users`);

    // Create departments
    console.log('Creating departments...');
    const departments = [
      {
        name: 'General',
        description: 'General medical care and treatment',
        totalBeds: 10,
        headOfDepartment: createdUsers.find(u => u.role === 'doctor')._id,
        contactNumber: '+1-555-0101',
        location: { floor: 1, wing: 'A', room: '101-110' }
      },
      {
        name: 'ICU',
        description: 'Intensive Care Unit for critical patients',
        totalBeds: 10,
        headOfDepartment: createdUsers.find(u => u.role === 'doctor')._id,
        contactNumber: '+1-555-0201',
        location: { floor: 2, wing: 'B', room: '201-210' }
      }
    ];
    const createdDepartments = await Department.insertMany(departments);
    console.log(`Created ${createdDepartments.length} departments`);

    // Create beds
    console.log('Creating beds...');
    let totalBeds = 0;
    for (const department of createdDepartments) {
      const beds = [];
      const bedsPerRow = 5;

      for (let i = 1; i <= department.totalBeds; i++) {
        const row = Math.ceil(i / bedsPerRow);
        const column = ((i - 1) % bedsPerRow) + 1;

        beds.push({
          bedNumber: `${department.name.substring(0, 3).toUpperCase()}${String(i).padStart(2, '0')}`,
          department: department._id,
          departmentName: department.name,
          position: { row, column },
          bedType: department.name === 'ICU' ? 'icu' : 'standard',
          dailyRate: department.name === 'ICU' ? 5000 : 2000,
          equipment: department.name === 'ICU'
            ? [
                { name: 'Ventilator', status: 'working' },
                { name: 'Heart Monitor', status: 'working' },
                { name: 'IV Pump', status: 'working' }
              ]
            : [
                { name: 'Basic Monitor', status: 'working' },
                { name: 'IV Stand', status: 'working' }
              ]
        });
      }

      await Bed.insertMany(beds);
      totalBeds += beds.length;
      console.log(`Created ${beds.length} beds for ${department.name} department`);
    }

    // Create demo patients
    console.log('Creating demo patients...');
    const patients = [
      {
        firstName: 'Alice',
        lastName: 'Brown',
        dateOfBirth: new Date('1990-05-15'),
        gender: 'Female',
        contactNumber: '+1-555-1001',
        email: 'alice.brown@example.com',
        address: { street: '123 Main St', city: 'CityA', state: 'StateA', zipCode: '10001' },
        emergencyContact: { name: 'Bob Brown', relationship: 'Brother', contactNumber: '+1-555-1002' },
        department: createdDepartments[0]._id,
        admission: {
          department: createdDepartments[0]._id,
          departmentName: createdDepartments[0].name,
          assignedBed: (await Bed.findOne({ department: createdDepartments[0]._id }))._id,
          admittingDoctor: createdUsers.find(u => u.role === 'doctor')._id,
          reasonForAdmission: 'Fever and cough'
        }
      },
      {
        firstName: 'David',
        lastName: 'Green',
        dateOfBirth: new Date('1985-09-22'),
        gender: 'Male',
        contactNumber: '+1-555-2001',
        email: 'david.green@example.com',
        address: { street: '456 Oak St', city: 'CityB', state: 'StateB', zipCode: '20002' },
        emergencyContact: { name: 'Emma Green', relationship: 'Wife', contactNumber: '+1-555-2002' },
        department: createdDepartments[1]._id,
        admission: {
          department: createdDepartments[1]._id,
          departmentName: createdDepartments[1].name,
          assignedBed: (await Bed.findOne({ department: createdDepartments[1]._id }))._id,
          admittingDoctor: createdUsers.find(u => u.role === 'doctor')._id,
          reasonForAdmission: 'Severe injury'
        }
      }
    ];
    const createdPatients = await Patient.insertMany(patients);
    console.log(`Created ${createdPatients.length} demo patients`);

    // Create demo bills
    console.log('Creating demo billing records...');
    const bills = createdPatients.map(patient => ({
      patient: patient._id,
      patientName: patient.fullName,
      patientId: patient.patientId,
      department: patient.admission.department,
      departmentName: patient.admission.departmentName,
      admissionDate: patient.admission.admissionDate,
      dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      charges: {
        bedCharges: {
          dailyRate: 2000,
          numberOfDays: 2,
          totalBedCharges: 4000
        },
        medicalCharges: [
          { description: 'Consultation', amount: 500, category: 'consultation' }
        ],
        additionalCharges: []
      },
      netAmount: 4500,
      balanceAmount: 4500,
      generatedBy: createdUsers.find(u => u.role === 'staff')._id
    }));
    await Billing.insertMany(bills);
    console.log(`Created ${bills.length} billing records`);

    console.log(`\n✅ Database initialization completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Departments: ${createdDepartments.length}`);
    console.log(`   - Beds: ${totalBeds}`);
    console.log(`   - Patients: ${createdPatients.length}`);
    console.log(`   - Bills: ${bills.length}`);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
