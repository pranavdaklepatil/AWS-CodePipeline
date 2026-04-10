import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { patientAPI } from "../utils/api";
import { RefreshCw } from "lucide-react";

const InfoCard = ({ title, children }) => (
  <div className="bg-white shadow-md rounded-xl p-5 mb-4 border border-gray-100">
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    <div className="text-gray-700 space-y-1">{children}</div>
  </div>
);

const PatientProfile = () => {
  const { id } = useParams(); // patient ID from URL
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const res = await patientAPI.getById(id);
        setPatient(res.data.patient);
      } catch (err) {
        console.error("Failed to fetch patient:", err);
        setError(err.response?.data?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading patient profile...</span>
      </div>
    );

  if (error)
    return (
      <p className="text-red-600 text-center mt-10 font-semibold">{error}</p>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        {patient.firstName} {patient.lastName} - Profile
      </h1>

      {/* Basic Info */}
      <InfoCard title="Basic Info">
        <p><strong>Patient ID:</strong> {patient.patientId}</p>
        <p><strong>Name:</strong> {patient.firstName} {patient.lastName}</p>
        <p><strong>Age:</strong> {patient.age} yrs</p>
        <p><strong>Gender:</strong> {patient.gender}</p>
        <p><strong>Contact:</strong> {patient.contactNumber}</p>
        <p><strong>Email:</strong> {patient.email || "N/A"}</p>
      </InfoCard>

      {/* Address */}
      <InfoCard title="Address">
        <p>
          {patient.address?.street}, {patient.address?.city}, {patient.address?.state}, {patient.address?.zipCode}, {patient.address?.country}
        </p>
      </InfoCard>

      {/* Emergency Contact */}
      <InfoCard title="Emergency Contact">
        <p><strong>Name:</strong> {patient.emergencyContact?.name || "N/A"}</p>
        <p><strong>Relationship:</strong> {patient.emergencyContact?.relationship || "N/A"}</p>
        <p><strong>Contact:</strong> {patient.emergencyContact?.contactNumber || "N/A"}</p>
      </InfoCard>

      {/* Admission Info */}
      <InfoCard title="Admission Info">
        <p><strong>Department:</strong> {patient.admission?.departmentName || "N/A"}</p>
        <p><strong>Bed:</strong> {patient.admission?.assignedBed?.bedNumber || "N/A"}</p>
        <p><strong>Admitting Doctor:</strong> {patient.admission?.admittingDoctor?.fullName || "N/A"}</p>
        <p><strong>Reason:</strong> {patient.admission?.reasonForAdmission || "N/A"}</p>
        <p><strong>Diagnosis:</strong> {patient.admission?.diagnosis || "N/A"}</p>
        <p><strong>Treatment Plan:</strong> {patient.admission?.treatmentPlan || "N/A"}</p>
        <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-white ${patient.status === "admitted" ? "bg-green-500" : "bg-red-500"}`}>{patient.status}</span></p>
      </InfoCard>

      {/* Medical History */}
      <InfoCard title="Medical History">
        <p><strong>Allergies:</strong> {patient.medicalHistory?.allergies?.join(", ") || "None"}</p>
        <p><strong>Chronic Conditions:</strong> {patient.medicalHistory?.chronicConditions?.join(", ") || "None"}</p>
        <p><strong>Medications:</strong> {patient.medicalHistory?.medications?.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(", ") || "None"}</p>
        <p><strong>Blood Type:</strong> {patient.medicalHistory?.bloodType || "N/A"}</p>
      </InfoCard>

      {/* Insurance */}
      <InfoCard title="Insurance">
        <p><strong>Provider:</strong> {patient.insurance?.provider || "N/A"}</p>
        <p><strong>Policy Number:</strong> {patient.insurance?.policyNumber || "N/A"}</p>
        <p><strong>Coverage:</strong> {patient.insurance?.coverageAmount || 0}</p>
      </InfoCard>
    </div>
  );
};

export default PatientProfile;
