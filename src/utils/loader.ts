import type { Recipe } from '@/types'
import { RecipeParser } from './recipeParser'

let cachedRecipes: Recipe[] | null = null

function normalizePath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  const stack: string[] = []
  for (const part of parts) {
    if (part === '.') continue
    if (part === '..') { stack.pop(); continue }
    stack.push(part)
  }
  return '/' + stack.join('/')
}

export function loadAllRecipes(): Recipe[] {
  if (cachedRecipes) return cachedRecipes

  // 加载所有 Markdown 原文
  const mdModules = import.meta.glob('/HowToCook/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
  // 加载所有图片资源，得到构建后的 URL
  const imageModules = import.meta.glob('/HowToCook/**/*.{png,jpg,jpeg,webp}', { eager: true }) as Record<string, any>

  // 建立原始路径到URL的映射
  const imageUrlMap: Record<string, string> = {}
  for (const key in imageModules) {
    const mod = imageModules[key] as any
    const url = typeof mod === 'string' ? mod : (mod?.default ?? '')
    if (url) {
      imageUrlMap[normalizePath(key.replace(/^\.?\//, ''))] = url
    }
  }

  const parser = new RecipeParser()
  const recipes: Recipe[] = []

  for (const key in mdModules) {
    const raw = mdModules[key]
    const filePath = normalizePath(key.replace(/^\.?\//, ''))
    const baseDir = filePath.substring(0, filePath.lastIndexOf('/'))

    const recipe = parser.parseMarkdown(raw, filePath)
    if (!recipe) continue

    // 将 Markdown 中的相对图片路径映射为构建后的 URL
    if (recipe.images && recipe.images.length > 0) {
      recipe.images = recipe.images.map(img => {
        const rel = img.startsWith('/') ? img : normalizePath(baseDir + '/' + img)
        return imageUrlMap[rel] || img
      })
    }

    recipes.push(recipe)
  }

  // 缓存以避免重复解析
  cachedRecipes = recipes
  return recipes
}
