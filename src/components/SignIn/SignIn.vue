<template>
  <article>
    <h1>Sign-in</h1>
    <p>Experimenting with a Azure AD</p>
    <div>
      <button v-if="!username" @click="signIn()" type="button">Sign-in</button>
      <button v-if="username" @click="signOut()" type="button">Sign-out</button>
    </div>
    <div v-if="username">
      <p>username: {{ username }}</p>
      <p>name: {{ name }}</p>
      <pre>{{ auth }}</pre>
    </div>
  </article>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as msal from "@azure/msal-browser";
const loginRequest = {
  scopes: ["User.Read"],
};

const msalConfig: msal.Configuration = {
  auth: {
    clientId: "06005ae6-7f87-4ab0-af1d-e092ec0526ae",
    authority:
      "https://login.microsoftonline.com/724509ea-a67d-405e-935d-b90b2a4e9708",
    redirectUri: document.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (
        level: msal.LogLevel,
        message: string,
        containsPii: boolean
      ) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case msal.LogLevel.Error:
            console.error(message);
            return;
          case msal.LogLevel.Info:
            console.info(message);
            return;
          case msal.LogLevel.Verbose:
            console.debug(message);
            return;
          case msal.LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

const myMSALObj = new msal.PublicClientApplication(msalConfig);

export default defineComponent({
  name: "SignIn",
  // setup: () => ({
  //   username: "None",
  // }),
  data: () => ({
    username: "",
    name: "",
    auth: {},
  }),
  mounted() {
    console.log();
    myMSALObj
      .handleRedirectPromise()
      .then(this.handleResponse)
      .catch((error) => {
        console.error(error);
      });
  },
  methods: {
    signIn() {
      // this.username = "Foobar";
      // console.log(this.username);
      myMSALObj.loginRedirect(loginRequest);
    },
    signOut() {
      /**
       * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
       */

      const logoutRequest = {
        account: myMSALObj.getAccountByUsername(this.username),
        postLogoutRedirectUri: msalConfig.auth.redirectUri,
      };

      myMSALObj.logoutRedirect(logoutRequest);
    },

    handleResponse(response: msal.AuthenticationResult | null) {
      /**
       * To see the full list of response object properties, visit:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
       */
      console.log(response);
      if (response !== null) {
        this.auth = response;
        this.username = response.account.username;
        this.name = response.account.name;
      } else {
        this.selectAccount();
      }
    },
    selectAccount() {
      /**
       * See here for more info on account retrieval:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
       */

      const currentAccounts = myMSALObj.getAllAccounts();
      if (currentAccounts.length === 0) {
        return;
      } else if (currentAccounts.length > 1) {
        // Add choose account code here
        console.warn("Multiple accounts detected.");
      } else if (currentAccounts.length === 1) {
        this.username = currentAccounts[0].username;
      }
    },
  },
});
</script>

<style scoped>
</style>
