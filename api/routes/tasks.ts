import { Router, type Request, type Response } from 'express'
import { db, type TaskStatus, type Task } from '../data/mockDb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const {
    status,
    nurseId,
    customerId,
    carePlanId,
    date,
    category,
    priority,
    page = 1,
    pageSize = 50,
  } = req.query

  let tasks = [...db.tasks]

  if (status) {
    tasks = tasks.filter(t => t.status === status)
  }

  if (nurseId) {
    tasks = tasks.filter(t => t.nurseId === nurseId)
  }

  if (customerId) {
    tasks = tasks.filter(t => t.customerId === customerId)
  }

  if (carePlanId) {
    tasks = tasks.filter(t => t.carePlanId === carePlanId)
  }

  if (date) {
    tasks = tasks.filter(t => t.scheduledDate === date)
  }

  if (category) {
    tasks = tasks.filter(t => t.category === category)
  }

  if (priority) {
    tasks = tasks.filter(t => t.priority === Number(priority))
  }

  tasks = tasks.sort((a, b) => {
    const priorityDiff = b.priority - a.priority
    if (priorityDiff !== 0) return priorityDiff
    const dateDiff = a.scheduledDate.localeCompare(b.scheduledDate)
    if (dateDiff !== 0) return dateDiff
    return a.scheduledTime.localeCompare(b.scheduledTime)
  })

  const total = tasks.length
  const paged = tasks.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(t => {
    const customer = db.customers.find(c => c.id === t.customerId)
    const nurse = t.nurseId ? db.users.find(u => u.id === t.nurseId) : undefined
    const room = customer?.roomId ? db.rooms.find(r => r.id === customer.roomId) : undefined

    return {
      ...t,
      customerName: customer?.name,
      roomNumber: room?.roomNumber,
      nurseName: nurse?.name,
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

router.get('/kanban', async (req: Request, res: Response): Promise<void> => {
  const { date, nurseId } = req.query
  const targetDate = date || new Date().toISOString().split('T')[0]

  let tasks = db.tasks.filter(t => t.scheduledDate === targetDate)

  if (nurseId) {
    tasks = tasks.filter(t => t.nurseId === nurseId)
  }

  const nurses = nurseId
    ? db.users.filter(u => u.id === nurseId)
    : db.users.filter(u => u.role === 'nurse' && u.status === 'active')

  const statuses: TaskStatus[] = ['pending', 'inProgress', 'completed', 'overdue']

  const kanban = nurses.map(nurse => {
    const nurseTasks = tasks.filter(t => t.nurseId === nurse.id)

    const columns = statuses.map(status => {
      const statusTasks = nurseTasks
        .filter(t => t.status === status)
        .map(t => {
          const customer = db.customers.find(c => c.id === t.customerId)
          const room = customer?.roomId ? db.rooms.find(r => r.id === customer.roomId) : undefined
          return {
            ...t,
            customerName: customer?.name,
            roomNumber: room?.roomNumber,
          }
        })

      return {
        status,
        count: statusTasks.length,
        tasks: statusTasks,
      }
    })

    const todaySchedules = db.schedules.filter(s => s.nurseId === nurse.id && s.date === targetDate)
    const workHours = todaySchedules.reduce((sum, s) => sum + s.workHours, 0)

    return {
      nurse: {
        id: nurse.id,
        name: nurse.name,
        status: nurse.status,
      },
      totalTasks: nurseTasks.length,
      completedTasks: nurseTasks.filter(t => t.status === 'completed').length,
      workHours,
      columns,
    }
  })

  const summary = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'inProgress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    total: tasks.length,
  }

  res.json({
    success: true,
    data: {
      date: targetDate,
      summary,
      nurses: kanban,
    },
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const task = db.tasks.find(t => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  const customer = db.customers.find(c => c.id === task.customerId)
  const nurse = task.nurseId ? db.users.find(u => u.id === task.nurseId) : undefined
  const carePlan = db.carePlans.find(p => p.id === task.carePlanId)
  const room = customer?.roomId ? db.rooms.find(r => r.id === customer.roomId) : undefined

  res.json({
    success: true,
    data: {
      ...task,
      customerName: customer?.name,
      roomNumber: room?.roomNumber,
      nurseName: nurse?.name,
      carePlanName: carePlan?.planName,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<Task> & {
    carePlanId: string
    customerId: string
    name: string
    scheduledDate: string
    scheduledTime: string
  }

  if (!body.customerId || !body.name || !body.scheduledDate || !body.scheduledTime) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: customerId, name, scheduledDate, scheduledTime',
    })
    return
  }

  const task: Task = {
    id: db.genId('t'),
    carePlanId: body.carePlanId || '',
    customerId: body.customerId,
    nurseId: body.nurseId || null,
    name: body.name,
    category: body.category || 'both',
    scheduledDate: body.scheduledDate,
    scheduledTime: body.scheduledTime,
    durationMinutes: body.durationMinutes || 20,
    status: body.status || 'pending',
    priority: body.priority || 3,
    notes: body.notes,
    createdAt: new Date().toISOString(),
  }

  db.tasks.push(task)

  res.status(201).json({
    success: true,
    data: task,
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  db.tasks[idx] = {
    ...db.tasks[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.tasks[idx],
  })
})

router.post('/:id/start', async (req: Request, res: Response): Promise<void> => {
  const task = db.tasks.find(t => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  task.status = 'inProgress'
  task.startedAt = new Date().toISOString()

  res.json({
    success: true,
    data: task,
  })
})

router.post('/:id/complete', async (req: Request, res: Response): Promise<void> => {
  const task = db.tasks.find(t => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  const { notes } = req.body

  task.status = 'completed'
  task.completedAt = new Date().toISOString()
  if (!task.startedAt) {
    task.startedAt = new Date(Date.now() - task.durationMinutes * 60000).toISOString()
  }
  if (notes) {
    task.notes = notes
  }

  res.json({
    success: true,
    data: task,
  })
})

router.post('/:id/reassign', async (req: Request, res: Response): Promise<void> => {
  const task = db.tasks.find(t => t.id === req.params.id)
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  const { nurseId, reason } = req.body
  if (!nurseId) {
    res.status(400).json({
      success: false,
      error: '请指定新的护理师 nurseId',
    })
    return
  }

  const oldNurse = task.nurseId ? db.users.find(u => u.id === task.nurseId) : null
  const newNurse = db.users.find(u => u.id === nurseId)
  if (!newNurse || newNurse.role !== 'nurse') {
    res.status(400).json({
      success: false,
      error: '无效的护理师ID',
    })
    return
  }

  task.nurseId = nurseId
  task.status = 'reassigned'
  task.notes = [task.notes, `从${oldNurse?.name || '未分配'}转派给${newNurse.name}: ${reason || ''}`].filter(Boolean).join(' | ')

  res.json({
    success: true,
    data: task,
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.tasks.findIndex(t => t.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  db.tasks.splice(idx, 1)

  res.json({ success: true })
})

router.get('/stats/summary', async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query
  const targetDate = date || new Date().toISOString().split('T')[0]

  const dateTasks = db.tasks.filter(t => t.scheduledDate === targetDate)

  const byStatus = {
    pending: dateTasks.filter(t => t.status === 'pending').length,
    inProgress: dateTasks.filter(t => t.status === 'inProgress').length,
    completed: dateTasks.filter(t => t.status === 'completed').length,
    overdue: dateTasks.filter(t => t.status === 'overdue').length,
    reassigned: dateTasks.filter(t => t.status === 'reassigned').length,
  }

  const byCategory = {
    mother: dateTasks.filter(t => t.category === 'mother').length,
    baby: dateTasks.filter(t => t.category === 'baby').length,
    both: dateTasks.filter(t => t.category === 'both').length,
  }

  const completionRate = dateTasks.length > 0
    ? Math.round((byStatus.completed / dateTasks.length) * 1000) / 10
    : 100

  const nurseStats = db.users
    .filter(u => u.role === 'nurse')
    .map(nurse => {
      const nurseTasks = dateTasks.filter(t => t.nurseId === nurse.id)
      return {
        nurseId: nurse.id,
        nurseName: nurse.name,
        total: nurseTasks.length,
        completed: nurseTasks.filter(t => t.status === 'completed').length,
        inProgress: nurseTasks.filter(t => t.status === 'inProgress').length,
        pending: nurseTasks.filter(t => t.status === 'pending').length,
        overdue: nurseTasks.filter(t => t.status === 'overdue').length,
      }
    })

  res.json({
    success: true,
    data: {
      date: targetDate,
      byStatus,
      byCategory,
      completionRate,
      totalTasks: dateTasks.length,
      nurseStats,
    },
  })
})

export default router
