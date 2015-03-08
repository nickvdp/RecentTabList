Recent Tab List for Safari
=====================

A Safari extension that keeps track of recently closed tabs and allows you to reopen them quickly. Will also (optionally) display currently open tabs. With a live text filter for easy searching.

Right now it has 5 settings:
- Number of recent tabs in the list
- Open tabs in foreground or background
- Show/hide currently open tabs
- Show open tabs list before recent tabs
- Disable recent tab tracking when private browsing is on

Limitations
-----------

- It only opens the most recent URL from any closed tab. The Safari extension API doesn’t allow any access to a tab’s history. It may be possible to recreate a rough tab history by injecting JavaScript into each page to track URL changes, but I chose not to go that far.
- The Safari Extension API doesn't reveal private browsing status by window (just on or off for the whole browser). If private browsing tracking is off, the extension will also skip tabs in your non-private windows


Download and Install
------------

[Download and install the packaged extension from my website.](http://nickvdp.com/tablist/)