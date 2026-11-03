# 16. Later Features

Not part of the first version. Listed so the MVP design does not block them.

| Feature | Notes / design hook |
| ------- | ------------------- |
| Billing: pass or subscription | Validate demand first. `billing` module with `entitlements`, `subscriptions`; free episode counts already stored; paid audio uses signed URLs. Model (pass per series vs. subscription) decided after pilot. |
| Personalised recommendations | Listening events already captured. Mem0 may be considered here only, never for story canon. |
| Feedback agent | New graph in `ai` for pacing, readability and engagement notes on drafts. |
| Per-episode listener-data panel for writers | Reuses analytics aggregates (spec 12). |
| Earnings view and writer payouts | `payouts` table; depends on billing. |
| Ratings and comments | Needs moderation tools. |
| Push notifications for new episodes | `notifications` module. |
| Car mode | Simplified large-control player. |
| Full web player and account management | Extends the website (spec 13). |
| Content moderation tools | Admin area. |
| A/B tests on titles and covers | Admin area plus analytics. |
| Trusted-writer auto-publish | Per-writer flag; review state machine already allows it (spec 08). |
| Voice-line review before stitching | Swap the voice job for a LangGraph graph with an interrupt (spec 07). |
| Bible graph view and import | Writer area enhancement (spec 03). |

## Explicitly out of scope for now
Public creator sign-up or user-generated content, video, social features, coin/token economy.
