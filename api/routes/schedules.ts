import { Router, type Request, type Response } from 'express'
import { db, type Schedule, type ShiftType } from '../data/mockDb.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { nurseId, startDate, endDate, shift, page = 1, pageSize = 100 } = req.query

  let schedules = [...db.schedules]

  if (nurseId) {
    schedules = schedules.filter(s => s.nurseId === nurseId)
  }

  if (startDate) {
    schedules = schedules.filter(s => s.date >= String(startDate))
  }

  if (endDate) {
    schedules = schedules.filter(s => s.date <= String(endDate))
  }

  if (shift) {
    schedules = schedules.filter(s => s.shift === shift)
  }

  schedules = schedules.sort((a, b) =>
    a.date.localeCompare(b.date) || a.nurseId.localeCompare(b.nurseId)
  )

  const total = schedules.length
  const paged = schedules.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(s => {
    const nurse = db.users.find(u => u.id === s.nurseId)
    const customers = s.customerIds.map(cid => {
      const c = db.customers.find(x => x.id === cid)
      return c ? { id: c.id, name: c.name } : undefined
    }).filter(Boolean)

    return {
      ...s,
      nurseName: nurse?.name,
      nurseRole: nurse?.role,
      nurseStatus: nurse?.status,
      customers,
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

router.get('/calendar', async (req: Request, res: Response): Promise<void> => {
  const { weekStart } = req.query

  const baseDate = weekStart ? new Date(String(weekStart)) : new Date()
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const nurses = db.users.filter(u => u.role === 'nurse')

  const calendar = nurses.map(nurse => {
    const weekSchedules = dates.map(date => {
      const schedule = db.schedules.find(s => s.nurseId === nurse.id && s.date === date)
      const dayTasks = db.tasks.filter(
        t => t.nurseId === nurse.id && t.scheduledDate === date
      )

      return {
        date,
        schedule,
        shift: schedule?.shift || 'unassigned',
        workHours: schedule?.workHours || 0,
        taskCount: dayTasks.length,
        completedTasks: dayTasks.filter(t => t.status === 'completed').length,
        customerIds: schedule?.customerIds || [],
      }
    })

    const totalHours = weekSchedules.reduce((sum, d) => sum + d.workHours, 0)
    const maxHoursPerWeek = 44
    const isOverloaded = totalHours > maxHoursPerWeek

    return {
      nurse: {
        id: nurse.id,
        name: nurse.name,
        status: nurse.status,
      },
      weekTotalHours: totalHours,
      maxHoursPerWeek,
      isOverloaded,
      days: weekSchedules,
    }
  })

  const shiftStats = dates.map(date => {
    const daySchedules = db.schedules.filter(s => s.date === date)
    return {
      date,
      morning: daySchedules.filter(s => s.shift === 'morning').length,
      afternoon: daySchedules.filter(s => s.shift === 'afternoon').length,
      night: daySchedules.filter(s => s.shift === 'night').length,
      dayOff: daySchedules.filter(s => s.shift === 'dayOff').length,
      unassigned: nurses.length - daySchedules.length,
    }
  })

  res.json({
    success: true,
    data: {
      weekDates: dates,
      nurses: calendar,
      shiftStats,
      totalNurses: nurses.length,
    },
  })
})

router.get('/nurse-workload', async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query

  const nurses = db.users.filter(u => u.role === 'nurse')
  const today = new Date().toISOString().split('T')[0]

  const workloads = nurses.map(nurse => {
    let schedules = db.schedules.filter(s => s.nurseId === nurse.id)
    if (startDate) schedules = schedules.filter(s => s.date >= String(startDate))
    if (endDate) schedules = schedules.filter(s => s.date <= String(endDate))

    const totalHours = schedules.reduce((sum, s) => sum + s.workHours, 0)
    const totalDays = schedules.length
    const dayOffDays = schedules.filter(s => s.shift === 'dayOff').length
    const workDays = totalDays - dayOffDays

    let tasks = db.tasks.filter(t => t.nurseId === nurse.id)
    if (startDate) tasks = tasks.filter(t => t.scheduledDate >= String(startDate))
    if (endDate) tasks = tasks.filter(t => t.scheduledDate <= String(endDate))

    const todaySchedules = db.schedules.filter(s => s.nurseId === nurse.id && s.date === today)
    const todayHours = todaySchedules.reduce((sum, s) => sum + s.workHours, 0)

    return {
      nurse: {
        id: nurse.id,
        name: nurse.name,
        status: nurse.status,
      },
      period: {
        startDate: startDate || schedules[0]?.date,
        endDate: endDate || schedules[schedules.length - 1]?.date,
        totalDays,
        workDays,
        dayOffDays,
      },
      totalWorkHours: totalHours,
      avgHoursPerDay: workDays > 0 ? Math.round((totalHours / workDays) * 10) / 10 : 0,
      todayHours,
      maxHoursPerDay: 10,
      maxHoursPerWeek: 44,
      isOverloadedToday: todayHours > 10,
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => t.status === 'overdue').length,
      },
    }
  })

  res.json({
    success: true,
    data: workloads,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const schedule = db.schedules.find(s => s.id === req.params.id)
  if (!schedule) {
    res.status(404).json({ success: false, error: 'Schedule not found' })
    return
  }

  const nurse = db.users.find(u => u.id === schedule.nurseId)
  const customers = schedule.customerIds.map(cid => db.customers.find(c => c.id === cid)).filter(Boolean)

  res.json({
    success: true,
    data: {
      ...schedule,
      nurseName: nurse?.name,
      customers,
    },
  })
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<Schedule> & {
    nurseId: string
    date: string
    shift: ShiftType
  }

  if (!body.nurseId || !body.date || !body.shift) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: nurseId, date, shift',
    })
    return
  }

  const shiftHours: Record<ShiftType, { start: number; end: number; hours: number }> = {
    morning: { start: 6, end: 14, hours: 8 },
    afternoon: { start: 14, end: 22, hours: 8 },
    night: { start: 22, end: 30, hours: 8 },
    dayOff: { start: 0, end: 0, hours: 0 },
  }

  const hours = shiftHours[body.shift]

  const existing = db.schedules.find(s => s.nurseId === body.nurseId && s.date === body.date)
  if (existing) {
    Object.assign(existing, {
      shift: body.shift,
      startHour: hours.start,
      endHour: hours.end,
      workHours: hours.hours,
      customerIds: body.customerIds || existing.customerIds,
    })
    res.json({ success: true, data: existing })
    return
  }

  const schedule: Schedule = {
    id: db.genId('s'),
    nurseId: body.nurseId,
    date: body.date,
    shift: body.shift,
    startHour: body.startHour ?? hours.start,
    endHour: body.endHour ?? hours.end,
    workHours: body.workHours ?? hours.hours,
    customerIds: body.customerIds || [],
  }

  db.schedules.push(schedule)

  res.status(201).json({
    success: true,
    data: schedule,
  })
})

router.post('/batch', async (req: Request, res: Response): Promise<void> => {
  const { schedules } = req.body as {
    schedules: {
      nurseId: string
      date: string
      shift: ShiftType
      customerIds?: string[]
    }[]
  }

  if (!schedules || !Array.isArray(schedules)) {
    res.status(400).json({
      success: false,
      error: '需要 schedules 数组',
    })
    return
  }

  const shiftHours: Record<ShiftType, { start: number; end: number; hours: number }> = {
    morning: { start: 6, end: 14, hours: 8 },
    afternoon: { start: 14, end: 22, hours: 8 },
    night: { start: 22, end: 30, hours: 8 },
    dayOff: { start: 0, end: 0, hours: 0 },
  }

  const created: Schedule[] = []
  const updated: Schedule[] = []

  for (const item of schedules) {
    const hours = shiftHours[item.shift]
    const existing = db.schedules.find(s => s.nurseId === item.nurseId && s.date === item.date)

    if (existing) {
      Object.assign(existing, {
        shift: item.shift,
        startHour: hours.start,
        endHour: hours.end,
        workHours: hours.hours,
        customerIds: item.customerIds || existing.customerIds,
      })
      updated.push(existing)
    } else {
      const schedule: Schedule = {
        id: db.genId('s'),
        nurseId: item.nurseId,
        date: item.date,
        shift: item.shift,
        startHour: hours.start,
        endHour: hours.end,
        workHours: hours.hours,
        customerIds: item.customerIds || [],
      }
      db.schedules.push(schedule)
      created.push(schedule)
    }
  }

  res.json({
    success: true,
    data: {
      created,
      updated,
      totalCreated: created.length,
      totalUpdated: updated.length,
    },
  })
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.schedules.findIndex(s => s.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Schedule not found' })
    return
  }

  db.schedules[idx] = {
    ...db.schedules[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.schedules[idx],
  })
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.schedules.findIndex(s => s.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Schedule not found' })
    return
  }

  db.schedules.splice(idx, 1)

  res.json({ success: true })
})

router.post('/auto-schedule', async (req: Request, res: Response): Promise<void> => {
  const { weekStart } = req.body as { weekStart?: string }

  const baseDate = weekStart ? new Date(String(weekStart)) : new Date()
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const nurses = db.users.filter(u => u.role === 'nurse' && u.status === 'active')
  const shifts: ShiftType[] = ['morning', 'afternoon', 'night', 'dayOff']
  const shiftHours: Record<ShiftType, { start: number; end: number; hours: number }> = {
    morning: { start: 6, end: 14, hours: 8 },
    afternoon: { start: 14, end: 22, hours: 8 },
    night: { start: 22, end: 30, hours: 8 },
    dayOff: { start: 0, end: 0, hours: 0 },
  }

  const inHouseCustomers = db.customers.filter(c => c.status === 'inHouse')
  const created: Schedule[] = []

  for (let di = 0; di < dates.length; di++) {
    const date = dates[di]
    const requiredPerShift = Math.max(2, Math.ceil(nurses.length / 3))

    for (let ni = 0; ni < nurses.length; ni++) {
      const existing = db.schedules.find(s => s.nurseId === nurses[ni].id && s.date === date)
      if (existing) continue

      let shiftIdx = (di + ni) % shifts.length
      if (shiftIdx === 3 && di !== 2 && di !== 3) {
        shiftIdx = (di + ni + 1) % 3
      }

      const shift = shifts[shiftIdx]
      const hours = shiftHours[shift]

      const customerStart = (ni * 2 + di) % inHouseCustomers.length
      const assignedCustomers = shift !== 'dayOff'
        ? [
            inHouseCustomers[customerStart]?.id,
            inHouseCustomers[(customerStart + 1) % inHouseCustomers.length]?.id,
          ].filter(Boolean) as string[]
        : []

      const schedule: Schedule = {
        id: db.genId('s'),
        nurseId: nurses[ni].id,
        date,
        shift,
        startHour: hours.start,
        endHour: hours.end,
        workHours: hours.hours,
        customerIds: assignedCustomers,
      }

      db.schedules.push(schedule)
      created.push(schedule)
    }
  }

  res.json({
    success: true,
    data: {
      generatedForDates: dates,
      schedulesCreated: created.length,
      schedules: created,
    },
  })
})

export default router
