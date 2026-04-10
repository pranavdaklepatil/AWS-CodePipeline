import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { departmentAPI, bedAPI, patientAPI } from '../utils/api';
import toast from 'react-hot-toast';

const AdmitPatientForm = () => {
  const [departments, setDepartments] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    contactNumber: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactNumber: '',
    departmentId: '',
    bedId: '',
    reasonForAdmission: '',
    billStatus: 'draft'
  });

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentAPI.getAll();
        setDepartments(res.data.departments || res.data);
      } catch (error) {
        toast.error('Failed to fetch departments');
      }
    };
    fetchDepartments();
  }, []);

  // Fetch beds based on department
  useEffect(() => {
    if (!formData.departmentId) {
      setBeds([]);
      return;
    }
    const fetchBeds = async () => {
      try {
        const res = await bedAPI.getAll({ department: formData.departmentId, status: 'available' });
        setBeds(res.data.beds || res.data);
      } catch (error) {
        toast.error('Failed to fetch beds');
      }
    };
    fetchBeds();
  }, [formData.departmentId]);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departmentId || !formData.bedId) {
      toast.error('Please select a department and bed');
      return;
    }
    setLoading(true);
    try {
      await patientAPI.admit({
        ...formData,
        emergencyContact: {
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          contactNumber: formData.emergencyContactNumber
        }
      });
      toast.success('Patient admitted successfully');
      setFormData({
        firstName: '', lastName: '', dateOfBirth: '', gender: '', contactNumber: '',
        emergencyContactName: '', emergencyContactRelationship: '', emergencyContactNumber: '',
        departmentId: '', bedId: '', reasonForAdmission: '', billStatus: 'draft'
      });
      setBeds([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800">Admit New Patient</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input placeholder="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
          <Input placeholder="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
          <Input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
          
          <Select onValueChange={value => setFormData(prev => ({ ...prev, gender: value }))} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Contact Number" name="contactNumber" value={formData.contactNumber} onChange={handleChange} required />
          <Input placeholder="Emergency Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} required />
          <Input placeholder="Emergency Contact Relationship" name="emergencyContactRelationship" value={formData.emergencyContactRelationship} onChange={handleChange} required />
          <Input placeholder="Emergency Contact Number" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} required />

          <Select onValueChange={value => setFormData(prev => ({ ...prev, departmentId: value }))} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map(dep => <SelectItem key={dep._id} value={dep._id}>{dep.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={value => setFormData(prev => ({ ...prev, bedId: value }))} disabled={!beds.length} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Bed" />
            </SelectTrigger>
            <SelectContent>
              {beds.map(bed => <SelectItem key={bed._id} value={bed._id}>{bed.bedNumber}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input placeholder="Reason for Admission" name="reasonForAdmission" value={formData.reasonForAdmission} onChange={handleChange} required />

          <Select onValueChange={value => setFormData(prev => ({ ...prev, billStatus: value }))} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Bill Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <div className="col-span-2">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? 'Admitting...' : 'Admit Patient'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdmitPatientForm;
