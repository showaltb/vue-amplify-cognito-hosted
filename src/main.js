import Vue from 'vue'
import App from './App.vue'
import { Auth, API } from 'aws-amplify'
import store from './store'

Vue.config.productionTip = false

const env = (key) => {
  const value = process.env[key]
  if (!value) throw new Error(`Error: environment variable ${key} not defined`)
  return value
}

Auth.configure({
  region: env('VUE_APP_AWS_REGION'),
  userPoolId: env('VUE_APP_USER_POOL_ID'),
  userPoolWebClientId: env('VUE_APP_USER_POOL_CLIENT_ID'),
  oauth: {
    domain: env('VUE_APP_HOSTED_UI_DOMAIN'),
    scope: [
      'openid',
      'profile',
      'test-api/read',
      'test-api/write'
    ],
    redirectSignIn: 'http://localhost:8080',
    redirectSignOut: 'http://localhost:8080',
    responseType: 'code'
  }
})

API.configure({
  endpoints: [
    {
      name: 'TestApi',
      endpoint: env('VUE_APP_TEST_API_ENDPOINT'),
      custom_header: async () => {
        const jwt = await store.dispatch('cognito/fetchJwtToken')
        return { Authorization: `Bearer ${jwt}` }
      }
    }
  ]
})

store.dispatch('cognito/init')
  .catch(err => console.log('cognito/init err:', err))
  .finally(() => {
    new Vue({
      store,
      render: h => h(App)
    }).$mount('#app')
  })
