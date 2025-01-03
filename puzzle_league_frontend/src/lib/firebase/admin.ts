import admin, { type ServiceAccount } from "firebase-admin";
import { firebase_admin_config } from "../../../.env.firebase_admin_config";

export function getFirebaseAdmin() {
    if (!admin.apps.length) {
        const serviceAccount = firebase_admin_config as ServiceAccount;
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }
    return admin;
}