import { useState, useMemo, useRef } from 'react';
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
} from 'lucide-react';
import type { CareTask, TaskStatus, Nurse, TaskPriority } from '@/types';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

type KanbanStatus = '待执行' | '进行中' | '已完成';
type NurseFilter = string | '全部';
type TaskTypeFilter = CareTask['category'] | '全部';

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

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
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
}) {
  const nurse = getNurse(task.assigneeId);
  const catStyle = categoryIcons[task.category];
  const CatIcon = catStyle.icon;
  const isOverdue = task.isOverdue || task.status === '已超时';
  const showActionButtons = task.status === '待执行' && !!task.assigneeId;

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onDragOver={e => {
        e.preventDefault();
        onDragOver();
      }}
      className={cn(
        'group relative bg-white rounded-xl p-4 shadow-sm border transition-all duration-200 cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-40 scale-95 rotate-1' : 'hover:shadow-md hover:-translate-y-0.5',
        isOverdue
          ? 'border-red-300 ring-1 ring-red-200/50 shadow-red-50/50'
          : 'border-slate-200 hover:border-slate-300'
      )}
    >
      {isOverdue && (
        <div className="absolute -left-px top-4 bottom-4 w-1 bg-red-400 rounded-r" />
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
          <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
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
        <div className="flex items-center gap-2">
          {isOverdue && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-medium">
              <AlertTriangle className="w-3 h-3" />
              超时
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
  const { careTasks: tasks, nurses, carePlans, updateCareTask, updateCarePlan } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [nurseFilter, setNurseFilter] = useState<NurseFilter>('全部');
  const [taskTypeFilter, setTaskTypeFilter] = useState<TaskTypeFilter>('全部');
  const [dateFilter, setDateFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | '全部'>('全部');
  const [drag, setDrag] = useState<DragState>({ taskId: null, fromColumn: null, overColumn: null });
  const [adjustTask, setAdjustTask] = useState<CareTask | null>(null);

  const getNurse = (id?: string) => nurses.find(n => n.id === id);

  const getColumnStatus = (taskStatus: TaskStatus): KanbanStatus => {
    if (taskStatus === '已完成') return '已完成';
    if (taskStatus === '进行中') return '进行中';
    return '待执行';
  };

  const filteredTasks = useMemo(() => {
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
  }, [tasks, searchQuery, nurseFilter, taskTypeFilter, dateFilter, priorityFilter]);

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

  const stats = useMemo(() => {
    const total = tasks.length;
    const overdue = tasks.filter(t => t.isOverdue || t.status === '已超时').length;
    const completed = tasks.filter(t => t.status === '已完成').length;
    const inProgress = tasks.filter(t => t.status === '进行中').length;
    return { total, overdue, completed, inProgress, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [tasks]);

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

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-sky-500" />
              任务中心
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">拖拽切换任务状态，实时追踪护理任务执行进度</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-[11px] text-slate-500">今日总任务</div>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div className="text-center">
              <div className="text-2xl font-bold text-sky-600">{stats.inProgress}</div>
              <div className="text-[11px] text-slate-500">进行中</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.rate}%</div>
              <div className="text-[11px] text-slate-500">完成率</div>
            </div>
            <div className="text-center">
              <div className={cn('text-2xl font-bold', stats.overdue > 0 ? 'text-red-600' : 'text-slate-400')}>
                {stats.overdue}
              </div>
              <div className="text-[11px] text-slate-500">超时</div>
            </div>
          </div>
        </div>
      </div>

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
              <GripVertical className="w-4 h-4" /> 拖拽移动
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full grid grid-cols-3 gap-5">
          {kanbanColumns.map(col => {
            const colTasks = tasksByColumn[col.status];
            const ColIcon = col.icon;
            const isDropTarget = drag.overColumn === col.status;

            return (
              <div
                key={col.status}
                onDragOver={e => {
                  e.preventDefault();
                  if (drag.taskId && drag.overColumn !== col.status) {
                    setDrag(prev => ({ ...prev, overColumn: col.status }));
                  }
                }}
                onDragLeave={e => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node) && drag.overColumn === col.status) {
                    setDrag(prev => ({ ...prev, overColumn: null }));
                  }
                }}
                onDrop={e => {
                  e.preventDefault();
                  handleDragEnd();
                }}
                className={cn(
                  'flex flex-col rounded-2xl transition-all duration-200 overflow-hidden',
                  isDropTarget
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
                    />
                  ))}

                  {colTasks.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl mx-1">
                      {isDropTarget ? (
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

                {col.status === '待执行' && (
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
      {adjustTask && (
        <AdjustTaskDialog
          task={adjustTask}
          nurse={getNurse(adjustTask.assigneeId)}
          onClose={() => setAdjustTask(null)}
          onCancel={() => setAdjustTask(null)}
          onSubmit={(reason) => handleApplyAdjust(adjustTask, reason)}
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
