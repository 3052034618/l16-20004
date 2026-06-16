import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  Baby,
  Heart,
  Activity,
  Stethoscope,
  Smile,
  UserCheck,
  Sparkles,
  Loader2,
  MessageSquare,
  ChevronRight,
  FileText,
  Star,
  AlertCircle,
} from 'lucide-react';
import type { CarePlan, CarePlanStatus, Nurse, CareTask } from '@/types';
import { carePlans as mockCarePlans, nurses as mockNurses, customers as mockCustomers } from '@/data/mockData';
import { cn } from '@/lib/utils';

type StatusFilter = CarePlanStatus | '全部';

const statusFilters: { value: StatusFilter; color: string }[] = [
  { value: '全部', color: 'bg-slate-500' },
  { value: '待审批', color: 'bg-amber-500' },
  { value: '已通过', color: 'bg-emerald-500' },
  { value: '已驳回', color: 'bg-red-500' },
  { value: '已调整', color: 'bg-sky-500' },
];

const statusBadgeStyles: Record<CarePlanStatus, string> = {
  '待审批': 'bg-amber-100 text-amber-700 border-amber-200',
  '已通过': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '已驳回': 'bg-red-100 text-red-700 border-red-200',
  '已调整': 'bg-sky-100 text-sky-700 border-sky-200',
};

const approvalActionStyles: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  '提交': { icon: FileText, color: 'text-slate-600', bg: 'bg-slate-100' },
  '通过': { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  '驳回': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
  '调整': { icon: RefreshCw, color: 'text-sky-600', bg: 'bg-sky-100' },
};

const categoryIcons: Record<CareTask['category'], { icon: typeof Heart; bg: string; text: string }> = {
  '母亲护理': { icon: Heart, bg: 'bg-rose-100', text: 'text-rose-600' },
  '新生儿护理': { icon: Baby, bg: 'bg-sky-100', text: 'text-sky-600' },
  '母婴同室': { icon: UserCheck, bg: 'bg-violet-100', text: 'text-violet-600' },
  '健康监测': { icon: Activity, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  '心理疏导': { icon: Smile, bg: 'bg-amber-100', text: 'text-amber-600' },
  '其他': { icon: Stethoscope, bg: 'bg-slate-100', text: 'text-slate-600' },
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

function StatusBadge({ status }: { status: CarePlanStatus }) {
  return (
    <span className={cn(
      'px-2.5 py-1 rounded-full text-xs font-medium border',
      statusBadgeStyles[status]
    )}>
      {status}
    </span>
  );
}

function CarePlanCard({
  plan,
  selected,
  onClick,
}: {
  plan: CarePlan;
  selected: boolean;
  onClick: () => void;
}) {
  const customer = mockCustomers.find(c => c.id === plan.customerId);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200',
        selected
          ? 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-300 shadow-md ring-2 ring-pink-200/50'
          : 'bg-white border-slate-200 hover:border-pink-200 hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {selected && (
        <div className="absolute left-0 top-4 bottom-4 w-1 bg-pink-500 rounded-r" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={plan.customerName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-800 text-sm truncate">{plan.customerName}</h3>
              <StatusBadge status={plan.status} />
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {plan.roomNumber}室 · {customer?.deliveryMethod}
            </div>
          </div>
        </div>
        <ChevronRight className={cn(
          'w-4 h-4 shrink-0 transition-all duration-200',
          selected ? 'text-pink-500 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-500'
        )} />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <FileText className="w-3 h-3" />
          <span>v{plan.version}.0</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{plan.createTime.slice(5, 16)}</span>
        </div>
      </div>

      <div className="mt-2.5 flex -space-x-1.5">
        {plan.assignedNurseIds.slice(0, 3).map((nid, i) => {
          const nurse = mockNurses.find(n => n.id === nid);
          return nurse ? (
            <Avatar key={nid + i} name={nurse.name} size="sm" />
          ) : null;
        })}
        {plan.assignedNurseIds.length > 3 && (
          <div className="w-7 h-7 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-[10px] text-slate-600 font-semibold">
            +{plan.assignedNurseIds.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}

function AlgorithmLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 rounded-2xl flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 via-fuchsia-400 to-purple-500 animate-pulse" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-white animate-bounce" />
        </div>
        <div className="absolute -inset-2 rounded-full border-2 border-dashed border-pink-300 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <div className="mt-6 space-y-2 text-center">
        <h3 className="text-lg font-bold text-slate-800">智能分配算法运行中</h3>
        <p className="text-sm text-slate-500">正在匹配最优护理团队，请稍候...</p>
      </div>
      <div className="mt-6 w-64 space-y-3">
        {[
          { text: '分析分娩方式特征...', delay: 0 },
          { text: '计算APGAR评分匹配度...', delay: 200 },
          { text: '评估母婴同室配置...', delay: 400 },
          { text: '综合技能经验加权排序...', delay: 600 },
          { text: '生成最优分配方案...', delay: 800 },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded-full border-2 border-pink-300 flex items-center justify-center animate-pulse" style={{ animationDelay: `${step.delay}ms` }}>
              <Loader2 className="w-2.5 h-2.5 text-pink-500 animate-spin" />
            </div>
            <span className="text-slate-600">{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NurseCard({ nurse, score }: { nurse: Nurse; score: number }) {
  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-pink-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        <Avatar name={nurse.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-800 text-sm">{nurse.name}</h4>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-600">{score}</span>
            </div>
          </div>
          <div className="mt-0.5 text-xs text-slate-500">{nurse.nurseLevel} · {nurse.yearsOfExperience}年经验</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {nurse.specialty.slice(0, 3).map(s => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 text-[10px] font-medium">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" />
            <span>本月工时 {nurse.monthlyWorkHours}/{nurse.maxWorkHours}h</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CarePlans() {
  const [carePlans, setCarePlans] = useState<CarePlan[]>(mockCarePlans);
  const [selectedId, setSelectedId] = useState<string | null>(mockCarePlans[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlgLoading, setIsAlgLoading] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');
  const [showHistory, setShowHistory] = useState(true);

  const selectedPlan = carePlans.find(p => p.id === selectedId);

  const filteredPlans = useMemo(() => {
    return carePlans.filter(p => {
      if (statusFilter !== '全部' && p.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.customerName.toLowerCase().includes(q) && !p.planName.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [carePlans, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: carePlans.length,
    pending: carePlans.filter(p => p.status === '待审批').length,
    approved: carePlans.filter(p => p.status === '已通过').length,
    rejected: carePlans.filter(p => p.status === '已驳回').length,
    adjusting: carePlans.filter(p => p.status === '已调整').length,
  }), [carePlans]);

  const runSmartAllocation = () => {
    setIsAlgLoading(true);
    setTimeout(() => {
      setIsAlgLoading(false);
    }, 3000);
  };

  const groupedTasks = useMemo(() => {
    if (!selectedPlan) return {};
    const groups: Record<string, CareTask[]> = {};
    selectedPlan.tasks.forEach(task => {
      const key = task.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });
    return groups;
  }, [selectedPlan]);

  const handleApprovalAction = (action: '通过' | '驳回' | '调整') => {
    if (!selectedPlan) return;
    const newStatus: CarePlanStatus = action === '通过' ? '已通过' : action === '驳回' ? '已驳回' : '已调整';
    const newRecord = {
      id: `AH-new-${Date.now()}`,
      operatorId: 'HM001',
      operatorName: '张桂兰护士长',
      action,
      comment: approvalComment || undefined,
      operateTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    };
    setCarePlans(prev => prev.map(p => p.id === selectedPlan.id ? {
      ...p,
      status: newStatus,
      approvedBy: action === '通过' ? '张桂兰护士长' : p.approvedBy,
      approvalHistory: [...p.approvalHistory, newRecord],
      updateTime: newRecord.operateTime,
    } : p));
    setApprovalComment('');
  };

  return (
    <div className="h-full flex flex-col -m-6">
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-pink-500" />
              护理方案管理
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">智能生成个性化照护方案，审批分配护理团队</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center px-3">
                <div className="text-lg font-bold text-slate-800">{stats.total}</div>
                <div className="text-[11px] text-slate-500">总方案</div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center px-3">
                <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
                <div className="text-[11px] text-slate-500">待审批</div>
              </div>
              <div className="text-center px-3">
                <div className="text-lg font-bold text-emerald-600">{stats.approved}</div>
                <div className="text-[11px] text-slate-500">已通过</div>
              </div>
              <div className="text-center px-3">
                <div className="text-lg font-bold text-sky-600">{stats.adjusting}</div>
                <div className="text-[11px] text-slate-500">调整中</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-96 bg-slate-50 border-r border-slate-200 shrink-0 flex flex-col overflow-hidden">
          <div className="p-4 space-y-3 bg-white border-b border-slate-200 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索客户名/方案名"
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 mb-2">
                <Filter className="w-3.5 h-3.5 text-pink-500" />
                状态筛选
              </div>
              <div className="flex flex-wrap gap-1.5">
                {statusFilters.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                      statusFilter === f.value
                        ? `${f.color} text-white border-transparent shadow-sm`
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {f.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredPlans.map(plan => (
              <CarePlanCard
                key={plan.id}
                plan={plan}
                selected={selectedId === plan.id}
                onClick={() => setSelectedId(plan.id)}
              />
            ))}
            {filteredPlans.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <div className="text-sm">未找到符合条件的方案</div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto relative">
          <AlgorithmLoadingOverlay show={isAlgLoading} />

          {selectedPlan ? (
            <div className="p-6 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-pink-50 via-rose-50 to-fuchsia-50 border-b border-pink-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={selectedPlan.customerName} size="lg" />
                    <div>
                      <h2 className="text-lg font-bold text-slate-800">{selectedPlan.planName}</h2>
                      <div className="mt-1 flex items-center gap-3 text-sm">
                        <span className="text-slate-600 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {selectedPlan.customerName}
                        </span>
                        <span className="text-slate-600 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          v{selectedPlan.version}.0
                        </span>
                        <StatusBadge status={selectedPlan.status} />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={runSmartAllocation}
                    disabled={isAlgLoading}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-pink-500/25 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    智能分配
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-white border border-rose-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">分娩方式匹配</h3>
                      <p className="text-[11px] text-slate-500">Delivery Matching</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">客户分娩方式</span>
                      <span className="font-medium text-rose-700">{selectedPlan.deliveryMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">匹配规则</span>
                      <span className="font-medium text-slate-700">伤口护理经验优先</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-rose-100 mt-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: '92%' }} />
                    </div>
                    <div className="text-right text-[10px] text-rose-600 font-semibold">匹配度 92%</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">评分匹配算法</h3>
                      <p className="text-[11px] text-slate-500">Score Matching</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">新生儿APGAR</span>
                      <span className="font-medium text-sky-700">{selectedPlan.apgarScore}分</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">匹配规则</span>
                      <span className="font-medium text-slate-700">低分→高级护理师</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-sky-100 mt-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500" style={{ width: selectedPlan.apgarScore >= 8 ? '78%' : '95%' }} />
                    </div>
                    <div className="text-right text-[10px] text-sky-600 font-semibold">匹配度 {selectedPlan.apgarScore >= 8 ? 78 : 95}%</div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-white border border-violet-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">同室配置策略</h3>
                      <p className="text-[11px] text-slate-500">Room Allocation</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">母婴同室</span>
                      <span className={cn('font-medium', selectedPlan.motherSameRoom ? 'text-violet-700' : 'text-slate-600')}>
                        {selectedPlan.motherSameRoom ? '是' : '否'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">配置方案</span>
                      <span className="font-medium text-slate-700">{selectedPlan.motherSameRoom ? '母婴护理双专长' : '专人分工模式'}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-violet-100 mt-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-violet-500" style={{ width: selectedPlan.motherSameRoom ? '88%' : '72%' }} />
                    </div>
                    <div className="text-right text-[10px] text-violet-600 font-semibold">匹配度 {selectedPlan.motherSameRoom ? 88 : 72}%</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-pink-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">分配护理师团队</h3>
                    <span className="text-xs text-slate-400">共 {selectedPlan.assignedNurseIds.length} 人</span>
                  </div>
                </div>
                <div className="p-5 grid grid-cols-2 gap-3">
                  {selectedPlan.assignedNurseIds.map((nid, i) => {
                    const nurse = mockNurses.find(n => n.id === nid);
                    if (!nurse) return null;
                    const baseScore = 85 + (nurse.yearsOfExperience * 0.8) + (nurse.nurseLevel === '主管护师' ? 8 : nurse.nurseLevel === '高级' ? 5 : nurse.nurseLevel === '中级' ? 3 : 0);
                    return (
                      <NurseCard key={nid + i} nurse={nurse} score={Math.round(Math.min(99, baseScore + i))} />
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">照护任务模板</h3>
                    <span className="text-xs text-slate-400">共 {selectedPlan.tasks.length} 项/日</span>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  {Object.entries(groupedTasks).map(([category, tasks]) => {
                    const style = categoryIcons[category as CareTask['category']];
                    const CatIcon = style.icon;
                    return (
                      <div key={category}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', style.bg)}>
                            <CatIcon className={cn('w-3.5 h-3.5', style.text)} />
                          </div>
                          <h4 className="font-semibold text-slate-700 text-sm">{category}</h4>
                          <span className="text-xs text-slate-400">每日 {tasks.length} 次</span>
                          <div className="flex-1 h-px bg-slate-100 ml-3" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 ml-9">
                          {tasks.map(task => (
                            <div
                              key={task.id}
                              className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-pink-50 hover:border-pink-100 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-slate-800 text-sm truncate">{task.taskName}</div>
                                  <div className="mt-1 text-[11px] text-slate-500 line-clamp-1">{task.description}</div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-[10px] text-slate-400">时长</div>
                                  <div className="text-xs font-semibold text-slate-700">{task.duration}分钟</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-semibold text-slate-800">方案审批</h3>
                  </div>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-xs text-slate-500 hover:text-pink-500 transition-colors flex items-center gap-1"
                  >
                    {showHistory ? '收起' : '展开'}审批历史
                    <ChevronRight className={cn('w-3 h-3 transition-transform', showHistory && 'rotate-90')} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
                      审批意见
                    </label>
                    <textarea
                      value={approvalComment}
                      onChange={e => setApprovalComment(e.target.value)}
                      rows={3}
                      placeholder="请输入审批意见（选填）..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleApprovalAction('通过')}
                      disabled={selectedPlan.status === '已通过'}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      通过方案
                    </button>
                    <button
                      onClick={() => handleApprovalAction('驳回')}
                      disabled={selectedPlan.status === '已驳回'}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回方案
                    </button>
                    <button
                      onClick={() => handleApprovalAction('调整')}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-sky-500/25 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      申请调整
                    </button>
                  </div>

                  {showHistory && (
                    <div className="pt-5 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        审批历史时间轴
                      </h4>
                      <div className="relative ml-3">
                        <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-gradient-to-b from-pink-300 via-slate-200 to-emerald-300" />
                        {selectedPlan.approvalHistory.map((record, idx) => {
                          const style = approvalActionStyles[record.action];
                          const ActIcon = style.icon;
                          const isLast = idx === selectedPlan.approvalHistory.length - 1;
                          return (
                            <div key={record.id} className="relative pl-10 pb-5 last:pb-0">
                              <div className={cn(
                                'absolute left-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white',
                                style.bg,
                                isLast && 'ring-pink-100 scale-110'
                              )}>
                                <ActIcon className={cn('w-3 h-3', style.color)} />
                              </div>
                              <div className={cn(
                                'rounded-xl p-4 transition-all',
                                isLast ? 'bg-gradient-to-br from-pink-50/80 to-white border border-pink-100' : 'bg-slate-50 border border-slate-100'
                              )}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', style.bg, style.color)}>
                                      {record.action}
                                    </span>
                                    <span className="text-sm font-medium text-slate-700">{record.operatorName}</span>
                                  </div>
                                  <span className="text-xs text-slate-400">{record.operateTime}</span>
                                </div>
                                {record.comment && (
                                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                    {record.comment}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-16 h-16 mb-4 text-slate-300" />
              <div className="text-lg font-medium">请从左侧选择一个护理方案</div>
              <div className="text-sm mt-1">或使用筛选功能查找目标方案</div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
