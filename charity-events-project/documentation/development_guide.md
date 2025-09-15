# Development Workflow Guide

## Daily development process
1. **Before starting work**
- pull the latest code: 'git pull origin main'
- Check the current branch: 'git branch'
- Check the to-do list

2. **Develop new features**
- Create a feature branch: 'git checkout -b feature/feature-name'
"Write code
"Test function"
- Submit changes: 'git add. && git commit -m "feat: description"'

3. **Complete the work**
- push to GitHub: 'git push origin feature/feature-name'
Create a Pull Request
- Merge into the main branch

## Git Commit Message Specification
-feat: New feature
-fix: Fix a bug
-docs: Document update
-style: Code format adjustment
-refactor: Code refactoring
-test: Related to testing

## Testing process
1. Database testing: Verify queries and joins
2. API Testing: Use Postman to test endpoints
3. Front-end testing: Manually test all page functions
4. Integration Testing: End-to-end process testing