import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      })

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id)
        setConnected(true)
        
        // Join hospital room for real-time updates
        newSocket.emit('join-hospital', 'main')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnected(false)
      })

      // Real-time event handlers
      newSocket.on('department-updated', (data) => {
        console.log('Department updated:', data)
        // Trigger re-fetch of department data
        window.dispatchEvent(new CustomEvent('department-updated', { detail: data }))
      })

      newSocket.on('bed-occupied', (data) => {
        console.log('Bed occupied:', data)
        toast.success(`Bed ${data.bedNumber} occupied by ${data.patient.name}`)
        window.dispatchEvent(new CustomEvent('bed-updated', { detail: data }))
      })

      newSocket.on('bed-released', (data) => {
        console.log('Bed released:', data)
        toast.success(`Bed ${data.bedNumber} released`)
        window.dispatchEvent(new CustomEvent('bed-updated', { detail: data }))
      })

      newSocket.on('bed-status-updated', (data) => {
        console.log('Bed status updated:', data)
        toast.info(`Bed ${data.bedId} status changed to ${data.newStatus}`)
        window.dispatchEvent(new CustomEvent('bed-updated', { detail: data }))
      })

      newSocket.on('patient-admitted', (data) => {
        console.log('Patient admitted:', data)
        toast.success(`Patient ${data.patient.name} admitted to ${data.patient.department}`)
        window.dispatchEvent(new CustomEvent('patient-updated', { detail: data }))
      })

      newSocket.on('patient-discharged', (data) => {
        console.log('Patient discharged:', data)
        toast.success(`Patient ${data.patient.name} discharged`)
        window.dispatchEvent(new CustomEvent('patient-updated', { detail: data }))
      })

      newSocket.on('billing-updated', (data) => {
        console.log('Billing updated:', data)
        window.dispatchEvent(new CustomEvent('billing-updated', { detail: data }))
      })

      newSocket.on('payment-received', (data) => {
        console.log('Payment received:', data)
        toast.success(`Payment of ₹${data.paymentAmount} received for ${data.patientName}`)
        window.dispatchEvent(new CustomEvent('billing-updated', { detail: data }))
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setConnected(false)
      }
    } else {
      // Disconnect socket when not authenticated
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [isAuthenticated])

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data)
    }
  }

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  const value = {
    socket,
    connected,
    emit,
    on,
    off
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

