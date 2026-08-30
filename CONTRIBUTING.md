# Contributing to Chronix

## Reporting Issues

If you find a bug or have a feature idea, check the [GitHub Issues](https://github.com/AdityaLF/chronix/issues) page first to see if it has already been reported. If not, feel free to open a new issue.

For major features or significant changes, consider opening an issue first to discuss the idea before starting development.

## Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or later
- [npm](https://www.npmjs.com/)

### 1. Fork & Clone
1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/chronix.git
   cd chronix
   npm install
   ```

### 2. Run & Debug
1. Open the project in VS Code.
2. Press `F5` (or select **Run > Start Debugging**) to launch an Extension Development Host window.
3. Test your changes in the development window.

## Pull Request

1. Create a dedicated branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   # or
   git checkout -b fix/your-bug-fix
   ```
2. Verify that the project compiles cleanly with no TypeScript errors:
   ```bash
   npm run compile
   ```
3. Commit your changes with descriptive messages.
4. Open a Pull Request with a summary of your changes and reference any related issues.
