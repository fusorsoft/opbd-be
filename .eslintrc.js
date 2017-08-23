module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "jasmine": true,
    },
    plugins: [  ],
    "extends": "standard",
    globals: {
        CKEDITOR: true,
        // To get to the wiris editor, one uses com.wiris.JsEditor.
        com: true,
    },
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        'comma-dangle': [ 'error', {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            functions: 'ignore',
        }],
        indent: ['error', 2],
        'max-len': [1, 80, { ignoreUrls: true, ignoreStrings: true }],
        'one-var': 1,
        'standard/computed-property-even-spacing': 1,
        'no-useless-escape': 1,
        'new-cap': [2, {
            capIsNewExceptions: [
                'CKEDITOR',
            ],
            capIsNewExceptionPattern: '^CKEDITOR\.|CKEDITOR\.dom\.|jQuery\.Event|angular\.element\.Event',
            newIsCapExceptionPattern: '^CKEDITOR\.|CKEDITOR\.dom\.|jQuery\.Event',
        }],
        'no-throw-literal': 1,
    },
};
