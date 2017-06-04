Commit gathering
strategies
---

- Store with each repo:
  - Most recent commit date
  - Oldest commit cursor
  - Last fetched date
- Notify about:
  - Missing old commits (incomplete
  repo
  stats)
  - Last updated commit

For each update:
  - Find out if there is an oldest commit cursor.
    - If there is, get the next oldest commits.
    - Otherwise, look for newer commits than the last fetched date.
