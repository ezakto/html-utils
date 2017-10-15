const trimre = /^\s+|\s+$/g;
const collapsere = /\s+/g;
const pre_tags = ['pre', 'textarea', 'style', 'script'];
const block_tags = ['address', 'article', 'aside', 'audio', 'blockquote', 'canvas',
    'dd', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'main', 'nav', 'noscript',
    'ol', 'output', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video'];
const void_tags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr'];

function Node(string, parent) {
    var match = string.match(/\s|$/);

    this.tagName = string.substring(0, match.index);
    this.parentNode = parent;
    this.children = [];

    if (void_tags.indexOf(this.tagName) > -1) {
        this.void = true;
    }

    if (match.index < string.length) {
        let attributes = parseAttributes(string.substring(match.index + 1));

        if (Object.keys(attributes).length) {
            this.attributes = attributes;
        }
    }
}

function parseAttributes(string) {
    var attributes = {};
    var values = [];

    string
        .replace(/(["'])(.*?)\1/g, (cap, quo, val) => values.push(val) - 1)
        .split(/\s+/)
        .forEach(attr => {
            var pair = attr.split('=');

            if (pair[0]) {
                attributes[pair[0]] = values[pair[1]] || true;
            }
        });

    return attributes;
}

function indent(size) {
    var indent = '';

    for (let i = 0; i < size; i++) {
        indent += '  ';
    }
    
    return indent;
}

function trim(string) {
    return string.replace(trimre, '');
}

function collapse(string) {
    return string.replace(collapsere, ' ');
}

function stringify(node, options, indentation = 0, parent = null) {
    // For arrays, parse each one of its elements and concatenate the results
    if (Array.isArray(node)) {
        return node
            .map(node => stringify(node, options, indentation, parent))
            .filter(node => node)
            .join('');
    }

    // For strings, process the content depending on the parent node
    if (typeof node === 'string') {
        // For preformatted tags, just return the string as is
        if (parent && pre_tags.indexOf(parent.tagName) > -1) {
            return node;
        }

        // Otherwise collapse whitespace
        return collapse(node);
    }

    // For nodes, add tags and traverse children
    if (typeof node === 'object' && node.tagName) {
        let html = '';
        let block = block_tags.indexOf(node.tagName) > -1;
        let pre = pre_tags.indexOf(node.tagName) > -1;

        if (block) {
            html += '\n' + indent(indentation);
        }

        html += '<' + node.tagName;

        if (node.attributes) {
            for (let attr in node.attributes) {
                html += ' ' + attr + '="';
                console.log(attr, node.attributes)
                html += node.attributes[attr].replace(/"/g, '\\"') + '"';
            }
        }

        if (node.selfClosing || node.void) {
            html += options.xhtml || options.xml ? ' />' : '>';
        } else {
            html += '>';

            if (node.children) {
                if (block && !pre) {
                    html += '\n' + indent(indentation + 1);
                }

                let content = stringify(node.children, options, indentation + 1, node);
                html += pre ? content : trim(content);

                if (block && !pre) {
                    html += '\n' + indent(indentation);
                }
            }

            html += '</' + node.tagName + '>';
        }

        return html;
    }

    // Return empty for unknown values
    return '';
}

function parse(string) {
    var length = string.length;
    var ast = { children: [] };
    var node = ast;
    var buffer = '';

    var IN_TAG = false;
    var IN_COMMENT = false;
    var OPENING_TAG = false;
    var SELF_CLOSING = false;

    // Char per char
    for (let i = 0; i < length; i++) {
        let char = string[i];

        if (IN_COMMENT) {
            if (char !== '>') {
                buffer += char;
                continue;
            } else {
                // Do something with the comment
                buffer = '';
                IN_COMMENT = false;
                continue;
            }
        }

        // Tag start (either opening tag or closing tag)
        if (char === '<') {
            IN_TAG = true;
            OPENING_TAG = true; // Assume opening tag by default
            buffer = trim(buffer);

            // If there was some text before, add it to the ast
            if (buffer) {
                node.children.push(buffer);
                buffer = '';
            }

            continue;
        }

        // Comments and doctype
        if (char === '!' && IN_TAG) {
            if (string[i-1] === '<') {
                IN_COMMENT = true;
                continue;
            }
        }

        // (Self-)Closing tag
        if (char === '/' && IN_TAG) {
            if (string[i-1] === '<') {
                OPENING_TAG = false;
                continue;
            } else if (string[i+1] === '>') {
                SELF_CLOSING = true;
                continue;
            }
        }

        // Tag end
        if (char === '>' && IN_TAG) {
            if (OPENING_TAG) {
                IN_TAG = false;
                node = new Node(buffer, node);
                buffer = '';

                if (node.void) {
                    SELF_CLOSING = true;
                }
                
                if (SELF_CLOSING) {
                    delete node.children;
                } 
            }

            if (!OPENING_TAG || SELF_CLOSING) {
                if (SELF_CLOSING || node.tagName === buffer) {
                    let parentNode = node.parentNode;
                    delete node.parentNode;

                    if (SELF_CLOSING) {
                        node.void = true;
                    }

                    parentNode.children.push(node);

                    node = parentNode;
                } else {
                    console.log('unexpected tag', buffer);
                }

                IN_TAG = false;
                SELF_CLOSING = false;
                buffer = '';
            }
            
            continue;
        }

        buffer += char;
    }

    return ast.children;
}

var HTML = {
    stringify: function(ast, options = {}) {
        return trim(stringify(ast, options));
    },
    parse: function(string) {
        return parse(string);
    }
}

module.exports = HTML;