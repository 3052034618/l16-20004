import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import dashboardRoutes from './routes/dashboard.js'
import customersRoutes from './routes/customers.js'
import carePlansRoutes from './routes/carePlans.js'
import tasksRoutes from './routes/tasks.js'
import schedulesRoutes from './routes/schedules.js'
import mealsRoutes from './routes/meals.js'
import inventoryRoutes from './routes/inventory.js'
import equipmentRoutes from './routes/equipment.js'
import reportsRoutes from './routes/reports.js'
import roomsRoutes from './routes/rooms.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/customers', customersRoutes)
app.use('/api/care-plans', carePlansRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/schedules', schedulesRoutes)
app.use('/api/meals', mealsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/rooms', roomsRoutes)

app.get(
  '/api/routes',
  (req: Request, res: Response, _next: NextFunction): void => {
    const routes = [
      { path: '/api/auth', methods: ['POST'], description: '用户认证（登录/注册/登出）' },
      { path: '/api/dashboard/kpis', methods: ['GET'], description: '仪表盘核心KPI数据' },
      { path: '/api/dashboard/floor-heatmap', methods: ['GET'], description: '楼层热力图和房间状态' },
      { path: '/api/dashboard/alerts', methods: ['GET'], description: '预警通知列表' },
      { path: '/api/dashboard/alerts/:id/read', methods: ['POST'], description: '标记预警已读' },
      { path: '/api/dashboard/alerts/:id/handle', methods: ['POST'], description: '处理预警' },
      { path: '/api/dashboard/quick-stats', methods: ['GET'], description: '快速统计概览' },
      { path: '/api/customers', methods: ['GET', 'POST'], description: '客户列表查询/新增客户' },
      { path: '/api/customers/:id', methods: ['GET', 'PUT', 'DELETE'], description: '客户详情/更新/删除' },
      { path: '/api/customers/:id/health-metrics', methods: ['POST'], description: '更新健康指标' },
      { path: '/api/customers/:id/checkin', methods: ['POST'], description: '办理入住' },
      { path: '/api/customers/:id/checkout', methods: ['POST'], description: '办理退房' },
      { path: '/api/care-plans', methods: ['GET', 'POST'], description: '护理方案列表/创建' },
      { path: '/api/care-plans/templates', methods: ['GET'], description: '护理方案模板列表' },
      { path: '/api/care-plans/recommend/:customerId', methods: ['POST'], description: '智能推荐护理方案' },
      { path: '/api/care-plans/match-templates/:customerId', methods: ['GET'], description: '匹配适合的方案模板' },
      { path: '/api/care-plans/available-nurses/:customerId', methods: ['GET'], description: '查询可用护理师' },
      { path: '/api/care-plans/:id', methods: ['GET', 'PUT', 'DELETE'], description: '方案详情/更新/删除' },
      { path: '/api/care-plans/:id/approve', methods: ['POST'], description: '审批通过方案' },
      { path: '/api/care-plans/:id/reject', methods: ['POST'], description: '驳回方案' },
      { path: '/api/care-plans/:id/request-adjust', methods: ['POST'], description: '申请调整方案' },
      { path: '/api/care-plans/:id/generate-tasks', methods: ['POST'], description: '生成每日任务' },
      { path: '/api/care-plans/reassign-overdue', methods: ['POST'], description: '重新分配超时任务' },
      { path: '/api/tasks', methods: ['GET', 'POST'], description: '任务列表查询/创建任务' },
      { path: '/api/tasks/kanban', methods: ['GET'], description: '看板视图任务数据' },
      { path: '/api/tasks/stats/summary', methods: ['GET'], description: '任务统计汇总' },
      { path: '/api/tasks/:id', methods: ['GET', 'PUT', 'DELETE'], description: '任务详情/更新/删除' },
      { path: '/api/tasks/:id/start', methods: ['POST'], description: '开始任务' },
      { path: '/api/tasks/:id/complete', methods: ['POST'], description: '完成任务' },
      { path: '/api/tasks/:id/reassign', methods: ['POST'], description: '转派任务' },
      { path: '/api/schedules', methods: ['GET', 'POST'], description: '排班列表/新增排班' },
      { path: '/api/schedules/calendar', methods: ['GET'], description: '周排班日历' },
      { path: '/api/schedules/nurse-workload', methods: ['GET'], description: '护理师工时统计' },
      { path: '/api/schedules/batch', methods: ['POST'], description: '批量创建排班' },
      { path: '/api/schedules/auto-schedule', methods: ['POST'], description: '自动排班' },
      { path: '/api/schedules/:id', methods: ['GET', 'PUT', 'DELETE'], description: '排班详情/更新/删除' },
      { path: '/api/meals/recipes', methods: ['GET', 'POST'], description: '食谱列表/新增食谱' },
      { path: '/api/meals/recipes/:id', methods: ['PUT', 'DELETE'], description: '更新/删除食谱' },
      { path: '/api/meals/plans', methods: ['GET', 'POST'], description: '配餐计划列表/创建计划' },
      { path: '/api/meals/plans/calendar', methods: ['GET'], description: '配餐日历视图' },
      { path: '/api/meals/plans/:id', methods: ['GET', 'PUT'], description: '配餐计划详情/更新' },
      { path: '/api/meals/plans/:id/serve/:mealType', methods: ['POST'], description: '标记餐食已派送' },
      { path: '/api/meals/dietary-restrictions', methods: ['GET'], description: '饮食忌口配置' },
      { path: '/api/meals/auto-generate/:customerId', methods: ['POST'], description: '自动生成配餐计划' },
      { path: '/api/inventory', methods: ['GET', 'POST'], description: '库存列表/新增物品' },
      { path: '/api/inventory/categories', methods: ['GET'], description: '库存分类统计' },
      { path: '/api/inventory/alerts/summary', methods: ['GET'], description: '库存预警汇总' },
      { path: '/api/inventory/:id', methods: ['GET', 'PUT', 'DELETE'], description: '物品详情/更新/删除' },
      { path: '/api/inventory/:id/restock', methods: ['POST'], description: '补货入库' },
      { path: '/api/inventory/:id/consume', methods: ['POST'], description: '消耗出库' },
      { path: '/api/equipment', methods: ['GET', 'POST'], description: '设备列表/新增设备' },
      { path: '/api/equipment/stats/summary', methods: ['GET'], description: '设备统计汇总' },
      { path: '/api/equipment/:id', methods: ['GET', 'PUT', 'DELETE'], description: '设备详情/更新/删除' },
      { path: '/api/equipment/:id/maintenance', methods: ['POST'], description: '创建设备维保工单' },
      { path: '/api/equipment/work-orders', methods: ['GET'], description: '维保工单列表' },
      { path: '/api/equipment/work-orders/:id', methods: ['GET', 'PUT'], description: '工单详情/更新' },
      { path: '/api/equipment/work-orders/:id/assign', methods: ['POST'], description: '指派工程师' },
      { path: '/api/equipment/work-orders/:id/complete', methods: ['POST'], description: '完成工单' },
      { path: '/api/equipment/work-orders/:id/cancel', methods: ['POST'], description: '取消工单' },
      { path: '/api/reports/occupancy', methods: ['GET'], description: '入住率统计报表' },
      { path: '/api/reports/revenue', methods: ['GET'], description: '营收统计报表' },
      { path: '/api/reports/satisfaction', methods: ['GET'], description: '满意度分析报表' },
      { path: '/api/reports/customers/trend', methods: ['GET'], description: '客户流转趋势' },
      { path: '/api/reports/tasks/efficiency', methods: ['GET'], description: '任务效率报表' },
      { path: '/api/reports/summary', methods: ['GET'], description: '综合汇总报表' },
      { path: '/api/reports/export/monthly', methods: ['GET'], description: '导出月度报告' },
      { path: '/api/rooms', methods: ['GET', 'POST'], description: '房间列表/新增房间' },
      { path: '/api/rooms/floor-map', methods: ['GET'], description: '楼层可视化地图' },
      { path: '/api/rooms/stats/availability', methods: ['GET'], description: '房间可用性统计' },
      { path: '/api/rooms/:id', methods: ['GET', 'PUT', 'DELETE'], description: '房间详情/更新/删除' },
      { path: '/api/rooms/:id/status', methods: ['POST'], description: '变更房间状态' },
      { path: '/api/health', methods: ['GET'], description: '服务健康检查' },
    ]

    res.json({
      success: true,
      data: {
        totalRoutes: routes.length,
        modules: [
          { name: '认证', prefix: '/api/auth', routesCount: 1 },
          { name: '仪表盘', prefix: '/api/dashboard', routesCount: 6 },
          { name: '客户管理', prefix: '/api/customers', routesCount: 6 },
          { name: '护理方案', prefix: '/api/care-plans', routesCount: 12 },
          { name: '任务中心', prefix: '/api/tasks', routesCount: 7 },
          { name: '排班管理', prefix: '/api/schedules', routesCount: 7 },
          { name: '营养餐管理', prefix: '/api/meals', routesCount: 8 },
          { name: '库存管理', prefix: '/api/inventory', routesCount: 6 },
          { name: '设备管理', prefix: '/api/equipment', routesCount: 10 },
          { name: '统计报表', prefix: '/api/reports', routesCount: 7 },
          { name: '房间管理', prefix: '/api/rooms', routesCount: 6 },
        ],
        routes,
      },
    })
  }
)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    })
  }
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]', error.message, error.stack)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    message: error.message,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
    path: req.path,
    method: req.method,
  })
})

export default app
