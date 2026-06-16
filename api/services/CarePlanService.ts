import {
  db,
  type Customer,
  type CarePlanTemplate,
  type CarePlan,
  type CareTaskTemplate,
  type User,
  type Schedule,
} from '../data/mockDb.js'

export interface TemplateMatchResult {
  template: CarePlanTemplate
  score: number
  matchReasons: string[]
}

export interface NurseAssignment {
  nurse: User
  score: number
  currentWorkload: number
  maxWorkload: number
  overlappingCustomers: number
  scheduleFit: number
  reasons: string[]
}

export interface CarePlanRecommendation {
  customer: Customer
  matchedTemplates: TemplateMatchResult[]
  recommendedTemplate: CarePlanTemplate
  nurseAssignments: NurseAssignment[]
  assignedNurses: User[]
  estimatedWorkHours: number
  dailyTaskCount: number
  alerts: {
    type: 'info' | 'warning' | 'danger'
    message: string
  }[]
}

const MAX_WORKLOAD_HOURS_PER_DAY = 10
const MAX_CUSTOMERS_PER_NURSE = 4
const MOTHER_BABY_ROOM_EXTRA_NURSE = true

export class CarePlanService {
  private calculateDeliveryTypeScore(template: CarePlanTemplate, customer: Customer): number {
    if (template.forDeliveryType === 'all') return 70
    if (template.forDeliveryType === customer.deliveryType) return 100
    return 20
  }

  private calculateApgarScore(template: CarePlanTemplate, customer: Customer): number {
    const apgar = customer.apgarScore
    if (apgar >= template.minApgar && apgar <= template.maxApgar) {
      const range = template.maxApgar - template.minApgar || 1
      const midpoint = (template.minApgar + template.maxApgar) / 2
      const distance = Math.abs(apgar - midpoint) / range
      return Math.round(100 - distance * 30)
    }
    const distance = apgar < template.minApgar
      ? template.minApgar - apgar
      : apgar - template.maxApgar
    return Math.max(0, 50 - distance * 15)
  }

  private calculateMotherBabyRoomScore(template: CarePlanTemplate, customer: Customer): number {
    if (template.motherBabyRoomRequired === undefined) return 90
    if (template.motherBabyRoomRequired && customer.motherBabyRoom) return 100
    if (template.motherBabyRoomRequired && !customer.motherBabyRoom) return 40
    if (!template.motherBabyRoomRequired && customer.motherBabyRoom) return 85
    return 95
  }

  public findMatchingTemplates(customerId: string): TemplateMatchResult[] {
    const customer = db.customers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')

    const results: TemplateMatchResult[] = []

    for (const template of db.carePlanTemplates) {
      const deliveryScore = this.calculateDeliveryTypeScore(template, customer)
      const apgarScore = this.calculateApgarScore(template, customer)
      const mbrScore = this.calculateMotherBabyRoomScore(template, customer)

      const totalScore = Math.round(
        deliveryScore * 0.4 +
        apgarScore * 0.4 +
        mbrScore * 0.2
      )

      const reasons: string[] = []
      if (deliveryScore >= 100) reasons.push(`分娩方式完全匹配：${customer.deliveryType}`)
      else if (deliveryScore >= 70) reasons.push('分娩方式通用适配')
      else reasons.push('分娩方式匹配度较低')

      if (apgarScore >= 90) reasons.push(`Apgar评分${customer.apgarScore}分，方案完美适配`)
      else if (apgarScore >= 70) reasons.push(`Apgar评分在方案适用范围内`)
      else reasons.push('Apgar评分接近适用边界')

      if (mbrScore >= 95) reasons.push(customer.motherBabyRoom ? '母婴同室配置支持' : '无需母婴同室')
      else if (mbrScore >= 85) reasons.push('可兼容母婴同室')
      else reasons.push('注意：方案要求母婴同室但客户未选择')

      results.push({
        template,
        score: totalScore,
        matchReasons: reasons,
      })
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private getNurseCurrentWorkload(nurseId: string, date: string): number {
    const nurseSchedules = db.schedules.filter(s => s.nurseId === nurseId && s.date === date)
    const plannedHours = nurseSchedules.reduce((sum, s) => sum + s.workHours, 0)

    const nurseTasks = db.tasks.filter(
      t => t.nurseId === nurseId
        && t.scheduledDate === date
        && t.status !== 'reassigned'
    )
    const taskHours = nurseTasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0)

    return Math.max(plannedHours, taskHours)
  }

  private getNurseAssignedCustomers(nurseId: string): string[] {
    const plans = db.carePlans.filter(
      p => p.assignedNurseIds.includes(nurseId)
        && (p.status === 'approved' || p.status === 'executing')
    )
    return [...new Set(plans.map(p => p.customerId))]
  }

  private getScheduleFitScore(nurseId: string, date: string): number {
    const schedule = db.schedules.find(s => s.nurseId === nurseId && s.date === date)
    if (!schedule) return 50
    if (schedule.shift === 'dayOff') return 10
    if (schedule.workHours >= MAX_WORKLOAD_HOURS_PER_DAY) return 40
    if (schedule.workHours >= MAX_WORKLOAD_HOURS_PER_DAY * 0.8) return 60
    return 90
  }

  public findAvailableNurses(
    customerId: string,
    requiredCount: number = 1,
    date?: string
  ): NurseAssignment[] {
    const customer = db.customers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')

    const targetDate = date || new Date().toISOString().split('T')[0]
    const allNurses = db.users.filter(u => u.role === 'nurse' && u.status === 'active')
    const customerRoom = customer.roomId ? db.rooms.find(r => r.id === customer.roomId) : null
    const customerFloor = customerRoom?.floor

    const assignments: NurseAssignment[] = []

    for (const nurse of allNurses) {
      const currentWorkload = this.getNurseCurrentWorkload(nurse.id, targetDate)
      const assignedCustomers = this.getNurseAssignedCustomers(nurse.id)
      const scheduleFit = this.getScheduleFitScore(nurse.id, targetDate)

      const workloadScore = currentWorkload >= MAX_WORKLOAD_HOURS_PER_DAY
        ? 0
        : currentWorkload >= MAX_WORKLOAD_HOURS_PER_DAY * 0.8
          ? 30
          : Math.round(100 - (currentWorkload / MAX_WORKLOAD_HOURS_PER_DAY) * 60)

      const customerCountScore = assignedCustomers.length >= MAX_CUSTOMERS_PER_NURSE
        ? 10
        : assignedCustomers.length >= MAX_CUSTOMERS_PER_NURSE * 0.75
          ? 50
          : Math.round(100 - (assignedCustomers.length / MAX_CUSTOMERS_PER_NURSE) * 40)

      const floorFitScore = customerFloor
        ? (Math.random() > 0.3 ? 100 : 75)
        : 80

      const totalScore = Math.round(
        workloadScore * 0.35 +
        customerCountScore * 0.25 +
        scheduleFit * 0.25 +
        floorFitScore * 0.15
      )

      const reasons: string[] = []
      reasons.push(`当前工时: ${currentWorkload.toFixed(1)}h / ${MAX_WORKLOAD_HOURS_PER_DAY}h`)
      reasons.push(`已分配客户: ${assignedCustomers.length} / ${MAX_CUSTOMERS_PER_NURSE}人`)
      if (scheduleFit >= 90) reasons.push('当日排班充足')
      else if (scheduleFit >= 60) reasons.push('当日排班较满')
      else if (scheduleFit >= 40) reasons.push('当日排班接近上限')
      else reasons.push('注意：排班冲突风险')

      assignments.push({
        nurse,
        score: totalScore,
        currentWorkload,
        maxWorkload: MAX_WORKLOAD_HOURS_PER_DAY,
        overlappingCustomers: assignedCustomers.length,
        scheduleFit,
        reasons,
      })
    }

    return assignments
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(requiredCount * 3, 6))
  }

  public generateCarePlanRecommendation(customerId: string): CarePlanRecommendation {
    const customer = db.customers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')

    const matchedTemplates = this.findMatchingTemplates(customerId)
    const recommendedTemplate = matchedTemplates[0].template

    const requiredNurseCount = customer.motherBabyRoom && MOTHER_BABY_ROOM_EXTRA_NURSE ? 2 : 1
    const nurseAssignments = this.findAvailableNurses(customerId, requiredNurseCount)
    const assignedNurses = nurseAssignments
      .slice(0, requiredNurseCount)
      .map(a => a.nurse)

    const dailyTaskCount = recommendedTemplate.tasks.reduce(
      (sum, t) => sum + t.frequencyPerDay, 0
    )
    const dailyWorkHours = recommendedTemplate.tasks.reduce(
      (sum, t) => sum + (t.frequencyPerDay * t.durationMinutes) / 60, 0
    )

    const alerts: CarePlanRecommendation['alerts'] = []

    if (matchedTemplates[0].score < 80) {
      alerts.push({
        type: 'warning',
        message: '没有找到完美匹配的护理方案模板，推荐方案可能需要人工调整',
      })
    }

    if (assignedNurses.length < requiredNurseCount) {
      alerts.push({
        type: 'danger',
        message: '可用护理师不足，建议立即调整排班或申请支援',
      })
    } else if (nurseAssignments[0]?.score < 70) {
      alerts.push({
        type: 'warning',
        message: '推荐护理师排班较紧张，请关注工时平衡',
      })
    }

    const heavyWorkloadTasks = recommendedTemplate.tasks.filter(
      t => t.frequencyPerDay * t.durationMinutes >= 90
    )
    if (heavyWorkloadTasks.length >= 2) {
      alerts.push({
        type: 'info',
        message: `方案包含${heavyWorkloadTasks.length}项高频率任务，请注意护理师工作强度`,
      })
    }

    if (customer.apgarScore < 7) {
      alerts.push({
        type: 'warning',
        message: `新生儿Apgar评分${customer.apgarScore}分偏低，建议增加儿科医生巡视频率`,
      })
    }

    if (customer.deliveryType === 'cesarean') {
      alerts.push({
        type: 'info',
        message: '剖腹产客户需要特别关注伤口恢复和下床活动指导',
      })
    }

    return {
      customer,
      matchedTemplates,
      recommendedTemplate,
      nurseAssignments,
      assignedNurses,
      estimatedWorkHours: Math.round(dailyWorkHours * 30 * 10) / 10,
      dailyTaskCount,
      alerts,
    }
  }

  public createCarePlanFromRecommendation(
    customerId: string,
    templateId: string,
    nurseIds: string[],
    customTasks?: CareTaskTemplate[]
  ): CarePlan {
    const customer = db.customers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')

    const template = db.carePlanTemplates.find(t => t.id === templateId)
    if (!template) throw new Error('Template not found')

    const nurses = db.users.filter(u => nurseIds.includes(u.id) && u.role === 'nurse')
    if (nurses.length === 0) throw new Error('No valid nurses assigned')

    const plan: CarePlan = {
      id: db.genId('cp'),
      customerId,
      templateId,
      planName: template.name,
      status: 'pending',
      tasks: customTasks || [...template.tasks],
      assignedNurseIds: nurses.map(n => n.id),
      totalWorkHours: template.estimatedWorkHours,
      createdAt: new Date().toISOString(),
      version: 1,
    }

    db.carePlans.push(plan)

    return plan
  }

  public autoGenerateDailyTasks(carePlanId: string, date?: string): void {
    const plan = db.carePlans.find(p => p.id === carePlanId)
    if (!plan) throw new Error('Care plan not found')

    const targetDate = date || new Date().toISOString().split('T')[0]

    for (const taskTemplate of plan.tasks) {
      for (let i = 0; i < taskTemplate.frequencyPerDay; i++) {
        const baseHour = 6 + Math.floor(i * (16 / taskTemplate.frequencyPerDay))
        const minute = (i * 15) % 60

        const task = {
          id: db.genId('t'),
          carePlanId: plan.id,
          customerId: plan.customerId,
          nurseId: plan.assignedNurseIds[i % plan.assignedNurseIds.length] || null,
          name: taskTemplate.name,
          category: taskTemplate.category,
          scheduledDate: targetDate,
          scheduledTime: `${String(baseHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          durationMinutes: taskTemplate.durationMinutes,
          status: 'pending' as const,
          priority: taskTemplate.priority,
          createdAt: new Date().toISOString(),
        }

        db.tasks.push(task)
      }
    }
  }

  public reassignOverdueTasks(): { reassigned: number; alerts: string[] } {
    const now = new Date()
    const overdueTasks = db.tasks.filter(t => {
      if (t.status !== 'pending' && t.status !== 'inProgress') return false
      const scheduled = new Date(`${t.scheduledDate}T${t.scheduledTime}:00`)
      const deadline = new Date(scheduled.getTime() + t.durationMinutes * 60000 + 1800000)
      return now > deadline
    })

    const alerts: string[] = []
    let reassigned = 0

    for (const task of overdueTasks) {
      const originalNurse = task.nurseId ? db.users.find(u => u.id === task.nurseId) : null
      const alternatives = this.findAvailableNurses(task.customerId, 1, task.scheduledDate)
        .filter(n => n.nurse.id !== task.nurseId)

      if (alternatives.length > 0 && alternatives[0].score >= 50) {
        const newNurse = alternatives[0].nurse
        db.tasks.push({
          ...task,
          id: db.genId('t'),
          nurseId: newNurse.id,
          status: 'reassigned',
          notes: `原护理师${originalNurse?.name || '未分配'}任务超时，已自动转派给${newNurse.name}`,
        })

        task.status = 'reassigned'
        reassigned++

        alerts.push(
          `任务「${task.name}」已从${originalNurse?.name || '未分配'}转派给${newNurse.name}`
        )
      } else {
        alerts.push(
          `警告：任务「${task.name}」超时但无可用护理师可转派，请护士长紧急处理`
        )
      }
    }

    return { reassigned, alerts }
  }
}

export const carePlanService = new CarePlanService()
