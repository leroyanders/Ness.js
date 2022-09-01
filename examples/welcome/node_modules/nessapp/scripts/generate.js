#! /usr/bin/env node
process.env.NODE_ENV = 'development';

var argv = process.argv.slice(2);
var path = require('path');
var fs = require('fs');

/**
     * Capitalizes first letters of words in string.
     * @param {string} str String to be modified
     * @param {boolean=false} lower Whether all other letters should be lowercased
     * @return {string}
     * @usage
     *   capitalize('fix this string');     // -> 'Fix This String'
     *   capitalize('javaSCrIPT');          // -> 'JavaSCrIPT'
     *   capitalize('javaSCrIPT', true);    // -> 'Javascript'
*/
const capitalize = (str, lower = false) => (lower ? str.toLowerCase() : str).replace(/(?:^|\s|["'([{])+\S/g, match => match.toUpperCase());
const page = (name) => `import React from 'react';
import { Page, Layout, Head } from 'nessapp/next/ui';

class ${capitalize(name)} extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Page>
                {/* PageMeta */}
                <Head>
                    <title>Welcome to NessApp</title>
                    <meta name="description" content="Thanks for installing this application!"></meta>
                </Head>
                {/* end PageMeta */}
                {/* PageBody */}
                <Layout>
                    <h1>${capitalize(name)} Page</h1>
                </Layout>
            </Page>
        );
    }
}

export default ${capitalize(name)}`;

const component = (name) => `import React from 'react';
                
class ${capitalize(name)} extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <h1>${capitalize(name)} Component</h1>
        );
    }
}

export default ${capitalize(name)}`;

const hook = (name) => `import React, {useState, useEffect} from 'react';

const use${capitalize(name)} = (initial) => {
    const [value, setValue] = useState(initial);

    useEffect(() => {
        setValue(initial);
    }, [initial]);
};

export default ${capitalize(name)}`;

const service = (name) => `const ${capitalize(name)}Service = {
    set: function(){
        console.log('set');
    },
    get: function(arg){
        console.log('get');
    }
}

export default ${capitalize(name)}Service`;

function main() {
    const [type, path_] = argv;
    const filename = (path.parse(path_).base).replace('.js', '');
    const filename_write = path_.replace(/\.[^/.]+$/, '') + '.js';

    switch (type) {
        case 'page':
            var output = page(filename);
        break;
        case 'hook':
            var output = hook(filename);
        break;
        case 'component':
            var output = component(filename);
        break;
        case 'service':
            var output = service(filename);
        break;
    }

    function ensureDirectoryExistence(filePath) {
        var dirname = path.dirname(filePath);

        if (fs.existsSync(dirname)) {
          return true;
        }

        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }

    ensureDirectoryExistence(path.join('./', 'src', filename_write));
    fs.writeFile(path.join('./', 'src', filename_write), output, function (err) {
        if (err) throw err;
        console.log(`[NessApp] Info: ${filename_write} of type ${type} is created successfully.`);
    });
}

main();