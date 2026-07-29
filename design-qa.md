# Dial Archive Graphic and Sound QA

> QA 캡처와 외부 레퍼런스 이미지는 로컬 검증 자료이며 저장소 용량과 출처 관리를 위해 버전 관리에서 제외한다. 아래 경로는 해당 로컬 작업공간의 증거 위치다.

## 2026-07-29 rotary family and composition pass

- The global route dial, Vault CTA, INDEX record latch, folder action, detail next latch, transition lock, and home half dial now share one black radial face, recessed core, and solid bone-white capsule datum. Role changes scale and information density, not the material anatomy.
- The home half dial is capped at 380px on wide desktop, 300px at tablet scale, and 196px at the smallest audited mobile width. Exactly 50% remains visible at 1980, 1440, 768, and 390px.
- `RECOGNITION LOG` uses a longest-word optical scale. Its title/media bounding boxes do not intersect at any audited width.
- Tablet and mobile use explicit media, project-rail, and information rows. Media/rail and rail/dial intersections are all false after the 768px regression correction.
- The former inline-image manifesto was replaced by a normal-flow editorial split. Heading/media and media/CTA intersections are false at all four widths; mobile order is statement, media, action.
- Ratchet noise gain increased from `0.038` to `0.052` and tooth gain from `0.014` to `0.019`, preserving the existing 32ms rate limit and 24ms transient.
- Natural project-rail clicks reached `aria-valuenow=7` and `RECOGNITION LOG` at 1980, 768, and 390px without pointer interception. TypeScript and the isolated Next.js production build both pass.
- Visual evidence: `qa/rotary-family-home-recognition-wide.png`, `qa/rotary-family-home-recognition-tablet.png`, `qa/rotary-family-home-recognition-mobile.png`, `qa/rotary-family-manifesto-wide.png`, `qa/rotary-family-manifesto-mobile.png`, `qa/rotary-family-index-desktop.png`, `qa/rotary-family-detail-next-desktop.png`.

## 2026-07-29 detail composition pass

- Detail specifications now belong to the project identity column instead of forming a detached page-wide footer rail.
- Korean descriptions use balanced, keep-all wrapping so short semantic endings do not become orphan lines.
- The premise display type is smaller and less tightly tracked; chapter planes use a 3px radius, neutral graphite depth, and one non-glowing active edge.
- The mobile reading order is media, identity, then specifications. No site element overlays that sequence.
- Hidden mobile story media now has a positioned `fill` parent and truthful responsive `sizes`; the browser console no longer emits those image warnings.
- Evidence: `qa/detail-composition-final-1440.png`, `qa/detail-composition-final-390.png`, `qa/detail-premise-composition-final-1440.png`, `qa/detail-story-composition-final-1440.png`.

## 2026-07-29 dial synchronization and route motion

- The dial marker base moved from 24 degrees to the left-center -90 degree datum. Every active project now resolves to that same position and its number remains horizontal.
- ScrollTrigger snaps to exact project detents after free scrolling, keeping scroll progress, rail selection, and dial number on one integer index.
- The ambiguous fixed emissive pointer and rail glow were removed. Active state now relies on type weight and a non-glowing white bar at compact breakpoints.
- Sound is permanently enabled as part of the dial material. The visible START/ON/OFF control and stored preference were removed; audio unlocks on the first valid user gesture.
- Project-open links now close two graphite shutters around a rotating central lock and reopen them after route change. Reduced motion collapses the sequence to a near-instant transition.

## 2026-07-29 subtraction pass

- Home media telemetry was reduced from two surrounding strips to one semantic line containing only project number, title, and source ratio.
- The project CTA no longer renders as a graphite card. Its visual state is carried by one rotary latch and one emissive datum rail.
- The global route text, detail-image number overlay, and lower media category axis were removed because they repeated information already visible in navigation or project identity.
- Large blue scene glows were replaced with neutral silver-grey reflections; cobalt remains state-specific.
- INDEX category controls now form one selection rail instead of five separate rectangular buttons.
- Mobile media begins higher in the first scene while keeping the right dial and project rail in their dedicated functional zones.

## 2026-07-29 Vault instrument polish

- The visible `15°` label was removed. The fixed datum and rail bars now use a white emissive state; cobalt remains reserved for focus and the active engraved number.
- The home primary image aperture measures `822 × 352.4px` at 1440px, roughly 29% wider than the previous 638px frame, with 18px gaps on both sides.
- The thick glass-like bezel and decorative gloss overlays were removed from home, index, and detail primary media. Artwork now meets a 2–3px graphite aperture without internal decorative padding.
- Vault identity is translated by scale: the full functional dial on home, a rotary latch in primary CTAs and category actions, and a route dial in global navigation.
- Micrographics use actual project number, source aspect ratio, record count, and route state on shared baselines; no invented engineering values are shown.
- Axe-core WCAG 2 A/AA reports zero confirmed violations on home, index, and WRGS detail after contrast corrections.
- Final evidence: `qa/vault-system-polish-home-1440.png`, `qa/vault-system-polish-home-390.png`, `qa/vault-system-polish-folder-hover-1440.png`, `qa/nav-detail-diagnostic.png`.

## 2026-07-29 responsive media polish

- Home QA: `qa/responsive-audit-current-1440.png`, `qa/portrait-final-768.png`, `qa/touch-final-390.png`
- Manifesto QA: `qa/manifesto-current-1024.png`, `qa/manifesto-current-768.png`, `qa/manifesto-current-390.png`
- Tested widths: 1440, 1024, 768, 390 CSS px.
- Seven home records preserve their source ratio within 0.002 at desktop and mobile. Preview image padding is `0px`; document horizontal overflow is `0px`.
- The final manifesto line retains 56.3px, 42.2px, and 16px right safety space at 1024, 768, and 390px respectively.
- The right dial keeps 50% of its assembly visible after desktop-to-mobile resize. Entry motion no longer freezes the responsive transform as pixels.
- Portrait media now keeps 8–10px clear of the top tool panel. Project-rail buttons expose 44px touch height while preserving 3px visual marks.
- Work index, detail hero, and story media use source-driven aspect frames with no decorative image padding.

The earlier evidence below remains as interaction and sound history; its positional descriptions are historical and are superseded by this responsive pass.

## Evidence

- Source visual truth: `references/dial-archive-final-target.png`
- User dial reference: `references/pinterest-dial-reference.jpg`
- Broken implementation evidence: `qa/graphic-audit-03-reloaded.png`
- Broken side-by-side comparison: `qa/graphic-audit-comparison-current.png`
- Final desktop implementation: `qa/graphic-audit-desktop-final.png`
- Final selected-project state: `qa/graphic-audit-vibey-final.png`
- Final mobile implementation: `qa/graphic-audit-mobile-final.png`
- Final side-by-side comparison: `qa/graphic-audit-comparison-final.png`
- Source pixels: `1487 x 1058`
- Desktop CSS viewport: `1149 x 863`; captured content: `1149 x 856`; density: `1x`
- Mobile CSS viewport: `390 x 844`; captured content: `380 x 822`; density: `1x`
- State: Korean, dark archive, sound activation and enabled states

## Full-view comparison

The final implementation now preserves the source's visual hierarchy: compact precision header, dedicated project-information column, dominant dark media stage, a narrow next-project rail, and an open calibration arc occupying the lower-left field. The dial was rebuilt around the supplied Pinterest reference with a sparse arc, thin white ticks, numbered white capsules, and one cobalt 15-degree datum.

## Focused comparisons

- The first project state confirms that the basalt media loads at full natural size instead of leaving a black placeholder.
- The VIBEY state confirms that marker selection keeps the title and media below the fixed header, the internal sticky frame remains at `scrollTop: 0`, and light source imagery receives a restrained cinematic treatment.
- The mobile state confirms that title, media, next-project rail, dial, readout, and SOUND control remain visible without horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: Passed. Display weight is stronger and closer to the selected target while metadata, year, instructions, and the sound state remain optically subordinate.
- Spacing and layout rhythm: Passed. The header is shorter, the project information starts higher, the next rail is wider, and the media proportions track the target more closely. No desktop or mobile horizontal overflow was found.
- Colors and visual tokens: Passed. Near-black, graphite, bone white, and a single cobalt signal remain consistent. Light temporary imagery is darkened rather than flashing a white panel during a project transition.
- Image quality and asset fidelity: Passed. Active and adjacent media load directly at their natural dimensions; all inspected images completed successfully. Real source assets remain in use.
- Copy and content: Passed for the current provisional archive. Project records remain isolated from the legacy works model for later replacement.
- Interaction and sound: Passed. Scroll and marker selection update the ARIA slider value; SOUND START handles the browser's required first gesture and then exposes SOUND ON/OFF as a pressed-state control. Four short mechanical ticks are synthesized per project interval with rate limiting.

## Comparison history

### Iteration 1 — blocked

- [P1] The first two priority images never received a usable `currentSrc`, leaving the central media stage as a black rectangle.
- [P1] Clicking a dial marker focused a control inside an `overflow: hidden` stage, scrolling that internal container by `85.5px` and pushing the title and media underneath the fixed header.
- [P2] The dial was small, low, and visually U-shaped rather than matching the supplied open calibration arc.
- [P2] Repeated category letters made project markers read as accidental rather than indexed controls.
- [P2] White-background temporary projects broke the dark cinematic palette when selected.
- [P2] The mobile sound state was clipped below the viewport.

Fixes: bypassed the unreliable local image-optimizer path for archive media, render only the active and adjacent layers, replaced scrollable clipping with `overflow: clip`, rebuilt the tick geometry around an offscreen dial center, changed markers to project numbers, added light-source media treatment, and repositioned the mobile readout.

### Iteration 2 — passed

- The first media image loads from its direct source at `1915px` natural width.
- Marker selection reaches VIBEY while the sticky stage remains aligned and its internal scroll stays at `0`.
- The final source/implementation pair was inspected in one combined comparison image.
- Desktop and mobile have no horizontal overflow and all inspected imagery completes loading.
- SOUND ON/OFF toggles correctly; the delivered page begins with an explicit SOUND START gesture before entering the enabled state.
- Production build, type checking, and static generation pass; browser console reports no errors or warnings.

## Evidence limit

The browser run verifies the audio-control state and user-gesture path but does not produce an objective loudness recording. Final volume and timbre should be judged once by ear on the user's speakers or headphones.

## Final result

final result: passed
