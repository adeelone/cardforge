# Incident Response

## Report

Use a private GitHub security advisory: `https://github.com/adeelone/cardforge/security/advisories/new`.

Do not place exploit details, personal data, share URLs, credentials, or private roster samples in a public issue.

## Maintainer Procedure

1. **Triage:** acknowledge the report, preserve evidence, identify affected versions and data flows, and assign severity.
2. **Contain:** disable the affected workflow or public route, roll back Pages, revoke exposed repository or hosting credentials, and pause releases when necessary.
3. **Eradicate:** patch the root cause, add regression coverage, rotate relevant credentials, and review adjacent trust boundaries.
4. **Recover:** run lint, typecheck, unit/component tests, E2E, production builds, dependency audit, and CodeQL; deploy from a reviewed commit and verify the public endpoint.
5. **Notify:** publish a security advisory and upgrade instructions when users need to act. Contact affected organizations directly only when reliable contact and impact evidence exist.
6. **Learn:** document timeline, root cause, affected scope, controls that failed, and follow-up owners without publishing unnecessary personal data.

## Severity Guide

- **Critical:** arbitrary script execution for normal visitors, repository/release compromise, or confirmed broad disclosure of sensitive data.
- **High:** reliable cross-user data disclosure, malicious import causing code execution, or bypass of share-field filtering.
- **Medium:** limited integrity, privacy, or availability impact requiring user interaction.
- **Low:** defense-in-depth weakness with no demonstrated sensitive impact.

The static edition has no central user database, so breach scope must be based on confirmed hosting, repository, or shared-link evidence rather than assumed account records.
