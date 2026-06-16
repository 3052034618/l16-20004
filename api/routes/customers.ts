import { Router, type Request, type Response } from 'express'
import { db, type Customer, type DeliveryType } from '../data/mockDb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    status,
    floor,
    roomType,
    search,
    page = 1,
    pageSize = 20,
  } = req.query

  let customers = [...db.customers]

  if (status) {
    customers = customers.filter(c => c.status === status)
  }

  if (search) {
    const searchLower = String(search).toLowerCase()
    customers = customers.filter(
      c => c.name.toLowerCase().includes(searchLower)
        || c.phone.includes(searchLower)
        || c.idCard.includes(searchLower)
    )
  }

  if (floor || roomType) {
    customers = customers.filter(c => {
      if (!c.roomId) return false
      const room = db.rooms.find(r => r.id === c.roomId)
      if (!room) return false
      if (floor && room.floor !== Number(floor)) return false
      if (roomType && room.type !== roomType) return false
      return true
    })
  }

  const total = customers.length
  const paged = customers.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(c => {
    const room = db.rooms.find(r => r.id === c.roomId)
    const carePlan = db.carePlans.find(p => p.customerId === c.id)
    const assignedNurses = carePlan
      ? db.users.filter(u => carePlan.assignedNurseIds.includes(u.id))
      : []
    return {
      ...c,
      room,
      carePlanStatus: carePlan?.status,
      assignedNurses,
    }
  })

  res.json({
    success: true,
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const customer = db.customers.find(c => c.id === req.params.id)
  if (!customer) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const room = db.rooms.find(r => r.id === customer.roomId)
  const carePlan = db.carePlans.find(p => p.customerId === customer.id)
  const tasks = db.tasks.filter(t => t.customerId === customer.id)
  const mealPlans = db.mealPlans.filter(m => m.customerId === customer.id)
  const assignedNurses = carePlan
    ? db.users.filter(u => carePlan.assignedNurseIds.includes(u.id))
    : []

  res.json({
    success: true,
    data: {
      ...customer,
      room,
      carePlan,
      tasks,
      mealPlans,
      assignedNurses,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<Customer> & {
    name: string
    age: number
    phone: string
    idCard: string
    deliveryType: DeliveryType
    babyGender: 'boy' | 'girl'
    babyWeight: number
    apgarScore: number
  }

  if (!body.name || !body.phone || !body.idCard) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: name, phone, idCard',
    })
    return
  }

  const customer: Customer = {
    id: db.genId('c'),
    name: body.name,
    age: body.age || 28,
    phone: body.phone,
    idCard: body.idCard,
    roomId: body.roomId || null,
    checkInDate: body.checkInDate || new Date().toISOString().split('T')[0],
    expectedCheckOutDate: body.expectedCheckOutDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      return d.toISOString().split('T')[0]
    })(),
    deliveryType: body.deliveryType || 'natural',
    babyGender: body.babyGender || 'boy',
    babyWeight: body.babyWeight || 3200,
    apgarScore: body.apgarScore || 9,
    motherBabyRoom: body.motherBabyRoom ?? true,
    status: body.status || 'reserved',
    healthMetrics: body.healthMetrics || {
      bloodPressure: '120/80',
      bloodSugar: 5.0,
      woundRecovery: 'good',
      babyWeightTrend: [body.babyWeight || 3200],
      vaccines: [],
    },
    dietaryRestrictions: body.dietaryRestrictions || [],
  }

  db.customers.push(customer)

  if (customer.roomId) {
    const room = db.rooms.find(r => r.id === customer.roomId)
    if (room && customer.status === 'inHouse') {
      room.status = 'occupied'
    }
  }

  res.status(201).json({
    success: true,
    data: customer,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.customers.findIndex(c => c.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const oldRoomId = db.customers[idx].roomId
  const oldStatus = db.customers[idx].status

  db.customers[idx] = {
    ...db.customers[idx],
    ...req.body,
  }

  const newCustomer = db.customers[idx]

  if (oldRoomId !== newCustomer.roomId) {
    if (oldRoomId) {
      const oldRoom = db.rooms.find(r => r.id === oldRoomId)
      if (oldRoom) oldRoom.status = 'cleaning'
    }
    if (newCustomer.roomId && newCustomer.status === 'inHouse') {
      const newRoom = db.rooms.find(r => r.id === newCustomer.roomId)
      if (newRoom) newRoom.status = 'occupied'
    }
  }

  if (oldStatus === 'inHouse' && newCustomer.status === 'checkedOut') {
    newCustomer.actualCheckOutDate = new Date().toISOString().split('T')[0]
    if (newCustomer.roomId) {
      const room = db.rooms.find(r => r.id === newCustomer.roomId)
      if (room) room.status = 'cleaning'
    }
  }

  res.json({
    success: true,
    data: db.customers[idx],
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.customers.findIndex(c => c.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const customer = db.customers[idx]
  if (customer.roomId) {
    const room = db.rooms.find(r => r.id === customer.roomId)
    if (room && customer.status === 'inHouse') {
      room.status = 'cleaning'
    }
  }

  db.customers.splice(idx, 1)

  res.json({ success: true })
})

router.post('/:id/health-metrics', async (req: Request, res: Response): Promise<void> => {
  const customer = db.customers.find(c => c.id === req.params.id)
  if (!customer) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const { bloodPressure, bloodSugar, woundRecovery, babyWeight, vaccine } = req.body

  if (bloodPressure) customer.healthMetrics.bloodPressure = bloodPressure
  if (bloodSugar) customer.healthMetrics.bloodSugar = Number(bloodSugar)
  if (woundRecovery) customer.healthMetrics.woundRecovery = woundRecovery
  if (babyWeight) customer.healthMetrics.babyWeightTrend.push(Number(babyWeight))
  if (vaccine) customer.healthMetrics.vaccines.push(String(vaccine))

  res.json({
    success: true,
    data: customer.healthMetrics,
  })
})

router.post('/:id/checkin', async (req: Request, res: Response): Promise<void> => {
  const customer = db.customers.find(c => c.id === req.params.id)
  if (!customer) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const { roomId, checkInDate } = req.body

  customer.status = 'inHouse'
  if (roomId) customer.roomId = roomId
  if (checkInDate) customer.checkInDate = checkInDate

  if (customer.roomId) {
    const room = db.rooms.find(r => r.id === customer.roomId)
    if (room) room.status = 'occupied'
  }

  res.json({
    success: true,
    data: customer,
  })
})

router.post('/:id/checkout', async (req: Request, res: Response): Promise<void> => {
  const customer = db.customers.find(c => c.id === req.params.id)
  if (!customer) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const { satisfaction, actualCheckOutDate } = req.body

  customer.status = 'checkedOut'
  if (satisfaction) customer.satisfaction = Number(satisfaction)
  customer.actualCheckOutDate = actualCheckOutDate || new Date().toISOString().split('T')[0]

  if (customer.roomId) {
    const room = db.rooms.find(r => r.id === customer.roomId)
    if (room) room.status = 'cleaning'
  }

  res.json({
    success: true,
    data: customer,
  })
})

export default router
