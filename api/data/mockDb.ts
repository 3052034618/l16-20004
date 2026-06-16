export type UserRole = 'admin' | 'headNurse' | 'nurse' | 'nutritionist' | 'engineer'

export interface User {
  id: string
  name: string
  role: UserRole
  phone: string
  avatar?: string
  status: 'active' | 'onLeave' | 'offline'
}

export type DeliveryType = 'natural' | 'cesarean' | 'forceps' | 'vacuum'

export type RoomType = 'standard' | 'deluxe' | 'suite' | 'vip'

export type RoomStatus = 'empty' | 'occupied' | 'cleaning' | 'maintenance'

export interface Room {
  id: string
  roomNumber: string
  floor: number
  type: RoomType
  status: RoomStatus
  price: number
  bedCount: number
}

export interface Customer {
  id: string
  name: string
  age: number
  phone: string
  idCard: string
  roomId: string | null
  checkInDate: string
  expectedCheckOutDate: string
  actualCheckOutDate?: string
  deliveryType: DeliveryType
  babyGender: 'boy' | 'girl'
  babyWeight: number
  apgarScore: number
  motherBabyRoom: boolean
  status: 'inHouse' | 'checkedOut' | 'reserved'
  healthMetrics: {
    bloodPressure: string
    bloodSugar: number
    woundRecovery: 'good' | 'normal' | 'poor'
    babyWeightTrend: number[]
    vaccines: string[]
  }
  dietaryRestrictions: string[]
  satisfaction?: number
}

export type CarePlanStatus = 'pending' | 'approved' | 'rejected' | 'adjusting' | 'executing'

export interface CarePlanTemplate {
  id: string
  name: string
  description: string
  forDeliveryType: DeliveryType | 'all'
  minApgar: number
  maxApgar: number
  motherBabyRoomRequired?: boolean
  tasks: CareTaskTemplate[]
  estimatedWorkHours: number
}

export interface CareTaskTemplate {
  id: string
  name: string
  category: 'mother' | 'baby' | 'both'
  frequencyPerDay: number
  durationMinutes: number
  priority: 1 | 2 | 3 | 4 | 5
}

export interface CarePlan {
  id: string
  customerId: string
  templateId: string | null
  planName: string
  status: CarePlanStatus
  tasks: CareTaskTemplate[]
  assignedNurseIds: string[]
  totalWorkHours: number
  createdAt: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  version: number
}

export type TaskStatus = 'pending' | 'inProgress' | 'completed' | 'overdue' | 'reassigned'

export interface Task {
  id: string
  carePlanId: string
  customerId: string
  nurseId: string | null
  name: string
  category: 'mother' | 'baby' | 'both'
  scheduledDate: string
  scheduledTime: string
  durationMinutes: number
  status: TaskStatus
  priority: 1 | 2 | 3 | 4 | 5
  notes?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export type ShiftType = 'morning' | 'afternoon' | 'night' | 'dayOff'

export interface Schedule {
  id: string
  nurseId: string
  date: string
  shift: ShiftType
  startHour: number
  endHour: number
  workHours: number
  customerIds: string[]
}

export type MealStage = 'stage1' | 'stage2' | 'stage3'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2' | 'snack3'

export interface MealRecipe {
  id: string
  name: string
  stage: MealStage
  type: MealType
  calories: number
  ingredients: {
    inventoryItemId: string
    quantity: number
    unit: string
  }[]
  tags: string[]
}

export interface MealPlan {
  id: string
  customerId: string
  date: string
  meals: {
    type: MealType
    recipeId: string
    served: boolean
  }[]
  stage: MealStage
}

export interface InventoryItem {
  id: string
  name: string
  category: 'vegetable' | 'meat' | 'seafood' | 'grain' | 'dairy' | 'fruit' | 'seasoning' | 'medical' | 'baby' | 'other'
  currentStock: number
  safeStock: number
  unit: string
  unitPrice: number
  lastRestocked: string
  expiryDate?: string
  supplier: string
}

export type EquipmentStatus = 'normal' | 'warning' | 'maintenance' | 'broken'

export interface Equipment {
  id: string
  name: string
  brand: string
  model: string
  serialNumber: string
  purchaseDate: string
  status: EquipmentStatus
  usageCount: number
  maxUsageBeforeMaintenance: number
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  location: string
  spareParts: {
    name: string
    inventoryItemId: string
    requiredQuantity: number
  }[]
}

export type WorkOrderStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled'

export interface MaintenanceWorkOrder {
  id: string
  equipmentId: string
  engineerId: string | null
  status: WorkOrderStatus
  priority: 'low' | 'medium' | 'high' | 'critical'
  description: string
  createdAt: string
  startedAt?: string
  completedAt?: string
  resolution?: string
  partsUsed: {
    inventoryItemId: string
    quantity: number
  }[]
}

export interface Alert {
  id: string
  type: 'task' | 'inventory' | 'carePlan' | 'equipment' | 'customer'
  level: 'info' | 'warning' | 'danger'
  title: string
  description: string
  targetId: string
  createdAt: string
  read: boolean
  handled: boolean
}

class MockDatabase {
  users: User[] = []
  rooms: Room[] = []
  customers: Customer[] = []
  carePlanTemplates: CarePlanTemplate[] = []
  carePlans: CarePlan[] = []
  tasks: Task[] = []
  schedules: Schedule[] = []
  mealRecipes: MealRecipe[] = []
  mealPlans: MealPlan[] = []
  inventory: InventoryItem[] = []
  equipment: Equipment[] = []
  workOrders: MaintenanceWorkOrder[] = []
  alerts: Alert[] = []

  private idCounter = 0

  genId(prefix: string): string {
    this.idCounter++
    return `${prefix}_${Date.now()}_${this.idCounter}`
  }

  constructor() {
    this.seed()
  }

  private seed() {
    this.seedUsers()
    this.seedRooms()
    this.seedCustomers()
    this.seedCarePlanTemplates()
    this.seedCarePlans()
    this.seedTasks()
    this.seedSchedules()
    this.seedMealRecipes()
    this.seedMealPlans()
    this.seedInventory()
    this.seedEquipment()
    this.seedWorkOrders()
    this.seedAlerts()
  }

  private seedUsers() {
    const names = ['张伟', '李芳', '王静', '刘洋', '陈敏', '赵娜', '孙丽', '周雪', '吴娟', '郑婷', '冯磊', '蒋工']
    const roles: UserRole[] = ['admin', 'headNurse', 'nurse', 'nurse', 'nurse', 'nurse', 'nurse', 'nutritionist', 'nutritionist', 'engineer', 'engineer', 'engineer']
    const statuses: User['status'][] = ['active', 'active', 'active', 'active', 'onLeave', 'active', 'active', 'active', 'offline', 'active', 'active', 'active']

    for (let i = 0; i < names.length; i++) {
      this.users.push({
        id: this.genId('u'),
        name: names[i],
        role: roles[i],
        phone: `138${String(10000000 + i).padStart(8, '0')}`,
        status: statuses[i],
      })
    }
  }

  private seedRooms() {
    const floors = [3, 4, 5]
    const types: RoomType[] = ['standard', 'deluxe', 'suite', 'vip']
    const prices: Record<RoomType, number> = { standard: 880, deluxe: 1680, suite: 2880, vip: 4880 }

    let roomIndex = 1
    for (const floor of floors) {
      for (let i = 1; i <= 8; i++) {
        const type = types[(roomIndex - 1) % types.length]
        const statuses: RoomStatus[] = ['occupied', 'occupied', 'occupied', 'empty', 'cleaning', 'occupied', 'empty', 'maintenance']
        this.rooms.push({
          id: this.genId('r'),
          roomNumber: `${floor}${String(i).padStart(2, '0')}`,
          floor,
          type,
          status: statuses[i - 1],
          price: prices[type],
          bedCount: type === 'vip' ? 2 : 1,
        })
        roomIndex++
      }
    }
  }

  private seedCustomers() {
    const occupiedRooms = this.rooms.filter(r => r.status === 'occupied')
    const firstNames = ['李', '王', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙']
    const lastNames = ['雨萱', '思琪', '欣怡', '梓涵', '诗涵', '雅婷', '梦琪', '嘉怡', '紫涵', '若曦', '梦瑶', '语嫣']
    const deliveryTypes: DeliveryType[] = ['natural', 'cesarean', 'natural', 'cesarean', 'forceps', 'natural', 'vacuum', 'cesarean', 'natural', 'natural', 'cesarean', 'natural']

    for (let i = 0; i < 12; i++) {
      const checkIn = new Date()
      checkIn.setDate(checkIn.getDate() - Math.floor(Math.random() * 25) - 2)
      const checkOut = new Date(checkIn)
      checkOut.setDate(checkOut.getDate() + 30)

      const apgar = 7 + Math.floor(Math.random() * 4)
      const weightTrend = [2800 + i * 50, 2900 + i * 45, 3050 + i * 40, 3180 + i * 35, 3300 + i * 30].slice(0, 3 + Math.floor(Math.random() * 3))

      this.customers.push({
        id: this.genId('c'),
        name: firstNames[i] + lastNames[i],
        age: 25 + Math.floor(Math.random() * 10),
        phone: `139${String(10000000 + i * 137).slice(0, 8)}`,
        idCard: `110101199${5 + (i % 5)}${String(1010 + i * 12).padStart(4, '0')}${String(1000 + i * 37).slice(0, 4)}`,
        roomId: i < occupiedRooms.length ? occupiedRooms[i].id : null,
        checkInDate: checkIn.toISOString().split('T')[0],
        expectedCheckOutDate: checkOut.toISOString().split('T')[0],
        deliveryType: deliveryTypes[i],
        babyGender: i % 2 === 0 ? 'boy' : 'girl',
        babyWeight: 2600 + Math.floor(Math.random() * 1500),
        apgarScore: apgar,
        motherBabyRoom: i % 3 !== 0,
        status: i < 10 ? 'inHouse' : 'reserved',
        healthMetrics: {
          bloodPressure: `${110 + i * 2}/${70 + i}`,
          bloodSugar: 4.8 + (i % 5) * 0.3,
          woundRecovery: (['good', 'normal', 'good', 'good', 'normal'] as const)[i % 5],
          babyWeightTrend: weightTrend,
          vaccines: ['乙肝第一针', '卡介苗'].slice(0, 1 + (i % 2)),
        },
        dietaryRestrictions: i % 4 === 0 ? ['海鲜', '花生'] : i % 4 === 1 ? ['辣'] : [],
        satisfaction: i < 8 ? 4 + Math.floor(Math.random() * 2) : undefined,
      })
    }
  }

  private seedCarePlanTemplates() {
    const motherTasks = [
      { name: '生命体征监测', frequency: 2, duration: 15, category: 'mother' as const },
      { name: '会阴护理', frequency: 2, duration: 20, category: 'mother' as const },
      { name: '乳房护理/催乳', frequency: 3, duration: 30, category: 'mother' as const },
      { name: '伤口观察', frequency: 1, duration: 15, category: 'mother' as const },
      { name: '心理疏导', frequency: 1, duration: 30, category: 'mother' as const },
      { name: '产后康复操指导', frequency: 2, duration: 25, category: 'mother' as const },
    ]
    const babyTasks = [
      { name: '新生儿抚触', frequency: 1, duration: 20, category: 'baby' as const },
      { name: '脐带护理', frequency: 2, duration: 10, category: 'baby' as const },
      { name: '体温监测', frequency: 3, duration: 5, category: 'baby' as const },
      { name: '喂养指导', frequency: 6, duration: 15, category: 'baby' as const },
      { name: '尿布更换指导', frequency: 6, duration: 10, category: 'baby' as const },
      { name: '黄疸观察', frequency: 2, duration: 10, category: 'baby' as const },
      { name: '游泳SPA', frequency: 1, duration: 30, category: 'baby' as const },
    ]
    const bothTasks = [
      { name: '母婴同室评估', frequency: 1, duration: 20, category: 'both' as const },
      { name: '亲子互动指导', frequency: 1, duration: 25, category: 'both' as const },
    ]

    const templates = [
      { name: '顺产标准方案', for: 'natural' as DeliveryType | 'all', apgarMin: 8, apgarMax: 10, includeMBR: true },
      { name: '顺产加强方案', for: 'natural' as DeliveryType | 'all', apgarMin: 6, apgarMax: 7, includeMBR: false },
      { name: '剖腹产标准方案', for: 'cesarean' as DeliveryType | 'all', apgarMin: 8, apgarMax: 10, includeMBR: false },
      { name: '剖腹产加强方案', for: 'cesarean' as DeliveryType | 'all', apgarMin: 6, apgarMax: 7, includeMBR: false },
      { name: '特殊分娩方案', for: 'all' as DeliveryType | 'all', apgarMin: 0, apgarMax: 9, includeMBR: false },
    ]

    for (const t of templates) {
      const tasks: CareTaskTemplate[] = []
      let taskIdx = 1

      for (const mt of motherTasks) {
        tasks.push({
          id: this.genId('tt'),
          name: mt.name,
          category: mt.category,
          frequencyPerDay: mt.frequency,
          durationMinutes: mt.duration,
          priority: (t.apgarMin >= 8 ? (3 - Math.floor(taskIdx / 3)) : 4) as 1 | 2 | 3 | 4 | 5,
        })
        taskIdx++
      }
      for (const bt of babyTasks) {
        tasks.push({
          id: this.genId('tt'),
          name: bt.name,
          category: bt.category,
          frequencyPerDay: bt.frequency,
          durationMinutes: bt.duration,
          priority: (t.apgarMin >= 8 ? (4 - Math.floor(taskIdx / 4)) : 5) as 1 | 2 | 3 | 4 | 5,
        })
        taskIdx++
      }
      if (t.includeMBR) {
        for (const bot of bothTasks) {
          tasks.push({
            id: this.genId('tt'),
            name: bot.name,
            category: bot.category,
            frequencyPerDay: bot.frequency,
            durationMinutes: bot.duration,
            priority: 2,
          })
        }
      }

      const totalHours = tasks.reduce((sum, task) => sum + (task.frequencyPerDay * task.durationMinutes * 30) / 60, 0)

      this.carePlanTemplates.push({
        id: this.genId('cpt'),
        name: t.name,
        description: `针对${t.for === 'all' ? '各类' : t.for === 'natural' ? '顺产' : '剖腹产'}${t.apgarMin >= 8 ? '健康' : '需加强'}新生儿的专业护理方案`,
        forDeliveryType: t.for,
        minApgar: t.apgarMin,
        maxApgar: t.apgarMax,
        motherBabyRoomRequired: t.includeMBR,
        tasks,
        estimatedWorkHours: Math.round(totalHours * 10) / 10,
      })
    }
  }

  private seedCarePlans() {
    const inHouseCustomers = this.customers.filter(c => c.status === 'inHouse')
    const nurses = this.users.filter(u => u.role === 'nurse')
    const statuses: CarePlanStatus[] = ['approved', 'executing', 'approved', 'executing', 'pending', 'approved', 'executing', 'rejected', 'adjusting', 'approved']

    for (let i = 0; i < inHouseCustomers.length; i++) {
      const customer = inHouseCustomers[i]
      const matchingTemplates = this.carePlanTemplates.filter(
        t => (t.forDeliveryType === 'all' || t.forDeliveryType === customer.deliveryType)
          && customer.apgarScore >= t.minApgar
          && customer.apgarScore <= t.maxApgar
      )
      const template = matchingTemplates[0] || this.carePlanTemplates[0]

      const assignedNurseCount = customer.motherBabyRoom ? 2 : 1
      const assignedNurses = nurses.slice(i, i + assignedNurseCount).map(n => n.id)

      this.carePlans.push({
        id: this.genId('cp'),
        customerId: customer.id,
        templateId: template.id,
        planName: template.name,
        status: statuses[i % statuses.length],
        tasks: [...template.tasks],
        assignedNurseIds: assignedNurses.length > 0 ? assignedNurses : [nurses[0].id],
        totalWorkHours: template.estimatedWorkHours,
        createdAt: customer.checkInDate,
        approvedBy: i !== 4 && i !== 7 && i !== 8 ? this.users.find(u => u.role === 'headNurse')!.id : undefined,
        approvedAt: i !== 4 && i !== 7 && i !== 8 ? customer.checkInDate : undefined,
        rejectionReason: i === 7 ? '工时分配过重，需要调整任务频率' : undefined,
        version: 1,
      })
    }
  }

  private seedTasks() {
    const inHouseCustomers = this.customers.filter(c => c.status === 'inHouse')
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    for (const customer of inHouseCustomers) {
      const plan = this.carePlans.find(p => p.customerId === customer.id)
      if (!plan || !plan.assignedNurseIds.length) continue

      for (const taskTemplate of plan.tasks.slice(0, 5)) {
        for (let f = 0; f < Math.min(taskTemplate.frequencyPerDay, 2); f++) {
          const isYesterday = Math.random() < 0.3
          const date = isYesterday ? yesterday : today
          const hour = 6 + f * 4 + Math.floor(Math.random() * 3)
          const minute = Math.floor(Math.random() * 4) * 15

          const now = new Date()
          const scheduledDate = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`)

          let status: TaskStatus = 'pending'
          if (isYesterday) {
            status = f === 0 ? 'completed' : (Math.random() < 0.3 ? 'overdue' : 'completed')
          } else if (scheduledDate < now && Math.random() < 0.5) {
            status = 'inProgress'
          } else if (scheduledDate < now && Math.random() < 0.2) {
            status = 'overdue'
          }

          this.tasks.push({
            id: this.genId('t'),
            carePlanId: plan.id,
            customerId: customer.id,
            nurseId: plan.assignedNurseIds[f % plan.assignedNurseIds.length],
            name: taskTemplate.name,
            category: taskTemplate.category,
            scheduledDate: date,
            scheduledTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
            durationMinutes: taskTemplate.durationMinutes,
            status,
            priority: taskTemplate.priority,
            createdAt: date,
            startedAt: (status === 'inProgress' || status === 'completed') ? scheduledDate.toISOString() : undefined,
            completedAt: status === 'completed' ? new Date(scheduledDate.getTime() + taskTemplate.durationMinutes * 60000).toISOString() : undefined,
          })
        }
      }
    }
  }

  private seedSchedules() {
    const nurses = this.users.filter(u => u.role === 'nurse')
    const shifts: ShiftType[] = ['morning', 'afternoon', 'night', 'dayOff']
    const shiftHours: Record<ShiftType, { start: number; end: number; hours: number }> = {
      morning: { start: 6, end: 14, hours: 8 },
      afternoon: { start: 14, end: 22, hours: 8 },
      night: { start: 22, end: 30, hours: 8 },
      dayOff: { start: 0, end: 0, hours: 0 },
    }

    for (let d = 0; d < 7; d++) {
      const date = new Date()
      date.setDate(date.getDate() + d - 2)
      const dateStr = date.toISOString().split('T')[0]

      for (let i = 0; i < nurses.length; i++) {
        const shift = shifts[(i + d) % shifts.length]
        const hours = shiftHours[shift]

        const inHouseCustomers = this.customers.filter(c => c.status === 'inHouse')
        const assignedCustomers = shift !== 'dayOff'
          ? inHouseCustomers.slice((i * 2 + d) % inHouseCustomers.length, (i * 2 + d) % inHouseCustomers.length + 2).map(c => c.id)
          : []

        this.schedules.push({
          id: this.genId('s'),
          nurseId: nurses[i].id,
          date: dateStr,
          shift,
          startHour: hours.start,
          endHour: hours.end,
          workHours: hours.hours,
          customerIds: assignedCustomers,
        })
      }
    }
  }

  private seedMealRecipes() {
    const stages: MealStage[] = ['stage1', 'stage2', 'stage3']
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']

    const recipeNames: Record<MealType, string[]> = {
      breakfast: ['小米红枣粥配蒸蛋', '南瓜小米粥配包子', '山药瘦肉粥配花卷', '银耳莲子粥配小笼包'],
      lunch: ['清蒸鲈鱼配时蔬', '红枣炖鸡配米饭', '猪蹄花生汤配杂粮饭', '乌鸡枸杞汤配糙米饭'],
      dinner: ['鲫鱼豆腐汤配软饭', '排骨汤配小米饭', '虾仁蒸蛋配蔬菜粥', '瘦肉蔬菜面片汤'],
      snack1: ['银耳莲子羹', '红豆薏米粉', '红枣桂圆茶', '黑芝麻糊'],
      snack2: ['蒸苹果', '香蕉奶昔', '木瓜炖雪蛤', '酸奶水果杯'],
      snack3: ['鸡丝面', '小馄饨', '肉末蒸蛋', '蔬菜鸡蛋饼'],
    }

    for (const stage of stages) {
      for (const type of mealTypes) {
        const names = recipeNames[type]
        for (let i = 0; i < 2; i++) {
          const calories = stage === 'stage1' ? 300 + i * 50 : stage === 'stage2' ? 400 + i * 60 : 500 + i * 80
          const mockIngredients = [
            { name: '大米', qty: 50 + i * 10, unit: 'g' },
            { name: '鸡胸肉', qty: 30 + i * 5, unit: 'g' },
            { name: '青菜', qty: 40 + i * 8, unit: 'g' },
          ]

          this.mealRecipes.push({
            id: this.genId('mr'),
            name: names[i % names.length],
            stage,
            type,
            calories,
            ingredients: mockIngredients.map(ing => {
              const item = this.inventory.find(inv => inv.name === ing.name) || { id: this.genId('inv') }
              return {
                inventoryItemId: item.id,
                quantity: ing.qty,
                unit: ing.unit,
              }
            }),
            tags: [stage, type, i % 2 === 0 ? '滋补' : '清淡'],
          })
        }
      }
    }
  }

  private seedMealPlans() {
    const inHouseCustomers = this.customers.filter(c => c.status === 'inHouse')
    const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']

    for (const customer of inHouseCustomers) {
      const checkIn = new Date(customer.checkInDate)
      const today = new Date()
      const daysSince = Math.min(Math.floor((today.getTime() - checkIn.getTime()) / 86400000), 30)
      const stage: MealStage = daysSince <= 7 ? 'stage1' : daysSince <= 14 ? 'stage2' : 'stage3'

      for (let d = 0; d < 3; d++) {
        const date = new Date()
        date.setDate(date.getDate() + d - 1)
        const dateStr = date.toISOString().split('T')[0]

        const meals = mealTypes.map(type => {
          const recipes = this.mealRecipes.filter(r => r.stage === stage && r.type === type)
          const recipe = recipes[Math.floor(Math.random() * recipes.length)]
          return {
            type,
            recipeId: recipe ? recipe.id : this.mealRecipes[0].id,
            served: d < 1,
          }
        })

        this.mealPlans.push({
          id: this.genId('mp'),
          customerId: customer.id,
          date: dateStr,
          meals,
          stage,
        })
      }
    }
  }

  private seedInventory() {
    const items = [
      { name: '大米', category: 'grain' as const, stock: 200, safe: 50, unit: 'kg', price: 6.5 },
      { name: '小米', category: 'grain' as const, stock: 80, safe: 30, unit: 'kg', price: 12.0 },
      { name: '鸡胸肉', category: 'meat' as const, stock: 40, safe: 20, unit: 'kg', price: 28.0 },
      { name: '猪蹄', category: 'meat' as const, stock: 25, safe: 15, unit: 'kg', price: 45.0 },
      { name: '鲈鱼', category: 'seafood' as const, stock: 15, safe: 10, unit: 'kg', price: 58.0 },
      { name: '鲫鱼', category: 'seafood' as const, stock: 8, safe: 10, unit: 'kg', price: 32.0 },
      { name: '青菜', category: 'vegetable' as const, stock: 30, safe: 15, unit: 'kg', price: 8.0 },
      { name: '菠菜', category: 'vegetable' as const, stock: 5, safe: 10, unit: 'kg', price: 10.0 },
      { name: '鸡蛋', category: 'dairy' as const, stock: 200, safe: 100, unit: '个', price: 2.0 },
      { name: '牛奶', category: 'dairy' as const, stock: 48, safe: 30, unit: 'L', price: 15.0 },
      { name: '苹果', category: 'fruit' as const, stock: 35, safe: 20, unit: 'kg', price: 12.0 },
      { name: '红枣', category: 'seasoning' as const, stock: 18, safe: 10, unit: 'kg', price: 45.0 },
      { name: '枸杞', category: 'seasoning' as const, stock: 6, safe: 5, unit: 'kg', price: 80.0 },
      { name: '医用纱布', category: 'medical' as const, stock: 80, safe: 30, unit: '包', price: 15.0 },
      { name: '消毒液', category: 'medical' as const, stock: 12, safe: 20, unit: '瓶', price: 25.0 },
      { name: '婴儿尿不湿', category: 'baby' as const, stock: 15, safe: 50, unit: '包', price: 68.0 },
      { name: '婴儿湿巾', category: 'baby' as const, stock: 25, safe: 40, unit: '包', price: 18.0 },
    ]

    const today = new Date()
    for (const item of items) {
      const lastRestock = new Date(today)
      lastRestock.setDate(lastRestock.getDate() - Math.floor(Math.random() * 7) - 1)
      const expiry = new Date(today)
      expiry.setMonth(expiry.getMonth() + 3)

      this.inventory.push({
        id: this.genId('inv'),
        name: item.name,
        category: item.category,
        currentStock: item.stock,
        safeStock: item.safe,
        unit: item.unit,
        unitPrice: item.price,
        lastRestocked: lastRestock.toISOString().split('T')[0],
        expiryDate: ['meat', 'seafood', 'vegetable', 'dairy', 'fruit'].includes(item.category) ? expiry.toISOString().split('T')[0] : undefined,
        supplier: item.category === 'medical' || item.category === 'baby' ? '专业供应商' : '本地农贸配送中心',
      })
    }
  }

  private seedEquipment() {
    const eqList = [
      { name: '母婴监护仪', brand: '飞利浦', model: 'MX450', floor: 3 },
      { name: '母婴监护仪', brand: '飞利浦', model: 'MX450', floor: 4 },
      { name: '母婴监护仪', brand: '飞利浦', model: 'MX450', floor: 5 },
      { name: '婴儿保育箱', brand: '戴维', model: 'YP-100', floor: 3 },
      { name: '婴儿保育箱', brand: '戴维', model: 'YP-100', floor: 4 },
      { name: '黄疸治疗仪', brand: '诺仪', model: 'GL-500', floor: 3 },
      { name: '红外线测温仪', brand: '鱼跃', model: 'YHW-2', floor: 3 },
      { name: '红外线测温仪', brand: '鱼跃', model: 'YHW-2', floor: 4 },
      { name: '红外线测温仪', brand: '鱼跃', model: 'YHW-2', floor: 5 },
      { name: '电动吸奶器', brand: '美德乐', model: '丝韵·翼', floor: 3 },
      { name: '电动吸奶器', brand: '美德乐', model: '丝韵·翼', floor: 4 },
      { name: '紫外线消毒灯', brand: '飞利浦', model: 'TUV36W', floor: 3 },
    ]

    const today = new Date()
    for (let i = 0; i < eqList.length; i++) {
      const eq = eqList[i]
      const purchaseDate = new Date(today)
      purchaseDate.setMonth(purchaseDate.getMonth() - (6 + i))
      const lastMaint = new Date(today)
      lastMaint.setDate(lastMaint.getDate() - (15 + i * 3))
      const nextMaint = new Date(today)
      nextMaint.setDate(nextMaint.getDate() + (15 + i * 2))

      const usageCount = 100 + i * 45
      const maxUsage = 500
      const status: EquipmentStatus = usageCount >= maxUsage * 0.9 ? 'warning' : i % 7 === 0 ? 'maintenance' : 'normal'

      this.equipment.push({
        id: this.genId('eq'),
        name: eq.name,
        brand: eq.brand,
        model: eq.model,
        serialNumber: `SN${eq.brand.substring(0, 2).toUpperCase()}${Date.now()}${i}`,
        purchaseDate: purchaseDate.toISOString().split('T')[0],
        status,
        usageCount,
        maxUsageBeforeMaintenance: maxUsage,
        lastMaintenanceDate: lastMaint.toISOString().split('T')[0],
        nextMaintenanceDate: nextMaint.toISOString().split('T')[0],
        location: `${eq.floor}楼${i % 2 === 0 ? '护士站' : '储物间'}`,
        spareParts: i % 3 === 0 ? [
          { name: '医用纱布', inventoryItemId: this.inventory.find(x => x.name === '医用纱布')?.id || '', requiredQuantity: 5 },
        ] : [],
      })
    }
  }

  private seedWorkOrders() {
    const engineers = this.users.filter(u => u.role === 'engineer')
    const maintEquip = this.equipment.filter(e => e.status === 'warning' || e.status === 'maintenance')

    for (let i = 0; i < 6; i++) {
      const eq = maintEquip[i % maintEquip.length] || this.equipment[0]
      const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'medium', 'critical', 'high']
      const statuses: WorkOrderStatus[] = ['pending', 'inProgress', 'completed', 'pending', 'inProgress', 'completed']

      const created = new Date()
      created.setDate(created.getDate() - (2 + i))
      const started = statuses[i] !== 'pending' ? new Date(created.getTime() + 3600000) : undefined
      const completed = statuses[i] === 'completed' ? new Date((started?.getTime() || created.getTime()) + 7200000) : undefined

      this.workOrders.push({
        id: this.genId('wo'),
        equipmentId: eq.id,
        engineerId: statuses[i] !== 'pending' ? engineers[i % engineers.length].id : null,
        status: statuses[i],
        priority: priorities[i],
        description: i % 2 === 0 ? `${eq.name}使用次数超限，需进行定期维护保养` : `${eq.name}报告异常状态，需要检查维修`,
        createdAt: created.toISOString(),
        startedAt: started?.toISOString(),
        completedAt: completed?.toISOString(),
        resolution: statuses[i] === 'completed' ? '已完成保养，更换了滤芯和密封圈，设备测试正常' : undefined,
        partsUsed: statuses[i] === 'completed' && eq.spareParts.length > 0 ? eq.spareParts.map(sp => ({
          inventoryItemId: sp.inventoryItemId,
          quantity: sp.requiredQuantity,
        })) : [],
      })
    }
  }

  private seedAlerts() {
    const overdueTasks = this.tasks.filter(t => t.status === 'overdue')
    const lowStock = this.inventory.filter(i => i.currentStock < i.safeStock)
    const pendingPlans = this.carePlans.filter(p => p.status === 'pending')
    const warningEq = this.equipment.filter(e => e.status === 'warning')

    for (const task of overdueTasks.slice(0, 2)) {
      const customer = this.customers.find(c => c.id === task.customerId)
      this.alerts.push({
        id: this.genId('a'),
        type: 'task',
        level: 'danger',
        title: '任务超时预警',
        description: `${customer?.name || '客户'}的「${task.name}」任务已超时未完成`,
        targetId: task.id,
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        read: false,
        handled: false,
      })
    }

    for (const item of lowStock.slice(0, 3)) {
      this.alerts.push({
        id: this.genId('a'),
        type: 'inventory',
        level: item.currentStock < item.safeStock * 0.5 ? 'danger' : 'warning',
        title: '库存不足预警',
        description: `${item.name}当前库存${item.currentStock}${item.unit}，低于安全库存${item.safeStock}${item.unit}`,
        targetId: item.id,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        handled: false,
      })
    }

    for (const plan of pendingPlans.slice(0, 2)) {
      const customer = this.customers.find(c => c.id === plan.customerId)
      this.alerts.push({
        id: this.genId('a'),
        type: 'carePlan',
        level: 'warning',
        title: '待审批护理方案',
        description: `${customer?.name || '客户'}的「${plan.planName}」待审批`,
        targetId: plan.id,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        handled: false,
      })
    }

    for (const eq of warningEq.slice(0, 2)) {
      this.alerts.push({
        id: this.genId('a'),
        type: 'equipment',
        level: 'warning',
        title: '设备维护提醒',
        description: `${eq.name}(${eq.location})使用次数接近上限，请安排维护`,
        targetId: eq.id,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        read: false,
        handled: false,
      })
    }
  }
}

export const db = new MockDatabase()
