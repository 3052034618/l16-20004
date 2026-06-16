import { Router, type Request, type Response } from 'express'
import { db } from '../data/mockDb.js'

const router = Router()

router.get('/occupancy', async (req: Request, res: Response): Promise<void> => {
  const { period = 'month' } = req.query

  const now = new Date()
  let startDate: Date
  let labels: string[] = []

  if (period === 'week') {
    startDate = new Date(now)
    startDate.setDate(startDate.getDate() - 6)
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  } else if (period === 'quarter') {
    startDate = new Date(now)
    startDate.setMonth(startDate.getMonth() - 2)
    for (let i = 0; i < 3; i++) {
      const d = new Date(startDate)
      d.setMonth(d.getMonth() + i)
      labels.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
  } else {
    startDate = new Date(now)
    startDate.setDate(1)
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate()
    labels = Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(startDate)
      d.setDate(d.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }

  const totalRooms = db.rooms.length
  const occupancyData = labels.map(label => {
    const inHouse = db.customers.filter(c => c.status === 'inHouse' && c.checkInDate <= label && (c.expectedCheckOutDate >= label || !c.actualCheckOutDate || c.actualCheckOutDate >= label)).length
    return {
      date: label,
      occupied: Math.min(inHouse, totalRooms),
      total: totalRooms,
      rate: totalRooms > 0 ? Math.round((Math.min(inHouse, totalRooms) / totalRooms) * 1000) / 10 : 0,
    }
  })

  const avgOccupancy = occupancyData.length > 0
    ? Math.round((occupancyData.reduce((sum, d) => sum + d.rate, 0) / occupancyData.length) * 10) / 10
    : 0

  res.json({
    success: true,
    data: {
      period,
      labels,
      occupancyData,
      summary: {
        currentOccupancy: occupancyData[occupancyData.length - 1]?.rate || 0,
        averageOccupancy: avgOccupancy,
        peakOccupancy: Math.max(...occupancyData.map(d => d.rate), 0),
        totalRooms,
      },
    },
  })
})

router.get('/revenue', async (req: Request, res: Response): Promise<void> => {
  const { period = 'month', roomType } = req.query

  const now = new Date()
  const days = period === 'week' ? 7 : period === 'quarter' ? 90 : 30

  const dailyRevenue: { date: string; roomRevenue: number; serviceRevenue: number; total: number }[] = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    let roomRevenue = 0
    for (const customer of db.customers.filter(c => c.status !== 'reserved')) {
      const room = customer.roomId ? db.rooms.find(r => r.id === customer.roomId) : null
      if (!room) continue
      if (roomType && room.type !== roomType) continue

      const checkIn = new Date(customer.checkInDate)
      const checkOut = customer.actualCheckOutDate ? new Date(customer.actualCheckOutDate) : new Date(customer.expectedCheckOutDate)

      if (date >= checkIn && date <= checkOut) {
        roomRevenue += room.price
      }
    }

    const serviceRevenue = Math.round(roomRevenue * (0.15 + Math.random() * 0.1))

    dailyRevenue.push({
      date: dateStr,
      roomRevenue: Math.round(roomRevenue),
      serviceRevenue,
      total: Math.round(roomRevenue) + serviceRevenue,
    })
  }

  const roomTypeBreakdown = (['standard', 'deluxe', 'suite', 'vip'] as const).map(type => {
    const rooms = db.rooms.filter(r => r.type === type)
    const occupiedCount = rooms.filter(r => r.status === 'occupied').length
    const revenue = dailyRevenue.reduce((sum, _d) => {
      return sum + rooms.reduce((roomSum, r) => roomSum + (r.status === 'occupied' ? r.price : 0), 0)
    }, 0)

    return {
      type,
      typeName: { standard: '标准间', deluxe: '豪华间', suite: '套房', vip: 'VIP房' }[type],
      totalRooms: rooms.length,
      occupied: occupiedCount,
      rate: rooms.length > 0 ? Math.round((occupiedCount / rooms.length) * 1000) / 10 : 0,
      revenue: Math.round(revenue / days * 30),
      avgPrice: rooms.length > 0 ? Math.round(rooms.reduce((s, r) => s + r.price, 0) / rooms.length) : 0,
    }
  })

  const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.total, 0)
  const avgDailyRevenue = dailyRevenue.length > 0 ? Math.round(totalRevenue / dailyRevenue.length) : 0

  res.json({
    success: true,
    data: {
      period,
      dailyRevenue,
      roomTypeBreakdown,
      summary: {
        totalRevenue,
        avgDailyRevenue,
        totalRoomRevenue: dailyRevenue.reduce((s, d) => s + d.roomRevenue, 0),
        totalServiceRevenue: dailyRevenue.reduce((s, d) => s + d.serviceRevenue, 0),
      },
    },
  })
})

router.get('/satisfaction', async (req: Request, res: Response): Promise<void> => {
  const customersWithFeedback = db.customers.filter(c => c.satisfaction !== undefined)

  const scores = customersWithFeedback.map(c => c.satisfaction!)
  const avgScore = scores.length > 0
    ? Math.round((scores.reduce((s, x) => s + x, 0) / scores.length) * 10) / 10
    : 4.7

  const distribution = [1, 2, 3, 4, 5].map(score => ({
    score,
    count: scores.filter(s => s === score).length,
    percentage: scores.length > 0
      ? Math.round((scores.filter(s => s === score).length / scores.length) * 1000) / 10
      : 0,
  }))

  const dimensions = [
    { key: 'nursing', name: '护理专业度', score: Math.round((avgScore + 0.2) * 10) / 10, fullMark: 5 },
    { key: 'meal', name: '餐饮质量', score: Math.round((avgScore - 0.1) * 10) / 10, fullMark: 5 },
    { key: 'room', name: '房间环境', score: Math.round((avgScore + 0.1) * 10) / 10, fullMark: 5 },
    { key: 'service', name: '服务态度', score: Math.round((avgScore + 0.3) * 10) / 10, fullMark: 5 },
    { key: 'value', name: '性价比', score: Math.round((avgScore - 0.3) * 10) / 10, fullMark: 5 },
  ]

  const recentComments = customersWithFeedback
    .slice(-8)
    .reverse()
    .map(c => ({
      customerId: c.id,
      customerName: c.name,
      score: c.satisfaction,
      checkInDate: c.checkInDate,
      comment: c.satisfaction! >= 5
        ? '服务非常专业，护理团队很有耐心，环境也很舒适，强烈推荐！'
        : c.satisfaction! >= 4
          ? '整体体验不错，护理很到位，餐饮可以再丰富一些。'
          : '基本满意，希望在细节上可以更加完善。',
    }))

  res.json({
    success: true,
    data: {
      overall: {
        averageScore: avgScore,
        totalSurveys: scores.length,
        fullMark: 5,
      },
      distribution,
      dimensions,
      recentComments,
    },
  })
})

router.get('/customers/trend', async (req: Request, res: Response): Promise<void> => {
  const { months = 6 } = req.query

  const now = new Date()
  const monthData: {
    month: string
    checkIns: number
    checkOuts: number
    newReservations: number
    totalInHouse: number
    avgStayDays: number
  }[] = []

  for (let i = Number(months) - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthLabel = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)

    const checkIns = db.customers.filter(c => {
      const ci = new Date(c.checkInDate)
      return ci >= date && ci < nextMonth
    }).length

    const checkOuts = db.customers.filter(c => {
      if (!c.actualCheckOutDate) return false
      const co = new Date(c.actualCheckOutDate)
      return co >= date && co < nextMonth
    }).length

    const newReservations = Math.max(0, checkIns + Math.floor(Math.random() * 3) - 1)

    const inHouseEndOfMonth = db.customers.filter(c => {
      const ci = new Date(c.checkInDate)
      const co = c.actualCheckOutDate ? new Date(c.actualCheckOutDate) : new Date(c.expectedCheckOutDate)
      return ci < nextMonth && co > date
    }).length

    const monthCustomers = db.customers.filter(c => {
      const ci = new Date(c.checkInDate)
      return ci >= date && ci < nextMonth
    })
    const avgStayDays = monthCustomers.length > 0
      ? Math.round(
          monthCustomers.reduce((sum, c) => {
            const ci = new Date(c.checkInDate)
            const co = c.actualCheckOutDate ? new Date(c.actualCheckOutDate) : new Date(c.expectedCheckOutDate)
            return sum + Math.max(1, Math.ceil((co.getTime() - ci.getTime()) / 86400000))
          }, 0) / monthCustomers.length * 10
        ) / 10
      : 28

    monthData.push({
      month: monthLabel,
      checkIns,
      checkOuts,
      newReservations,
      totalInHouse: inHouseEndOfMonth,
      avgStayDays,
    })
  }

  res.json({
    success: true,
    data: monthData,
  })
})

router.get('/tasks/efficiency', async (req: Request, res: Response): Promise<void> => {
  const { days = 30 } = req.query

  const now = new Date()
  const dailyEfficiency: {
    date: string
    totalTasks: number
    completedOnTime: number
    completed: number
    overdue: number
    reassigned: number
    onTimeRate: number
    completionRate: number
  }[] = []

  for (let i = Number(days) - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayTasks = db.tasks.filter(t => t.scheduledDate === dateStr)
    const completed = dayTasks.filter(t => t.status === 'completed').length
    const overdue = dayTasks.filter(t => t.status === 'overdue').length
    const reassigned = dayTasks.filter(t => t.status === 'reassigned').length
    const onTime = completed

    dailyEfficiency.push({
      date: dateStr,
      totalTasks: dayTasks.length || Math.floor(30 + Math.random() * 20),
      completedOnTime: onTime || Math.floor((30 + Math.random() * 20) * 0.85),
      completed: completed || Math.floor((30 + Math.random() * 20) * 0.9),
      overdue: overdue || Math.floor(Math.random() * 3),
      reassigned: reassigned || Math.floor(Math.random() * 2),
      onTimeRate: dayTasks.length > 0 ? Math.round((onTime / dayTasks.length) * 1000) / 10 : 85 + Math.random() * 10,
      completionRate: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 1000) / 10 : 90 + Math.random() * 8,
    })
  }

  const nurseEfficiency = db.users
    .filter(u => u.role === 'nurse')
    .map(nurse => {
      const nurseTasks = db.tasks.filter(t => t.nurseId === nurse.id)
      const completed = nurseTasks.filter(t => t.status === 'completed').length
      const overdue = nurseTasks.filter(t => t.status === 'overdue').length
      const total = nurseTasks.length || 1

      return {
        nurseId: nurse.id,
        nurseName: nurse.name,
        totalTasks: total,
        completed,
        overdue,
        onTimeRate: Math.round((completed / total) * 1000) / 10,
        avgTaskDuration: 20 + Math.floor(Math.random() * 10),
      }
    })
    .sort((a, b) => b.onTimeRate - a.onTimeRate)

  res.json({
    success: true,
    data: {
      daily: dailyEfficiency,
      byNurse: nurseEfficiency,
      summary: {
        avgOnTimeRate: Math.round(
          dailyEfficiency.reduce((s, d) => s + d.onTimeRate, 0) / dailyEfficiency.length * 10
        ) / 10,
        avgCompletionRate: Math.round(
          dailyEfficiency.reduce((s, d) => s + d.completionRate, 0) / dailyEfficiency.length * 10
        ) / 10,
        totalTasks: dailyEfficiency.reduce((s, d) => s + d.totalTasks, 0),
        totalOverdue: dailyEfficiency.reduce((s, d) => s + d.overdue, 0),
      },
    },
  })
})

router.get('/summary', async (_req: Request, res: Response): Promise<void> => {
  const totalRooms = db.rooms.length
  const occupiedRooms = db.rooms.filter(r => r.status === 'occupied').length
  const inHouse = db.customers.filter(c => c.status === 'inHouse').length
  const totalCustomers = db.customers.length
  const completedTasks = db.tasks.filter(t => t.status === 'completed').length
  const totalTasks = db.tasks.length
  const avgSatisfaction = 4.7

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - 5 + i)
    return {
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      checkIns: 12 + Math.floor(Math.random() * 8),
      revenue: 350000 + Math.floor(Math.random() * 150000),
      occupancy: 70 + Math.floor(Math.random() * 20),
    }
  })

  const deliveryTypes = [
    { key: 'natural', name: '顺产', count: db.customers.filter(c => c.deliveryType === 'natural').length },
    { key: 'cesarean', name: '剖腹产', count: db.customers.filter(c => c.deliveryType === 'cesarean').length },
    { key: 'forceps', name: '产钳助产', count: db.customers.filter(c => c.deliveryType === 'forceps').length },
    { key: 'vacuum', name: '胎吸助产', count: db.customers.filter(c => c.deliveryType === 'vacuum').length },
  ]

  res.json({
    success: true,
    data: {
      keyMetrics: {
        totalRooms,
        occupiedRooms,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 1000) / 10 : 0,
        inHouseCustomers: inHouse,
        totalCustomers,
        activeCarePlans: db.carePlans.filter(p => p.status === 'executing' || p.status === 'approved').length,
        todayTasks: totalTasks,
        todayCompleted: completedTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0,
        avgSatisfaction,
        totalRevenue: monthlyData.reduce((s, m) => s + m.revenue, 0),
      },
      monthlyTrend: monthlyData,
      deliveryTypeBreakdown: deliveryTypes,
    },
  })
})

router.get('/export/monthly', async (req: Request, res: Response): Promise<void> => {
  const { year, month } = req.query
  const reportYear = year ? Number(year) : new Date().getFullYear()
  const reportMonth = month ? Number(month) - 1 : new Date().getMonth()

  const monthLabel = `${reportYear}年${reportMonth + 1}月`

  const report = {
    title: `${monthLabel}月度运营报告`,
    generatedAt: new Date().toISOString(),
    period: {
      year: reportYear,
      month: reportMonth + 1,
      label: monthLabel,
    },
    overview: {
      totalCheckIns: 15 + Math.floor(Math.random() * 10),
      totalCheckOuts: 14 + Math.floor(Math.random() * 10),
      avgOccupancy: 75 + Math.floor(Math.random() * 15),
      totalRevenue: 480000 + Math.floor(Math.random() * 200000),
      avgSatisfaction: 4.6 + Math.random() * 0.3,
      taskCompletionRate: 92 + Math.random() * 6,
    },
    roomTypeAnalysis: (['standard', 'deluxe', 'suite', 'vip'] as const).map(t => ({
      type: t,
      name: { standard: '标准间', deluxe: '豪华间', suite: '套房', vip: 'VIP房' }[t],
      occupancy: 65 + Math.floor(Math.random() * 25),
      revenue: 80000 + Math.floor(Math.random() * 150000),
    })),
    nursingQuality: {
      totalTasks: 850 + Math.floor(Math.random() * 200),
      completedOnTime: 93 + Math.random() * 5,
      overdueTasks: Math.floor(Math.random() * 15),
      incidentCount: Math.floor(Math.random() * 3),
    },
    customerFeedback: {
      surveysCollected: 12 + Math.floor(Math.random() * 8),
      avgScore: 4.5 + Math.random() * 0.4,
      byDimension: {
        nursing: 4.7,
        meal: 4.4,
        room: 4.6,
        service: 4.8,
      },
    },
    conclusions: [
      '本月入住率保持稳定，VIP房型需求增长明显',
      '护理任务完成率持续保持在92%以上',
      '餐饮满意度有待提升，建议优化菜品搭配',
      '客户整体满意度较高，推荐意愿良好',
    ],
    recommendations: [
      '增加VIP房型供应比例，提升高净值客户承载能力',
      '加强餐饮部门与营养师协同，优化月子餐菜单',
      '继续保持护理质量，定期组织技能培训',
      '做好老客户转介绍激励政策',
    ],
  }

  res.json({
    success: true,
    data: report,
  })
})

export default router
