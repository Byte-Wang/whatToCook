import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Recipe, ShoppingItem } from '@/types'
import { LocalStorageManager } from '@/utils/storage'

export const useAppStore = defineStore('app', () => {
  // 状态
  const peopleCount = ref(LocalStorageManager.getPeopleCount())
  const recommendedMenu = ref<Recipe[]>([])
  const shoppingList = ref<ShoppingItem[]>([])
  const purchasedItems = ref<Record<string, boolean>>(LocalStorageManager.getPurchasedItems())

  // 计算属性
  const totalCookingTime = computed(() => {
    return recommendedMenu.value.reduce((total, recipe) => total + recipe.cookingTime, 0)
  })

  const totalDishes = computed(() => {
    return recommendedMenu.value.length
  })

  // 方法
  function setPeopleCount(count: number) {
    const validCount = Math.max(1, Math.min(10, count))
    peopleCount.value = validCount
    LocalStorageManager.setPeopleCount(validCount)
  }

  function setRecommendedMenu(menu: Recipe[]) {
    recommendedMenu.value = menu
  }

  function setShoppingList(list: ShoppingItem[]) {
    shoppingList.value = list
  }

  function togglePurchased(itemName: string) {
    purchasedItems.value[itemName] = !purchasedItems.value[itemName]
    // 保存到本地存储
    LocalStorageManager.setPurchasedItems(purchasedItems.value)
  }

  function clearPurchased() {
    purchasedItems.value = {}
    LocalStorageManager.setPurchasedItems({})
  }

  function clearMenu() {
    recommendedMenu.value = []
    shoppingList.value = []
  }

  // 监听状态变化并保存到本地存储
  watch(peopleCount, (newCount) => {
    LocalStorageManager.setPeopleCount(newCount)
  })

  watch(purchasedItems, (newItems) => {
    LocalStorageManager.setPurchasedItems(newItems)
  }, { deep: true })

  return {
    peopleCount,
    recommendedMenu,
    shoppingList,
    purchasedItems,
    totalCookingTime,
    totalDishes,
    setPeopleCount,
    setRecommendedMenu,
    setShoppingList,
    togglePurchased,
    clearPurchased,
    clearMenu
  }
})