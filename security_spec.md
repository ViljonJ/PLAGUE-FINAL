# Security Specification for PLAGUE Learning System

## Data Invariants
1. **Identity Integrity**: A user can only access their own `/users/{userId}` document.
2. **Stat Sanity**: `xp`, `rank`, and `streak` must be non-negative integers.
3. **Verification**: All write operations require `email_verified == true`.
4. **Schema Enforcement**: All document updates must pass the `isValidUserStats` check.
5. **Admin Access**: Only designated admins can delete user records or list all users.

## The Dirty Dozen (Test Payloads)
1. **Identity Theft**: Attempt to create a user profile with `userId` of another user.
2. **Stat Inflation**: Attempt to set `xp` to a negative value or a string.
3. **Ghost Fields**: Attempt to add `isAdmin: true` to a user profile.
4. **Unverified Sabotage**: Attempt to update a profile while `email_verified` is false.
5. **Path Poisoning**: Attempt to use `../poison` as a topic name.
6. **Resource Exhaustion**: Send a 1MB string in the `goals` field.
7. **Role Escalation**: Attempt to change own `role` to 'admin'.
8. **Orphaned Pathways**: Create an active pathway with a non-existent ID format.
9. **Timeline Tampering**: Set `lastAccessed` to a date in the future.
10. **Malicious Enum**: Set `learningStyle` to 'telepathy'.
11. **Mass Deletion**: Attempt to delete another user's document as a standard user.
12. **PII Leak**: Attempt to list all users to harvest emails.

## Test Runner (Reference)
The rules will be tested against these payloads to ensure `PERMISSION_DENIED`.
