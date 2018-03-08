# html-utils
Tools for parsing, traversing, building, etc, html strings

## Usage

### HTML.parse(string html, object options);

Read and parse an HTML/XML document and return a light AST.

```js
var HTML = require('html-utils');
var doc = '<html><head><title>Hello</title><body><h1 class="heading">World</h1></body>';

console.log(HTML.parse(doc));
->
[
  {
    tagName: 'html',
    children: [
      {
        tagName: 'head',
        children: [
          {
            tagName: 'title',
            children: [
              'Hello'
            ]
          },
          {
            tagName: 'body',
            children: [
              {
                tagName: 'h1',
                attributes: {
                  class: "heading"
                },
                children: [
                  'World'
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]
```

#### Options

**xml** (bool) make sure to require all closing tags. Defaults to `false`

### HTML.stringify(object ast, object options, number space = 2)

Pretty print indented (with `space` spaces) HTML.

With the previous example ast:

```
console.log(HTML.stringify(ast));
->
<html>
  <head>
    <title>
      Hello
    </title>
    <body>
      <h1 class="heading">
        World
      </h1>
    </body>
  </head>
</html>
```

#### Options

**xml** (bool) print void tags with a close slash (ie `<img />`). Defaults to `false`
**xhtml** alias of `xml`
