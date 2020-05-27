import Vue from 'vue'
import Vuex from 'vuex'
import cognito from './cognito'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    cognito
  }
})

export default store
