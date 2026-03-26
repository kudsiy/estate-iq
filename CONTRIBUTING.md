# Contributing to Estate IQ

Thank you for your interest in contributing to Estate IQ! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Report issues responsibly

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/estate-iq.git`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes
5. Test your changes: `pnpm test`
6. Format code: `pnpm format`
7. Commit: `git commit -am 'Add your feature'`
8. Push: `git push origin feature/your-feature`
9. Open a Pull Request

## Development Workflow

### Before You Start
- Check existing issues and PRs to avoid duplicate work
- Discuss major changes in an issue first
- Read the README.md and SETUP.md

### Making Changes

1. **Update schema** (if needed)
   ```bash
   # Edit drizzle/schema.ts
   pnpm db:push
   ```

2. **Add database helpers** (if needed)
   ```bash
   # Edit server/db.ts
   # Add query functions that return raw Drizzle rows
   ```

3. **Create tRPC procedures** (if needed)
   ```bash
   # Edit server/routers.ts
   # Add public or protected procedures
   ```

4. **Build UI components**
   ```bash
   # Create components in client/src/pages/ or client/src/components/
   # Use shadcn/ui for consistency
   # Call tRPC procedures with useQuery/useMutation
   ```

5. **Write tests**
   ```bash
   # Create server/feature.test.ts
   # Test core logic, not UI
   # Run: pnpm test
   ```

6. **Test in browser**
   ```bash
   # Run: pnpm dev
   # Visit: http://localhost:3000
   # Test all user flows
   ```

## Code Style

### TypeScript
- Use strict mode
- Avoid `any` types
- Export types for public APIs
- Use meaningful variable names

### React Components
- Use functional components with hooks
- Keep components focused and reusable
- Use TypeScript for props
- Add JSDoc comments for complex logic

### Tailwind CSS
- Use utility classes
- Avoid custom CSS unless necessary
- Follow design tokens in index.css
- Ensure accessible color contrast

### Database
- Use Drizzle ORM for all queries
- Create migrations for schema changes
- Add indexes for frequently queried columns
- Document complex queries

## Testing

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = processInput(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific file
pnpm test server/auth.test.ts

# Watch mode
pnpm test --watch
```

### Test Coverage
- Aim for >80% coverage
- Test happy paths and edge cases
- Test error handling
- Test security-critical features

## Commit Messages

Use clear, descriptive commit messages:

```
feat: Add password reset functionality
fix: Resolve OAuth callback redirect issue
docs: Update API documentation
refactor: Simplify lead management logic
test: Add tests for password validation
chore: Update dependencies
```

Format: `type: description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

## Pull Request Guidelines

1. **Title**: Clear, descriptive title
2. **Description**: Explain what and why
3. **Checklist**:
   - [ ] Tests pass (`pnpm test`)
   - [ ] Code formatted (`pnpm format`)
   - [ ] No console errors
   - [ ] Documentation updated
   - [ ] Backward compatible

4. **Screenshots**: For UI changes, include before/after

5. **Linked Issues**: Reference related issues

## Performance Considerations

- Minimize database queries
- Use indexes for frequently queried columns
- Implement pagination for large datasets
- Cache computed values when appropriate
- Optimize React components with useMemo/useCallback

## Security Guidelines

- Never commit secrets or API keys
- Validate all user input
- Use parameterized queries (Drizzle handles this)
- Implement rate limiting for APIs
- Hash passwords with bcrypt
- Use HTTPS in production
- Validate OAuth tokens

## Documentation

- Update README.md for major features
- Add JSDoc comments for functions
- Document complex algorithms
- Include examples in docstrings
- Keep SETUP.md current

## Reporting Issues

### Bug Reports
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable
- Environment details

### Feature Requests
- Clear description of use case
- Why this feature is needed
- Proposed implementation (optional)
- Any design mockups (optional)

## Questions?

- Check existing documentation
- Search closed issues for answers
- Open a discussion issue
- Ask in comments on related PRs

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page

Thank you for contributing to Estate IQ! 🎉
