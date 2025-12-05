<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
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
          🍽️ 菜单详情
        </h1>
        <button 
          @click="viewShoppingList" 
          class="text-sm text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
        >
          <ShoppingCartIcon class="w-5 h-5" /> 购物清单
        </button>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-4xl mx-auto px-4 py-6">
      <!-- 菜单概览 -->
      <section class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            📋 今日菜单
          </h2>
          <div class="text-sm text-gray-600">
            {{ currentMenu.length }}道菜 · 约{{ totalTime }}分钟
          </div>
        </div>
        
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div 
            v-for="recipe in currentMenu" 
            :key="recipe.id"
            class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            @click="selectRecipe(recipe)"
          >
            <div class="flex items-start gap-3">
              <div class="text-2xl">{{ getCategoryEmoji(recipe.category) }}</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800 mb-1">{{ recipe.name }}</h3>
                <div class="flex items-center gap-3 text-sm text-gray-600 mb-2">
                  <span class="flex items-center gap-1">
                    <ClockIcon class="w-4 h-4" /> {{ recipe.cookingTime }}分钟
                  </span>
                  <span class="flex items-center gap-1">
                    <ChartBarIcon class="w-4 h-4" /> {{ getDifficultyText(recipe.difficulty) }}
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span 
                    v-for="ingredient in recipe.ingredients.slice(0, 3)" 
                    :key="ingredient.name"
                    class="bg-gray-100 px-2 py-1 rounded"
                  >
                    {{ ingredient.name }}
                  </span>
                  <span v-if="recipe.ingredients.length > 3" class="text-gray-400">
                    +{{ recipe.ingredients.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 菜品详情 -->
      <section v-if="selectedRecipe" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold flex items-center gap-2">
                {{ getCategoryEmoji(selectedRecipe.category) }} {{ selectedRecipe.name }}
              </h2>
              <p v-if="selectedRecipe.description" class="text-orange-100 mt-1">
                {{ selectedRecipe.description }}
              </p>
            </div>
            <div class="text-right">
              <div class="text-sm text-orange-100">烹饪时间</div>
              <div class="text-lg font-bold">{{ selectedRecipe.cookingTime }}分钟</div>
            </div>
          </div>
        </div>

        <div class="p-6">
          <!-- 基本信息 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="text-center">
              <div class="text-2xl mb-1">{{ getCategoryEmoji(selectedRecipe.category) }}</div>
              <div class="text-sm text-gray-600">类型</div>
              <div class="text-sm font-medium">{{ getCategoryText(selectedRecipe.category) }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl mb-1">⏱️</div>
              <div class="text-sm text-gray-600">用时</div>
              <div class="text-sm font-medium">{{ selectedRecipe.cookingTime }}分钟</div>
            </div>
            <div class="text-center">
              <div class="text-2xl mb-1">📊</div>
              <div class="text-sm text-gray-600">难度</div>
              <div class="text-sm font-medium">{{ getDifficultyText(selectedRecipe.difficulty) }}</div>
            </div>
            <div class="text-center">
              <div class="text-2xl mb-1">🍽️</div>
              <div class="text-sm text-gray-600">份量</div>
              <div class="text-sm font-medium">{{ selectedRecipe.servings }}人份</div>
            </div>
          </div>

          <!-- 食材清单 -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              🥬 所需食材
            </h3>
            <div class="grid gap-2 md:grid-cols-2">
              <div 
                v-for="ingredient in selectedRecipe.ingredients" 
                :key="ingredient.name"
                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <span class="text-lg">{{ getIngredientEmoji(ingredient.category) }}</span>
                  <span class="font-medium text-gray-800">{{ ingredient.name }}</span>
                </div>
                <span class="text-sm text-gray-600">
                  {{ ingredient.amount }}{{ ingredient.unit === '适量' ? '' : ingredient.unit }}
                </span>
              </div>
            </div>
          </div>

          <!-- 制作步骤 -->
          <div>
            <h3 class="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              👨‍🍳 制作步骤
            </h3>
            <div class="space-y-3">
              <div 
                v-for="(step, index) in selectedRecipe.steps" 
                :key="index"
                class="flex gap-3 p-3 bg-orange-50 rounded-lg"
              >
                <div class="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {{ index + 1 }}
                </div>
                <div class="flex-1 text-gray-700 leading-relaxed">
                  {{ step }}
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button 
              @click="regenerateMenu"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowPathIcon class="w-5 h-5" /> 重新生成
            </button>
            <button 
              @click="viewShoppingList"
              class="flex-1 bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCartIcon class="w-5 h-5" /> 查看购物清单
            </button>
          </div>
        </div>
      </section>

      <!-- 未选择菜品状态 -->
      <section v-else class="bg-white rounded-xl shadow-sm p-12 text-center">
        <div class="text-6xl mb-4">👨‍🍳</div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">点击上方菜品查看详情</h3>
        <p class="text-gray-600">选择一道菜，查看详细的食材清单和制作步骤</p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { MenuRecommender, loadAllRecipes } from '@/utils'
import type { Recipe } from '@/types'
import { ArrowLeftIcon, ShoppingCartIcon, ClockIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const store = useAppStore()

// 状态
const selectedRecipe = ref<Recipe | null>(null)

// 计算属性
const currentMenu = computed(() => store.recommendedMenu)
const totalTime = computed(() => store.totalCookingTime)

// 方法
const goBack = () => {
  router.back()
}

const selectRecipe = (recipe: Recipe) => {
  selectedRecipe.value = recipe
}

const viewShoppingList = () => {
  router.push('/shopping-list')
}

const regenerateMenu = () => {
  // 重新生成菜单
  const allRecipes = loadAllRecipes()
  const recommender = new MenuRecommender(allRecipes)
  const menu = recommender.recommendMenu(store.peopleCount)
  
  store.setRecommendedMenu(menu)
  
  // 重新生成购物清单
  const shoppingList = recommender.calculateIngredients(menu, store.peopleCount)
  store.setShoppingList(shoppingList)
  
  // 重置选择
  selectedRecipe.value = menu.length > 0 ? menu[0] : null
}

const getCategoryEmoji = (category: Recipe['category']) => {
  const emojiMap = {
    meat_dish: '🍖',
    aquatic: '🐟',
    vegetarian: '🥬',
    soup: '🍲',
    drink: '🥤',
    dessert: '🍰'
  }
  return emojiMap[category]
}

const getCategoryText = (category: Recipe['category']) => {
  const textMap = {
    meat_dish: '荤菜',
    aquatic: '海鲜',
    vegetarian: '素食',
    soup: '汤品',
    drink: '饮品',
    dessert: '甜品'
  }
  return textMap[category]
}

const getDifficultyText = (difficulty: Recipe['difficulty']) => {
  const textMap = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return textMap[difficulty]
}

const getIngredientEmoji = (category: string) => {
  const emojiMap = {
    meat: '🥩',
    vegetable: '🥬',
    seasoning: '🧂',
    other: '🥫'
  }
  return emojiMap[category as keyof typeof emojiMap] || '🥘'
}

// 生命周期
onMounted(() => {
  // 默认选择第一个菜品
  if (currentMenu.value.length > 0 && !selectedRecipe.value) {
    selectedRecipe.value = currentMenu.value[0]
  }
})
</script>

<style scoped>
/* 步骤数字样式 */
.bg-orange-500 {
  background-color: #FF6B35;
}

/* 按钮悬停效果 */
button {
  transition: all 0.2s ease;
}

/* 卡片悬停效果 */
.cursor-pointer:hover {
  transform: translateY(-2px);
}

/* 对齐 Vant 按钮内部内容为横向居中 */
:deep(.van-button__content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
</style>
