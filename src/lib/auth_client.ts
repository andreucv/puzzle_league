import { createAuthClient } from "better-auth/client"
import { jwtClient } from "better-auth/client/plugins"

const authClient =  createAuthClient({
    plugins: [
        jwtClient()
    ]
})

const google_signIn = async () => {
    const data = await authClient.signIn.social({
        provider: "google"
    })
}

export { authClient, google_signIn }
