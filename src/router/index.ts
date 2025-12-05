import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import MenuDetail from '@/views/MenuDetail.vue'
import ShoppingList from '@/views/ShoppingList.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/menu',
      name: 'menu',
      component: MenuDetail
    },
    {
      path: '/shopping-list',
      name: 'shopping-list',
      component: ShoppingList
    }
  ]
})

export default router