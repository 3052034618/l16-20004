import { useState, useMemo } from 'react';
import { X, User, BedDouble, Calendar, Clock, FileText, CheckSquare, ArrowRight, History, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { Room, Customer, CarePlan, CareTask } from '../types';

interface RoomDetailModalProps {
  room: Room;
  onClose: () => void;
  onOpenRoomList?: (roomType?: string) => void;
}

type TabKey = 'basic' | 'carePlan' | 'todayTasks' | 'history';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  '空闲': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '空闲' },
  '已入住': { bg: 'bg-pink-100', text: 'text-pink-700', label: '已入住' },
  '清洁中': { bg: 'bg-amber-100', text: 'text-amber-700', label: '清洁中' },
  '维修中': { bg: 'bg-gray-100', text: 'text-gray-700', label: '维修中' },
};

const taskStatusConfig: Record<string, { bg: string; text: string }> = {
  '待执行': { bg: 'bg-amber-100', text: 'text-amber-700' },
  '进行中': { bg: 'bg-sky-100', text: 'text-sky-700' },
  '已完成': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '已超时': { bg: 'bg-rose-100', text: 'text-rose-700' },
  '已取消': { bg: 'bg-gray-100', text: 'text-gray-700' },
  '调整中': { bg: 'bg-violet-100', text: 'text-violet-700' },
};

const planStatusConfig: Record<string, { bg: string; text: string }> = {
  '待审批': { bg: 'bg-amber-100', text: 'text-amber-700' },
  '已通过': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '已驳回': { bg: 'bg-rose-100', text: 'text-rose-700' },
  '已调整': { bg: 'bg-sky-100', text: 'text-sky-700' },
};

export default function RoomDetailModal({ room, onClose }: RoomDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('basic');
  const navigate = useNavigate();

  const customers = useAppStore(state => state.customers);
  const carePlans = useAppStore(state => state.carePlans);
  const careTasks = useAppStore(state => state.careTasks);
  const taskHandoverRecords = useAppStore(state => state.taskHandoverRecords);

  const customer = useMemo<Customer | undefined>(() => {
    if (room.status !== '已入住' || !room.customerId) return undefined;
    return customers.find(c => c.id === room.customerId);
  }, [customers, room.status, room.customerId]);

  const carePlan = useMemo<CarePlan | undefined>(() => {
    if (!customer?.carePlanId) return undefined;
    return carePlans.find(p => p.id === customer.carePlanId);
  }, [carePlans, customer?.carePlanId]);

  const todayTasks = useMemo<CareTask[]>(() => {
    if (!customer) return [];
    const today = new Date().toDateString();
    return careTasks.filter(t => 
      t.customerId === customer.id && 
      new Date(t.scheduledTime).toDateString() === today
    );
  }, [careTasks, customer]);

  const groupedTasks = useMemo(() => {
    const groups: { pending: CareTask[]; inProgress: CareTask[]; completed: CareTask[] } = {
      pending: [],
      inProgress: [],
      completed: [],
    };
    todayTasks.forEach(task => {
      if (task.status === '已完成') {
        groups.completed.push(task);
      } else if (task.status === '进行中') {
        groups.inProgress.push(task);
      } else {
        groups.pending.push(task);
      }
    });
    return groups;
  }, [todayTasks]);

  const historyRecords = useMemo(() => {
    const records: { id: string; time: string; action: string; operator: string }[] = [];

    if (carePlan) {
      carePlan.approvalHistory?.forEach(h => {
        records.push({
          id: h.id,
          time: h.operateTime,
          action: h.action + (h.comment ? `：${h.comment}` : ''),
          operator: h.operatorName,
        });
      });
    }

    taskHandoverRecords
      .filter(r => r.customerId === customer?.id)
      .forEach(r => {
        records.push({
          id: r.id,
          time: r.handoverTime,
          action: `任务交接【${r.taskName}】从${r.fromNurseName}交接给${r.toNurseName}`,
          operator: r.fromNurseName,
        });
      });

    return records
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 3);
  }, [carePlan, customer?.id, taskHandoverRecords]);

  const remainingDays = useMemo(() => {
    if (!customer?.expectedCheckOutDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expected = new Date(customer.expectedCheckOutDate);
    expected.setHours(0, 0, 0, 0);
    const diff = Math.ceil((expected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [customer?.expectedCheckOutDate]);

  const statusStyle = statusConfig[room.status] || statusConfig['空闲'];

  const handleViewCarePlan = () => {
    if (carePlan) {
      navigate(`/care-plans?planId=${carePlan.id}`);
      onClose();
    }
  };

  const handleViewTasks = () => {
    if (customer) {
      navigate(`/tasks?filter=${encodeURIComponent(customer.motherName)}`);
      onClose();
    }
  };

  const handleTaskClick = (task: CareTask) => {
    navigate(`/tasks?filter=${encodeURIComponent(task.customerName)}`);
    onClose();
  };

  const handlePlanClick = (plan: CarePlan) => {
    navigate(`/care-plans?planId=${plan.id}`);
    onClose();
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const timeAgo = (dateStr: string) => {
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
  };

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'basic', label: '基本信息', icon: MapPin },
    { key: 'carePlan', label: '护理方案', icon: FileText },
    { key: 'todayTasks', label: '今日任务', icon: CheckSquare },
    { key: 'history', label: '历史记录', icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        <div className="relative bg-gradient-to-r from-primary-500 to-rose-400 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <BedDouble className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">{room.roomNumber}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
              </div>
              <p className="mt-1 text-white/90">
                {room.roomType} · {room.area}㎡
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 max-h-[400px] overflow-y-auto">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">房间面积</p>
                  <p className="mt-1 text-xl font-bold text-gray-800">{room.area} ㎡</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">床位数量</p>
                  <p className="mt-1 text-xl font-bold text-gray-800">
                    {room.roomType === '标准间' ? '2张' : room.roomType === '豪华间' ? '2张' : '1张'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">日均价</p>
                  <p className="mt-1 text-xl font-bold text-gray-800">¥{room.pricePerDay}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500">剩余天数</p>
                  <p className="mt-1 text-xl font-bold text-gray-800">
                    {room.status === '已入住' ? `${remainingDays} 天` : '-'}
                  </p>
                </div>
              </div>

              {customer && (
                <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-500" />
                    当前入住客户
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white text-xl font-bold">
                      {customer.motherName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-semibold text-gray-800">{customer.motherName}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {customer.deliveryMethod} · {customer.babyCount}宝
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          入住：{formatDate(customer.checkInDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          预计离店：{formatDate(customer.expectedCheckOutDate)}
                        </span>
                      </div>
                    </div>
                    {remainingDays > 0 && (
                      <div className="text-right">
                        <p className="text-3xl font-bold text-pink-500">{remainingDays}</p>
                        <p className="text-xs text-gray-500">剩余天数</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {room.facilities && room.facilities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">房间设施</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.facilities.map((facility, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'carePlan' && (
            <div className="space-y-4">
              {carePlan ? (
                <div
                  className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-xl p-5 border border-primary-100 cursor-pointer hover:shadow-lg transition-all duration-200 group"
                  onClick={() => handlePlanClick(carePlan)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary-600 transition-colors">
                          {carePlan.planName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${planStatusConfig[carePlan.status]?.bg || 'bg-gray-100'} ${planStatusConfig[carePlan.status]?.text || 'text-gray-700'}`}>
                          {carePlan.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          版本：v{carePlan.version}
                        </span>
                        <span>{carePlan.phase}</span>
                        <span>{carePlan.deliveryMethod}</span>
                      </div>
                      {carePlan.remark && (
                        <p className="mt-3 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                          备注：{carePlan.remark}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="mt-4 pt-4 border-t border-primary-100 flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      包含 {carePlan.tasks.length} 项护理任务
                    </span>
                    <span className="text-sm text-primary-600 font-medium group-hover:underline">
                      查看详情 →
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无护理方案</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'todayTasks' && (
            <div className="space-y-6">
              {(['pending', 'inProgress', 'completed'] as const).map((groupKey) => {
                const groupTasks = groupedTasks[groupKey];
                const groupLabels = {
                  pending: { label: '待执行', count: groupTasks.length },
                  inProgress: { label: '进行中', count: groupTasks.length },
                  completed: { label: '已完成', count: groupTasks.length },
                };
                const group = groupLabels[groupKey];

                if (groupTasks.length === 0) return null;

                return (
                  <div key={groupKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-gray-800">{group.label}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {group.count}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {groupTasks.map((task) => {
                        const statusStyle = taskStatusConfig[task.status] || taskStatusConfig['待执行'];
                        return (
                          <div
                            key={task.id}
                            className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary-200 transition-all duration-200 group"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                                  {task.taskName}
                                </h4>
                                <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {task.assigneeName || '未分配'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(task.scheduledTime)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                  {task.status}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {todayTasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>今日暂无任务</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {historyRecords.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-gray-200" />
                  {historyRecords.map((record, idx) => (
                    <div key={record.id} className="relative flex gap-4 pl-12 pb-4 last:pb-0">
                      <div className={`absolute left-3 top-1 w-4 h-4 rounded-full border-4 border-white ${
                        idx === 0 ? 'bg-primary-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 bg-gray-50 rounded-xl p-4">
                        <p className="text-sm text-gray-800">{record.action}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>操作人：{record.operator}</span>
                          <span>{timeAgo(record.time)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无操作记录</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
          >
            关闭
          </button>
          <div className="flex gap-2">
            {carePlan && (
              <button
                onClick={handleViewCarePlan}
                className="px-5 py-2 rounded-xl bg-primary-50 text-primary-600 font-medium hover:bg-primary-100 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                查看护理方案
              </button>
            )}
            {customer && (
              <button
                onClick={handleViewTasks}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-rose-400 text-white font-medium hover:shadow-lg transition-all duration-200 flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                查看任务
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
