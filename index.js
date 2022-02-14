const fs = require('fs').promises;
const fetch = require('node-fetch');
const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const marked = require('marked');

loadLanguages(['scss', 'bash', 'shell']);

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
			highlight: function (code, lang) {
				if (Prism.languages && Prism.languages[lang]) {
					return Prism.highlight(code, Prism.languages[lang], lang);
				}
				return Prism.highlight(code, Prism.languages.plaintext, 'plaintext');
			},
			langPrefix: 'language-',
			gfm: true
		});

		await fs.writeFile('index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Example</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/themes/prism-okaidia.min.css">
</head>
<body>
  ${html}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/plugins/autoloader/prism-autoloader.min.js" integrity="sha512-GP4x8UWxWyh4BMbyJGOGneiTbkrWEF5izsVJByzVLodP8CuJH/n936+yQDMJJrOPUHLgyPbLiGw2rXmdvGdXHA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</body>
</html>`);
	} catch (err) {
		console.error(err)
	}
})();

