import { useState } from 'react';
import {
  CalendarDays,
  BookOpen,
  Package,
  ChefHat,
  Sun,
  Coffee,
  UtensilsCrossed,
  Cookie,
  Moon,
  Ban,
  Search,
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Flame,
  Droplets,
  Apple,
  Wheat,
  AlertCircle,
} from 'lucide-react';
import type { MealPlan, MealRecipe, InventoryItem, Customer } from '@/types';
import {
  mealPlans as mockMealPlans,
  mealRecipes as mockMealRecipes,
  inventoryItems as mockInventoryItems,
  customers as mockCustomers,
} from '@/data/mockData';
import { cn } from '@/lib/utils';

type MealsTab = 'calendar' | 'recipes' | 'inventory';

const mealTypeIcons = {
  '早餐': Sun,
  '上午加餐': Coffee,
  '午餐': UtensilsCrossed,
  '下午加餐': Cookie,
  '晚餐': ChefHat,
  '夜宵': Moon,
};

const mealTypeColors: Record<string, string> = {
  '早餐': 'from-amber-50 to-orange-50 border-amber-200',
  '上午加餐': 'from-yellow-50 to-amber-50 border-yellow-200',
  '午餐': 'from-rose-50 to-pink-50 border-rose-200',
  '下午加餐': 'from-violet-50 to-purple-50 border-violet-200',
  '晚餐': 'from-sky-50 to-blue-50 border-sky-200',
  '夜宵': 'from-indigo-50 to-slate-50 border-indigo-200',
};

const recipePhaseColors: Record<string, string> = {
  '产后1-7天': 'bg-rose-100 text-rose-700',
  '产后8-14天': 'bg-amber-100 text-amber-700',
  '产后15-30天': 'bg-emerald-100 text-emerald-700',
};

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const mealTypesList = ['早餐', '上午加餐', '午餐', '下午加餐', '晚餐', '夜宵'] as const;

function getWeekDates(startDate: Date) {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return {
      date: d,
      dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
      fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    };
  });
}

function CustomerAvatar({ name }: { name: string }) {
  const colors = [
    'bg-pink-500', 'bg-rose-500', 'bg-fuchsia-500', 'bg-purple-500',
    'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  ];
  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={cn(
      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
      colors[colorIndex]
    )}>
      {name.slice(0, 1)}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200',
        active
          ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/25'
          : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50/50'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function MealCalendar() {
  const [selectedCustomerId, setSelectedCustomerId] = useState(mockCustomers[0].id);
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const dayOfWeek = today.getDay() || 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + 1 + weekOffset * 7);
  const weekDates = getWeekDates(monday);

  const selectedCustomer = mockCustomers.find((c) => c.id === selectedCustomerId);
  const selectedMealPlan = mockMealPlans.find((mp) => mp.customerId === selectedCustomerId);

  const getMealForSlot = (dateStr: string, mealType: string) => {
    if (!selectedMealPlan) return null;
    const dailyMeal = selectedMealPlan.dailyMeals.find((dm) => dm.date === dateStr);
    if (!dailyMeal) return null;
    return dailyMeal.meals.find((m) => m.mealType === mealType);
  };

  const getRecipeByName = (name: string) => {
    return mockMealRecipes.find((r) => r.name === name);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <aside className="w-72 bg-white border-r border-slate-200 shrink-0 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Search className="w-4 h-4 text-pink-500" />
            客户列表
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索客户姓名/房间号"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
            />
          </div>
          <div className="space-y-1.5">
            {mockCustomers.map((customer) => {
              const plan = mockMealPlans.find((mp) => mp.customerId === customer.id);
              const isSelected = selectedCustomerId === customer.id;
              return (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200',
                    isSelected
                      ? 'bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 shadow-sm'
                      : 'hover:bg-slate-50 border border-transparent'
                  )}
                >
                  <CustomerAvatar name={customer.motherName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {customer.motherName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{customer.roomNumber}</span>
                      {plan && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {plan.phase}
                        </span>
                      )}
                    </div>
                    {customer.dietaryRestrictions.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Ban className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="text-[10px] text-rose-600 truncate">
                          {customer.dietaryRestrictions.join('、')}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-200">
              <span className="text-sm font-semibold text-slate-800">
                {weekDates[0].fullDate} ~ {weekDates[6].fullDate}
              </span>
            </div>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-2 rounded-lg bg-pink-50 text-pink-600 text-sm font-medium hover:bg-pink-100 transition-colors"
            >
              本周
            </button>
          </div>
          {selectedCustomer && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200">
              <CustomerAvatar name={selectedCustomer.motherName} />
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {selectedCustomer.motherName}
                </div>
                <div className="text-xs text-slate-500">
                  {selectedCustomer.roomNumber} · {selectedMealPlan?.phase}
                </div>
              </div>
              {selectedCustomer.dietaryRestrictions.length > 0 && (
                <div className="flex items-center gap-1 ml-2 px-2 py-1 rounded-lg bg-rose-50 border border-rose-100">
                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                  <span className="text-xs text-rose-600 font-medium">
                    {selectedCustomer.dietaryRestrictions.join('、')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr>
                  <th className="w-24 sticky left-0 z-10 bg-slate-50 border-b border-r border-slate-200 p-3 text-xs font-semibold text-slate-600">
                    餐次/日期
                  </th>
                  {weekDates.map((wd, idx) => {
                    const isToday = wd.fullDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    return (
                      <th
                        key={idx}
                        className={cn(
                          'border-b border-slate-200 p-3 text-center',
                          isToday && 'bg-pink-50'
                        )}
                      >
                        <div className={cn(
                          'text-xs font-medium mb-1',
                          isToday ? 'text-pink-600' : 'text-slate-500'
                        )}>
                          {weekDays[idx]}
                        </div>
                        <div className={cn(
                          'text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full',
                          isToday ? 'bg-pink-500 text-white' : 'text-slate-800'
                        )}>
                          {wd.date.getDate()}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {mealTypesList.map((mealType, mtIdx) => {
                  const Icon = mealTypeIcons[mealType];
                  return (
                    <tr key={mealType} className="border-b border-slate-100 last:border-b-0">
                      <td className={cn(
                        'sticky left-0 z-10 border-r border-slate-200 p-3',
                        mtIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      )}>
                        <div className={cn(
                          'flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r',
                          mealTypeColors[mealType]
                        )}>
                          <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-slate-700" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{mealType}</span>
                        </div>
                      </td>
                      {weekDates.map((wd, dIdx) => {
                        const meal = getMealForSlot(wd.fullDate, mealType);
                        const recipe = meal ? getRecipeByName(meal.recipeName) : null;
                        const hasConflict = recipe && selectedCustomer?.dietaryRestrictions.some(
                          (r) => recipe.ingredients.some((ing) => ing.itemName.includes(r)) ||
                            recipe.contraindications.some((c) => c.includes(r))
                        );
                        return (
                          <td
                            key={dIdx}
                            className={cn(
                              'border-r border-slate-100 last:border-r-0 p-2 align-top',
                              mtIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30',
                              wd.fullDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` && 'bg-pink-50/30'
                            )}
                          >
                            {meal ? (
                              <div className={cn(
                                'group rounded-xl p-2.5 border transition-all duration-200 cursor-pointer hover:shadow-md',
                                hasConflict
                                  ? 'bg-rose-50 border-rose-200'
                                  : `bg-gradient-to-br ${mealTypeColors[mealType]} hover:-translate-y-0.5`
                              )}>
                                <div className="flex items-start justify-between gap-1">
                                  <div className="flex-1 min-w-0">
                                    <div className={cn(
                                      'text-xs font-semibold leading-tight',
                                      hasConflict ? 'text-rose-800' : 'text-slate-800'
                                    )}>
                                      {meal.recipeName}
                                    </div>
                                    {recipe && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {recipe.ingredients.slice(0, 3).map((ing, iIdx) => (
                                          <span
                                            key={iIdx}
                                            className={cn(
                                              'text-[9px] px-1.5 py-0.5 rounded',
                                              hasConflict ? 'bg-rose-100 text-rose-600' : 'bg-white/80 text-slate-600'
                                            )}
                                          >
                                            {ing.itemName}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {hasConflict && (
                                    <div className="shrink-0" title="存在忌口冲突">
                                      <Ban className="w-4 h-4 text-rose-500" />
                                    </div>
                                  )}
                                  {meal.isFavourite && (
                                    <div className="shrink-0 text-amber-500 text-xs">★</div>
                                  )}
                                </div>
                                {meal.remark && (
                                  <div className="mt-1.5 text-[10px] text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    {meal.remark}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button className="w-full h-16 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50/50 transition-colors flex items-center justify-center gap-1 text-xs">
                                <Plus className="w-3.5 h-3.5" />
                                配餐
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function RecipeLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<string>('全部');

  const filteredRecipes = mockMealRecipes.filter((r) => {
    if (searchQuery && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (phaseFilter !== '全部' && r.phase !== phaseFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索食谱名称"
              className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
            />
          </div>
          <div className="flex items-center gap-1">
            {(['全部', '产后1-7天', '产后8-14天', '产后15-30天'] as const).map((phase) => (
              <button
                key={phase}
                onClick={() => setPhaseFilter(phase)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  phaseFilter === phase
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
                )}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all">
            <Plus className="w-4 h-4" />
            新增食谱
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          >
            <div className="h-36 bg-gradient-to-br from-pink-100 via-rose-50 to-amber-50 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <UtensilsCrossed className="w-16 h-16 text-pink-300/60" />
              </div>
              <div className="absolute top-3 left-3 flex gap-1.5">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-semibold',
                  recipePhaseColors[recipe.phase]
                )}>
                  {recipe.phase}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-semibold text-slate-700">
                  {recipe.mealType}
                </span>
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-semibold text-slate-700">
                    {recipe.nutritionFacts.calories} 卡
                  </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm">
                  <Droplets className="w-3 h-3 text-sky-500" />
                  <span className="text-[10px] font-semibold text-slate-700">
                    蛋白 {recipe.nutritionFacts.protein}g
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-bold text-slate-800 group-hover:text-pink-600 transition-colors">
                {recipe.name}
              </h3>
              <div className="mt-3 space-y-2">
                <div>
                  <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                    <Wheat className="w-3 h-3" />
                    主要食材
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                      >
                        {ing.itemName}
                      </span>
                    ))}
                    {recipe.ingredients.length > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        +{recipe.ingredients.length - 4}
                      </span>
                    )}
                  </div>
                </div>
                {recipe.contraindications.length > 0 && (
                  <div className="flex items-start gap-1 p-2 rounded-lg bg-rose-50 border border-rose-100">
                    <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-[10px] text-rose-600 leading-relaxed">
                      {recipe.contraindications.join('；')}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {recipe.suitableFor.slice(0, 2).map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">查看详情 →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventoryBoard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('全部');

  const categories = Array.from(new Set(mockInventoryItems.map((i) => i.category)));

  const getRowBgClass = (item: InventoryItem) => {
    const ratio = item.currentStock / item.safeStock;
    if (ratio < 0.5) return 'bg-rose-50 hover:bg-rose-100/80';
    if (ratio < 1) return 'bg-amber-50 hover:bg-amber-100/80';
    return 'hover:bg-slate-50';
  };

  const getStatusBadge = (status: InventoryItem['status']) => {
    const styles: Record<InventoryItem['status'], string> = {
      '正常': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      '预警': 'bg-amber-100 text-amber-700 border-amber-200',
      '紧缺': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return styles[status];
  };

  const filteredItems = mockInventoryItems.filter((item) => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== '全部' && item.category !== categoryFilter) return false;
    return true;
  });

  const stockRatioStats = {
    normal: mockInventoryItems.filter((i) => i.currentStock >= i.safeStock).length,
    warning: mockInventoryItems.filter((i) => i.currentStock < i.safeStock && i.currentStock >= i.safeStock * 0.5).length,
    critical: mockInventoryItems.filter((i) => i.currentStock < i.safeStock * 0.5).length,
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">库存正常</div>
              <div className="text-3xl font-bold mt-1">{stockRatioStats.normal}</div>
              <div className="text-xs opacity-80 mt-1">原材料充足</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">库存预警</div>
              <div className="text-3xl font-bold mt-1">{stockRatioStats.warning}</div>
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
              <div className="text-3xl font-bold mt-1">{stockRatioStats.critical}</div>
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
              placeholder="搜索原材料名称"
              className="w-64 pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400"
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCategoryFilter('全部')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                categoryFilter === '全部'
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
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
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-300'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
            刷新库存
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-pink-500/25 transition-all">
            <Plus className="w-4 h-4" />
            新增原材料
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">名称</th>
                <th className="px-5 py-4 text-left text-xs font-semibold text-slate-600">分类</th>
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
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                          <Apple className="w-4.5 h-4.5 text-pink-500" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">{item.name}</div>
                          <div className="text-[11px] text-slate-500">供应商：{item.supplier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-700">
                        {item.category}
                      </span>
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
                            : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
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

export default function Meals() {
  const [activeTab, setActiveTab] = useState<MealsTab>('calendar');

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-pink-500" />
              营养餐管理
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              智能配餐、食谱库管理与原材料库存监控一站式处理
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <TabButton
            active={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            icon={CalendarDays}
            label="配餐日历"
          />
          <TabButton
            active={activeTab === 'recipes'}
            onClick={() => setActiveTab('recipes')}
            icon={BookOpen}
            label="食谱库"
          />
          <TabButton
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            icon={Package}
            label="库存看板"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {activeTab === 'calendar' && <MealCalendar />}
        {activeTab === 'recipes' && <RecipeLibrary />}
        {activeTab === 'inventory' && <InventoryBoard />}
      </div>
    </div>
  );
}
