"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugins = void 0;
const payload_cloud_1 = require("@payloadcms/payload-cloud");
const plugin_form_builder_1 = require("@payloadcms/plugin-form-builder");
const plugin_nested_docs_1 = require("@payloadcms/plugin-nested-docs");
const plugin_redirects_1 = require("@payloadcms/plugin-redirects");
const plugin_seo_1 = require("@payloadcms/plugin-seo");
const plugin_search_1 = require("@payloadcms/plugin-search");
const revalidateRedirects_1 = require("@/hooks/revalidateRedirects");
const richtext_lexical_1 = require("@payloadcms/richtext-lexical");
const fieldOverrides_1 = require("@/search/fieldOverrides");
const beforeSync_1 = require("@/search/beforeSync");
const getURL_1 = require("@/utilities/getURL");
const generateTitle = ({ doc }) => {
    return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template';
};
const generateURL = ({ doc }) => {
    const url = (0, getURL_1.getServerSideURL)();
    return doc?.slug ? `${url}/${doc.slug}` : url;
};
exports.plugins = [
    (0, plugin_redirects_1.redirectsPlugin)({
        collections: ['pages', 'posts'],
        overrides: {
            // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
            fields: ({ defaultFields }) => {
                return defaultFields.map((field) => {
                    if ('name' in field && field.name === 'from') {
                        return {
                            ...field,
                            admin: {
                                description: 'You will need to rebuild the website when changing this field.',
                            },
                        };
                    }
                    return field;
                });
            },
            hooks: {
                afterChange: [revalidateRedirects_1.revalidateRedirects],
            },
        },
    }),
    (0, plugin_nested_docs_1.nestedDocsPlugin)({
        collections: ['categories'],
        generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
    }),
    (0, plugin_seo_1.seoPlugin)({
        generateTitle,
        generateURL,
    }),
    (0, plugin_form_builder_1.formBuilderPlugin)({
        fields: {
            payment: false,
        },
        formOverrides: {
            fields: ({ defaultFields }) => {
                return defaultFields.map((field) => {
                    if ('name' in field && field.name === 'confirmationMessage') {
                        return {
                            ...field,
                            editor: (0, richtext_lexical_1.lexicalEditor)({
                                features: ({ rootFeatures }) => {
                                    return [
                                        ...rootFeatures,
                                        (0, richtext_lexical_1.FixedToolbarFeature)(),
                                        (0, richtext_lexical_1.HeadingFeature)({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                                    ];
                                },
                            }),
                        };
                    }
                    return field;
                });
            },
        },
    }),
    (0, plugin_search_1.searchPlugin)({
        collections: ['posts'],
        beforeSync: beforeSync_1.beforeSyncWithSearch,
        searchOverrides: {
            fields: ({ defaultFields }) => {
                return [...defaultFields, ...fieldOverrides_1.searchFields];
            },
        },
    }),
    (0, payload_cloud_1.payloadCloudPlugin)(),
];
