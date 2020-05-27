<template>
  <div>
    <h1>vue-amplify-cognito-hosted</h1>
    <div v-if="user">
      <p>
        You are signed in as:
        <strong>{{ userName }} ({{ userEmail }})</strong>
      </p>
      <p>
        You are a member of the groups(s):
        <strong>{{ userGroups }}</strong>
      </p>
      <p>
        Your access token has the scope(s):
        <strong>{{ accessTokenScopes }}</strong>
      </p>
      <p>
        <button @click="doSignOut">Sign Out</button>
      </p>
      <h2>API Requests</h2>
      <p>
        <button @click="doGetUser">GET /user</button>
        <button @click="doPostUser">POST /user</button>
        <button @click="doGetAdmin">GET /admin</button>
        <button @click="doPostAdmin">POST /admin</button>
      </p>
      <pre class="success" v-if="apiResponse">{{ apiResponse }}</pre>
      <pre class="error" v-if="apiError">{{ apiError }}</pre>
    </div>
    <div v-else>
      <p>You aren't currently signed in</p>
      <p>
        <button @click="doSignIn">Sign In</button>
      </p>
    </div>

    <div v-if="user">
      <h2>OAuth Tokens</h2>ID Token Claims
      <pre>{{ idTokenClaims }}</pre>
      <p />Access Token Claims
      <pre>{{ accessTokenClaims }}</pre>
    </div>

    <h2>Amplify Auth Configuration</h2>
    <pre>{{ authConfig }}</pre>

    <h2>Amplify API Configuration</h2>
    <pre>{{ apiConfig }}</pre>
  </div>
</template>

<script>
import { Auth, API } from "aws-amplify";
import { mapGetters, mapState } from "vuex";

export default {
  name: "Home",
  data() {
    return {
      apiResponse: null,
      apiError: null
    };
  },
  computed: {
    userName() {
      return this.user.username
    },
    userEmail() {
      return this.idTokenClaims.email;
    },
    userGroups() {
      const groups = this.accessTokenClaims["cognito:groups"] || [];
      return groups.join(" ");
    },
    accessTokenScopes() {
      return this.accessTokenClaims.scope;
    },
    authConfig() {
      return JSON.stringify(Auth._config, null, 2);
    },
    apiConfig() {
      return JSON.stringify(API._options, null, 2);
    },
    accessToken() {
      return this.session && this.session.getAccessToken()
    },
    accessTokenClaims() {
      return this.accessToken && this.accessToken.payload;
    },
    idToken() {
      return this.session && this.session.getIdToken()
    },
    idTokenClaims() {
      return this.idToken && this.idToken.payload;
    },
    ...mapState("cognito", ["user"]),
    ...mapGetters("cognito", ["session"])
  },
  methods: {
    doApi(method, path) {
      this.apiResponse = null;
      this.apiError = null;
      API[method]("TestApi", path, { response: true })
        .then(response => (this.apiResponse = response))
        .catch(error => (this.apiError = error.response));
    },
    doGetUser() {
      this.doApi("get", "/user");
    },
    doPostUser() {
      this.doApi("post", "/user");
    },
    doGetAdmin() {
      this.doApi("get", "/admin");
    },
    doPostAdmin() {
      this.doApi("post", "/admin");
    },
    doSignIn() {
      Auth.federatedSignIn()
    },
    doSignOut() {
      Auth.signOut()
    }
  }
};
</script>
