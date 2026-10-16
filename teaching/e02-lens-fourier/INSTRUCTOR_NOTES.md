# Instructor notes · E02 · Why a lens computes a Fourier transform

For learners with basic calculus and Python. Explain complex arrows and any needed matrix notation locally; do not assume a previous electromagnetics course.

## Outcomes

- Convert transverse spatial frequency into a focal-plane coordinate.
- Explain why two Fourier transforms invert an image.
- Predict how Fourier-plane masks change amplitude and phase objects.

## Suggested 45–50-minute sequence

1. Predict (3 minutes): Tilt the incoming plane wave without moving the lens. Which way should the focal spot move? Then predict what a central stop will do to an amplitude image.
2. Explore (8 minutes): Move the tilt through zero. Double focal length and compare the predicted spot displacement while leaving the incoming wave unchanged. Select the amplitude object and no mask. Locate the inverted F, then insert the low-pass aperture and central stop. Switch to the transparent phase object. Its input intensity is uniform. Apply the π/2 phase disk and explain why structure becomes visible.
3. Explain (6 minutes): use the equation and measurement or boundary assumptions to connect the observed changes.
4. Check (3 minutes): ask the three page questions before showing feedback; have learners justify an answer.
5. Compute (20–25 minutes): run the core notebook, alter one parameter, and inspect its numerical checks.
6. Reflect (5 minutes): state one changed prediction, the evidence, and a remaining model limitation.

Use the optional extension for a longer lab rather than rushing the core. The quiz is local and does not collect student responses.

## Assessment and worked reasoning

### Calibrate the Fourier plane

Predict the focal coordinate of a known spatial frequency for two focal lengths.

**Worked reasoning:** Use x_f = λf fₓ with consistent units. The frequency grid and physical focal grid are not the same axis.

### Compare three masks

Save unfiltered, low-pass, and central-stop images with the same intensity scale.

**Worked reasoning:** The mask acts on the complex field spectrum. Squaring after filtering makes coherent image formation nonlinear in input intensity.

### Make phase visible

Compare a weak phase object before and after a central π/2 phase shift.

**Worked reasoning:** The small scattered field interferes differently with the rotated background. Finite disk size and strong phase shifts limit the weak-object interpretation.

## Ten-point rubric

- Prediction and physical reasoning: 2 points.
- Reproducible parameter choices, units, and labelled plots: 3 points.
- Quantitative comparison or numerical validation: 3 points.
- Model limitations and interpretation of disagreement: 2 points.

Grade reasoning and evidence, not an attractive plot alone. Results may vary with a deliberately changed seed or model; require the learner to record it.

## Common misconceptions

- At fixed illumination direction, doubling f makes the focal displacement… The paraxial relation x_f = f sin θ scales linearly with focal length.

- An unfiltered equal-focal-length 4f system produces… Two forward Fourier transforms reverse the spatial coordinates.

- A phase disk reveals a weak phase object mainly by… It changes how background and scattered fields interfere at the camera.

## Scope

Coherent monochromatic scalar illumination, ideal paraxial lenses, and thin Fourier masks. The focal-spot panel uses a Gaussian entrance field. The 4f panel is a periodic sampled field; no aberrations, finite detector pixels, or noise are included.

Optional extension: Compute front-to-back focal-plane propagation with Fresnel operators, inspect residual quadratic phase, and compare the physical output coordinates with FFT-bin labels.
