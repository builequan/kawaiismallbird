"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// storage-adapter-import-placeholder
const getDatabase_1 = require("./db/getDatabase");
const sharp_1 = __importDefault(require("sharp")); // sharp-import
const path_1 = __importDefault(require("path"));
const payload_1 = require("payload");
const url_1 = require("url");
const Categories_1 = require("./collections/Categories");
const Media_1 = require("./collections/Media");
const Pages_1 = require("./collections/Pages");
const Posts_1 = require("./collections/Posts");
const Tags_1 = require("./collections/Tags");
const Users_1 = require("./collections/Users");
const AffiliateProducts_1 = require("./collections/AffiliateProducts");
const config_1 = require("./Footer/config");
const config_2 = require("./Header/config");
const InternalLinksSettings_1 = require("./globals/InternalLinksSettings");
const plugins_1 = require("./plugins");
const defaultLexical_1 = require("@/fields/defaultLexical");
const getURL_1 = require("./utilities/getURL");
const getRuntimeConfig_1 = require("./utilities/getRuntimeConfig");
const filename = (0, url_1.fileURLToPath)(import.meta.url);
const dirname = path_1.default.dirname(filename);
exports.default = (0, payload_1.buildConfig)({
    admin: {
        components: {
            // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
            // Feel free to delete this at any time. Simply remove the line below.
            beforeLogin: ['@/components/BeforeLogin'],
            // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
            // Feel free to delete this at any time. Simply remove the line below.
            beforeDashboard: ['@/components/BeforeDashboard'],
            views: {
                InternalLinks: {
                    Component: '@/views/InternalLinks',
                    path: '/internal-links',
                },
                AffiliateLinks: {
                    Component: '@/views/AffiliateLinks',
                    path: '/affiliate-links',
                },
                ContentImport: {
                    Component: '@/views/ContentImport',
                    path: '/content-import',
                },
            },
        },
        importMap: {
            baseDir: path_1.default.resolve(dirname),
        },
        user: Users_1.Users.slug,
        livePreview: {
            breakpoints: [
                {
                    label: 'Mobile',
                    name: 'mobile',
                    width: 375,
                    height: 667,
                },
                {
                    label: 'Tablet',
                    name: 'tablet',
                    width: 768,
                    height: 1024,
                },
                {
                    label: 'Desktop',
                    name: 'desktop',
                    width: 1440,
                    height: 900,
                },
            ],
        },
    },
    // This config helps us configure global or default features that the other editors can inherit
    editor: defaultLexical_1.defaultLexical,
    db: (0, getDatabase_1.getDatabaseAdapter)(),
    collections: [Pages_1.Pages, Posts_1.Posts, Media_1.Media, Categories_1.Categories, Tags_1.Tags, Users_1.Users, AffiliateProducts_1.AffiliateProducts],
    cors: [(0, getURL_1.getServerSideURL)()].filter(Boolean),
    globals: [config_2.Header, config_1.Footer, InternalLinksSettings_1.InternalLinksSettings],
    plugins: [
        ...plugins_1.plugins,
        // storage-adapter-placeholder
    ],
    secret: (0, getRuntimeConfig_1.getPayloadSecret)(),
    sharp: sharp_1.default,
    typescript: {
        outputFile: path_1.default.resolve(dirname, 'payload-types.ts'),
    },
    jobs: {
        access: {
            run: ({ req }) => {
                // Allow logged in users to execute this endpoint (default)
                if (req.user)
                    return true;
                // If there is no logged in user, then check
                // for the Vercel Cron secret to be present as an
                // Authorization header:
                const authHeader = req.headers.get('authorization');
                return authHeader === `Bearer ${process.env.CRON_SECRET}`;
            },
        },
        tasks: [],
    },
});
