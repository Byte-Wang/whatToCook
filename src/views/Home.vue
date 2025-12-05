<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
    <!-- 头部 -->
    <header class="bg-white shadow-sm px-4 py-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-800 text-center flex items-center justify-center gap-2">
          <SparklesIcon class="w-7 h-7 text-orange-500" /> 今天吃什么
        </h1>
        <p class="text-sm text-gray-600 text-center mt-1">
          {{ currentDate }}
        </p>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <!-- 人数设置 -->
      <section class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserGroupIcon class="w-5 h-5 text-orange-500" /> 用餐人数设置
        </h2>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button 
              @click="decreasePeople" 
              class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
            >
              -
            </button>
            <div class="text-center">
              <div class="text-3xl font-bold text-orange-600">{{ peopleCount }}</div>
              <div class="text-sm text-gray-600">人</div>
            </div>
            <button 
              @click="increasePeople" 
              class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors"
            >
              +
            </button>
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-600">建议菜品</div>
            <div class="text-lg font-semibold text-orange-600">{{ suggestedDishes }}道</div>
          </div>
        </div>
        
        <!-- 滑动条 -->
        <div class="mt-4">
          <van-slider 
            v-model="peopleCount" 
            :min="1" 
            :max="10" 
            bar-height="4px"
            active-color="#FF6B35"
            inactive-color="#FFE5D4"
          />
          <div class="flex justify-between text-xs text-gray-500 mt-2">
            <span>1人</span>
            <span>10人</span>
          </div>
        </div>
      </section>

      <!-- 推荐按钮 -->
      <section class="text-center mb-8 relative">
          <van-button 
            type="primary" 
            size="large" 
            :disabled="isAnimating"
            @click="onGenerateWithAnimation"
            class="!bg-gradient-to-r !from-orange-500 !to-orange-600 !border-none !rounded-xl !px-8 !py-4 !text-lg !font-semibold !shadow-lg hover:!shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowPathIcon class="w-6 h-6 text-white" /> 今天吃什么
          </van-button>
        <p class="text-sm text-gray-600 mt-3">
          点击按钮，AI为您推荐营养均衡的菜品组合
        </p>

        <!-- 动画叠层：漂浮滚动卡片 -->
        <div v-if="isAnimating" class="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          <div class="absolute inset-0">
            <div 
              v-for="ghost in overlayCards" 
              :key="ghost.id"
              class="ghost-card"
              :style="{
                left: 0,
                top: 0,
                transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0) rotate(${ghost.rot}deg) scale(${ghost.scale})`,
                opacity: ghost.opacity
              }"
            >
              <div class="ghost-inner">
                <div class="ghost-title-text">{{ ghost.title }}</div>
                <div class="ghost-line w-10"></div>
                <div class="ghost-line w-16"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 推荐建议 -->
      <section v-if="recommendations.length > 0" class="bg-blue-50 rounded-xl p-4 mb-6">
        <h3 class="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
          💡 推荐建议
        </h3>
        <ul class="text-sm text-blue-700 space-y-1">
          <li v-for="(rec, index) in recommendations" :key="index" class="flex items-start gap-2">
            <span class="text-blue-500">•</span>
            {{ rec }}
          </li>
        </ul>
      </section>

      <!-- 当前推荐菜单 -->
      <section v-if="currentMenu.length > 0" class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BookOpenIcon class="w-5 h-5 text-orange-500" /> 今日推荐菜单
          </h2>
          <div class="text-sm text-gray-600">
            总用时约 {{ totalTime }} 分钟
          </div>
        </div>
        
        <div class="grid gap-4 md:grid-cols-2" ref="menuGridRef">
          <div 
            v-for="(recipe, idx) in displayMenu" 
            :key="recipe.id"
            class="rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 drop-card"
            :style="{ animationDelay: (idx * 120) + 'ms' }"
            @click="viewRecipeDetail(recipe)"
          >
            <div class="flex items-start gap-3">
              <div class="text-2xl">{{ getCategoryEmoji(recipe.category) }}</div>
              <div class="flex-1">
                <h3 class="font-semibold text-gray-800 mb-1">{{ recipe.name }}</h3>
                <div class="flex items-center gap-4 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <ClockIcon class="w-4 h-4" /> {{ recipe.cookingTime }}分钟
                  </span>
                  <span class="flex items-center gap-1">
                    <ChartBarIcon class="w-4 h-4" /> {{ recipe.difficulty === 'easy' ? '简单' : recipe.difficulty === 'medium' ? '中等' : '困难' }}
                  </span>
                </div>
                <p v-if="recipe.description" class="text-sm text-gray-500 mt-2 line-clamp-2">
                  {{ recipe.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <van-button 
            plain 
            type="default" 
            @click="regenerateMenu"
            class="flex-1 !bg-gray-100 !text-gray-700 !border-gray-300 !rounded-lg !py-3 !font-medium hover:!bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowPathIcon class="w-5 h-5" /> 重新生成
          </van-button>
          <van-button 
            type="primary" 
            @click="viewShoppingList"
            class="flex-1 !bg-orange-500 !border-orange-500 !rounded-lg !py-3 !font-medium hover:!bg-orange-600 transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingCartIcon class="w-5 h-5 text-white" /> 查看购物清单
          </van-button>
        </div>
      </section>

      <!-- 空状态 -->
      <section v-else class="bg-white rounded-xl shadow-sm p-12 text-center">
        <div class="text-6xl mb-4">🤔</div>
        <h3 class="text-lg font-semibold text-gray-800 mb-2">还没想好今天吃什么？</h3>
        <p class="text-gray-600">点击上方按钮，让AI为您推荐营养均衡的菜品组合</p>
      </section>
    </main>
    <van-popup v-model:show="showRecipeDetail" position="bottom" round :style="{ height: '80vh' }">
      <div class="p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-bold flex items-center gap-2">
            <BookOpenIcon class="w-5 h-5 text-orange-500" /> {{ selectedRecipe?.name }}
          </h3>
          <button class="text-gray-500" @click="showRecipeDetail = false">关闭</button>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm text-gray-700 mb-4">
          <div class="flex items-center gap-2"><ClockIcon class="w-4 h-4" /> {{ selectedRecipe?.cookingTime }}分钟</div>
          <div class="flex items-center gap-2"><ChartBarIcon class="w-4 h-4" /> {{ selectedRecipe ? difficultyText(selectedRecipe.difficulty) : '' }}</div>
        </div>

        <div v-if="selectedRecipe?.images && selectedRecipe.images.length > 0" class="mb-4">
          <img :src="selectedRecipe.images[0]" alt="成品图" class="w-full h-40 object-cover rounded-lg" />
        </div>

        <h4 class="text-base font-semibold mb-2">制作步骤</h4>
        <div class="space-y-3 overflow-y-auto" style="max-height: 45vh;">
          <div v-for="(step, idx) in selectedRecipe?.steps" :key="idx" class="flex gap-3 p-3 bg-orange-50 rounded-lg">
            <div class="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{{ idx + 1 }}</div>
            <div class="flex-1 text-gray-700 leading-relaxed">{{ step }}</div>
          </div>
        </div>

        <div class="mt-4">
        <van-button block type="primary" class="!bg-orange-500 !border-orange-500 !rounded-lg" @click="goMenuDetail">
          前往详情页查看更多
        </van-button>
      </div>
    </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores'
import { MenuRecommender, loadAllRecipes } from '@/utils'
import type { Recipe } from '@/types'

const router = useRouter()
const store = useAppStore()
import { SparklesIcon, UserGroupIcon, ArrowPathIcon, ClockIcon, ChartBarIcon, ShoppingCartIcon, BookOpenIcon } from '@heroicons/vue/24/outline'

// 状态
const currentMenu = computed(() => store.recommendedMenu)
const peopleCount = computed({
  get: () => store.peopleCount,
  set: (value) => store.setPeopleCount(value)
})

// 计算属性
const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

const suggestedDishes = computed(() => {
  const n = peopleCount.value
  if (n <= 2) return 2
  if (n <= 4) return 3
  if (n <= 6) return 4
  if (n <= 8) return 5
  return 6
})

const totalTime = computed(() => {
  return store.totalCookingTime
})

const recommendations = ref<string[]>([])
const isAnimating = ref(false)
type Ghost = {
  id:number; title:string;
  x:number; y:number; vx:number; vy:number;
  rot:number; vrot:number; scale:number; opacity:number;
  phase:'explode'|'orbit'|'fly'|'fade';
  theta:number; radius:number; omega:number;
  targetX:number; targetY:number; speed:number;
  fadeStart:number
}
const overlayCards = ref<Ghost[]>([])
let ghostRafId: number | null = null
const menuGridRef = ref<HTMLElement | null>(null)
const visibleCount = ref(0)
const displayMenu = computed(() => currentMenu.value.slice(0, visibleCount.value))

// 方法
const decreasePeople = () => {
  if (peopleCount.value > 1) {
    store.setPeopleCount(peopleCount.value - 1)
  }
}

const increasePeople = () => {
  if (peopleCount.value < 10) {
    store.setPeopleCount(peopleCount.value + 1)
  }
}

const generateMenu = async () => {
  try {
    const allRecipes = loadAllRecipes()
    const recommender = new MenuRecommender(allRecipes)
    const menu = recommender.recommendMenu(peopleCount.value)
    
    store.setRecommendedMenu(menu)
    
    // 生成购物清单
    const shoppingList = recommender.calculateIngredients(menu, peopleCount.value)
    store.setShoppingList(shoppingList)
    
    // 获取推荐建议
    recommendations.value = recommender.getRecommendations(peopleCount.value)
    
  } catch (error) {
    console.error('生成菜单失败:', error)
    // 这里可以添加错误提示
  }
}

const regenerateMenu = () => {
  onGenerateWithAnimation()
}

const sampleTitles = (count: number): string[] => {
  const list = loadAllRecipes().map(r => r.name)
  const shuffled = [...list]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

const createOverlayCards = () => {
  const titles = sampleTitles(24)
  const cx = window.innerWidth * 0.5
  const cy = window.innerHeight * 0.5
  const ghosts: Ghost[] = []
  for (let i = 0; i < titles.length; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1200 + Math.random() * 1200 // px/s (double)
    const vrot = (Math.random() * 480 - 240) // deg/s (double)
    ghosts.push({
      id: i,
      title: titles[i],
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: 0,
      vrot,
      scale: 0.95,
      opacity: 0,
      phase: 'explode',
      theta: angle,
      radius: 0,
      omega: 0,
      targetX: 0,
      targetY: 0,
      speed: 900,
      fadeStart: 0
    })
  }
  overlayCards.value = ghosts
}

const startGhostSequence = () => new Promise<void>((resolve) => {
  const cx = window.innerWidth * 0.5
  const cy = window.innerHeight * 0.5
  const R = Math.min(window.innerWidth, window.innerHeight) * 0.42
  const ORBIT_MS = 5000
  const start = performance.now()
  let orbitStart = 0
  let last = start

  // pick which ghosts will fly into menu list (equal to cards we will show)
  const total = currentMenu.value.length
  const flyIds = new Set<number>()
  const idxs = overlayCards.value.map((_, i) => i)
  for (let i = idxs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[idxs[i], idxs[j]] = [idxs[j], idxs[i]]
  }
  idxs.slice(0, Math.min(total, idxs.length)).forEach(i => flyIds.add(i))

  const step = (now: number) => {
    const dt = (now - last) / 1000
    last = now

    overlayCards.value = overlayCards.value.map((g, _i) => {
      if (g.phase === 'explode') {
        // move outwards
        const nx = g.x + g.vx * dt
        const ny = g.y + g.vy * dt
        const dx = nx - cx
        const dy = ny - cy
        const dist = Math.hypot(dx, dy)
        const nrot = g.rot + g.vrot * dt
        const s = Math.min(1.05, g.scale + dt * 0.12)
        const op = Math.min(1, g.opacity + dt * 5)
        if (dist >= R) {
          // snap to orbit
          const theta = Math.atan2(dy, dx)
          const omega = (Math.random() < 0.5 ? -1 : 1) * (2.6 + Math.random() * 2.6) // double angular speed
          return { ...g, x: cx + R * Math.cos(theta), y: cy + R * Math.sin(theta), rot: nrot, scale: s, opacity: op, phase: 'orbit', theta, radius: R, omega }
        } else {
          return { ...g, x: nx, y: ny, rot: nrot, scale: s, opacity: op }
        }
      }

      if (g.phase === 'orbit') {
        const theta = g.theta + g.omega * dt
        const nx = cx + g.radius * Math.cos(theta)
        const ny = cy + g.radius * Math.sin(theta)
        const nrot = g.rot + g.vrot * dt
        const op = Math.min(1, Math.max(g.opacity, 0.95))
        return { ...g, x: nx, y: ny, rot: nrot, theta, opacity: op }
      }

      if (g.phase === 'fly') {
        const dx = g.targetX - g.x
        const dy = g.targetY - g.y
        const dist = Math.hypot(dx, dy)
        if (dist < 18) {
          // arrived: start fade
          return { ...g, phase: 'fade', fadeStart: now }
        }
        const vx = (dx / dist) * g.speed
        const vy = (dy / dist) * g.speed
        const op = Math.min(1, Math.max(g.opacity, 0.98))
        return { ...g, x: g.x + vx * dt, y: g.y + vy * dt, rot: g.rot + g.vrot * dt, scale: Math.max(0.9, g.scale - dt * 0.05), opacity: op }
      }

      if (g.phase === 'fade') {
        const op = Math.max(0, g.opacity - dt * 1.4)
        return { ...g, opacity: op }
      }

      return g
    })

    // set orbitStart when first orbit happens
    if (!orbitStart && overlayCards.value.some(g => g.phase === 'orbit')) orbitStart = now

    // after orbit time, switch phases to fly/fade
    if (orbitStart && (now - orbitStart) > ORBIT_MS) {
      const rect = menuGridRef.value?.getBoundingClientRect()
      const tx = rect ? (rect.left + rect.width * 0.5) : cx
      const ty = rect ? (rect.top + rect.height * 0.3) : cy
      overlayCards.value = overlayCards.value.map((g, i) => {
        if (g.phase === 'orbit') {
          const phase = flyIds.has(i) ? 'fly' : 'fade'
          const jitterX = (Math.random() * 60 - 30)
          const jitterY = (Math.random() * 60 - 30)
          return { ...g, phase, targetX: tx + jitterX, targetY: ty + jitterY }
        }
        return g
      })

      // reveal real cards in sync with fly arrivals
      const totalCards = currentMenu.value.length
      let revealed = 0
      const revealTimer = setInterval(() => {
        visibleCount.value = Math.min(totalCards, visibleCount.value + 1)
        revealed++
        if (revealed >= totalCards) clearInterval(revealTimer)
      }, 200)
      orbitStart = 0 // prevent re-trigger
    }

    const allDone = overlayCards.value.every(g => g.phase === 'fade' && g.opacity <= 0)
    if (allDone) {
      resolve()
      return
    }
    ghostRafId = requestAnimationFrame(step)
  }
  ghostRafId = requestAnimationFrame(step)
})

const onGenerateWithAnimation = async () => {
  if (isAnimating.value) return
  isAnimating.value = true
  visibleCount.value = 0
  createOverlayCards()
  await generateMenu()
  await startGhostSequence()
  const total = currentMenu.value.length
  let i = 0
  const timer = setInterval(() => {
    visibleCount.value = Math.min(total, i + 1)
    i++
    if (i >= total) {
      clearInterval(timer)
      setTimeout(() => { isAnimating.value = false }, 200)
    }
  }, 140)
}

const selectedRecipe = ref<Recipe | null>(null)
const showRecipeDetail = ref(false)

const viewRecipeDetail = (recipe: Recipe) => {
  selectedRecipe.value = recipe
  showRecipeDetail.value = true
}

const viewShoppingList = () => {
  router.push('/shopping-list')
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

// 生命周期
onMounted(() => {
  // 组件加载时自动生成一次菜单
  if (currentMenu.value.length === 0) {
    generateMenu()
  }
})

// 在离开页面或路由变化时关闭抽屉，避免残留遮罩
onBeforeUnmount(() => {
  showRecipeDetail.value = false
  if (ghostRafId) cancelAnimationFrame(ghostRafId)
})

watch(() => router.currentRoute.value.fullPath, () => {
  showRecipeDetail.value = false
})

// 显示难度文本
const difficultyText = (difficulty: Recipe['difficulty']) => {
  return difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'
}

const goMenuDetail = () => {
  showRecipeDetail.value = false
  router.push('/menu')
}
</script>

<style scoped>
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FF6B35;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #FF6B35;
  cursor: pointer;
  border: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 对齐 Vant 按钮内部内容为横向居中 */
:deep(.van-button__content) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

:deep(.van-button__text) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* 漂浮卡片与落地动画样式 */
.ghost-card {
  position: absolute;
  width: 28vw;
  max-width: 240px;
  min-width: 140px;
  height: 16vw;
  max-height: 150px;
  min-height: 90px;
  background: linear-gradient(135deg, #fff8f3, #ffe5d4);
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
  animation-name: ghostShuffle;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  filter: saturate(1.05) drop-shadow(0 4px 10px rgba(0,0,0,0.06));
  will-change: transform;
  transform-origin: center center;
}
.ghost-inner { padding: 12px }
.ghost-title-text { font-weight: 600; font-size: 14px; color: #ff6b35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px }
.ghost-line { height: 10px; background: #ffe5d4; border-radius: 8px; margin-top: 6px }

@keyframes ghostShuffle {
  0% { transform: translate3d(0, 0, 0) rotate(var(--rot)); opacity: 0.85 }
  50% { transform: translate3d(calc(var(--dx) * 0.6vw), calc(var(--dy) * 0.6vh), 0) rotate(calc(var(--rot) + 1deg)); opacity: 0.95 }
  100% { transform: translate3d(calc(var(--dx) * 1vw), calc(var(--dy) * 1vh), 0) rotate(calc(var(--rot) - 1deg)); opacity: 0.9 }
}

.drop-card { 
  animation: cardDrop 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes cardDrop {
  0% { opacity: 0; transform: translateY(-18px) scale(0.98) }
  60% { opacity: 1; transform: translateY(0) scale(1.02) }
  100% { opacity: 1; transform: translateY(0) scale(1) }
}

@keyframes ghostExplode {
  0% { opacity: 0; transform: translate3d(0,0,0) scale(0.9) rotate(0deg) }
  50% { opacity: 1; transform: translate3d(calc(var(--tx) * 0.5vw), calc(var(--ty) * 0.5vh), 0) scale(1.06) rotate(var(--rot)) }
  100% { opacity: 1; transform: translate3d(calc(var(--tx) * 1vw), calc(var(--ty) * 1vh), 0) scale(1) rotate(var(--rot)) }
}

/* 从中心散开的爆炸动画 */
@keyframes ghostExplode {
  0% { opacity: 0; transform: translate3d(0,0,0) scale(0.92) rotate(0deg) }
  100% { opacity: 1; transform: translate3d(calc(var(--tx) * 1vw), calc(var(--ty) * 1vh), 0) scale(1) rotate(var(--rot)) }
}
</style>
