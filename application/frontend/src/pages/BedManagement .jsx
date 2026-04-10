import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { bedAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import {
  Card, CardHeader, CardTitle, CardContent
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Bed, User, Settings, Activity, RefreshCw, ArrowLeft, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = [
  { label: 'Available', value: 'available', color: 'bg-green-400' },
  { label: 'Occupied', value: 'occupied', color: 'bg-red-400' },
  { label: 'Maintenance', value: 'maintenance', color: 'bg-yellow-400' },
  { label: 'Cleaning', value: 'cleaning', color: 'bg-blue-400' },
]

const BedManagement = () => {
  const { departmentId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, isStaff } = useAuth()

  const [bedData, setBedData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedBed, setSelectedBed] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState('available')

  const fetchBeds = async () => {
    setLoading(true)
    try {
      const res = await bedAPI.getGrid(departmentId)
      setBedData(res.data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch beds')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBeds()
    const handleUpdate = () => fetchBeds()
    window.addEventListener('bed-updated', handleUpdate)
    return () => window.removeEventListener('bed-updated', handleUpdate)
  }, [departmentId])

  const openStatusDialog = (bed) => {
    setSelectedBed(bed)
    setNewStatus(bed.status)
    setStatusDialogOpen(true)
  }

  const handleStatusUpdate = async () => {
    try {
      await bedAPI.updateStatus(selectedBed.id, { status: newStatus })
      toast.success('Bed status updated')
      setStatusDialogOpen(false)
      fetchBeds()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status) => STATUS_OPTIONS.find(s => s.value === status)?.color || 'bg-gray-300'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="animate-spin mr-2" /> Loading beds...
      </div>
    )
  }

  if (!bedData) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-2xl font-bold text-red-600">Department Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2" /> Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{bedData.department.name} Department</h1>
          <p className="text-muted-foreground">{bedData.department.description}</p>
          <div className="flex items-center space-x-2 text-sm mt-1 text-muted-foreground">
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            <Button variant="ghost" size="sm" onClick={fetchBeds}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bed Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Bed Layout</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid gap-4 justify-center" style={{ gridTemplateColumns: `repeat(${bedData.dimensions.columns}, 80px)` }}>
            {bedData.grid.flat().map((bed, idx) => (
              <div
                key={idx}
                className={`relative rounded-lg p-2 text-center text-sm font-medium cursor-pointer transition-all
                  ${bed ? getStatusColor(bed.status) : 'bg-gray-100 border border-gray-300'}
                  ${bed && bed.status === 'available' ? 'hover:scale-105 shadow-lg' : ''}
                `}
                onClick={() => bed && isStaff && openStatusDialog(bed)}
              >
                {bed ? (
                  <>
                    <span>{bed.bedNumber}</span>
                    {bed.currentPatient && (
                      <Badge variant="secondary" className="absolute top-1 right-1 text-xs px-1">
                        {bed.currentPatient.patientId}
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Bed Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="font-bold">{bedData.stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div>
              <div className="font-bold text-green-600">{bedData.stats.available}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div>
              <div className="font-bold text-red-600">{bedData.stats.occupied}</div>
              <div className="text-sm text-muted-foreground">Occupied</div>
            </div>
            <div>
              <div className="font-bold text-yellow-600">{bedData.stats.maintenance + bedData.stats.cleaning}</div>
              <div className="text-sm text-muted-foreground">Maintenance</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm">
              <span>Availability</span>
              <span className={`${bedData.stats.availabilityPercentage >= 60 ? 'text-green-600' : bedData.stats.availabilityPercentage >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                {bedData.stats.availabilityPercentage}%
              </span>
            </div>
            <Progress value={bedData.stats.availabilityPercentage} className="h-2 mt-1 rounded-full" />
          </div>
        </CardContent>
      </Card>

      {/* Status Update Modal */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Bed Status</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <p className="mb-2">Bed: {selectedBed?.bedNumber}</p>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={handleStatusUpdate}>Update Status</Button>
            <Button variant="ghost" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BedManagement
