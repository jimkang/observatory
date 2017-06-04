Commit gathering
strategies
===

Cursor, oldest, newest
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

Just oldest, newest
---

- Store with each repo commits sorted by date (which you'd already be doing).

For each update:
  - Look at the newest and oldest commits in the repo and use those as params in the `history` query, like so:
  
        history(since: "2017-03-10T04:49:51Z", until: "2017-03-10T19:29:55Z", author:{emails: "jimkang@gmail.com"}, first: 100) {

How do we tell people a repo's history is incomplete?
  - Put an "incomplete" flag on it if a cursor was not resolved,
