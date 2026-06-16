import { Router, type Request, type Response } from 'express'
import { db } from '../data/mockDb.js'

const router = Router()

router.get('/kpis', async (req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]

  const totalRooms = db.rooms.length
  const occupiedRooms = db.rooms.filter(r => r.status === 'occupied').length
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0

  const inHouseCustomers = db.customers.filter(c => c.status === 'inHouse')
  const todayTasks = db.tasks.filter(t => t.scheduledDate === today)
  const completedTodayTasks = todayTasks.filter(t => t.status === 'completed')
  const taskCompletionRate = todayTasks.length > 0
    ? Math.round((completedTodayTasks.length / todayTasks.length) * 1000) / 10
    : 100

  const lowStockItems = db.inventory.filter(i => i.currentStock < i.safeStock)
  const pendingCarePlans = db.carePlans.filter(p => p.status === 'pending')
  const overdueTasks = db.tasks.filter(t => t.status === 'overdue')

  const totalRevenue = inHouseCustomers.reduce((sum, c) => {
    const room = db.rooms.find(r => r.id === c.roomId)
    if (!room) return sum
    const checkIn = new Date(c.checkInDate)
    const days = Math.min(
      Math.ceil((Date.now() - checkIn.getTime()) / 86400000),
      30
    )
    return sum + room.price * days
  }, 0)

  res.json({
    success: true,
    data: {
      occupancyRate: {
        value: occupancyRate,
        unit: '%',
        occupied: occupiedRooms,
        total: totalRooms,
        trend: 2.5,
      },
      inHouseCustomers: {
        value: inHouseCustomers.length,
        unit: '人',
        reserved: db.customers.filter(c => c.status === 'reserved').length,
        trend: 1,
      },
      taskCompletionRate: {
        value: taskCompletionRate,
        unit: '%',
        completed: completedTodayTasks.length,
        total: todayTasks.length,
        trend: -1.2,
      },
      lowStockWarnings: {
        value: lowStockItems.length,
        unit: '项',
        critical: lowStockItems.filter(i => i.currentStock < i.safeStock * 0.5).length,
      },
      pendingCarePlans: {
        value: pendingCarePlans.length,
        unit: '份',
      },
      overdueTasks: {
        value: overdueTasks.length,
        unit: '条',
      },
      todayRevenue: {
        value: Math.round(totalRevenue),
        unit: '元',
        trend: 5.8,
      },
      avgSatisfaction: {
        value: 4.7,
        unit: '分',
        totalSurveys: 56,
      },
    },
  })
})

router.get('/floor-heatmap', async (req: Request, res: Response): Promise<void> => {
  const floors = [...new Set(db.rooms.map(r => r.floor))].sort()
  const heatmap = floors.map(floor => {
    const rooms = db.rooms.filter(r => r.floor === floor)
    const nurseIds = [...new Set(
      db.carePlans
        .filter(p => p.status === 'executing' || p.status === 'approved')
        .flatMap(p => p.assignedNurseIds)
    )]

    const nurseLocations = nurseIds.map((nid, idx) => {
      const nurse = db.users.find(u => u.id === nid)
      const workload = db.tasks.filter(
        t => t.nurseId === nid
          && t.scheduledDate === new Date().toISOString().split('T')[0]
          && (t.status === 'pending' || t.status === 'inProgress')
      ).length

      return {
        nurseId: nid,
        nurseName: nurse?.name || '未知',
        roomIndex: idx % rooms.length,
        workload,
        intensity: Math.min(1, workload / 8),
      }
    })

    return {
      floor,
      rooms: rooms.map(r => {
        const customer = db.customers.find(c => c.roomId === r.id && c.status === 'inHouse')
        return {
          id: r.id,
          roomNumber: r.roomNumber,
          status: r.status,
          type: r.type,
          price: r.price,
          customerName: customer?.name,
          customerId: customer?.id,
        }
      }),
      nurseHeatPoints: nurseLocations,
    }
  })

  res.json({
    success: true,
    data: heatmap,
  })
})

router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  const { limit = 20, unhandledOnly } = req.query
  let alerts = [...db.alerts]

  if (unhandledOnly === 'true') {
    alerts = alerts.filter(a => !a.handled)
  }

  alerts = alerts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, Number(limit))

  res.json({
    success: true,
    data: {
      list: alerts,
      total: db.alerts.filter(a => !a.handled).length,
      unread: db.alerts.filter(a => !a.read).length,
    },
  })
})

router.post('/alerts/:id/read', async (req: Request, res: Response): Promise<void> => {
  const alert = db.alerts.find(a => a.id === req.params.id)
  if (!alert) {
    res.status(404).json({ success: false, error: 'Alert not found' })
    return
  }

  alert.read = true
  res.json({ success: true, data: alert })
})

router.post('/alerts/:id/handle', async (req: Request, res: Response): Promise<void> => {
  const alert = db.alerts.find(a => a.id === req.params.id)
  if (!alert) {
    res.status(404).json({ success: false, error: 'Alert not found' })
    return
  }

  alert.read = true
  alert.handled = true
  res.json({ success: true, data: alert })
})

router.get('/quick-stats', async (req: Request, res: Response): Promise<void> => {
  const today = new Date().toISOString().split('T')[0]

  const nursesOnDuty = db.schedules.filter(
    s => s.date === today && s.shift !== 'dayOff'
  ).length

  const todayTasks = db.tasks.filter(t => t.scheduledDate === today)
  const taskByStatus = {
    pending: todayTasks.filter(t => t.status === 'pending').length,
    inProgress: todayTasks.filter(t => t.status === 'inProgress').length,
    completed: todayTasks.filter(t => t.status === 'completed').length,
    overdue: todayTasks.filter(t => t.status === 'overdue').length,
  }

  const roomsByStatus = {
    empty: db.rooms.filter(r => r.status === 'empty').length,
    occupied: db.rooms.filter(r => r.status === 'occupied').length,
    cleaning: db.rooms.filter(r => r.status === 'cleaning').length,
    maintenance: db.rooms.filter(r => r.status === 'maintenance').length,
  }

  const weeklyTrend = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - 6 + i)
    const dateStr = d.toISOString().split('T')[0]
    return {
      date: dateStr,
      checkIns: Math.floor(Math.random() * 3),
      checkOuts: Math.floor(Math.random() * 2),
      taskCompleted: 30 + Math.floor(Math.random() * 20),
      revenue: 20000 + Math.floor(Math.random() * 10000),
    }
  })

  res.json({
    success: true,
    data: {
      nursesOnDuty,
      taskByStatus,
      roomsByStatus,
      weeklyTrend,
    },
  })
})

export default router
