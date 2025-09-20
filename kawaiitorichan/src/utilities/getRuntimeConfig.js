"use strict";
/**
 * Get runtime configuration values
 * This ensures Docker deployments can override environment variables properly
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPayloadSecret = getPayloadSecret;
exports.getRuntimeServerURL = getRuntimeServerURL;
function getPayloadSecret() {
    const secret = process.env.PAYLOAD_SECRET;
    if (!secret) {
        console.error('PAYLOAD_SECRET is not set!');
        if (process.env.NODE_ENV === 'production') {
            // Use a fallback that will at least let the app start
            // but log a warning
            console.error('WARNING: Using insecure fallback secret - SET PAYLOAD_SECRET!');
            return 'insecure_fallback_secret_replace_immediately';
        }
        return 'dummy_secret_for_build_only_not_for_production';
    }
    return secret;
}
function getRuntimeServerURL() {
    const url = process.env.NEXT_PUBLIC_SERVER_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined ||
            process.env.__NEXT_PRIVATE_ORIGIN ||
            'http://localhost:3000';
    console.log('Server URL configured:', url);
    return url;
}
