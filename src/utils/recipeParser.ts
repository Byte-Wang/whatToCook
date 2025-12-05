import type { Recipe, Ingredient } from '@/types'

export class RecipeParser {
  // 解析Markdown内容提取菜谱信息（兼容多种章节命名与格式）
  parseMarkdown(content: string, filePathOrName: string): Recipe | null {
    try {
      let name = ''
      let category: Recipe['category'] = 'meat_dish'
      let difficulty: Recipe['difficulty'] = 'medium'
      let cookingTime = 30
      let servings = 2
      let ingredients: Ingredient[] = []
      let steps: string[] = []
      let images: string[] = []
      let description = ''

      // 提取标题
      const titleMatch = content.match(/^#\s+(.+)$/m)
      if (titleMatch) {
        name = this.sanitizeTitle(titleMatch[1].trim())
      } else {
        // 从文件名提取标题
        const fileNameOnly = filePathOrName.split('/').pop() || filePathOrName
        name = this.sanitizeTitle(fileNameOnly.replace(/\.md$/, '').replace(/[-_]/g, ' '))
      }

      // 提取描述
      const descMatch = content.match(/^>\s*(.+)$/m)
      if (descMatch) {
        description = descMatch[1].trim()
      }

      // 提取食材部分（兼容：食材/原料/材料/用料/配料/必备原料和工具、以及“计算”分量章节）
      const ingredientSection = this.findSection(content, /##+\s*(食材|原料|材料|用料|配料|必备原料和工具)/)
      const quantitySection = this.findSection(content, /##+\s*(计算|配比|分量)/)
      const fromIngredientNames = ingredientSection ? this.parseIngredients(ingredientSection, true) : []
      const fromQuantities = quantitySection ? this.parseIngredients(quantitySection, false) : []
      ingredients = this.mergeIngredientQuantities(fromIngredientNames, fromQuantities)
      if (ingredients.length === 0 && ingredientSection) {
        // 回退：如果没有“计算”中的数量，直接使用食材名，数量设为适量
        ingredients = this.parseIngredients(ingredientSection, true)
      }

      // 提取制作步骤（兼容：制作/操作/做法/步骤/方法/烹饪）
      const stepsSection = this.findSection(content, /##+\s*(制作|操作|做法|步骤|方法|烹饪)/)
      if (stepsSection) {
        steps = this.parseSteps(stepsSection)
      }

      // 提取图片
      const imageMatches = content.match(/!\[.*?\]\((.+?)\)/g)
      if (imageMatches) {
        images = imageMatches.map(match => {
          const urlMatch = match.match(/!\[.*?\]\((.+?)\)/)
          return urlMatch ? urlMatch[1] : ''
        }).filter(Boolean)
      }

      // 根据路径或文件名判断分类
      const lowerPath = filePathOrName.toLowerCase()
      if (lowerPath.includes('/soup/')) category = 'soup'
      else if (lowerPath.includes('/vegetarian/') || lowerPath.includes('/vegetable_dish/')) category = 'vegetarian'
      else if (lowerPath.includes('/meat_dish/')) category = 'meat_dish'
      else if (lowerPath.includes('/aquatic/')) category = 'aquatic'
      else if (lowerPath.includes('/drink/')) category = 'drink'
      else if (lowerPath.includes('/dessert/')) category = 'dessert'
      else {
        const fileNameOnly = filePathOrName
        if (fileNameOnly.includes('汤')) category = 'soup'
        else if (fileNameOnly.includes('素') || fileNameOnly.includes('素菜') || fileNameOnly.includes('蔬菜')) category = 'vegetarian'
        else if (fileNameOnly.includes('海鲜') || fileNameOnly.includes('鱼')) category = 'aquatic'
        else if (fileNameOnly.includes('饮料') || fileNameOnly.includes('饮品')) category = 'drink'
        else if (fileNameOnly.includes('甜品') || fileNameOnly.includes('蛋糕')) category = 'dessert'
      }

      // 根据食材和步骤数量判断难度
      if (ingredients.length <= 5 && steps.length <= 5) difficulty = 'easy'
      else if (ingredients.length >= 10 || steps.length >= 10) difficulty = 'hard'

      // 估算烹饪时间（基于步骤数量）
      cookingTime = Math.max(15, steps.length * 5)

      return {
        id: this.generateId(name),
        name,
        category,
        difficulty,
        cookingTime,
        servings,
        ingredients,
        steps,
        images,
        description
      }
    } catch (error) {
      console.error('解析菜谱失败:', error)
      return null
    }
  }

  private findSection(content: string, headerRegex: RegExp): string | null {
    const match = content.match(headerRegex)
    if (!match) return null
    const startIndex = match.index ?? 0
    const after = content.slice(startIndex)
    const nextHeaderIndex = after.slice(1).search(/\n##+\s+/)
    const section = nextHeaderIndex >= 0 ? after.slice(0, nextHeaderIndex + 1) : after
    return section
  }

  // 解析食材（namesOnly 控制是否允许只有名称不含数量）
  private parseIngredients(content: string, namesOnly: boolean): Ingredient[] {
    const ingredients: Ingredient[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('##') || trimmed.startsWith('#')) continue
      // 支持行首符号：* - •
      const clean = trimmed.replace(/^[-*•]\s+/, '')

      const cleanedLine = clean.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '')
      // 匹配：名称 数量 单位
      let match = cleanedLine.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(.+)$/)
      if (match) {
        const [, name, amount, unit] = match
        ingredients.push({
          name: name.trim(),
          amount: amount.trim(),
          unit: this.parseUnit(unit.trim()),
          category: this.categorizeIngredient(name.trim())
        })
        continue
      }

      // 匹配：名称 + 范围数量 + 单位，例如 1-2 个
      match = cleanedLine.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(.+)$/)
      if (match) {
        const [, name, a, b, unit] = match
        const avg = (parseFloat(a) + parseFloat(b)) / 2
        ingredients.push({
          name: name.trim(),
          amount: (avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1)),
          unit: this.parseUnit(unit.trim()),
          category: this.categorizeIngredient(name.trim())
        })
        continue
      }

      // 匹配：名称 + 适量
      match = cleanedLine.match(/^(.+?)\s*(适量)$/)
      if (match) {
        const [, name] = match
        ingredients.push({
          name: name.trim(),
          amount: '适量',
          unit: '适量',
          category: this.categorizeIngredient(name.trim())
        })
        continue
      }

      // 仅名称（在“必备原料和工具”中常见）
      if (namesOnly) {
        ingredients.push({
          name: cleanedLine,
          amount: '适量',
          unit: '适量',
          category: this.categorizeIngredient(cleanedLine)
        })
      }
    }
    
    return ingredients
  }

  // 解析制作步骤
  private parseSteps(content: string): string[] {
    const steps: string[] = []
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('##') || trimmed.startsWith('#')) continue
      // 支持：1. 内容 / 1、内容 / - 内容
      let match = trimmed.match(/^\d+\.\s+(.+)$/)
      if (!match) match = trimmed.match(/^\d+、\s*(.+)$/)
      if (!match) match = trimmed.match(/^[-*•]\s+(.+)$/)
      if (match) {
        steps.push(match[1].trim())
      } else {
        steps.push(trimmed)
      }
    }
    
    return steps
  }

  // 解析单位
  private parseUnit(unit: string): Ingredient['unit'] {
    const unitMap: Record<string, Ingredient['unit']> = {
      'g': 'g', '克': 'g', '公斤': 'kg', 'kg': 'kg', '千克': 'kg',
      'ml': 'ml', '毫升': 'ml', 'l': 'l', '升': 'l', 'L': 'l', '毫升/滴': 'ml', '滴': 'ml',
      '个': '个', '只': '只', '片': '片', '根': '根'
    }
    
    return unitMap[unit] || '适量'
  }

  // 分类食材
  private categorizeIngredient(name: string): Ingredient['category'] {
    const meatKeywords = ['肉', '鸡', '鸭', '鱼', '虾', '蟹', '牛', '羊', '猪']
    const vegetableKeywords = ['菜', '豆', '茄', '椒', '瓜', '萝卜', '洋葱', '蒜', '姜', '葱']
    const seasoningKeywords = ['盐', '糖', '醋', '酱油', '料酒', '油', '粉', '精', '香料']
    
    if (meatKeywords.some(keyword => name.includes(keyword))) return 'meat'
    if (vegetableKeywords.some(keyword => name.includes(keyword))) return 'vegetable'
    if (seasoningKeywords.some(keyword => name.includes(keyword))) return 'seasoning'
    
    return 'other'
  }

  // 生成唯一ID
  private generateId(name: string): string {
    return name.replace(/\s+/g, '-').toLowerCase()
  }

  // 规范化标题，去掉“的做法”等后缀
  private sanitizeTitle(raw: string): string {
    let n = raw
    // 去掉“的做法”“做法”及其后续括号/说明
    n = n.replace(/\s*的?做法.*$/i, '')
    // 常见“制作方法/制作步骤”等表述
    n = n.replace(/\s*制作方法.*$/i, '')
    n = n.replace(/\s*制作步骤.*$/i, '')
    // 去掉多余的标点或结尾空白
    n = n.replace(/[\s\-–—]+$/g, '')
    return n.trim()
  }

  // 将“食材名称列表”与“计算分量”进行合并
  private mergeIngredientQuantities(names: Ingredient[], quantities: Ingredient[]): Ingredient[] {
    if (quantities.length === 0) return names
    const map = new Map<string, Ingredient>()
    names.forEach(i => map.set(i.name, i))
    for (const q of quantities) {
      const existing = map.get(q.name)
      if (existing) {
        existing.amount = q.amount
        existing.unit = q.unit
        existing.category = existing.category || q.category
      } else {
        map.set(q.name, q)
      }
    }
    return Array.from(map.values())
  }

  // 模拟菜谱数据（用于测试和演示）
  getMockRecipes(): Recipe[] {
    return [
      {
        id: 'tomato-egg',
        name: '番茄炒蛋',
        category: 'vegetarian',
        difficulty: 'easy',
        cookingTime: 15,
        servings: 2,
        ingredients: [
          { name: '番茄', amount: '2', unit: '个', category: 'vegetable' },
          { name: '鸡蛋', amount: '3', unit: '个', category: 'other' },
          { name: '盐', amount: '适量', unit: '适量', category: 'seasoning' },
          { name: '糖', amount: '1', unit: 'g', category: 'seasoning' }
        ],
        steps: [
          '番茄洗净切块，鸡蛋打散备用',
          '热锅下油，倒入蛋液炒熟盛起',
          '锅中留底油，下番茄块炒出汁水',
          '加入炒好的鸡蛋，调味即可'
        ],
        images: [],
        description: '经典家常菜，营养丰富，老少皆宜'
      },
      {
        id: 'kung-pao-chicken',
        name: '宫保鸡丁',
        category: 'meat_dish',
        difficulty: 'medium',
        cookingTime: 25,
        servings: 3,
        ingredients: [
          { name: '鸡胸肉', amount: '300', unit: 'g', category: 'meat' },
          { name: '花生米', amount: '50', unit: 'g', category: 'other' },
          { name: '干辣椒', amount: '10', unit: '个', category: 'seasoning' },
          { name: '花椒', amount: '1', unit: 'g', category: 'seasoning' }
        ],
        steps: [
          '鸡肉切丁，用料酒和生抽腌制15分钟',
          '花生米炸至金黄酥脆',
          '热锅下油，爆香干辣椒和花椒',
          '下鸡丁炒至变色，调味后撒入花生米即可'
        ],
        images: [],
        description: '川菜经典，麻辣鲜香，下饭神器'
      },
      {
        id: 'egg-drop-soup',
        name: '蛋花汤',
        category: 'soup',
        difficulty: 'easy',
        cookingTime: 10,
        servings: 2,
        ingredients: [
          { name: '鸡蛋', amount: '2', unit: '个', category: 'other' },
          { name: '香油', amount: '5', unit: 'ml', category: 'seasoning' },
          { name: '盐', amount: '适量', unit: '适量', category: 'seasoning' },
          { name: '葱花', amount: '适量', unit: '适量', category: 'vegetable' }
        ],
        steps: [
          '锅中加水烧开',
          '鸡蛋打散，慢慢倒入锅中形成蛋花',
          '调味，淋香油，撒葱花即可'
        ],
        images: [],
        description: '简单快手汤品，清淡营养'
      }
    ]
  }
}
