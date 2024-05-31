# Website

This website uses the following open source tools:

- [Zola](https://www.getzola.org/) static website generator
- [shallz's Zola Deploy](https://github.com/shalzz/zola-deploy-action) GitHub Action
- [Tailwind CSS](https://tailwindcss.com/) framework
- [Prettier](https://prettier.io/) code formatter
- [npm](https://www.npmjs.com/) NodeJS package manager
- [nvm](https://github.com/nvm-sh/nvm/blob/master/README.md) NodeJS version manager

## Repository Contents

- [`content/`](./content/)
  - Website content written in Markdown
  - Directory structure corresponds to structure used on website
    - [`content/blog.md`](./content/blog.md) served at [`https://a-gavin.github.io/blog.html`](https://a-gavin.github.io/blog.html)
    - [`content/blog/bitmagic.md`](./content/blog/bitmagic.md) served at [`https://a-gavin.github.io/blog/bitmagic.html`](https://a-gavin.github.io/blog/bitmagic.html)
- [`static/`](./static/)
  - Website static content, including CSS and images.
- [`templates/`](./templates/)
  - Templates used for website content
  - [`partials/`](./templates/partials/) contains partial templates allowing for reuse in other templates
  - [`post.html`](./templates/post.html) is used for all blog posts

## Development Setup

1. Install Zola (static website generator)
   - [Zola install guide](https://www.getzola.org/documentation/getting-started/installation/)
2. Install `npm` (via `nvm`)
   **TODO**
3. Install required node packages
   ```Bash
   npm install
   ```
4. Generate tailwind CSS from config
   ```Bash
   # Zola looks for CSS and favicon in `./static/` by default
   npx tailwindcss -i ./static/app.css -o ./static/main.css --watch
   ```
5. Serve webpage locally
   ```Bash
   # The `shalzz/zola-deploy-action` GitHub action generates
   # the required directory structure for hosting on GitHub Pages
   # by running on all pushes to main.
   zola serve
   ```
