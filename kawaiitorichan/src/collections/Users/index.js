"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const authenticated_1 = require("../../access/authenticated");
exports.Users = {
    slug: 'users',
    access: {
        admin: authenticated_1.authenticated,
        create: authenticated_1.authenticated,
        delete: authenticated_1.authenticated,
        read: authenticated_1.authenticated,
        update: authenticated_1.authenticated,
    },
    admin: {
        defaultColumns: ['name', 'email'],
        useAsTitle: 'name',
    },
    auth: true,
    fields: [
        {
            name: 'name',
            type: 'text',
        },
    ],
    timestamps: true,
};
