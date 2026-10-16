# Instructor notes · E08 · Waveguides, modes, and resonators

For learners with basic calculus and Python. Explain complex arrows and any needed matrix notation locally; do not assume a previous electromagnetics course.

## Outcomes

- Recognize a guided mode as an eigenfunction with decaying cladding tails.
- Explain directional coupling through relative supermode phase.
- Relate ring resonance, storage, and critical coupling without confusing amplitude and power.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): A guide can support several transverse shapes. If two supported shapes propagate with different phase constants, will their sum keep the same intensity profile?
2. Explore (8 minutes): Vary slab thickness and count supported modes. Request a higher mode, then shrink the guide until that mode no longer exists. Inspect the two-guide model. Predict the complete-transfer length from κ before reading the metric. Set ring r equal to a, then vary only r. Explain why the through-port dip can become shallower even when the resonator still stores light.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Check a mode

Report an effective index, eigen-equation residual, and sensitivity to window size.

**Worked reasoning:** The residual tests the discrete eigenproblem. Enlarging the window checks whether artificial boundaries disturb the physical tail.

### Predict a coupler

Compute the two supermode propagation constants and predict the first complete-transfer distance.

**Worked reasoning:** κ = (βs − βa)/2, so L = π/|βs − βa| for the ideal symmetric two-mode system.

### Track energy storage

Compare through-port power, circulating power, and decay after drive removal.

**Worked reasoning:** Stored power can be larger than incident power through repeated coherent accumulation; decay and dissipation still obey energy balance.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- A guided slab mode’s effective index lies… The core supports transverse oscillation while the cladding tail decays.

- The ideal two-guide transfer length is… A supermode splitting 2κ accumulates a relative phase π at that distance.

- Critical coupling in the displayed ring occurs when… At resonance, equal amplitude self-coupling and round-trip survival cancel the through field.

## Scope

Scalar TE symmetric slab, ncore = 1.50, ncladding = 1.45, λ₀ = 1.55 μm. The coupler and ring are separate reduced models. The ring is an ideal single-bus all-pass resonator with amplitude parameters r and a. No bend radiation, vector effects, or fabrication disorder is included.

Optional extension: Solve the Hermitian finite-difference mode problem, derive κ from double-guide supermodes, and compare mode beating with split-step BPM.
