import type {
  Customer,
  Nurse,
  Room,
  CareTask,
  ScheduleEntry,
  MealPlan,
  MealRecipe,
  InventoryItem,
  Equipment,
  MaintenanceWorkOrder,
  CarePlan,
  KPIData,
  AlertNotification,
  StatisticsData,
  SparePart,
} from '../types';

const chineseSurnames = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
];

const givenNamesFemale = [
  '芳', '娜', '敏', '静', '丽', '秀英', '霞', '桂英', '玉兰', '淑芬',
  '雅琴', '雪梅', '美丽', '雨萱', '梓涵', '思远', '梦瑶', '欣怡', '佳怡', '悦欣',
];

const babyGirlNames = [
  '一诺', '可欣', '雨桐', '梓琪', '诗涵', '思琪', '梦瑶', '语桐', '悦欣', '若曦',
  '紫涵', '佳怡', '欣怡', '雨薇', '子涵', '欣然', '诗琪', '怡然', '可馨', '婉清',
];

const babyBoyNames = [
  '子豪', '俊杰', '皓轩', '宇轩', '浩然', '睿轩', '梓睿', '博文', '天佑', '铭洋',
  '子轩', '俊豪', '奕辰', '嘉豪', '泽宇', '星辰', '思源', '启睿', '承宇', '柏轩',
];

const nursingSpecialties = [
  '母婴护理', '新生儿护理', '产后康复', '母乳喂养指导', '心理疏导',
  '伤口护理', '营养咨询', '早产儿护理', '新生儿抚触', '早教指导',
];

const facilities = [
  '独立卫浴', '中央空调', '新风系统', '空气净化器', '加湿器',
  '婴儿恒温床', '电动护理床', '哺乳沙发', '智能马桶', '按摩浴缸',
  '投影仪', '电视', 'WIFI', '迷你冰箱', '微波炉',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomMultiple<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generatePhone(): string {
  const prefixes = ['138', '139', '158', '159', '188', '189', '136', '137', '150', '151'];
  return pickRandom(prefixes) + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
}

function generateIdCard(): string {
  const areaCode = ['110101', '310101', '440101', '330102', '320102', '510104'];
  const year = 1985 + Math.floor(Math.random() * 15);
  const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
  const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
  return pickRandom(areaCode) + year + month + day + Math.floor(Math.random() * 9000 + 1000).toString();
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:00`;
}

function generateName(gender: '男' | '女'): string {
  const surname = pickRandom(chineseSurnames);
  return surname + pickRandom(gender === '女' ? givenNamesFemale : ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '浩然', '子轩', '俊熙']);
}

function generateBabyName(gender: '男' | '女'): string {
  return pickRandom(gender === '女' ? babyGirlNames : babyBoyNames);
}

export const nurses: Nurse[] = [
  { id: 'N001', name: '王雅琴', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '主管护师', specialty: ['母婴护理', '母乳喂养指导', '产后康复'], yearsOfExperience: 15, monthlyWorkHours: 168, maxWorkHours: 184, currentStatus: '在岗', createTime: '2020-03-15 09:00:00' },
  { id: 'N002', name: '李秀英', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '高级', specialty: ['新生儿护理', '伤口护理', '心理疏导'], yearsOfExperience: 12, monthlyWorkHours: 172, maxWorkHours: 184, currentStatus: '在岗', createTime: '2020-05-20 10:30:00' },
  { id: 'N003', name: '张雪梅', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '高级', specialty: ['母婴护理', '产后康复', '营养咨询'], yearsOfExperience: 10, monthlyWorkHours: 160, maxWorkHours: 184, currentStatus: '在岗', createTime: '2021-02-10 08:15:00' },
  { id: 'N004', name: '刘桂英', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '中级', specialty: ['新生儿护理', '新生儿抚触', '早教指导'], yearsOfExperience: 8, monthlyWorkHours: 176, maxWorkHours: 184, currentStatus: '在岗', createTime: '2021-06-08 14:20:00' },
  { id: 'N005', name: '陈美丽', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '中级', specialty: ['母婴护理', '早产儿护理', '心理疏导'], yearsOfExperience: 7, monthlyWorkHours: 165, maxWorkHours: 184, currentStatus: '休息', createTime: '2021-09-12 11:45:00' },
  { id: 'N006', name: '杨思远', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '中级', specialty: ['产后康复', '伤口护理', '母乳喂养指导'], yearsOfExperience: 6, monthlyWorkHours: 180, maxWorkHours: 184, currentStatus: '在岗', createTime: '2022-01-18 09:30:00' },
  { id: 'N007', name: '赵雨萱', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '初级', specialty: ['母婴护理', '新生儿护理'], yearsOfExperience: 3, monthlyWorkHours: 156, maxWorkHours: 184, currentStatus: '在岗', createTime: '2022-07-22 13:10:00' },
  { id: 'N008', name: '黄梓涵', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '初级', specialty: ['母婴护理', '健康监测'], yearsOfExperience: 2, monthlyWorkHours: 162, maxWorkHours: 184, currentStatus: '培训', createTime: '2023-03-05 10:00:00' },
  { id: 'N009', name: '周梦瑶', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '初级', specialty: ['新生儿护理', '新生儿抚触'], yearsOfExperience: 2, monthlyWorkHours: 168, maxWorkHours: 184, currentStatus: '在岗', createTime: '2023-05-10 08:30:00' },
  { id: 'N010', name: '吴淑芬', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '中级', specialty: ['母婴护理', '产后康复', '心理疏导'], yearsOfExperience: 5, monthlyWorkHours: 172, maxWorkHours: 184, currentStatus: '在岗', createTime: '2022-11-15 15:20:00' },
  { id: 'N011', name: '徐玉兰', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '高级', specialty: ['母婴护理', '营养咨询', '母乳喂养指导'], yearsOfExperience: 9, monthlyWorkHours: 160, maxWorkHours: 184, currentStatus: '请假', createTime: '2021-11-28 09:45:00' },
  { id: 'N012', name: '孙悦欣', gender: '女', phone: generatePhone(), idCard: generateIdCard(), role: '护理师', nurseLevel: '初级', specialty: ['母婴护理', '新生儿护理', '早教指导'], yearsOfExperience: 1, monthlyWorkHours: 148, maxWorkHours: 184, currentStatus: '在岗', createTime: '2024-02-01 11:00:00' },
];

export const rooms: Room[] = (() => {
  const result: Room[] = [];
  const config = [
    { type: '标准间' as const, floor: 2, count: 8, price: 880, area: 35 },
    { type: '标准间' as const, floor: 3, count: 8, price: 980, area: 35 },
    { type: '豪华间' as const, floor: 3, count: 2, price: 1280, area: 45 },
    { type: '豪华间' as const, floor: 4, count: 5, price: 1380, area: 45 },
    { type: 'VIP套房' as const, floor: 5, count: 4, price: 2580, area: 65 },
    { type: 'VIP套房' as const, floor: 6, count: 1, price: 2680, area: 65 },
    { type: '总统套房' as const, floor: 6, count: 2, price: 5880, area: 120 },
  ];
  let id = 1;
  for (const cfg of config) {
    for (let i = 1; i <= cfg.count && result.length < 30; i++) {
      const idx = result.length;
      const statuses: Room['status'][] = ['空闲', '清洁中', '维修中'];
      const status = idx < 20 ? '已入住' : statuses[idx % 3];
      result.push({
        id: `RM${String(id).padStart(3, '0')}`,
        floor: cfg.floor,
        roomNumber: `${cfg.floor}${String(i).padStart(2, '0')}`,
        roomType: cfg.type,
        area: cfg.area + Math.floor(Math.random() * 10) - 5,
        pricePerDay: cfg.price + Math.floor(Math.random() * 200) - 100,
        status,
        hasWindow: Math.random() > 0.1,
        hasBathroom: true,
        facilities: pickRandomMultiple(facilities, 6 + Math.floor(Math.random() * 4)),
        customerId: status === '已入住' ? `C${String(idx + 1).padStart(3, '0')}` : undefined,
        lastCleanDate: formatDate(new Date(2026, 5, 10 + Math.floor(Math.random() * 7))),
        nextMaintenanceDate: status === '维修中' ? '2026-06-20' : formatDate(new Date(2026, 6, 1 + Math.floor(Math.random() * 20))),
        remark: status === '维修中' ? '空调系统检修' : undefined,
        updateTime: formatDateTime(new Date(2026, 5, 17)),
      });
      id++;
    }
  }
  return result;
})();

export const customers: Customer[] = (() => {
  const result: Customer[] = [];
  const deliveryMethods: Customer['deliveryMethod'][] = ['顺产', '剖宫产', '顺产侧切', '产钳助产'];
  const dietaryOptions = ['素食', '不吃香菜', '海鲜过敏', '不吃辣', '坚果过敏', '乳糖不耐受'];
  const allergyOptions = ['青霉素', '海鲜', '花生', '鸡蛋', '花粉'];
  for (let i = 0; i < 20; i++) {
    const room = rooms[i];
    const motherName = generateName('女');
    room.customerName = motherName;
    const babyCount = Math.random() > 0.85 ? 2 : 1;
    const babies: Customer['babies'] = [];
    const deliveryDate = new Date(2026, 5, 1 + (i % 15));
    for (let b = 0; b < babyCount; b++) {
      const bg: '男' | '女' = Math.random() > 0.5 ? '男' : '女';
      const bw = 2.5 + Math.random() * 1.5;
      babies.push({
        babyName: generateBabyName(bg),
        gender: bg,
        birthDate: formatDate(deliveryDate),
        birthWeight: Number(bw.toFixed(2)),
        birthLength: 46 + Math.floor(Math.random() * 6),
        currentWeight: Number((bw + 0.2 + Math.random() * 0.5).toFixed(2)),
        currentLength: 47 + Math.floor(Math.random() * 6),
        apgarScore: 7 + Math.floor(Math.random() * 4),
        feedingMethod: pickRandom(['纯母乳', '纯母乳', '混合喂养', '配方奶']) as any,
        feedingTimesPerDay: 8 + Math.floor(Math.random() * 4),
        sleepHoursPerDay: 16 + Math.floor(Math.random() * 4),
        temperature: Number((36.5 + Math.random() * 0.6).toFixed(1)),
        heartRate: 110 + Math.floor(Math.random() * 30),
        jaundiceIndex: Number((3 + Math.random() * 10).toFixed(1)),
        stoolFrequency: 3 + Math.floor(Math.random() * 4),
        vaccinationRecords: ['乙肝疫苗第一针', '卡介苗'],
        recordTime: formatDateTime(new Date()),
      });
    }
    const checkIn = new Date(deliveryDate.getTime() + 24 * 3600 * 1000 * (1 + Math.floor(Math.random() * 3)));
    result.push({
      id: `C${String(i + 1).padStart(3, '0')}`,
      motherName,
      motherAge: 23 + Math.floor(Math.random() * 15),
      phone: generatePhone(),
      idCard: generateIdCard(),
      emergencyContact: generateName(Math.random() > 0.5 ? '男' : '女'),
      emergencyPhone: generatePhone(),
      roomId: room.id,
      roomNumber: room.roomNumber,
      deliveryMethod: pickRandom(deliveryMethods),
      deliveryDate: formatDate(deliveryDate),
      babyCount,
      babies,
      checkInDate: formatDate(checkIn),
      expectedCheckOutDate: formatDate(new Date(checkIn.getTime() + 28 * 24 * 3600 * 1000)),
      motherSameRoom: Math.random() > 0.3,
      healthRecords: [{
        bloodPressure: `${105 + Math.floor(Math.random() * 20)}/${65 + Math.floor(Math.random() * 15)}`,
        bloodSugar: Number((4.2 + Math.random() * 1.8).toFixed(1)).toString(),
        heartRate: 72 + Math.floor(Math.random() * 20),
        temperature: Number((36.3 + Math.random() * 0.5).toFixed(1)),
        woundRecovery: pickRandom(['良好', '良好', '正常', '正常', '需关注']) as any,
        uterineContraction: pickRandom(['良好', '正常', '良好']) as any,
        lochiaStatus: pickRandom(['正常', '正常', '偏多', '正常']) as any,
        moodStatus: pickRandom(['愉悦', '愉悦', '稳定', '稳定', '焦虑']) as any,
        sleepQuality: pickRandom(['良好', '一般', '良好', '良好']) as any,
        recordTime: formatDateTime(new Date()),
      }],
      dietaryRestrictions: pickRandomMultiple(dietaryOptions, Math.floor(Math.random() * 2)),
      allergies: pickRandomMultiple(allergyOptions, Math.floor(Math.random() * 2)),
      carePlanId: `CP${String(i + 1).padStart(3, '0')}`,
      primaryNurseId: nurses[i % nurses.length].id,
      satisfactionScore: i < 15 ? Number((4.5 + Math.random() * 0.5).toFixed(1)) : undefined,
      status: '在住',
      remark: i === 5 ? 'VIP客户，总经理特别关照，需要额外关注' : undefined,
      createTime: formatDateTime(new Date(checkIn.getTime() - 3600 * 1000)),
    });
  }
  return result;
})();

export const careTasks: CareTask[] = (() => {
  const result: CareTask[] = [];
  const templates = [
    { name: '晨间生命体征监测', category: '健康监测', duration: 15, priority: '高' },
    { name: '伤口护理换药', category: '母亲护理', duration: 25, priority: '高' },
    { name: '子宫按摩恢复', category: '母亲护理', duration: 20, priority: '中' },
    { name: '母乳喂养指导', category: '母亲护理', duration: 30, priority: '高' },
    { name: '新生儿脐带护理', category: '新生儿护理', duration: 15, priority: '高' },
    { name: '新生儿抚触按摩', category: '新生儿护理', duration: 25, priority: '中' },
    { name: '新生儿黄疸监测', category: '新生儿护理', duration: 10, priority: '中' },
    { name: '喂奶拍嗝护理', category: '新生儿护理', duration: 20, priority: '高' },
    { name: '母婴同室照护', category: '母婴同室', duration: 40, priority: '中' },
    { name: '产后心理疏导', category: '心理疏导', duration: 30, priority: '低' },
    { name: '会阴冲洗护理', category: '母亲护理', duration: 15, priority: '高' },
    { name: '产后康复操指导', category: '母亲护理', duration: 25, priority: '低' },
    { name: '体温血压测量', category: '健康监测', duration: 10, priority: '高' },
    { name: '伤口消毒处理', category: '母亲护理', duration: 20, priority: '高' },
  ];
  const statusPool: CareTask['status'][] = ['待执行', '进行中', '已完成', '已完成', '待执行', '已超时'];
  const times = ['06:00', '08:00', '09:30', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];
  for (let i = 0; i < 50; i++) {
    const customer = customers[i % customers.length];
    const tpl = templates[i % templates.length];
    const status = pickRandom(statusPool);
    const dateStr = formatDate(new Date(2026, 5, 16 + Math.floor(i / 30)));
    const timeStr = pickRandom(times);
    const nurse = nurses[(i + 3) % nurses.length];
    result.push({
      id: `T${String(i + 1).padStart(4, '0')}`,
      customerId: customer.id,
      customerName: customer.motherName,
      roomNumber: customer.roomNumber,
      carePlanId: customer.carePlanId!,
      templateId: `TPL${String((i % templates.length) + 1).padStart(3, '0')}`,
      taskName: tpl.name,
      description: `${tpl.category}任务：为${customer.motherName}提供${tpl.name}服务，请按标准操作流程执行并如实记录。`,
      category: tpl.category as CareTask['category'],
      assigneeId: status !== '待执行' || Math.random() > 0.3 ? nurse.id : undefined,
      assigneeName: status !== '待执行' || Math.random() > 0.3 ? nurse.name : undefined,
      scheduledTime: `${dateStr} ${timeStr}:00`,
      startTime: status !== '待执行' ? `${dateStr} ${timeStr.split(':')[0]}:${String(Math.min(59, +timeStr.split(':')[1] + 5)).padStart(2, '0')}:00` : undefined,
      endTime: status === '已完成' ? `${dateStr} ${timeStr.split(':')[0]}:${String(Math.min(59, +timeStr.split(':')[1] + tpl.duration + 3)).padStart(2, '0')}:00` : undefined,
      status,
      priority: tpl.priority as CareTask['priority'],
      duration: tpl.duration,
      actualDuration: status === '已完成' ? tpl.duration + Math.floor(Math.random() * 10) - 3 : undefined,
      executionNotes: status === '已完成' ? '执行顺利，客户状态良好，无异常反应。' : status === '已超时' ? '因前序任务超时延误，导致未能按时执行，已重新分配。' : undefined,
      isOverdue: status === '已超时',
      createTime: '2026-06-16 06:00:00',
      completeTime: status === '已完成' ? `${dateStr} ${timeStr.split(':')[0]}:${String(Math.min(59, +timeStr.split(':')[1] + tpl.duration + 5)).padStart(2, '0')}:00` : undefined,
    });
  }
  return result;
})();

export const carePlans: CarePlan[] = customers.map((c, idx) => {
  const relTasks = careTasks.filter(t => t.customerId === c.id);
  const phaseIdx = idx < 7 ? 0 : idx < 14 ? 1 : 2;
  const phases: CarePlan['phase'][] = ['产后1-7天', '产后8-14天', '产后15-30天'];
  const apgar = c.babies[0]?.apgarScore || 9;
  const statuses: CarePlan['status'][] = ['待审批', '已通过', '已调整', '已通过', '已通过'];
  return {
    id: c.carePlanId!,
    customerId: c.id,
    customerName: c.motherName,
    roomNumber: c.roomNumber,
    planName: `${c.motherName}-${phases[phaseIdx]}个性化照护方案`,
    version: 1 + (idx % 2),
    deliveryMethod: c.deliveryMethod,
    apgarScore: apgar,
    motherSameRoom: c.motherSameRoom,
    phase: phases[phaseIdx],
    tasks: relTasks,
    mealPlanId: `MP${String(idx + 1).padStart(3, '0')}`,
    assignedNurseIds: [nurses[idx % nurses.length].id, nurses[(idx + 4) % nurses.length].id],
    status: idx < 17 ? '已通过' : pickRandom(statuses),
    approvalHistory: [
      { id: `AH${idx}-1`, operatorId: 'ADMIN001', operatorName: '系统管理员', action: '提交', comment: '基于智能算法生成的个性化初始方案', operateTime: '2026-06-15 14:00:00' },
      { id: `AH${idx}-2`, operatorId: 'HM001', operatorName: '张桂兰护士长', action: '通过', comment: idx % 3 === 0 ? '方案合理，同意执行，请关注客户过敏情况' : '同意执行，请护理团队严格按方案落实', operateTime: '2026-06-15 16:30:00' },
    ],
    createTime: '2026-06-15 14:00:00',
    updateTime: '2026-06-16 09:00:00',
    createdBy: '智能算法引擎',
    approvedBy: '张桂兰护士长',
    remark: c.allergies.length > 0 ? `注意客户过敏史：${c.allergies.join('、')}` : undefined,
  };
});

export const scheduleEntries: ScheduleEntry[] = (() => {
  const result: ScheduleEntry[] = [];
  const shiftDefs = [
    { type: '早班' as const, start: '07:00', end: '15:00', hours: 8 },
    { type: '中班' as const, start: '15:00', end: '23:00', hours: 8 },
    { type: '晚班' as const, start: '23:00', end: '07:00', hours: 8 },
    { type: '休息' as const, start: '00:00', end: '00:00', hours: 0 },
  ];
  for (let day = 15; day <= 21; day++) {
    const dStr = formatDate(new Date(2026, 5, day));
    const isWeekend = new Date(2026, 5, day).getDay() === 0 || new Date(2026, 5, day).getDay() === 6;
    nurses.forEach((n, ni) => {
      const si = (ni + day + 1) % 4;
      const sh = shiftDefs[si];
      const cIds = sh.type !== '休息' ? [ni, ni + 12].filter(x => x < customers.length).map(x => customers[x]?.id).filter(Boolean) as string[] : [];
      const rNums = cIds.map(cid => customers.find(c => c.id === cid)?.roomNumber).filter(Boolean) as string[];
      result.push({
        id: `SCH-${dStr}-${n.id}`,
        nurseId: n.id,
        nurseName: n.name,
        date: dStr,
        shiftType: sh.type,
        startTime: sh.start,
        endTime: sh.end,
        assignedCustomers: cIds,
        assignedRoomNumbers: rNums,
        workHours: sh.hours,
        isHoliday: isWeekend,
        isOvertime: false,
        remark: n.currentStatus === '请假' && sh.type !== '休息' ? '已申请病假，调班处理中' : undefined,
        createTime: '2026-06-10 10:00:00',
        updateTime: '2026-06-15 18:00:00',
      });
    });
  }
  return result;
})();

export const mealRecipes: MealRecipe[] = [
  { id: 'R001', name: '小米红枣粥配煮鸡蛋', phase: '产后1-7天', mealType: '早餐', ingredients: [{ itemId: 'I011', itemName: '小米', quantity: 50, unit: 'g' }, { itemId: 'I023', itemName: '新疆红枣', quantity: 20, unit: 'g' }, { itemId: 'I007', itemName: '土鸡蛋', quantity: 1, unit: '个' }], nutritionFacts: { calories: 320, protein: 15, fat: 8, carbs: 52, calcium: 80, iron: 3.2 }, cookingMethod: '小米洗净后加水慢熬40分钟至粘稠，加入红枣继续煮10分钟；鸡蛋冷水下锅煮8分钟捞出过凉水。', suitableFor: ['产后第一周', '脾胃虚弱', '气血不足'], contraindications: ['糖尿病患者需减少红枣用量'] },
  { id: 'R002', name: '生化汤', phase: '产后1-7天', mealType: '上午加餐', ingredients: [{ itemId: 'I024', itemName: '当归', quantity: 8, unit: 'g' }, { itemId: 'I025', itemName: '川芎', quantity: 3, unit: 'g' }, { itemId: 'I026', itemName: '桃仁', quantity: 3, unit: 'g' }], nutritionFacts: { calories: 45, protein: 1, fat: 0.5, carbs: 10, calcium: 15, iron: 0.8 }, cookingMethod: '药材加水500ml浸泡30分钟，大火煮开后转小火煎30分钟，取汁200ml温服。', suitableFor: ['产后排恶露', '子宫恢复', '活血化瘀'], contraindications: ['出血量多者慎用', '感冒发热期间禁用'] },
  { id: 'R003', name: '清蒸鲈鱼配丝瓜', phase: '产后1-7天', mealType: '午餐', ingredients: [{ itemId: 'I003', itemName: '鲈鱼', quantity: 150, unit: 'g' }, { itemId: 'I009', itemName: '丝瓜', quantity: 100, unit: 'g' }, { itemId: 'I021', itemName: '老姜', quantity: 10, unit: 'g' }], nutritionFacts: { calories: 280, protein: 32, fat: 10, carbs: 8, calcium: 120, iron: 2.5 }, cookingMethod: '鲈鱼洗净用姜片腌制15分钟，丝瓜切片铺盘底，放上鱼，水开后大火蒸8分钟，淋少许蒸鱼豉油。', suitableFor: ['产后伤口恢复', '通乳下奶', '易消化吸收'], contraindications: ['海鲜过敏者禁用'] },
  { id: 'R004', name: '五红汤', phase: '产后1-7天', mealType: '下午加餐', ingredients: [{ itemId: 'I027', itemName: '红小豆', quantity: 30, unit: 'g' }, { itemId: 'I028', itemName: '红衣花生', quantity: 20, unit: 'g' }, { itemId: 'I029', itemName: '枸杞', quantity: 10, unit: 'g' }], nutritionFacts: { calories: 210, protein: 8, fat: 6, carbs: 32, calcium: 45, iron: 4.2 }, cookingMethod: '红豆花生提前泡发2小时，加水大火煮开转小火煮40分钟，加入枸杞红糖再煮10分钟。', suitableFor: ['补血养血', '产后调理', '提升气色'], contraindications: ['血糖偏高者减少红糖用量'] },
  { id: 'R005', name: '山药排骨汤', phase: '产后8-14天', mealType: '晚餐', ingredients: [{ itemId: 'I001', itemName: '猪排骨', quantity: 150, unit: 'g' }, { itemId: 'I010', itemName: '铁棍山药', quantity: 100, unit: 'g' }, { itemId: 'I021', itemName: '老姜', quantity: 10, unit: 'g' }], nutritionFacts: { calories: 380, protein: 28, fat: 22, carbs: 15, calcium: 85, iron: 2.8 }, cookingMethod: '排骨焯水后加姜片炖1小时，加入山药块继续炖30分钟，加盐调味即可。', suitableFor: ['补气健脾', '强筋健骨', '产后第二周滋补'], contraindications: ['感冒发热期间慎用'] },
  { id: 'R006', name: '酒酿蛋花汤', phase: '产后8-14天', mealType: '夜宵', ingredients: [{ itemId: 'I030', itemName: '酒酿', quantity: 100, unit: 'g' }, { itemId: 'I007', itemName: '土鸡蛋', quantity: 1, unit: '个' }], nutritionFacts: { calories: 180, protein: 10, fat: 6, carbs: 22, calcium: 50, iron: 1.8 }, cookingMethod: '酒酿加水煮开，打入鸡蛋搅散成蛋花，加少许红糖调味即可。', suitableFor: ['催乳下奶', '促进血液循环', '温经散寒'], contraindications: ['酒精过敏者慎用', '糖尿病患者少糖或无糖'] },
  { id: 'R007', name: '全麦面包配牛油果牛奶', phase: '产后15-30天', mealType: '早餐', ingredients: [{ itemId: 'I012', itemName: '全麦面包', quantity: 2, unit: '片' }, { itemId: 'I017', itemName: '牛油果', quantity: 0.5, unit: '个' }, { itemId: 'I008', itemName: '有机牛奶', quantity: 250, unit: 'ml' }], nutritionFacts: { calories: 450, protein: 22, fat: 20, carbs: 48, calcium: 320, iron: 3.5 }, cookingMethod: '全麦面包用烤面包机烤至微黄，牛油果切片抹在面包上，牛奶加热至40度左右饮用。', suitableFor: ['均衡营养', '补充膳食纤维', '产后第三周'], contraindications: ['乳糖不耐受者换用豆奶或燕麦奶'] },
  { id: 'R008', name: '木瓜炖雪蛤', phase: '产后15-30天', mealType: '上午加餐', ingredients: [{ itemId: 'I031', itemName: '雪蛤', quantity: 5, unit: 'g' }, { itemId: 'I015', itemName: '木瓜', quantity: 100, unit: 'g' }], nutritionFacts: { calories: 220, protein: 12, fat: 2, carbs: 38, calcium: 60, iron: 1.5 }, cookingMethod: '雪蛤提前用清水泡发12小时，挑去黑线杂质，木瓜去皮切块，一起加水炖40分钟，加少许冰糖。', suitableFor: ['美容养颜', '滋阴润肺', '通乳下奶'], contraindications: ['脾胃虚寒泄泻者慎用'] },
  { id: 'R009', name: '黄豆炖猪蹄', phase: '产后15-30天', mealType: '午餐', ingredients: [{ itemId: 'I002', itemName: '猪蹄', quantity: 200, unit: 'g' }, { itemId: 'I032', itemName: '黄豆', quantity: 50, unit: 'g' }, { itemId: 'I021', itemName: '老姜', quantity: 10, unit: 'g' }], nutritionFacts: { calories: 520, protein: 42, fat: 32, carbs: 18, calcium: 150, iron: 5.8 }, cookingMethod: '黄豆提前泡发4小时，猪蹄焯水去毛，加姜片黄豆大火煮开转小火炖2小时，加盐调味。', suitableFor: ['催乳下奶', '补充胶原蛋白', '产后恢复'], contraindications: ['高血脂、高血压患者适量食用'] },
  { id: 'R010', name: '银耳莲子羹', phase: '产后15-30天', mealType: '下午加餐', ingredients: [{ itemId: 'I033', itemName: '银耳', quantity: 10, unit: 'g' }, { itemId: 'I034', itemName: '莲子', quantity: 20, unit: 'g' }, { itemId: 'I023', itemName: '新疆红枣', quantity: 15, unit: 'g' }], nutritionFacts: { calories: 195, protein: 5, fat: 1, carbs: 45, calcium: 40, iron: 2.8 }, cookingMethod: '银耳莲子红枣洗净，银耳撕小朵，加水大火煮开转小火炖1.5小时至粘稠，加少许冰糖。', suitableFor: ['滋阴润燥', '安神助眠', '养心益肺'], contraindications: ['外感风寒咳嗽者慎用'] },
  { id: 'R011', name: '鲜虾蔬菜粥', phase: '产后8-14天', mealType: '早餐', ingredients: [{ itemId: 'I004', itemName: '鲜虾', quantity: 80, unit: 'g' }, { itemId: 'I013', itemName: '东北大米', quantity: 60, unit: 'g' }, { itemId: 'I022', itemName: '香葱', quantity: 5, unit: 'g' }], nutritionFacts: { calories: 350, protein: 28, fat: 6, carbs: 45, calcium: 110, iron: 3.8 }, cookingMethod: '大米煮粥40分钟，虾去壳挑线切丁，粥快熟时加入虾仁煮至变色，撒葱花出锅。', suitableFor: ['补钙强身', '增强免疫力', '易消化'], contraindications: ['海鲜过敏者禁用'] },
  { id: 'R012', name: '麻油鸡', phase: '产后15-30天', mealType: '晚餐', ingredients: [{ itemId: 'I006', itemName: '土鸡', quantity: 180, unit: 'g' }, { itemId: 'I021', itemName: '老姜', quantity: 30, unit: 'g' }], nutritionFacts: { calories: 480, protein: 38, fat: 28, carbs: 6, calcium: 40, iron: 3.2 }, cookingMethod: '老姜切片用黑麻油小火慢爆至卷曲焦黄，加入鸡块翻炒至变色，加少许米酒和水炖40分钟。', suitableFor: ['补气暖身', '驱寒排湿', '产后进补'], contraindications: ['感冒发热期间禁用', '恶露未净前少量食用'] },
];

export const mealPlans: MealPlan[] = customers.map((c, idx) => {
  const phaseIdx = idx < 7 ? 0 : idx < 14 ? 1 : 2;
  const phases: MealPlan['phase'][] = ['产后1-7天', '产后8-14天', '产后15-30天'];
  const startDate = new Date(c.checkInDate);
  const dailyMeals: MealPlan['dailyMeals'] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + d);
    const phaseRecipes = mealRecipes.filter(r => r.phase === phases[phaseIdx]);
    const mealTypes = ['早餐', '上午加餐', '午餐', '下午加餐', '晚餐', '夜宵'] as const;
    dailyMeals.push({
      date: formatDate(date),
      meals: mealTypes.map(mt => {
        const forMeal = phaseRecipes.filter(r => r.mealType === mt);
        const r = forMeal.length > 0 ? forMeal[(d + idx) % forMeal.length] : mealRecipes[(d * 6 + mealTypes.indexOf(mt) + idx) % mealRecipes.length];
        return {
          mealType: mt,
          recipeId: r.id,
          recipeName: r.name,
          isFavourite: d > 2 && Math.random() > 0.7,
          remark: c.dietaryRestrictions.length > 0 && Math.random() > 0.8 ? `已根据忌口调整：${c.dietaryRestrictions[0]}` : undefined,
        };
      }),
    });
  }
  return {
    id: `MP${String(idx + 1).padStart(3, '0')}`,
    customerId: c.id,
    customerName: c.motherName,
    phase: phases[phaseIdx],
    startDate: c.checkInDate,
    endDate: formatDate(new Date(startDate.getTime() + 6 * 24 * 3600 * 1000)),
    dailyMeals,
    dietaryRestrictions: c.dietaryRestrictions,
    createdBy: '李营养师',
    createTime: '2026-06-15 10:00:00',
    updateTime: '2026-06-16 11:30:00',
  };
});

export const inventoryItems: InventoryItem[] = [
  { id: 'I001', name: '猪排骨', category: '肉类', unit: 'kg', currentStock: 15.5, safeStock: 10, maxStock: 30, status: '正常', unitPrice: 38, supplier: '双汇食品', lastRestockDate: '2026-06-15', location: '冷藏库A区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I002', name: '猪蹄', category: '肉类', unit: 'kg', currentStock: 8.2, safeStock: 8, maxStock: 25, status: '预警', unitPrice: 32, supplier: '双汇食品', lastRestockDate: '2026-06-14', nextRestockDate: '2026-06-18', location: '冷藏库A区-02', remark: '明日需安排补货', updateTime: '2026-06-17 08:00:00' },
  { id: 'I003', name: '鲈鱼', category: '水产', unit: 'kg', currentStock: 6.8, safeStock: 5, maxStock: 15, status: '正常', unitPrice: 58, supplier: '东海水产', lastRestockDate: '2026-06-16', location: '冷藏库B区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I004', name: '鲜虾', category: '水产', unit: 'kg', currentStock: 3.5, safeStock: 4, maxStock: 12, status: '紧缺', unitPrice: 76, supplier: '东海水产', lastRestockDate: '2026-06-13', nextRestockDate: '2026-06-17', location: '冷藏库B区-02', remark: '今日必须到货', updateTime: '2026-06-17 08:00:00' },
  { id: 'I005', name: '黄牛肉', category: '肉类', unit: 'kg', currentStock: 12, safeStock: 8, maxStock: 25, status: '正常', unitPrice: 88, supplier: '科尔沁牛肉', lastRestockDate: '2026-06-15', location: '冷藏库A区-03', updateTime: '2026-06-17 08:00:00' },
  { id: 'I006', name: '散养土鸡', category: '肉类', unit: '只', currentStock: 18, safeStock: 15, maxStock: 40, status: '正常', unitPrice: 128, supplier: '山林散养合作社', lastRestockDate: '2026-06-15', location: '冷藏库A区-04', updateTime: '2026-06-17 08:00:00' },
  { id: 'I007', name: '土鸡蛋', category: '蛋奶', unit: '个', currentStock: 450, safeStock: 300, maxStock: 800, status: '正常', unitPrice: 2.5, supplier: '山林散养合作社', lastRestockDate: '2026-06-16', location: '常温库A区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I008', name: '有机牛奶', category: '蛋奶', unit: '盒(250ml)', currentStock: 95, safeStock: 100, maxStock: 300, status: '预警', unitPrice: 8, supplier: '蒙牛特仑苏', lastRestockDate: '2026-06-14', nextRestockDate: '2026-06-18', location: '冷藏库C区-01', remark: '库存接近安全线', updateTime: '2026-06-17 08:00:00' },
  { id: 'I009', name: '有机丝瓜', category: '蔬菜', unit: 'kg', currentStock: 4.8, safeStock: 5, maxStock: 15, status: '预警', unitPrice: 8, supplier: '绿源有机蔬菜', lastRestockDate: '2026-06-16', location: '冷藏库D区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I010', name: '铁棍山药', category: '蔬菜', unit: 'kg', currentStock: 12.5, safeStock: 8, maxStock: 20, status: '正常', unitPrice: 18, supplier: '河南焦作产地直供', lastRestockDate: '2026-06-14', location: '冷藏库D区-02', updateTime: '2026-06-17 08:00:00' },
  { id: 'I011', name: '沁州黄小米', category: '主食', unit: 'kg', currentStock: 22, safeStock: 15, maxStock: 50, status: '正常', unitPrice: 16, supplier: '山西沁州黄', lastRestockDate: '2026-06-12', location: '常温库B区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I012', name: '全麦面包', category: '主食', unit: '袋', currentStock: 38, safeStock: 20, maxStock: 60, status: '正常', unitPrice: 15, supplier: '原麦山丘', lastRestockDate: '2026-06-17', location: '冷藏库C区-02', updateTime: '2026-06-17 08:00:00' },
  { id: 'I013', name: '五常大米', category: '主食', unit: 'kg', currentStock: 85, safeStock: 50, maxStock: 200, status: '正常', unitPrice: 12, supplier: '五常稻花香', lastRestockDate: '2026-06-10', location: '常温库B区-02', updateTime: '2026-06-17 08:00:00' },
  { id: 'I014', name: '丹东草莓', category: '水果', unit: '盒', currentStock: 18, safeStock: 20, maxStock: 50, status: '预警', unitPrice: 38, supplier: '丹东产地直供', lastRestockDate: '2026-06-16', nextRestockDate: '2026-06-17', location: '冷藏库E区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I015', name: '海南木瓜', category: '水果', unit: '个', currentStock: 28, safeStock: 20, maxStock: 60, status: '正常', unitPrice: 15, supplier: '海南果蔬', lastRestockDate: '2026-06-15', location: '冷藏库E区-02', updateTime: '2026-06-17 08:00:00' },
  { id: 'I016', name: '智利车厘子', category: '水果', unit: 'kg', currentStock: 2.8, safeStock: 3, maxStock: 10, status: '紧缺', unitPrice: 128, supplier: '智利进口', lastRestockDate: '2026-06-12', nextRestockDate: '2026-06-17', location: '冷藏库E区-03', remark: 'VIP客户专供，需紧急补货', updateTime: '2026-06-17 08:00:00' },
  { id: 'I017', name: '墨西哥牛油果', category: '水果', unit: '个', currentStock: 22, safeStock: 15, maxStock: 40, status: '正常', unitPrice: 12, supplier: '墨西哥进口', lastRestockDate: '2026-06-15', location: '冷藏库E区-04', updateTime: '2026-06-17 08:00:00' },
  { id: 'I018', name: '有机西兰花', category: '蔬菜', unit: 'kg', currentStock: 7.5, safeStock: 5, maxStock: 15, status: '正常', unitPrice: 10, supplier: '绿源有机蔬菜', lastRestockDate: '2026-06-16', location: '冷藏库D区-03', updateTime: '2026-06-17 08:00:00' },
  { id: 'I019', name: '有机菠菜', category: '蔬菜', unit: 'kg', currentStock: 3.2, safeStock: 4, maxStock: 12, status: '紧缺', unitPrice: 8, supplier: '绿源有机蔬菜', lastRestockDate: '2026-06-15', nextRestockDate: '2026-06-17', location: '冷藏库D区-04', updateTime: '2026-06-17 08:00:00' },
  { id: 'I020', name: '有机胡萝卜', category: '蔬菜', unit: 'kg', currentStock: 15, safeStock: 8, maxStock: 25, status: '正常', unitPrice: 5, supplier: '绿源有机蔬菜', lastRestockDate: '2026-06-14', location: '冷藏库D区-05', updateTime: '2026-06-17 08:00:00' },
  { id: 'I021', name: '山东老姜', category: '调味品', unit: 'kg', currentStock: 5.5, safeStock: 3, maxStock: 10, status: '正常', unitPrice: 15, supplier: '山东产地直供', lastRestockDate: '2026-06-12', location: '常温库C区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I022', name: '有机香葱', category: '调味品', unit: 'kg', currentStock: 1.8, safeStock: 2, maxStock: 5, status: '预警', unitPrice: 12, supplier: '绿源有机蔬菜', lastRestockDate: '2026-06-16', location: '冷藏库D区-06', updateTime: '2026-06-17 08:00:00' },
  { id: 'I023', name: '新疆若羌红枣', category: '保健品', unit: 'kg', currentStock: 12, safeStock: 8, maxStock: 20, status: '正常', unitPrice: 45, supplier: '新疆若羌产地直供', lastRestockDate: '2026-06-08', location: '常温库C区-02', updateTime: '2026-06-17 08:00:00' },
  { id: 'I024', name: '岷县当归', category: '保健品', unit: 'kg', currentStock: 1.8, safeStock: 1, maxStock: 3, status: '正常', unitPrice: 180, supplier: '甘肃岷县', lastRestockDate: '2026-06-01', location: '常温库D区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I025', name: '彭州川芎', category: '保健品', unit: 'kg', currentStock: 0.8, safeStock: 0.5, maxStock: 2, status: '正常', unitPrice: 120, supplier: '四川彭州', lastRestockDate: '2026-06-01', location: '常温库D区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I026', name: '安国桃仁', category: '保健品', unit: 'kg', currentStock: 0.6, safeStock: 0.5, maxStock: 2, status: '正常', unitPrice: 95, supplier: '河北安国', lastRestockDate: '2026-06-01', location: '常温库D区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I027', name: '东北红小豆', category: '保健品', unit: 'kg', currentStock: 8, safeStock: 5, maxStock: 15, status: '正常', unitPrice: 22, supplier: '东北宝清', lastRestockDate: '2026-06-05', location: '常温库B区-03', updateTime: '2026-06-17 08:00:00' },
  { id: 'I028', name: '红衣花生米', category: '保健品', unit: 'kg', currentStock: 6, safeStock: 5, maxStock: 12, status: '正常', unitPrice: 28, supplier: '山东正阳', lastRestockDate: '2026-06-05', location: '常温库B区-03', updateTime: '2026-06-17 08:00:00' },
  { id: 'I029', name: '宁夏枸杞', category: '保健品', unit: 'kg', currentStock: 2.2, safeStock: 2, maxStock: 5, status: '正常', unitPrice: 75, supplier: '宁夏中宁', lastRestockDate: '2026-06-01', location: '常温库D区-02', updateTime: '2026-06-17 08:00:00' },
  { id: 'I030', name: '手工酒酿', category: '蛋奶', unit: '瓶(500g)', currentStock: 42, safeStock: 30, maxStock: 80, status: '正常', unitPrice: 18, supplier: '本地老字号酒厂', lastRestockDate: '2026-06-10', location: '冷藏库C区-03', updateTime: '2026-06-17 08:00:00' },
  { id: 'I031', name: '长白山雪蛤', category: '保健品', unit: 'g', currentStock: 150, safeStock: 100, maxStock: 300, status: '正常', unitPrice: 18, supplier: '长白山林蛙养殖基地', lastRestockDate: '2026-06-01', location: '冷藏库F区-01', updateTime: '2026-06-17 08:00:00' },
  { id: 'I032', name: '东北黄豆', category: '主食', unit: 'kg', currentStock: 25, safeStock: 15, maxStock: 50, status: '正常', unitPrice: 12, supplier: '黑龙江海伦', lastRestockDate: '2026-06-08', location: '常温库B区-04', updateTime: '2026-06-17 08:00:00' },
  { id: 'I033', name: '古田银耳', category: '保健品', unit: 'kg', currentStock: 1.5, safeStock: 1, maxStock: 3, status: '正常', unitPrice: 85, supplier: '福建古田', lastRestockDate: '2026-06-01', location: '常温库D区-03', updateTime: '2026-06-17 08:00:00' },
  { id: 'I034', name: '湘潭莲子', category: '保健品', unit: 'kg', currentStock: 2.8, safeStock: 2, maxStock: 5, status: '正常', unitPrice: 58, supplier: '湖南湘潭', lastRestockDate: '2026-06-01', location: '常温库D区-03', updateTime: '2026-06-17 08:00:00' },
];

export const equipmentList: Equipment[] = [
  { id: 'EQ001', name: '智能婴儿恒温床', model: 'SMART-CRIB-PRO-V2', serialNumber: 'SN2024SCP0001', category: '母婴护理设备', purchaseDate: '2024-01-15', purchasePrice: 15800, usageCount: 846, maxUsageCount: 5000, lastMaintenanceDate: '2026-05-15', nextMaintenanceDate: '2026-07-15', status: '使用中', location: '3楼 301室', warrantyExpireDate: '2027-01-14', maintenanceHistoryCount: 5, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ002', name: '智能婴儿恒温床', model: 'SMART-CRIB-PRO-V2', serialNumber: 'SN2024SCP0002', category: '母婴护理设备', purchaseDate: '2024-01-15', purchasePrice: 15800, usageCount: 723, maxUsageCount: 5000, lastMaintenanceDate: '2026-05-15', nextMaintenanceDate: '2026-07-15', status: '使用中', location: '3楼 302室', warrantyExpireDate: '2027-01-14', maintenanceHistoryCount: 4, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ003', name: '多功能电动护理床', model: 'NURSE-BED-8000', serialNumber: 'SN2024NB0001', category: '母婴护理设备', purchaseDate: '2024-02-20', purchasePrice: 8600, usageCount: 512, maxUsageCount: 3000, lastMaintenanceDate: '2026-04-20', nextMaintenanceDate: '2026-06-20', status: '待维护', location: '4楼 405室', warrantyExpireDate: '2026-12-19', maintenanceHistoryCount: 3, remark: '升降功能偶尔卡顿', updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ004', name: '多参数心电监护仪', model: 'ECG-MONITOR-500', serialNumber: 'SN2024ECG001', category: '监测设备', purchaseDate: '2024-01-10', purchasePrice: 28500, usageCount: 1205, maxUsageCount: 8000, lastMaintenanceDate: '2026-05-10', nextMaintenanceDate: '2026-08-10', status: '使用中', location: '5楼 护理站', warrantyExpireDate: '2027-01-09', maintenanceHistoryCount: 6, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ005', name: '新生儿黄疸治疗仪', model: 'JAUNDICE-LITE-PRO', serialNumber: 'SN2024JLP001', category: '母婴护理设备', purchaseDate: '2024-03-05', purchasePrice: 12000, usageCount: 156, maxUsageCount: 2000, lastMaintenanceDate: '2026-05-20', nextMaintenanceDate: '2026-08-20', status: '使用中', location: '2楼 新生儿护理室', warrantyExpireDate: '2027-03-04', maintenanceHistoryCount: 2, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ006', name: '产后康复治疗仪', model: 'REHAB-PLUS-3000', serialNumber: 'SN2024RP001', category: '康复设备', purchaseDate: '2024-02-28', purchasePrice: 35000, usageCount: 328, maxUsageCount: 5000, lastMaintenanceDate: '2026-03-28', nextMaintenanceDate: '2026-06-28', status: '待维护', location: '4楼 康复室', warrantyExpireDate: '2026-08-27', maintenanceHistoryCount: 4, remark: '电极片需更换', updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ007', name: '多普勒胎心监护仪', model: 'FETAL-DOPPLER-X', serialNumber: 'SN2024FDX01', category: '监测设备', purchaseDate: '2024-01-20', purchasePrice: 6800, usageCount: 2150, maxUsageCount: 10000, lastMaintenanceDate: '2026-05-30', nextMaintenanceDate: '2026-08-30', status: '使用中', location: '5楼 护理站', warrantyExpireDate: '2027-01-19', maintenanceHistoryCount: 3, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ008', name: '智能体重身高测量仪', model: 'BODY-SCALE-PRO', serialNumber: 'SN2024BSP001', category: '监测设备', purchaseDate: '2024-02-10', purchasePrice: 4200, usageCount: 3820, maxUsageCount: 15000, lastMaintenanceDate: '2026-05-25', nextMaintenanceDate: '2026-08-25', status: '使用中', location: '2楼 体检区', warrantyExpireDate: '2027-02-09', maintenanceHistoryCount: 2, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ009', name: '红外线测温仪', model: 'TEMP-SCAN-300', serialNumber: 'SN2024TS0001', category: '监测设备', purchaseDate: '2024-01-05', purchasePrice: 1800, usageCount: 5680, maxUsageCount: 20000, lastMaintenanceDate: '2026-06-01', nextMaintenanceDate: '2026-09-01', status: '正常', location: '各楼层护理站', warrantyExpireDate: '2027-01-04', maintenanceHistoryCount: 1, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ010', name: '空气净化器', model: 'AIR-PURE-X800', serialNumber: 'SN2024APX801', category: '环境设备', purchaseDate: '2024-03-01', purchasePrice: 3200, usageCount: 2920, maxUsageCount: 8760, lastMaintenanceDate: '2026-06-05', nextMaintenanceDate: '2026-07-05', status: '使用中', location: '全楼层房间', warrantyExpireDate: '2027-02-28', maintenanceHistoryCount: 5, remark: '需更换滤网', updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ011', name: '中央空调系统', model: 'VRV-SMART-100', serialNumber: 'SN2023V10001', category: '环境设备', purchaseDate: '2023-12-20', purchasePrice: 280000, usageCount: 4380, maxUsageCount: 43800, lastMaintenanceDate: '2026-05-15', nextMaintenanceDate: '2026-08-15', status: '使用中', location: '楼顶设备间', warrantyExpireDate: '2028-12-19', maintenanceHistoryCount: 8, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ012', name: '新风系统', model: 'FRESH-AIR-5000', serialNumber: 'SN2023FA5001', category: '环境设备', purchaseDate: '2023-12-25', purchasePrice: 120000, usageCount: 4380, maxUsageCount: 43800, lastMaintenanceDate: '2026-05-20', nextMaintenanceDate: '2026-08-20', status: '使用中', location: '楼顶设备间', warrantyExpireDate: '2028-12-24', maintenanceHistoryCount: 6, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ013', name: '医用洗衣机', model: 'MED-WASH-25KG', serialNumber: 'SN2024MW2501', category: '环境设备', purchaseDate: '2024-02-01', purchasePrice: 45000, usageCount: 730, maxUsageCount: 3650, lastMaintenanceDate: '2026-04-01', nextMaintenanceDate: '2026-07-01', status: '待维护', location: 'B1 洗衣房', warrantyExpireDate: '2027-01-31', maintenanceHistoryCount: 3, remark: '排水有异响', updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ014', name: '母乳分析仪', model: 'MILK-ANALYZER-PRO', serialNumber: 'SN2024MAP001', category: '监测设备', purchaseDate: '2024-04-15', purchasePrice: 18500, usageCount: 412, maxUsageCount: 3000, lastMaintenanceDate: '2026-04-15', nextMaintenanceDate: '2026-07-15', status: '正常', location: '5楼 母乳喂养室', warrantyExpireDate: '2027-04-14', maintenanceHistoryCount: 1, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ015', name: '婴儿体重秤', model: 'BABY-SCALE-DIGITAL', serialNumber: 'SN2024BSD001', category: '监测设备', purchaseDate: '2024-01-25', purchasePrice: 1500, usageCount: 2680, maxUsageCount: 10000, lastMaintenanceDate: '2026-05-25', nextMaintenanceDate: '2026-08-25', status: '使用中', location: '新生儿护理室', warrantyExpireDate: '2027-01-24', maintenanceHistoryCount: 2, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ016', name: '产后骨盆修复仪', model: 'PELVIC-RESTORE-X2', serialNumber: 'SN2024PRX201', category: '康复设备', purchaseDate: '2024-03-20', purchasePrice: 22000, usageCount: 186, maxUsageCount: 2000, lastMaintenanceDate: '2026-03-20', nextMaintenanceDate: '2026-06-20', status: '待维护', location: '4楼 康复室', warrantyExpireDate: '2026-09-19', maintenanceHistoryCount: 2, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ017', name: '智能呼叫系统主机', model: 'CALL-SYSTEM-CENTRAL', serialNumber: 'SN2023CSC001', category: '办公设备', purchaseDate: '2023-12-15', purchasePrice: 35000, usageCount: 0, maxUsageCount: 99999, lastMaintenanceDate: '2026-05-15', nextMaintenanceDate: '2026-11-15', status: '使用中', location: '1楼 中控室', warrantyExpireDate: '2028-12-14', maintenanceHistoryCount: 2, updateTime: '2026-06-17 08:00:00' },
  { id: 'EQ018', name: '紫外线消毒车', model: 'UV-DISINFECT-CART', serialNumber: 'SN2024UDC001', category: '环境设备', purchaseDate: '2024-01-30', purchasePrice: 2800, usageCount: 365, maxUsageCount: 3650, lastMaintenanceDate: '2026-05-30', nextMaintenanceDate: '2026-08-30', status: '正常', location: '各楼层共用', warrantyExpireDate: '2026-07-29', maintenanceHistoryCount: 1, remark: '7月灯管到期', updateTime: '2026-06-17 08:00:00' },
];

export const maintenanceWorkOrders: MaintenanceWorkOrder[] = [
  { id: 'WO001', title: '电动护理床升降功能检修', equipmentId: 'EQ003', equipmentName: '多功能电动护理床', equipmentModel: 'NURSE-BED-8000', orderType: '故障维修', priority: '高', status: '处理中', description: '客户反馈床位升降时偶尔卡顿，特别是升到最高位时下降有异响。需立即检修，避免影响客户使用。', assigneeId: 'ENG001', assigneeName: '王工程师', createTime: '2026-06-16 09:30:00', startTime: '2026-06-16 14:00:00', estimatedDuration: 120, sparePartsUsed: [], totalCost: 0, failureReason: '待排查', solution: '', remark: '405室客户预计后天退房，需抓紧处理', updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO002', title: '产后康复治疗仪电极片更换', equipmentId: 'EQ006', equipmentName: '产后康复治疗仪', equipmentModel: 'REHAB-PLUS-3000', orderType: '保养', priority: '中', status: '待处理', description: '电极片使用已超过3个月，按保养规程需更换全新电极片，确保治疗效果和卫生安全。', assigneeId: 'ENG001', assigneeName: '王工程师', createTime: '2026-06-15 10:00:00', estimatedDuration: 45, sparePartsUsed: [{ partId: 'SP001', partName: '电极片套装', quantity: 1, unitPrice: 580 }], totalCost: 580, updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO003', title: '医用洗衣机排水异响维修', equipmentId: 'EQ013', equipmentName: '医用洗衣机', equipmentModel: 'MED-WASH-25KG', orderType: '故障维修', priority: '高', status: '已完成', description: '洗衣机排水时发出异常金属摩擦声，经检查为排水泵轴承磨损。', assigneeId: 'ENG002', assigneeName: '李工程师', createTime: '2026-06-14 16:20:00', startTime: '2026-06-14 18:00:00', completeTime: '2026-06-15 10:30:00', estimatedDuration: 90, actualDuration: 105, sparePartsUsed: [{ partId: 'SP002', partName: '排水泵总成', quantity: 1, unitPrice: 1280 }], totalCost: 1280, failureReason: '排水泵轴承长期使用磨损导致异响', solution: '更换全新排水泵总成，加涂防水密封胶，测试运行3次正常', updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO004', title: '中央空调季度维保', equipmentId: 'EQ011', equipmentName: '中央空调系统', equipmentModel: 'VRV-SMART-100', orderType: '定期维护', priority: '中', status: '待处理', description: '按季度维保计划执行：1.清洗过滤网 2.检查冷媒压力 3.清理室外机散热片 4.电气线路检查 5.运行参数校准。', createTime: '2026-06-10 11:00:00', estimatedDuration: 240, sparePartsUsed: [], totalCost: 0, updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO005', title: '骨盆修复仪月度保养', equipmentId: 'EQ016', equipmentName: '产后骨盆修复仪', equipmentModel: 'PELVIC-RESTORE-X2', orderType: '定期维护', priority: '低', status: '已延期', description: '原定6月15日执行月度保养，因工程师外出培训需延期。内容包括：气压校准、气囊检查、线路紧固、外观清洁。', assigneeId: 'ENG001', assigneeName: '王工程师', createTime: '2026-06-08 14:00:00', estimatedDuration: 60, sparePartsUsed: [], remark: '预计6月18日可执行', updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO006', title: '空气净化器滤网批量更换', equipmentId: 'EQ010', equipmentName: '空气净化器', equipmentModel: 'AIR-PURE-X800', orderType: '保养', priority: '中', status: '处理中', description: '共30台空气净化器滤网使用已达6个月，需分批更换HEPA滤网和活性炭滤网。', assigneeId: 'ENG002', assigneeName: '李工程师', createTime: '2026-06-15 09:00:00', startTime: '2026-06-16 09:00:00', estimatedDuration: 480, sparePartsUsed: [{ partId: 'SP003', partName: 'HEPA滤网', quantity: 15, unitPrice: 180 }, { partId: 'SP004', partName: '活性炭滤网', quantity: 15, unitPrice: 120 }], totalCost: 4500, solution: '已完成2-3楼共16台更换', updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO007', title: '黄疸治疗仪定期校准', equipmentId: 'EQ005', equipmentName: '新生儿黄疸治疗仪', equipmentModel: 'JAUNDICE-LITE-PRO', orderType: '定期维护', priority: '中', status: '已完成', description: '蓝光强度校准、计时器校验、散热系统清理、安全性能检测。', assigneeId: 'ENG001', assigneeName: '王工程师', createTime: '2026-06-10 10:00:00', startTime: '2026-06-12 14:00:00', completeTime: '2026-06-12 15:20:00', estimatedDuration: 80, actualDuration: 80, sparePartsUsed: [], totalCost: 0, failureReason: '', solution: '蓝光强度420nm波长正常，计时准确，散热良好', updateTime: '2026-06-17 08:00:00' } as any,
  { id: 'WO008', title: '新风系统风量检测', equipmentId: 'EQ012', equipmentName: '新风系统', equipmentModel: 'FRESH-AIR-5000', orderType: '定期维护', priority: '低', status: '待处理', description: '检测各楼层新风送风量、回风比例、PM2.5过滤效率，确保空气质量达标。', createTime: '2026-06-12 15:30:00', estimatedDuration: 180, updateTime: '2026-06-17 08:00:00' } as any,
];

export const kpiData: KPIData[] = [
  { label: '实时入住率', value: 66.7, unit: '%', trend: 'up', trendValue: 3.2, icon: 'Home', color: '#E91E63' },
  { label: '在住客户数', value: 20, unit: '人', trend: 'flat', trendValue: 0, icon: 'Users', color: '#00ACC1' },
  { label: '今日任务总数', value: 50, unit: '项', trend: 'up', trendValue: 8, icon: 'ListTodo', color: '#2196F3' },
  { label: '任务完成率', value: 68, unit: '%', trend: 'down', trendValue: -4.5, icon: 'CheckCircle2', color: '#4CAF50' },
  { label: '库存预警数', value: 6, unit: '项', trend: 'up', trendValue: 2, icon: 'PackageAlert', color: '#FF9800' },
  { label: '待审批方案', value: 3, unit: '份', trend: 'flat', trendValue: 0, icon: 'FileCheck', color: '#9C27B0' },
  { label: '在岗护理师', value: 9, unit: '人', trend: 'down', trendValue: -1, icon: 'HeartHandshake', color: '#673AB7' },
  { label: '平均满意度', value: 4.82, unit: '分', trend: 'up', trendValue: 0.05, icon: 'Star', color: '#FF9800' },
];

export const alertNotifications: AlertNotification[] = [
  { id: 'AL001', type: '超时任务', title: '任务超时预警', content: 'T0023伤口护理换药任务已超过计划时间30分钟未完成，请护士长及时跟进处理', level: 'danger', relatedId: 'T0023', read: false, createTime: '2026-06-17 10:05:00' },
  { id: 'AL002', type: '超时任务', title: '任务超时预警', content: 'T0041产后心理疏导任务已超时20分钟，护理师周梦瑶仍未开始执行', level: 'warning', relatedId: 'T0041', read: false, createTime: '2026-06-17 09:50:00' },
  { id: 'AL003', type: '低库存', title: '原材料紧缺', content: '鲜虾(I004)当前库存3.5kg，已低于安全库存4kg，请尽快安排采购补货', level: 'danger', relatedId: 'I004', read: false, createTime: '2026-06-17 08:30:00' },
  { id: 'AL004', type: '低库存', title: '原材料紧缺', content: '智利车厘子(I016)库存仅剩2.8kg，VIP客户专供，需紧急补货', level: 'danger', relatedId: 'I016', read: true, createTime: '2026-06-17 08:25:00' },
  { id: 'AL005', type: '低库存', title: '库存预警', content: '有机菠菜(I019)库存3.2kg低于安全线4kg，今日下午预计有配送', level: 'warning', relatedId: 'I019', read: false, createTime: '2026-06-17 08:20:00' },
  { id: 'AL006', type: '待审批', title: '护理方案待审批', content: '客户陈美丽(CP018)个性化照护方案已提交，请护士长在24小时内审批', level: 'warning', relatedId: 'CP018', read: false, createTime: '2026-06-17 08:00:00' },
  { id: 'AL007', type: '待审批', title: '护理方案调整待审批', content: '客户杨思远(CP020)照护方案申请调整分娩方式相关内容，待审批', level: 'info', relatedId: 'CP020', read: true, createTime: '2026-06-16 17:30:00' },
  { id: 'AL008', type: '设备异常', title: '设备待维护提醒', content: '多功能电动护理床(EQ003)明日(6月20日)到期需维护，请提前安排工单', level: 'warning', relatedId: 'EQ003', read: false, createTime: '2026-06-17 07:50:00' },
  { id: 'AL009', type: '健康预警', title: '新生儿黄疸偏高', content: '客户赵雨萱之女新生儿黄疸指数14.8，建议增加光照治疗并密切观察', level: 'danger', relatedId: 'C007', read: false, createTime: '2026-06-17 07:30:00' },
  { id: 'AL010', type: '设备异常', title: '维保工单延期', content: '产后骨盆修复仪(EQ016)月度保养工单WO005已延期2天，请尽快处理', level: 'warning', relatedId: 'WO005', read: true, createTime: '2026-06-17 07:00:00' },
];

export const spareParts: SparePart[] = [
  { id: 'SP001', name: '电极片套装', category: '康复设备配件', unit: '套', currentStock: 8, safeStock: 10, maxStock: 30, status: '预警', unitPrice: 580, supplier: '康复医疗配件', lastRestockDate: '2026-05-20', location: '备件库A区-01', compatibleModels: ['REHAB-PLUS-3000'] },
  { id: 'SP002', name: '排水泵总成', category: '环境设备配件', unit: '个', currentStock: 2, safeStock: 3, maxStock: 10, status: '预警', unitPrice: 1280, supplier: '家电配件商城', lastRestockDate: '2026-05-10', location: '备件库A区-02', compatibleModels: ['MED-WASH-25KG'] },
  { id: 'SP003', name: 'HEPA滤网', category: '环境设备配件', unit: '套', currentStock: 15, safeStock: 20, maxStock: 50, status: '预警', unitPrice: 180, supplier: '飞利浦授权商', lastRestockDate: '2026-05-25', location: '备件库A区-03', compatibleModels: ['AIR-PURE-X800'] },
  { id: 'SP004', name: '活性炭滤网', category: '环境设备配件', unit: '套', currentStock: 15, safeStock: 20, maxStock: 50, status: '预警', unitPrice: 120, supplier: '飞利浦授权商', lastRestockDate: '2026-05-25', location: '备件库A区-03', compatibleModels: ['AIR-PURE-X800'] },
  { id: 'SP005', name: '紫外线消毒灯管', category: '环境设备配件', unit: '支', currentStock: 3, safeStock: 4, maxStock: 15, status: '预警', unitPrice: 180, supplier: '雪莱特官方', lastRestockDate: '2026-04-20', location: '备件库B区-01', compatibleModels: ['UV-DISINFECT-CART'] },
  { id: 'SP006', name: '婴儿恒温床传感器', category: '母婴护理配件', unit: '个', currentStock: 12, safeStock: 8, maxStock: 25, status: '正常', unitPrice: 450, supplier: '医疗传感器厂家', lastRestockDate: '2026-05-15', location: '备件库B区-02', compatibleModels: ['SMART-CRIB-PRO-V2'] },
  { id: 'SP007', name: '监护仪导联线', category: '监测设备配件', unit: '套', currentStock: 6, safeStock: 5, maxStock: 15, status: '正常', unitPrice: 680, supplier: '迈瑞医疗配件', lastRestockDate: '2026-05-20', location: '备件库B区-03', compatibleModels: ['ECG-MONITOR-500'] },
  { id: 'SP008', name: '护理床升降电机', category: '母婴护理配件', unit: '台', currentStock: 1, safeStock: 2, maxStock: 5, status: '紧缺', unitPrice: 2200, supplier: '德国进口配件', lastRestockDate: '2026-03-15', location: '备件库C区-01', compatibleModels: ['NURSE-BED-8000'] },
  { id: 'SP009', name: '骨盆修复仪气囊', category: '康复设备配件', unit: '套', currentStock: 4, safeStock: 3, maxStock: 10, status: '正常', unitPrice: 850, supplier: '康复设备原厂', lastRestockDate: '2026-05-10', location: '备件库C区-02', compatibleModels: ['PELVIC-RESTORE-X2'] },
  { id: 'SP010', name: '温度传感器探头', category: '监测设备配件', unit: '个', currentStock: 18, safeStock: 10, maxStock: 30, status: '正常', unitPrice: 120, supplier: '医疗电子配件', lastRestockDate: '2026-06-01', location: '备件库C区-03', compatibleModels: ['TEMP-SCAN-300', 'BODY-SCALE-PRO'] },
  { id: 'SP011', name: '母乳分析仪试剂', category: '监测设备配件', unit: '盒', currentStock: 2, safeStock: 5, maxStock: 20, status: '紧缺', unitPrice: 980, supplier: '进口医疗试剂', lastRestockDate: '2026-04-25', location: '备件库D区-01', compatibleModels: ['MILK-ANALYZER-PRO'] },
  { id: 'SP012', name: '中央空调冷媒', category: '环境设备配件', unit: '罐', currentStock: 8, safeStock: 6, maxStock: 20, status: '正常', unitPrice: 450, supplier: '大金官方配件', lastRestockDate: '2026-05-15', location: '备件库D区-02', compatibleModels: ['VRV-SMART-100'] },
  { id: 'SP013', name: '新生儿蓝光灯管', category: '母婴护理配件', unit: '支', currentStock: 5, safeStock: 4, maxStock: 12, status: '正常', unitPrice: 380, supplier: '医用光学配件', lastRestockDate: '2026-05-20', location: '备件库D区-03', compatibleModels: ['JAUNDICE-LITE-PRO'] },
];

export const statisticsData: StatisticsData[] = [
  { period: '2026-01', checkInCount: 42, checkOutCount: 38, occupancyRate: 62.3, satisfactionAverage: 4.68, taskCompletionRate: 91.2 },
  { period: '2026-02', checkInCount: 38, checkOutCount: 36, occupancyRate: 58.5, satisfactionAverage: 4.71, taskCompletionRate: 89.5 },
  { period: '2026-03', checkInCount: 52, checkOutCount: 45, occupancyRate: 71.8, satisfactionAverage: 4.75, taskCompletionRate: 92.8 },
  { period: '2026-04', checkInCount: 56, checkOutCount: 50, occupancyRate: 75.2, satisfactionAverage: 4.79, taskCompletionRate: 93.5 },
  { period: '2026-05', checkInCount: 61, checkOutCount: 58, occupancyRate: 78.6, satisfactionAverage: 4.83, taskCompletionRate: 94.2 },
  { period: '2026-06', checkInCount: 20, checkOutCount: 15, occupancyRate: 66.7, satisfactionAverage: 4.82, taskCompletionRate: 88.6 },
];