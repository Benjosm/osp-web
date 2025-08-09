import { AppleIDSignInOnSuccess } from "."
declare global {
  interface Window {
    AppleID: {
      auth: {
        init: ({}: {
          clientId: string
          scope: string
          redirectURI: string
          state?: string
          nonce?: string
          usePopup?: boolean
        }) => void
        renderButton: () => void
        signIn: () => Promise<AppleIDSignInOnSuccess>
      }
    }
  }
}
