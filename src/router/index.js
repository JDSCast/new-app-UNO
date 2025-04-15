import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import GameBoard from '@/views/GameBoard.vue'
import JoinGame from '../views/JoinGame.vue'
import Home from '../views/Home.vue'
import CreateGame from '@/views/CreateGame.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/game-board',
      name: 'game-board',
      component: GameBoard,
    },
    {
      path: '/join-game',
      name: 'joingame',
      component: JoinGame,
    },
    {
      path: '/home',
      name: 'home',
      component: Home,
    },
    {
      path: '/create-game',
      name: 'create-game',
      component: CreateGame,
    },
  ],
})

export default router
