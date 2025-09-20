"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateAuthors = void 0;
// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
const populateAuthors = async ({ doc, req, req: { payload } }) => {
    if (doc?.authors && doc?.authors?.length > 0) {
        const authorDocs = [];
        for (const author of doc.authors) {
            try {
                const authorDoc = await payload.findByID({
                    id: typeof author === 'object' ? author?.id : author,
                    collection: 'users',
                    depth: 0,
                });
                if (authorDoc) {
                    authorDocs.push(authorDoc);
                }
                if (authorDocs.length > 0) {
                    doc.populatedAuthors = authorDocs.map((authorDoc) => ({
                        id: authorDoc.id,
                        name: authorDoc.name,
                    }));
                }
            }
            catch {
                // swallow error
            }
        }
    }
    return doc;
};
exports.populateAuthors = populateAuthors;
