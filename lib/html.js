const trimre = /^\s+|\s+$/g;
const ltrimre = /^\s+/;
const collapsere = /\s+/g;
const pre_tags = ['pre', 'textarea', 'style', 'script'];
const block_tags = ['address', 'article', 'aside', 'audio', 'blockquote', 'canvas',
    'dd', 'div', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'li', 'main', 'nav', 'noscript',
    'ol', 'output', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video'];
const void_tags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr'];

function Node(string, isVoid) {
    if (string.match(/^--/)) {
        this.comment = '<' + string + '>';
        return;
    }

    var match = string.match(/\s|$/);

    this.tagName = string.substring(0, match.index);

    if (isVoid || void_tags.indexOf(this.tagName) > -1) {
        this.void = true;
    } else {
        this.children = [];
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

function indent(level, spaceOrSize) {
    var indent = '';
    var space = typeof spaceOrSize === 'string' ? spaceOrSize : ' ';
    var size = typeof spaceOrSize === 'string' ? 1 : spaceOrSize;

    for (let i = 0, j = level * size; i < j; i++) {
        indent += space;
    }

    return indent;
}

function trim(string) {
    return string.replace(trimre, '');
}

function trimLeft(string) {
    return string.replace(ltrimre, '');
}

function collapse(string) {
    return string.replace(collapsere, ' ');
}

function stringify(node, options, level = 0, parent = null) {
    // For arrays, parse each one of its elements and concatenate the results
    if (Array.isArray(node)) {
        return node
            .map(node => stringify(node, options, level, parent))
            .filter(node => node)
            .join('');
    }

    // For strings, process the content depending on the parent node
    if (typeof node === 'string') {
        if (parent) {
            // For preformatted tags, just return the string as is
            if (pre_tags.indexOf(parent.tagName) > -1) {
                return node;
            }

            // For block parents, indent
            if (block_tags.indexOf(parent.tagName) > -1) {
                return '\n' + indent(level, options.space) + trimLeft(collapse(node));
            }
        }

        // Otherwise collapse whitespace
        return collapse(node);
    }

    // For nodes, add tags and traverse children
    if (typeof node === 'object' && node.tagName) {
        let html = '';
        let block = block_tags.indexOf(node.tagName) > -1;
        let pre = pre_tags.indexOf(node.tagName) > -1;

        if (block || block_tags.indexOf(parent && parent.tagName) > -1) {
            html += '\n' + indent(level, options.space);
        }

        html += '<' + node.tagName;

        if (node.attributes) {
            for (let attr in node.attributes) {
                html += ' ' + attr;

                if (node.attributes[attr] !== true) {
                    html +=  '="' + ('' + node.attributes[attr]).replace(/"/g, '\\"') + '"';
                }
            }
        }

        if (node.selfClosing || node.void) {
            html += options.xhtml || options.xml ? ' />' : '>';
        } else {
            html += '>';

            if (node.children) {
                if (block && !pre) {
                    html += '\n' + indent(level + 1, options.space);
                }

                let content = stringify(node.children, options, block ? level + 1 : 0, node);
                html += pre ? content : trim(content);

                if (block && !pre) {
                    html += '\n' + indent(level, options.space);
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
    var stack = [];
    var buffer = '';

    var IN_TAG = false;
    var IN_VOID = false;
    var CLOSING_TAG = false;

    // Char per char
    for (let i = 0; i < length; i++) {
        let char = string[i];
        let last = string[i-1];

        switch (char) {
            case '<':
                if (IN_TAG) {
                    break;
                }

                IN_TAG = true;

                // If there was some text before, add it to the ast
                if (trim(buffer)) {
                    node.children.push(buffer);
                }

                buffer = '';

                continue;

            case '!':
            case '?':
                if (IN_TAG && last === '<') {
                    IN_VOID = true;
                    continue;
                }

                break;

            case '/':
                if (IN_TAG && last === '<') {
                    CLOSING_TAG = true;
                    continue;
                }

                break;

            case '>':
                if (!IN_TAG) {
                    break;
                }

                if (IN_VOID || last === '/') {
                    node.children.push(new Node(buffer, true));
                    IN_VOID = false;
                } else if (CLOSING_TAG) {
                    node = stack.pop();
                    CLOSING_TAG = false;
                } else {
                    let newNode = new Node(buffer);

                    if (newNode.void) {
                        node.children.push(newNode);
                    } else {
                        stack.push(node);
                        node = newNode;
                        stack[stack.length - 1].children.push(node);
                    }
                }

                IN_TAG = false;
                buffer = '';

                continue;
        }

        buffer += char;
    }

    return ast.children;
}

var HTML = {
    stringify: function(ast, options, space = 2) {
        var opts = options || {};
        opts.space = space;
        return trim(stringify(ast, opts));
    },
    parse: function(string) {
        return parse(string);
    }
}

module.exports = HTML;
