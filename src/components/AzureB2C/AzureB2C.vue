<template>
  <article>
    <h1>Azure B2C</h1>
    <p>Experimenting with a Azure B2C, you can sign-up for an account and sign-in with it, nothing else happens.</p>
    <div>
      <button v-if="!account" @click="signIn()" type="button">Sign-in</button>
      <button v-if="account" @click="signOut()" type="button">Sign-out</button>
      <button v-if="account" @click="editProfile()" type="button">
        Edit Profile
      </button>
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
import { router } from "../../router";

const b2cConfig = {
  authorityDomain: "areve2.b2clogin.com",
  policies: {
    signUpSignIn: {
      name: "B2C_1_SignUpOrSignInWithPassword_V3",
      authority:
        "https://areve2.b2clogin.com/areve2.onmicrosoft.com/B2C_1_SignUpOrSignInWithPassword_V3",
    },
    editProfile: {
      name: "B2C_1_UserProfileUpdate_V3",
      authority:
        "https://areve2.b2clogin.com/areve2.onmicrosoft.com/B2C_1_UserProfileUpdate_V3",
    },
    passwordReset: {
      name: "B2C_1_PasswordReset_V3",
      authority:
        "https://areve2.b2clogin.com/areve2.onmicrosoft.com/B2C_1_PasswordReset_V3",
    },
  },
};

const msalConfig: msal.Configuration = {
  auth: {
    clientId: "29d068df-2e97-4542-bced-5a708c722f0a",
    authority: b2cConfig.policies.signUpSignIn.authority,
    knownAuthorities: [b2cConfig.authorityDomain],
    redirectUri: document.location.origin,
    postLogoutRedirectUri: document.location.href,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level: any, message: any, containsPii: any) => {
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
    const setAccount = (account: msal.AccountInfo) => {
      this.account = account;
    };

    const selectAccount = () => {
      /**
       * See here for more information on account retrieval:
       * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
       */

      const currentAccounts = this.clientApplication.getAllAccounts();

      if (currentAccounts.length < 1) {
        return;
      } else if (currentAccounts.length > 1) {
        /**
         * Due to the way MSAL caches account objects, the auth response from initiating a user-flow
         * is cached as a new account, which results in more than one account in the cache. Here we make
         * sure we are selecting the account with homeAccountId that contains the sign-up/sign-in user-flow,
         * as this is the default flow the user initially signed-in with.
         */
        const accounts = currentAccounts.filter(
          (account: msal.AccountInfo) =>
            account.homeAccountId
              .toUpperCase()
              .includes(b2cConfig.policies.signUpSignIn.name.toUpperCase()) &&
            (account.idTokenClaims as any).iss
              .toUpperCase()
              .includes(b2cConfig.authorityDomain.toUpperCase()) &&
            (account.idTokenClaims as any).aud === msalConfig.auth.clientId
        );

        if (accounts.length > 1) {
          // localAccountId identifies the entity for which the token asserts information.
          if (
            accounts.every(
              (account: msal.AccountInfo) =>
                account.localAccountId === accounts[0].localAccountId
            )
          ) {
            // All accounts belong to the same user
            setAccount(accounts[0]);
          } else {
            // Multiple users detected. Logout all to be safe.
            this.signOut();
          }
        } else if (accounts.length === 1) {
          setAccount(accounts[0]);
        }
      } else if (currentAccounts.length === 1) {
        setAccount(currentAccounts[0]);
      }
    };

    // in case of page refresh
    selectAccount();

    const handleResponse = async (
      response: msal.AuthenticationResult | null
    ) => {
      if (response !== null) {
        setAccount(response.account!);
      } else {
        selectAccount();
      }
    };

    this.clientApplication
      .handleRedirectPromise()
      .then(handleResponse)
      .catch((error: any) => {
        if (error.errorMessage.indexOf("AADB2C90091:") === 0) {
          console.debug(error.errorMessage);
          router.push({ path: "/azure-b2c", force: true });
          return;
        }
        if (error.errorMessage.indexOf("AADB2C90118:") === 0) {
          console.debug(error.errorMessage);
          this.passwordReset();
          return;
        }

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
        scopes: ["openid", "https://areve2.onmicrosoft.com/helloapi/demo.read"],
      });
    },
    signOut() {
      this.clientApplication.logoutRedirect({
        account: this.clientApplication.getAccountByUsername(this.username),
        postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
      });
    },
    editProfile() {
      const editProfileRequest: msal.RedirectRequest = {
        authority: b2cConfig.policies.editProfile.authority,
        scopes: [],
        // loginHint: this.account?.username,
        redirectStartPage: msalConfig.auth.postLogoutRedirectUri!,
      };
      this.clientApplication.loginRedirect(editProfileRequest);
    },
    passwordReset() {
      const editProfileRequest: msal.RedirectRequest = {
        authority: b2cConfig.policies.passwordReset.authority,
        scopes: [],

        redirectStartPage: msalConfig.auth.postLogoutRedirectUri!,
      };
      this.clientApplication.loginRedirect(editProfileRequest);
    },
  },
});
</script>

<style scoped>
</style>
