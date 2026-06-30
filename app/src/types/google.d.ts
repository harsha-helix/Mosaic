// Minimal type declarations for Google Identity Services
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string
        error?: string
        error_description?: string
        error_uri?: string
      }
      interface TokenClient {
        requestAccessToken(options?: { prompt?: string }): void
        callback: (response: TokenResponse) => void
      }
      interface TokenClientConfig {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
      }
      function initTokenClient(config: TokenClientConfig): TokenClient
    }
  }
}
