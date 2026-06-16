import { Router, type Request, type Response } from 'express'
import { db, type Room, type RoomStatus, type RoomType } from '../data/mockDb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    floor,
    status,
    type,
    available,
    page = 1,
    pageSize = 100,
  } = req.query

  let rooms = [...db.rooms]

  if (floor) {
    rooms = rooms.filter(r => r.floor === Number(floor))
  }

  if (status) {
    rooms = rooms.filter(r => r.status === status)
  }

  if (type) {
    rooms = rooms.filter(r => r.type === type)
  }

  if (available === 'true') {
    rooms = rooms.filter(r => r.status === 'empty')
  }

  rooms = rooms.sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor
    return a.roomNumber.localeCompare(b.roomNumber)
  })

  const total = rooms.length
  const paged = rooms.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const typeNames: Record<RoomType, string> = {
    standard: '标准间',
    deluxe: '豪华间',
    suite: '套房',
    vip: 'VIP房',
  }
  const statusNames: Record<RoomStatus, string> = {
    empty: '空房',
    occupied: '入住中',
    cleaning: '清洁中',
    maintenance: '维修中',
  }

  const list = paged.map(r => {
    const customer = db.customers.find(
      c => c.roomId === r.id && c.status === 'inHouse'
    )
    const carePlan = customer ? db.carePlans.find(p => p.customerId === customer.id) : undefined
    const assignedNurses = carePlan
      ? db.users.filter(u => carePlan.assignedNurseIds.includes(u.id))
      : []

    return {
      ...r,
      typeName: typeNames[r.type],
      statusName: statusNames[r.status],
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            checkInDate: customer.checkInDate,
            expectedCheckOutDate: customer.expectedCheckOutDate,
          }
        : undefined,
      assignedNurses,
    }
  })

  const summary = {
    total: db.rooms.length,
    empty: db.rooms.filter(r => r.status === 'empty').length,
    occupied: db.rooms.filter(r => r.status === 'occupied').length,
    cleaning: db.rooms.filter(r => r.status === 'cleaning').length,
    maintenance: db.rooms.filter(r => r.status === 'maintenance').length,
    byType: (['standard', 'deluxe', 'suite', 'vip'] as RoomType[]).map(type => ({
      type,
      typeName: typeNames[type],
      total: db.rooms.filter(r => r.type === type).length,
      occupied: db.rooms.filter(r => r.type === type && r.status === 'occupied').length,
      empty: db.rooms.filter(r => r.type === type && r.status === 'empty').length,
      avgPrice: Math.round(
        db.rooms.filter(r => r.type === type).reduce((s, x) => s + x.price, 0) /
          Math.max(db.rooms.filter(r => r.type === type).length, 1)
      ),
    })),
    byFloor: [3, 4, 5].map(floor => ({
      floor,
      total: db.rooms.filter(r => r.floor === floor).length,
      occupied: db.rooms.filter(r => r.floor === floor && r.status === 'occupied').length,
      occupancyRate: Math.round(
        (db.rooms.filter(r => r.floor === floor && r.status === 'occupied').length /
          Math.max(db.rooms.filter(r => r.floor === floor).length, 1)) *
          1000
      ) / 10,
    })),
  }

  res.json({
    success: true,
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      summary,
    },
  })
})

router.get('/floor-map', async (_req: Request, res: Response): Promise<void> => {
  const floors = [...new Set(db.rooms.map(r => r.floor))].sort()

  const typeNames: Record<RoomType, string> = {
    standard: '标准间',
    deluxe: '豪华间',
    suite: '套房',
    vip: 'VIP房',
  }

  const floorMap = floors.map(floor => {
    const floorRooms = db.rooms
      .filter(r => r.floor === floor)
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber))
      .map(r => {
        const customer = db.customers.find(
          c => c.roomId === r.id && c.status === 'inHouse'
        )
        const carePlan = customer ? db.carePlans.find(p => p.customerId === customer.id) : undefined
        const nurseIds = carePlan?.assignedNurseIds || []
        const nurses = db.users.filter(u => nurseIds.includes(u.id))

        const todayTasks = db.tasks.filter(
          t => t.customerId === customer?.id && t.scheduledDate === new Date().toISOString().split('T')[0]
        )
        const busyLevel = todayTasks.length > 0 ? Math.min(1, todayTasks.filter(t => t.status === 'inProgress' || t.status === 'pending').length / 6) : 0

        return {
          id: r.id,
          roomNumber: r.roomNumber,
          type: r.type,
          typeName: typeNames[r.type],
          status: r.status,
          price: r.price,
          bedCount: r.bedCount,
          customer: customer
            ? {
                id: customer.id,
                name: customer.name,
                checkInDate: customer.checkInDate,
              }
            : undefined,
          nurses: nurses.map(n => ({
            id: n.id,
            name: n.name,
            status: n.status,
          })),
          activityLevel: busyLevel,
          position: {
            x: (parseInt(r.roomNumber.slice(-2)) - 1) % 4,
            y: Math.floor((parseInt(r.roomNumber.slice(-2)) - 1) / 4),
          },
        }
      })

    const nurseHeatmap = db.users
      .filter(u => u.role === 'nurse' && u.status === 'active')
      .map((n, idx) => {
        const plans = db.carePlans.filter(
          p => p.assignedNurseIds.includes(n.id) && (p.status === 'executing' || p.status === 'approved')
        )
        const assignedRoomIds = plans
          .map(p => db.customers.find(c => c.id === p.customerId)?.roomId)
          .filter(Boolean) as string[]
        const todayTasks = db.tasks.filter(
          t => t.nurseId === n.id && t.scheduledDate === new Date().toISOString().split('T')[0]
        )

        return {
          nurseId: n.id,
          nurseName: n.name,
          assignedRooms: assignedRoomIds.length,
          pendingTasks: todayTasks.filter(t => t.status === 'pending' || t.status === 'inProgress').length,
          totalTasksToday: todayTasks.length,
          heatIntensity: Math.min(1, todayTasks.length / 8),
          primaryRoomId: assignedRoomIds[0] || floorRooms[idx % floorRooms.length]?.id,
        }
      })

    return {
      floor,
      name: `${floor}楼`,
      totalRooms: floorRooms.length,
      occupied: floorRooms.filter(r => r.status === 'occupied').length,
      empty: floorRooms.filter(r => r.status === 'empty').length,
      cleaning: floorRooms.filter(r => r.status === 'cleaning').length,
      maintenance: floorRooms.filter(r => r.status === 'maintenance').length,
      occupancyRate: floorRooms.length > 0
        ? Math.round((floorRooms.filter(r => r.status === 'occupied').length / floorRooms.length) * 1000) / 10
        : 0,
      rooms: floorRooms,
      nurseHeatmap,
    }
  })

  res.json({
    success: true,
    data: floorMap,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const room = db.rooms.find(r => r.id === req.params.id)
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' })
    return
  }

  const customer = db.customers.find(
    c => c.roomId === room.id && c.status === 'inHouse'
  )
  const carePlan = customer ? db.carePlans.find(p => p.customerId === customer.id) : undefined
  const assignedNurses = carePlan
    ? db.users.filter(u => carePlan.assignedNurseIds.includes(u.id))
    : []

  const history = db.customers
    .filter(c => c.roomId === room.id && c.status === 'checkedOut')
    .map(c => ({
      customerId: c.id,
      customerName: c.name,
      checkInDate: c.checkInDate,
      checkOutDate: c.actualCheckOutDate,
      satisfaction: c.satisfaction,
    }))

  const todayTasks = customer
    ? db.tasks.filter(t => t.customerId === customer.id && t.scheduledDate === new Date().toISOString().split('T')[0])
    : []

  const typeNames: Record<RoomType, string> = {
    standard: '标准间',
    deluxe: '豪华间',
    suite: '套房',
    vip: 'VIP房',
  }
  const statusNames: Record<RoomStatus, string> = {
    empty: '空房',
    occupied: '入住中',
    cleaning: '清洁中',
    maintenance: '维修中',
  }

  res.json({
    success: true,
    data: {
      ...room,
      typeName: typeNames[room.type],
      statusName: statusNames[room.status],
      currentCustomer: customer
        ? {
            ...customer,
            carePlan,
            assignedNurses,
            todayTasks,
          }
        : undefined,
      stayHistory: history,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<Room> & {
    roomNumber: string
    floor: number
    type: RoomType
    price: number
  }

  if (!body.roomNumber || !body.floor || !body.type || !body.price) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: roomNumber, floor, type, price',
    })
    return
  }

  const existing = db.rooms.find(r => r.roomNumber === body.roomNumber)
  if (existing) {
    res.status(409).json({
      success: false,
      error: '房间号已存在',
    })
    return
  }

  const room: Room = {
    id: db.genId('r'),
    roomNumber: body.roomNumber,
    floor: body.floor,
    type: body.type,
    status: body.status || 'empty',
    price: body.price,
    bedCount: body.bedCount ?? (body.type === 'vip' ? 2 : 1),
  }

  db.rooms.push(room)

  res.status(201).json({
    success: true,
    data: room,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.rooms.findIndex(r => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Room not found' })
    return
  }

  const oldStatus = db.rooms[idx].status
  db.rooms[idx] = {
    ...db.rooms[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.rooms[idx],
  })
})

router.post('/:id/status', async (req: Request, res: Response): Promise<void> => {
  const room = db.rooms.find(r => r.id === req.params.id)
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found' })
    return
  }

  const { status } = req.body as { status: RoomStatus }
  if (!status) {
    res.status(400).json({
      success: false,
      error: '请提供 status 字段',
    })
    return
  }

  const validStatuses: RoomStatus[] = ['empty', 'occupied', 'cleaning', 'maintenance']
  if (!validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: `无效的房间状态，应为: ${validStatuses.join(', ')}`,
    })
    return
  }

  const oldStatus = room.status
  room.status = status

  res.json({
    success: true,
    data: {
      ...room,
      oldStatus,
      newStatus: status,
    },
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.rooms.findIndex(r => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Room not found' })
    return
  }

  const room = db.rooms[idx]
  if (room.status === 'occupied') {
    res.status(400).json({
      success: false,
      error: '房间当前有客人入住，无法删除',
    })
    return
  }

  db.rooms.splice(idx, 1)
  res.json({ success: true })
})

router.get('/stats/availability', async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query
  const today = new Date().toISOString().split('T')[0]
  const start = startDate ? String(startDate) : today
  const end = endDate ? String(endDate) : (() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().split('T')[0]
  })()

  const roomAvailability = db.rooms.map(room => {
    const customer = db.customers.find(
      c => c.roomId === room.id && c.status === 'inHouse'
    )

    let available = true
    let nextAvailable = start
    let currentGuestCheckOut: string | undefined

    if (customer) {
      available = customer.expectedCheckOutDate < start
      currentGuestCheckOut = customer.expectedCheckOutDate
      if (!available) {
        nextAvailable = customer.expectedCheckOutDate
      }
    } else if (room.status === 'cleaning') {
      const d = new Date(start)
      d.setDate(d.getDate() + 1)
      nextAvailable = d.toISOString().split('T')[0]
      available = false
    } else if (room.status === 'maintenance') {
      const d = new Date(start)
      d.setDate(d.getDate() + 3)
      nextAvailable = d.toISOString().split('T')[0]
      available = false
    }

    return {
      roomId: room.id,
      roomNumber: room.roomNumber,
      type: room.type,
      price: room.price,
      status: room.status,
      availableNow: room.status === 'empty',
      availableDuringPeriod: available,
      nextAvailableDate: nextAvailable,
      currentGuestCheckOut,
    }
  })

  const byType = (['standard', 'deluxe', 'suite', 'vip'] as RoomType[]).map(type => {
    const typeRooms = roomAvailability.filter(r => r.type === type)
    return {
      type,
      total: typeRooms.length,
      availableNow: typeRooms.filter(r => r.availableNow).length,
      availableDuringPeriod: typeRooms.filter(r => r.availableDuringPeriod).length,
      minPrice: Math.min(...typeRooms.map(r => r.price), 0),
      maxPrice: Math.max(...typeRooms.map(r => r.price), 0),
    }
  })

  res.json({
    success: true,
    data: {
      period: { start, end },
      rooms: roomAvailability,
      summary: {
        totalRooms: db.rooms.length,
        availableNow: roomAvailability.filter(r => r.availableNow).length,
        availableDuringPeriod: roomAvailability.filter(r => r.availableDuringPeriod).length,
        occupied: roomAvailability.filter(r => r.status === 'occupied').length,
        cleaning: roomAvailability.filter(r => r.status === 'cleaning').length,
        maintenance: roomAvailability.filter(r => r.status === 'maintenance').length,
      },
      byType,
    },
  })
})

export default router
