var { parse } = require('./html');

function find(node, matcher) {
    if (Array.isArray(node)) {
        let match = null;
        node.some(n => match = find(n, matcher));
        return match;
    } else if (typeof node === 'object') {
        return matcher(node) ? node : find(node.children, matcher);
    }

    return null;
}

function findAll(node, matcher) {
    if (Array.isArray(node)) {
        return node.reduce((set, n) => set.concat(findAll(n, matcher)), []);
    } else if (typeof node === 'object') {
        return (matcher(node) ? [node] : []).concat(findAll(node.children, matcher));
    }

    return [];
}

function hasClassName(node, className) {
    return node
        && node.attributes
        && node.attributes.class
        && new RegExp('\\b' + className + '\\b').test(node.attributes.class);
}

function isId(node, id) {
    return node
        && node.attributes
        && node.attributes.id
        && node.attributes.id === id;
}

function isTagName(node, tagName) {
    return node
        && node.tagName === tagName;
}

function getSelectorMatcher(selector) {
    if (selector.startsWith('.')) {
        return node => hasClassName(node, selector.slice(1));
    }

    if (selector.startsWith('#')) {
        return node => isId(node, selector.slice(1));
    }

    return node => isTagName(node, selector);
}

module.exports = {
    querySelector: function(html, selector) {
        if (typeof html === 'string') {
            html = parse(html, {});
        }
        return find(html, getSelectorMatcher(selector));
    },
    querySelectorAll: function(html, selector) {
        if (typeof html === 'string') {
            html = parse(html, {});
        }
        return findAll(html, getSelectorMatcher(selector));
    }
};
