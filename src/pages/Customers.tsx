import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Plus,
  UserPlus,
  X,
  Calendar,
  BedDouble,
  CheckCircle2,
  Clock,
  Star,
  Baby,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Smile,
  Moon,
  Scale,
  Ruler,
  Stethoscope,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Customer, RoomType, DeliveryMethod } from '@/types';
import { customers as mockCustomers, rooms as mockRooms, nurses as mockNurses } from '@/data/mockData';
import { cn } from '@/lib/utils';

type CustomerStatus = Customer['status'] | '全部';
type RoomTypeFilter = RoomType | '全部';

interface CustomerFormData {
  motherName: string;
  motherAge: number;
  phone: string;
  idCard: string;
  emergencyContact: string;
  emergencyPhone: string;
  roomNumber: string;
  deliveryMethod: DeliveryMethod;
  deliveryDate: string;
  checkInDate: string;
  expectedCheckOutDate: string;
  babyCount: number;
  babyName: string;
  babyGender: '男' | '女';
  birthWeight: number;
  birthLength: number;
  motherSameRoom: boolean;
  dietaryRestrictions: string;
  allergies: string;
  primaryNurseId: string;
  remark: string;
}

const initialFormData: CustomerFormData = {
  motherName: '',
  motherAge: 28,
  phone: '',
  idCard: '',
  emergencyContact: '',
  emergencyPhone: '',
  roomNumber: '',
  deliveryMethod: '顺产',
  deliveryDate: '',
  checkInDate: '',
  expectedCheckOutDate: '',
  babyCount: 1,
  babyName: '',
  babyGender: '女',
  birthWeight: 3.2,
  birthLength: 50,
  motherSameRoom: true,
  dietaryRestrictions: '',
  allergies: '',
  primaryNurseId: '',
  remark: '',
};

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const colors = [
    'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  ];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div className={cn(
      sizeClass,
      colors[colorIndex],
      'rounded-full flex items-center justify-center text-white font-semibold shrink-0'
    )}>
      {name.slice(0, 1)}
    </div>
  );
}

function StatusBadge({ status }: { status: Customer['status'] }) {
  const styles: Record<Customer['status'], string> = {
    '待入住': 'bg-amber-100 text-amber-700 border-amber-200',
    '在住': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '已退房': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-xs font-medium border',
      styles[status]
    )}>
      {status}
    </span>
  );
}

function DeliveryBadge({ method }: { method: DeliveryMethod }) {
  const colors: Record<DeliveryMethod, string> = {
    '顺产': 'bg-green-100 text-green-700',
    '剖宫产': 'bg-blue-100 text-blue-700',
    '顺产侧切': 'bg-cyan-100 text-cyan-700',
    '产钳助产': 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', colors[method])}>
      {method}
    </span>
  );
}

function RatingStars({ score }: { score?: number }) {
  if (!score) return <span className="text-slate-400 text-xs">--</span>;
  return (
    <div className="flex items-center gap-0.5">
      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-slate-700">{score.toFixed(1)}</span>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<RoomTypeFilter>('全部');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus>('全部');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !c.motherName.toLowerCase().includes(q) &&
          !c.phone.includes(q) &&
          !c.roomNumber.includes(q)
        ) return false;
      }
      if (statusFilter !== '全部' && c.status !== statusFilter) return false;
      if (roomTypeFilter !== '全部') {
        const room = mockRooms.find(r => r.id === c.roomId);
        if (room?.roomType !== roomTypeFilter) return false;
      }
      if (dateFrom && c.checkInDate < dateFrom) return false;
      if (dateTo && c.checkInDate > dateTo) return false;
      return true;
    });
  }, [customers, searchQuery, statusFilter, roomTypeFilter, dateFrom, dateTo]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const getRoomType = (customer: Customer): RoomType => {
    return mockRooms.find(r => r.id === customer.roomId)?.roomType || '标准间';
  };

  const generateGrowthData = (customer: Customer) => {
    const baby = customer.babies[0];
    if (!baby) return [];
    const baseWeight = baby.birthWeight;
    const baseLength = baby.birthLength;
    const daysIn = Math.floor(
      (new Date().getTime() - new Date(customer.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalDays = Math.max(daysIn, 7);
    return Array.from({ length: 7 }).map((_, i) => {
      const day = Math.floor(totalDays * (i + 1) / 7);
      return {
        day: `第${day}天`,
        体重: Number((baseWeight + (0.02 + Math.random() * 0.02) * day).toFixed(2)),
        身长: baseLength + (0.15 + Math.random() * 0.1) * day,
      };
    });
  };

  const handleSubmit = () => {
    const newCustomer: Customer = {
      id: `C${String(customers.length + 1).padStart(3, '0')}`,
      motherName: formData.motherName,
      motherAge: formData.motherAge,
      phone: formData.phone,
      idCard: formData.idCard,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      roomId: mockRooms.find(r => r.roomNumber === formData.roomNumber)?.id || 'RM001',
      roomNumber: formData.roomNumber,
      deliveryMethod: formData.deliveryMethod,
      deliveryDate: formData.deliveryDate,
      babyCount: formData.babyCount,
      babies: [{
        babyName: formData.babyName,
        gender: formData.babyGender,
        birthDate: formData.deliveryDate,
        birthWeight: formData.birthWeight,
        birthLength: formData.birthLength,
        currentWeight: formData.birthWeight,
        currentLength: formData.birthLength,
        apgarScore: 9,
        feedingMethod: '纯母乳',
        feedingTimesPerDay: 10,
        sleepHoursPerDay: 18,
        temperature: 36.8,
        heartRate: 120,
        jaundiceIndex: 5,
        stoolFrequency: 4,
        vaccinationRecords: ['乙肝疫苗第一针', '卡介苗'],
        recordTime: new Date().toISOString(),
      }],
      checkInDate: formData.checkInDate,
      expectedCheckOutDate: formData.expectedCheckOutDate,
      motherSameRoom: formData.motherSameRoom,
      healthRecords: [{
        bloodPressure: '115/75',
        bloodSugar: '5.2',
        heartRate: 78,
        temperature: 36.6,
        woundRecovery: '良好',
        uterineContraction: '良好',
        lochiaStatus: '正常',
        moodStatus: '愉悦',
        sleepQuality: '良好',
        recordTime: new Date().toISOString(),
      }],
      dietaryRestrictions: formData.dietaryRestrictions ? formData.dietaryRestrictions.split(/[,，]/) : [],
      allergies: formData.allergies ? formData.allergies.split(/[,，]/) : [],
      carePlanId: `CP${String(customers.length + 1).padStart(3, '0')}`,
      primaryNurseId: formData.primaryNurseId,
      status: '待入住',
      remark: formData.remark,
      createTime: new Date().toISOString(),
    };
    setCustomers([newCustomer, ...customers]);
    setDrawerOpen(false);
    setFormStep(0);
    setFormData(initialFormData);
  };

  const stepTitles = ['基本信息', '母婴信息', '健康档案'];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">客户管理</h1>
            <p className="text-sm text-slate-500 mt-0.5">管理在住及历史客户信息，查看母婴健康档案</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            入住登记
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-72 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
          <div className="p-4 space-y-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Filter className="w-4 h-4 text-pink-500" />
              搜索筛选
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">关键词搜索</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="姓名 / 电话 / 房间号"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">房型</label>
              <select
                value={roomTypeFilter}
                onChange={e => setRoomTypeFilter(e.target.value as RoomTypeFilter)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
              >
                <option value="全部">全部房型</option>
                <option value="标准间">标准间</option>
                <option value="豪华间">豪华间</option>
                <option value="VIP套房">VIP套房</option>
                <option value="总统套房">总统套房</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">状态</label>
              <div className="grid grid-cols-2 gap-2">
                {(['全部', '待入住', '在住', '已退房'] as CustomerStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      statusFilter === s
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">入住日期范围</label>
              <div className="space-y-2">
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                  />
                </div>
                <div className="text-center text-xs text-slate-400">至</div>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchQuery('');
                setRoomTypeFilter('全部');
                setStatusFilter('全部');
                setDateFrom('');
                setDateTo('');
              }}
              className="w-full py-2 text-sm text-slate-500 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
            >
              重置筛选
            </button>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="text-xs font-medium text-slate-600">客户统计</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-amber-50">
                  <div className="text-lg font-bold text-amber-600">
                    {customers.filter(c => c.status === '待入住').length}
                  </div>
                  <div className="text-[10px] text-amber-600 mt-0.5">待入住</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <div className="text-lg font-bold text-emerald-600">
                    {customers.filter(c => c.status === '在住').length}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">在住</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-100">
                  <div className="text-lg font-bold text-slate-600">
                    {customers.filter(c => c.status === '已退房').length}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">已退房</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="w-10 px-3 py-3"></th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">客户</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">房间</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">入住日期</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">分娩方式</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">评分</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">状态</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredCustomers.map(customer => (
                      <>
                        <tr
                          key={customer.id}
                          className={cn(
                            'hover:bg-pink-50/40 transition-colors cursor-pointer',
                            expandedRows.has(customer.id) && 'bg-pink-50/30'
                          )}
                          onClick={() => toggleExpand(customer.id)}
                        >
                          <td className="px-3 py-4">
                            {expandedRows.has(customer.id) ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={customer.motherName} />
                              <div>
                                <div className="font-medium text-slate-800 text-sm">{customer.motherName}</div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {customer.babyCount}宝 · {customer.motherAge}岁 · {customer.phone}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <BedDouble className="w-4 h-4 text-pink-400" />
                              <div>
                                <div className="text-sm font-medium text-slate-700">{customer.roomNumber}</div>
                                <div className="text-[11px] text-slate-400">{getRoomType(customer)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-700">{customer.checkInDate}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              预计{customer.expectedCheckOutDate}离店
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <DeliveryBadge method={customer.deliveryMethod} />
                          </td>
                          <td className="px-4 py-4">
                            <RatingStars score={customer.satisfactionScore} />
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={customer.status} />
                          </td>
                          <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-1.5 text-slate-500 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors" title="查看详情">
                                <Activity className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="编辑">
                                <UserPlus className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="完成">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedRows.has(customer.id) && (
                          <tr key={customer.id + '-expanded'} className="bg-gradient-to-b from-pink-50/50 to-white">
                            <td colSpan={8} className="px-6 py-6">
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                                      <Heart className="w-4 h-4 text-pink-500" />
                                    </div>
                                    <h3 className="font-semibold text-slate-800">母亲健康指标</h3>
                                  </div>
                                  {customer.healthRecords.map((record, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-3">
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-white border border-rose-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-rose-600 mb-1">
                                          <Activity className="w-3 h-3" /> 血压
                                        </div>
                                        <div className="text-base font-bold text-slate-800">{record.bloodPressure}</div>
                                      </div>
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50 to-white border border-violet-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-violet-600 mb-1">
                                          <Droplets className="w-3 h-3" /> 血糖
                                        </div>
                                        <div className="text-base font-bold text-slate-800">{record.bloodSugar} mmol/L</div>
                                      </div>
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-white border border-sky-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-sky-600 mb-1">
                                          <Stethoscope className="w-3 h-3" /> 心率
                                        </div>
                                        <div className="text-base font-bold text-slate-800">{record.heartRate} bpm</div>
                                      </div>
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 mb-1">
                                          <Thermometer className="w-3 h-3" /> 体温
                                        </div>
                                        <div className="text-base font-bold text-slate-800">{record.temperature} ℃</div>
                                      </div>
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 mb-1">
                                          <Smile className="w-3 h-3" /> 情绪
                                        </div>
                                        <div className="text-base font-bold text-slate-800">{record.moodStatus}</div>
                                      </div>
                                      <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100">
                                        <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 mb-1">
                                          <Moon className="w-3 h-3" /> 睡眠
                                        </div>
                                        <div className="text-base font-bold text-slate-800">{record.sleepQuality}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {customer.babies.map((baby, bIdx) => (
                                  <div key={bIdx} className="space-y-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                                        <Baby className="w-4 h-4 text-sky-500" />
                                      </div>
                                      <h3 className="font-semibold text-slate-800">
                                        {baby.babyName} · {baby.gender} · 生长曲线
                                      </h3>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                      <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                                        <div className="text-[10px] text-slate-500">出生体重</div>
                                        <div className="text-sm font-bold text-slate-700 flex items-center justify-center gap-1">
                                          <Scale className="w-3 h-3" />{baby.birthWeight}kg
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                                        <div className="text-[10px] text-slate-500">当前体重</div>
                                        <div className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1">
                                          <Scale className="w-3 h-3" />{baby.currentWeight}kg
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                                        <div className="text-[10px] text-slate-500">出生身长</div>
                                        <div className="text-sm font-bold text-slate-700 flex items-center justify-center gap-1">
                                          <Ruler className="w-3 h-3" />{baby.birthLength}cm
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-slate-50 text-center">
                                        <div className="text-[10px] text-slate-500">当前身长</div>
                                        <div className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1">
                                          <Ruler className="w-3 h-3" />{baby.currentLength}cm
                                        </div>
                                      </div>
                                    </div>
                                    <div className="h-56">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={generateGrowthData(customer)}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                          <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                          <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                                          <Legend wrapperStyle={{ fontSize: 12 }} />
                                          <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="体重"
                                            stroke="#f472b6"
                                            strokeWidth={2.5}
                                            dot={{ fill: '#f472b6', r: 4 }}
                                            activeDot={{ r: 6 }}
                                          />
                                          <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="身长"
                                            stroke="#38bdf8"
                                            strokeWidth={2.5}
                                            dot={{ fill: '#38bdf8', r: 4 }}
                                            activeDot={{ r: 6 }}
                                          />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="w-10 h-10 text-slate-300" />
                            <div className="text-sm">未找到符合条件的客户</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-500 text-right">
              共 {filteredCustomers.length} / {customers.length} 条记录
            </div>
          </div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-pink-500" />
                    入住登记
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">填写完整信息以创建新客户档案</p>
                </div>
                <button
                  onClick={() => { setDrawerOpen(false); setFormStep(0); }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5 flex items-center">
                {stepTitles.map((title, idx) => (
                  <>
                    <div key={title} className="flex items-center gap-2">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                        idx < formStep ? 'bg-emerald-500 text-white' :
                        idx === formStep ? 'bg-pink-500 text-white' :
                        'bg-slate-100 text-slate-400'
                      )}>
                        {idx < formStep ? '✓' : idx + 1}
                      </div>
                      <span className={cn(
                        'text-sm font-medium',
                        idx <= formStep ? 'text-slate-700' : 'text-slate-400'
                      )}>{title}</span>
                    </div>
                    {idx < stepTitles.length - 1 && (
                      <div key={idx + '-line'} className={cn(
                        'flex-1 h-0.5 mx-3 rounded',
                        idx < formStep ? 'bg-emerald-500' : 'bg-slate-200'
                      )} />
                    )}
                  </>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 space-y-5">
              {formStep === 0 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-pink-500 rounded" />
                      宝妈基本信息
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">姓名 *</label>
                        <input
                          type="text"
                          value={formData.motherName}
                          onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">年龄 *</label>
                        <input
                          type="number"
                          value={formData.motherAge}
                          onChange={e => setFormData({ ...formData, motherAge: +e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">联系电话 *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">身份证号</label>
                        <input
                          type="text"
                          value={formData.idCard}
                          onChange={e => setFormData({ ...formData, idCard: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">紧急联系人</label>
                        <input
                          type="text"
                          value={formData.emergencyContact}
                          onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">紧急联系电话</label>
                        <input
                          type="tel"
                          value={formData.emergencyPhone}
                          onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-sky-500 rounded" />
                      入住信息
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">分配房间 *</label>
                        <select
                          value={formData.roomNumber}
                          onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        >
                          <option value="">请选择房间</option>
                          {mockRooms.filter(r => r.status === '空闲').map(r => (
                            <option key={r.id} value={r.roomNumber}>
                              {r.roomNumber} - {r.roomType} (¥{r.pricePerDay}/天)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">主管护理师</label>
                        <select
                          value={formData.primaryNurseId}
                          onChange={e => setFormData({ ...formData, primaryNurseId: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        >
                          <option value="">请选择护理师</option>
                          {mockNurses.filter(n => n.currentStatus === '在岗').map(n => (
                            <option key={n.id} value={n.id}>
                              {n.name} - {n.nurseLevel}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">入住日期 *</label>
                        <input
                          type="date"
                          value={formData.checkInDate}
                          onChange={e => setFormData({ ...formData, checkInDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">预计离店日期 *</label>
                        <input
                          type="date"
                          value={formData.expectedCheckOutDate}
                          onChange={e => setFormData({ ...formData, expectedCheckOutDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formStep === 1 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-rose-500 rounded" />
                      分娩信息
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">分娩方式 *</label>
                        <select
                          value={formData.deliveryMethod}
                          onChange={e => setFormData({ ...formData, deliveryMethod: e.target.value as DeliveryMethod })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        >
                          <option value="顺产">顺产</option>
                          <option value="剖宫产">剖宫产</option>
                          <option value="顺产侧切">顺产侧切</option>
                          <option value="产钳助产">产钳助产</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">分娩日期 *</label>
                        <input
                          type="date"
                          value={formData.deliveryDate}
                          onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">宝宝数量</label>
                        <select
                          value={formData.babyCount}
                          onChange={e => setFormData({ ...formData, babyCount: +e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        >
                          <option value={1}>单胎</option>
                          <option value={2}>双胞胎</option>
                        </select>
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.motherSameRoom}
                            onChange={e => setFormData({ ...formData, motherSameRoom: e.target.checked })}
                            className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                          />
                          <span className="text-sm text-slate-700">母婴同室</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-sky-500 rounded" />
                      新生儿信息
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">宝宝姓名</label>
                        <input
                          type="text"
                          value={formData.babyName}
                          onChange={e => setFormData({ ...formData, babyName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">性别</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, babyGender: '男' })}
                            className={cn(
                              'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                              formData.babyGender === '男'
                                ? 'bg-sky-500 text-white border-sky-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                            )}
                          >男宝</button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, babyGender: '女' })}
                            className={cn(
                              'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                              formData.babyGender === '女'
                                ? 'bg-pink-500 text-white border-pink-500'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-pink-300'
                            )}
                          >女宝</button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">出生体重 (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.birthWeight}
                          onChange={e => setFormData({ ...formData, birthWeight: +e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">出生身长 (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={formData.birthLength}
                          onChange={e => setFormData({ ...formData, birthLength: +e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {formStep === 2 && (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-emerald-500 rounded" />
                      特殊需求
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">饮食忌口</label>
                        <input
                          type="text"
                          value={formData.dietaryRestrictions}
                          onChange={e => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                          placeholder="如：素食、不吃香菜等，多个用逗号分隔"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">过敏史</label>
                        <input
                          type="text"
                          value={formData.allergies}
                          onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                          placeholder="如：青霉素、海鲜等，多个用逗号分隔"
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">特殊备注</label>
                        <textarea
                          value={formData.remark}
                          onChange={e => setFormData({ ...formData, remark: e.target.value })}
                          rows={4}
                          placeholder="需要特别关注的情况..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-50 via-white to-sky-50 border border-pink-100">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-pink-500" />
                      信息确认
                    </h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">客户姓名</span>
                        <span className="font-medium text-slate-700">{formData.motherName || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">房间</span>
                        <span className="font-medium text-slate-700">{formData.roomNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">分娩方式</span>
                        <span className="font-medium text-slate-700">{formData.deliveryMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">宝宝</span>
                        <span className="font-medium text-slate-700">
                          {formData.babyName || '未命名'} · {formData.babyGender}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">入住日期</span>
                        <span className="font-medium text-slate-700">{formData.checkInDate || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">预计离店</span>
                        <span className="font-medium text-slate-700">{formData.expectedCheckOutDate || '-'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setFormStep(Math.max(0, formStep - 1))}
                disabled={formStep === 0}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-colors',
                  formStep === 0
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                上一步
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setDrawerOpen(false); setFormStep(0); }}
                  className="px-5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
                {formStep < stepTitles.length - 1 ? (
                  <button
                    onClick={() => setFormStep(formStep + 1)}
                    className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    下一步
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    提交登记
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
