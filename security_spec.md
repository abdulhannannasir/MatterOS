# Security Specification: MATTEROS

## 1. Data Invariants
1. Matter documents, timeline events, issues, evidence, and deadlines must be owned by the authenticated user (`ownerId == request.auth.uid`).
2. Users can only read and write their own profile records (`users/{userId}` where `userId == request.auth.uid`).
3. User profile creation must not allow setting elevated permissions or unauthorized roles.
4. Timestamps on creation (`createdAt`) and updates (`updatedAt`) must match or be verified against request data.
5. All document IDs must be valid alphanumeric/dash identifiers without path traversal or buffer injection.
6. A document, event, issue, deadline, or evidence item cannot be created without a valid `matterId`.
7. Client-side list operations must strictly enforce `ownerId == request.auth.uid` so tenant isolation is guaranteed.

## 2. Dirty Dozen Threat Vectors
1. **User Spoofing:** Attacker creates a matter with `ownerId` set to a competitor firm's user ID.
2. **Profile Privilege Escalation:** Attacker updates `users/{userId}` to set `role: "super_admin"`.
3. **Cross-Tenant Document Read:** User A attempts to read `documents/{docId}` belonging to User B.
4. **Cross-Tenant Document Modification:** User A sends update to `documents/{docId}` owned by User B.
5. **Timeline Event Tampering:** User modifies a lawyer-verified timeline event belonging to another lawyer.
6. **Orphaned Record Creation:** Creation of an issue without a parent `matterId`.
7. **Giant Payload / Denial of Wallet:** Submitting a 5MB junk string in `matterName` or `title`.
8. **Path Traversal in IDs:** Injecting `../..` or special symbols into document path IDs.
9. **Blanket List Scraping:** Querying `matters` collection without filtering by `ownerId`.
10. **Ghost Key Injection:** Attempting to update a matter with arbitrary hidden attributes (`shadowField: true`).
11. **State Bypassing:** Setting matter status to a non-existent state or bypassing validation.
12. **AI Analysis Forgery:** Inserting fabricated AI analysis results directly into other users' matters.
