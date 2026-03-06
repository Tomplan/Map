# Kill Dev Servers — Workspace Convenience

This repository includes a set of VS Code tasks and recommended shortcuts for stopping development servers running for this workspace.

Tasks added:

- `Kill Dev Servers (Safe)`: Runs `npm run kill:dev` and attempts a graceful `TERM` before forcible `KILL`.
- `Kill Dev Servers (Force)`: Runs `npm run kill:dev -- --force` to force-terminate any leftovers
- `Kill Dev Server by Port`: Runs `npm run kill:dev -- --port <port>` — prompts for the port to use.

Keybindings (workspace-local):

- macOS: `⌘ + ⌥ + K` → `Kill Dev Servers (Safe)`
- macOS: `⌘ + ⌥ + ⇧ + K` → `Kill Dev Servers (Force)`
- Linux / Windows: `Ctrl + Alt + K`, `Ctrl + Alt + Shift + K` respectively.

Status bar buttons in VS Code

- If you prefer one-click status bar buttons, install a status-bar button extension such as `actboy168.tasks` or `seunlanlege.action-buttons` and follow their configuration to add a button for the task `Kill Dev Servers (Safe)`.

Troubleshooting: extension host crash / sidebar empty

- If VS Code's extension host appears to crash (sidebar empty):
  1. Restart the extension host: Command Palette → `Developer: Restart Extension Host`.
  2. If it still crashes, open Developer Tools: `Help` → `Toggle Developer Tools`, then `Console` for errors.
  3. Reload with extensions disabled: `Developer: Reload With Extensions Disabled` to confirm the issue is an extension conflict.
  4. In `Extensions` view, disable suspect extensions and re-enable them one-by-one to find the guilty extension.
  5. Reinstall extension if necessary (or file an issue with the extension author).

Configure in your workspace:

1. Install a status bar button extension (optional). Suggested IDs:

```vscode-extensions
actboy168.tasks,seunlanlege.action-buttons,fabiospampinato.vscode-commands
```

2. Configure the extension to call the `Kill Dev Servers (Safe)` task; each extension has its own configuration UI.
3. Alternatively, use the keybindings in `.vscode/keybindings.json`.

If you want, I can automatically add a recommended configuration JSON snippet for your chosen extension (e.g., Tasks extension) — tell me which extension you prefer and I'll add the sample config to the workspace.
