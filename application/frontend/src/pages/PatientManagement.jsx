import { useState, useEffect } from "react";
import { patientAPI, billingAPI } from "../utils/api";
import { Link } from "react-router-dom";
import { Users, Search, Plus, RefreshCw, UserX, Info } from "lucide-react";
import toast from "react-hot-toast";

// Badge component
const Badge = ({ children, color }) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-semibold ${
      color === "green"
        ? "bg-green-100 text-green-700"
        : color === "red"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    {children}
  </span>
);

// Card wrapper
const Card = ({ children }) => (
  <div className="bg-white rounded-xl shadow hover:shadow-lg transition p-5">{children}</div>
);

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editFullName, setEditFullName] = useState("");
  const [editAge, setEditAge] = useState("");
  const [extraChargeDescription, setExtraChargeDescription] = useState("");
  const [extraChargeAmount, setExtraChargeAmount] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await patientAPI.getAll({
        search: searchTerm,
        status: filter === "all" ? undefined : filter,
      });
      setPatients(res.data.patients);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, filter]);

  const handleDischarge = async (id) => {
    try {
      await patientAPI.discharge(id, { status: "discharged" });
      toast.success("Patient discharged successfully");
      fetchPatients();
    } catch (error) {
      console.error(error);
      toast.error("Failed to discharge patient");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "admitted":
        return <Badge color="green">Admitted</Badge>;
      case "discharged":
        return <Badge color="red">Discharged</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const openEditModal = async (patient) => {
    setSelectedPatient(patient);
    setEditFullName(patient.fullName);
    setEditAge(patient.age);
    setExtraChargeDescription("");
    setExtraChargeAmount("");
    try {
      const res = await billingAPI.getAll({ patientId: patient._id });
      const billing = res.data.bills?.[0];
      if (billing) setSelectedPatient((p) => ({ ...p, billing }));
    } catch (error) {
      console.error("Billing fetch failed", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedPatient) return;
    try {
      await patientAPI.update(selectedPatient._id, {
        fullName: editFullName,
        age: editAge,
      });

      if (extraChargeDescription && extraChargeAmount) {
        const billingId = selectedPatient.billing?._id;
        if (!billingId) toast.error("Billing record not found");
        else {
          await billingAPI.addAdditionalCharge(billingId, {
            description: extraChargeDescription,
            amount: parseFloat(extraChargeAmount),
          });
          toast.success("Extra charge added");
        }
      }

      toast.success("Patient updated successfully");
      setSelectedPatient(null);
      fetchPatients();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update patient");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading patients...</span>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Users className="h-8 w-8" />
          <span>Patient Management</span>
        </h1>
        <Link
          to="/patients/admit"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Admit Patient
        </Link>
      </div>

      {/* Filters & Search */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or contact..."
              className="pl-10 pr-3 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            {["all", "admitted", "discharged"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg ${
                  filter === f ? "bg-blue-600 text-white" : "border border-gray-300 text-gray-700"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Patient List */}
      <div className="grid gap-4">
        {patients.length > 0 ? (
          patients.map((p) => (
            <Card key={p._id}>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{p.fullName}</h3>
                    {getStatusBadge(p.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Patient ID:</span> {p.patientId}
                    </div>
                    <div>
                      <span className="font-medium">Age:</span> {p.age} yrs
                    </div>
                    <div>
                      <span className="font-medium">Department:</span> {p.admission?.departmentName}
                    </div>
                    <div>
                      <span className="font-medium">Bed:</span> {p.admission?.assignedBed?.bedNumber}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Admitted:</span>{" "}
                    {new Date(p.admission?.admissionDate).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {/* Patient Info Link */}
                  <Link
                    to={`/patients/${p._id}`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-1"
                    title="View Patient Info"
                  >
                    <Info className="h-4 w-4" /> Info
                  </Link>

                  {/* Edit */}
                  <button
                    className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => openEditModal(p)}
                  >
                    Edit
                  </button>

                  {/* Discharge */}
                  {p.status === "admitted" && (
                    <button
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"
                      onClick={() => handleDischarge(p._id)}
                    >
                      <UserX className="h-4 w-4" /> Discharge
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? "No patients match your search." : "No patients found."}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5 space-y-4">
            <h2 className="text-lg font-semibold">Edit Patient & Add Charge</h2>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Age</label>
                <input
                  type="number"
                  value={editAge}
                  onChange={(e) => setEditAge(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Extra Charge Description</label>
                <input
                  type="text"
                  value={extraChargeDescription}
                  onChange={(e) => setExtraChargeDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Extra Charge Amount</label>
                <input
                  type="number"
                  value={extraChargeAmount}
                  onChange={(e) => setExtraChargeAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  onClick={() => setSelectedPatient(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={handleSaveEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
