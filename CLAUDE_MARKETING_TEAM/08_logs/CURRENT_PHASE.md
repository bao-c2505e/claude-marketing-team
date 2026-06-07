# CURRENT PHASE — The Core Agency PC1

## Active Phase: Phase 7 ✅ DONE

**Phase 7 — Content Calendar Foundation**
- Status: COMPLETED 2026-06-08
- Commit: feat: add content calendar foundation
- Build: pending (run after commit)

## Completed Phases

| Phase | Name | Status |
|---|---|---|
| Phase 1 | Project Bootstrap | ✅ DONE |
| Phase 2 | Authentication + Role System | ✅ DONE |
| Phase 3 | UI Foundation + Dashboard | ✅ DONE |
| Phase 4 | Client/Brand/Campaign Management | ✅ DONE |
| Phase 5 | Brief Intake Foundation | ✅ DONE |
| Phase 6 | Content Generation Foundation | ✅ DONE |
| Phase 7 | Content Calendar Foundation | ✅ DONE |

## Next Phase

**Phase 8 — Approval Workflow Foundation**
- Submit content items for approval
- Approval request CRUD (ApprovalRequest, ApprovalEvent, ApprovalComment)
- Review / approve / reject / revision_requested transitions
- `approved` status becomes settable via approval record only

## Active Constraints

- No real AI API calls (Phase 6 uses mock generator only)
- No auto-post. No auto-ads spending. No auto-message.
- No secrets/API keys hardcoded. No .env commits.
- No Supabase service role key in frontend.
- Generated ≠ Approved. Approved ≠ Published.
- Content items default status: needs_review.
