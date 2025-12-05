import type { LocalStorageData, RawLocalStorageData } from '@/types'

const STORAGE_KEY = 'whattocook_data'

export class LocalStorageManager {
  // 获取存储的数据
  static getData(): LocalStorageData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data) as LocalStorageData
      }
      return null
    } catch (error) {
      console.error('读取本地存储失败:', error)
      return null
    }
  }

  // 保存数据
  static saveData(data: LocalStorageData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('保存本地存储失败:', error)
    }
  }

  // 清除数据
  static clearData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('清除本地存储失败:', error)
    }
  }

  // 更新特定字段
  static updateField<K extends keyof LocalStorageData>(
    field: K,
    value: LocalStorageData[K]
  ): void {
    const currentData = this.getData() || this.getDefaultData()
    const newData = { ...currentData, [field]: value }
    this.saveData(newData)
  }

  // 获取默认数据
  static getDefaultData(): LocalStorageData {
    return {
      peopleCount: 3,
      purchasedItems: {},
      favoriteRecipes: [],
      lastVisit: new Date().toISOString()
    }
  }

  // 获取默认原始数据
  static getDefaultRawData(): RawLocalStorageData {
    return {
      peopleCount: 3,
      purchasedItems: {},
      favoriteRecipes: [],
      lastVisit: new Date().toISOString()
    }
  }

  // 检查是否是首次访问
  static isFirstVisit(): boolean {
    const data = this.getData()
    return !data || !data.lastVisit
  }

  // 更新最后访问时间
  static updateLastVisit(): void {
    this.updateField('lastVisit', new Date().toISOString())
  }

  // 获取收藏的菜谱
  static getFavoriteRecipes(): string[] {
    const data = this.getData()
    return data?.favoriteRecipes || []
  }

  // 添加收藏菜谱
  static addFavoriteRecipe(recipeId: string): void {
    const currentData = this.getData() || this.getDefaultData()
    const favorites = new Set(currentData.favoriteRecipes)
    favorites.add(recipeId)
    this.updateField('favoriteRecipes', Array.from(favorites))
  }

  // 移除收藏菜谱
  static removeFavoriteRecipe(recipeId: string): void {
    const currentData = this.getData() || this.getDefaultData()
    const favorites = currentData.favoriteRecipes.filter(id => id !== recipeId)
    this.updateField('favoriteRecipes', favorites)
  }

  // 检查是否已收藏
  static isFavorite(recipeId: string): boolean {
    const data = this.getData()
    return data?.favoriteRecipes.includes(recipeId) || false
  }

  // 获取购买状态
  static getPurchasedItems(): Record<string, boolean> {
    const data = this.getData()
    return data?.purchasedItems || {}
  }

  // 获取购买状态（兼容Set的接口）
  static getPurchasedItemsAsSet(): Set<string> {
    const items = this.getPurchasedItems()
    return new Set(Object.keys(items).filter(key => items[key]))
  }

  // 设置购买状态
  static setPurchasedItems(items: Record<string, boolean>): void {
    this.updateField('purchasedItems', items)
  }

  // 获取人数设置
  static getPeopleCount(): number {
    const data = this.getData()
    return data?.peopleCount || 3
  }

  // 设置人数
  static setPeopleCount(count: number): void {
    this.updateField('peopleCount', count)
  }
}