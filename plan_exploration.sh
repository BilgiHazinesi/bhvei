#!/bin/bash
# Check if bookStatsMap exists
grep -n "bookStatsMap" kutuphane/kutuphane.js || echo "No bookStatsMap found"
# Check how renderBookManager currently works to identify the O(N) loop causing freezing
sed -n '182,230p' kutuphane/kutuphane.js
# See where we could place a Delete button in renderHistory
sed -n '392,425p' kutuphane/kutuphane.js
# See how apples are rendered in openBookDetail
sed -n '469,484p' kutuphane/kutuphane.js
