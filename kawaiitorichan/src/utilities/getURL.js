"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientSideURL = exports.getServerSideURL = void 0;
const canUseDOM_1 = __importDefault(require("./canUseDOM"));
const getServerSideURL = () => {
    let url = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    if (!url) {
        const port = process.env.PORT || '3000';
        url = `http://localhost:${port}`;
    }
    return url;
};
exports.getServerSideURL = getServerSideURL;
const getClientSideURL = () => {
    // Always use NEXT_PUBLIC_SERVER_URL if available for consistency
    if (process.env.NEXT_PUBLIC_SERVER_URL) {
        return process.env.NEXT_PUBLIC_SERVER_URL;
    }
    if (canUseDOM_1.default) {
        const protocol = window.location.protocol;
        const domain = window.location.hostname;
        const port = window.location.port;
        return `${protocol}//${domain}${port ? `:${port}` : ''}`;
    }
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    const port = process.env.PORT || '3000';
    return `http://localhost:${port}`;
};
exports.getClientSideURL = getClientSideURL;
