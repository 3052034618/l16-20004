import { useState } from 'react';
import {
  Users, CalendarCheck, Package, ClipboardList, Bell, LineChart as LineChartIcon,
  BedDouble, Sparkles, AlertTriangle, CheckCircle, Info, AlertCircle,
  ChevronRight, Heart, Star
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import type { JSX } from 'react';

type RoomStatus = 'idle' | 'occupied' | 'cleaning' | 'maintenance';

interface Room {
  id: string;
  roomNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: RoomStatus;
}

interface NurseHeatPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  intensity: number;
}

interface FloorData {
  floor: number;
  rooms: Room[];
  nursePoints: NurseHeatPoint[];
}

interface KpiCard {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}

type NotificationType = 'warning' | 'success' | 'info' | 'danger' | 'care';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  target: string;
}

const roomStatusColors: Record<RoomStatus, string> = {
  idle: '#10b981',
  occupied: '#ec4899',
  cleaning: '#f59e0b',
  maintenance: '#9ca3af',
};

const roomStatusLabels: Record<RoomStatus, string> = {
  idle: '空闲',
  occupied: '占用',
  cleaning: '清洁中',
  maintenance: '维修中',
};

const notificationConfig: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
  border: string;
}> = {
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  success: { icon: CheckCircle, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  info: { icon: Info, bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200' },
  danger: { icon: AlertCircle, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  care: { icon: Heart, bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
};

const floorLayout: Record<number, FloorData> = {
  3: {
    floor: 3,
    rooms: [
      { id: '301', roomNumber: '301', x: 20, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '302', roomNumber: '302', x: 125, y: 20, width: 90, height: 60, status: 'idle' },
      { id: '303', roomNumber: '303', x: 230, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '304', roomNumber: '304', x: 335, y: 20, width: 90, height: 60, status: 'cleaning' },
      { id: '305', roomNumber: '305', x: 440, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '306', roomNumber: '306', x: 545, y: 20, width: 90, height: 60, status: 'idle' },
      { id: '307', roomNumber: '307', x: 20, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '308', roomNumber: '308', x: 125, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '309', roomNumber: '309', x: 230, y: 100, width: 90, height: 60, status: 'maintenance' },
      { id: '310', roomNumber: '310', x: 335, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '311', roomNumber: '311', x: 440, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '312', roomNumber: '312', x: 545, y: 100, width: 90, height: 60, status: 'cleaning' },
    ],
    nursePoints: [
      { id: 'n1', name: '李护士', x: 70, y: 50, intensity: 3 },
      { id: 'n2', name: '王护士', x: 280, y: 130, intensity: 2 },
      { id: 'n3', name: '张护士', x: 490, y: 50, intensity: 1 },
    ],
  },
  4: {
    floor: 4,
    rooms: [
      { id: '401', roomNumber: '401', x: 20, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '402', roomNumber: '402', x: 125, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '403', roomNumber: '403', x: 230, y: 20, width: 90, height: 60, status: 'idle' },
      { id: '404', roomNumber: '404', x: 335, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '405', roomNumber: '405', x: 440, y: 20, width: 90, height: 60, status: 'cleaning' },
      { id: '406', roomNumber: '406', x: 545, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '407', roomNumber: '407', x: 20, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '408', roomNumber: '408', x: 125, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '409', roomNumber: '409', x: 230, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '410', roomNumber: '410', x: 335, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '411', roomNumber: '411', x: 440, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '412', roomNumber: '412', x: 545, y: 100, width: 90, height: 60, status: 'maintenance' },
    ],
    nursePoints: [
      { id: 'n1', name: '赵护士', x: 170, y: 50, intensity: 2 },
      { id: 'n2', name: '钱护士', x: 380, y: 130, intensity: 3 },
      { id: 'n3', name: '孙护士', x: 590, y: 50, intensity: 1 },
    ],
  },
  5: {
    floor: 5,
    rooms: [
      { id: '501', roomNumber: '501', x: 20, y: 20, width: 90, height: 60, status: 'idle' },
      { id: '502', roomNumber: '502', x: 125, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '503', roomNumber: '503', x: 230, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '504', roomNumber: '504', x: 335, y: 20, width: 90, height: 60, status: 'cleaning' },
      { id: '505', roomNumber: '505', x: 440, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '506', roomNumber: '506', x: 545, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '507', roomNumber: '507', x: 20, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '508', roomNumber: '508', x: 125, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '509', roomNumber: '509', x: 230, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '510', roomNumber: '510', x: 335, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '511', roomNumber: '511', x: 440, y: 100, width: 90, height: 60, status: 'maintenance' },
      { id: '512', roomNumber: '512', x: 545, y: 100, width: 90, height: 60, status: 'idle' },
    ],
    nursePoints: [
      { id: 'n1', name: '周护士', x: 70, y: 130, intensity: 3 },
      { id: 'n2', name: '吴护士', x: 330, y: 50, intensity: 2 },
      { id: 'n3', name: '郑护士', x: 490, y: 130, intensity: 2 },
    ],
  },
  6: {
    floor: 6,
    rooms: [
      { id: '601', roomNumber: '601', x: 20, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '602', roomNumber: '602', x: 125, y: 20, width: 90, height: 60, status: 'idle' },
      { id: '603', roomNumber: '603', x: 230, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '604', roomNumber: '604', x: 335, y: 20, width: 90, height: 60, status: 'occupied' },
      { id: '605', roomNumber: '605', x: 440, y: 20, width: 90, height: 60, status: 'idle' },
      { id: '606', roomNumber: '606', x: 545, y: 20, width: 90, height: 60, status: 'cleaning' },
      { id: '607', roomNumber: '607', x: 20, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '608', roomNumber: '608', x: 125, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '609', roomNumber: '609', x: 230, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '610', roomNumber: '610', x: 335, y: 100, width: 90, height: 60, status: 'idle' },
      { id: '611', roomNumber: '611', x: 440, y: 100, width: 90, height: 60, status: 'occupied' },
      { id: '612', roomNumber: '612', x: 545, y: 100, width: 90, height: 60, status: 'occupied' },
    ],
    nursePoints: [
      { id: 'n1', name: '冯护士', x: 275, y: 50, intensity: 1 },
      { id: 'n2', name: '陈护士', x: 380, y: 130, intensity: 3 },
      { id: 'n3', name: '褚护士', x: 170, y: 130, intensity: 2 },
    ],
  },
};

const kpiCards: KpiCard[] = [
  {
    title: '入住率',
    value: 82,
    unit: '%',
    trend: 3.2,
    icon: BedDouble,
    gradient: 'from-primary-500 to-rose-400',
    iconBg: 'bg-white/20',
  },
  {
    title: '在住客户',
    value: 98,
    unit: '人',
    trend: 5,
    icon: Users,
    gradient: 'from-accent-500 to-cyan-400',
    iconBg: 'bg-white/20',
  },
  {
    title: '今日任务数',
    value: 156,
    unit: '项',
    trend: -2,
    icon: CalendarCheck,
    gradient: 'from-amber-500 to-orange-400',
    iconBg: 'bg-white/20',
  },
  {
    title: '完成率',
    value: 91,
    unit: '%',
    trend: 4.5,
    icon: ClipboardList,
    gradient: 'from-emerald-500 to-green-400',
    iconBg: 'bg-white/20',
  },
  {
    title: '库存预警',
    value: 12,
    unit: '项',
    trend: -1,
    icon: Package,
    gradient: 'from-violet-500 to-purple-400',
    iconBg: 'bg-white/20',
  },
  {
    title: '待审批方案',
    value: 8,
    unit: '个',
    trend: 2,
    icon: Sparkles,
    gradient: 'from-pink-500 to-fuchsia-400',
    iconBg: 'bg-white/20',
  },
];

const notifications: Notification[] = [
  { id: '1', type: 'danger', title: '紧急医疗呼叫', message: '305房间产妇请求紧急医疗协助', time: '2分钟前', target: '/customers/305' },
  { id: '2', type: 'warning', title: '库存不足预警', message: '婴儿纸尿裤库存低于安全阈值（剩余 5 包）', time: '15分钟前', target: '/inventory' },
  { id: '3', type: 'care', title: '新生儿护理提醒', message: '402房间宝宝已到疫苗接种时间', time: '30分钟前', target: '/schedules' },
  { id: '4', type: 'success', title: '护理方案已通过', message: '客户张晓梅护理方案审批通过', time: '1小时前', target: '/care-plans/102' },
  { id: '5', type: 'info', title: '新客户入住', message: '508房间客户王丽今日入住', time: '2小时前', target: '/rooms/508' },
  { id: '6', type: 'warning', title: '设备维护提醒', message: '6楼紫外线消毒灯需要定期维护', time: '3小时前', target: '/equipment' },
  { id: '7', type: 'danger', title: '房间异常警报', message: '309房间烟雾传感器触发警报（已确认误报）', time: '4小时前', target: '/rooms/309' },
  { id: '8', type: 'care', title: '产后康复提醒', message: '411房间产妇今日需进行盆底康复训练', time: '5小时前', target: '/schedules' },
  { id: '9', type: 'info', title: '员工换班通知', message: '夜班护理人员已到岗交接', time: '6小时前', target: '/staff' },
  { id: '10', type: 'success', title: '满意度调查完成', message: '本月客户满意度调研已收集完成，综合评分 4.8/5.0', time: '8小时前', target: '/reports' },
];

const chartData = [
  { date: '6/10', 入住率: 75, 满意度: 88, 新入住: 12 },
  { date: '6/11', 入住率: 78, 满意度: 90, 新入住: 15 },
  { date: '6/12', 入住率: 80, 满意度: 87, 新入住: 18 },
  { date: '6/13', 入住率: 77, 满意度: 92, 新入住: 10 },
  { date: '6/14', 入住率: 82, 满意度: 89, 新入住: 20 },
  { date: '6/15', 入住率: 85, 满意度: 91, 新入住: 22 },
  { date: '6/16', 入住率: 82, 满意度: 93, 新入住: 16 },
];

function KpiCardComponent({ card, delay }: { card: KpiCard; delay: number }): JSX.Element {
  const Icon = card.icon;
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-card-fade-in cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">{card.title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{card.value}</span>
              {card.unit && <span className="text-sm font-medium opacity-80">{card.unit}</span>}
            </div>
            {card.trend !== undefined && (
              <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${card.trend >= 0 ? 'bg-white/20' : 'bg-black/10'}`}>
                <span className={card.trend >= 0 ? 'text-white' : 'text-white/90'}>
                  {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
                </span>
                <span className="opacity-80">较昨日</span>
              </div>
            )}
          </div>
          <div className={`rounded-xl p-3 ${card.iconBg} backdrop-blur-sm`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-8 -bottom-8 opacity-20">
        <Icon className="h-32 w-32 text-white" />
      </div>
    </div>
  );
}

function FloorHeatMap(): JSX.Element {
  const [activeFloor, setActiveFloor] = useState<number>(3);
  const floors = [3, 4, 5, 6];
  const currentFloor = floorLayout[activeFloor];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">楼层热力图</h3>
          <p className="mt-1 text-sm text-gray-500">实时房间状态与护理师分布</p>
        </div>
        <div className="flex gap-2">
          {floors.map((floor) => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeFloor === floor
                  ? 'bg-gradient-to-r from-primary-500 to-rose-400 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {floor}F
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4">
        {(Object.keys(roomStatusColors) as RoomStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded"
              style={{ backgroundColor: roomStatusColors[status] }}
            />
            <span className="text-xs text-gray-600">{roomStatusLabels[status]}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-4">
            <div className="absolute inset-0 rounded-full bg-primary-500 animate-heat-pulse" />
          </div>
          <span className="text-xs text-gray-600">护理师</span>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <svg
          viewBox="0 0 660 200"
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="roomShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
            </filter>
            <radialGradient id="heatGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E91E63" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#E91E63" stopOpacity="0" />
            </radialGradient>
          </defs>

          {currentFloor.rooms.map((room) => (
            <g key={room.id} filter="url(#roomShadow)">
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                rx={8}
                ry={8}
                fill={roomStatusColors[room.status]}
                className="transition-all duration-300 cursor-pointer hover:opacity-80"
                stroke="white"
                strokeWidth={2}
              />
              <text
                x={room.x + room.width / 2}
                y={room.y + room.height / 2 + 5}
                textAnchor="middle"
                className="text-sm font-bold fill-white select-none pointer-events-none"
              >
                {room.roomNumber}
              </text>
            </g>
          ))}

          {currentFloor.nursePoints.map((point, idx) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={18 + point.intensity * 4}
                fill="url(#heatGradient)"
                className="animate-breathing"
                style={{ animationDelay: `${idx * 0.3}s` }}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={8}
                fill="#E91E63"
                stroke="white"
                strokeWidth={2}
                className="animate-heat-pulse"
                style={{ animationDelay: `${idx * 0.2}s` }}
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(['idle', 'occupied', 'cleaning', 'maintenance'] as RoomStatus[]).map((status) => {
          const count = currentFloor.rooms.filter((r) => r.status === status).length;
          return (
            <div key={status} className="rounded-lg bg-gray-50 p-3 text-center">
              <div className="text-2xl font-bold" style={{ color: roomStatusColors[status] }}>
                {count}
              </div>
              <div className="mt-1 text-xs text-gray-500">{roomStatusLabels[status]}房</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotificationList(): JSX.Element {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">预警通知</h3>
          <p className="mt-1 text-sm text-gray-500">最新 10 条系统通知</p>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100">
          <Bell className="h-4 w-4" />
          全部
        </button>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {notifications.map((notification, index) => {
          const config = notificationConfig[notification.type];
          const Icon = config.icon;
          return (
            <div
              key={notification.id}
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border ${config.border} ${config.bg} p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-card-fade-in`}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => {
                console.log('跳转至:', notification.target);
              }}
            >
              <div className={`flex-shrink-0 rounded-lg p-2 ${config.bg} border ${config.border}`}>
                <Icon className={`h-5 w-5 ${config.text}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">
                    {notification.title}
                  </h4>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 transition-transform group-hover:translate-x-1" />
                </div>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">{notification.message}</p>
                <p className="mt-2 text-xs text-gray-400">{notification.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniCharts(): JSX.Element {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">运营趋势概览</h3>
          <p className="mt-1 text-sm text-gray-500">近7日入住率与客户满意度</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary-500" />
            <span className="text-sm font-medium text-gray-700">平均入住率: 80%</span>
          </div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-accent-500" />
            <span className="text-sm font-medium text-gray-700">平均满意度: 90%</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E91E63" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#E91E63" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSatisfaction" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ACC1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00ACC1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={[0, 100]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={[0, 30]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                padding: '12px 16px',
              }}
              labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: '8px' }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
              iconSize={8}
            />
            <Bar
              yAxisId="right"
              dataKey="新入住"
              name="新入住人数"
              fill="#F8BBD0"
              radius={[4, 4, 0, 0]}
              barSize={24}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="入住率"
              name="入住率(%)"
              stroke="#E91E63"
              strokeWidth={3}
              dot={{ fill: '#E91E63', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="满意度"
              name="满意度(%)"
              stroke="#00ACC1"
              strokeWidth={3}
              dot={{ fill: '#00ACC1', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">运营数据驾驶舱</h1>
            <p className="mt-1 text-sm text-gray-500">实时掌握中心运营状况，智慧管理高效决策</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CalendarCheck className="h-4 w-4" />
            <span>2026年6月17日 星期三</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpiCards.map((card, index) => (
            <KpiCardComponent key={card.title} card={card} delay={index * 80} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <FloorHeatMap />
          </div>
          <div className="xl:col-span-1">
            <NotificationList />
          </div>
        </div>

        <MiniCharts />
      </div>
    </div>
  );
}
