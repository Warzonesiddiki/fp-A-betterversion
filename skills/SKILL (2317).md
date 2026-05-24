---
name: git-advanced-workflows
description: Advanced Git operations including interactive rebase, bisect for debugging, stash management, cherry-picking, reflog, and submodule handling.
origin: https://git-scm.com/docs
---

# Git Advanced Workflows

## Interactive Rebase

### Squash Commits
```bash
# Rebase last 5 commits interactively
git rebase -i HEAD~5

# In editor, change 'pick' to 'squash' or 's':
pick abc1234 First commit
squash def5678 Second commit
squash 9a1b2c3 Third commit

# Result: Single commit with all changes
```

### Edit Commits
```bash
# Mark commit to edit
git rebase -i HEAD~3
# Change 'pick' to 'edit' or 'e'

# Amend the commit
git commit --amend --no-edit

# Continue rebase
git rebase --continue
```

### Reorder and Remove
```bash
# In interactive rebase:
# - Reorder lines to change commit order
# - Delete line to remove a commit
```

### Rebase vs Merge
```bash
# Keep feature branch up to date
git checkout feature/my-feature
git rebase main

# Never rebase commits that have been pushed and shared
```

## Git Bisect

### Binary Search for Bugs
```bash
# Start bisect session
git bisect start

# Mark current commit as bad
git bisect bad

# Mark known good commit
git bisect good v1.0.0

# Git checks out middle commit, test it
# Then mark as good or bad
git bisect good  # or git bisect bad

# Repeat until found
# Git will identify the problematic commit

# End bisect
git bisect reset
```

### Automated Bisect
```bash
# Run automated test
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
git bisect run npm test

# Finds first bad commit automatically
```

## Stash Management

### Basic Stash
```bash
# Save work in progress
git stash
git stash save "WIP: feature implementation"

# Stash including untracked files
git stash -u

# Stash with message
git stash push -m "partial feature"

# Stash specific files
git stash push -m "temp fix" src/utils/helper.js
```

### Apply and Pop
```bash
# Apply most recent stash
git stash pop

# Apply specific stash
git stash pop stash@{2}

# Apply without removing from stash list
git stash apply
git stash apply stash@{1}
```

### Stash Operations
```bash
# List stashes
git stash list
# stash@{0}: WIP: feature on main
# stash@{1}: partial feature

# Show stash contents
git stash show
git stash show -p stash@{0}

# Create branch from stash
git stash branch new-branch stash@{0}

# Drop stash
git stash drop stash@{1}

# Clear all stashes
git stash clear
```

## Cherry-Picking

### Apply Single Commits
```bash
# Cherry-pick a commit
git cherry-pick abc1234

# Cherry-pick multiple commits
git cherry-pick abc1234 def5678

# Cherry-pick without committing
git cherry-pick -n abc1234

# Continue after resolving conflicts
git cherry-pick --continue

# Abort cherry-pick
git cherry-pick --abort
```

### Cherry-Pick Range
```bash
# Cherry-pick range of commits
git cherry-pick abc1234..def5678
```

## Reflog

### Recovery Operations
```bash
# View reflog
git reflog
# 9a1b2c3 HEAD@{0}: commit: Fix bug
# 7d6e5f4 HEAD@{1}: rebase: onto main
# 3c2b1a0 HEAD@{2}: checkout: moving from main

# Recover lost commit
git checkout HEAD@{1}
git branch recovered-commit

# Recover after bad reset
git reflog
git reset --hard HEAD@{1}
```

## Submodules

### Adding and Updating
```bash
# Add submodule
git submodule add https://github.com/org/repo.git lib/repo

# Clone with submodules
git clone --recurse-submodules https://github.com/org/main-repo.git

# Update submodules
git submodule update --remote lib/repo
git submodule update --remote --init
```

### Working with Submodules
```bash
# Pull upstream changes
git submodule update --remote --merge

# Push submodule changes
git submodule foreach git push

# Remove submodule
git submodule deinit lib/repo
git rm lib/repo
git rm --cached lib/repo
```

## Advanced Commands

### Worktree
```bash
# Create worktree for parallel work
git worktree add ../feature-branch feature/my-feature

# List worktrees
git worktree list

# Remove worktree
git worktree remove ../feature-branch
```

### Blame and Annotate
```bash
# Blame specific lines
git blame src/app.js

# Blame with ignore whitespace
git blame -w src/app.js

# History for a function
git log -L :function_name:src/app.js
```

### Clean and Reset
```bash
# Dry run before cleaning
git clean -n

# Remove untracked files
git clean -fd

# Reset to previous state
git reset --hard HEAD~1
git reset --soft HEAD~1  # keep changes staged
```

## Best Practices

1. **Commit often**: Small, focused commits are easier to manage
2. **Write good messages**: First line < 50 chars, body explains "why"
3. **Use rebase to maintain history**: Keep feature branches clean
4. **Don't commit to main**: Use branches and PRs
5. **Protect main/master**: Require reviews and checks
6. **Use bisect for regressions**: Binary search is faster than manual
7. **Stash wisely**: Clear old stashes to avoid confusion
8. **Backup reflog**: It saves you from mistakes
