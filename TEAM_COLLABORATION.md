# 🤝 Team Collaboration Guide

This document explains how team members should collaborate efficiently while working on their hackathon project.

---

## 👥 Team Structure and Roles

Every team should assign clear roles:

- **Team Lead:** Oversees progress, manages pull requests, and ensures smooth collaboration.
- **Developers:** Work on assigned features and push code regularly.


---

## 🌿 Branching and Folder Structure

Each team must work only within their **team branch** and **team folder**:

```
/submission/team-name/
```

Example:
```
/submission/team-alpha/
```


## 🔄 Collaboration Workflow

### 1. Assign Tasks Clearly
Use a shared document or issue tracker to assign features or components (e.g., UI, backend, docs).

### 2. Work on Feature Branches (Optional but Recommended)
Each team member can create a **feature branch** from the main team branch:

```bash
git checkout -b feature-login
```

After completing the task:

```bash
git add .
git commit -m "Add login functionality"
git push origin feature-login
```

---

## 🔁 Merging Changes

Once a feature is complete, there are **two ways to merge** changes into the team branch:

### **Option 1: Via Pull Request (Recommended)**

1. Push your feature branch to your team repository:
   ```bash
   git push origin feature-login
   ```
2. On GitHub, open a **Pull Request** from your feature branch → your team branch.
3. Have your **Team Lead** review and merge it after verifying the changes.

This ensures code review and prevents overwriting other members' work.

### **Option 2: Via Command Line (For Internal Team Merges)**

If the team agrees and communication is clear, you can merge locally using commands:

```bash
git checkout team-alpha        # switch to your team branch
git pull origin team-alpha      # get latest updates
git merge feature-login         # merge your feature branch into team branch
git push origin team-alpha      # push merged changes
```

If merge conflicts appear, resolve them carefully before pushing.

---

## 💬 Communication Tips

- Update the team regularly after each commit or merge.
- Notify others before merging significant changes.

---

## ⚔️ Conflict Prevention Tips

- Always **pull** before pushing.
- Avoid working on the **same file** simultaneously.
- Commit small, logical units of work.
- Resolve merge conflicts **locally**, not on GitHub.
- Use `.gitignore` to prevent unnecessary files from being tracked.

---

## 🧩 Best Practices

- One person should handle merging at a time to prevent conflicts.
- Run tests or check app functionality before every commit.
- Communicate code changes before integrating them.
- Document any major change in your `README.md` or comments.

---

## ✅ Summary

Each team:
- Works in `/submission/team-name/`
- Uses a dedicated team branch
- Collaborates through feature branches and PRs
- Merges responsibly via **PRs or command line** after review

Collaboration done right means fewer conflicts and faster progress for everyone.

