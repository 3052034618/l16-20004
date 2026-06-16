import { Router, type Request, type Response } from 'express'
import { db, type InventoryItem } from '../data/mockDb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    category,
    lowStock,
    expiringSoon,
    search,
    page = 1,
    pageSize = 50,
  } = req.query

  let items = [...db.inventory]

  if (category) {
    items = items.filter(i => i.category === category)
  }

  if (lowStock === 'true') {
    items = items.filter(i => i.currentStock < i.safeStock)
  }

  if (expiringSoon === 'true') {
    const threshold = new Date()
    threshold.setDate(threshold.getDate() + 14)
    items = items.filter(i => i.expiryDate && new Date(i.expiryDate) <= threshold)
  }

  if (search) {
    const searchLower = String(search).toLowerCase()
    items = items.filter(
      i => i.name.toLowerCase().includes(searchLower)
        || i.supplier.toLowerCase().includes(searchLower)
    )
  }

  items = items.sort((a, b) => {
    const aStock = a.currentStock / a.safeStock
    const bStock = b.currentStock / b.safeStock
    return aStock - bStock
  })

  const total = items.length
  const paged = items.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(i => {
    const stockRatio = i.currentStock / i.safeStock
    let stockStatus: 'normal' | 'warning' | 'danger' = 'normal'
    if (stockRatio < 0.5) stockStatus = 'danger'
    else if (stockRatio < 1) stockStatus = 'warning'

    const isExpiring = i.expiryDate
      ? new Date(i.expiryDate) <= new Date(Date.now() + 14 * 86400000)
      : false

    return {
      ...i,
      stockStatus,
      isExpiring,
      stockValue: Math.round(i.currentStock * i.unitPrice * 100) / 100,
    }
  })

  const summary = {
    totalItems: db.inventory.length,
    lowStockCount: db.inventory.filter(i => i.currentStock < i.safeStock).length,
    criticalStockCount: db.inventory.filter(i => i.currentStock < i.safeStock * 0.5).length,
    totalValue: Math.round(
      db.inventory.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0) * 100
    ) / 100,
    expiringCount: db.inventory.filter(
      i => i.expiryDate && new Date(i.expiryDate) <= new Date(Date.now() + 14 * 86400000)
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

router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  const categories = [
    { key: 'vegetable', name: '蔬菜', count: 0, totalValue: 0 },
    { key: 'meat', name: '肉类', count: 0, totalValue: 0 },
    { key: 'seafood', name: '海鲜', count: 0, totalValue: 0 },
    { key: 'grain', name: '主食', count: 0, totalValue: 0 },
    { key: 'dairy', name: '乳品', count: 0, totalValue: 0 },
    { key: 'fruit', name: '水果', count: 0, totalValue: 0 },
    { key: 'seasoning', name: '调料', count: 0, totalValue: 0 },
    { key: 'medical', name: '医疗用品', count: 0, totalValue: 0 },
    { key: 'baby', name: '婴儿用品', count: 0, totalValue: 0 },
    { key: 'other', name: '其他', count: 0, totalValue: 0 },
  ]

  for (const item of db.inventory) {
    const cat = categories.find(c => c.key === item.category)
    if (cat) {
      cat.count++
      cat.totalValue += item.currentStock * item.unitPrice
    }
  }

  categories.forEach(c => {
    c.totalValue = Math.round(c.totalValue * 100) / 100
  })

  res.json({
    success: true,
    data: categories,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const item = db.inventory.find(i => i.id === req.params.id)
  if (!item) {
    res.status(404).json({ success: false, error: 'Inventory item not found' })
    return
  }

  const usedInRecipes = db.mealRecipes
    .filter(r => r.ingredients.some(ing => ing.inventoryItemId === item.id))
    .map(r => ({ id: r.id, name: r.name }))

  const usedInEquipment = db.equipment
    .filter(e => e.spareParts.some(sp => sp.inventoryItemId === item.id))
    .map(e => ({ id: e.id, name: e.name, model: e.model }))

  res.json({
    success: true,
    data: {
      ...item,
      usedInRecipes,
      usedInEquipment,
      stockStatus: item.currentStock < item.safeStock * 0.5
        ? 'danger'
        : item.currentStock < item.safeStock
          ? 'warning'
          : 'normal',
      stockValue: Math.round(item.currentStock * item.unitPrice * 100) / 100,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<InventoryItem> & {
    name: string
    category: InventoryItem['category']
    unit: string
  }

  if (!body.name || !body.category || !body.unit) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: name, category, unit',
    })
    return
  }

  const item: InventoryItem = {
    id: db.genId('inv'),
    name: body.name,
    category: body.category,
    currentStock: body.currentStock ?? 0,
    safeStock: body.safeStock ?? 10,
    unit: body.unit,
    unitPrice: body.unitPrice ?? 0,
    lastRestocked: body.lastRestocked || new Date().toISOString().split('T')[0],
    expiryDate: body.expiryDate,
    supplier: body.supplier || '待指定',
  }

  db.inventory.push(item)

  res.status(201).json({
    success: true,
    data: item,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.inventory.findIndex(i => i.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Inventory item not found' })
    return
  }

  db.inventory[idx] = {
    ...db.inventory[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.inventory[idx],
  })
})

router.post('/:id/restock', async (req: Request, res: Response): Promise<void> => {
  const item = db.inventory.find(i => i.id === req.params.id)
  if (!item) {
    res.status(404).json({ success: false, error: 'Inventory item not found' })
    return
  }

  const { quantity, supplier } = req.body
  if (!quantity || Number(quantity) <= 0) {
    res.status(400).json({
      success: false,
      error: '请提供有效的补货数量 quantity',
    })
    return
  }

  const oldStock = item.currentStock
  item.currentStock += Number(quantity)
  item.lastRestocked = new Date().toISOString().split('T')[0]
  if (supplier) item.supplier = supplier

  res.json({
    success: true,
    data: {
      ...item,
      oldStock,
      addedQuantity: Number(quantity),
    },
  })
})

router.post('/:id/consume', async (req: Request, res: Response): Promise<void> => {
  const item = db.inventory.find(i => i.id === req.params.id)
  if (!item) {
    res.status(404).json({ success: false, error: 'Inventory item not found' })
    return
  }

  const { quantity, reason } = req.body
  if (!quantity || Number(quantity) <= 0) {
    res.status(400).json({
      success: false,
      error: '请提供有效的消耗数量 quantity',
    })
    return
  }

  if (Number(quantity) > item.currentStock) {
    res.status(400).json({
      success: false,
      error: `库存不足，当前库存: ${item.currentStock}${item.unit}`,
    })
    return
  }

  const oldStock = item.currentStock
  item.currentStock -= Number(quantity)

  const lowStock = item.currentStock < item.safeStock

  res.json({
    success: true,
    data: {
      ...item,
      oldStock,
      consumedQuantity: Number(quantity),
      lowStock,
      reason: reason || '日常消耗',
    },
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.inventory.findIndex(i => i.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Inventory item not found' })
    return
  }

  db.inventory.splice(idx, 1)
  res.json({ success: true })
})

router.get('/alerts/summary', async (_req: Request, res: Response): Promise<void> => {
  const lowStockItems = db.inventory.filter(i => i.currentStock < i.safeStock)
  const criticalStockItems = lowStockItems.filter(i => i.currentStock < i.safeStock * 0.5)
  const expiringItems = db.inventory.filter(
    i => i.expiryDate && new Date(i.expiryDate) <= new Date(Date.now() + 14 * 86400000)
  )

  res.json({
    success: true,
    data: {
      lowStock: {
        count: lowStockItems.length,
        items: lowStockItems
          .sort((a, b) => (a.currentStock / a.safeStock) - (b.currentStock / b.safeStock))
          .slice(0, 10)
          .map(i => ({
            id: i.id,
            name: i.name,
            currentStock: i.currentStock,
            safeStock: i.safeStock,
            unit: i.unit,
            percentage: Math.round((i.currentStock / i.safeStock) * 100),
          })),
      },
      criticalStock: {
        count: criticalStockItems.length,
        items: criticalStockItems.map(i => ({
          id: i.id,
          name: i.name,
          currentStock: i.currentStock,
          safeStock: i.safeStock,
          unit: i.unit,
        })),
      },
      expiring: {
        count: expiringItems.length,
        items: expiringItems.map(i => ({
          id: i.id,
          name: i.name,
          expiryDate: i.expiryDate,
          currentStock: i.currentStock,
          unit: i.unit,
        })),
      },
    },
  })
})

export default router
