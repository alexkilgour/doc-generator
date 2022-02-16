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

// Process code blocks for
// 1. default language
// 2. mermaid charting
function processCodeBlock (token) {
	// If code blocks don't specify a language, set to plaintext
	// avoids unstyled code blocks
	if (token.type === 'code' && token.lang === '') {
		token.lang = 'plaintext';
	}

	// Mermaid charts
	// Don't display the code, convert to html to render
	if (token.type === 'code' && token.lang === 'mermaid') {
		token.type = 'html';
		token.raw = token.raw.replace('```mermaid', '<div class="mermaid">').replace('```', '</div>');
		token.pre = false;
		token.text = token.raw;
	}
}

// Example render of a mermaid graph
// Add to the existing markdown data
async function createMermaid (tokens) {
	const md = await fs.readFile('./mermaid.md', 'utf8');
	const mermaidTokens = marked.lexer(md);
	return [...tokens, ...mermaidTokens];
}

// Split the readme at the first h2
// Return a header section and the rest of the readme
function createSections (tokens) {
	const sections = {};

	// The first h2 marks the end of the header section and beginning of the readme
	const StartOfReadme = tokens.findIndex(t => t.type === 'heading' && t.depth === 2);

	// Split the README to create header section
	if (StartOfReadme !== -1) {
		sections.header = tokens.splice(0, StartOfReadme);
	} else if (tokens[0].type === 'heading' && tokens[0].depth === 1) {
		// If we don't find an h2 try and grab the title from first item
		sections.header = tokens.splice(0, 1);
	} else {
		// If we don't find any of these generate our own
		// Possibly by grabbing the name from the package.json
		sections.header = [{
			type: 'heading',
			raw: '# My heading here\n\n',
			depth: 1,
			text: 'My heading here',
			tokens: [{type: 'text', raw: 'My heading here', text: 'My heading here'}]
		}];
	}

	// Rest of the tokens form the readme
	sections.readme = tokens;

	return sections;
}

(async () => {
	try {
		const response = await fetch('https://unpkg.com/@springernature/nature-hero@2.1.2/README.md');
		const body = await response.text();

		// Convert markdown to tokens array
		let tokens = marked.lexer(body);

		// Add a mermaid graph for rendering
		// https://github.blog/2022-02-14-include-diagrams-markdown-files-mermaid/
		tokens = await createMermaid(tokens);

		// Process code block tokens
		tokens.forEach(token => processCodeBlock(token));

		// Split the markdown to make room for the demo
		const docSections = createSections(tokens);

		// Create toc Markdown
		const tocMarkdown = toc(body, {firsth1: false}).content;

		// Generate HTML from tokens
		const htmlHeader = marked.parser(docSections.header);
		const htmlReadme = marked.parser(docSections.readme);
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
  <!-- mermaid -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({startOnLoad:true});
</body>
</html>`);
	} catch (err) {
		console.error(err)
	}
})();

