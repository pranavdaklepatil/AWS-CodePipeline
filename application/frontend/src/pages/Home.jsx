import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { departmentAPI } from "../utils/api"
import {
  Hospital,
  Bed,
  Users,
  Activity,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts"

const COLORS = ["#4ade80", "#facc15", "#f87171"] // Green, Yellow, Red

const Home = () => {
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const response = await departmentAPI.getAll()
      setDepartments(response.data.departments)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch departments:", error)
      toast.error("Failed to load department information")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
    const handleDepartmentUpdate = () => fetchDepartments()
    window.addEventListener("department-updated", handleDepartmentUpdate)
    const interval = setInterval(fetchDepartments, 30000)
    return () => {
      window.removeEventListener("department-updated", handleDepartmentUpdate)
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-600">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading hospital information...</span>
      </div>
    )
  }

  // Chart data
  const pieData = departments.map((dept) => ({
    name: dept.name,
    value: dept.occupiedBeds,
  }))

  const barData = departments.map((dept) => ({
    name: dept.name,
    Available: dept.availableBeds,
    Occupied: dept.occupiedBeds,
    Maintenance: dept.maintenanceBeds || 0,
  }))

  return (
    <div className="space-y-10 px-4 md:px-8 lg:px-12">
      {/* Header */}
      <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Hospital className="h-10 w-10 text-blue-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Galaxy Hospital Dashboard
          </h1>
        </div>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
          Real-time bed availability and hospital management insights
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-2">
          <Activity className="h-4 w-4 text-green-600" />
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button
            onClick={fetchDepartments}
            className="ml-2 p-1 rounded-full hover:bg-gray-200 transition"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-2">
            Occupied Beds Distribution
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Distribution of occupied beds across all departments
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-lg font-semibold mb-2">
            Beds Overview by Department
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Comparison of available, occupied, and maintenance beds
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Available" fill="#4ade80" />
                <Bar dataKey="Occupied" fill="#f87171" />
                <Bar dataKey="Maintenance" fill="#facc15" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Department Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((department) => (
            <div
              key={department._id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition p-5 flex flex-col"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <Bed className="h-5 w-5 text-blue-600" /> {department.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    department.availabilityPercentage >= 60
                      ? "bg-green-100 text-green-600"
                      : department.availabilityPercentage >= 30
                      ? "bg-yellow-100 text-yellow-600"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {department.availabilityPercentage}% Available
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4 flex-1">
                {department.description || `${department.name} Department`}
              </p>

              <div className="grid grid-cols-3 text-center mb-4">
                <div>
                  <p className="text-xl font-bold">{department.totalBeds}</p>
                  <p className="text-xs text-gray-500">Total Beds</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">
                    {department.availableBeds}
                  </p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-red-600">
                    {department.occupiedBeds}
                  </p>
                  <p className="text-xs text-gray-500">Occupied</p>
                </div>
              </div>

              <Link
                to={`/beds/${department._id}`}
                className="mt-auto w-full inline-flex items-center justify-center bg-blue-600 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-blue-700 transition"
              >
                View Bed Layout
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Overview */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
          <Users className="h-5 w-5 text-blue-600" /> Hospital Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">
              {departments.reduce((sum, d) => sum + d.totalBeds, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Beds</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {departments.reduce((sum, d) => sum + d.availableBeds, 0)}
            </p>
            <p className="text-sm text-gray-500">Available Beds</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">
              {departments.reduce((sum, d) => sum + d.occupiedBeds, 0)}
            </p>
            <p className="text-sm text-gray-500">Occupied Beds</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {departments.reduce(
                (sum, d) => sum + (d.maintenanceBeds || 0),
                0
              )}
            </p>
            <p className="text-sm text-gray-500">Maintenance</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
