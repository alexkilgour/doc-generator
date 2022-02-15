const fs = require('fs').promises;
const fetch = require('node-fetch');
const Prism = require('prismjs');
const loadLanguages = require('prismjs/components/');
const marked = require('marked');
const toc = require('markdown-toc');

// Load additional languages to the default
loadLanguages(['scss', 'bash', 'shell']);

// Marked config
marked.setOptions({
	langPrefix: 'language-',
	gfm: true,
	//baseUrl: 'http://' // can we use this to stop broken relative images/links?
	headerIds: true,
	headerPrefix: '',
	// highlight code blocks
	highlight: function (code, lang) {
		if (Prism.languages && Prism.languages[lang]) {
			return Prism.highlight(code, Prism.languages[lang], lang);
		}
		// style as plaintext if language not found
		return Prism.highlight(code, Prism.languages.plaintext, 'plaintext');
	}
});

// If code blocks don't specify a language, set to plaintext
// avoids unstyled code blocks
function defaultLanguage (token) {
	if (token.type === 'code' && token.lang === '') {
		token.lang = 'plaintext';
	}
}

(async () => {
	try {
		const response = await fetch('https://unpkg.com/@springernature/nature-hero@2.1.2/README.md');
		const body = await response.text();

		// Convert markdown to tokens array
		const tokens = marked.lexer(body);
		// Process tokens
		tokens.forEach(token => defaultLanguage(token));
		// The first h2 marks the end of the header section and beginning of the readme
		const StartOfReadme = tokens.findIndex(t => t.type === 'heading' && t.depth === 2);
		// Header section
		let header;

		// Split the README to create header section
		if (StartOfReadme !== -1) {
			header = tokens.splice(0, StartOfReadme);
		} else {
			// Can we handle readme that doesn't conform?
			// Maybe we generate a title, then put the demo, then all the readme
		}

		// Create toc Markdown
		const tocMarkdown = toc(body, {firsth1: false}).content;

		// Generate HTML from tokens
		const htmlHeader = marked.parser(header);
		const htmlReadme = marked.parser(tokens);
		const htmlToc = marked.parse(tocMarkdown);

		// Write the result to a file
		await fs.writeFile('index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Example</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/themes/prism-okaidia.min.css" integrity="sha512-mIs9kKbaw6JZFfSuo+MovjU+Ntggfoj8RwAmJbVXQ5mkAX5LlgETQEweFPI18humSPHymTb5iikEOKWF7I8ncQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <!-- copy to clipboard styling -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/plugins/toolbar/prism-toolbar.min.css" integrity="sha512-Dqf5696xtofgH089BgZJo2lSWTvev4GFo+gA2o4GullFY65rzQVQLQVlzLvYwTo0Bb2Gpb6IqwxYWtoMonfdhQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>
<body>
  ${htmlHeader}
  <hr>
  <section>
	<h2>Table of Contents</h2>
  	${htmlToc}
  </section>
  <hr>
  <em>Demo goes in here</em>
  <hr>
  ${htmlReadme}
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/components/prism-core.min.js" integrity="sha512-NC2WFBzw/SdbWrzG0C+sg3iv1OITcQKsUitDcYKfOp9vxe92zpNlRc5Ad3q81kAp8Ff/fDV8pZQxdCCeyFdgLw==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <!-- automatically loads languages when necessary, use if via CDN -->
  <!-- https://prismjs.com/#basic-usage-cdn -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/plugins/autoloader/prism-autoloader.min.js" integrity="sha512-GP4x8UWxWyh4BMbyJGOGneiTbkrWEF5izsVJByzVLodP8CuJH/n936+yQDMJJrOPUHLgyPbLiGw2rXmdvGdXHA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <!-- copy to clipboard -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/plugins/toolbar/prism-toolbar.min.js" integrity="sha512-YrvgEHAi5/3o2OT+/vh1z19oJXk/Kk0qdVKbjEFl9VRmcLTaWRYzVziZCvoGpJ2TrnV7rB8pnJcz1ioVJjgw2A==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.26.0/plugins/copy-to-clipboard/prism-copy-to-clipboard.min.js" integrity="sha512-pUNGXbOrc+Y3dm5z2ZN7JYQ/2Tq0jppMDOUsN4sQHVJ9AUQpaeERCUfYYBAnaRB9r8d4gtPKMWICNhm3tRr4Fg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</body>
</html>`);
	} catch (err) {
		console.error(err)
	}
})();

