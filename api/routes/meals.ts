import { Router, type Request, type Response } from 'express'
import { db, type MealPlan, type MealRecipe, type MealType, type MealStage } from '../data/mockDb.js'

const router = Router()

router.get('/recipes', async (req: Request, res: Response): Promise<void> => {
  const { stage, type, tag, search } = req.query

  let recipes = [...db.mealRecipes]

  if (stage) {
    recipes = recipes.filter(r => r.stage === stage)
  }

  if (type) {
    recipes = recipes.filter(r => r.type === type)
  }

  if (tag) {
    recipes = recipes.filter(r => r.tags.includes(String(tag)))
  }

  if (search) {
    const searchLower = String(search).toLowerCase()
    recipes = recipes.filter(r => r.name.toLowerCase().includes(searchLower))
  }

  const list = recipes.map(r => ({
    ...r,
    ingredients: r.ingredients.map(ing => {
      const item = db.inventory.find(i => i.id === ing.inventoryItemId)
      return {
        ...ing,
        name: item?.name || '未知食材',
        inStock: item ? item.currentStock >= ing.quantity : false,
      }
    }),
  }))

  res.json({
    success: true,
    data: list,
  })
})

router.post('/recipes', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<MealRecipe> & {
    name: string
    stage: MealStage
    type: MealType
  }

  if (!body.name || !body.stage || !body.type) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: name, stage, type',
    })
    return
  }

  const recipe: MealRecipe = {
    id: db.genId('mr'),
    name: body.name,
    stage: body.stage,
    type: body.type,
    calories: body.calories || 350,
    ingredients: body.ingredients || [],
    tags: body.tags || [body.stage, body.type],
  }

  db.mealRecipes.push(recipe)

  res.status(201).json({
    success: true,
    data: recipe,
  })
})

router.put('/recipes/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.mealRecipes.findIndex(r => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Recipe not found' })
    return
  }

  db.mealRecipes[idx] = {
    ...db.mealRecipes[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.mealRecipes[idx],
  })
})

router.delete('/recipes/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.mealRecipes.findIndex(r => r.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Recipe not found' })
    return
  }

  db.mealRecipes.splice(idx, 1)
  res.json({ success: true })
})

router.get('/plans', async (req: Request, res: Response): Promise<void> => {
  const { customerId, startDate, endDate, stage, page = 1, pageSize = 50 } = req.query

  let plans = [...db.mealPlans]

  if (customerId) {
    plans = plans.filter(p => p.customerId === customerId)
  }

  if (startDate) {
    plans = plans.filter(p => p.date >= String(startDate))
  }

  if (endDate) {
    plans = plans.filter(p => p.date <= String(endDate))
  }

  if (stage) {
    plans = plans.filter(p => p.stage === stage)
  }

  plans = plans.sort((a, b) => a.date.localeCompare(b.date))

  const total = plans.length
  const paged = plans.slice(
    (Number(page) - 1) * Number(pageSize),
    Number(page) * Number(pageSize)
  )

  const list = paged.map(p => {
    const customer = db.customers.find(c => c.id === p.customerId)
    const meals = p.meals.map(m => {
      const recipe = db.mealRecipes.find(r => r.id === m.recipeId)
      return {
        ...m,
        recipeName: recipe?.name,
        calories: recipe?.calories,
        tags: recipe?.tags,
      }
    })

    const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0)

    return {
      ...p,
      customerName: customer?.name,
      dietaryRestrictions: customer?.dietaryRestrictions || [],
      meals,
      totalCalories,
    }
  })

  res.json({
    success: true,
    data: {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  })
})

router.get('/plans/calendar', async (req: Request, res: Response): Promise<void> => {
  const { customerId, startDate, days = 7 } = req.query

  const baseDate = startDate ? new Date(String(startDate)) : new Date()
  const dates = Array.from({ length: Number(days) }, (_, i) => {
    const d = new Date(baseDate)
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
  const mealTypeNames: Record<MealType, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack1: '上午加餐',
    snack2: '下午加餐',
    snack3: '夜宵',
  }

  let customers = db.customers.filter(c => c.status === 'inHouse')
  if (customerId) {
    customers = customers.filter(c => c.id === customerId)
  }

  const calendar = customers.map(customer => {
    const checkIn = new Date(customer.checkInDate)
    const customerDays = dates.map(date => {
      const dayNum = Math.floor((new Date(date).getTime() - checkIn.getTime()) / 86400000) + 1
      const stage: MealStage = dayNum <= 7 ? 'stage1' : dayNum <= 14 ? 'stage2' : 'stage3'
      const stageNames: Record<MealStage, string> = {
        stage1: '产后1-7天',
        stage2: '产后8-14天',
        stage3: '产后15-30天',
      }

      let plan = db.mealPlans.find(p => p.customerId === customer.id && p.date === date)

      if (!plan) {
        const meals = mealTypes.map(type => {
          const recipes = db.mealRecipes.filter(
            r => r.stage === stage
              && r.type === type
              && (!customer.dietaryRestrictions.length
                || !r.tags.some(t => customer.dietaryRestrictions.includes(t)))
          )
          const recipe = recipes[Math.floor(Math.random() * recipes.length)]
            || db.mealRecipes.find(r => r.type === type)
          return {
            type,
            recipeId: recipe?.id || db.genId('mr'),
            served: false,
          }
        })

        plan = {
          id: db.genId('mp'),
          customerId: customer.id,
          date,
          meals,
          stage,
        }
        db.mealPlans.push(plan)
      }

      const mealsWithDetails = plan.meals.map(m => {
        const recipe = db.mealRecipes.find(r => r.id === m.recipeId)
        const hasRestriction = customer.dietaryRestrictions.length > 0
          && recipe?.tags.some(t => customer.dietaryRestrictions.includes(t))

        return {
          ...m,
          typeName: mealTypeNames[m.type],
          recipeName: recipe?.name || '待配置',
          calories: recipe?.calories || 0,
          tags: recipe?.tags || [],
          hasRestrictionConflict: !!hasRestriction,
        }
      })

      return {
        date,
        dayNumber: dayNum > 0 ? dayNum : null,
        stage,
        stageName: stageNames[stage],
        planId: plan.id,
        meals: mealsWithDetails,
        totalCalories: mealsWithDetails.reduce((sum, m) => sum + m.calories, 0),
      }
    })

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        checkInDate: customer.checkInDate,
        dietaryRestrictions: customer.dietaryRestrictions,
      },
      days: customerDays,
    }
  })

  res.json({
    success: true,
    data: {
      dates,
      customers: calendar,
      mealTypes: mealTypes.map(t => ({ key: t, name: mealTypeNames[t] })),
    },
  })
})

router.get('/plans/:id', async (req: Request, res: Response): Promise<void> => {
  const plan = db.mealPlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Meal plan not found' })
    return
  }

  const customer = db.customers.find(c => c.id === plan.customerId)
  const meals = plan.meals.map(m => {
    const recipe = db.mealRecipes.find(r => r.id === m.recipeId)
    return {
      ...m,
      recipe,
    }
  })

  res.json({
    success: true,
    data: {
      ...plan,
      customer,
      meals,
    },
  })
})

router.post('/plans', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Partial<MealPlan> & {
    customerId: string
    date: string
    meals: MealPlan['meals']
  }

  if (!body.customerId || !body.date || !body.meals) {
    res.status(400).json({
      success: false,
      error: '缺少必要字段: customerId, date, meals',
    })
    return
  }

  const checkIn = new Date(db.customers.find(c => c.id === body.customerId)?.checkInDate || Date.now())
  const dayNum = Math.floor((new Date(body.date).getTime() - checkIn.getTime()) / 86400000) + 1
  const stage: MealStage = dayNum <= 7 ? 'stage1' : dayNum <= 14 ? 'stage2' : 'stage3'

  const plan: MealPlan = {
    id: db.genId('mp'),
    customerId: body.customerId,
    date: body.date,
    meals: body.meals,
    stage: body.stage || stage,
  }

  db.mealPlans.push(plan)

  res.status(201).json({
    success: true,
    data: plan,
  })
})

router.put('/plans/:id', async (req: Request, res: Response): Promise<void> => {
  const idx = db.mealPlans.findIndex(p => p.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Meal plan not found' })
    return
  }

  db.mealPlans[idx] = {
    ...db.mealPlans[idx],
    ...req.body,
  }

  res.json({
    success: true,
    data: db.mealPlans[idx],
  })
})

router.post('/plans/:id/serve/:mealType', async (req: Request, res: Response): Promise<void> => {
  const plan = db.mealPlans.find(p => p.id === req.params.id)
  if (!plan) {
    res.status(404).json({ success: false, error: 'Meal plan not found' })
    return
  }

  const meal = plan.meals.find(m => m.type === req.params.mealType)
  if (!meal) {
    res.status(404).json({ success: false, error: 'Meal not found in plan' })
    return
  }

  meal.served = true

  const recipe = db.mealRecipes.find(r => r.id === meal.recipeId)
  if (recipe) {
    for (const ing of recipe.ingredients) {
      const item = db.inventory.find(i => i.id === ing.inventoryItemId)
      if (item) {
        item.currentStock = Math.max(0, item.currentStock - ing.quantity)
      }
    }
  }

  res.json({
    success: true,
    data: plan,
  })
})

router.get('/dietary-restrictions', async (_req: Request, res: Response): Promise<void> => {
  const allRestrictions = new Set<string>()
  db.customers.forEach(c => c.dietaryRestrictions.forEach(r => allRestrictions.add(r)))

  res.json({
    success: true,
    data: {
      commonRestrictions: [
        '海鲜', '花生', '坚果', '鸡蛋', '牛奶', '豆制品',
        '辛辣', '生冷', '油腻', '高糖', '低盐', '素食',
      ],
      activeRestrictions: Array.from(allRestrictions),
      affectedCustomers: Array.from(allRestrictions).map(r => ({
        restriction: r,
        count: db.customers.filter(c => c.dietaryRestrictions.includes(r)).length,
      })),
    },
  })
})

router.post('/auto-generate/:customerId', async (req: Request, res: Response): Promise<void> => {
  const customer = db.customers.find(c => c.id === req.params.customerId)
  if (!customer) {
    res.status(404).json({ success: false, error: 'Customer not found' })
    return
  }

  const { startDate, days = 7 } = req.body

  const baseDate = startDate ? new Date(String(startDate)) : new Date()
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack1', 'snack2', 'snack3']
  const checkIn = new Date(customer.checkInDate)
  const created: MealPlan[] = []

  for (let d = 0; d < Number(days); d++) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() + d)
    const dateStr = date.toISOString().split('T')[0]

    const dayNum = Math.floor((date.getTime() - checkIn.getTime()) / 86400000) + 1
    const stage: MealStage = dayNum <= 7 ? 'stage1' : dayNum <= 14 ? 'stage2' : 'stage3'

    const existing = db.mealPlans.find(p => p.customerId === customer.id && p.date === dateStr)
    if (existing) continue

    const meals = mealTypes.map(type => {
      const recipes = db.mealRecipes.filter(
        r => r.stage === stage
          && r.type === type
          && (!customer.dietaryRestrictions.length
            || !r.tags.some(t => customer.dietaryRestrictions.includes(t)))
      )
      const recipe = recipes[Math.floor(Math.random() * recipes.length)]
      return {
        type,
        recipeId: recipe?.id || db.mealRecipes.find(r => r.type === type)?.id || '',
        served: false,
      }
    })

    const plan: MealPlan = {
      id: db.genId('mp'),
      customerId: customer.id,
      date: dateStr,
      meals,
      stage,
    }
    db.mealPlans.push(plan)
    created.push(plan)
  }

  res.json({
    success: true,
    data: {
      generatedForDays: created.length,
      plans: created,
    },
  })
})

export default router
