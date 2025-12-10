import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// Для GitHub Pages: если репозиторий называется не 'cards', 
// измените base на '/ваше-имя-репозитория/'
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' || process.env.NODE_ENV === 'production' 
    ? '/cards/' 
    : '/',
})


