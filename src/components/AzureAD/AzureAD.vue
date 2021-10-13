<template>
  <article>
    <h1>Azure AD</h1>
    <p>Experimenting with a Azure AD, if you sign in with an Azure AD account you'll see your name below.</p>
    <div>
      <button v-if="!account" @click="signIn()" type="button">Sign-in</button>
      <button v-if="account" @click="signOut()" type="button">Sign-out</button>
    </div>
    <div v-if="account">
      <p>username: {{ username }}</p>
      <p>name: {{ name }}</p>
      <pre>{{ account }}</pre>
    </div>
  </article>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as msal from "@azure/msal-browser";

const msalConfig: msal.Configuration = {
  auth: {
    clientId: "06005ae6-7f87-4ab0-af1d-e092ec0526ae",
    authority:
      "https://login.microsoftonline.com/724509ea-a67d-405e-935d-b90b2a4e9708",
    redirectUri: document.location.origin,
    postLogoutRedirectUri: document.location.href,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case msal.LogLevel.Error:
            return console.error(message);
          case msal.LogLevel.Warning:
            return console.warn(message);
          default:
            console.debug(message);
        }
      },
    },
  },
};

export default defineComponent({
  name: "AzureAD",
  setup: () => ({
    clientApplication: new msal.PublicClientApplication(msalConfig),
  }),
  data: () => ({
    account: undefined as msal.AccountInfo | null | undefined,
  }),
  created() {
    const handleResponse = (response: msal.AuthenticationResult | null) => {
      const accounts = this.clientApplication.getAllAccounts();
      if (accounts.length > 1) console.warn("Multiple accounts detected.");
      this.account = response?.account || accounts[0];
    };

    this.clientApplication
      .handleRedirectPromise()
      .then(handleResponse)
      .catch((error) => {
        console.error(error);
      });
  },
  computed: {
    username(): string {
      return this.account?.username || "";
    },
    name(): string {
      return this.account?.name || "";
    },
  },
  methods: {
    signIn() {
      this.clientApplication.loginRedirect({
        scopes: ["User.Read"],
      });
    },
    signOut() {
      this.clientApplication.logoutRedirect({
        account: this.clientApplication.getAccountByUsername(this.username),
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      });
    },
  },
});
</script>

<style scoped>
</style>
