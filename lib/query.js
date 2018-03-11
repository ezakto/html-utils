var { parse } = require('./html');

function find(node, matcher) {
    if (Array.isArray(node)) {
        let match = null;
        node.some(n => match = find(n, matcher));
        return match;
    } else if (typeof node === 'object') {
        return matcher(node) || find(node.children, matcher);
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
        return node => hasClassName(node, selector.slice(1)) && node;
    }

    if (selector.startsWith('#')) {
        return node => isId(node, selector.slice(1)) && node;
    }

    return node => isTagName(node, selector) && node;
}

module.exports = {
    querySelector: function qs(html, selector) {
        if (!html) {
            return null;
        }

        if (typeof html === 'string') {
            html = parse(html, {});
        }

        if (typeof selector === 'string') {
            selector = selector.split(/\s+/);
        }

        if (selector.length > 1) {
            let part = selector.shift();
            return find(html, node => qs(qs(node, part), selector));
        }

        return find(html, getSelectorMatcher(selector[0]));
    },
    querySelectorAll: function qsa(html, selector) {
        if (!html) {
            return null;
        }

        if (typeof html === 'string') {
            html = parse(html, {});
        }

        if (typeof selector === 'string') {
            selector = selector.split(/\s+/);
        }

        if (selector.length > 1) {
            return qsa(html, selector.shift()).reduce((result, n) => {
                return result.concat(qsa(n, selector))
            }, []);
        }

        return findAll(html, getSelectorMatcher(selector[0]));
    }
};
