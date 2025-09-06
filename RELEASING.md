# Release Process

This repository uses [changesets](https://github.com/changesets/changesets) for version management and automated releases.

## Overview

- **Automated Releases**: When changes are merged to `main`, GitHub Actions automatically creates a release PR or publishes to NPM
- **Badge Updates**: Tests run on every push to `main` and automatically update coverage and status badges
- **Semantic Versioning**: Changesets ensures proper version bumping based on the type of changes

## Making Changes

### 1. Create a Changeset

After making changes, create a changeset to document them:

```bash
pnpm changeset
```

This will prompt you to:

1. Select which packages have changed
2. Choose the version bump type (major/minor/patch)
3. Write a summary of the changes

### 2. Commit the Changeset

The changeset will create a markdown file in `.changeset/`. Commit this along with your changes:

```bash
git add .
git commit -m "feat: add new feature with changeset"
```

## Release Process

### Automated Release (Recommended)

1. **Merge to main**: When PRs with changesets are merged to `main`, the GitHub Action will:
   - Create or update a "Version Packages" PR
   - This PR updates package versions and CHANGELOG files

2. **Review and Merge**: When ready to release:
   - Review the Version Packages PR
   - Merge it to trigger the actual release

3. **Automatic Publishing**: Upon merging the Version Packages PR:
   - Packages are built and published to NPM
   - GitHub releases are created
   - Badges are updated

### Manual Release

If needed, you can release manually:

```bash
# Update versions
pnpm version-packages

# Build and publish
pnpm release
```

## Badge Updates

Badges are automatically updated on every push to `main`:

- **Coverage Badge**: Shows test coverage percentage
- **Test Badge**: Shows if tests are passing/failing
- **Build Badge**: Shows build status
- **Version Badge**: Shows current published version

To manually update badges:

```bash
./scripts/update-badges.sh
```

## NPM Publishing

The CLI package is published to NPM as `@sammons/code-outline-cli`.

### Prerequisites

1. **NPM Token**: Set up `NPM_TOKEN` as a repository secret in GitHub
2. **Permissions**: Ensure you have publish access to the `@sammons` scope on NPM

### Package Configuration

The CLI package is configured with:

- Public access for the `@sammons` scope
- Automatic version syncing across monorepo packages
- GitHub releases with changelogs

## Troubleshooting

### Changesets Not Working

- Ensure `.changeset/config.json` is properly configured
- Check that the `baseBranch` is set to `main`

### Publishing Fails

- Verify `NPM_TOKEN` is set in GitHub secrets
- Check NPM account has publish permissions
- Ensure all tests are passing

### Badges Not Updating

- Check GitHub Actions permissions allow writing to the repository
- Verify the badge generator script has no errors
- Ensure coverage data is being generated

## Version Strategy

- **Major**: Breaking changes to the CLI or API
- **Minor**: New features that are backward compatible
- **Patch**: Bug fixes and minor improvements

All packages in the monorepo are versioned together (fixed versioning) to ensure compatibility.
