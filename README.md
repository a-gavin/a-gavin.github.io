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
    - [`content/blog.md`](./content/blog.md) served at [`https://a-gavin.github.io/blog/`](https://a-gavin.github.io/blog/)
    - [`content/blog/bitmagic.md`](./content/blog/bitmagic.md) served at [`https://a-gavin.github.io/blog/bitmagic/`](https://a-gavin.github.io/blog/bitmagic/)
- [`static/`](./static/)
  - Website static content, including CSS and images.
- [`templates/`](./templates/)
  - Templates used for website content
  - [`partials/`](./templates/partials/) contains partial templates allowing for reuse in other templates
  - [`post.html`](./templates/post.html) is used for all blog posts

## Development Setup

**NOTE:** Tailwind CSS size tags are "mobile first", meaning the size tags set for
a given class tag are only active for _that size tag and larger_. For example,
`sm:flex` enables `flex` class tag for display sizes small or larger (anything smaller
will not have it enabled).

1. Install Zola (static website generator)
   - Follow the [Zola install guide](https://www.getzola.org/documentation/getting-started/installation/)

2. Install `npm` (via `nvm`)

   - Follow the [`nvm` install guide](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
   - After installing `nvm`, run:

     ```Bash
     # Install NodeJS v22
     nvm install v22

     # Redundant, but just for reference
     nvm use v22
     ```

3. Install required node packages

   ```Bash
   npm install
   ```

4. Generate tailwind CSS from config

   **NOTE**: To update CSS, make sure to regenerate using following command and manually check the updated CSS in.

   ```Bash
   # Zola looks for CSS and favicon in './static/' by default
   # Add '--watch' to run in the background if not using editor Tailwind plugins
   npx tailwindcss -i ./static/app.css -o ./static/main.css
   ```

5. Serve webpage locally
   ```Bash
   # The 'shalzz/zola-deploy-action' GitHub action generates
   # the required directory structure for hosting on GitHub Pages
   # by running on all pushes to main.
   #
   # Run with '--drafts' argument to also serve draft pages
   zola serve
   ```

## Reference `npm` Commands

```Bash
# List both development and production dependencies
npm list

# List only production dependencies
npm list --omit=dev -depth 0

# List only development dependencies
npm list --include=dev -depth 0

# Install and add new dependency to tracked packages
# Add '--save-dev' to install as development dependency
npm install $PKG_NAME@$PKG_VERSION
```
