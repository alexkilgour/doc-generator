const fs = require('fs').promises;
const fetch = require('node-fetch');
const hljs = require('highlight.js');
const marked = require('marked');

function filterTokens(tokens) {
	const header = [];
	const readme = [];
	for (const [index, token] of tokens.entries()) {
		if (index === 0 && token.type === 'heading' && token.depth === 1) {
			// Create a header section
			// Can do more here once we have a readme template
			header.push(token);
		} else {
			// Fix issue with code blocks without a language
			if (token.type === 'code' && token.lang === '') {
				token.lang = 'plaintext';
			}
			// Push non-header content to the readme section
			readme.push(token);
		}
	}
	return readme;
}

(async () => {
	try {
		const response = await fetch('https://unpkg.com/@springernature/nature-hero@2.1.2/README.md');
		const body = await response.text();
		const lexer = new marked.Lexer({});
		const tokens = lexer.lex(body);
		const filtered = filterTokens(tokens);
		const html = marked.parser(filtered, {
			highlight: function (code, _lang) {
				const language = hljs.getLanguage(_lang) ? _lang : 'plaintext';
				return hljs.highlight(code, {language}).value;
			},
			langPrefix: 'hljs language-',
			gfm: true
		});

		await fs.writeFile('index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Example</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/styles/atom-one-dark.min.css">
</head>
<body>
  ${html}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.4.0/highlight.min.js"></script>
</body>
</html>`);
	} catch (err) {
		console.error(err)
	}
})();

