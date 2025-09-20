"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticated = void 0;
const authenticated = ({ req: { user } }) => {
    return Boolean(user);
};
exports.authenticated = authenticated;
