---
'@sammons/code-outline-cli': major
'@code-outline/parser': major
'@code-outline/formatter': major
---

# Breaking: Require Node.js 20 or higher

Updated minimum Node.js version requirement from 18 to 20 for better performance and modern JavaScript features.

## Changes:

- Updated engine requirement to Node.js >=20.0.0
- Removed Node.js 18.x from CI test matrix
- Fixed formatter tests to handle ANSI color codes properly

## Migration:

Users must upgrade to Node.js 20 or higher to use v2.0.0 and later versions.
