import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Button, Slider, Cell, CellGroup, Card, Tag, Icon, Popup } from 'vant'
import router from './router'
import App from './App.vue'
import 'vant/lib/index.css'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// 注册Vant组件
app.use(Button)
app.use(Slider)
app.use(Cell)
app.use(CellGroup)
app.use(Card)
app.use(Tag)
app.use(Icon)
app.use(Popup)

app.mount('#app')
