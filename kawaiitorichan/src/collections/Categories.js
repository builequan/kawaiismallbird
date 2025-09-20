"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Categories = void 0;
const anyone_1 = require("../access/anyone");
const authenticated_1 = require("../access/authenticated");
const slug_1 = require("@/fields/slug");
exports.Categories = {
    slug: 'categories',
    access: {
        create: authenticated_1.authenticated,
        delete: authenticated_1.authenticated,
        read: anyone_1.anyone,
        update: authenticated_1.authenticated,
    },
    admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'parent', 'slug'],
        listSearchableFields: ['title', 'slug'],
        group: 'Content',
    },
    labels: {
        singular: 'Category',
        plural: 'Categories',
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'parent',
            type: 'relationship',
            relationTo: 'categories',
            admin: {
                description: 'Select a parent category to create a hierarchy',
                allowCreate: true, // Allow creating new parent categories inline
            },
            filterOptions: ({ id }) => {
                // Prevent selecting itself as parent
                if (id) {
                    return {
                        id: {
                            not_equals: id,
                        },
                    };
                }
                return true;
            },
        },
        {
            name: 'description',
            type: 'textarea',
            admin: {
                description: 'Optional description for this category',
            },
        },
        {
            name: 'order',
            type: 'number',
            defaultValue: 0,
            admin: {
                description: 'Sort order for displaying categories',
            },
        },
        ...(0, slug_1.slugField)(),
    ],
};
