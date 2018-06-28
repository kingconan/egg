import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import KeyPointCreator from '@/components/KeyPointCreator'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/hello',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/kpc',
      name: 'kpc',
      component: KeyPointCreator
    },
    {
      path: '/',
      name: 'kpc',
      component: KeyPointCreator
    }
  ]
})
