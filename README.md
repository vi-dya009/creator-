# CreatorFlow — GitHub Pages package

This is the complete CreatorFlow project arranged at the repository root for direct upload to the existing `vi-dya009/Creator-flow` GitHub repository.

## Publish the live portfolio preview

1. Extract `CreatorFlow-GitHub-Package.zip`.
2. Upload the **contents** of the extracted `CreatorFlow-GitHub-Package` folder to the root of the GitHub repository, keeping the `.github/workflows` folder structure. If GitHub asks to overwrite existing files, replace them with the package copies.
3. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source.
4. Open **Actions** and wait for **Deploy CreatorFlow portfolio preview** to finish successfully. It also runs automatically when files are pushed to `main`.
5. Visit https://vi-dya009.github.io/Creator-flow/ and choose **Explore the demo**.

GitHub Pages runs the portfolio preview with synthetic sample data. It does not host the Express API or SQLite database, so login and saved accounts/content are not available on the live Pages site. No real passwords or data should be entered in the preview.

## Run the full app locally

Install Node.js 22.12 or newer, open PowerShell in the extracted package folder, then run:

```powershell
npm install
npm run dev
```

Open http://localhost:5173. The full-stack local app supports account registration, login, and SQLite-backed content. GitHub Pages only hosts the read-only preview.

The package intentionally excludes `node_modules`, generated `dist` files, `.env` secrets, and local SQLite databases. Dependencies are restored with `npm install`; the local database is created automatically.
