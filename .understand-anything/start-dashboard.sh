#!/bin/bash
cd "$HOME/.understand-anything-plugin/packages/dashboard"
GRAPH_DIR=/d/windsurf_workspaces4 npx vite --host 127.0.0.1 2>&1 | tee /d/windsurf_workspaces4/.understand-anything/dashboard.log
