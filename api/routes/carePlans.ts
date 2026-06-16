import { Router, type Request, type Response } from 'express'
import { db, type CarePlanStatus } from '../data/mockDb.js'
import { carePlanService } from '../services/CarePlanService.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { status, customerId, nurseId, page = 1, pageSize = 20 } = req.query

  let plans = [...db.carePlans]

  if (status) {
    plans = plans.filter(p => p.status === status)
  }

  if (customerId) {
    plans = plans.filter(p => p.customerId === customerId)
  }

  if (nurseId) {
    plans = plans.filter(p => p.assignedNurseIds.includes(String(nurseId)))
  }

  const total = plans.length
  const paged = plans.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(p => {
    const customer = db.customers.find(c => c.id === p.customerId)
    const template = p.templateId ? db.carePlanTemplates.find(t => t.id === p.templateId) : null
    const nurses = db.users.filter(u => p.assignedNurseIds.includes(u.id))
    const approver = p.approvedBy ? db.users.find(u => u.id === p.approvedBy) : undefined

    return {
      ...p,
      customer: customer
        ? { id: customer.id, name: customer.name, roomNumber: customer.roomId ? db.rooms.find(r => r.id === customer.roomId)?.roomNumber : undefined }
        : undefined,
      templateName: template?.name,
      assignedNurses: nurses,
      approvedByName: approver?.name,
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

router.get('/templates', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: db.carePlanTemplates,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const plan = db.carePlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  const customer = db.customers.find(c => c.id === plan.customerId)
  const template = plan.templateId ? db.carePlanTemplates.find(t => t.id === plan.templateId) : null
  const nurses = db.users.filter(u => plan.assignedNurseIds.includes(u.id))
  const approver = plan.approvedBy ? db.users.find(u => u.id === plan.approvedBy) : undefined
  const tasks = db.tasks.filter(t => t.carePlanId === plan.id)

  res.json({
    success: true,
    data: {
      ...plan,
      customer,
      template,
      assignedNurses: nurses,
      approvedByName: approver?.name,
      tasks,
    },
  })
})

router.post('/recommend/:customerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const recommendation = carePlanService.generateCarePlanRecommendation(req.params.customerId)
    res.json({
      success: true,
      data: recommendation,
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to generate recommendation',
    })
  }
})

router.get('/match-templates/:customerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const matches = carePlanService.findMatchingTemplates(req.params.customerId)
    res.json({
      success: true,
      data: matches,
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to match templates',
    })
  }
})

router.get('/available-nurses/:customerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { count = 1, date } = req.query
    const nurses = carePlanService.findAvailableNurses(
      req.params.customerId,
      Number(count),
      date ? String(date) : undefined
    )
    res.json({
      success: true,
      data: nurses,
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to find nurses',
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { customerId, templateId, nurseIds, tasks, planName } = req.body

  if (!customerId || !nurseIds || !Array.isArray(nurseIds) || nurseIds.length === 0) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: customerId, nurseIds (非空数组)',
    })
    return
  }

  try {
    const plan = carePlanService.createCarePlanFromRecommendation(
      customerId,
      templateId,
      nurseIds,
      tasks
    )
    if (planName) plan.planName = planName

    res.status(201).json({
      success: true,
      data: plan,
    })
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create care plan',
    })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.carePlans.findIndex(p => p.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  const plan = db.carePlans[idx]
  const oldStatus = plan.status

  Object.assign(plan, req.body)
  plan.version += 1

  if (
    (oldStatus === 'pending' || oldStatus === 'adjusting')
    && (plan.status === 'approved' || plan.status === 'executing')
  ) {
    carePlanService.autoGenerateDailyTasks(plan.id)
  }

  res.json({
    success: true,
    data: plan,
  })
})

router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  const plan = db.carePlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  const { approvedBy } = req.body
  const headNurse = db.users.find(u => u.id === approvedBy) || db.users.find(u => u.role === 'headNurse')

  plan.status = 'approved'
  plan.approvedBy = headNurse?.id
  plan.approvedAt = new Date().toISOString()
  plan.version += 1

  carePlanService.autoGenerateDailyTasks(plan.id)
  plan.status = 'executing'

  res.json({
    success: true,
    data: plan,
  })
})

router.post('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  const plan = db.carePlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  const { reason, rejectedBy } = req.body
  if (!reason) {
    res.status(400).json({
      success: false,
      error: '请提供驳回原因',
    })
    return
  }

  plan.status = 'rejected'
  plan.rejectionReason = reason
  plan.version += 1

  res.json({
    success: true,
    data: plan,
  })
})

router.post('/:id/request-adjust', async (req: Request, res: Response): Promise<void> => {
  const plan = db.carePlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  const { adjustTasks, adjustNurses, reason } = req.body

  plan.status = 'adjusting'
  plan.version += 1

  if (adjustTasks && Array.isArray(adjustTasks)) {
    plan.tasks = adjustTasks
  }
  if (adjustNurses && Array.isArray(adjustNurses)) {
    plan.assignedNurseIds = adjustNurses
  }

  res.json({
    success: true,
    data: { plan, adjustReason: reason },
  })
})

router.post('/:id/generate-tasks', async (req: Request, res: Response): Promise<void> => {
  const plan = db.carePlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  const { date } = req.body
  carePlanService.autoGenerateDailyTasks(plan.id, date)

  const tasks = db.tasks.filter(t => t.carePlanId === plan.id && t.scheduledDate === (date || new Date().toISOString().split('T')[0]))

  res.json({
    success: true,
    data: {
      generatedCount: tasks.length,
      tasks,
    },
  })
})

router.post('/reassign-overdue', async (req: Request, res: Response): Promise<void> => {
  const result = carePlanService.reassignOverdueTasks()
  res.json({
    success: true,
    data: result,
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.carePlans.findIndex(p => p.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Care plan not found' })
    return
  }

  db.carePlans.splice(idx, 1)

  res.json({ success: true })
})

export default router
