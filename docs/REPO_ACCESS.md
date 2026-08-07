# Repository access

## Who can push

This repo uses two layers of protection:

1. **Local pre-push hook** (`.githooks/pre-push`) — blocks `git push` unless your Git identity is listed in `scripts/git/allowed-pushers.txt`.
2. **GitHub branch protection** (optional, recommended) — blocks direct pushes to `main` on GitHub except the repo owner; everyone else must use pull requests.

### Install the local hook (run once per clone)

```bash
npm run git:hooks
```

### Allow someone else to push

1. Add their **git email** (or GitHub username) to `scripts/git/allowed-pushers.txt`.
2. Merge that change via PR (with your approval).
3. On GitHub, add them as a collaborator with **Read** or **Write** only if you want them to open PRs — direct push to `main` stays owner-only after branch protection is enabled.

### One-time override (you explicitly approve a push)

```bash
BOUTFORGE_ALLOW_PUSH=1 git push
```

### Enable GitHub branch protection (owner only)

```bash
chmod +x scripts/setup-github-branch-protection.sh
./scripts/setup-github-branch-protection.sh
```

Requires [GitHub CLI](https://cli.github.com/) authenticated as `aswin-shakthic`.
