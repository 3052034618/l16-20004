import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  User,
  ListTodo,
  PlayCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Baby,
  Heart,
  Activity,
  Stethoscope,
  Smile,
  MoreHorizontal,
  GripVertical,
  X,
  ChevronDown,
  UserCheck,
  LayoutGrid,
  AlertCircle,
  ArrowRightLeft,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { CareTask, TaskStatus, Nurse, TaskPriority } from '@/types';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

type ViewMode = 'all' | 'my' | 'handover';
type KanbanStatus = '待执行' | '进行中' | '已完成';
type SubStatusTab = '全部' | '待执行' | '进行中' | '调整中';
type NurseFilter = string | '全部';
type TaskTypeFilter = CareTask['category'] | '全部';
type HandoverSubTab = 'pending' | 'completed';

interface DragState {
  taskId: string | null;
  fromColumn: KanbanStatus | null;
  overColumn: KanbanStatus | null;
}

const kanbanColumns: { status: KanbanStatus; icon: typeof ListTodo; color: string; accent: string; bg: string }[] = [
  { status: '待执行', icon: ListTodo, color: 'text-amber-600', accent: 'bg-amber-500', bg: 'bg-amber-50' },
  { status: '进行中', icon: PlayCircle, color: 'text-sky-600', accent: 'bg-sky-500', bg: 'bg-sky-50' },
  { status: '已完成', icon: CheckCircle2, color: 'text-emerald-600', accent: 'bg-emerald-500', bg: 'bg-emerald-50' },
];

const categoryIcons: Record<CareTask['category'], { icon: typeof Heart; bg: string; text: string }> = {
  '母亲护理': { icon: Heart, bg: 'bg-rose-100', text: 'text-rose-600' },
  '新生儿护理': { icon: Baby, bg: 'bg-sky-100', text: 'text-sky-600' },
  '母婴同室': { icon: UserCheck, bg: 'bg-violet-100', text: 'text-violet-600' },
  '健康监测': { icon: Activity, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  '心理疏导': { icon: Smile, bg: 'bg-amber-100', text: 'text-amber-600' },
  '其他': { icon: Stethoscope, bg: 'bg-slate-100', text: 'text-slate-600' },
};

const priorityStyles: Record<TaskPriority, string> = {
  '高': 'bg-red-100 text-red-700 border-red-200',
  '中': 'bg-amber-100 text-amber-700 border-amber-200',
  '低': 'bg-slate-100 text-slate-600 border-slate-200',
};

const subStatusTabs: { key: SubStatusTab; label: string }[] = [
  { key: '全部', label: '全部' },
  { key: '待执行', label: '待执行' },
  { key: '进行中', label: '进行中' },
  { key: '调整中', label: '调整中' },
];

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const colors = [
    'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  ];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-xs';
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

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  onDragOver,
  isDragging,
  isOverColumn,
  getNurse,
  onAccept,
  onApplyAdjust,
  onHandover,
  viewMode,
  showHandoverButton = false,
}: {
  task: CareTask;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  isDragging: boolean;
  isOverColumn: boolean;
  getNurse: (id?: string) => Nurse | undefined;
  onAccept: (task: CareTask) => void;
  onApplyAdjust: (task: CareTask) => void;
  onHandover?: (task: CareTask) => void;
  viewMode: ViewMode;
  showHandoverButton?: boolean;
}) {
  const nurse = getNurse(task.assigneeId);
  const catStyle = categoryIcons[task.category];
  const CatIcon = catStyle.icon;
  const isOverdue = task.isOverdue || task.status === '已超时';
  const isAdjusting = task.status === '调整中';
  const showActionButtons = task.status === '待执行' && !!task.assigneeId;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cardDraggable = viewMode === 'all';

  return (
    <div
      draggable={cardDraggable}
      onDragStart={e => {
        if (!cardDraggable) return;
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={e => {
        e.preventDefault();
        onDragOver();
      }}
      className={cn(
        'group relative bg-white rounded-xl p-4 shadow-sm border transition-all duration-200',
        cardDraggable ? 'cursor-grab active:cursor-grabbing' : '',
        isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:shadow-md hover:-translate-y-0.5',
        isOverdue
          ? 'border-red-300 ring-1 ring-red-200/50 shadow-red-50/50'
          : isAdjusting
          ? 'border-orange-300 ring-1 ring-orange-200/50'
          : 'border-slate-200 hover:border-slate-300'
      )}
    >
      {isOverdue && (
        <div className="absolute -left-px top-4 bottom-4 w-1 bg-red-400 rounded-r" />
      )}
      {isAdjusting && (
        <div className="absolute -left-px top-4 bottom-4 w-1 bg-orange-400 rounded-r" />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', catStyle.bg)}>
            <CatIcon className={cn('w-4 h-4', catStyle.text)} />
          </div>
          <div>
            <div className={cn('text-[11px] font-medium', catStyle.text)}>{task.category}</div>
            <h3 className="text-sm font-semibold text-slate-800 leading-snug mt-0.5 line-clamp-2">{task.taskName}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {task.isHandover && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 text-white text-[10px] font-bold shadow-sm">
              H
            </span>
          )}
          {cardDraggable && (
            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
          )}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 w-32">
                <button className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">查看详情</button>
                <button className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">编辑任务</button>
                <button className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50">取消任务</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-slate-500 line-clamp-2">{task.description}</p>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600">{task.customerName}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{task.roomNumber}室</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {nurse ? (
            <div className="flex items-center gap-1.5">
              <Avatar name={nurse.name} />
              <span className="text-[11px] text-slate-600 font-medium">{nurse.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100">
              <AlertCircle className="w-3 h-3 text-slate-500" />
              <span className="text-[11px] text-slate-500">待分配</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              超时
            </span>
          )}
          {isAdjusting && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-600 text-[10px] font-medium border border-orange-200">
              <AlertCircle className="w-3 h-3" />
              调整中
            </span>
          )}
          {task.isHandover && task.handoverToName && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-600 text-[10px] font-medium border border-violet-200">
              已交接给{task.handoverToName}
            </span>
          )}
          <span className={cn(
            'px-1.5 py-0.5 rounded-md text-[10px] font-medium border',
            priorityStyles[task.priority]
          )}>
            {task.priority}
          </span>
          {showActionButtons && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(task);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-3 h-3" />
                确认接收
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyAdjust(task);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm shadow-amber-500/30"
              >
                <AlertCircle className="w-3 h-3" />
                申请调整
              </button>
            </div>
          )}
          {showHandoverButton && onHandover && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHandover(task);
              }}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm shadow-violet-500/30"
            >
              <ArrowRightLeft className="w-3 h-3" />
              交接
            </button>
          )}
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
        <Calendar className="w-3 h-3" />
        <span>{task.scheduledTime.slice(5, 16)}</span>
        <span className="text-slate-300">·</span>
        <Clock className="w-3 h-3" />
        <span>{task.duration}分钟</span>
      </div>
    </div>
  );
}

export default function Tasks() {
  const { careTasks: tasks, nurses, carePlans, updateCareTask, updateCarePlan, taskHandoverRecords, handoverTask } = useAppStore();

  // 视角模式：全部任务 / 我的任务 / 交接班
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  // 我的任务 - 护理师选择（当前登录护理师模拟）
  // 注释：当前"护理师选择"仅做前端展示模拟，后续接登录后取当前用户
  const [selectedNurseId, setSelectedNurseId] = useState<string>('');
  // 我的任务 - 状态子Tab
  const [subStatusTab, setSubStatusTab] = useState<SubStatusTab>('全部');
  // 交接班 - 子Tab
  const [handoverSubTab, setHandoverSubTab] = useState<HandoverSubTab>('pending');
  // 交接班 - 护理师选择（当前登录护理师模拟）
  // 注释：当前"护理师选择"仅做前端展示模拟，后续接登录后取当前用户
  const [handoverNurseId, setHandoverNurseId] = useState<string>('');

  // 全部任务视角下的筛选器
  const [searchQuery, setSearchQuery] = useState('');
  const [nurseFilter, setNurseFilter] = useState<NurseFilter>('全部');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>('全部');
  const [dateFilter, setDateFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | '全部'>('全部');

  const [drag, setDrag] = useState<DragState>({ taskId: null, fromColumn: null, overColumn: null });
  const [adjustTask, setAdjustTask] = useState<CareTask | null>(null);
  const [handoverTaskState, setHandoverTaskState] = useState<CareTask | null>(null);

  // 初始化默认护理师为第一个
  useEffect(() => {
    if (nurses.length > 0) {
      if (!selectedNurseId) {
        setSelectedNurseId(nurses[0].id);
      }
      if (!handoverNurseId) {
        setHandoverNurseId(nurses[0].id);
      }
    }
  }, [nurses, selectedNurseId, handoverNurseId]);

  const getNurse = (id?: string) => nurses.find(n => n.id === id);

  const getColumnStatus = (taskStatus: TaskStatus): KanbanStatus => {
    if (taskStatus === '已完成') return '已完成';
    if (taskStatus === '进行中') return '进行中';
    // 调整中任务仍放在待执行列
    return '待执行';
  };

  const isTaskSoonOverdue = (task: CareTask): boolean => {
    if (task.isOverdue || task.status === '已超时') return true;
    const deadline = new Date(task.scheduledTime);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours <= 1 && diffHours > 0;
  };

  const isPendingHandover = (task: CareTask, nurseId: string): boolean => {
    if (task.assigneeId !== nurseId) return false;
    const todayStr = getTodayString();
    const taskDate = task.scheduledTime.slice(0, 10);
    if (taskDate !== todayStr) return false;
    // 待交接任务：今天未完成 + 调整中 + 即将超时
    // 已完成的任务不需要交接
    if (task.status === '已完成') return false;
    // 未完成的任务（包括待执行、进行中、调整中、已超时）+ 即将超时的都需要交接
    // 由于前面已排除已完成，这里直接返回 true 即可
    // （调整中和即将超时都包含在未完成中，或属于需要特别关注的情况）
    return true;
  };

  const handoverPendingTasks = useMemo(() => {
    return tasks.filter(t => isPendingHandover(t, handoverNurseId));
  }, [tasks, handoverNurseId]);

  const handoverCompletedRecords = useMemo(() => {
    return taskHandoverRecords.filter(r =>
      r.fromNurseId === handoverNurseId || r.toNurseId === handoverNurseId
    ).sort((a, b) => new Date(b.handoverTime).getTime() - new Date(a.handoverTime).getTime());
  }, [taskHandoverRecords, handoverNurseId]);

  const filteredTasks = useMemo(() => {
    const todayStr = getTodayString();

    if (viewMode === 'my') {
      // 我的任务视角：内置筛选逻辑
      return tasks.filter(t => {
        // 1. scheduledDate 等于今天
        const taskDate = t.scheduledTime.slice(0, 10);
        if (taskDate !== todayStr) return false;
        // 2. assigneeId === 所选护理师
        if (t.assigneeId !== selectedNurseId) return false;
        // 3. 状态子Tab筛选
        if (subStatusTab !== '全部') {
          if (subStatusTab === '待执行' && t.status !== '待执行') return false;
          if (subStatusTab === '进行中' && t.status !== '进行中') return false;
          if (subStatusTab === '调整中' && t.status !== '调整中') return false;
        }
        return true;
      });
    } else {
      // 全部任务视角：原有筛选逻辑
      return tasks.filter(t => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !t.taskName.toLowerCase().includes(q) &&
            !t.customerName.toLowerCase().includes(q) &&
            !t.description.toLowerCase().includes(q)
          ) return false;
        }
        if (nurseFilter !== '全部' && t.assigneeId !== nurseFilter) return false;
        if (taskTypeFilter !== '全部' && t.category !== taskTypeFilter) return false;
        if (priorityFilter !== '全部' && t.priority !== priorityFilter) return false;
        if (dateFilter && t.scheduledTime.slice(0, 10) !== dateFilter) return false;
        return true;
      });
    }
  }, [tasks, viewMode, selectedNurseId, subStatusTab, searchQuery, nurseFilter, taskTypeFilter, dateFilter, priorityFilter]);

  const tasksByColumn = useMemo(() => {
    const grouped: Record<KanbanStatus, CareTask[]> = {
      '待执行': [],
      '进行中': [],
      '已完成': [],
    };
    filteredTasks.forEach(t => {
      grouped[getColumnStatus(t.status)].push(t);
    });
    return grouped;
  }, [filteredTasks]);

  const handleHandover = (task: CareTask) => {
    setHandoverTaskState(task);
  };

  const handleSubmitHandover = (task: CareTask, toNurseId: string, note: string) => {
    const fromNurse = getNurse(task.assigneeId);
    const toNurse = getNurse(toNurseId);
    if (!fromNurse || !toNurse) return;

    handoverTask({
      taskId: task.id,
      taskName: task.taskName,
      customerId: task.customerId,
      customerName: task.customerName,
      roomNumber: task.roomNumber,
      fromNurseId: fromNurse.id,
      fromNurseName: fromNurse.name,
      toNurseId: toNurse.id,
      toNurseName: toNurse.name,
      note,
      carePlanId: task.carePlanId,
      taskStatusBefore: task.status,
      taskStatusAfter: task.status,
    });

    setHandoverTaskState(null);
  };

  // 统计：当前显示列表的数字
  const stats = useMemo(() => {
    let total = 0;
    let overdue = 0;
    let completed = 0;
    let inProgress = 0;

    if (viewMode === 'handover') {
      if (handoverSubTab === 'pending') {
        total = handoverPendingTasks.length;
        overdue = handoverPendingTasks.filter(t => t.isOverdue || t.status === '已超时' || isTaskSoonOverdue(t)).length;
        completed = handoverPendingTasks.filter(t => t.status === '已完成').length;
        inProgress = handoverPendingTasks.filter(t => t.status === '进行中').length;
      } else {
        total = handoverCompletedRecords.length;
        overdue = 0;
        completed = 0;
        inProgress = 0;
      }
    } else {
      total = filteredTasks.length;
      overdue = filteredTasks.filter(t => t.isOverdue || t.status === '已超时').length;
      completed = filteredTasks.filter(t => t.status === '已完成').length;
      inProgress = filteredTasks.filter(t => t.status === '进行中').length;
    }

    return { total, overdue, completed, inProgress, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [viewMode, handoverSubTab, handoverPendingTasks, handoverCompletedRecords, filteredTasks]);

  const handleDragStart = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setDrag({
      taskId,
      fromColumn: task ? getColumnStatus(task.status) : null,
      overColumn: null,
    });
  };

  const handleAcceptTask = (task: CareTask) => {
    const nurse = getNurse(task.assigneeId);
    updateCareTask(task.id, {
      status: '进行中',
      startTime: new Date().toISOString(),
      operatorName: nurse?.name || '护理师',
    });
  };

  const handleApplyAdjust = (task: CareTask, reason: string) => {
    const now = new Date().toISOString();
    const nurse = getNurse(task.assigneeId);
    const nowFormatted = formatDateTime(new Date());

    updateCareTask(task.id, {
      status: '调整中',
      adjustReason: reason,
      adjustTime: now,
      operatorName: nurse?.name || '护理师',
    });

    const carePlan = carePlans.find(p => p.id === task.carePlanId);
    if (carePlan) {
      const existingApprovalIds = carePlan.approvalHistory.map(a => a.id);
      const maxIdNum = existingApprovalIds.length > 0
        ? Math.max(...existingApprovalIds.map(id => parseInt(id.replace(/\D/g, '')) || 0))
        : 0;
      const newApprovalId = `APR${String(maxIdNum + 1).padStart(4, '0')}`;

      updateCarePlan(carePlan.id, {
        status: '已调整',
        approvalHistory: [
          ...carePlan.approvalHistory,
          {
            id: newApprovalId,
            operatorId: task.assigneeId || '',
            operatorName: nurse?.name || '护理师',
            action: '任务调整申请',
            comment: `【任务：${task.taskName}】调整原因：${reason}`,
            operateTime: nowFormatted,
          },
        ],
      });
    }

    setAdjustTask(null);
  };

  const handleDragEnd = () => {
    if (drag.taskId && drag.overColumn && drag.overColumn !== drag.fromColumn) {
      const newStatus: TaskStatus = drag.overColumn === '已完成'
        ? '已完成'
        : drag.overColumn === '进行中'
        ? '进行中'
        : '待执行';
      const now = formatDateTime(new Date());
      updateCareTask(drag.taskId, {
        status: newStatus,
        isOverdue: newStatus === '已完成' ? false : tasks.find(t => t.id === drag.taskId)?.isOverdue || false,
        startTime: newStatus === '进行中' || newStatus === '已完成' ? (tasks.find(t => t.id === drag.taskId)?.startTime || now) : undefined,
        endTime: newStatus === '已完成' ? now : undefined,
        completeTime: newStatus === '已完成' ? now : undefined,
      });
    }
    setDrag({ taskId: null, fromColumn: null, overColumn: null });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setNurseFilter('全部');
    setTaskTypeFilter('全部');
    setDateFilter('');
    setPriorityFilter('全部');
  };

  const isAllView = viewMode === 'all';
  const isMyView = viewMode === 'my';
  const isHandoverView = viewMode === 'handover';

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 顶部标题 + 统计指标 */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-sky-500" />
              {isHandoverView ? '交接班管理' : '任务中心'}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isHandoverView
                ? '高效完成护理任务交接，确保工作无缝衔接'
                : '拖拽切换任务状态，实时追踪护理任务执行进度'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-[11px] text-slate-500">
                {isHandoverView && handoverSubTab === 'completed' ? '交接记录' : '今日总任务'}
              </div>
            </div>
            {!(isHandoverView && handoverSubTab === 'completed') && (
              <>
                <div className="w-px h-10 bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-sky-600">{stats.inProgress}</div>
                  <div className="text-[11px] text-slate-500">进行中</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{stats.rate}%</div>
                  <div className="text-[11px] text-slate-500">完成率</div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="text-center">
                  <div className={cn('text-2xl font-bold', stats.overdue > 0 ? 'text-red-600' : 'text-slate-400')}>
                    {stats.overdue}
                  </div>
                  <div className="text-[11px] text-slate-500">超时/即将超时</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 视角切换 Tab */}
      <div className="px-6 pt-3 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isAllView
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              全部任务
            </button>
            <button
              onClick={() => setViewMode('my')}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isMyView
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              我的任务
            </button>
            <button
              onClick={() => setViewMode('handover')}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                isHandoverView
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              交接班
            </button>
          </div>

          {/* 我的任务视角 - 护理师选择 + 状态子Tab */}
          {isMyView && (
            <div className="flex items-center gap-4">
              {/* 护理师选择下拉 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">当前护理师：</span>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={selectedNurseId}
                    onChange={e => setSelectedNurseId(e.target.value)}
                    className="w-44 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 appearance-none bg-white cursor-pointer"
                  >
                    {nurses.map(n => (
                      <option key={n.id} value={n.id}>{n.name} · {n.nurseLevel}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 状态子Tab */}
              <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-200">
                {subStatusTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSubStatusTab(tab.key)}
                    className={cn(
                      'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                      subStatusTab === tab.key
                        ? 'bg-white text-slate-700 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 交接班视角 - 护理师选择 + 子Tab */}
          {isHandoverView && (
            <div className="flex items-center gap-4">
              {/* 护理师选择下拉 */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">当前护理师：</span>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    value={handoverNurseId}
                    onChange={e => setHandoverNurseId(e.target.value)}
                    className="w-44 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 appearance-none bg-white cursor-pointer"
                  >
                    {nurses.map(n => (
                      <option key={n.id} value={n.id}>{n.name} · {n.nurseLevel}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 交接子Tab */}
              <div className="flex items-center gap-1 bg-violet-50 rounded-xl p-1 border border-violet-200">
                <button
                  onClick={() => setHandoverSubTab('pending')}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    handoverSubTab === 'pending'
                      ? 'bg-white text-violet-700 shadow-sm border border-violet-200'
                      : 'text-violet-500 hover:text-violet-700'
                  )}
                >
                  待交接
                </button>
                <button
                  onClick={() => setHandoverSubTab('completed')}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                    handoverSubTab === 'completed'
                      ? 'bg-white text-violet-700 shadow-sm border border-violet-200'
                      : 'text-violet-500 hover:text-violet-700'
                  )}
                >
                  已交接
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 全部任务视角下的筛选器 */}
      {isAllView && (
        <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter className="w-4 h-4 text-sky-500" />
              筛选
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索任务/客户"
                className="w-56 pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
            </div>

            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={nurseFilter}
                onChange={e => setNurseFilter(e.target.value)}
                className="w-40 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 appearance-none bg-white cursor-pointer"
              >
                <option value="全部">全部护理师</option>
                {nurses.map(n => (
                  <option key={n.id} value={n.id}>{n.name} · {n.nurseLevel}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <ListTodo className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={taskTypeFilter}
                onChange={e => setTaskTypeFilter(e.target.value as TaskTypeFilter)}
                className="w-36 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 appearance-none bg-white cursor-pointer"
              >
                <option value="全部">全部类型</option>
                {(['母亲护理', '新生儿护理', '母婴同室', '健康监测', '心理疏导', '其他'] as const).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value as TaskPriority | '全部')}
                className="w-28 pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 appearance-none bg-white cursor-pointer"
              >
                <option value="全部">全部优先级</option>
                <option value="高">高优先级</option>
                <option value="中">中优先级</option>
                <option value="低">低优先级</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              />
            </div>

            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-slate-500 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              重置
            </button>

            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-red-300 bg-red-50" /> 超时任务
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border-2 border-orange-300 bg-orange-50" /> 调整中
              </span>
              <span className="flex items-center gap-1.5">
                <GripVertical className="w-4 h-4" /> 拖拽移动
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 我的任务视角 - 无筛选器，仅显示图例 */}
      {isMyView && (
        <div className="px-6 py-2 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-red-300 bg-red-50" /> 超时任务
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-orange-300 bg-orange-50" /> 调整中
            </span>
          </div>
        </div>
      )}

      {/* 交接班视角 - 图例 */}
      {isHandoverView && (
        <div className="px-6 py-2 bg-white border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-red-300 bg-red-50" /> 超时任务
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-orange-300 bg-orange-50" /> 调整中
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-violet-300 bg-violet-50" /> 已交接
            </span>
          </div>
        </div>
      )}

      {/* 交接班视图 - 待交接/已交接列表 */}
      {isHandoverView ? (
        <div className="flex-1 overflow-hidden p-6">
          {handoverSubTab === 'pending' ? (
            <div className="h-full flex flex-col bg-violet-50/30 rounded-2xl overflow-hidden border border-violet-200">
              <div className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  <ArrowRightLeft className="w-4 h-4 text-white" />
                  <h2 className="font-semibold text-sm text-white">待交接任务</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    {handoverPendingTasks.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {handoverPendingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={() => {}}
                    isDragging={false}
                    isOverColumn={false}
                    getNurse={getNurse}
                    onAccept={handleAcceptTask}
                    onApplyAdjust={(t) => setAdjustTask(t)}
                    onHandover={handleHandover}
                    viewMode={viewMode}
                    showHandoverButton={true}
                  />
                ))}

                {handoverPendingTasks.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-violet-200 rounded-xl mx-1">
                    <ArrowRightLeft className="w-8 h-8 text-violet-300 mb-2" />
                    <span className="text-sm text-violet-500 font-medium">暂无待交接任务</span>
                    <span className="text-xs text-violet-400 mt-1">所有任务已处理完毕</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-violet-50/30 rounded-2xl overflow-hidden border border-violet-200">
              <div className="px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <h2 className="font-semibold text-sm text-white">交接记录</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                    {handoverCompletedRecords.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {handoverCompletedRecords.map(record => {
                  const isOutgoing = record.fromNurseId === handoverNurseId;
                  return (
                    <div
                      key={record.id}
                      className="relative bg-white rounded-xl p-4 shadow-sm border border-violet-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="absolute left-0 top-4 bottom-4 w-1 bg-violet-400 rounded-r" />

                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          isOutgoing ? 'bg-violet-100' : 'bg-purple-100'
                        )}>
                          {isOutgoing ? (
                            <ArrowRight className="w-5 h-5 text-violet-600" />
                          ) : (
                            <ArrowLeft className="w-5 h-5 text-purple-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium',
                              isOutgoing
                                ? 'bg-violet-50 text-violet-600 border border-violet-200'
                                : 'bg-purple-50 text-purple-600 border border-purple-200'
                            )}>
                              {isOutgoing ? '交接出去' : '交接进来'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(new Date(record.handoverTime)).slice(5)}
                            </span>
                          </div>

                          <h3 className="text-sm font-semibold text-slate-800 mt-2 line-clamp-1">{record.taskName}</h3>

                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Avatar name={record.fromNurseName} size="sm" />
                              <span className="font-medium">{record.fromNurseName}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-violet-400" />
                            <div className="flex items-center gap-1">
                              <Avatar name={record.toNurseName} size="sm" />
                              <span className="font-medium">{record.toNurseName}</span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                            <User className="w-3 h-3" />
                            <span>{record.customerName}</span>
                            <span className="text-slate-300">·</span>
                            <span>{record.roomNumber}室</span>
                          </div>

                          {record.note && (
                            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                              <div className="text-[11px] text-slate-500 mb-1">交接备注</div>
                              <p className="text-xs text-slate-700 leading-relaxed">{record.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {handoverCompletedRecords.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-violet-200 rounded-xl mx-1">
                    <CheckCircle2 className="w-8 h-8 text-violet-300 mb-2" />
                    <span className="text-sm text-violet-500 font-medium">暂无交接记录</span>
                    <span className="text-xs text-violet-400 mt-1">完成交接后将显示在此处</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-hidden p-6">
          <div className="h-full grid grid-cols-3 gap-5">
            {kanbanColumns.map(col => {
              const colTasks = tasksByColumn[col.status];
              const ColIcon = col.icon;
              const isDropTarget = drag.overColumn === col.status;
              const allowDrop = isAllView;

              return (
                <div
                  key={col.status}
                  onDragOver={e => {
                    if (!allowDrop) return;
                    e.preventDefault();
                    if (drag.taskId && drag.overColumn !== col.status) {
                      setDrag(prev => ({ ...prev, overColumn: col.status }));
                    }
                  }}
                  onDragLeave={e => {
                    if (!allowDrop) return;
                    if (!e.currentTarget.contains(e.relatedTarget as Node) && drag.overColumn === col.status) {
                      setDrag(prev => ({ ...prev, overColumn: null }));
                    }
                  }}
                  onDrop={e => {
                    if (!allowDrop) return;
                    e.preventDefault();
                    handleDragEnd();
                  }}
                  className={cn(
                    'flex flex-col rounded-2xl transition-all duration-200 overflow-hidden',
                    allowDrop && isDropTarget
                      ? 'bg-sky-50/50 ring-2 ring-sky-300 ring-dashed'
                      : 'bg-slate-100/60'
                  )}
                >
                  <div className={cn('px-4 py-3 flex items-center justify-between shrink-0', col.bg)}>
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2.5 h-2.5 rounded-full', col.accent)} />
                      <ColIcon className={cn('w-4 h-4', col.color)} />
                      <h2 className={cn('font-semibold text-sm', col.color)}>{col.status}</h2>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold',
                        col.accent, 'text-white'
                      )}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
                      'text-slate-400 hover:text-slate-600 hover:bg-white/60'
                    )}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {colTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={() => setDrag(prev => prev.taskId === task.id ? prev : { ...prev, overColumn: col.status })}
                        isDragging={drag.taskId === task.id}
                        isOverColumn={drag.overColumn === col.status && drag.taskId !== task.id}
                        getNurse={getNurse}
                        onAccept={handleAcceptTask}
                        onApplyAdjust={(t) => setAdjustTask(t)}
                        onHandover={handleHandover}
                        viewMode={viewMode}
                        showHandoverButton={false}
                      />
                    ))}

                    {colTasks.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl mx-1">
                        {allowDrop && isDropTarget ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-sky-400 mb-1" />
                            <span className="text-xs text-sky-500 font-medium">松开放置</span>
                          </>
                        ) : (
                          <>
                            <ListTodo className="w-6 h-6 mb-1" />
                            <span className="text-xs">暂无任务</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {col.status === '待执行' && isAllView && (
                    <div className="p-3 pt-0 shrink-0">
                      <button className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-medium hover:border-sky-400 hover:text-sky-500 hover:bg-white/50 transition-colors flex items-center justify-center gap-1.5">
                        <ListTodo className="w-4 h-4" />
                        新建任务
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 调整任务弹窗 */}
      {adjustTask && (
        <AdjustTaskDialog
          task={adjustTask}
          nurse={getNurse(adjustTask.assigneeId)}
          onClose={() => setAdjustTask(null)}
          onCancel={() => setAdjustTask(null)}
          onSubmit={(reason) => handleApplyAdjust(adjustTask, reason)}
        />
      )}

      {/* 交接任务弹窗 */}
      {handoverTaskState && (
        <HandoverDialog
          task={handoverTaskState}
          fromNurse={getNurse(handoverTaskState.assigneeId)}
          nurses={nurses}
          onClose={() => setHandoverTaskState(null)}
          onCancel={() => setHandoverTaskState(null)}
          onSubmit={(toNurseId, note) => handleSubmitHandover(handoverTaskState, toNurseId, note)}
        />
      )}
    </div>
  );
}

function AdjustTaskDialog({
  task,
  nurse,
  onClose,
  onCancel,
  onSubmit,
}: {
  task: CareTask;
  nurse?: Nurse;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">申请任务调整</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">任务名称</span>
                <span className="text-sm font-medium text-slate-800">{task.taskName}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">服务客户</span>
                <span className="text-sm text-slate-700">
                  {task.customerName} · {task.roomNumber}室
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">护理师</span>
                <span className="text-sm text-slate-700">
                  {nurse ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={nurse.name} />
                      {nurse.name}
                    </span>
                  ) : (
                    '待分配'
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                调整原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请详细说明需要调整任务的原因..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 resize-none"
                required
              />
              {!reason.trim() && (
                <p className="mt-1.5 text-[11px] text-slate-400">请填写调整原因后再提交</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm transition-all flex items-center gap-1.5',
                reason.trim()
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              )}
            >
              <AlertCircle className="w-4 h-4" />
              提交申请
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function HandoverDialog({
  task,
  fromNurse,
  nurses,
  onClose,
  onCancel,
  onSubmit,
}: {
  task: CareTask;
  fromNurse?: Nurse;
  nurses: Nurse[];
  onClose: () => void;
  onCancel: () => void;
  onSubmit: (toNurseId: string, note: string) => void;
}) {
  const [toNurseId, setToNurseId] = useState('');
  const [note, setNote] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 注释：交接接收人后续将接后端登录，当前是前端模拟选择
  const availableNurses = nurses.filter(n => n.id !== fromNurse?.id);

  useEffect(() => {
    if (availableNurses.length > 0 && !toNurseId) {
      setToNurseId(availableNurses[0].id);
    }
  }, [availableNurses, toNurseId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (toNurseId && note.trim()) {
      onSubmit(toNurseId, note.trim());
    }
  };

  const selectedToNurse = nurses.find(n => n.id === toNurseId);
  const canSubmit = toNurseId && note.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">任务交接</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="bg-violet-50 rounded-xl p-4 space-y-3 border border-violet-100">
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">任务名称</span>
                <span className="text-sm font-medium text-slate-800">{task.taskName}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">服务客户</span>
                <span className="text-sm text-slate-700">
                  {task.customerName} · {task.roomNumber}室
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">任务状态</span>
                <span className="text-sm text-slate-700">{task.status}</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs text-slate-500 w-16 shrink-0 pt-0.5">交接人</span>
                <span className="text-sm text-slate-700">
                  {fromNurse ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={fromNurse.name} />
                      {fromNurse.name}
                    </span>
                  ) : (
                    '待分配'
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                接收人 <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white flex items-center justify-between"
                >
                  {selectedToNurse ? (
                    <span className="flex items-center gap-2">
                      <Avatar name={selectedToNurse.name} />
                      <span>
                        <span className="font-medium text-slate-800">{selectedToNurse.name}</span>
                        <span className="text-slate-500 ml-1">· {selectedToNurse.nurseLevel}</span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">请选择接收人</span>
                  )}
                  <ChevronDown className={cn(
                    'w-4 h-4 text-slate-400 transition-transform',
                    showDropdown && 'rotate-180'
                  )} />
                </button>
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {availableNurses.map(nurse => (
                      <button
                        key={nurse.id}
                        type="button"
                        onClick={() => {
                          setToNurseId(nurse.id);
                          setShowDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-violet-50 transition-colors',
                          toNurseId === nurse.id && 'bg-violet-50'
                        )}
                      >
                        <Avatar name={nurse.name} />
                        <span>
                          <span className="font-medium text-slate-800">{nurse.name}</span>
                          <span className="text-slate-500 ml-1 text-xs">· {nurse.nurseLevel}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                交接备注 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="请详细说明任务交接的注意事项、当前进度等信息..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 resize-none"
                required
              />
              {!note.trim() && (
                <p className="mt-1.5 text-[11px] text-slate-400">请填写交接备注后再提交</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                'px-5 py-2.5 rounded-xl text-sm font-medium text-white shadow-sm transition-all flex items-center gap-1.5',
                canSubmit
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-violet-500/25'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              )}
            >
              <ArrowRightLeft className="w-4 h-4" />
              确认交接
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
