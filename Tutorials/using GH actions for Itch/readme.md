# 🚀 Automating ExcaliburJS Game Deployments to Itch.io with GitHub Actions

This guide explains how to automatically deploy your **ExcaliburJS HTML5 game** to [Itch.io](https://itch.io/) using **GitHub Actions**
and [Butler](https://itch.io/docs/butler/).  
Every push will increment your game version and upload it to your Itch.io project.

---

## 📦 Prerequisites

- A **GitHub repository** with your ExcaliburJS game.
- An **Itch.io account** with a project created.
- [Butler](https://itch.io/docs/butler/) installed locally (to generate an API key).
- Your project should already build into a **`./dist` folder** (the default for many JS bundlers like Vite, Webpack, Parcel, etc.).

---

## 🕹️ Step 1: Set Up Your Itch.io Project

1. Log in to [Itch.io](https://itch.io/).
2. Create a new project (**Upload new project**).
3. Fill in the details. Make sure the project type is set to **HTML**.
4. Save.
   - Example URL: `https://myusername.itch.io/mygame`
     - `myusername` = your Itch.io username
     - `mygame` = your project slug

### note: the project won't be happy because there's no files uploaded, bear with me on this...

---

## 🔑 Step 2: Get Your Butler API Key

1. Install Butler locally → [installation guide](https://itch.io/docs/butler/installing.html).
2. Log in with:
   ```bash
   butler login
   ```

### note: once you have 'your' Butler key, keep it secret AND it can be reused over and over for all your Itch projects

## 🔐 Step 3: Store Secrets in GitHub

Go to your GitHub repo → Settings → Secrets and variables → Actions.

Secrets (encrypted):

BUTLER_API_KEY → Paste your Itch.io API key

Variables (plain environment variables):

ITCH_USERNAME → Your Itch.io username (e.g., myusername)

ITCH_GAME_ID → Your Itch.io game slug (e.g., mygame)

✅ Using environment variables for username + game ID makes the workflow reusable across multiple projects.

## ⚙️ Step 4: GitHub Actions Workflow

Create .github/workflows/deploy.yml in your repo:

```yaml
name: Deploy to Itch.io (HTML5)

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: write # 🔑 This gives GITHUB_TOKEN permission to push changes

env:
  ITCH_USERNAME: myUserName # **** ENTER YOUR ITCH USERNAME ****
  ITCH_GAME_ID: myGameID # **** ENTER YOUR ITCH PROJECT ****

jobs:
  deploy:
    name: Upload to Itch
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 1
          submodules: true

      - name: Set up Node
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Bump version
        run: |
          npm version patch --no-git-tag-version # 🔑 change patch to minor or major depending on what you want to do
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add package.json
          git commit -m "chore: bump version"
          git push https://x-access-token:${{ secrets.GITHUB_TOKEN }}@github.com/${{ github.repository }} HEAD:main

      - name: Extract version from package.json
        uses: sergeysova/jq-action@v2
        id: version
        with:
          cmd: "jq .version package.json -r"

      - uses: KikimoraGames/itch-publish@v0.0.3
        with:
          butlerApiKey: ${{secrets.BUTLER_API_KEY}}
          gameData: ./dist
          itchUsername: ${{env.ITCH_USERNAME}}
          itchGameId: ${{ env.ITCH_GAME_ID }}
          buildChannel: itch_build
          buildNumber: ${{ steps.version.outputs.value }}
```

### 📝 How Versioning Works

1. `npm version patch --no-git-tag-version`

Increments the version field in package.json according to semver.

    patch means e.g. 1.2.3 → 1.2.4
    minor means e.g. 1.2.3 → 1.3.0
    major measn e.g. 1.2.3 → 2.0.0

2. Configure git user info
3. Commit the updated package.json
4. Push changes back to main
5. Uses the built-in GITHUB_TOKEN to authenticate and push the commit.

This updates your repo so the new version number is saved in GitHub.

### 📂 Project Build Notes

Your ExcaliburJS build output should be in ./dist.

If your build folder is different, update the workflow line in the YAML script:

```bash
gameData: ./****where your build artifacts are****
```

### ✅ Deployment

Push to main → GitHub Actions runs → Butler uploads → Itch.io updates.

### 🎉 Done!

Your ExcaliburJS HTML5 game now deploys to Itch.io automatically every time you push. Happy game dev! 🕹️🚀
