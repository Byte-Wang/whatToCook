import type { Recipe, ShoppingItem } from '@/types'

export interface Preference {
  type: 'include' | 'exclude'
  category?: Recipe['category']
  difficulty?: Recipe['difficulty']
  maxCookingTime?: number
}

export class MenuRecommender {
  private recipes: Recipe[] = []

  constructor(recipes: Recipe[]) {
    this.recipes = recipes
  }

  // 根据人数和偏好推荐菜品组合
  recommendMenu(peopleCount: number, preferences: Preference[] = []): Recipe[] {
    const availableRecipes = this.filterByPreferences(preferences)
    // 打乱候选菜谱以增强随机性
    for (let i = availableRecipes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[availableRecipes[i], availableRecipes[j]] = [availableRecipes[j], availableRecipes[i]]
    }
    
    if (availableRecipes.length === 0) {
      return []
    }

    // 确保营养均衡：荤素搭配、有汤有菜
    const menu = this.buildBalancedMenu(availableRecipes, peopleCount)
    
    // 根据人数调整份量
    return menu.map(recipe => ({
      ...recipe,
      servings: Math.max(1, Math.ceil(peopleCount * 0.8)) // 80%的系数，避免浪费
    }))
  }

  // 计算食材总量
  calculateIngredients(recipes: Recipe[], peopleCount: number): ShoppingItem[] {
    const ingredientMap = new Map<string, { totalAmount: number; unit: string; category: string; recipes: string[] }>()

    recipes.forEach(recipe => {
      const multiplier = peopleCount / recipe.servings
      
      recipe.ingredients.forEach(ingredient => {
        const key = `${ingredient.name}_${ingredient.unit}`
        const current = ingredientMap.get(key) || {
          totalAmount: 0,
          unit: ingredient.unit,
          category: ingredient.category,
          recipes: []
        }

        // 简单的数量计算（实际应该更复杂）
        let amount = parseFloat(ingredient.amount) || 0
        if (ingredient.unit === '适量') {
          amount = 1 // 适量按1计算
        }

        current.totalAmount += amount * multiplier
        if (!current.recipes.includes(recipe.name)) {
          current.recipes.push(recipe.name)
        }

        ingredientMap.set(key, current)
      })
    })

    // 转换为购物清单格式
    return Array.from(ingredientMap.entries()).map(([key, data]) => {
      const [name] = key.split('_')
      let totalAmount = data.totalAmount

      // 单位换算优化
      if (data.unit === 'g' && totalAmount >= 1000) {
        totalAmount = totalAmount / 1000
      } else if (data.unit === 'ml' && totalAmount >= 1000) {
        totalAmount = totalAmount / 1000
      }

      return {
        name,
        totalAmount: totalAmount % 1 === 0 ? totalAmount.toString() : totalAmount.toFixed(1),
        category: data.category,
        recipes: data.recipes
      }
    }).sort((a, b) => {
      // 按分类排序：肉类 > 蔬菜 > 调料 > 其他
      const categoryOrder = { meat: 0, vegetable: 1, seasoning: 2, other: 3 }
      return categoryOrder[a.category as keyof typeof categoryOrder] - categoryOrder[b.category as keyof typeof categoryOrder]
    })
  }

  // 根据偏好过滤菜谱
  private filterByPreferences(preferences: Preference[]): Recipe[] {
    let filtered = [...this.recipes]

    preferences.forEach(preference => {
      if (preference.category) {
        filtered = filtered.filter(recipe => 
          preference.type === 'include' 
            ? recipe.category === preference.category
            : recipe.category !== preference.category
        )
      }

      if (preference.difficulty) {
        filtered = filtered.filter(recipe => 
          preference.type === 'include'
            ? recipe.difficulty === preference.difficulty
            : recipe.difficulty !== preference.difficulty
        )
      }

      if (preference.maxCookingTime) {
        filtered = filtered.filter(recipe => 
          recipe.cookingTime <= preference.maxCookingTime!
        )
      }
    })

    return filtered
  }

  // 构建营养均衡的菜单
  private buildBalancedMenu(availableRecipes: Recipe[], peopleCount: number): Recipe[] {
    const menu: Recipe[] = []
    const usedCategories = new Set<Recipe['category']>()

    // 优先选择不同类别的菜品（打乱类别顺序以增强随机性）
    const categories: Recipe['category'][] = ['meat_dish', 'vegetarian', 'soup', 'aquatic']
    for (let i = categories.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[categories[i], categories[j]] = [categories[j], categories[i]]
    }
    
    categories.forEach(category => {
      const categoryRecipes = availableRecipes.filter(recipe => recipe.category === category)
      if (categoryRecipes.length > 0) {
        // 选择难度适中、时间合理的菜品
        const suitableRecipes = categoryRecipes.filter(recipe => 
          recipe.difficulty !== 'hard' && recipe.cookingTime <= 60
        )
        
        const selected = suitableRecipes.length > 0 
          ? suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)]
          : categoryRecipes[Math.floor(Math.random() * categoryRecipes.length)]
        
        menu.push(selected)
        usedCategories.add(category)
      }
    })

    // 根据人数调整菜品数量（提升大人数的菜品数量上限）
    const targetDishCount = this.getTargetDishCount(peopleCount)
    
    // 如果菜品不够，补充其他菜品
    while (menu.length < targetDishCount && availableRecipes.length > menu.length) {
      const remainingRecipes = availableRecipes.filter(recipe => !menu.includes(recipe))
      if (remainingRecipes.length > 0) {
        const randomRecipe = remainingRecipes[Math.floor(Math.random() * remainingRecipes.length)]
        menu.push(randomRecipe)
      } else {
        break
      }
    }

    // 确保有汤品（如果人数较多）
    if (peopleCount >= 4 && !menu.some(recipe => recipe.category === 'soup')) {
      const soupRecipes = availableRecipes.filter(recipe => recipe.category === 'soup')
      if (soupRecipes.length > 0) {
        const soup = soupRecipes[Math.floor(Math.random() * soupRecipes.length)]
        menu.push(soup)
      }
    }

    // 限制菜单大小
    return menu.slice(0, targetDishCount)
  }

  private getTargetDishCount(peopleCount: number): number {
    if (peopleCount <= 2) return 2
    if (peopleCount <= 4) return 3
    if (peopleCount <= 6) return 4
    if (peopleCount <= 8) return 5
    return 6
  }

  // 获取推荐建议
  getRecommendations(peopleCount: number): string[] {
    const recommendations: string[] = []

    if (peopleCount <= 2) {
      recommendations.push('建议2-3道菜，避免浪费')
    } else if (peopleCount <= 4) {
      recommendations.push('建议3-4道菜，注意荤素搭配')
    } else {
      recommendations.push('建议4道菜以上，记得准备汤品')
    }

    if (peopleCount >= 6) {
      recommendations.push('用餐人数较多，建议提前准备')
    }

    return recommendations
  }
}
