import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 👈 정확한 플러그인 이름으로 수정했습니다!
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
})