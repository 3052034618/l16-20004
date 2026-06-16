import { useState, useRef, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Calendar, FileText, Download, TrendingUp, Users,
  Clock, CheckCircle, AlertTriangle, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';
import type { RoomType } from '../types';
import { useAppStore } from '../store';

const pinkPalette = [
  '#E91E63', '#EC407A', '#F06292', '#F48FB1',
  '#F8BBD0', '#FCE4EC'
];

const roomTypeList: RoomType[] = ['标准间', '豪华间', 'VIP套房', '总统套房'];

const weeklyOccupancyBase = [
  { period: '第1周' },
  { period: '第2周' },
  { period: '第3周' },
  { period: '第4周' },
];

const monthlyOccupancyBase = [
  { period: '1月' },
  { period: '2月' },
  { period: '3月' },
  { period: '4月' },
  { period: '5月' },
  { period: '6月' },
];

export default function Reports() {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState({ start: '2026-06-01', end: '2026-06-17' });
  const [selectedRoomType, setSelectedRoomType] = useState<string>('全部');
  const [timeMode, setTimeMode] = useState<'week' | 'month'>('month');
  const [isExporting, setIsExporting] = useState(false);

  const customers = useAppStore(state => state.customers);
  const rooms = useAppStore(state => state.rooms);
  const careTasks = useAppStore(state => state.careTasks);
  const nurses = useAppStore(state => state.nurses);

  const filteredRooms = useMemo(() => {
    if (selectedRoomType === '全部') return rooms;
    return rooms.filter(r => r.roomType === selectedRoomType);
  }, [rooms, selectedRoomType]);

  const filteredRoomIds = useMemo(() => new Set(filteredRooms.map(r => r.id)), [filteredRooms]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => filteredRoomIds.has(c.roomId));
  }, [customers, filteredRoomIds]);

  const filteredCustomerIds = useMemo(() => new Set(filteredCustomers.map(c => c.id)), [filteredCustomers]);

  const occupancyData = useMemo(() => {
    const baseData = timeMode === 'week' ? weeklyOccupancyBase : monthlyOccupancyBase;
    const multiplier = timeMode === 'week' ? 0.25 : 1;

    return baseData.map((item, idx) => {
      const result: Record<string, any> = { period: item.period };
      roomTypeList.forEach(type => {
        if (selectedRoomType === '全部' || selectedRoomType === type) {
          const typeRooms = rooms.filter(r => r.roomType === type);
          const typeOccupied = typeRooms.filter(r => r.status === '已入住').length;
          const baseCount = Math.max(1, Math.round(typeOccupied * (0.85 + idx * 0.03) * multiplier));
          result[type] = baseCount;
        }
      });
      return result;
    });
  }, [timeMode, selectedRoomType, rooms]);

  const chartRoomTypes = useMemo(() => {
    if (selectedRoomType === '全部') return roomTypeList;
    return [selectedRoomType] as RoomType[];
  }, [selectedRoomType]);

  const roomTypeDistribution = useMemo(() => {
    if (selectedRoomType === '全部') {
      const total = rooms.length;
      const byType: Record<string, number> = {};
      roomTypeList.forEach(type => {
        byType[type] = rooms.filter(r => r.roomType === type).length;
      });
      return roomTypeList.map(type => ({
        name: type,
        value: byType[type],
        percent: ((byType[type] / total) * 100).toFixed(1)
      }));
    } else {
      const total = rooms.length;
      const selectedCount = rooms.filter(r => r.roomType === selectedRoomType).length;
      const otherCount = total - selectedCount;
      return [
        {
          name: selectedRoomType,
          value: selectedCount,
          percent: ((selectedCount / total) * 100).toFixed(1)
        },
        {
          name: '其他房型',
          value: otherCount,
          percent: ((otherCount / total) * 100).toFixed(1)
        }
      ];
    }
  }, [rooms, selectedRoomType]);

  const occupancyRateByType = useMemo(() => {
    const types = selectedRoomType === '全部' ? roomTypeList : [selectedRoomType] as RoomType[];
    return types.map(type => {
      const typeRooms = rooms.filter(r => r.roomType === type);
      const occupied = typeRooms.filter(r => r.status === '已入住').length;
      const rate = typeRooms.length > 0 ? (occupied / typeRooms.length) * 100 : 0;
      return {
        name: type,
        value: Number(rate.toFixed(1))
      };
    });
  }, [rooms, selectedRoomType]);

  const satisfactionRadarData = useMemo(() => {
    const targetCustomers = filteredCustomers.length > 0 ? filteredCustomers : customers;
    const baseScores: Record<string, number[]> = {
      '环境': [],
      '服务': [],
      '餐饮': [],
      '护理': [],
      '专业': [],
      '设施': [],
    };
    const dimensions = ['环境', '服务', '餐饮', '护理', '专业', '设施'] as const;
    targetCustomers.forEach((c, idx) => {
      const base = c.satisfactionScore ? c.satisfactionScore * 20 : 88;
      dimensions.forEach((dim, dIdx) => {
        const variation = ((idx + dIdx) % 7) - 3;
        baseScores[dim].push(Math.min(100, Math.max(70, base + variation)));
      });
    });
    return dimensions.map(dim => ({
      dimension: dim,
      score: Number((
        baseScores[dim].length > 0
          ? baseScores[dim].reduce((s, v) => s + v, 0) / baseScores[dim].length
          : 88
      ).toFixed(0)),
      fullMark: 100
    }));
  }, [filteredCustomers, customers]);

  const satisfactionTrendData = useMemo(() => {
    const targetCustomers = filteredCustomers.length > 0 ? filteredCustomers : customers;
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const baseAvg = targetCustomers.length > 0
      ? (targetCustomers.reduce((s, c) => s + (c.satisfactionScore ? c.satisfactionScore * 20 : 88), 0) / targetCustomers.length)
      : 90;

    return months.map((month, idx) => {
      const trend = Math.round((idx - 2.5) * 0.8);
      const avg = Math.min(100, Math.max(75, baseAvg + trend));
      return {
        month,
        '平均分': Number(avg.toFixed(0)),
        '环境': Number((avg + (idx % 3) - 1).toFixed(0)),
        '服务': Number((avg + 2 + (idx % 2)).toFixed(0)),
        '餐饮': Number((avg - 3 + (idx % 4) - 1).toFixed(0)),
        '护理': Number((avg + 1 + (idx % 3)).toFixed(0)),
        '专业': Number((avg - 1 + (idx % 2)).toFixed(0)),
        '设施': Number((avg - 4 + (idx % 3)).toFixed(0)),
      };
    });
  }, [filteredCustomers, customers]);

  const taskEfficiencyData = useMemo(() => {
    return nurses.map(nurse => {
      const nurseTasks = careTasks.filter(
        t => t.assigneeId === nurse.id && filteredCustomerIds.has(t.customerId)
      );
      const total = nurseTasks.length;
      const completed = nurseTasks.filter(t => t.status === '已完成').length;
      const overdue = nurseTasks.filter(t => t.isOverdue).length;
      const avgDuration = total > 0
        ? Math.round(nurseTasks.reduce((sum, t) => sum + (t.actualDuration ?? t.duration), 0) / total)
        : 0;
      return {
        nurseName: nurse.name,
        nurseLevel: nurse.nurseLevel,
        totalTasks: total,
        completionRate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
        avgDuration,
        overdueRate: total > 0 ? Number(((overdue / total) * 100).toFixed(1)) : 0
      };
    }).filter(r => r.totalTasks > 0);
  }, [nurses, careTasks, filteredCustomerIds]);

  const summaryStats = useMemo(() => {
    const totalRooms = filteredRooms.length;
    const occupiedRooms = filteredRooms.filter(r => r.status === '已入住').length;
    const filteredTasks = careTasks.filter(t => filteredCustomerIds.has(t.customerId));
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === '已完成').length;
    const avgSatisfaction = satisfactionRadarData.reduce((s, r) => s + r.score, 0) / satisfactionRadarData.length;

    return {
      totalRooms,
      occupiedRooms,
      occupancyRate: totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0.0',
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0',
      avgSatisfaction: avgSatisfaction.toFixed(1),
      avgTaskDuration: Math.round(
        filteredTasks.filter(t => t.status === '已完成').reduce((s, t) => s + (t.actualDuration ?? t.duration), 0) /
        Math.max(1, completedTasks)
      )
    };
  }, [filteredRooms, careTasks, filteredCustomerIds, satisfactionRadarData]);

  const handleExportPDF = async () => {
    if (!reportContentRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const element = reportContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f9fafb'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.setFontSize(11);
      pdf.setTextColor(107, 114, 128);
      const filterText = `房型：${selectedRoomType}    日期：${dateRange.start} 至 ${dateRange.end}`;
      pdf.text(filterText, 10, 10);

      const imgWidth = pdfWidth - 20;
      const headerOffset = 12;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10 + headerOffset;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20 - headerOffset);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      const fileName = `统计报表_${dateRange.start}_至_${dateRange.end}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF导出失败:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderRateBadge = (rate: number, type: 'completion' | 'overdue') => {
    const isGood = type === 'completion' ? rate >= 85 : rate <= 5;
    const isMid = type === 'completion' ? rate >= 70 : rate <= 15;
    const colorClass = isGood
      ? 'bg-emerald-100 text-emerald-700'
      : isMid
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}>
        {rate}%
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">统计报表中心</h1>
            <p className="mt-1 text-sm text-gray-500">多维度数据分析，辅助智慧运营决策</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>报告生成时间：{new Date().toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">日期范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                  <span className="text-gray-400">至</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">房型筛选</label>
                <select
                  value={selectedRoomType}
                  onChange={e => setSelectedRoomType(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 min-w-[140px]"
                >
                  <option value="全部">全部房型</option>
                  {roomTypeList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-rose-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-200 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Download className="h-4 w-4" />
              {isExporting ? '导出中...' : '导出PDF报告'}
            </button>
          </div>
        </div>

        <div ref={reportContentRef} id="report-content" className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-rose-400">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">入住率分析</h3>
                  <p className="text-xs text-gray-500">
                    {selectedRoomType === '全部' ? '各房型入住人数堆叠对比' : `${selectedRoomType}入住人数趋势`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeMode('week')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    timeMode === 'week'
                      ? 'bg-gradient-to-r from-primary-500 to-rose-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  按周
                </button>
                <button
                  onClick={() => setTimeMode('month')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    timeMode === 'month'
                      ? 'bg-gradient-to-r from-primary-500 to-rose-400 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  按月
                </button>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
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
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} iconSize={8} />
                  {chartRoomTypes.map((type, idx) => (
                    <Bar
                      key={type}
                      dataKey={type}
                      stackId={selectedRoomType === '全部' ? 'a' : undefined}
                      fill={pinkPalette[idx % pinkPalette.length]}
                      radius={selectedRoomType === '全部'
                        ? (idx === chartRoomTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0])
                        : [4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-400">
                  <PieChartIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">房型分布</h3>
                  <p className="text-xs text-gray-500">
                    {selectedRoomType === '全部' ? '各房型数量占比' : `${selectedRoomType}占比`}
                  </p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomTypeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent}%`}
                      labelLine={{ strokeWidth: 1 }}
                    >
                      {roomTypeDistribution.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={pinkPalette[idx % pinkPalette.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                      }}
                      formatter={(value: number, _name, props) => [`${value}间 (${props.payload.percent}%)`, props.payload.name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-400">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">入住率环形图</h3>
                  <p className="text-xs text-gray-500">
                    {selectedRoomType === '全部' ? '各房型入住率对比' : `${selectedRoomType}入住率`}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {occupancyRateByType.map((item, idx) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full"
                          style={{ backgroundColor: pinkPalette[idx % pinkPalette.length] }}
                        />
                        <span className="font-medium text-gray-700">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{item.value}%</span>
                    </div>
                    <div className="relative h-6 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${item.value}%`,
                          background: `linear-gradient(90deg, ${pinkPalette[idx % pinkPalette.length]}, ${pinkPalette[(idx + 1) % pinkPalette.length]})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-400">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">满意度分析 - 雷达图</h3>
                  <p className="text-xs text-gray-500">
                    {selectedRoomType === '全部' ? '6维度综合评分 (满分100)' : `${selectedRoomType}客户满意度评分`}
                  </p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={satisfactionRadarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                    <Radar
                      name="满意度评分"
                      dataKey="score"
                      stroke="#E91E63"
                      fill="#EC407A"
                      fillOpacity={0.35}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                      }}
                      formatter={(value: number) => [`${value}分`, '得分']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-400">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">满意度趋势</h3>
                  <p className="text-xs text-gray-500">
                    {selectedRoomType === '全部' ? '近6个月满意度变化' : `${selectedRoomType}近6个月满意度变化`}
                  </p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={satisfactionTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} domain={[75, 100]} />
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
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} iconSize={8} />
                    <Line type="monotone" dataKey="平均分" stroke="#E91E63" strokeWidth={3} dot={{ fill: '#E91E63', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="服务" stroke="#EC407A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="护理" stroke="#00ACC1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="餐饮" stroke="#FF9800" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-400">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">任务效率统计</h3>
                <p className="text-xs text-gray-500">
                  {selectedRoomType === '全部' ? '护理师个人任务绩效分析' : `${selectedRoomType}护理师个人任务绩效分析`}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">护理师姓名</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">职称</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">任务数</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">完成率</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">平均耗时</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">超时率</th>
                  </tr>
                </thead>
                <tbody>
                  {taskEfficiencyData.map((row, idx) => (
                    <tr
                      key={row.nurseName}
                      className={`border-b border-gray-50 transition-colors hover:bg-pink-50/50 ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: pinkPalette[idx % pinkPalette.length] }}
                          >
                            {row.nurseName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-800">{row.nurseName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.nurseLevel}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold text-gray-800">{row.totalTasks}</span>
                        <span className="text-xs text-gray-400 ml-1">项</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderRateBadge(row.completionRate, 'completion')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-gray-700">{row.avgDuration}</span>
                        <span className="text-xs text-gray-400 ml-1">分钟</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {renderRateBadge(row.overdueRate, 'overdue')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary-50 via-rose-50 to-pink-50 p-6 shadow-lg border border-primary-100">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-rose-500">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">月度报告摘要</h3>
                <p className="text-xs text-gray-500">
                  {dateRange.start} 至 {dateRange.end} 运营数据概览
                  {selectedRoomType !== '全部' && ` · ${selectedRoomType}`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white p-4 shadow-sm border border-pink-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">总房间数</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                    <Users className="h-4 w-4 text-primary-600" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-800">{summaryStats.totalRooms}<span className="text-sm font-normal text-gray-400 ml-1">间</span></p>
                <p className="mt-1 text-xs text-primary-600">已入住 {summaryStats.occupiedRooms} 间</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm border border-emerald-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">综合入住率</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-800">{summaryStats.occupancyRate}<span className="text-sm font-normal text-gray-400 ml-1">%</span></p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full" style={{ width: `${summaryStats.occupancyRate}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm border border-amber-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">任务完成率</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <CheckCircle className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-800">{summaryStats.taskCompletionRate}<span className="text-sm font-normal text-gray-400 ml-1">%</span></p>
                <p className="mt-1 text-xs text-amber-600">{summaryStats.completedTasks}/{summaryStats.totalTasks} 已完成</p>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm border border-cyan-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">综合满意度</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100">
                    <AlertTriangle className="h-4 w-4 text-cyan-600" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-800">{summaryStats.avgSatisfaction}<span className="text-sm font-normal text-gray-400 ml-1">分</span></p>
                <p className="mt-1 text-xs text-cyan-600">平均耗时 {summaryStats.avgTaskDuration} 分钟</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
