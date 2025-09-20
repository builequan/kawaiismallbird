"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.link = exports.appearanceOptions = void 0;
const deepMerge_1 = __importDefault(require("@/utilities/deepMerge"));
exports.appearanceOptions = {
    default: {
        label: 'Default',
        value: 'default',
    },
    outline: {
        label: 'Outline',
        value: 'outline',
    },
};
const link = ({ appearances, disableLabel = false, overrides = {} } = {}) => {
    const linkResult = {
        name: 'link',
        type: 'group',
        admin: {
            hideGutter: true,
        },
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        name: 'type',
                        type: 'radio',
                        admin: {
                            layout: 'horizontal',
                            width: '50%',
                        },
                        defaultValue: 'reference',
                        options: [
                            {
                                label: 'Internal link',
                                value: 'reference',
                            },
                            {
                                label: 'Custom URL',
                                value: 'custom',
                            },
                        ],
                    },
                    {
                        name: 'newTab',
                        type: 'checkbox',
                        admin: {
                            style: {
                                alignSelf: 'flex-end',
                            },
                            width: '50%',
                        },
                        label: 'Open in new tab',
                    },
                ],
            },
        ],
    };
    const linkTypes = [
        {
            name: 'reference',
            type: 'relationship',
            admin: {
                condition: (_, siblingData) => siblingData?.type === 'reference',
            },
            label: 'Document to link to',
            relationTo: ['pages', 'posts'],
            required: true,
        },
        {
            name: 'url',
            type: 'text',
            admin: {
                condition: (_, siblingData) => siblingData?.type === 'custom',
            },
            label: 'Custom URL',
            required: true,
        },
    ];
    if (!disableLabel) {
        linkTypes.map((linkType) => ({
            ...linkType,
            admin: {
                ...linkType.admin,
                width: '50%',
            },
        }));
        linkResult.fields.push({
            type: 'row',
            fields: [
                ...linkTypes,
                {
                    name: 'label',
                    type: 'text',
                    admin: {
                        width: '50%',
                    },
                    label: 'Label',
                    required: true,
                },
            ],
        });
    }
    else {
        linkResult.fields = [...linkResult.fields, ...linkTypes];
    }
    if (appearances !== false) {
        let appearanceOptionsToUse = [exports.appearanceOptions.default, exports.appearanceOptions.outline];
        if (appearances) {
            appearanceOptionsToUse = appearances.map((appearance) => exports.appearanceOptions[appearance]);
        }
        linkResult.fields.push({
            name: 'appearance',
            type: 'select',
            admin: {
                description: 'Choose how the link should be rendered.',
            },
            defaultValue: 'default',
            options: appearanceOptionsToUse,
        });
    }
    return (0, deepMerge_1.default)(linkResult, overrides);
};
exports.link = link;
