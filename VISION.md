# Product Vision: Training Tracker (Strava for Strength & Conditioning)

This document is a guiding reference for Claude (and human contributors) when building, designing, or making decisions about this product. It captures the product philosophy, feature priorities, and strategic constraints that should inform every decision.

-----

## North Star

Build the training equivalent of Strava: a product that is **genuinely loved by users who never pay**, where the free tier covers the complete core loop, and where paid features extend depth rather than gate access.

The core loop that must always be free: **Plan → Log → Review → Share**

-----

## The Strava Analogy

Strava succeeded because:

1. The free tier covered everything needed to record, review, and share activity
1. The social layer was entirely free — this drove network effects and organic growth
1. Paid features were a **telescope, not a key** — they let you see further, not through a locked door
1. Segments/leaderboards turned ordinary roads into competitions — this is emotionally sticky and free

Every feature decision should be tested against this model.

-----

## Target Users

**Primary:** Strength and conditioning athletes — Olympic weightlifters, powerlifters, CrossFit, general barbell training
**Secondary:** Runners and endurance athletes who also lift (cross-modal users)
**Tertiary:** Coaches managing athlete programs

**Specific context:** This app is designed to work well for bilingual (English/Japanese) users and the Japanese athletic community, where no equivalent to Strava has taken hold in the lifting space.

-----

## Free Tier — Must Feel Complete

The free tier must support the full core loop without friction. If a user can plan, log, review, and share without hitting a wall, the product has succeeded at free tier design.

### Always Free

- Workout logging with standard movements
- Full PR history and PR notifications (this is the emotional hook — a PR notification is dopamine that drives retention)
- Personal training feed
- Follow/be followed by other athletes
- Club and group membership
- **Leaderboards** — lift-specific community boards (bodyweight-normalized and raw), filterable by age/weight class. This is the segment equivalent and must be free
- Reactions/kudos on training sessions (the social reward loop)
- Basic volume and training history charts
- Coach accounts with up to **5 athletes free**

### Never Paywalled

- The ability to log any workout
- Viewing your own PR history
- Posting to the social feed
- Participating in leaderboards
- Joining clubs

-----

## Paid Tier — Depth, Not Access

Paid should feel like unlocking a more powerful view of training you’re already doing, not like regaining something that was taken away.

### Paid Features

- Training load analysis and readiness/recovery scoring
- Multi-month and multi-year trend analysis (volume, intensity, movement frequency)
- Cross-modal intelligence: understands that a 90% snatch session affects running performance two days later
- Periodization and mesocycle planning tools with calendar auto-population
- Video analysis with annotation tools (especially valuable for technical lifts — snatch, clean & jerk, squat depth)
- Shareable annotated video clips
- Custom programming templates that can be shared publicly or sold
- Coach accounts beyond 5 athletes (scales with athlete count)
- Client dashboards for coaches (aggregate load, compliance, PRs)
- Advanced export (CSV, integration with other platforms)

-----

## The Leaderboard / Segment Equivalent

This is the single most important feature for growth. Strava segments turned roads into competitions. The training equivalent:

- **Gym leaderboards:** Tag your gym, your PRs appear on a local board
- **Bodyweight-normalized leaderboards:** Wilks/IPF points or similar so different weight classes compete meaningfully
- **Movement-specific boards:** Filterable by age bracket, weight class, region
- **All-time and 90-day boards:** Rewards both established athletes and newcomers

These must be free. The competitive social layer is what drives signups and word-of-mouth.

-----

## Coach as Distribution Channel

Coaches are the growth lever. If coaches build programs inside the app and assign them to athletes, those athletes sign up. Design decisions should make the coach experience excellent.

- Free tier covers small coaching operations (≤5 athletes)
- Paid scales with athlete roster size
- Coaches can publish programming templates publicly (drives brand/discovery)
- Athlete compliance and load data should be first-class in coach views
- Bulk programming (assign a block to 10 athletes at once) is a paid feature

-----

## Social Feed Design Principles

- Feed should feel like Strava’s activity feed, not Instagram
- Training sessions are the primary content unit, not posts
- PRs, volume milestones, and training streaks surface automatically
- Comments and reactions are lightweight — this is not a forum
- Avoid algorithmic feed manipulation — chronological with lightweight surfacing of notable achievements is fine

-----

## Cross-Modal Training (Lift + Run)

This is a genuine gap in the market. No app handles athletes who seriously lift **and** seriously run.

- Sessions should be taggable as strength, conditioning, running, mobility, etc.
- Weekly/monthly training load should aggregate across modalities
- Recovery model should understand that CNS fatigue from heavy lifting affects interval running performance
- Norwegian Method running integration: understand easy/threshold/interval days in context of lifting load
- When suggesting training adjustments or noting load patterns, consider the full week across all session types

-----

## Bilingual / Internationalization

This product is built with Japanese/English bilingual use as a first-class concern.

- All UI strings should be externalized for i18n from day one — never hardcode display text
- Japanese user context: community features (gyms, clubs, prefectures) should map to Japanese geography naturally
- Weight units: kg primary, lbs secondary toggle
- Date formatting: respect locale
- Movement names: maintain both English and Japanese equivalents where applicable

-----

## Technical Principles (Relevant to Product)

- **Mobile-first:** The primary logging experience is on mobile. The web experience is for review, programming, and coaching dashboards
- **Offline-capable logging:** Athletes train in gyms with poor connectivity. Logging must work offline and sync later
- **Timer and rest tracking:** Built into logging, not an afterthought
- **Video:** Should be a first-class feature for technical sport users, not a bolt-on
- **Fast log entry:** The time from opening app to first set logged should be under 10 seconds

-----

## Monetization Philosophy

- Target ~5–10% paid conversion (consistent with Strava’s model)
- This means the free tier must be genuinely loved by the **90%** who will never pay
- Do not optimize the free tier to feel incomplete — that kills word-of-mouth
- Paid pricing should feel fair relative to the depth of value delivered
- Coach tiers are the highest-value monetization path and should be treated as a separate product surface

-----

## What This Product Is Not

- Not a social media platform (training sessions are the content, not lifestyle posts)
- Not a nutrition tracker (out of scope — defer to integrations)
- Not a generic workout app (we serve athletes who take training seriously, not casual fitness users)
- Not a video hosting platform (video is a feature, not the product)
- Not a marketplace for coaching services (coaches can use it, but we don’t broker the relationship)

-----

## Decision Framework for Feature Requests

When evaluating a new feature, ask:

1. **Does this break the core loop if absent?** If yes, it must be free.
1. **Does this add depth to something that already exists?** Good paid feature candidate.
1. **Does this drive social/network effects?** Should be free — network effects are the growth engine.
1. **Does this serve coaches?** Probably paid beyond a generous free threshold.
1. **Does this work for a bilingual/Japanese user?** If not, it needs i18n work before shipping.
1. **Does it work offline?** If it’s part of the logging flow, yes it must.

-----

Further Features (Planned / Under Consideration)
Whiteboard & Screenshot Import
Photo or screenshot of any workout source → structured workout ready to log. One tap to confirm, then logging begins.
Sources to support:
	∙	Gym whiteboards (chalk, poor lighting, diagonal writing, smudges)
	∙	Screenshots from coaching apps (TrainHeroic, TrainingPeaks, TrueCoach)
	∙	Instagram posts and coach programming screenshots
	∙	PDF exports from coaches
	∙	Screenshots from group chats
Notation to parse:
	∙	Standard shorthand: 5x3 @80%, 3x10 rest 90s
	∙	CrossFit notation: AMRAP 12, For Time, EMOM 20
	∙	Percentage-based loading: 70% 1RM, @RPE 8
	∙	Supersets and circuits
	∙	Rest periods in various formats
Why this matters strategically:
Removes the biggest adoption barrier for athletes following external programming. Reppit becomes the logging layer on top of any programming source — not a competitor to coaches or other platforms. Athletes following online coaches, a local coach’s whiteboard, or a PDF block can log in Reppit without re-entering anything manually.
Bilingual consideration:
Japanese gym whiteboards mix kanji, katakana, and numbers in non-standard ways. Handling this well is a meaningful differentiator in the Japanese market where no competitor is optimizing for it.
Implementation note:
Built on vision model API (Anthropic or similar). Core challenge is reliable conversion of freeform whiteboard text into structured workout JSON. Worth a dedicated parsing pipeline with sport-specific notation rules rather than a generic OCR approach.

*This document should be updated as the product evolves. When in doubt, return to the North Star: a product genuinely loved by the users who never pay.*