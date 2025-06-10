import { createAuthClient } from "better-auth/client"
const authClient =  createAuthClient()

const google_signIn = async () => {
    const data = await authClient.signIn.social({
        provider: "google"
    })
}

export { authClient, google_signIn }
