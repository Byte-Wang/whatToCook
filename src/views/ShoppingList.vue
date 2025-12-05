<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
    <!-- 头部 -->
    <header class="bg-white shadow-sm px-4 py-4 sticky top-0 z-10">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <button 
          @click="goBack" 
          class="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-1"
        >
          <ArrowLeftIcon class="w-5 h-5" /> 返回
        </button>
        <h1 class="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCartIcon class="w-5 h-5 text-orange-500" /> 购物清单
        </h1>
        <button 
          @click="clearAllPurchased" 
          v-if="purchasedCount > 0"
          class="text-sm text-orange-600 hover:text-orange-700 transition-colors"
        >
          清空已购
        </button>
        <div v-else class="w-16"></div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-4xl mx-auto px-4 py-6">
      <!-- 统计信息 -->
      <section class="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-2xl font-bold text-blue-600">{{ totalItems }}</div>
            <div class="text-sm text-blue-700">总食材</div>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <div class="text-2xl font-bold text-green-600">{{ purchasedCount }}</div>
            <div class="text-sm text-green-700">已购买</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-3">
            <div class="text-2xl font-bold text-orange-600">{{ remainingCount }}</div>
            <div class="text-sm text-orange-700">待购买</div>
          </div>
        </div>
      </section>

      <!-- 购物清单 -->
      <section v-if="shoppingList.length > 0" class="space-y-4">
        <!-- 按分类分组显示 -->
        <div 
          v-for="category in groupedCategories" 
          :key="category.name"
          class="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div 
            @click="toggleCategory(category.name)"
            class="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">{{ category.emoji }}</span>
              <span class="font-semibold text-gray-800">{{ category.label }}</span>
              <span class="text-sm text-gray-600">({{ category.items.length }})</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-green-600">
                {{ category.items.filter(item => isPurchased(item.name)).length }}/{{ category.items.length }}
              </span>
              <ChevronDownIcon class="w-5 h-5 transform transition-transform" :class="{ 'rotate-180': expandedCategories.has(category.name) }" />
            </div>
          </div>
          
          <div v-show="expandedCategories.has(category.name)" class="divide-y divide-gray-100">
            <div 
              v-for="item in category.items" 
              :key="item.name"
              class="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-3 flex-1">
                <van-checkbox 
                  :model-value="isPurchased(item.name)"
                  @change="togglePurchased(item.name)"
                  shape="square"
                  checked-color="#FF6B35"
                />
                <div class="flex-1">
                  <div class="font-medium text-gray-800">{{ item.name }}</div>
                  <div class="text-sm text-gray-600">
                    {{ item.totalAmount }}{{ getUnitDisplay(item.category) }}
                  </div>
                  <div class="text-xs text-gray-500">
                    用于：{{ item.recipes.join('、') }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-orange-600">
                  {{ getCategoryDisplay(item.category) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 空状态 -->
      <section v-else class="bg-white rounded-xl shadow-sm p-12 text-center">
        <div class="text-6xl mb-4">🛒</div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">购物清单为空</h3>
        <p class="text-gray-600 mb-6">请先生成菜单推荐</p>
        <van-button 
          type="primary" 
          @click="goHome"
          class="!bg-orange-500 !border-orange-500 !rounded-lg"
        >
          去生成菜单
        </van-button>
      </section>

      <!-- 操作提示 -->
      <section class="bg-blue-50 rounded-xl p-4 mt-6">
        <h3 class="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          💡 购物小贴士
        </h3>
        <ul class="text-sm text-blue-700 space-y-1">
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            购买时勾选已购买食材，避免重复购买
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            建议按分类购买，效率更高
          </li>
          <li class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            新鲜食材建议最后购买
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import type { ShoppingItem } from '@/types'
import { ArrowLeftIcon, ShoppingCartIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const store = useAppStore()

// 状态
const expandedCategories = ref<Set<string>>(new Set(['meat', 'vegetable', 'seasoning', 'other']))

// 计算属性
const shoppingList = computed(() => store.shoppingList)
const totalItems = computed(() => shoppingList.value.length)
const purchasedCount = computed(() => Object.keys(store.purchasedItems).filter(key => store.purchasedItems[key]).length)
const remainingCount = computed(() => totalItems.value - purchasedCount.value)

const groupedCategories = computed(() => {
  const categoryMap = new Map<string, ShoppingItem[]>()
  
  shoppingList.value.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, [])
    }
    categoryMap.get(item.category)!.push(item)
  })

  const categoryInfo = {
    meat: { label: '肉类', emoji: '🍖' },
    vegetable: { label: '蔬菜', emoji: '🥬' },
    seasoning: { label: '调料', emoji: '🧂' },
    other: { label: '其他', emoji: '🥫' }
  }

  return Object.entries(categoryInfo).map(([name, info]) => ({
    name,
    label: info.label,
    emoji: info.emoji,
    items: categoryMap.get(name) || []
  })).filter(category => category.items.length > 0)
})

// 方法
const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}

const togglePurchased = (itemName: string) => {
  store.togglePurchased(itemName)
}

const isPurchased = (itemName: string) => {
  return !!store.purchasedItems[itemName]
}

const toggleCategory = (categoryName: string) => {
  if (expandedCategories.value.has(categoryName)) {
    expandedCategories.value.delete(categoryName)
  } else {
    expandedCategories.value.add(categoryName)
  }
}

const clearAllPurchased = () => {
  store.clearPurchased()
}

const getUnitDisplay = (_category?: string) => {
  // 根据分类返回合适的单位显示
  return '' // 已经在totalAmount中包含了单位信息
}

const getCategoryDisplay = (category: string) => {
  const categoryMap = {
    meat: '肉类',
    vegetable: '蔬菜',
    seasoning: '调料',
    other: '其他'
  }
  return categoryMap[category as keyof typeof categoryMap] || category
}

// 生命周期
onMounted(() => {
  // 默认展开所有分类
  expandedCategories.value = new Set(['meat', 'vegetable', 'seasoning', 'other'])
})
</script>

<style scoped>
/* 自定义复选框样式 */
input[type="checkbox"]:checked {
  background-color: #FF6B35;
  border-color: #FF6B35;
}

/* 分类展开动画 */
.transform {
  transition: transform 0.2s ease;
}

.rotate-180 {
  transform: rotate(180deg);
}
</style>
