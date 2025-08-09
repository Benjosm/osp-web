import React, { useEffect } from "react"

type Locale =
  | "ar_SA"
  | "ca_ES"
  | "cs_CZ"
  | "da_DK"
  | "de_DE"
  | "el_GR"
  | "en_GB"
  | "en_US"
  | "es_ES"
  | "es_MX"
  | "fi_FI"
  | "fr_CA"
  | "fr_FR"
  | "hr_HR"
  | "hu_HU"
  | "id_ID"
  | "it_IT"
  | "iw_IL"
  | "ja_JP"
  | "ko_KR"
  | "ms_MY"
  | "nl_NL"
  | "no_NO"
  | "pl_PL"
  | "pt_BR"
  | "pt_PT"
  | "ro_RO"
  | "ru_RU"
  | "sk_SK"
  | "sv_SE"
  | "th_TH"
  | "tr_TR"
  | "uk_UA"
  | "vi_VI"
  | "zh_CN"
  | "zh_HK"
  | "zh_TW"

export interface AppleIDSignInOnSuccess {
  authorization: {
    code: string
    id_token: string
    state: string
  }
  user: {
    email: string
    name: {
      firstName: string
      lastName: string
    }
  }
}

export interface AppleIDSignInOnFailure {
  error: string
}

export interface AppleButtonProps {
  clientId: string
  scope: "email" | "name email"
  redirectURI: string
  state?: string
  nonce?: string
  usePopup?: boolean
  onSuccess?: (data: AppleIDSignInOnSuccess) => any
  onError?: (data: AppleIDSignInOnFailure) => any
  locale?: Locale
  buttonStyle?: {
    mode?: "center-align" | "left-align" | "logo-only"
    type?: "sign-in" | "continue" | "sign-up"
    color?: "black" | "white"
    border?: boolean
    borderRadius?: number
    width?: number | "100%"
    height?: number | "100%"
    logoSize?: "small" | "medium" | "large"
    logoPosition?: number
    labelPosition?: number
  }
}

const SignInWithApple = ({
  clientId,
  scope,
  redirectURI,
  state,
  nonce,
  usePopup,
  onSuccess,
  onError,
  locale = "en_US",
  buttonStyle = {
    mode: "center-align",
    type: "sign-in",
    color: "black",
    border: true,
    borderRadius: 15,
    width: "100%",
    height: 40,
  },
}: AppleButtonProps) => {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = `https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/${locale}/appleid.auth.js`
    script.async = true
    script.onload = () => {
      window.AppleID.auth.init({
        clientId: clientId,
        scope: scope,
        redirectURI: redirectURI,
        state: state,
        nonce: nonce,
        usePopup: usePopup,
      })
      window.AppleID.auth.renderButton()

      document.addEventListener("AppleIDSignInOnSuccess", (event) => {
        // @ts-ignore
        onSuccess(event.detail.data)
      })

      document.addEventListener("AppleIDSignInOnFailure", (event) => {
        // @ts-ignore
        onError(event.detail.error)
      })
    }

    document.body.appendChild(script)
  }, [])

  return (
    <div
      id="appleid-signin"
      style={{
        cursor: "pointer",
      }}
      className="signin-button"
      data-mode={buttonStyle.mode}
      data-type={buttonStyle.type}
      data-color={buttonStyle.color}
      data-border={buttonStyle.border}
      data-border-radius={buttonStyle.borderRadius}
      data-width={buttonStyle.width}
      data-height={buttonStyle.height ?? 40}
      data-logo-size={buttonStyle.logoSize}
      data-logo-position={buttonStyle.logoPosition}
      data-label-position={buttonStyle.labelPosition}
      onClick={async () => {
        try {
          const data = await window.AppleID.auth.signIn()
          onSuccess(data)
        } catch (error) {
          onError(error)
        }
      }}
    >
    </div>
  )
}

export default SignInWithApple
