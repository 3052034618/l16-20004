import { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Wrench,
  Boxes,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  Cpu,
  Thermometer,
  Activity,
  Wind,
  Bath,
  Baby,
  Stethoscope,
  Scale,
  Fan,
  Phone,
  Sun,
  HeartPulse,
  Filter,
  ChevronRight,
  Ban,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  UserCheck,
} from 'lucide-react';
import type { Equipment, MaintenanceWorkOrder, WorkOrderPriority, SparePart, Nurse } from '@/types';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

type EquipmentTab = 'ledger' | 'workorders' | 'spareparts';

const equipmentCategoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  '母婴护理设备': Baby,
  '监测设备': Activity,
  '康复设备': HeartPulse,
  '环境设备': Wind,
  '办公设备': Cpu,
};

const equipmentCategoryGradients: Record<string, string> = {
  '母婴护理设备': 'from-pink-500 to-rose-400',
  '监测设备': 'from-sky-500 to-blue-400',
  '康复设备': 'from-violet-500 to-purple-400',
  '环境设备': 'from-emerald-500 to-green-400',
  '办公设备': 'from-amber-500 to-orange-400',
};

const fallbackIcons = [Cpu, Thermometer, Activity, Wind, Bath, Baby, Stethoscope, Scale, Fan, Phone, Sun, HeartPulse];

const statusColors: Record<Equipment['status'], string> = {
  '正常': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '使用中': 'bg-blue-100 text-blue-700 border-blue-200',
  '待维护': 'bg-amber-100 text-amber-700 border-amber-200',
  '维修中': 'bg-rose-100 text-rose-700 border-rose-200',
  '已报废': 'bg-slate-100 text-slate-600 border-slate-200',
};

const workOrderStatusStyles: Record<MaintenanceWorkOrder['status'], { bg: string; text: string; dot: string }> = {
  '待处理': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  '处理中': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  '已完成': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  '已延期': { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
};

const priorityColors: Record<WorkOrderPriority, string> = {
  '紧急': 'bg-red-100 text-red-700 border-red-200',
  '高': 'bg-rose-100 text-rose-700 border-rose-200',
  '中': 'bg-amber-100 text-amber-700 border-amber-200',
  '低': 'bg-slate-100 text-slate-600 border-slate-200',
};

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative',
        active
          ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-sky-500/25'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50/50'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center',
          active ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function EquipmentLedger() {
  const { equipment, maintenanceWorkOrders, addMaintenanceWorkOrder } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');

  const categories = Array.from(new Set(equipment.map((e) => e.category)));
  const statuses: Equipment['status'][] = ['正常', '使用中', '待维护', '维修中', '已报废'];

  const filteredEquipments = equipment.filter((eq) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !eq.name.toLowerCase().includes(q) &&
        !eq.serialNumber.toLowerCase().includes(q) &&
        !eq.model.toLowerCase().includes(q)
      )
        return false;
    }
    if (statusFilter !== '全部' && eq.status !== statusFilter) return false;
    if (categoryFilter !== '全部' && eq.category !== categoryFilter) return false;
    return true;
  });

  const getEquipmentIcon = (equipment: Equipment, index: number) => {
    const CategoryIcon = equipmentCategoryIcons[equipment.category];
    if (CategoryIcon) return CategoryIcon;
    return fallbackIcons[index % fallbackIcons.length];
  };

  const handleGenerateWorkOrder = (eq: Equipment) => {
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');

    const existingIds = maintenanceWorkOrders.map((wo) => parseInt(wo.id.replace('WO', '')));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = `WO${String(maxId + 1).padStart(3, '0')}`;

    const newOrder: MaintenanceWorkOrder = {
      id: newId,
      title: `${eq.name}定期维护`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      equipmentModel: eq.model,
      orderType: '定期维护',
      priority: '中',
      status: '待处理',
      description: `设备使用次数已达 ${eq.usageCount}/${eq.maxUsageCount}，达到使用寿命阈值，建议进行定期维护保养。内容包括：全面检查、清洁保养、易损件更换、性能校准等。`,
      createTime: `${y}-${m}-${d} ${h}:${min}:00`,
      estimatedDuration: 120,
      sparePartsUsed: [],
    };

    addMaintenanceWorkOrder(newOrder);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索设备名称/序列号/型号"
              className="w-72 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <button
              onClick={() => setCategoryFilter('全部')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                categoryFilter === '全部'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
              )}
            >
              全部类型
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  categoryFilter === cat
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('全部')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === '全部'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
              )}
            >
              全部状态
            </button>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-sky-500/25 transition-all">
            <Plus className="w-4 h-4" />
            新增设备
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {filteredEquipments.map((equipment, idx) => {
          const Icon = getEquipmentIcon(equipment, idx);
          const usageRatio = (equipment.usageCount / equipment.maxUsageCount) * 100;
          const isNearThreshold = equipment.maxUsageCount > 0 && (equipment.usageCount / equipment.maxUsageCount) >= 0.8;
          const isWarning = equipment.status === '待维护';
          const gradient = equipmentCategoryGradients[equipment.category] || 'from-slate-500 to-slate-400';

          const hasPendingOrder = maintenanceWorkOrders.some(
            (wo) => wo.equipmentId === equipment.id && wo.orderType === '定期维护' && (wo.status === '待处理' || wo.status === '处理中')
          );

          return (
            <div
              key={equipment.id}
              className={cn(
                'group bg-white rounded-2xl border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer',
                isWarning ? 'border-amber-300 shadow-amber-100/50 shadow-md' : 'border-slate-200'
              )}
            >
              <div className={cn('h-24 bg-gradient-to-br relative overflow-hidden', gradient)}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-14 h-14 text-white/70" />
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-semibold text-white">
                    {equipment.category}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-semibold border backdrop-blur-sm',
                    statusColors[equipment.status]
                  )}>
                    {equipment.status}
                  </span>
                </div>
                <div className="absolute bottom-2 right-3 opacity-20">
                  <Icon className="w-20 h-20 text-white" />
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {equipment.name}
                  </h3>
                  {isNearThreshold && (
                    <div className="shrink-0" title="使用次数接近阈值">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">型号:</span>
                    <span className="text-slate-700 font-mono truncate">{equipment.model}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">序列号:</span>
                    <span className="text-slate-700 font-mono truncate">{equipment.serialNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">位置:</span>
                    <span className="text-slate-700 truncate">{equipment.location}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500">使用进度</span>
                    <span className={cn(
                      'text-[11px] font-semibold',
                      isNearThreshold ? 'text-amber-600' : 'text-slate-700'
                    )}>
                      {equipment.usageCount.toLocaleString()} / {equipment.maxUsageCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isNearThreshold
                          ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                          : 'bg-gradient-to-r from-sky-500 to-blue-400'
                      )}
                      style={{ width: `${Math.min(100, usageRatio)}%` }}
                    />
                  </div>
                  {isNearThreshold && (
                    <div className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="text-[10px] text-amber-700">接近使用寿命阈值，建议检查</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    下次维保: {equipment.nextMaintenanceDate}
                  </div>
                  {isNearThreshold && !hasPendingOrder ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateWorkOrder(equipment);
                      }}
                      className="flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-[11px] text-white font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm shadow-amber-500/30"
                    >
                      <Wrench className="w-3 h-3 mr-0.5" />
                      生成工单
                    </button>
                  ) : (
                    <button className="flex items-center gap-0.5 text-[11px] text-sky-600 font-medium hover:text-sky-700 transition-colors">
                      详情
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssignDialog({
  open,
  onClose,
  order,
  nurses,
  equipment,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  order: MaintenanceWorkOrder | null;
  nurses: Nurse[];
  equipment: Equipment[];
  onSubmit: (data: { assigneeId: string; assigneeName: string; estimatedDuration: number; remark: string }) => void;
}) {
  const [selectedEngineer, setSelectedEngineer] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [remark, setRemark] = useState<string>('');
  const [engineerDropdownOpen, setEngineerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedEngineer('');
      setEstimatedHours(2);
      setRemark('');
      setEngineerDropdownOpen(false);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEngineerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open || !order) return null;

  const selectedNurse = nurses.find((n) => n.id === selectedEngineer);
  const orderEquipment = equipment.find((e) => e.id === order.equipmentId);
  const canSubmit = selectedEngineer && estimatedHours > 0;

  const handleSubmit = () => {
    if (!canSubmit || !selectedNurse) return;
    onSubmit({
      assigneeId: selectedEngineer,
      assigneeName: selectedNurse.name,
      estimatedDuration: estimatedHours,
      remark,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-sky-500 to-blue-500 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <UserCheck className="w-5 h-5" />
            <h3 className="text-lg font-bold">派工</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-5 bg-slate-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">工单信息</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">设备名:</span>
                <span className="text-slate-800 font-medium">{order.equipmentName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">型号:</span>
                <span className="text-slate-700 font-mono">{order.equipmentModel}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">位置:</span>
                <span className="text-slate-700">{orderEquipment?.location || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">优先级:</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                  priorityColors[order.priority]
                )}>
                  {order.priority}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 w-16">类型:</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-700">
                  <Wrench className="w-3 h-3" />
                  {order.orderType}
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              分配工程师 <span className="text-rose-500">*</span>
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setEngineerDropdownOpen(!engineerDropdownOpen)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-colors',
                  selectedEngineer
                    ? 'border-sky-300 bg-sky-50/50'
                    : 'border-slate-200 hover:border-sky-300'
                )}
              >
                {selectedNurse ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
                      <span className="text-xs text-white font-bold">
                        {selectedNurse.name.slice(0, 1)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{selectedNurse.name}</div>
                      <div className="text-[11px] text-slate-500">{selectedNurse.nurseLevel}</div>
                    </div>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm">请选择工程师</span>
                )}
                <ChevronRight
                  className={cn(
                    'w-4 h-4 text-slate-400 shrink-0 transition-transform',
                    engineerDropdownOpen && 'rotate-90'
                  )}
                />
              </button>
              {engineerDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                  {nurses.map((nurse) => (
                    <button
                      key={nurse.id}
                      type="button"
                      onClick={() => {
                        setSelectedEngineer(nurse.id);
                        setEngineerDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2.5 transition-colors flex items-center gap-3 hover:bg-slate-50',
                        selectedEngineer === nurse.id ? 'bg-sky-50' : ''
                      )}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
                        <span className="text-xs text-white font-bold">
                          {nurse.name.slice(0, 1)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">{nurse.name}</div>
                        <div className="text-[11px] text-slate-500">{nurse.nurseLevel}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              预计工时（小时） <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
              placeholder="请输入预计工时"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              派工备注
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 resize-none"
              placeholder="请输入派工备注（可选）"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              'px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all flex items-center gap-2',
              canSubmit
                ? 'bg-gradient-to-r from-sky-500 to-blue-500 hover:shadow-lg hover:shadow-sky-500/25'
                : 'bg-slate-300 cursor-not-allowed'
            )}
          >
            <UserCheck className="w-4 h-4" />
            确认派工
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkOrders() {
  const { maintenanceWorkOrders, updateMaintenanceWorkOrder, spareParts, updateSparePart, nurses, equipment } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [priorityFilter, setPriorityFilter] = useState<string>('全部');
  const [equipmentFilter, setEquipmentFilter] = useState<string>('全部');
  const [engineerFilter, setEngineerFilter] = useState<string>('全部');
  const [equipmentDropdownOpen, setEquipmentDropdownOpen] = useState(false);
  const [engineerDropdownOpen, setEngineerDropdownOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceWorkOrder | null>(null);
  const equipmentDropdownRef = useRef<HTMLDivElement>(null);
  const engineerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (equipmentDropdownRef.current && !equipmentDropdownRef.current.contains(e.target as Node)) {
        setEquipmentDropdownOpen(false);
      }
      if (engineerDropdownRef.current && !engineerDropdownRef.current.contains(e.target as Node)) {
        setEngineerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const priorityOptions = [
    { value: '全部', label: '全部优先级' },
    { value: '紧急', label: '最高级（紧急）' },
    { value: '高', label: '高' },
    { value: '中', label: '中' },
    { value: '低', label: '低' },
  ];

  const filteredOrders = maintenanceWorkOrders.filter((wo) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !wo.equipmentName.toLowerCase().includes(q) &&
        !wo.id.toLowerCase().includes(q) &&
        !wo.title.toLowerCase().includes(q)
      )
        return false;
    }
    if (statusFilter !== '全部' && wo.status !== statusFilter) return false;
    if (priorityFilter !== '全部') {
      if (priorityFilter === '紧急') {
        if (wo.priority !== '高' && wo.priority !== '紧急') return false;
      } else {
        if (wo.priority !== priorityFilter) return false;
      }
    }
    if (equipmentFilter !== '全部' && wo.equipmentId !== equipmentFilter) return false;
    if (engineerFilter !== '全部' && wo.assigneeId !== engineerFilter) return false;
    return true;
  });

  const handleStatusChange = (orderId: string, newStatus: MaintenanceWorkOrder['status']) => {
    const order = maintenanceWorkOrders.find((wo) => wo.id === orderId);
    if (!order) return;

    if (newStatus === '已完成') {
      order.sparePartsUsed.forEach((part) => {
        const sparePart = spareParts.find((sp) => sp.id === part.partId);
        if (sparePart) {
          const newStock = Math.max(0, sparePart.currentStock - part.quantity);
          let newStatus: SparePart['status'] = '正常';
          if (newStock < sparePart.safeStock * 0.5) {
            newStatus = '紧缺';
          } else if (newStock < sparePart.safeStock) {
            newStatus = '预警';
          }
          updateSparePart(part.partId, {
            currentStock: newStock,
            status: newStatus,
          });
        }
      });
    }

    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const nowStr = `${y}-${m}-${d} ${h}:${min}:00`;

    const updates: Partial<MaintenanceWorkOrder> = {
      status: newStatus,
    };

    if (newStatus === '处理中' && !order.startTime) {
      updates.startTime = nowStr;
    }

    if (newStatus === '已完成') {
      updates.completeTime = nowStr;
      if (!order.actualDuration && order.startTime) {
        const start = new Date(order.startTime.replace(/-/g, '/'));
        const end = new Date();
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
        updates.actualDuration = duration;
      }
    }

    updateMaintenanceWorkOrder(orderId, updates);
  };

  const handleAssign = (order: MaintenanceWorkOrder) => {
    setSelectedOrder(order);
    setAssignDialogOpen(true);
  };

  const handleAssignSubmit = (data: { assigneeId: string; assigneeName: string; estimatedDuration: number; remark: string }) => {
    if (!selectedOrder) return;

    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    const h = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const startTimeStr = `${y}-${m}-${d} ${h}:${min}:00`;

    const updates: Partial<MaintenanceWorkOrder> = {
      status: '处理中',
      assigneeId: data.assigneeId,
      assigneeName: data.assigneeName,
      startTime: startTimeStr,
      estimatedDuration: data.estimatedDuration * 60,
      remark: data.remark,
    };

    updateMaintenanceWorkOrder(selectedOrder.id, updates);
    setSelectedOrder(null);
  };

  const getNextActions = (currentStatus: MaintenanceWorkOrder['status']): { label: string; action: 'assign' | 'complete'; icon: React.ComponentType<{ className?: string }>; style: string }[] => {
    switch (currentStatus) {
      case '待处理':
        return [
          { label: '派工', action: 'assign', icon: UserCheck, style: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-sky-500/25' },
        ];
      case '处理中':
        return [
          { label: '完成工单', action: 'complete', icon: CheckCircle2, style: 'bg-emerald-500 text-white hover:bg-emerald-600' },
        ];
      case '已延期':
        return [
          { label: '派工', action: 'assign', icon: UserCheck, style: 'bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:shadow-lg hover:shadow-sky-500/25' },
        ];
      default:
        return [];
    }
  };

  const triggerReasons: Record<string, string> = {
    '故障维修': '设备故障报修',
    '保养': '达到保养周期',
    '定期维护': '计划内定期维护',
  };

  const stats = {
    pending: filteredOrders.filter((w) => w.status === '待处理').length,
    processing: filteredOrders.filter((w) => w.status === '处理中').length,
    completed: filteredOrders.filter((w) => w.status === '已完成').length,
    delayed: filteredOrders.filter((w) => w.status === '已延期').length,
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">待处理</div>
              <div className="text-3xl font-bold mt-1">{stats.pending}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl p-5 text-white shadow-lg shadow-sky-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">处理中</div>
              <div className="text-3xl font-bold mt-1">{stats.processing}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">已完成</div>
              <div className="text-3xl font-bold mt-1">{stats.completed}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-400 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">已延期</div>
              <div className="text-3xl font-bold mt-1">{stats.delayed}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索设备名称/工单编号"
              className="w-72 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <button
              onClick={() => setStatusFilter('全部')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === '全部'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
              )}
            >
              全部状态
            </button>
            {(['待处理', '处理中', '已完成', '已延期'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {priorityOptions.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriorityFilter(p.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  priorityFilter === p.value
                    ? p.value === '紧急'
                      ? 'bg-rose-500 text-white'
                      : 'bg-sky-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="relative" ref={equipmentDropdownRef}>
            <button
              onClick={() => {
                setEquipmentDropdownOpen(!equipmentDropdownOpen);
                setEngineerDropdownOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors min-w-[180px]',
                equipmentFilter === '全部'
                  ? 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                  : 'bg-sky-500 text-white border-sky-500'
              )}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="flex-1 text-left truncate">
                {equipmentFilter === '全部'
                  ? '全部设备'
                  : equipment.find((e) => e.id === equipmentFilter)?.name || '全部设备'}
              </span>
              <ChevronRight
                className={cn(
                  'w-3.5 h-3.5 shrink-0 transition-transform',
                  equipmentDropdownOpen && 'rotate-90'
                )}
              />
            </button>
            {equipmentDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setEquipmentFilter('全部');
                    setEquipmentDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs transition-colors',
                    equipmentFilter === '全部'
                      ? 'bg-sky-50 text-sky-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  全部设备
                </button>
                {equipment.map((eq) => (
                  <button
                    key={eq.id}
                    onClick={() => {
                      setEquipmentFilter(eq.id);
                      setEquipmentDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors border-t border-slate-50',
                      equipmentFilter === eq.id
                        ? 'bg-sky-50 text-sky-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className="font-medium">{eq.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">📍 {eq.location}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative" ref={engineerDropdownRef}>
            <button
              onClick={() => {
                setEngineerDropdownOpen(!engineerDropdownOpen);
                setEquipmentDropdownOpen(false);
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors min-w-[160px]',
                engineerFilter === '全部'
                  ? 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'
                  : 'bg-sky-500 text-white border-sky-500'
              )}
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-white font-bold">
                  {engineerFilter === '全部'
                    ? '全'
                    : nurses.find((n) => n.id === engineerFilter)?.name.slice(0, 1) || '全'}
                </span>
              </div>
              <span className="flex-1 text-left truncate">
                {engineerFilter === '全部'
                  ? '全部工程师'
                  : nurses.find((n) => n.id === engineerFilter)?.name || '全部工程师'}
              </span>
              <ChevronRight
                className={cn(
                  'w-3.5 h-3.5 shrink-0 transition-transform',
                  engineerDropdownOpen && 'rotate-90'
                )}
              />
            </button>
            {engineerDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-60 max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                <button
                  onClick={() => {
                    setEngineerFilter('全部');
                    setEngineerDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2',
                    engineerFilter === '全部'
                      ? 'bg-sky-50 text-sky-600 font-medium'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-slate-500 font-bold">全</span>
                  </div>
                  全部工程师
                </button>
                {nurses.map((nurse) => (
                  <button
                    key={nurse.id}
                    onClick={() => {
                      setEngineerFilter(nurse.id);
                      setEngineerDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 border-t border-slate-50',
                      engineerFilter === nurse.id
                        ? 'bg-sky-50 text-sky-600 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-white font-bold">
                        {nurse.name.slice(0, 1)}
                      </span>
                    </div>
                    <span>{nurse.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-sky-500/25 transition-all">
            <Plus className="w-4 h-4" />
            新建工单
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">工单信息</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">类型/优先级</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">触发原因</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">状态</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">分配人</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">日期</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((wo) => {
                const statusStyle = workOrderStatusStyles[wo.status];
                const actions = getNextActions(wo.status);
                return (
                  <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono">{wo.id}</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                            priorityColors[wo.priority]
                          )}>
                            {wo.priority}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate-800 mt-1">{wo.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {wo.equipmentName} · {wo.equipmentModel}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700 w-fit">
                          <Wrench className="w-3 h-3" />
                          {wo.orderType}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-600 max-w-xs">
                        {triggerReasons[wo.orderType] || '系统触发'}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border',
                        statusStyle.bg,
                        statusStyle.text
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
                        <span className="text-xs font-semibold">{wo.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {wo.assigneeName ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-xs font-bold">
                            {wo.assigneeName.slice(0, 1)}
                          </div>
                          <span className="text-xs font-medium text-slate-700">{wo.assigneeName}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Ban className="w-3 h-3" />
                          待分配
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-600">
                        <div className="font-medium text-slate-700">{wo.createTime.split(' ')[0]}</div>
                        <div className="text-slate-400 mt-0.5">{wo.createTime.split(' ')[1]}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {actions.map((action, idx) => {
                          const ActionIcon = action.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (action.action === 'assign') {
                                  handleAssign(wo);
                                } else if (action.action === 'complete') {
                                  handleStatusChange(wo.id, '已完成');
                                }
                              }}
                              className={cn(
                                'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm',
                                action.style
                              )}
                            >
                              <ActionIcon className="w-3 h-3" />
                              {action.label}
                            </button>
                          );
                        })}
                        {actions.length === 0 && (
                          <span className="text-xs text-slate-400">已归档</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AssignDialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        nurses={nurses}
        equipment={equipment}
        onSubmit={handleAssignSubmit}
      />
    </div>
  );
}

function SparePartsInventory() {
  const { spareParts } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');

  const categories = Array.from(new Set(spareParts.map((p) => p.category)));

  const getRowBgClass = (item: SparePart) => {
    const ratio = item.currentStock / item.safeStock;
    if (ratio < 0.5) return 'bg-rose-50 hover:bg-rose-100/80';
    if (ratio < 1) return 'bg-amber-50 hover:bg-amber-100/80';
    return 'hover:bg-slate-50';
  };

  const getStatusBadge = (status: SparePart['status']) => {
    const styles: Record<SparePart['status'], string> = {
      '正常': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      '预警': 'bg-amber-100 text-amber-700 border-amber-200',
      '紧缺': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return styles[status];
  };

  const filteredItems = spareParts.filter((item) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== '全部' && item.category !== categoryFilter) return false;
    return true;
  });

  const stockStats = {
    normal: spareParts.filter((i) => i.currentStock >= i.safeStock).length,
    warning: spareParts.filter((i) => i.currentStock < i.safeStock && i.currentStock >= i.safeStock * 0.5).length,
    critical: spareParts.filter((i) => i.currentStock < i.safeStock * 0.5).length,
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">库存正常</div>
              <div className="text-3xl font-bold mt-1">{stockStats.normal}</div>
              <div className="text-xs opacity-80 mt-1">备件充足</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">库存预警</div>
              <div className="text-3xl font-bold mt-1">{stockStats.warning}</div>
              <div className="text-xs opacity-80 mt-1">低于安全库存</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-pink-400 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">库存紧缺</div>
              <div className="text-3xl font-bold mt-1">{stockStats.critical}</div>
              <div className="text-xs opacity-80 mt-1">低于50%安全库存</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索备件名称"
              className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCategoryFilter('全部')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                categoryFilter === '全部'
                  ? 'bg-sky-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
              )}
            >
              全部
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  categoryFilter === cat
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新库存
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-sky-500/25 transition-all">
            <Plus className="w-4 h-4" />
            新增备件
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">备件名称</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">分类</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">适用型号</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">当前库存</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">安全库存</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">库存水位</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">状态</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">存放位置</th>
                <th className="px-5 py-4 text-right text-xs font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const ratio = Math.min(100, (item.currentStock / Math.max(item.safeStock, 1)) * 100);
                const isCritical = ratio < 50;
                const isWarning = ratio >= 50 && ratio < 100;
                return (
                  <tr key={item.id} className={cn('transition-colors', getRowBgClass(item))}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                          <Package className="w-4.5 h-4.5 text-sky-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-500">
                            单价: ¥{item.unitPrice.toLocaleString()} · 供应商: {item.supplier}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.compatibleModels.map((m, idx) => (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={cn(
                        'text-sm font-bold',
                        isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-800'
                      )}>
                        {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {item.safeStock} <span className="text-xs text-slate-500">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 w-48">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              isCritical
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                                : isWarning
                                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                : 'bg-gradient-to-r from-emerald-500 to-green-400'
                            )}
                            style={{ width: `${Math.min(100, ratio)}%` }}
                          />
                        </div>
                        <span className={cn(
                          'text-xs font-semibold w-10 text-right',
                          isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                        )}>
                          {Math.round(ratio)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-semibold border',
                        getStatusBadge(item.status)
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-600">{item.location}</div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          isCritical
                            ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/25'
                            : isWarning
                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/25'
                            : 'bg-sky-50 text-sky-600 hover:bg-sky-100'
                        )}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        补货
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Equipment() {
  const { equipment, maintenanceWorkOrders } = useAppStore();
  const [activeTab, setActiveTab] = useState<EquipmentTab>('ledger');

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Cpu className="w-6 h-6 text-sky-500" />
              设备管理
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              设备台账、维保工单与备件库存一体化管理平台
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <TabButton
            active={activeTab === 'ledger'}
            onClick={() => setActiveTab('ledger')}
            icon={ClipboardList}
            label="设备台账"
            badge={equipment.length}
          />
          <TabButton
            active={activeTab === 'workorders'}
            onClick={() => setActiveTab('workorders')}
            icon={Wrench}
            label="维保工单"
            badge={maintenanceWorkOrders.filter((w) => w.status === '待处理' || w.status === '处理中').length}
          />
          <TabButton
            active={activeTab === 'spareparts'}
            onClick={() => setActiveTab('spareparts')}
            icon={Boxes}
            label="备件库存"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'ledger' && <EquipmentLedger />}
        {activeTab === 'workorders' && <WorkOrders />}
        {activeTab === 'spareparts' && <SparePartsInventory />}
      </div>
    </div>
  );
}
