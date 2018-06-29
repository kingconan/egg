import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import KeyPointCreator from '@/components/KeyPointCreator'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/hello/',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/kpc/:id/',
      name: 'kpc',
      props: true,
      component: KeyPointCreator
    },
    {
      path: '/',
      name: 'kpc',
      component: KeyPointCreator
    }
  ]
})
