import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { bedAPI } from "../utils/api"
import { useAuth } from "../contexts/AuthContext"
import {
  Bed,
  User,
  ArrowLeft,
  RefreshCw,
  Plus,
  Settings,
  Activity,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"

const BedGrid = () => {
  const { departmentId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isStaff } = useAuth()

  const [bedData, setBedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [selectedBed, setSelectedBed] = useState(null)

  const fetchBedGrid = async () => {
    try {
      const response = await bedAPI.getGrid(departmentId)
      setBedData(response.data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Failed to fetch bed grid:", error)
      toast.error("Failed to load bed information")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBedGrid()
    const handleBedUpdate = () => fetchBedGrid()
    window.addEventListener("bed-updated", handleBedUpdate)
    window.addEventListener("department-updated", handleBedUpdate)
    return () => {
      window.removeEventListener("bed-updated", handleBedUpdate)
      window.removeEventListener("department-updated", handleBedUpdate)
    }
  }, [departmentId])

  const getStatusStyle = (status) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-700 border-green-300"
      case "occupied":
        return "bg-red-100 text-red-700 border-red-300"
      case "maintenance":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "cleaning":
        return "bg-blue-100 text-blue-700 border-blue-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  const handleBedClick = (bed) => {
    if (!bed) return
    if (isAuthenticated && isStaff) {
      setSelectedBed(bed)
    } else {
      toast.info("Please login as staff to manage bed assignments")
    }
  }

  const handleReleaseBed = async () => {
    try {
      await bedAPI.release(selectedBed.id)
      toast.success("Bed released")
      fetchBedGrid()
      setSelectedBed(null)
    } catch {
      toast.error("Failed to release bed")
    }
  }

  const handleUpdateStatus = async (status) => {
    try {
      await bedAPI.updateStatus(selectedBed.id, { status })
      toast.success(`Bed marked as ${status}`)
      fetchBedGrid()
      setSelectedBed(null)
    } catch {
      toast.error("Failed to update status")
    }
  }

  const handleDeleteBed = async () => {
    try {
      await bedAPI.delete(selectedBed.id)
      toast.success("Bed deleted")
      fetchBedGrid()
      setSelectedBed(null)
    } catch {
      toast.error("Failed to delete bed")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-600">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading bed layout...
      </div>
    )
  }

  if (!bedData) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600">Department Not Found</h2>
        <button
          onClick={() => navigate("/")}
          className="mt-4 inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar - Department Info */}
      <div className="md:col-span-1 space-y-6">
        <div className="p-4 bg-white rounded-lg shadow">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-600 hover:text-black mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
          <h1 className="text-xl font-bold">{bedData.department.name}</h1>
          <p className="text-gray-500">{bedData.department.description}</p>
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
            <button
              onClick={fetchBedGrid}
              className="ml-2 p-1 rounded hover:bg-gray-100"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-3">
          <div className="p-3 bg-gray-50 rounded shadow text-center">
            <div className="text-lg font-bold">{bedData.stats.total}</div>
            <div className="text-sm text-gray-500">Total Beds</div>
          </div>
          <div className="p-3 bg-green-50 rounded shadow text-center">
            <div className="text-lg font-bold text-green-600">
              {bedData.stats.available}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div className="p-3 bg-red-50 rounded shadow text-center">
            <div className="text-lg font-bold text-red-600">
              {bedData.stats.occupied}
            </div>
            <div className="text-sm text-gray-500">Occupied</div>
          </div>
          <div className="p-3 bg-yellow-50 rounded shadow text-center">
            <div className="text-lg font-bold text-yellow-600">
              {bedData.stats.maintenance + bedData.stats.cleaning}
            </div>
            <div className="text-sm text-gray-500">Maintenance</div>
          </div>
        </div>

        {isAuthenticated && isStaff && (
          <button
            onClick={() => navigate("/patients/admit")}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Admit Patient
          </button>
        )}
      </div>

      {/* Main - Bed Grid */}
      <div className="md:col-span-3">
        <h2 className="text-lg font-semibold mb-3">Bed Layout</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {bedData.grid.flat().map(
            (bed, i) =>
              bed && (
                <div
                  key={i}
                  onClick={() => handleBedClick(bed)}
                  className={`p-3 rounded-lg border cursor-pointer shadow-sm hover:shadow-md transition ${getStatusStyle(
                    bed.status
                  )}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{bed.bedNumber}</span>
                    <span className="text-xs capitalize">{bed.status}</span>
                  </div>
                  {bed.currentPatient && (
                    <p className="text-xs mt-1">
                      {bed.currentPatient.name}
                    </p>
                  )}
                </div>
              )
          )}
        </div>
        {!isAuthenticated && (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500 mt-4">
            Public view only.{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 underline"
            >
              Login
            </button>{" "}
            as staff to manage beds.
          </div>
        )}
      </div>

      {/* Bed Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-2">
              Bed {selectedBed.bedNumber}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              Status:{" "}
              <span className="font-medium capitalize">
                {selectedBed.status}
              </span>
            </p>
            {selectedBed.currentPatient && (
              <p className="text-sm text-gray-500 mb-2">
                Patient:{" "}
                <span className="font-medium">
                  {selectedBed.currentPatient.name}
                </span>
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedBed.status === "occupied" && (
                <button
                  onClick={handleReleaseBed}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm"
                >
                  Release
                </button>
              )}
              <button
                onClick={() => handleUpdateStatus("maintenance")}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm"
              >
                Maintenance
              </button>
              <button
                onClick={() => handleUpdateStatus("cleaning")}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm"
              >
                Cleaning
              </button>
              <button
                onClick={() => handleUpdateStatus("available")}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg text-sm"
              >
                Available
              </button>
              <button
                onClick={handleDeleteBed}
                className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </button>
              {selectedBed.status === "available" && (
                <button
                  onClick={() =>
                    navigate(
                      `/patients/admit?bedId=${selectedBed.id}&departmentId=${departmentId}`
                    )
                  }
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm"
                >
                  Admit
                </button>
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedBed(null)}
                className="text-gray-600 hover:underline text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BedGrid
