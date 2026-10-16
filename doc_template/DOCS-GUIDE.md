# Editing the documentation

All documentation is plain Markdown in `src/content/docs/`. No code changes needed.

## Add a project
1. Create `src/content/docs/my-project.md`. The file name is the URL: `/documentation/my-project`.
2. Start it with:
   ```
   ---
   title: My Project
   summary: One line shown on the project card.
   order: 3
   links: GitHub | https://github.com/you/repo, Demo | https://example.com
   ---
   ```
   `order` sets the position in the sidebar (lowest first). `links` is optional.
3. Write the content. Every `## Heading` becomes a sidebar section and a link:
   `/documentation/my-project#heading-text` (lower-case, spaces become `-`).

## Remove / rename a project
Delete or rename the `.md` file. (Renaming changes its URL.)

## Images
Put files in `public/docs/my-project/` and use `![alt text](/docs/my-project/pic.png)`.
For a specific size: `<img src="/docs/my-project/pic.png" alt="..." width="300" />`.

## Formatting cheat sheet
`**bold**` `*italic*` `` `code` `` `[text](url)` `- list` `1. list` `> quote` and tables with `| a | b |`.

## Preview and publish
`npm run dev` to preview locally. Pushing to GitHub redeploys on Netlify.
