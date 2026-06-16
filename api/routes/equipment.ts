import { Router, type Request, type Response } from 'express'
import { db, type Equipment, type MaintenanceWorkOrder, type EquipmentStatus, type WorkOrderStatus } from '../data/mockDb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    status, location, category, search, page = 1, pageSize = 50 } = req.query

  let equipment = [...db.equipment]

  if (status) {
    equipment = equipment.filter(e => e.status === status)
  }

  if (location) {
    equipment = equipment.filter(e => e.location.includes(String(location)))
  }

  if (search) {
    const searchLower = String(search).toLowerCase()
    equipment = equipment.filter(
      e => e.name.toLowerCase().includes(searchLower)
        || e.brand.toLowerCase().includes(searchLower)
        || e.model.toLowerCase().includes(searchLower)
        || e.serialNumber.toLowerCase().includes(searchLower)
    )
  }

  equipment = equipment.sort((a, b) => {
    const priorityOrder = { broken: 0, maintenance: 1, warning: 2, normal: 3 }
    return priorityOrder[a.status] - priorityOrder[b.status]
  })

  const total = equipment.length
  const paged = equipment.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(e => {
    const usageRatio = e.usageCount / e.maxUsageBeforeMaintenance
    let usageStatus: 'normal' | 'warning' | 'critical' = 'normal'
    if (usageRatio >= 0.9) usageStatus = 'critical'
    else if (usageRatio >= 0.7) usageStatus = 'warning'

    return {
      ...e,
      usageRatio: Math.round(usageRatio * 100),
      usageStatus,
    }
  })

  const summary = {
    total: db.equipment.length,
    normal: db.equipment.filter(e => e.status === 'normal').length,
    warning: db.equipment.filter(e => e.status === 'warning').length,
    maintenance: db.equipment.filter(e => e.status === 'maintenance').length,
    broken: db.equipment.filter(e => e.status === 'broken').length,
    needMaintenance: db.equipment.filter(
      e => e.usageCount >= e.maxUsageBeforeMaintenance * 0.9
    ).length,
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

router.get('/stats/summary', async (_req: Request, res: Response): Promise<void> => {
  const byFloor = [3, 4, 5].map(floor => {
    const floorEq = db.equipment.filter(e => e.location.startsWith(String(floor)))
    const byStatus = {
      normal: floorEq.filter(e => e.status === 'normal').length,
      warning: floorEq.filter(e => e.status === 'warning').length,
      maintenance: floorEq.filter(e => e.status === 'maintenance').length,
      broken: floorEq.filter(e => e.status === 'broken').length,
    }
    return {
      floor,
      total: floorEq.length,
      byStatus,
    }
  })

  const byType = Array.from(new Set(db.equipment.map(e => e.name))).map(name => {
    const typeEq = db.equipment.filter(e => e.name === name)
    return {
      name,
      count: typeEq.length,
      totalUsage: typeEq.reduce((sum, e) => sum + e.usageCount, 0),
      warningCount: typeEq.filter(e => e.status !== 'normal').length,
    }
  })

  const upcomingMaintenance = db.equipment
    .filter(e => e.usageCount >= e.maxUsageBeforeMaintenance * 0.8)
    .sort((a, b) => b.usageCount / b.maxUsageBeforeMaintenance - a.usageCount / a.maxUsageBeforeMaintenance)
    .slice(0, 10)
    .map(e => ({
      id: e.id,
      name: e.name,
      brand: e.brand,
      model: e.model,
      location: e.location,
      usageCount: e.usageCount,
      maxUsageBeforeMaintenance: e.maxUsageBeforeMaintenance,
      usagePercent: Math.round((e.usageCount / e.maxUsageBeforeMaintenance) * 100),
      nextMaintenanceDate: e.nextMaintenanceDate,
    }))

  res.json({
    success: true,
    data: {
      byFloor,
      byType,
      upcomingMaintenance,
    },
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const equipment = db.equipment.find(e => e.id === req.params.id)
  if (!equipment) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }

  const workOrders = db.workOrders.filter(w => w.equipmentId === equipment.id)
  const parts = equipment.spareParts.map(sp => {
    const item = db.inventory.find(i => i.id === sp.inventoryItemId)
    return {
      ...sp,
    currentStock: item?.currentStock ?? 0,
      unit: item?.unit ?? '',
      inStock: item ? item.currentStock >= sp.requiredQuantity : false,
    }
  })

  res.json({
    success: true,
    data: {
      ...equipment,
      workOrders,
    partsWithStock: parts,
  },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<Equipment> & {
    name: string
    brand: string
    model: string
    location: string
  }

  if (!body.name || !body.brand || !body.model || !body.location) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: name, brand, model, location',
    })
    return
  }

  const equipment: Equipment = {
    id: db.genId('eq'),
    name: body.name,
    brand: body.brand,
    model: body.model,
    serialNumber: body.serialNumber || `SN${Date.now()}`,
    purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
    status: body.status || 'normal',
    usageCount: body.usageCount ?? 0,
    maxUsageBeforeMaintenance: body.maxUsageBeforeMaintenance ?? 500,
    lastMaintenanceDate: body.lastMaintenanceDate || new Date().toISOString().split('T')[0],
    nextMaintenanceDate: body.nextMaintenanceDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() + 30)
      return d.toISOString().split('T')[0]
    })(),
    location: body.location,
    spareParts: body.spareParts || [],
  }

  db.equipment.push(equipment)

  res.status(201).json({
    success: true,
    data: equipment,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.equipment.findIndex(e => e.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }

  db.equipment[idx] = {
    ...db.equipment[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.equipment[idx],
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.equipment.findIndex(e => e.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }

  db.equipment.splice(idx, 1)
  res.json({ success: true })
})

router.post('/:id/maintenance', async (req: Request, res: Response): Promise<void> => {
  const equipment = db.equipment.find(e => e.id === req.params.id)
  if (!equipment) {
    res.status(404).json({ success: false, error: 'Equipment not found' })
    return
  }

  const { description, priority, engineerId } = req.body

  const workOrder: MaintenanceWorkOrder = {
    id: db.genId('wo'),
    equipmentId: equipment.id,
    engineerId: engineerId || null,
    status: 'pending',
    priority: priority || 'medium',
    description: description || '定期维护保养',
    createdAt: new Date().toISOString(),
    partsUsed: [],
  }

  db.workOrders.push(workOrder)
  equipment.status = 'maintenance'

  res.status(201).json({
    success: true,
    data: workOrder,
  })
})

router.get('/work-orders', async (req: Request, res: Response): Promise<void> => {
  const {
    status, priority, equipmentId, engineerId, page = 1, pageSize = 50 } = req.query

  let orders = [...db.workOrders]

  if (status) {
    orders = orders.filter(w => w.status === status)
  }
  if (priority) {
    orders = orders.filter(w => w.priority === priority)
  }
  if (equipmentId) {
    orders = orders.filter(w => w.equipmentId === equipmentId)
  }
  if (engineerId) {
    orders = orders.filter(w => w.engineerId === engineerId)
  }

  orders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = orders.length
  const paged = orders.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(w => {
    const eq = db.equipment.find(e => e.id === w.equipmentId)
    const engineer = w.engineerId ? db.users.find(u => u.id === w.engineerId) : undefined
    return {
      ...w,
      equipmentName: eq?.name,
      equipmentLocation: eq?.location,
      engineerName: engineer?.name,
    }
  })

  const summary = {
    pending: db.workOrders.filter(w => w.status === 'pending').length,
    inProgress: db.workOrders.filter(w => w.status === 'inProgress').length,
    completed: db.workOrders.filter(w => w.status === 'completed').length,
    cancelled: db.workOrders.filter(w => w.status === 'cancelled').length,
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

router.get('/work-orders/:id', async (req: Request, res: Response): Promise<void> => {
  const order = db.workOrders.find(w => w.id === req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Work order not found' })
    return
  }

  const equipment = db.equipment.find(e => e.id === order.equipmentId)
  const engineer = order.engineerId ? db.users.find(u => u.id === order.engineerId) : undefined
  const parts = order.partsUsed.map(p => {
    const item = db.inventory.find(i => i.id === p.inventoryItemId)
    return {
      ...p,
      itemName: item?.name,
      unit: item?.unit,
    }
  })

  res.json({
    success: true,
    data: {
      ...order,
      equipment,
      engineerName: engineer?.name,
      partsWithDetails: parts,
    },
  })
})

router.post('/work-orders/:id/assign', async (req: Request, res: Response): Promise<void> => {
  const order = db.workOrders.find(w => w.id === req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Work order not found' })
    return
  }

  const { engineerId } = req.body
  const engineer = db.users.find(u => u.id === engineerId)
  if (!engineer || engineer.role !== 'engineer') {
    res.status(400).json({
      success: false,
      error: '无效的工程师ID',
    })
    return
  }

  order.engineerId = engineerId
  order.status = 'inProgress'
  order.startedAt = new Date().toISOString()

  res.json({
    success: true,
    data: order,
  })
})

router.post('/work-orders/:id/complete', async (req: Request, res: Response): Promise<void> => {
  const order = db.workOrders.find(w => w.id === req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Work order not found' })
    return
  }

  const { resolution, partsUsed } = req.body

  order.status = 'completed'
  order.completedAt = new Date().toISOString()
  if (resolution) order.resolution = resolution
  if (partsUsed && Array.isArray(partsUsed)) {
    order.partsUsed = partsUsed

    for (const p of partsUsed) {
      const item = db.inventory.find(i => i.id === p.inventoryItemId)
      if (item) {
        item.currentStock = Math.max(0, item.currentStock - p.quantity)
      }
    }
  }

  const equipment = db.equipment.find(e => e.id === order.equipmentId)
  if (equipment) {
    equipment.status = 'normal'
    equipment.usageCount = 0
    equipment.lastMaintenanceDate = new Date().toISOString().split('T')[0]
    const next = new Date()
    next.setDate(next.getDate() + 30)
    equipment.nextMaintenanceDate = next.toISOString().split('T')[0]
  }

  res.json({
    success: true,
    data: order,
  })
})

router.post('/work-orders/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  const order = db.workOrders.find(w => w.id === req.params.id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Work order not found' })
    return
  }

  order.status = 'cancelled'

  const equipment = db.equipment.find(e => e.id === order.equipmentId)
  if (equipment && equipment.status === 'maintenance') {
    equipment.status = 'normal'
  }

  res.json({
    success: true,
    data: order,
  })
})

router.put('/work-orders/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.workOrders.findIndex(w => w.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Work order not found' })
    return
  }

  db.workOrders[idx] = {
    ...db.workOrders[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.workOrders[idx],
  })
})

export default router
