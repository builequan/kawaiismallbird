"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tags = void 0;
const anyone_1 = require("../access/anyone");
const authenticated_1 = require("../access/authenticated");
const slug_1 = require("@/fields/slug");
exports.Tags = {
    slug: 'tags',
    access: {
        create: authenticated_1.authenticated,
        delete: authenticated_1.authenticated,
        read: anyone_1.anyone,
        update: authenticated_1.authenticated,
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'slug'],
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        ...(0, slug_1.slugField)(),
    ],
};
