# Rabbit-Hole — Letter Strings

An interactive recreation of page 9 of *Alice's Adventures in Wonderland*, where
every horizontal line of text is a [Verlet](https://en.wikipedia.org/wiki/Verlet_integration)
string of letters. The page rests in its normal layout, but as your cursor crosses
a line the letters get pushed, sag and fall under gravity, ripple to their
neighbours, then spring back into place.

The whole page scales to fit the viewport (`100svh`), and a live control panel
lets you tinker with the physics in real time.

## Run locally

It's a static site with no build step or dependencies — just open `index.html`
in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Controls

- **Gravity** — how hard letters fall/sag when disturbed
- **Damping** — energy loss; lower settles fast, higher lingers
- **Spring (return)** — how strongly letters snap back to their place
- **Cursor radius** — size of the disturbance zone
- **Cursor push** — how hard the cursor shoves letters
- **Stiffness (iters)** — how rigidly letters keep their spacing

## Files

- `index.html` — markup and control panel
- `styles.css` — page + panel styling
- `script.js` — layout, Verlet physics, controls
