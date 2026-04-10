import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { departmentAPI, patientAPI, billingAPI } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { Wifi, Bed, Users, CreditCard, LayoutDashboard, Activity, RefreshCw, ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    departments: [],
    patients: null,
    billing: null
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [departmentsRes, patientsRes, billingRes] = await Promise.all([
        departmentAPI.getAll(),
        patientAPI.getStats(),
        billingAPI.getStats()
      ]);

      setStats({
        departments: departmentsRes.data.departments,
        patients: patientsRes.data.summary,
        billing: billingRes.data.totals
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleUpdate = () => fetchDashboardData();
    window.addEventListener("department-updated", handleUpdate);
    window.addEventListener("patient-updated", handleUpdate);
    window.addEventListener("billing-updated", handleUpdate);
    return () => {
      window.removeEventListener("department-updated", handleUpdate);
      window.removeEventListener("patient-updated", handleUpdate);
      window.removeEventListener("billing-updated", handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-600">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const totalBeds = stats.departments.reduce((sum, dept) => sum + dept.totalBeds, 0);
  const availableBeds = stats.departments.reduce((sum, dept) => sum + dept.availableBeds, 0);
  const occupiedBeds = stats.departments.reduce((sum, dept) => sum + dept.occupiedBeds, 0);
  const overallAvailability = totalBeds > 0 ? Math.round((availableBeds / totalBeds) * 100) : 0;

  return (
    <div className="space-y-8 px-4 md:px-6 lg:px-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-2 text-gray-800">
            <LayoutDashboard className="h-8 w-8 text-blue-600" /> Dashboard
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Welcome back, <span className="font-medium">{user?.fullName}</span> ({user?.role})
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-100 text-sm transition"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Beds" value={totalBeds} icon={<Bed className="h-5 w-5 text-gray-600" />} subtitle="Across all departments" />
        <StatCard title="Available Beds" value={availableBeds} icon={<Activity className="h-5 w-5 text-green-600" />} subtitle={`${overallAvailability}% availability`} valueColor="text-green-600" />
        <StatCard title="Admitted Patients" value={stats.patients?.admitted || 0} icon={<Users className="h-5 w-5 text-gray-600" />} subtitle="Currently in hospital" />
        <StatCard title="Total Revenue" value={`₹${stats.billing?.totalPaid?.toLocaleString() || 0}`} icon={<CreditCard className="h-5 w-5 text-gray-600" />} subtitle="Collected payments" />
      </div>

      {/* Department Overview */}
      <Card title="Department Overview" description="Real-time bed availability by department">
        <div className="space-y-4">
          {stats.departments.map((dept) => (
            <div key={dept._id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:shadow transition">
              <div className="space-y-1">
                <h3 className="font-medium text-gray-800">{dept.name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span>Total: {dept.totalBeds}</span>
                  <span className="text-green-600">Available: {dept.availableBeds}</span>
                  <span className="text-red-600">Occupied: {dept.occupiedBeds}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 md:mt-0">
                <div className="text-right">
                  <span className="text-sm font-medium">{dept.availabilityPercentage}% Available</span>
                  <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                    <div className="h-2 rounded-full bg-green-500" style={{ width: `${dept.availabilityPercentage}%` }}></div>
                  </div>
                </div>
                <Link to={`/beds/${dept._id}`}>
                  <button className="flex items-center gap-1 px-3 py-1 rounded-md border border-gray-300 hover:bg-gray-100 text-sm transition">
                    View Beds <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard title="Patient Management" description="Admit, discharge, and manage patients" icon={<Users className="h-5 w-5" />}>
          <Link to="/patients">
            <button className="w-full border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition">View All Patients</button>
          </Link>
          <Link to="/patients/admit">
            <button className="w-full bg-blue-600 text-white rounded-md px-3 py-2 hover:bg-blue-700 transition mt-2">Admit New Patient</button>
          </Link>
        </ActionCard>

        <ActionCard title="Billing Management" description="Manage bills and payments" icon={<CreditCard className="h-5 w-5" />}>
          <Link to="/billing">
            <button className="w-full border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-100 transition">View All Bills</button>
          </Link>
          <div className="text-sm text-gray-600 mt-2">
            <div>Pending: ₹{stats.billing?.totalBalance?.toLocaleString() || 0}</div>
            <div>Total Bills: {stats.billing?.totalBills || 0}</div>
          </div>
        </ActionCard>

        <ActionCard title="Quick Stats" description="Key performance indicators" icon={<TrendingUp className="h-5 w-5" />}>
          <StatLine label="Occupancy Rate" value={`${totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%`} />
          <StatLine label="Total Patients" value={stats.patients?.total || 0} />
          <StatLine label="Discharged" value={stats.patients?.discharged || 0} />
        </ActionCard>
      </div>

      {/* Alerts */}
      {overallAvailability < 30 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
          <div>
            <h3 className="font-medium text-yellow-800">Low Bed Availability</h3>
            <p className="text-sm text-yellow-700">
              Only {overallAvailability}% of beds are available. Consider reviewing discharge schedules.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const Card = ({ title, description, children }) => (
  <div className="bg-white rounded-xl shadow p-4">
    {title && (
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    )}
    {children}
  </div>
);

const StatCard = ({ title, value, icon, subtitle, valueColor }) => (
  <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-lg transition">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium text-gray-600">{title}</span>
      {icon}
    </div>
    <div className={`text-2xl font-bold ${valueColor || "text-gray-800"}`}>{value}</div>
    {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
  </div>
);

const ActionCard = ({ title, description, icon, children }) => (
  <div className="bg-white rounded-xl shadow p-4 flex flex-col justify-between hover:shadow-lg transition">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
    </div>
    {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
    <div className="flex flex-col gap-2">{children}</div>
  </div>
);

const StatLine = ({ label, value }) => (
  <div className="flex justify-between text-sm text-gray-700">
    <span>{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default Dashboard;

