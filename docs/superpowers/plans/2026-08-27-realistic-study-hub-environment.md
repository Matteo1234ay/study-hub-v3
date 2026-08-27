# Realistic Study Hub Environment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the WebGL Study Hub read as a believable premium study room through realistic materials, lighting, proportions and small environmental details.

**Architecture:** Keep the existing native WebGL2 raymarch renderer and scroll/camera interface. Extend the SDF scene with realistic study objects, introduce material classes with roughness/metallic/emission properties, and add inexpensive soft shadow plus ambient-occlusion terms. Preserve the home view dwell system and reduced-motion behavior.

**Tech Stack:** Vanilla JavaScript ES modules, WebGL2/GLSL ES 3.00, CSS, Node built-in test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-27-realistic-study-hub-environment-design.md`

## Global Constraints

- Native WebGL2 only; no external 3D libraries or paid APIs.
- Preserve GitHub Pages deployment and current CSP.
- Preserve reduced-motion fallback.
- Keep performance suitable for desktop Safari/Chrome; limit raymarch steps and shadow samples.
- Realism must come from geometry, materials and lighting in the interactive renderer.

---

### Task 1: Lock the realism requirements with tests

**Files:**
- Modify: `tests/home-experience.test.js`
- Test: `tests/home-experience.test.js`

**Interfaces:**
- Consumes: source text from `src/home/study-hub-webgl.js` and `styles/home-immersive.css`.
- Produces: regression checks for realistic material vocabulary, soft shadow, ambient occlusion, and real study props.

- [ ] **Step 1: Write the failing test**

```js
test("study hub uses realistic materials and environmental lighting", () => {
  assert.match(webgl, /woodMaterial/);
  assert.match(webgl, /metalMaterial/);
  assert.match(webgl, /glassMaterial/);
  assert.match(webgl, /softShadow/);
  assert.match(webgl, /ambientOcclusion/);
  assert.match(webgl, /warmLamp/);
  assert.match(webgl, /book/i);
  assert.match(webgl, /mug/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: GitHub Actions workflow `Test` after the test-only commit.
Expected: FAIL because the current shader does not yet expose the new material and lighting functions.

- [ ] **Step 3: Commit**

```bash
git add tests/home-experience.test.js
git commit -m "test: require realistic study hub materials"
```

### Task 2: Implement believable study-room geometry and materials

**Files:**
- Modify: `src/home/study-hub-webgl.js`
- Test: `tests/home-experience.test.js`

**Interfaces:**
- Consumes: `mountStudyHubWebGL(canvas,{getJourney})` and existing `cameraJourney` contract.
- Produces: `woodMaterial`, `metalMaterial`, `glassMaterial`, `softShadow`, `ambientOcclusion`, and `warmLamp` shader functions while preserving `mountStudyHubWebGL`.

- [ ] **Step 1: Add real study props and material IDs**

Add SDF geometry for a small book stack and mug on the desk. Keep existing desk, monitor, keyboard, lamp and chair, but assign distinct material IDs for wood, metal, glass/screens, fabric, wall/floor and digital accents.

- [ ] **Step 2: Add material functions**

Implement GLSL helpers named exactly `woodMaterial`, `metalMaterial`, and `glassMaterial` returning believable base colors and shading parameters. Wood should be warm brown, metal neutral gray, glass/screens near-black with restrained cool emission, and fabric dark neutral.

- [ ] **Step 3: Add environmental lighting**

Implement `softShadow` with a short secondary march and `ambientOcclusion` with a few normal-offset samples. Add a `warmLamp` contribution centered near the physical desk lamp and a low-intensity cool screen fill.

- [ ] **Step 4: Keep performance bounded**

Use no more than 132 primary march steps, 20 shadow steps, and 4 AO samples. Keep DPR capped at 1.5.

- [ ] **Step 5: Commit**

```bash
git add src/home/study-hub-webgl.js
git commit -m "feat: render realistic study hub materials and lighting"
```

### Task 3: Publish the new renderer and verify

**Files:**
- Modify: `src/views/home-view.js`
- Modify: `src/app.js`
- Modify: `index.html`
- Test: all Node tests

**Interfaces:**
- Consumes: v9 renderer asset.
- Produces: cache-busted public home experience on GitHub Pages.

- [ ] **Step 1: Bump home renderer import**

Update `src/views/home-view.js` to import `study-hub-webgl.js?v=20260827-9`.

- [ ] **Step 2: Bump app and CSS asset versions**

Update `src/app.js` home import and `index.html` CSS/app query strings to `20260827-9`.

- [ ] **Step 3: Run verification**

Run GitHub Actions `Test` for the final commit.
Expected: completed with `conclusion: success` and zero test failures.

- [ ] **Step 4: Verify Pages deployment**

Check the GitHub Pages workflow for the final commit.
Expected: completed with `conclusion: success` before calling the version live.

- [ ] **Step 5: Commit**

```bash
git add src/views/home-view.js src/app.js index.html
git commit -m "chore: publish realistic study hub v9"
```
