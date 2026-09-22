# Publication Delivery: Ten-Attribute Card

Load only when a real publication result exists and final delivery is ready, or when the user explicitly asks to view/change the card. Do not load before publishing, during asset generation, ordinary development, or failure investigation. Report publication failures and recovery state directly. Reuse this file if already in context; this does not permit omitting the card from the current delivery.

Every successful publication handoff—including first publication, updates to an existing App, and republication after fixes—must include one complete card in the author's conversation. Unchanged attributes must still appear; do not replace them with ‘same as before’. Check values against the current version; a previous card is not evidence that the new version was verified. When a single task publishes several corrective versions, output one card at the final handoff. Use exactly the ten dimensions below. Do not add, remove, or merge dimensions. Include the actual App link and publication status in the heading. Use professional, plain language: a fixed option plus one necessary explanation of actual settings and behavior. This is not a confirmation questionnaire; do not wait for a reply or insert it into the public App by default.

## Ten Dimensions and Options

These are reporting terms, not ten directly configurable Cohub switches. Without evidence, write “To verify”; do not present wishes as implemented. Use “Not applicable” when truly irrelevant; never omit important unknowns.

| Dimension | Fixed options | How to report |
|---|---|---|
| Access | Public / Space members only | Who can open the App. Public pages do not give anonymous visitors generation or data access permissions. |
| Account purpose | No account needed / Identify user / Access personal content / Save personal results / Pay generation costs / Use purchased benefits | Multiple values allowed; “No account needed” excludes others. Describe actual account uses; login does not automatically provide saves, privacy, or payment. Add “Access restricted content” when accounts only support restricted Space access. |
| Authorization trigger points | No authorization needed / On starting use / On generation / On reading content / On saving / On another actual operation | Multiple trigger points allowed. For each, state when, requested permissions, and feature purpose; identify target Spaces/content when different. “No authorization needed” excludes others. Login and purchase are not authorization. Note login prerequisites at the applicable trigger. Report actual behavior without adding authorization. |
| Generation | None / Images / Video / Audio / AI conversations | Multiple values allowed; “None” excludes others. These are visitor-time capabilities, not prepared assets. Split speech/music when helpful. Requires model support, correct authorization, and implementation. |
| Storage | Not saved / Current device / Author's Space / User's Space / External service | Separate uploads, conversations, and results; combinations allowed. Identify actual Space or entry. Generation/login success does not prove saving to the user's Space. A download link alone is not saved content. |
| Cost ownership | Author / User / Split by feature / No paid calls | Actual generation/execution cost, distinct from sales revenue. Explain feature-by-feature allocation; do not infer payer from login, storage, or monetization. |
| Monetization | No charge to users / Usage-based charging / Custom products / Usage-based charging + custom products | Explain charging units or credit consumption; identify purchased benefits such as feature unlocks or credit packs. Combinations must not describe one charge twice. Do not automatically promise subscriptions or revenue sharing. |
| Device support | Desktop / Mobile / Desktop + mobile | Use these three options and actual layout/interaction support; report tested coverage separately. Label design-only intent “Planned, not yet verified.” Cohub container compatibility does not establish App mobile support. |
| Data display bar | Visible / Hidden / Unverified | The top share-page bar displaying Cohub branding, work information, author, version, or visits; actual content depends on the page. Report actual visibility separately from Remix. Explain configuration/display conflicts or inability to inspect. |
| Remix banner | Visible / Visible (remix guidance) / Hidden / Not provided / Unverified | Always retain this field. Explain whether visitors can continue creating from it; guidance is not one-click copying. The checked standard share page has no built-in Remix banner; the data display bar switch does not enable it. Read [Remix banner status](remix-banner-status.md) as needed to verify current version, actual entry, and executable remix path. |

## Read Only When Unclear

When identity/authorization, generation billing, Actions, or storage evidence is insufficient or conflicting, read the relevant section of [Publication attribute verification](publication-attributes.md). Ordinary card filling does not load it or platform capability documents automatically; the capability link is for the user.

## Card Format

Display the complete card using a Markdown heading and table, with blank lines between sections.

Keep all ten rows in order, not five compressed rows. Use consistent terms with short limitations, avoiding jargon. This is an unfilled template, not an actual delivery:

### App name · Actual publication status

Open App: actual returned link

**App custom domain:** `actual-app-link-name`

| Current attribute | This publication |
|---|---|
| Access | Fill from evidence |
| Account purpose | Fill from evidence |
| Authorization trigger points | No authorization needed, or each “Operation → permissions and purpose”; valid existing authorization usually avoids repeat requests |
| Generation | Fill from evidence |
| Storage | Fill from evidence |
| Cost ownership | Fill from evidence |
| Monetization | Fill from evidence |
| Device support | Desktop, Mobile, or Desktop + mobile; explain unknowns |
| Data display bar | Visible / Hidden / Unverified; briefly name information actually shown at the top |
| Remix banner | Actual status and whether visitors can continue creating here; name missing evidence when unverified |

**Verification:** One sentence on tried features/devices and unresolved issues affecting use.

Tell me anytime if you want to change an attribute.

[Explore the full capabilities of Cohub Apps](https://cohub.live/zh/docs/developers/apps)

Use the actual App slug and check it against the returned URL; label it “App custom domain” for the user. Show only the label and actual value on the card, without explanatory annotations. Do not describe this as support for connecting an independent domain. Place this line beside the App link, without adding an eleventh attribute. It refers only to the final App portion of the URL, not the account, Space or domain. Keep the App title separate from its link name; do not change an existing address unasked or promise automatic redirects from old links.

No after-the-fact approval or confirmation button. Implement and reverify requested changes within actual capabilities; the invitation to request changes does not promise every product property can be edited in place. Optional capability suggestions are limited to one sentence and must not claim unintegrated capabilities. Before formal adoption, assess the card's accuracy and readability in real publishing scenarios.

Authorization example, only when true: “On first generation: request generation and result-read permissions to create images. On first saving to a personal Space: request write permission for that Space to save work. Signed-out users log in first; valid authorization is reused.” Request related necessary permissions together for one complete operation to reduce interruption, not unrelated permissions in advance. List genuinely independent feature trigger points without merging or changing the original flow just to simplify the card.

## Existing Design and Later Uses

The ten attributes describe the actual delivery, not a new design the user must accept. Preserve agreed behavior. Identify concrete mismatches between promises and behavior and how to fix them; do not rewrite the card to hide defects.

Only with a relevant benefit, add one optional direction after the card: generation, storage, monetization, or operations according to the user's goal, clearly marked as not integrated. Do not routinely promote generation or charging, load all instructions to show alternatives, or add dimensions. Keep the full-capabilities link. Load the selected module only after the user chooses it.
