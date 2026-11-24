# Arcade Stage 1 handoff

The hub and playable Air Hockey are implemented in `src/components/arcade/`.
`Arcade` has both named and default exports. Air Hockey is a separate `next/dynamic`
chunk; the parent is responsible for lazily mounting Arcade on the desktop empty desk.
No integration file, dependency, or supplied `paper-to-alpha.mjs` was changed. No commit.

## Generated art

Six separate built-in ImageGen assets were copied into `_incoming_arcade/stage1_raw/`.
The console used its one allowed retry because the first generation had perspective
inside the icons. All other assets used one generation. No generated image was fed
back into ImageGen. `generation.json` records the source paths and normalized prompt set.

`prepare-art.mjs` invokes the supplied converter unchanged, reconstructs opaque
plastic interiors so the underlying CAD grid cannot show through the playing surface,
retains soft shadow alpha, removes faint background colour variation, trims on alpha
with Sharp, adds 4px padding, and normalizes to the requested longest side.

| Delivered WebP | Pixels | Bytes |
| --- | ---: | ---: |
| hub_console | 1087 × 1600 | 162468 |
| ah_table | 2400 × 1042 | 108088 |
| ah_mallet_orange | 490 × 512 | 34272 |
| ah_mallet_graphite | 492 × 512 | 29654 |
| ah_puck | 476 × 512 | 28260 |
| lcd_panel | 900 × 402 | 24090 |
| **Total** | | **386832 (0.387 MB)** |

## Measured geometry

All fractions reference the final trimmed images, with origin at upper left. The
full precision values, raw pixel evidence, cutout bounds and methods are in `art.json`.
LCDs, tile seams, goals and discs use connected colour components. Rails use median
luminance profiles. A smoothed seam fit measures the rounded corner radius with
0.5672 source-pixel RMS error. The sprite cache corrects slight generated ellipticity
using the independently measured vertical radius, so visible circles fit colliders.

| Region | x | y | width | height |
| --- | ---: | ---: | ---: | ---: |
| Table interior | .0282895 | .0227273 | .9414474 | .8787879 |
| Hub LCD | .1494253 | .1100703 | .7022989 | .1249024 |
| Pinball tile | .1103448 | .2982045 | .3689655 | .2435597 |
| Air Hockey tile | .5229885 | .2982045 | .3689655 | .2435597 |
| Car Crush tile | .1103448 | .5659641 | .3689655 | .2490242 |
| Tanks tile | .5229885 | .5659641 | .3689655 | .2490242 |
| Scoreboard glass | .09 | .2699681 | .8214286 | .5063898 |

Both goal mouths run from y=.3090909 to .6166667. Left slot x=.0269737,
width=.0105263; right slot x=.9618421, width=.0105263. Inner corner radius is
.0605263 of table-image width. Raw playing rectangle is x=171…1602,
y=153…733 in the 1774×887 source. Dark slots were detected at (169,342,16,203)
and (1590,342,16,203). Rounded inner corner radius is 92 source pixels.

| Sprite | Centre x | Centre y | Disc radius / image width |
| --- | ---: | ---: | ---: |
| Orange | .5011274 | .4632829 | .4526494 |
| Graphite | .4994131 | .4661781 | .4559859 |
| Puck | .5013228 | .4514145 | .4576720 |

Game sizing deliberately chooses a mallet diameter of .095 and puck diameter of
.043 of table-image width. Each measured sprite radius maps exactly onto that
physical radius. Shadows do not contribute to collision dimensions.

## Verification

Passed:

```sh
npx tsc --noEmit -p . --tsBuildInfoFile scripts/arcade/typecheck.tsbuildinfo
node --experimental-strip-types scripts/arcade/airhockey-sim.mts
```

The typecheck redirects only its incremental cache into the permitted directory.
The simulation runs 200000 substeps for each of 20 seeds, checks every substep,
and includes randomized mallets, maximum-speed shots and targeted rail-pin,
post-grazing, conceded-serve and countdown-control regressions. It verifies puck
confinement, finite numbers, both goal mouths, mallet half/rink confinement, and
overlap below 1 delivered pixel. Result: **4000000 substeps passed; 612 left goals,
606 right goals; worst overlap 0 pixels**.

Scripted average-player benchmark, 60 full first-to-7 games per difficulty:

| Difficulty | Player wins | AI wins | Timeout | Player win rate |
| --- | ---: | ---: | ---: | ---: |
| Easy | 59 | 1 | 0 | 98.3% |
| Normal | 34 | 26 | 0 | 56.7% |
| Hard | 5 | 55 | 0 | 8.3% |

The benchmark player reacts every 150–210ms, predicts reflected shots with a stable
per-shot aim error, defends and approaches slow pucks from behind. Each match has
a 20-minute simulated safety limit; none reached it. This is a reproducible bot
benchmark, not evidence of actual human win rates. Full results: `sim-results.json`.

The renderer uses one visible 2D canvas, DPR ≤2, 60Hz output scheduling, 240Hz fixed
physics, resize-only sprite caches, six faint trail blits at most, and cached goal
flashes. No Three.js, per-frame filters/shadows, or per-frame React state updates.
Pointer and keyboard control, focus trapping/restoration, scroll lock, Escape,
visibility pause, three difficulties and restart are included. Reduced motion
disables the puck trail and button transition.

## Limits and remaining acceptance

- Aside's local daemon connection was denied by the OS/sandbox (`EPERM` at
  127.0.0.1:21420). No browser tab/session was opened and no alternate browser was
  used. Live browser interactions, viewport screenshots and locked 60fps on a
  MacBook remain **unverified**. `qa-assets.png` is a Sharp asset contact sheet,
  not a browser screenshot. Layout code accounts for the actual nav bottom and
  1280×800 through 2560×1440, but still needs browser acceptance at those sizes.
- ImageGen returned the table at 1774×887 and console at 1086×1448 despite the
  requested larger output. Their trimmed images were upsampled to the requested
  2400/1600 longest sides; these are not native-resolution high-detail renders.
- The generated art follows the approved material/colour/overhead direction, but
  is not an exact reproduction: the console LED is at upper left, labels sit
  inside the tiles, the table is wider in proportion, and the LCD has more top
  bezel. The allowed console retry was already used, so further generations
  were not made. Original generated PNGs are retained for review.
