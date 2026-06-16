import { useState, useMemo } from 'react';
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
import { useAppStore } from '../store';

type RoomStatus = 'idle' | 'occupied' | 'cleaning' | 'maintenance';

interface FloorRoom {
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
  rooms: FloorRoom[];
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

const nurseNames = ['李护士', '王护士', '张护士', '赵护士', '钱护士', '孙护士', '周护士', '吴护士', '郑护士', '冯护士', '陈护士', '褚护士'];

const chartData = [
  { date: '6/10', 入住率: 75, 满意度: 88, 新入住: 12 },
  { date: '6/11', 入住率: 78, 满意度: 90, 新入住: 15 },
  { date: '6/12', 入住率: 80, 满意度: 87, 新入住: 18 },
  { date: '6/13', 入住率: 77, 满意度: 92, 新入住: 10 },
  { date: '6/14', 入住率: 82, 满意度: 89, 新入住: 20 },
  { date: '6/15', 入住率: 85, 满意度: 91, 新入住: 22 },
  { date: '6/16', 入住率: 82, 满意度: 93, 新入住: 16 },
];

function mapStatusToRoomStatus(status: string): RoomStatus {
  switch (status) {
    case '已入住': return 'occupied';
    case '空闲': return 'idle';
    case '清洁中': return 'cleaning';
    case '维修中': return 'maintenance';
    default: return 'idle';
  }
}

function generateFloorLayout(rooms: any[]): Record<number, FloorData> {
  const floorRoomsMap: Record<number, any[]> = {};
  const floors = [3, 4, 5, 6];

  floors.forEach(floor => {
    floorRoomsMap[floor] = [];
  });

  rooms.forEach(room => {
    const floor = parseInt(room.roomNumber.slice(0, 1));
    if (floorRoomsMap[floor]) {
      floorRoomsMap[floor].push(room);
    }
  });

  const layout: Record<number, FloorData> = {};

  floors.forEach(floor => {
    const floorRooms = floorRoomsMap[floor]
      .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber));

    const gridRooms: FloorRoom[] = floorRooms.map((room, idx) => {
      const col = idx % 6;
      const row = Math.floor(idx / 6);
      const x = 20 + col * 105;
      const y = 20 + row * 80;
      return {
        id: room.id,
        roomNumber: room.roomNumber,
        x,
        y,
        width: 90,
        height: 60,
        status: mapStatusToRoomStatus(room.status),
      };
    });

    const nurseCount = 3;
    const seed = floor * 3;
    const nursePoints: NurseHeatPoint[] = Array.from({ length: nurseCount }, (_, i) => ({
      id: `n${floor}-${i}`,
      name: nurseNames[(seed + i) % nurseNames.length],
      x: 70 + i * 210 + (floor % 2) * 50,
      y: i % 2 === 0 ? 50 : 130,
      intensity: (i + floor) % 3 + 1,
    }));

    layout[floor] = {
      floor,
      rooms: gridRooms,
      nursePoints,
    };
  });

  return layout;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.max(0, now.getTime() - date.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

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
  const rooms = useAppStore(state => state.rooms);

  const floorLayout = useMemo(() => generateFloorLayout(rooms), [rooms]);
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
  const careTasks = useAppStore(state => state.careTasks);
  const inventoryItems = useAppStore(state => state.inventoryItems);
  const carePlans = useAppStore(state => state.carePlans);

  const notifications = useMemo<Notification[]>(() => {
    const list: Notification[] = [];

    const overdueTasks = careTasks.filter(t => t.isOverdue).slice(0, 4);
    overdueTasks.forEach(task => {
      list.push({
        id: `task-${task.id}`,
        type: 'danger',
        title: '任务超时提醒',
        message: `${task.roomNumber} ${task.customerName} - ${task.taskName}已超时，请尽快处理`,
        time: timeAgo(task.scheduledTime),
        target: `/schedules`,
      });
    });

    const warningItems = inventoryItems.filter(i => i.status === '预警' || i.status === '紧缺').slice(0, 3);
    warningItems.forEach(item => {
      list.push({
        id: `inv-${item.id}`,
        type: 'warning',
        title: item.status === '紧缺' ? '库存紧缺预警' : '库存不足预警',
        message: `${item.name}库存${item.status}（剩余 ${item.currentStock} ${item.unit}），请及时补货`,
        time: timeAgo(item.updateTime),
        target: `/inventory`,
      });
    });

    const pendingPlans = carePlans.filter(p => p.status === '待审批').slice(0, 3);
    pendingPlans.forEach(plan => {
      list.push({
        id: `plan-${plan.id}`,
        type: 'info',
        title: '护理方案待审批',
        message: `${plan.roomNumber} ${plan.customerName} - ${plan.planName}等待审批`,
        time: timeAgo(plan.createTime),
        target: `/care-plans/${plan.id}`,
      });
    });

    return list.slice(0, 10);
  }, [careTasks, inventoryItems, carePlans]);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">预警通知</h3>
          <p className="mt-1 text-sm text-gray-500">最新系统通知</p>
        </div>
        <button className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-100">
          <Bell className="h-4 w-4" />
          全部
        </button>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">暂无预警通知</p>
          </div>
        ) : (
          notifications.map((notification, index) => {
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
          })
        )}
      </div>
    </div>
  );
}

function MiniCharts(): JSX.Element {
  const rooms = useAppStore(state => state.rooms);
  const customers = useAppStore(state => state.customers);

  const avgOccupancy = useMemo(() => {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === '已入住').length;
    return total > 0 ? Math.round((occupied / total) * 100) : 0;
  }, [rooms]);

  const avgSatisfaction = useMemo(() => {
    const inHouse = customers.filter(c => c.status === '在住');
    if (inHouse.length === 0) return 0;
    const total = inHouse.reduce((s, c) => s + (c.satisfactionScore ?? 0), 0);
    return Math.round((total / inHouse.length) * 20);
  }, [customers]);

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
            <span className="text-sm font-medium text-gray-700">平均入住率: {avgOccupancy}%</span>
          </div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-accent-500" />
            <span className="text-sm font-medium text-gray-700">平均满意度: {avgSatisfaction}%</span>
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
  const rooms = useAppStore(state => state.rooms);
  const customers = useAppStore(state => state.customers);
  const careTasks = useAppStore(state => state.careTasks);
  const inventoryItems = useAppStore(state => state.inventoryItems);
  const carePlans = useAppStore(state => state.carePlans);

  const kpiCards = useMemo<KpiCard[]>(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === '已入住').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    const inHouseCustomers = customers.filter(c => c.status === '在住').length;
    const today = new Date().toDateString();
    const todayTasks = careTasks.filter(t => new Date(t.scheduledTime).toDateString() === today).length;
    const completedToday = careTasks.filter(t =>
      t.status === '已完成' && t.completeTime && new Date(t.completeTime).toDateString() === today
    ).length;
    const completionRate = todayTasks > 0 ? Math.round((completedToday / todayTasks) * 100) : 91;
    const inventoryWarnings = inventoryItems.filter(i => i.status === '预警' || i.status === '紧缺').length;
    const pendingPlans = carePlans.filter(p => p.status === '待审批').length;

    return [
      {
        title: '入住率',
        value: occupancyRate,
        unit: '%',
        trend: 3.2,
        icon: BedDouble,
        gradient: 'from-primary-500 to-rose-400',
        iconBg: 'bg-white/20',
      },
      {
        title: '在住客户',
        value: inHouseCustomers,
        unit: '人',
        trend: 5,
        icon: Users,
        gradient: 'from-accent-500 to-cyan-400',
        iconBg: 'bg-white/20',
      },
      {
        title: '今日任务数',
        value: todayTasks || careTasks.length,
        unit: '项',
        trend: -2,
        icon: CalendarCheck,
        gradient: 'from-amber-500 to-orange-400',
        iconBg: 'bg-white/20',
      },
      {
        title: '完成率',
        value: completionRate,
        unit: '%',
        trend: 4.5,
        icon: ClipboardList,
        gradient: 'from-emerald-500 to-green-400',
        iconBg: 'bg-white/20',
      },
      {
        title: '库存预警',
        value: inventoryWarnings,
        unit: '项',
        trend: -1,
        icon: Package,
        gradient: 'from-violet-500 to-purple-400',
        iconBg: 'bg-white/20',
      },
      {
        title: '待审批方案',
        value: pendingPlans,
        unit: '个',
        trend: 2,
        icon: Sparkles,
        gradient: 'from-pink-500 to-fuchsia-400',
        iconBg: 'bg-white/20',
      },
    ];
  }, [rooms, customers, careTasks, inventoryItems, carePlans]);

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
            <span>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
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
