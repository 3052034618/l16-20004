import { useState, useMemo } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCircle2,
  Clock,
  AlertTriangle,
  Sun,
  Sunset,
  Moon,
  Coffee,
  X,
  Save,
  BedDouble,
  Calculator,
  User,
  Plus,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import type { ScheduleEntry, ShiftType, Nurse, Room } from '@/types';
import { scheduleEntries as mockSchedules, nurses as mockNurses, rooms as mockRooms } from '@/data/mockData';
import { cn } from '@/lib/utils';

const SHIFT_CONFIG: Record<ShiftType, { icon: typeof Sun; bg: string; text: string; border: string; ring: string; label: string }> = {
  '早班': { icon: Sun, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-400', label: '07:00-15:00' },
  '中班': { icon: Sunset, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', ring: 'ring-orange-400', label: '15:00-23:00' },
  '晚班': { icon: Moon, bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-400', label: '23:00-07:00' },
  '休息': { icon: Coffee, bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', ring: 'ring-slate-400', label: '全天休息' },
};

const SHIFT_HOURS: Record<ShiftType, number> = {
  '早班': 8,
  '中班': 8,
  '晚班': 8,
  '休息': 0,
};

const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  '早班': { start: '07:00', end: '15:00' },
  '中班': { start: '15:00', end: '23:00' },
  '晚班': { start: '23:00', end: '07:00' },
  '休息': { start: '00:00', end: '00:00' },
};

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const colors = [
    'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  ];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-xs';
  return (
    <div className={cn(
      sizeClass,
      colors[colorIndex],
      'rounded-full flex items-center justify-center text-white font-semibold shrink-0 ring-2 ring-white'
    )}>
      {name.slice(0, 1)}
    </div>
  );
}

function ShiftBadge({ type, compact = false }: { type: ShiftType; compact?: boolean }) {
  const cfg = SHIFT_CONFIG[type];
  const Icon = cfg.icon;
  return (
    <div className={cn(
      'flex items-center gap-1 rounded-lg border font-medium',
      cfg.bg, cfg.text, cfg.border,
      compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
    )}>
      <Icon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      <span>{type}</span>
    </div>
  );
}

function WorkHoursBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min(100, (current / max) * 100);
  const isOver = current > max;
  const isWarning = pct >= 90 && !isOver;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className={cn(
          'font-semibold',
          isOver ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-600'
        )}>
          {current}/{max}h
        </span>
        <span className={cn(
          isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-slate-400'
        )}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isOver
              ? 'bg-gradient-to-r from-red-400 to-red-500'
              : isWarning
              ? 'bg-gradient-to-r from-amber-400 to-amber-500'
              : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface EditModalState {
  open: boolean;
  nurseId: string;
  nurseName: string;
  date: string;
  currentShift: ShiftType;
  currentRooms: string[];
  currentHours: number;
  remark?: string;
}

export default function Scheduling() {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(mockSchedules);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [selectedShift, setSelectedShift] = useState<ShiftType>('早班');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [editRemark, setEditRemark] = useState('');

  const weekDates = useMemo(() => {
    const base = new Date(2026, 5, 15);
    base.setDate(base.getDate() + weekOffset * 7);
    const startOfWeek = new Date(base);
    startOfWeek.setDate(base.getDate() - base.getDay() + 1);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return {
        dateStr: `${y}-${m}-${day}`,
        day: d.getDate(),
        weekday: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        isWeekend: i >= 5,
        isToday: i === 2 && weekOffset === 0,
      };
    });
  }, [weekOffset]);

  const weekRangeLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];
    return `${first.dateStr.slice(5)} ~ ${last.dateStr.slice(5)}`;
  }, [weekDates]);

  const nurseWeekHours = useMemo(() => {
    const map: Record<string, number> = {};
    mockNurses.forEach(n => { map[n.id] = n.monthlyWorkHours; });
    schedules.forEach(s => {
      if (weekDates.some(d => d.dateStr === s.date)) {
        if (!map[s.nurseId]) map[s.nurseId] = 0;
      }
    });
    return map;
  }, [schedules, weekDates]);

  const weekHoursByNurse = useMemo(() => {
    const map: Record<string, number> = {};
    schedules.forEach(s => {
      if (weekDates.some(d => d.dateStr === s.date)) {
        if (!map[s.nurseId]) map[s.nurseId] = 0;
        map[s.nurseId] += s.workHours;
      }
    });
    return map;
  }, [schedules, weekDates]);

  const getSchedule = (nurseId: string, dateStr: string) => {
    return schedules.find(s => s.nurseId === nurseId && s.date === dateStr);
  };

  const occupiedRooms = useMemo(() => {
    if (!editModal) return new Set<string>();
    const occupied = new Set<string>();
    schedules.forEach(s => {
      if (s.date === editModal.date && s.nurseId !== editModal.nurseId) {
        s.assignedRoomNumbers.forEach(r => occupied.add(r));
      }
    });
    return occupied;
  }, [schedules, editModal]);

  const availableRooms = useMemo(() => {
    return mockRooms.filter(r => r.status !== '维修中');
  }, []);

  const calculatedHours = SHIFT_HOURS[selectedShift];

  const runAutoScheduling = () => {
    setIsAutoScheduling(true);
    setTimeout(() => {
      setSchedules(prev => {
        const next = [...prev];
        weekDates.forEach(d => {
          mockNurses.forEach((n, ni) => {
            const shifts: ShiftType[] = ['早班', '中班', '晚班', '休息'];
            const shiftIdx = (ni + d.day + weekOffset) % 4;
            const shift = shifts[shiftIdx];
            const existingIdx = next.findIndex(s => s.nurseId === n.id && s.date === d.dateStr);
            const times = SHIFT_TIMES[shift];
            const assignedRooms = shift !== '休息'
              ? mockRooms.slice(ni % 5, (ni % 5) + 2).filter(r => r.status === '已入住').map(r => r.roomNumber)
              : [];
            const entry: ScheduleEntry = {
              id: `SCH-${d.dateStr}-${n.id}`,
              nurseId: n.id,
              nurseName: n.name,
              date: d.dateStr,
              shiftType: shift,
              startTime: times.start,
              endTime: times.end,
              assignedCustomers: [],
              assignedRoomNumbers: assignedRooms,
              workHours: SHIFT_HOURS[shift],
              isHoliday: d.isWeekend,
              isOvertime: false,
              createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
              updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            };
            if (existingIdx >= 0) {
              next[existingIdx] = entry;
            } else {
              next.push(entry);
            }
          });
        });
        return next;
      });
      setIsAutoScheduling(false);
    }, 2500);
  };

  const openEditModal = (nurse: Nurse, dateStr: string) => {
    const existing = getSchedule(nurse.id, dateStr);
    setEditModal({
      open: true,
      nurseId: nurse.id,
      nurseName: nurse.name,
      date: dateStr,
      currentShift: existing?.shiftType || '休息',
      currentRooms: existing?.assignedRoomNumbers || [],
      currentHours: existing?.workHours || 0,
      remark: existing?.remark,
    });
    setSelectedShift(existing?.shiftType || '休息');
    setSelectedRooms(existing?.assignedRoomNumbers || []);
    setEditRemark(existing?.remark || '');
  };

  const closeEditModal = () => {
    setEditModal(null);
  };

  const saveSchedule = () => {
    if (!editModal) return;
    const times = SHIFT_TIMES[selectedShift];
    const newEntry: ScheduleEntry = {
      id: `SCH-${editModal.date}-${editModal.nurseId}`,
      nurseId: editModal.nurseId,
      nurseName: editModal.nurseName,
      date: editModal.date,
      shiftType: selectedShift,
      startTime: times.start,
      endTime: times.end,
      assignedCustomers: [],
      assignedRoomNumbers: selectedRooms,
      workHours: calculatedHours,
      isHoliday: weekDates.find(d => d.dateStr === editModal.date)?.isWeekend || false,
      isOvertime: false,
      remark: editRemark || undefined,
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    setSchedules(prev => {
      const idx = prev.findIndex(s => s.nurseId === editModal.nurseId && s.date === editModal.date);
      const next = [...prev];
      if (idx >= 0) next[idx] = newEntry;
      else next.push(newEntry);
      return next;
    });
    closeEditModal();
  };

  const toggleRoom = (roomNumber: string) => {
    setSelectedRooms(prev =>
      prev.includes(roomNumber)
        ? prev.filter(r => r !== roomNumber)
        : [...prev, roomNumber]
    );
  };

  return (
    <div className="h-full flex flex-col -m-6">
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sky-500" />
              排班管理
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">周视图排班表，智能分配护理师班次与房间</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 rounded-xl">
              {(['早班', '中班', '晚班', '休息'] as ShiftType[]).map(s => {
                const cfg = SHIFT_CONFIG[s];
                const Icon = cfg.icon;
                return (
                  <div key={s} className="flex items-center gap-1 px-2 py-1 text-[11px]">
                    <div className={cn('w-4 h-4 rounded flex items-center justify-center', cfg.bg)}>
                      <Icon className={cn('w-2.5 h-2.5', cfg.text)} />
                    </div>
                    <span className="text-slate-600 font-medium">{s}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={runAutoScheduling}
              disabled={isAutoScheduling}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-70"
            >
              {isAutoScheduling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isAutoScheduling ? '排班算法运行中...' : '自动排班'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-slate-50 border-r border-slate-200 shrink-0 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <div className="text-sm font-bold text-slate-800">{weekRangeLabel}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">第 {weekOffset === 0 ? '本' : weekOffset > 0 ? `${weekOffset + 1}` : Math.abs(weekOffset)} 周</div>
              </div>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDates.map(d => (
                <div
                  key={d.dateStr}
                  className={cn(
                    'py-1 rounded-md text-[10px]',
                    d.isToday
                      ? 'bg-sky-500 text-white font-bold'
                      : d.isWeekend
                      ? 'bg-rose-50 text-rose-500'
                      : 'bg-slate-100 text-slate-600'
                  )}
                >
                  <div className="font-semibold">{d.day}</div>
                  <div className="opacity-75">{d.weekday.slice(1)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <UserCircle2 className="w-4 h-4 text-sky-500" />
              护理师列表
              <span className="ml-auto text-slate-400 font-normal">{mockNurses.length}人</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {mockNurses.map(nurse => {
              const weekHours = weekHoursByNurse[nurse.id] || 0;
              const totalHours = nurseWeekHours[nurse.id] || 0;
              const isOver = totalHours > nurse.maxWorkHours;
              const pct = (totalHours / nurse.maxWorkHours) * 100;
              return (
                <div
                  key={nurse.id}
                  className={cn(
                    'p-3 rounded-xl border bg-white transition-all',
                    isOver
                      ? 'border-red-200 bg-red-50/50'
                      : pct >= 90
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-slate-200 hover:border-sky-200'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={nurse.name} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{nurse.name}</h4>
                        {isOver && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[9px] font-bold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            超时
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {nurse.nurseLevel} · {nurse.currentStatus}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          本周工时
                        </span>
                        <span className="font-semibold text-sky-600">{weekHours}h</span>
                      </div>
                    </div>
                    <WorkHoursBar current={totalHours} max={nurse.maxWorkHours} />
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <main className="flex-1 overflow-auto relative bg-slate-50">
          {isAutoScheduling && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-500 animate-pulse flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white animate-bounce" />
                </div>
                <div className="absolute -inset-3 rounded-3xl border-2 border-dashed border-sky-300 animate-spin" style={{ animationDuration: '4s' }} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">智能排班算法运行中</h3>
              <p className="text-sm text-slate-500 mt-1">正在综合工时、技能、休假等因素生成最优排班...</p>
              <div className="mt-5 w-72 space-y-2">
                {[
                  '分析护理师月度工时平衡...',
                  '匹配技能与房间需求...',
                  '规避连续晚班与超时风险...',
                  '优化周末与节假日轮休...',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ animationDelay: `${i * 150}ms` }}>
                    <div className="w-4 h-4 rounded-full border-2 border-sky-300 flex items-center justify-center animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 text-sky-500 animate-spin" />
                    </div>
                    <span className="text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="min-w-max">
            <div className="grid sticky top-0 z-10 bg-white border-b border-slate-200" style={{ gridTemplateColumns: `160px repeat(7, minmax(140px, 1fr))` }}>
              <div className="p-3 border-r border-slate-200">
                <div className="text-xs font-semibold text-slate-500">护理师 / 日期</div>
              </div>
              {weekDates.map(d => (
                <div
                  key={d.dateStr}
                  className={cn(
                    'p-3 border-r border-slate-200 last:border-r-0 text-center',
                    d.isToday && 'bg-sky-50',
                    d.isWeekend && 'bg-rose-50/50'
                  )}
                >
                  <div className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                    d.isToday ? 'bg-sky-500 text-white' : d.isWeekend ? 'text-rose-500' : 'text-slate-700'
                  )}>
                    {d.day}
                  </div>
                  <div className={cn(
                    'text-[11px] mt-0.5',
                    d.isToday ? 'text-sky-600 font-medium' : d.isWeekend ? 'text-rose-400' : 'text-slate-400'
                  )}>
                    {d.weekday}
                  </div>
                </div>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {mockNurses.map(nurse => {
                const weekHours = weekHoursByNurse[nurse.id] || 0;
                const totalHours = nurseWeekHours[nurse.id] || 0;
                const isOver = totalHours > nurse.maxWorkHours;
                return (
                  <div
                    key={nurse.id}
                    className="grid bg-white hover:bg-slate-50/50 transition-colors"
                    style={{ gridTemplateColumns: `160px repeat(7, minmax(140px, 1fr))` }}
                  >
                    <div className="p-3 border-r border-slate-200 flex items-center gap-2.5 sticky left-0 bg-inherit z-[1]">
                      <Avatar name={nurse.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-800 text-xs truncate">{nurse.name}</span>
                          {isOver && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-slate-400">{nurse.nurseLevel}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[9px] text-slate-400">本周</div>
                        <div className="text-[11px] font-bold text-sky-600">{weekHours}h</div>
                      </div>
                    </div>

                    {weekDates.map(d => {
                      const sched = getSchedule(nurse.id, d.dateStr);
                      const shift: ShiftType = sched?.shiftType || '休息';
                      const cfg = SHIFT_CONFIG[shift];
                      const Icon = cfg.icon;
                      const roomCount = sched?.assignedRoomNumbers.length || 0;

                      return (
                        <div
                          key={d.dateStr + nurse.id}
                          onClick={() => openEditModal(nurse, d.dateStr)}
                          className={cn(
                            'p-2 border-r border-slate-100 last:border-r-0 cursor-pointer transition-all',
                            d.isToday && 'bg-sky-50/50',
                            d.isWeekend && 'bg-rose-50/30',
                            'hover:bg-gradient-to-br hover:from-sky-50 hover:to-indigo-50 hover:shadow-inner'
                          )}
                        >
                          <div className={cn(
                            'rounded-xl p-2.5 border min-h-[72px] transition-all group',
                            cfg.bg, cfg.border,
                            'hover:shadow-md hover:ring-2 hover:ring-offset-1',
                            `hover:${cfg.ring}/30`
                          )}>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <div className={cn('flex items-center gap-1', cfg.text)}>
                                <Icon className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">{shift}</span>
                              </div>
                              {roomCount > 0 && (
                                <div className={cn(
                                  'flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold',
                                  'bg-white/80 backdrop-blur-sm',
                                  cfg.text
                                )}>
                                  <BedDouble className="w-2.5 h-2.5" />
                                  {roomCount}
                                </div>
                              )}
                            </div>

                            <div className="text-[9px] text-slate-400 font-medium mb-1">
                              {cfg.label}
                            </div>

                            {roomCount > 0 && sched && (
                              <div className="flex flex-wrap gap-0.5">
                                {sched.assignedRoomNumbers.slice(0, 3).map(r => (
                                  <span
                                    key={r}
                                    className="px-1.5 py-0.5 rounded bg-white/70 text-[9px] font-semibold text-slate-600 border border-white"
                                  >
                                    {r}
                                  </span>
                                ))}
                                {roomCount > 3 && (
                                  <span className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
                                    +{roomCount - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {shift === '休息' && (
                              <div className="mt-1 text-center text-[9px] text-slate-400">
                                — 休息调休 —
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {editModal && editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border-b border-sky-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Avatar name={editModal.nurseName} />
                <div>
                  <h2 className="text-lg font-bold text-slate-800">编辑排班</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editModal.nurseName} · {editModal.date}
                  </p>
                </div>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  选择班次
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {(['早班', '中班', '晚班', '休息'] as ShiftType[]).map(s => {
                    const cfg = SHIFT_CONFIG[s];
                    const Icon = cfg.icon;
                    const selected = selectedShift === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSelectedShift(s)}
                        className={cn(
                          'relative p-4 rounded-xl border-2 transition-all text-left',
                          selected
                            ? `${cfg.border} ${cfg.bg} ring-4 ring-offset-1 ${cfg.ring}/20`
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        )}
                      >
                        {selected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                          selected ? cfg.bg : 'bg-slate-100'
                        )}>
                          <Icon className={cn('w-5 h-5', selected ? cfg.text : 'text-slate-500')} />
                        </div>
                        <div className={cn(
                          'text-sm font-bold',
                          selected ? cfg.text : 'text-slate-700'
                        )}>
                          {s}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {cfg.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-sky-500" />
                    分配房间
                    <span className="text-slate-400 font-normal">（已选 {selectedRooms.length} 间）</span>
                  </span>
                  {selectedRooms.length > 0 && (
                    <button
                      onClick={() => setSelectedRooms([])}
                      className="text-[10px] text-red-500 hover:text-red-600 font-medium flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      清空
                    </button>
                  )}
                </label>
                {selectedShift !== '休息' ? (
                  <div className="grid grid-cols-6 gap-2 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                    {availableRooms.map(room => {
                      const isOccupied = occupiedRooms.has(room.roomNumber);
                      const isSelected = selectedRooms.includes(room.roomNumber);
                      const isDisabled = isOccupied && !isSelected;
                      return (
                        <button
                          key={room.id}
                          disabled={isDisabled}
                          onClick={() => toggleRoom(room.roomNumber)}
                          className={cn(
                            'relative p-2.5 rounded-lg border-2 text-left transition-all',
                            isSelected
                              ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200'
                              : isDisabled
                              ? 'border-slate-100 bg-slate-100 opacity-50 cursor-not-allowed'
                              : room.status === '已入住'
                              ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          {isDisabled && (
                            <div className="absolute top-1 right-1">
                              <User className="w-3 h-3 text-slate-400" />
                            </div>
                          )}
                          <div className="text-sm font-bold text-slate-800">{room.roomNumber}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 truncate">{room.roomType}</div>
                          <div className={cn(
                            'mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-medium',
                            room.status === '已入住'
                              ? 'bg-emerald-100 text-emerald-600'
                              : room.status === '空闲'
                              ? 'bg-slate-100 text-slate-500'
                              : 'bg-amber-100 text-amber-600'
                          )}>
                            {room.status}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center">
                    <Coffee className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">休息班次无需分配房间</p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-semibold text-slate-700">工时计算</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">班次时长</div>
                    <div className="text-lg font-bold text-slate-800">{SHIFT_HOURS[selectedShift]}<span className="text-xs text-slate-400 font-normal ml-0.5">小时</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">服务房间</div>
                    <div className="text-lg font-bold text-sky-600">{selectedRooms.length}<span className="text-xs text-slate-400 font-normal ml-0.5">间</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 mb-1">累计工时</div>
                    <div className="text-lg font-bold text-emerald-600">
                      {(weekHoursByNurse[editModal.nurseId] || 0) - editModal.currentHours + calculatedHours}
                      <span className="text-xs text-slate-400 font-normal ml-0.5">h/周</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">备注说明（选填）</label>
                <textarea
                  value={editRemark}
                  onChange={e => setEditRemark(e.target.value)}
                  rows={2}
                  placeholder="如：调班原因、特殊注意事项等..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
              <button
                onClick={closeEditModal}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={saveSchedule}
                className="flex-[2] flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-sky-500/25 transition-all"
              >
                <Save className="w-4 h-4" />
                保存排班
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
