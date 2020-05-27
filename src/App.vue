<template>
  <div id="app">
    <Home></Home>
  </div>
</template>

<script>
import Home from "./components/Home.vue";

export default {
  name: "App",
  components: {
    Home
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 20px 60px;
}

pre, tt.block {
  display: block;
  border: 1px solid #ccc;
  padding: 5px;
  background-color: #f2f2f2;
}

pre.error {
  background-color: #ffcccc;
}

pre.success {
  background-color: #ccffcc;
}

button {
  margin-right: 1em;
}
</style>
