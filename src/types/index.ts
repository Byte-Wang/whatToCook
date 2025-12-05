// 菜谱数据接口
export interface Recipe {
  id: string
  name: string
  category: 'meat_dish' | 'aquatic' | 'vegetarian' | 'soup' | 'drink' | 'dessert'
  difficulty: 'easy' | 'medium' | 'hard'
  cookingTime: number // 分钟
  servings: number // 默认份数
  ingredients: Ingredient[]
  steps: string[]
  images: string[] // 成品图路径
  description?: string
}

// 食材接口
export interface Ingredient {
  name: string
  amount: string
  unit: 'g' | 'kg' | 'ml' | 'l' | '个' | '只' | '片' | '根' | '适量'
  category: 'meat' | 'vegetable' | 'seasoning' | 'other'
}

// 购物清单项接口
export interface ShoppingItem {
  name: string
  totalAmount: string
  category: string
  recipes: string[] // 关联的菜品
}

// 应用状态接口
export interface AppState {
  peopleCount: number // 用餐人数
  recommendedMenu: Recipe[] // 推荐菜单
  shoppingList: ShoppingItem[] // 购物清单
  purchasedItems: Record<string, boolean> // 已购买物品
}

// 本地存储数据接口
export interface LocalStorageData {
  peopleCount: number // 默认人数
  purchasedItems: Record<string, boolean> // 购买状态
  favoriteRecipes: string[] // 收藏的菜谱
  lastVisit: string // 最后访问时间
}

// 用于存储的原始数据接口
export interface RawLocalStorageData {
  peopleCount: number
  purchasedItems: Record<string, boolean>
  favoriteRecipes: string[]
  lastVisit: string
}