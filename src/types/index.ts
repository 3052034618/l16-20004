export type Gender = '男' | '女';

export type UserRole = '系统管理员' | '护士长' | '护理师' | '营养师' | '后勤工程师';

export type RoomStatus = '空闲' | '已入住' | '清洁中' | '维修中';

export type RoomType = '标准间' | '豪华间' | 'VIP套房' | '总统套房';

export type DeliveryMethod = '顺产' | '剖宫产' | '顺产侧切' | '产钳助产';

export type TaskStatus = '待执行' | '进行中' | '已完成' | '已超时' | '已取消' | '调整中';

export type TaskPriority = '高' | '中' | '低';

export type CarePlanStatus = '待审批' | '已通过' | '已驳回' | '已调整';

export type ShiftType = '早班' | '中班' | '晚班' | '休息';

export type MealPhase = '产后1-7天' | '产后8-14天' | '产后15-30天';

export type MealType = '早餐' | '午餐' | '晚餐' | '上午加餐' | '下午加餐' | '夜宵';

export type InventoryCategory = '蔬菜' | '肉类' | '水产' | '主食' | '水果' | '蛋奶' | '调味品' | '保健品';

export type InventoryStatus = '正常' | '预警' | '紧缺';

export type EquipmentStatus = '正常' | '使用中' | '待维护' | '维修中' | '已报废';

export type WorkOrderStatus = '待处理' | '处理中' | '已完成' | '已延期';

export interface BaseUser {
  id: string;
  name: string;
  gender: Gender;
  phone: string;
  idCard: string;
  role: UserRole;
  avatar?: string;
  createTime: string;
}

export interface Nurse extends BaseUser {
  role: '护理师';
  nurseLevel: '初级' | '中级' | '高级' | '主管护师';
  specialty: string[];
  yearsOfExperience: number;
  monthlyWorkHours: number;
  maxWorkHours: number;
  currentStatus: '在岗' | '休息' | '请假' | '培训';
}

export interface MotherHealthRecord {
  bloodPressure: string;
  bloodSugar: string;
  heartRate: number;
  temperature: number;
  woundRecovery: '良好' | '正常' | '需关注' | '异常';
  uterineContraction: '良好' | '正常' | '需关注';
  lochiaStatus: '正常' | '偏多' | '偏少' | '异常';
  moodStatus: '愉悦' | '稳定' | '焦虑' | '抑郁倾向';
  sleepQuality: '良好' | '一般' | '较差';
  recordTime: string;
}

export interface BabyHealthRecord {
  babyName: string;
  gender: Gender;
  birthDate: string;
  birthWeight: number;
  birthLength: number;
  currentWeight: number;
  currentLength: number;
  apgarScore: number;
  feedingMethod: '纯母乳' | '混合喂养' | '配方奶';
  feedingTimesPerDay: number;
  sleepHoursPerDay: number;
  temperature: number;
  heartRate: number;
  jaundiceIndex: number;
  stoolFrequency: number;
  vaccinationRecords: string[];
  recordTime: string;
}

export interface Customer {
  id: string;
  motherName: string;
  motherAge: number;
  phone: string;
  idCard: string;
  emergencyContact: string;
  emergencyPhone: string;
  roomId: string;
  roomNumber: string;
  deliveryMethod: DeliveryMethod;
  deliveryDate: string;
  babyCount: number;
  babies: BabyHealthRecord[];
  checkInDate: string;
  expectedCheckOutDate: string;
  actualCheckOutDate?: string;
  motherSameRoom: boolean;
  healthRecords: MotherHealthRecord[];
  dietaryRestrictions: string[];
  allergies: string[];
  carePlanId?: string;
  primaryNurseId?: string;
  satisfactionScore?: number;
  status: '待入住' | '在住' | '已退房';
  remark?: string;
  createTime: string;
}

export interface CareTaskTemplate {
  id: string;
  name: string;
  description: string;
  category: '母亲护理' | '新生儿护理' | '母婴同室' | '健康监测' | '心理疏导' | '其他';
  estimatedDuration: number;
  standardProcedure: string[];
  requiredSkills: string[];
}

export interface CareTask {
  id: string;
  customerId: string;
  customerName: string;
  roomNumber: string;
  carePlanId: string;
  templateId: string;
  taskName: string;
  description: string;
  category: '母亲护理' | '新生儿护理' | '母婴同室' | '健康监测' | '心理疏导' | '其他';
  assigneeId?: string;
  assigneeName?: string;
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  status: TaskStatus;
  priority: TaskPriority;
  duration: number;
  actualDuration?: number;
  executionNotes?: string;
  isOverdue: boolean;
  createTime: string;
  completeTime?: string;
  adjustReason?: string;
  adjustTime?: string;
  operatorName?: string;
}

export interface CarePlan {
  id: string;
  customerId: string;
  customerName: string;
  roomNumber: string;
  planName: string;
  version: number;
  deliveryMethod: DeliveryMethod;
  apgarScore: number;
  motherSameRoom: boolean;
  phase: MealPhase;
  tasks: CareTask[];
  mealPlanId?: string;
  assignedNurseIds: string[];
  status: CarePlanStatus;
  approvalHistory: ApprovalRecord[];
  createTime: string;
  updateTime: string;
  createdBy: string;
  approvedBy?: string;
  remark?: string;
}

export interface ApprovalRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  action: string;
  comment?: string;
  operateTime: string;
}

export interface ScheduleEntry {
  id: string;
  nurseId: string;
  nurseName: string;
  date: string;
  shiftType: ShiftType;
  startTime: string;
  endTime: string;
  assignedCustomers: string[];
  assignedRoomNumbers: string[];
  workHours: number;
  isHoliday: boolean;
  isOvertime: boolean;
  remark?: string;
  createTime: string;
  updateTime: string;
}

export interface MealRecipe {
  id: string;
  name: string;
  phase: MealPhase;
  mealType: MealType;
  ingredients: {
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
  }[];
  nutritionFacts: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    calcium: number;
    iron: number;
  };
  cookingMethod: string;
  suitableFor: string[];
  contraindications: string[];
}

export interface DailyMeal {
  date: string;
  meals: {
    mealType: MealType;
    recipeId: string;
    recipeName: string;
    isFavourite?: boolean;
    remark?: string;
  }[];
}

export interface MealPlan {
  id: string;
  customerId: string;
  customerName: string;
  phase: MealPhase;
  startDate: string;
  endDate: string;
  dailyMeals: DailyMeal[];
  dietaryRestrictions: string[];
  createdBy: string;
  createTime: string;
  updateTime: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: string;
  currentStock: number;
  safeStock: number;
  maxStock: number;
  status: InventoryStatus;
  unitPrice: number;
  supplier: string;
  lastRestockDate: string;
  nextRestockDate?: string;
  location: string;
  remark?: string;
  updateTime: string;
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  category: '母婴护理设备' | '监测设备' | '康复设备' | '环境设备' | '办公设备';
  purchaseDate: string;
  purchasePrice: number;
  usageCount: number;
  maxUsageCount: number;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  status: EquipmentStatus;
  location: string;
  warrantyExpireDate: string;
  maintenanceHistoryCount: number;
  remark?: string;
  updateTime: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string;
  equipmentModel: string;
  orderType: '定期维护' | '故障维修' | '保养';
  priority: TaskPriority;
  status: WorkOrderStatus;
  description: string;
  assigneeId?: string;
  assigneeName?: string;
  createTime: string;
  startTime?: string;
  completeTime?: string;
  estimatedDuration: number;
  actualDuration?: number;
  sparePartsUsed: {
    partId: string;
    partName: string;
    quantity: number;
    unitPrice: number;
  }[];
  totalCost?: number;
  failureReason?: string;
  solution?: string;
  remark?: string;
}

export interface SparePart {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  safeStock: number;
  maxStock: number;
  status: '正常' | '预警' | '紧缺';
  unitPrice: number;
  supplier: string;
  lastRestockDate: string;
  location: string;
  compatibleModels: string[];
}

export interface Room {
  id: string;
  floor: number;
  roomNumber: string;
  roomType: RoomType;
  area: number;
  pricePerDay: number;
  status: RoomStatus;
  hasWindow: boolean;
  hasBathroom: boolean;
  facilities: string[];
  customerId?: string;
  customerName?: string;
  checkInDate?: string;
  expectedCheckOutDate?: string;
  lastCleanDate: string;
  nextMaintenanceDate?: string;
  remark?: string;
  updateTime: string;
}

export interface KPIData {
  label: string;
  value: number;
  unit?: string;
  trend: 'up' | 'down' | 'flat';
  trendValue?: number;
  icon: string;
  color: string;
}

export interface AlertNotification {
  id: string;
  type: '超时任务' | '低库存' | '待审批' | '设备异常' | '健康预警';
  title: string;
  content: string;
  level: 'info' | 'warning' | 'danger';
  relatedId?: string;
  read: boolean;
  createTime: string;
}

export interface HeatMapPoint {
  id: string;
  x: number;
  y: number;
  intensity: number;
  nurseId: string;
  nurseName: string;
}

export interface StatisticsData {
  period: string;
  checkInCount: number;
  checkOutCount: number;
  occupancyRate: number;
  satisfactionAverage: number;
  taskCompletionRate: number;
}
