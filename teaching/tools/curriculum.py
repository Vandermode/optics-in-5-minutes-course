"""Authored lesson content and experiment controls; build_course.py renders it."""

def slider(id, label, low, high, step, unit="", digits=0, help=""):
    return dict(id=id, label=label, type="range", min=low, max=high, step=step,
                unit=unit, digits=digits, help=help)

def select(id, label, pairs, help=""):
    return dict(id=id, label=label, type="select",
                options=[dict(value=a, label=b) for a, b in pairs], help=help)

def question(prompt, choices, answer, explanation):
    return dict(prompt=prompt, choices=choices, answer=answer, explanation=explanation)

def preset(label, **values):
    return dict(label=label, values=values)

PROP = ("TU Delft · Wavefield propagation", "https://qiweb.tudelft.nl/aoi/wavefieldpropagation/wavefieldpropagation/")
FFT = ("NumPy · Fourier transforms and normalization", "https://numpy.org/doc/stable/reference/routines.fft.html")
MODULES = [
dict(id="E01", slug="e01-angular-spectrum", title="The angular spectrum method",
     headline="A field spreads.<br><em>Its plane waves do not.</em>",
     deck="Follow a slit field into space by changing the representation: separate its directions, advance their phases, and add them back.",
     prerequisites=[], goals=["Interpret a Fourier coefficient as a plane-wave amplitude.",
         "Predict how wavelength, aperture width, and distance change diffraction.",
         "Separate physical evanescent decay from numerical aliasing and wrap-around."],
     defaults=dict(wavelength=550, width=2, distance=8, padding="double", method="asm"),
     controls=[slider("wavelength","Wavelength",400,700,10,"nm"),slider("width","Slit width",.3,6,.1,"μm",1),
               slider("distance","Propagation distance",0,60,.5,"μm",1),
               select("padding","FFT window",[("double","Double-width zero padding"),("none","Original periodic window")]),
               select("method","Propagation model",[("asm","Exact scalar angular spectrum"),("fresnel","Paraxial Fresnel")])],
     presets=[preset("At the aperture",distance=0),preset("A narrow slit",width=.5,distance=10),
              preset("Inspect wrap-around",width=.6,distance=60,padding="none")],
     prediction="Keep the wavelength fixed. If you halve the slit width, will the distant central band become narrower or wider? Explain before moving a control.",
     intro="""<p>A slit removes part of an incident wave. Immediately after the opening, the field is bright in a narrow strip. Farther away, bright and dark bands appear outside that strip. Straight rays alone cannot explain the pattern: contributions from different parts of the opening interfere.</p>
<p>Write one monochromatic field as U(x) = A(x)e<sup>iφ(x)</sup>. A complex number is an arrow: its length is amplitude, its angle is phase. The physical electric field is the real part of this slowly described amplitude multiplied by e<sup>−iωt</sup>. A camera averages the rapid oscillation and records a quantity proportional to |U|². Consequently, equal intensities do not imply equal fields.</p>
<p>A plane wave has a particularly simple transverse profile, e<sup>ikₓx</sup>. Its phase increases by kₓ radians per unit distance in x. A Fourier transform tells us how much of each such profile is present. These coefficients are complex amplitudes, so we must retain their phases when rebuilding the field.</p>
<div class="equation">k = 2π/λ &nbsp; · &nbsp; kₓ = 2πfₓ &nbsp; · &nbsp; kₓ² + k_z² = k²</div>
<p>The last relation is the scalar Helmholtz equation evaluated on a plane wave. It links a transverse frequency to a longitudinal propagation constant. For a propagating component, sin θ = kₓ/k. Thus a spatial-frequency plot is also a map of propagation directions.</p>""",
     steps=["Start at z = 0 and confirm that the output reproduces the input slit. Then advance z while watching both the intensity and complex-field plots.",
            "Compare widths 2 μm and 1 μm at the same distance. A narrower opening requires a broader range of transverse frequencies; their interference spreads farther.",
            "Use the narrow-slit preset, then compare padded and original windows at long distance. Change only padding: it changes the numerical boundary, not the physical slit."],
     theory="""<h2>Propagation becomes multiplication.</h2>
<p>In homogeneous space, the plane-wave components evolve independently. Moving forward by z multiplies one coefficient by H = e<sup>ik_zz</sup>. The spatial field changes shape because different directions acquire different phases, even though each individual plane wave keeps its shape.</p>
<div class="equation">U(x,z) = F<sup>−1</sup>{ F[U(x,0)] · e<sup>iz√(k²−kₓ²)</sup> }</div>
<p>When |kₓ| exceeds k, take k_z = i√(kₓ²−k²), choosing the branch that decays away from the source. The multiplier is then a decreasing real exponential. This is an evanescent component, not a propagating wave that has been stopped by an aperture. Recovering it by backward exponential amplification would be extremely sensitive to noise.</p>
<p>For small angles, expand the square root: k_z ≈ k − kₓ²/(2k). That is the Fresnel approximation. It can be excellent for narrow angular spectra but does not represent the evanescent branch. Switching the model is a physical approximation; increasing the grid size is a numerical refinement. The notebook lets you vary these independently.</p>
<h3>The FFT adds an implicit boundary condition.</h3>
<p>A discrete FFT describes a periodically repeated window. If the diffracted field reaches the edge, it can re-enter from the opposite side. Zero padding separates the copies. Padding does not create higher spatial resolution: the sample spacing still sets the Nyquist frequency. To include the entire propagating band at normal scalar sampling, Δx ≤ λ/2 is sufficient; evanescent structure can require still smaller spacing.</p>
<p>For a spectrum containing only propagating components, |H| = 1, so the discrete field norm is conserved. A slit also contains evanescent frequencies, whose squared amplitudes decay. The power ratio on this page refers to the complete FFT grid, not just the visible central crop, and is an intensity norm rather than a rigorous vector-field flux measurement.</p>""",
     extension="Build a 2D propagator, compare exact and paraxial transfer functions on the same grid, and repeat with smaller pixels and larger padding.",
     limits="Scalar, monochromatic propagation in homogeneous free space. The slit is a 1D field invariant in the omitted direction. No vector polarization, material boundary scattering, detector averaging, or noise is modeled. FFT windows are periodic.",
     quiz=[question("At fixed wavelength, halving a slit’s width generally makes its far-field central band…",["Narrower","Wider","Unchanged"],1,"The field needs a broader transverse-frequency spectrum. The distant angular spread increases."),
           question("Doubling zero padding at fixed pixel spacing primarily…",["Moves periodic copies farther apart","Doubles the highest represented frequency","Changes the optical wavelength"],0,"Padding enlarges the computational window. Nyquist is still 1/(2Δx)."),
           question("For an evanescent component propagated forward, H is…",["A unit-magnitude phase rotation","An exponentially decreasing factor","A growing source term"],1,"The outgoing square-root branch has positive imaginary k_z, so e^(i k_z z) decays.")],
     exercises=[("Compare two widths","Predict the ratio of far-field angular widths, then measure their first minima or central-band widths.","Halving the slit width doubles the ideal far-field angular scale; a finite-distance pattern need not obey the far-field estimate exactly."),
                ("Separate numerical errors","Change padding and sample spacing independently. Explain which fixes wrap-around and which extends Nyquist.","Padding separates periodic replicas; smaller pixels represent higher spatial frequencies. Neither replaces checking convergence."),
                ("Test an eigenfunction","Propagate a single Fourier-grid plane wave and compare it with its analytic phase factor.","A grid-aligned plane wave keeps its transverse shape. Its coefficient gains e^(i k_z z), and its norm stays constant when k_z is real.")],
     refs=[PROP,FFT]),
dict(id="E02", slug="e02-lens-fourier", title="Why a lens computes a Fourier transform",
     headline="A direction enters.<br><em>A position lights up.</em>",
     deck="A lens sorts plane waves into focal spots. A second lens turns that spectrum back into an image—and lets you edit it along the way.",
     prerequisites=["E01"],goals=["Convert transverse spatial frequency into a focal-plane coordinate.",
         "Explain why two Fourier transforms invert an image.","Predict how Fourier-plane masks change amplitude and phase objects."],
     defaults=dict(wavelength=550,focal=10,tilt=10,object="amplitude",mask="none",cutoff=.08),
     controls=[slider("wavelength","Wavelength",400,700,10,"nm"),slider("focal","Focal length",5,25,1,"mm"),
               slider("tilt","Plane-wave tilt",-25,25,1,"mrad"),
               select("object","4f object",[("amplitude","Amplitude letter F"),("phase","Transparent phase letter F")]),
               select("mask","Fourier-plane mask",[("none","No mask"),("low","Low-pass aperture"),("high","Central stop"),("phase","π/2 phase disk")]),
               slider("cutoff","Filter radius",.02,.3,.01,"cycles/pixel",2,help="Used by the low-pass aperture and central stop. The phase disk spans 1.5 FFT bins.")],
     presets=[preset("Blur the object",mask="low",cutoff=.04),preset("Keep the edges",mask="high",cutoff=.04),
              preset("Reveal a phase object",object="phase",mask="phase")],
     prediction="Tilt the incoming plane wave without moving the lens. Which way should the focal spot move? Then predict what a central stop will do to an amplitude image.",
     intro="""<p>A plane wave is a direction with a phase. A finite lens collects only a limited patch of that wave, so it produces a finite focal spot rather than a mathematical point. Change the wave’s direction and the spot moves. The focal plane therefore turns an angular spectrum into a spatial pattern you can inspect.</p>
<div class="equation">x_f = λf fₓ ≈ f sin θ</div>
<p>Here f is focal length, fₓ is transverse spatial frequency in cycles per unit length, and x_f is position in the focal plane. This relation belongs to the paraxial Fourier model. Doubling f doubles the spot displacement and also broadens the diffraction scale of a fixed entrance aperture. A larger picture in that plane does not create new information.</p>
<p>Why a Fourier transform? Free propagation contains a quadratic phase, often called a chirp. A thin paraxial lens supplies the opposite quadratic phase. At the focal distance, one quadratic term cancels and the remaining cross term is the Fourier kernel. Placing the object in the front focal plane removes an additional coordinate-dependent phase, giving the standard front-to-back focal-plane transform.</p>
<p>This page separates two demonstrations. The upper curve has physical wavelength, focal length, and tilt units. The sampled letter experiment below uses dimensionless pixel coordinates so that you can inspect Fourier filtering without confusing image sampling with magnification.</p>""",
     steps=["Move the tilt through zero. Double focal length and compare the predicted spot displacement while leaving the incoming wave unchanged.",
            "Select the amplitude object and no mask. Locate the inverted F, then insert the low-pass aperture and central stop.",
            "Switch to the transparent phase object. Its input intensity is uniform. Apply the π/2 phase disk and explain why structure becomes visible."],
     theory="""<h2>Filter the field before you square it.</h2>
<p>A 4f system has two lenses and a shared Fourier plane. The first lens produces the object’s complex spectrum. A mask multiplies that spectrum. The second lens applies another forward Fourier transform, returning an inverted spatial field. The camera finally records its squared magnitude.</p>
<div class="equation">U_out ∝ F{ M · F[U_in] } &nbsp; · &nbsp; I_out = |U_out|²</div>
<p>With no mask, two transforms map x to −x, apart from coordinate scaling and overall phase. A low-pass mask keeps only slowly varying field components and spreads sharp edges. A central stop removes low frequencies, including much of the smooth background. The remaining field often emphasizes changes, but its recorded intensity is not simply the signed derivative of the original picture.</p>
<h3>A transparent object can still change light.</h3>
<p>A thin phase object multiplies the field by e<sup>iφ(x,y)</sup>. Its intensity may be uniform even when φ varies. For a weak object, e<sup>iφ</sup> ≈ 1 + iφ: an unscattered background and a small scattered contribution are approximately a quarter-cycle apart. Their first-order intensity contrast is then small.</p>
<p>A small phase disk near the Fourier origin changes the phase of the background relative to the scattered field. Their interference can turn phase variation into visible intensity contrast. The disk does not read an absolute optical phase; it creates a relative-phase measurement. Its finite size also affects low-frequency scattered components, so the resulting image is not an exact quantitative phase map.</p>
<h3>Coordinates are part of the algorithm.</h3>
<p>For an N-point input sampled at Δx, Fourier bins are separated by Δfₓ = 1/(NΔx). In the focal plane, Δx_f = λf/(NΔx). Relabeling the FFT with the input coordinates is a common mistake. The notebook checks this scaling and the reversal explicitly, then examines how quadratic phases can be undersampled.</p>""",
     extension="Compute front-to-back focal-plane propagation with Fresnel operators, inspect residual quadratic phase, and compare the physical output coordinates with FFT-bin labels.",
     limits="Coherent monochromatic scalar illumination, ideal paraxial lenses, and thin Fourier masks. The focal-spot panel uses a Gaussian entrance field. The 4f panel is a periodic sampled field; no aberrations, finite detector pixels, or noise are included.",
     quiz=[question("At fixed illumination direction, doubling f makes the focal displacement…",["Half as large","Twice as large","Independent of f"],1,"The paraxial relation x_f = f sin θ scales linearly with focal length."),
           question("An unfiltered equal-focal-length 4f system produces…",["The spatially inverted field","Only the object’s intensity spectrum","A universally sharper object"],0,"Two forward Fourier transforms reverse the spatial coordinates."),
           question("A phase disk reveals a weak phase object mainly by…",["Adding photons at the edges","Changing a relative phase before interference","Measuring the optical carrier directly"],1,"It changes how background and scattered fields interfere at the camera.")],
     exercises=[("Calibrate the Fourier plane","Predict the focal coordinate of a known spatial frequency for two focal lengths.","Use x_f = λf fₓ with consistent units. The frequency grid and physical focal grid are not the same axis."),
                ("Compare three masks","Save unfiltered, low-pass, and central-stop images with the same intensity scale.","The mask acts on the complex field spectrum. Squaring after filtering makes coherent image formation nonlinear in input intensity."),
                ("Make phase visible","Compare a weak phase object before and after a central π/2 phase shift.","The small scattered field interferes differently with the rotated background. Finite disk size and strong phase shifts limit the weak-object interpretation.")],
     refs=[("MIT OpenCourseWare · Spatial filtering and lens transforms","https://ocw.mit.edu/courses/2-71-optics-spring-2009/resources/lecture-18-spatial-filtering-lens-transfer-functions-transforms/"),PROP,FFT]),
dict(id="E04",slug="e04-coherence",title="Coherence and what a camera averages",
     headline="Fields always add.<br><em>What survives the exposure?</em>",
     deck="Connect interference, source bandwidth, source size, and speckle through one measurement: the time-averaged squared field.",
     prerequisites=["E01","E03"],goals=["Explain intensity addition as a consequence of averaged cross terms.",
         "Distinguish temporal coherence, spatial coherence, and fixed spatial randomness.",
         "Use mutual intensity and coherent modes to propagate partially coherent light."],
     defaults=dict(phase=0,jitter=0,bandwidth=5,delay=0,angle=0,baseline=30,balance=1,patterns=1,realizations="independent"),
     controls=[slider("phase","Relative phase",-180,180,5,"°"),slider("jitter","Uniform phase half-range",0,360,10,"°",help="Relative phase samples span ± this angle during an exposure."),
               slider("bandwidth","Frequency standard deviation",0,30,1,"THz"),slider("delay","Path delay",0,100,2,"fs"),
               slider("angle","Full angular source width",0,30,1,"mrad"),slider("baseline","Slit baseline",5,100,5,"μm"),
               slider("balance","Second beam intensity",.1,1,.1,"× first",1),slider("patterns","Patterns averaged",1,64,1),
               select("realizations","Speckle realizations",[("independent","Different independent patterns"),("same","Repeat the same fixed pattern")])],
     presets=[preset("Full phase washout",jitter=180),preset("Bandwidth and delay",bandwidth=15,delay=40),
              preset("An extended source",angle=18,baseline=30),preset("Smooth independent speckle",patterns=32),
              preset("Repeat one pattern",patterns=32,realizations="same")],
     prediction="A rough wall has random phase delays at different positions. Does that guarantee a smooth camera image? Decide whether those phases must also change during the exposure.",
     intro="""<p>Two electric fields superpose whether they are coherent or not. What changes is the detector’s average. For two scalar fields with the same polarization, expanding their squared sum exposes the term responsible for interference.</p>
<div class="equation">I = ⟨|U₁ + U₂|²⟩ = I₁ + I₂ + 2 Re⟨U₁U₂*⟩</div>
<p>The brackets describe the variations sampled by the measurement. A relative phase that remains stable can leave a nonzero cross term. Phases that explore a full circle uniformly make that term vanish. Partial averaging gives intermediate contrast. The physical rule remains field superposition; adding intensities is the result of zero cross correlation.</p>
<p>Normalize the correlation as γ = ⟨U₁U₂*⟩/√(I₁I₂). Its magnitude lies between zero and one. Fringe visibility is V = (Imax − Imin)/(Imax + Imin). For the scalar model here, V = 2√(I₁I₂)|γ|/(I₁+I₂). Only equally bright, polarization-matched beams give V = |γ|. Poor contrast alone is therefore not enough to diagnose low coherence.</p>
<p>The controls describe several independent averages in a deliberately separable toy model. Phase jitter changes the relative phase during an exposure. Bandwidth and delay compare a wave with a delayed copy. Angular source width averages shifted fringe patterns. The speckle panel is a separate experiment showing which patterns were actually averaged.</p>""",
     steps=["Set all coherence-reducing controls to zero. Reduce the second beam’s brightness: visibility falls even though the relative phase is stable.",
            "Restore equal beams. Vary bandwidth at nonzero delay, then vary source width at fixed bandwidth. Identify which experimental filter would reverse each change.",
            "Average 32 independent speckle patterns, then repeat one fixed pattern 32 times. Explain the difference using the detector average rather than the word random alone."],
     theory="""<h2>Two kinds of selection, two kinds of correlation.</h2>
<p>Temporal coherence compares field samples separated in time. In a stationary source, different frequencies contribute different phase rotations when one interferometer arm is delayed by τ. The normalized field correlation is the Fourier transform of the power spectrum. For a Gaussian frequency distribution of standard deviation σν, its magnitude is exp[−(2πσντ)²/2]. A spectral filter narrows that distribution and lengthens the delay range over which interference survives.</p>
<p>Spatial coherence compares field samples at different positions. Each source point can illuminate both slits and interfere with itself. Independent source points contribute intensities to the camera. Their illumination angles shift the fringes, so an extended source averages shifted copies. For the small-angle, uniform angular strip used here, γ = sinc(Θd/λ), where Θ is its full angular width and sinc(x) = sin(πx)/(πx).</p>
<p>A pinhole selects angles and usually discards flux; it does not narrow the optical spectrum. A spectral filter selects frequencies; it does not automatically make an extended source spatially coherent. The negative lobes of sinc shift the fringes by π. They are not negative intensities, and the first zero is not a permanent hard cutoff.</p>
<h3>Why random phase can make visible speckle.</h3>
<p>A stationary rough surface imposes irregular spatial phases. Under stable coherent illumination, those contributions still interfere consistently during an exposure, producing fixed bright and dark grains. Spatial randomness alone does not wash them out. Contrast decreases when the measurement combines different sufficiently independent patterns, polarizations, wavelengths, or unresolved grains.</p>
<p>For resolved, fully developed, single-polarization speckle, contrast C = σI/⟨I⟩ is approximately one. Averaging N independent equal-weight patterns gives C ≈ 1/√N. Repeating one pattern provides no such benefit. A finite image and correlated samples make a measured contrast fluctuate around that ideal prediction.</p>
<h3>One matrix carries all pairwise information.</h3>
<p>Mutual intensity is Jᵢⱼ = ⟨UᵢUⱼ*⟩. Its diagonal is intensity, but its off-diagonal correlations affect what happens after propagation. J is Hermitian and positive semidefinite. Its eigenvectors are coherent modes and its nonnegative eigenvalues are their powers. Propagate each mode through the same linear field operator and sum its weighted intensity. The notebook checks this against direct independent-source averaging and shows how to measure truncation error.</p>""",
     extension="Build a mutual-intensity matrix from independent source angles, diagonalize it, and compare full and truncated coherent-mode propagation.",
     limits="Stationary scalar, same-polarization fields; small-angle uniform angular source; Gaussian frequency spectrum. The product of temporal, spatial, and jitter correlations assumes separable independent effects. Speckle uses circular complex Gaussian fields filtered by a finite pupil.",
     quiz=[question("The same stationary speckle pattern is added 64 times. Its normalized contrast…",["Falls by eight","Stays the same","Must become zero"],1,"A repeated realization has perfectly correlated intensities. The independent-pattern averaging rule does not apply."),
           question("A pinhole primarily changes…",["The selected illumination angles","The source frequency bandwidth","The camera’s optical carrier frequency"],0,"It selects spatial/angular contributions and loses flux. A spectral filter performs a different selection."),
           question("Two beams show V = 0.5. This proves |γ| = 0.5 only if…",["Their wavelengths are visible","Their intensities are equal and polarizations match","Their source is a laser"],1,"Brightness imbalance and polarization mismatch also reduce visibility.")],
     exercises=[("Diagnose low visibility","Produce the same fringe visibility using intensity imbalance and phase averaging. Explain how to distinguish them.","Measure each beam separately and check polarization before interpreting visibility as |γ|."),
                ("Audit the averaging law","Compare fixed and independent realizations at N = 1, 4, 16, 64.","Only independent equal-weight patterns give the ideal 1/√N scaling; finite fields give sampling variation."),
                ("Propagate correlations","Compare direct source averaging with a full coherent-mode decomposition, then retain fewer modes.","The complete decompositions agree. Retained power and output intensity error should both be reported; a high retained-power fraction alone does not bound every pixel’s relative error.")],
     refs=[("MIT OpenCourseWare · Coherent and incoherent imaging","https://ocw.mit.edu/courses/2-71-optics-spring-2009/resources/lecture-22-coherent-and-incoherent-imaging/"),
           ("Singer & Vartanyants · Coherent-mode propagation","https://arxiv.org/abs/1108.6008"),
           ("Goodman · Statistical properties of laser speckle","https://opg.optica.org/josa/abstract.cfm?uri=josa-66-11-1145")]),
dict(id="E05",slug="e05-phase-problem",title="Holography and the phase problem",
     headline="A camera loses phase.<br><em>A reference leaves clues.</em>",
     deck="Turn a phase difference into measurable fringes, recover a complex field from a sideband, and learn what iterative constraints can—and cannot—determine.",
     prerequisites=["E01","E02","E04"],goals=["Expand a hologram into its background and interference terms.",
         "Choose a carrier and Fourier crop that isolate the desired field.","Distinguish reference-based recovery from iterative phase retrieval and its ambiguities."],
     defaults=dict(carrier=32,radius=9),
     controls=[slider("carrier","Reference carrier",0,70,1,"FFT bins",help="The sampled object has radius B = 8 bins; Nyquist is 64 bins."),
               slider("radius","Sideband crop radius",3,18,1,"FFT bins",help="A small crop removes object frequencies; a large crop may admit unwanted terms.")],
     presets=[preset("Isolated sideband",carrier=32,radius=9),preset("Terms overlap",carrier=16,radius=9),
              preset("Carrier aliases",carrier=60,radius=9),preset("Crop away detail",carrier=32,radius=3)],
     prediction="A transparent object can change phase while leaving its in-focus intensity nearly uniform. What extra field would make that phase affect a camera reading?",
     intro="""<p>A camera usually records time-averaged intensity, not the complex amplitude U = A e<sup>iφ</sup>. Many fields therefore share the same camera image. A constant phase rotation changes U but not |U|². For a thin transparent sample, the phase delay is approximately φ = (2π/λ₀)Δn h, linking phase to optical thickness rather than absorption.</p>
<p>Holography introduces a known coherent reference R. Its interference with U makes the measurement sensitive to their relative phase. Expanding the measured intensity is the essential first step: it tells us which parts of the data contain the desired field.</p>
<div class="equation">|U + R|² = |U|² + |R|² + UR* + U*R</div>
<p>An untilted reference leaves these terms overlapping in frequency space. A tilted reference R = A<sub>r</sub>e<sup>i2πf_cx</sup> shifts the two cross terms in opposite directions. The Fourier transform of the real hologram then contains a central background and two conjugate sidebands. Isolating one sideband can recover a complex field, even though the camera recorded only a real intensity.</p>
<p>The simulated object on this page is explicitly band-limited to radius B = 8 Fourier bins. This makes the sampling conditions testable rather than merely visual. The known reference fixes amplitude and phase conventions, so the displayed reconstruction error can be compared directly with the input field.</p>""",
     steps=["Use the isolated-sideband preset and compare the known and reconstructed phases. Check the numerical field error rather than judging the colours alone.",
            "Reduce the carrier until the sideband overlaps the central term. Keep the crop fixed and explain why translating the crop cannot remove mixed information.",
            "Restore the carrier and shrink the crop. Then increase the carrier toward Nyquist. Distinguish lost bandwidth from aliasing."],
     theory="""<h2>Separation and sampling have to hold together.</h2>
<p>If U has bandwidth B, its intensity |U|² can extend to 2B. The sideband centred at f_c occupies approximately f_c ± B along the carrier direction. To separate it from the central term, use f_c &gt; 3B. To keep it inside the sampled band, also require f_c + B &lt; f_Nyquist. A real object with spectral tails needs margins rather than relying on exact compact support.</p>
<p>The reconstruction here selects the negative-carrier term UR*, translates it to zero frequency, takes an inverse FFT, and divides by the reference amplitude. Selecting the other island gives the conjugate field unless the convention is adjusted. An arbitrary global phase remains unobservable if the reference phase itself is unknown. Once a field is recovered, the propagation operator from E01 can numerically refocus it.</p>
<h3>Without a reference, constraints do the work.</h3>
<p>Phase retrieval starts from measurements such as a Fourier magnitude and assumptions such as a known spatial amplitude or support. Gerchberg–Saxton alternates between planes: propagate, replace the magnitude with the measured value while keeping phase, propagate back, and impose the other constraint.</p>
<div class="equation">U → F[U] → measured magnitude + current phase → F<sup>−1</sup> → object constraint</div>
<p>Each projection satisfies one condition, but their combination is a nonconvex problem. A small residual does not automatically prove a unique or correct object. Depending on the experiment, shifts, conjugate inversion, or global phase can leave measurements unchanged. Multiple initializations can stagnate at different solutions. Additional distances, known references, or scanning diversity add information rather than merely iterations.</p>
<p>The same loop can design a phase-only hologram by replacing a measured magnitude with a desired output magnitude. That is a synthesis problem: the target may not be exactly reachable under a fixed input amplitude. The notebook reports residuals and compares starts instead of promising exact convergence.</p>""",
     extension="Numerically refocus a recovered field, compare several Gerchberg–Saxton initializations, and design a phase-only two-spot hologram.",
     limits="Coherent, stable, monochromatic scalar fields and a known plane-wave reference. The browser uses a periodic, noiseless, explicitly band-limited object and integer-bin carriers. Real detectors add noise, finite pixels, nonuniform reference amplitude, and calibration errors.",
     quiz=[question("Why tilt the reference?",["To move the cross terms away from the central spectrum","To make the camera directly measure complex numbers","To remove the need for sampling"],0,"The carrier shifts the cross terms, allowing a Fourier filter to isolate one."),
           question("Increasing the carrier without limit eventually…",["Always improves recovery","Aliases the sideband across Nyquist","Eliminates all phase ambiguities"],1,"The sideband’s outer edge must remain inside the sampled frequency range."),
           question("A phase-retrieval run reaches a small magnitude residual. That guarantees…",["The unique physical object","Agreement with that measured magnitude, within the residual","Freedom from global phase ambiguity"],1,"Uniqueness requires sufficient data and appropriate assumptions; magnitude agreement alone is weaker.")],
     exercises=[("Budget the spectrum","For B = 8 and Nyquist = 64 bins, identify a safe carrier interval and explain both bounds.","Use 24 < f_c < 56 bins before adding practical margins. The crop must contain B without admitting central or conjugate terms."),
                ("Compare crops","Reconstruct with a crop smaller than, equal to, and larger than the object bandwidth.","A small crop smooths the field. An unnecessarily large crop can collect unwanted terms; colour similarity is not a quantitative error test."),
                ("Test an ambiguity","Rotate a candidate field by a constant phase and compare its Fourier magnitude.","The magnitude is unchanged. Phase-sensitive comparisons should align global phase when no known reference fixes it.")],
     refs=[("Latychevskaia · Iterative phase retrieval for digital holography","https://arxiv.org/abs/1911.07214"),PROP,FFT]),
dict(id="E06",slug="e06-flat-optics",title="Flat optics and wrapped phase",
     headline="Remove full turns.<br><em>Keep the focus.</em>",
     deck="A thin element controls phase through height. Wrapping that phase makes a shallow optic, while quantization and colour reveal the price of the simplification.",
     prerequisites=["E01","E02"],goals=["Convert physical height into a phase delay.",
         "Explain why phase wrapping is equivalent at one design wavelength.","Quantify staircase efficiency and identify when the thin-element model fails."],
     defaults=dict(wavelength=550,distance=120,levels="0"),
     controls=[slider("wavelength","Illumination wavelength",400,700,10,"nm"),slider("distance","Observation distance",70,190,2,"μm"),
               select("levels","Fabricated phase levels",[("0","Continuous wrapped profile"),("2","2 levels"),("4","4 levels"),("8","8 levels"),("16","16 levels")])],
     presets=[preset("Design wavelength",wavelength=550,distance=120,levels="0"),preset("Two-level fabrication",levels="2"),
              preset("Blue illumination",wavelength=450),preset("Red illumination",wavelength=650)],
     prediction="A glass profile delays light by exactly one full phase turn at 550 nm. If you remove that height, will the device remain equivalent at 450 nm?",
     intro="""<p>A transparent material slows the phase of a wave relative to the surrounding medium. In the thin-element approximation, each transverse location supplies a local multiplier. For glass of refractive index n in air, a height h gives a phase delay φ = (2π/λ₀)(n − 1)h. This model ignores light coupling sideways while it passes through the structure.</p>
<div class="equation">U_out(x) = U_in(x)e<sup>iφ(x)</sup> &nbsp; · &nbsp; h₂π = λ₀/(n − 1)</div>
<p>A lens makes different parts of an incoming wave arrive in phase near a focus. A paraxial lens has a quadratic phase profile. Adding or subtracting an integer multiple of 2π at any location leaves its complex multiplier unchanged. Cutting away full-height phase turns therefore creates a wrapped lens, or kinoform, with a much smaller maximum height.</p>
<p>The demonstration uses a 1D lens cross-section in nondispersive glass with n = 1.5. Its design wavelength is 550 nm, so one full turn corresponds to 1.10 μm of glass. The unwrapped and continuous wrapped profiles produce the same field at that wavelength under the stated thin-element model. Their geometrical shapes are different, but their complex transmissions are equal.</p>
<p>That equivalence concerns a specified wavelength and model. It does not say that two fabricated structures scatter identically under Maxwell’s equations, nor that they remain equivalent across a broad spectrum.</p>""",
     steps=["At 550 nm, compare the unwrapped and continuous wrapped focal profiles using the same incident-intensity scale.",
            "Keep wavelength fixed and reduce the number of phase levels. Inspect how energy leaves the intended focal order.",
            "Restore a continuous wrapped surface and change wavelength. Compare the axial focus curves of the two physical profiles, then move the observation plane to the new peak."],
     theory="""<h2>A staircase is an approximation to a rotation.</h2>
<p>Fabrication often offers a finite set of heights. An N-level staircase approximates a smooth phase ramp with N constant phases. Contributions intended to add in one diffraction order are then slightly misaligned. Some power goes to other orders even if the element itself has no absorption.</p>
<div class="equation">η₁ = sinc²(1/N), &nbsp; sinc(x) = sin(πx)/(πx)</div>
<p>This expression is the scalar first-order efficiency of an ideal, uniformly quantized, full-2π blazed phase grating at its design wavelength. It gives about 41%, 81%, 95%, and 99% for 2, 4, 8, and 16 levels. It is a useful reference for local kinoform zones, not a complete prediction of a finite lens’s throughput, fabrication loss, or focal encircled energy.</p>
<h3>Colour changes the meaning of a removed turn.</h3>
<p>A removed thickness h₂π at λ₀ produces a phase of 2πλ₀/λ at another wavelength if n is constant. That is generally not an integer turn. The wrapped surface therefore changes its interference pattern with colour. In the paraxial design order, its focus follows approximately f(λ) = f₀λ₀/λ. Longer wavelengths focus closer to the element in this model.</p>
<p>The unwrapped profile here uses a constant refractive index, so its geometrical focusing power is nearly wavelength-independent; diffraction spot size still changes. Real glass is dispersive. The notebook keeps this distinction explicit so that material dispersion is not confused with the stronger wavelength dependence caused by phase wrapping.</p>
<h3>When local phase is insufficient.</h3>
<p>The thin-element approximation treats columns independently. Steep sidewalls, wavelength-scale features, reflection, polarization dependence, and resonances can transfer energy between columns. Sampling the local-phase mask more finely cannot repair missing physics. E07 and E09 introduce models that can represent coupling and full-wave scattering.</p>
<p>The optional notebook experiment smooths a fabricated height profile before computing its phase. This is different from smoothing the final intensity image: fabrication changes the optical field before interference. All efficiency comparisons use the same incident normalization, avoiding an apparent improvement caused by rescaling each result to its own peak.</p>""",
     extension="Measure blazed-grating order efficiency, vary wavelength, and smooth a fabricated height profile before propagation. Separate fabrication approximation, sampling error, and model error.",
     limits="1D scalar thin-element lens, fixed n = 1.5, design λ₀ = 550 nm, aperture radius 15 μm and paraxial focal length 120 μm. Propagation uses exact scalar ASM. Fresnel reflection, material dispersion, polarization, and sidewall coupling are omitted.",
     quiz=[question("Removing h₂π leaves the field multiplier unchanged…",["At every wavelength","At the specified design wavelength in the thin-element model","Only after squaring the field"],1,"The complex transmission is unchanged when the removed phase is an integer multiple of 2π."),
           question("An ideal lossless two-level grating sends about 41% into its design order. The rest…",["Is necessarily absorbed","Can occupy other diffraction orders","Violates energy conservation"],1,"Low efficiency in one order does not imply absorption."),
           question("A finer grid always fixes a thin-element model that neglects sidewall scattering.",["True","False","Only for blue light"],1,"Grid refinement solves the chosen model more accurately; it cannot add omitted physical coupling.")],
     exercises=[("Verify wrapping","Compare complex transmissions of continuous and wrapped profiles at two wavelengths.","They agree at λ₀ up to floating-point error. At another wavelength the removed height need not be a full phase turn."),
                ("Measure order efficiency","Compute the +1 Fourier coefficient of 2-, 4-, 8-, and 16-level phase ramps.","Use a common unit-amplitude input and compare squared coefficient magnitude with sinc²(1/N)."),
                ("Separate error sources","Compare quantization, height smoothing, and pixel refinement.","Quantization and smoothing alter the modeled device; pixel refinement changes its numerical representation. Full-wave model error is a separate issue.")],
     refs=[("Levy, Mendlovic & Marom · Efficiency analysis of diffractive lenses","https://opg.optica.org/josaa/abstract.cfm?uri=josaa-18-1-86"),PROP]),
dict(id="E07",slug="e07-periodic-structures",title="Gratings, Bloch waves, and band gaps",
     headline="Repeat a structure.<br><em>Change the allowed waves.</em>",
     deck="Use momentum matching to find diffraction directions, then use a period’s transfer matrix to explain why a stack can reject a band of frequencies.",
     prerequisites=["E01","E06"],goals=["Determine which grating orders propagate in each medium.",
         "Connect a finite Bragg mirror to an infinite crystal’s Bloch gap.",
         "Distinguish energy conservation from convergence in a truncated RCWA calculation."],
     defaults=dict(wavelength=550,period=1,angle=0,contrast=.9,pairs=10),
     controls=[slider("wavelength","Grating wavelength",400,800,10,"nm"),slider("period","Grating period",.3,2,.05,"μm",2),
               slider("angle","Incidence angle",-50,50,2,"°"),slider("contrast","Stack index contrast",0,1.2,.05,"",2),
               slider("pairs","Stack period count",1,16,1)],
     presets=[preset("Only the zero order",period=.4,wavelength=550),preset("Open more orders",period=1.6),
              preset("No index contrast",contrast=0),preset("A short mirror",pairs=2)],
     prediction="If you shrink a grating’s period while keeping wavelength fixed, do more or fewer diffraction orders fit inside the propagating-wave circle?",
     intro="""<p>A flat interface has no preferred transverse position. Its boundary conditions match the transverse phase variation on both sides, conserving kₓ. Combining kₓ = nk₀ sin θ with that conservation gives Snell’s law. If the transmitted medium has no real longitudinal wavevector for that kₓ, its transmitted field is evanescent.</p>
<p>A periodic interface has a weaker symmetry: it repeats after one period Λ. Its Fourier components occur at integer multiples of K = 2π/Λ. Multiplication by that periodic structure can shift a field’s transverse wavevector by mK, creating diffraction orders.</p>
<div class="equation">kₓ,m = kₓ,in + mK &nbsp; · &nbsp; |kₓ,m| &lt; n_out k₀</div>
<p>The second condition selects propagating transmitted orders. Equality is grazing incidence with zero normal flux. The browser uses air on both sides, but the notebook lets you distinguish the incident and exit indices. At normal incidence, higher transmitted orders disappear when Λ &lt; λ₀/n_out; suppressing them on both sides requires considering both media.</p>
<p>This equation predicts directions, not power. Ridge shape, depth, material, and polarization determine how much light enters each allowed order. Equal line brightness in the direction diagram therefore carries no efficiency claim.</p>""",
     steps=["Change the grating period and count orders. Tilt the input and watch positive and negative orders leave the allowed range at different settings.",
            "In the separate layer-stack experiment, reduce index contrast to zero. Explain both the reflectance curve and the disappearance of the Bloch attenuation band.",
            "Restore contrast and vary period count. Compare finite-stack reflection with the infinite-periodic gap condition."],
     theory="""<h2>One period is an operator.</h2>
<p>In a layered medium, a two-component vector holds the tangential electric and magnetic fields. A transfer matrix advances it through one layer. Multiplying layer matrices gives one unit cell, and raising that cell matrix to a power gives a finite stack. Boundary matching then determines reflection and transmission amplitudes.</p>
<p>A Bloch wave returns to the same field shape after one period, multiplied by e<sup>iK_BΛ</sup>. It is therefore an eigenvector of the unit-cell operator. For a lossless reciprocal two-component stack, the determinant is one, and its eigenvalues occur as reciprocal pairs.</p>
<div class="equation">cos(K_BΛ) = ½ tr M_period</div>
<p>If the half trace lies between −1 and 1, K_B is real and the Bloch factor has unit magnitude. Outside that interval, the solutions grow or decay across periods. The decaying solution describes penetration into a semi-infinite stop band. A finite mirror still transmits a small amount, and can show interference fringes outside the gap. Its reflectance is not simply a binary band diagram.</p>
<h3>RCWA keeps a finite set of coupled orders.</h3>
<p>A layer patterned across x couples Fourier components. Expanding its permittivity produces a matrix whose off-diagonal entries connect different diffraction orders. Diagonalizing that matrix finds the layer’s field modes. Boundary matching then connects incoming, reflected, internal, and transmitted amplitudes.</p>
<p>The optional notebook solves one lamellar layer for TE polarization using forward modes referenced at the entrance and backward modes referenced at the exit. This keeps evanescent propagation factors decaying, avoiding a matrix filled with huge growing exponentials. Power in an order includes its longitudinal wavevector factor; squared amplitude alone is insufficient when angles or refractive indices differ.</p>
<p>A truncated basis can conserve total power while distributing it incorrectly among orders. Increase the retained harmonics and compare individual efficiencies and complex amplitudes, as well as boundary residuals and total R + T. The exercise deliberately shows a low-order calculation with excellent conservation but appreciable diffraction error.</p>""",
     extension="Implement a small single-layer TE-RCWA solver, compare uniform-film limits with Fresnel/Airy formulas, and increase the harmonic count until individual orders converge.",
     limits="The browser grating panel is kinematic only. The separate Bragg stack is lossless, normally illuminated, with equal layer thicknesses and exterior index 1.9. The optional RCWA model is a 1D lamellar, isotropic, lossless TE layer; it rejects exact cutoffs. TM and nonperiodic structures require additional treatment.",
     quiz=[question("The grating equation alone determines…",["All order efficiencies","Allowed diffraction directions","The absorption spectrum"],1,"Efficiencies require solving the boundary-value problem for the actual structure."),
           question("For the lossless layer stack, |½ tr Mperiod| > 1 indicates…",["A Bloch attenuation gap","Unit transmission","Numerical failure in every case"],0,"The Bloch wavevector becomes complex, giving reciprocal growing and decaying factors."),
           question("An RCWA run has R + T = 1 to machine precision. Its individual orders are…",["Necessarily converged","Still subject to harmonic-truncation error","All equally strong"],1,"Conservation is necessary but not sufficient. Compare order powers and amplitudes as the basis grows.")],
     exercises=[("Count orders","Predict the order count before changing wavelength, angle, or exit index.","Apply the propagation condition in the appropriate medium to every integer m; treat exact grazing separately."),
                ("Build a mirror","Compare two and ten periods at fixed index contrast, then remove the contrast.","More periods strengthen finite-stack reflection in the same infinite-medium gap. No contrast removes the periodic scattering."),
                ("Convergence audit","Report conservation, boundary residual, and changes in individual RCWA order powers.","A small residual or power-balance error alone does not bound truncation error. Retain more harmonics and compare complex t₀ as well.")],
     refs=[("Moharam et al. · Stable rigorous coupled-wave analysis","https://opg.optica.org/josaa/abstract.cfm?uri=josaa-12-5-1068"),
           ("Li · Fourier factorization for discontinuous periodic structures","https://opg.optica.org/josaa/abstract.cfm?uri=josaa-13-9-1870")]),
dict(id="E08",slug="e08-trapping-light",title="Waveguides, modes, and resonators",
     headline="A boundary confines light.<br><em>Phase chooses the modes.</em>",
     deck="Find the field shapes that can travel unchanged, combine them to transfer power between guides, and sum repeated round trips to build a resonance.",
     prerequisites=["E01","E07"],goals=["Recognize a guided mode as an eigenfunction with decaying cladding tails.",
         "Explain directional coupling through relative supermode phase.",
         "Relate ring resonance, storage, and critical coupling without confusing amplitude and power."],
     defaults=dict(width=3,mode=0,kappa=.025,coupling=.85,loss=.85),
     controls=[slider("width","Slab core thickness",.6,6,.1,"μm",1),slider("mode","Requested mode index",0,3,1),
               slider("kappa","Coupler κ",.01,.08,.005,"μm⁻¹",3),slider("coupling","Ring self-coupling r",.6,.98,.01,"amplitude",2),
               slider("loss","Round-trip survival a",.6,.98,.01,"amplitude",2)],
     presets=[preset("A thin single-mode guide",width=.8,mode=0),preset("Inspect a higher mode",width=5,mode=2),
              preset("Critical coupling",coupling=.85,loss=.85),preset("Weak external coupling",coupling=.97,loss=.85)],
     prediction="A guide can support several transverse shapes. If two supported shapes propagate with different phase constants, will their sum keep the same intensity profile?",
     intro="""<p>A slab waveguide has a high-index core surrounded by a lower-index cladding. Total internal reflection suggests that light can remain near the core, but not every zigzag angle gives a self-consistent wave. The transverse field must match at both interfaces and decay into the cladding. Those conditions select discrete modes.</p>
<p>Write a mode as E(x,z) = ψ(x)e<sup>iβz</sup>. The transverse shape ψ stays fixed while propagation adds a phase. Substituting this form into the scalar wave equation produces an eigenvalue problem.</p>
<div class="equation">[d²/dx² + k₀²n²(x)]ψ = β²ψ &nbsp; · &nbsp; n_clad &lt; β/k₀ &lt; n_core</div>
<p>The ratio β/k₀ is the effective index. The inequalities identify guided modes in this lossless slab. A mode’s tail is part of its field, not an error to trim away. Near cutoff, the tail can extend far into the cladding, so a small simulation window changes the answer.</p>
<p>Any suitable input can be expanded into supported modes. Their individual shapes do not change, but their relative phases do. Interference between them can move the total intensity from one part of the guide to another. This is the guided-wave version of changing basis before propagation.</p>""",
     steps=["Vary slab thickness and count supported modes. Request a higher mode, then shrink the guide until that mode no longer exists.",
            "Inspect the two-guide model. Predict the complete-transfer length from κ before reading the metric.",
            "Set ring r equal to a, then vary only r. Explain why the through-port dip can become shallower even when the resonator still stores light."],
     theory="""<h2>Power moves because phases separate.</h2>
<p>Two nearby identical guides support symmetric and antisymmetric supermodes with slightly different propagation constants. An input concentrated in one guide is their superposition. If the constants differ by 2κ, their relative phase reaches π after L = π/(2κ), transferring the intensity to the other guide.</p>
<div class="equation">P₁(z) = cos²(κz) &nbsp; · &nbsp; P₂(z) = sin²(κz)</div>
<p>The browser treats κ as a specified parameter of an ideal, lossless two-mode model. The notebook computes it from the eigenvalue splitting of a double-guide index profile. Unequal guides, radiation, additional modes, or loss can prevent complete transfer.</p>
<h3>A resonator adds a field to delayed copies of itself.</h3>
<p>After one round trip, a circulating field is multiplied by ra e<sup>iφ</sup>, where r is the coupler’s self-coupling amplitude, a is the propagation survival amplitude, and φ is round-trip phase. Summing all returns gives a geometric series proportional to 1/(1 − ra e<sup>iφ</sup>). On resonance, the returns reinforce each other.</p>
<p>The circulating power can exceed input power because energy remains for many trips. This is storage, not gain. Once the drive stops, the stored energy decreases by (ra)² per round trip. The decay time and spectral linewidth express the same finite lifetime. An absolute quality factor also needs the optical frequency and round-trip time, so the page reports round trips rather than inventing a device Q.</p>
<div class="equation">t_through = (r − a e<sup>iφ</sup>)/(1 − ra e<sup>iφ</sup>)</div>
<p>At resonance, the through port vanishes when r = a. This is critical coupling: direct transmission interferes destructively with the field leaking back from the ring. In a lossy all-pass ring, the missing through power is dissipated internally; zero transmission is not proof of perfect reflection. If a = 1, the lossless all-pass ring has unit through power away from singular limiting cases, while its phase still changes.</p>""",
     extension="Solve the Hermitian finite-difference mode problem, derive κ from double-guide supermodes, and compare mode beating with split-step BPM.",
     limits="Scalar TE symmetric slab, ncore = 1.50, ncladding = 1.45, λ₀ = 1.55 μm. The coupler and ring are separate reduced models. The ring is an ideal single-bus all-pass resonator with amplitude parameters r and a. No bend radiation, vector effects, or fabrication disorder is included.",
     quiz=[question("A guided slab mode’s effective index lies…",["Above the core index","Between cladding and core indices","Below both indices"],1,"The core supports transverse oscillation while the cladding tail decays."),
           question("The ideal two-guide transfer length is…",["π/(2κ)","2πκ","Independent of κ"],0,"A supermode splitting 2κ accumulates a relative phase π at that distance."),
           question("Critical coupling in the displayed ring occurs when…",["r = a","r = 0 for any a","The circulating intensity is zero"],0,"At resonance, equal amplitude self-coupling and round-trip survival cancel the through field.")],
     exercises=[("Check a mode","Report an effective index, eigen-equation residual, and sensitivity to window size.","The residual tests the discrete eigenproblem. Enlarging the window checks whether artificial boundaries disturb the physical tail."),
                ("Predict a coupler","Compute the two supermode propagation constants and predict the first complete-transfer distance.","κ = (βs − βa)/2, so L = π/|βs − βa| for the ideal symmetric two-mode system."),
                ("Track energy storage","Compare through-port power, circulating power, and decay after drive removal.","Stored power can be larger than incident power through repeated coherent accumulation; decay and dissipation still obey energy balance.")],
     refs=[("MIT OpenCourseWare · Dielectric waveguides","https://ocw.mit.edu/courses/6-974-fundamentals-of-photonics-quantum-electronics-spring-2006/pages/lecture-notes/"),
           ("SciPy · Hermitian eigenproblems","https://docs.scipy.org/doc/scipy/reference/generated/scipy.linalg.eigh.html")]),
dict(id="E09",slug="e09-maxwell-grid",title="Maxwell on a grid",
     headline="Update a neighbour.<br><em>Watch a wave emerge.</em>",
     deck="Solve Maxwell’s coupled field equations with staggered samples, then find out why time steps, pixels, and computational boundaries are part of the physics calculation.",
     prerequisites=["E01","E07"],worker=True,goals=["Explain the spatial and temporal staggering of a Yee update.",
         "Distinguish instability, numerical dispersion, and boundary reflection.",
         "Measure reflection with a reference run and verify an absorber by refinement."],
     defaults=dict(resolution=40,courant=.9,index=1,snapshot=10,boundary="pml"),
     controls=[slider("resolution","Cells / vacuum wavelength",20,60,20),slider("courant","Courant number S",.4,1.06,.02,"",2),
               slider("index","Index beyond x = 8",1,2,.1,"",1),
               slider("snapshot","Inspect field at time",1,27,1,"periods",help="After the run, inspect E and H at this stored time. Probe and history plots still cover the whole simulation."),
               select("boundary","Right boundary",[("pml","Graded matched CPML"),("lossy","Abrupt electric-loss layer"),("wall","Perfect electric wall")])],
     presets=[preset("Matched boundary",boundary="pml",index=1),preset("A wall echo",boundary="wall",index=1),
              preset("A lossy layer echoes",boundary="lossy",index=1),preset("Dielectric reflection",index=1.5),
              preset("Violate 1D stability",courant=1.04,index=1)],
     prediction="A layer absorbs light strongly. Does that guarantee it produces little reflection where the wave first enters it?",
     intro="""<p>Maxwell’s equations couple electric and magnetic fields through spatial derivatives. In one dimension, with E along z and propagation along x, the magnetic field lies along y. In normalized units, the two update equations connect neighboring samples rather than solving for an entire field at once.</p>
<div class="equation">Hᵧ ← Hᵧ + S ΔₓE_z &nbsp; · &nbsp; E_z ← E_z + (S/ε) ΔₓHᵧ</div>
<p>Here S = c₀Δt/Δx is the Courant number, ε is relative permittivity, and Δₓ means a difference between adjacent samples without division by Δx. The electric field is stored at integer positions and times. The magnetic field is half a cell away and half a time step behind. Updating H first and E second advances them in a leapfrog.</p>
<p>Staggering is not a plotting inconvenience. The difference of two values approximates a derivative at their midpoint, so the other field naturally belongs there. The same idea applies in time. For a physical wave traveling in +x with these axis conventions, Hᵧ = −nE_z; opposite signs do not mean opposite propagation directions.</p>
<p>The browser computes a real 1D finite-difference time-domain (FDTD) simulation on a Yee grid. A soft electric source launches pulses both left and right. The left edge always absorbs. The right edge can be a wall, an abrupt electric-loss layer, or a matched graded CPML. A dielectric interface can be inserted at x = 8.</p>""",
     steps=["Run the matched-boundary case. Watch the field and probe trace, then repeat with a wall and the electric-loss layer at identical sampling.",
            "Insert n = 1.5. Locate the reflected and transmitted pulses. Do not infer reflectance by comparing unrelated instantaneous peaks.",
            "Run the unstable preset. Observe exponential growth and the automatic stop, then reduce S without changing the spatial grid."],
     theory="""<h2>The grid has its own limits.</h2>
<p>For the vacuum 1D Yee scheme used here, stability requires S ≤ 1. In equal-grid 2D, the corresponding limit is S ≤ 1/√2. These are different bounds: a value that is safe in one dimension can be unstable in two. The notebook labels dimensionality explicitly and seeds a tiny alternating perturbation so an unstable mode becomes visible reproducibly.</p>
<p>Stability is only the first check. A stable grid can give the wrong phase velocity because finite differences have a different dispersion relation from continuous derivatives. Coarse pixels accumulate phase error as the wave travels. Cells must be counted per wavelength inside the highest-index material, not just per vacuum wavelength.</p>
<div class="equation">sin²(ωΔt/2) = (S²/n²) Σ_d sin²(k_dΔx/2)</div>
<p>The sum has one term in the browser and two in the optional 2D calculation. Increasing resolution should move numerical results toward the continuum answer. A small-looking pixel size alone is not evidence of convergence.</p>
<h3>Absorption and matching solve different problems.</h3>
<p>An abrupt electric conductivity dissipates energy but changes wave impedance, so its entrance reflects. A perfectly matched layer modifies the derivative operators in a coordinated way. In the continuum idealization its entrance is matched while waves attenuate inside. CPML realizes the frequency-dependent stretch with memory variables in the time-domain update.</p>
<p>The discrete implementation still has a finite reflection error. Its electric and magnetic loss profiles must be sampled at their actual staggered positions. Grading, layer thickness, resolution, and incidence conditions affect the residual. Calling a region PML is not a substitute for measuring its echo.</p>
<p>The notebook subtracts a larger-domain reference field from a test trace, then gates the reflected arrival. It also compares the dielectric step with Fresnel reflectance. For precise power balance, electric and magnetic fields must be colocated in both space and time before calculating flux; simply squaring an arbitrary field sample can hide staggering error.</p>""",
     extension="Run a compact 2D TMz Yee solver with CPML, compare its residual against a larger domain, and repeat grid-dispersion and Courant tests.",
     limits="1D normalized Yee fields with real, nondispersive ε = n² and μ = 1. The PML specialization uses cubic grading with κ = 1 and α = 0. The electric source is bidirectional. The field display clips amplitudes outside ±1; the growth plot reports actual maxima and stops at 10⁶.",
     quiz=[question("A 1D vacuum run uses S = 0.9. The same value on an equal-grid 2D vacuum Yee grid is…",["Also stable automatically","Above the 2D Courant limit","Unrelated to stability"],1,"The bounds are 1 in 1D and 1/√2 in equal-grid 2D."),
           question("A strongly absorbing electric-loss layer can reflect because…",["Absorption is impossible","Its entrance can be impedance-mismatched","The light has no wavelength"],1,"Dissipation and matching are separate properties."),
           question("A stable FDTD run is guaranteed to have accurate phase velocity.",["True","False","Only if the fields are plotted smoothly"],1,"Grid dispersion remains. Check wavelength sampling and refinement.")],
     exercises=[("Measure an interface","Estimate reflectance for n: 1 → 1.5 with a reference-subtracted, time-gated trace.","Compare with ((1−1.5)/(1+1.5))² = 0.04, then refine the grid. Keep incident normalization and arrival windows fixed physically."),
                ("Audit the boundary","Compare wall, loss layer, and CPML with identical excitation and a larger-domain reference.","Subtract fields before squaring. Distinguish amplitude echo ratios from integrated reflected-power estimates."),
                ("Separate two failures","Create a stable coarse run and an unstable fine run, then explain why each is unreliable.","The first can accumulate dispersion error; the second violates the time-step stability bound. Refining space without reducing Δt can make stability worse.")],
     refs=[("Meep · Introduction and Courant stability","https://meep.readthedocs.io/en/stable/Introduction/"),
           ("Meep · Perfectly matched layers and convergence","https://meep.readthedocs.io/en/latest/Perfectly_Matched_Layer/"),
           ("Roden & Gedney · Convolution PML","https://doi.org/10.1002/1098-2760(20001205)27:5%3C334::AID-MOP14%3E3.0.CO;2-A")]),
dict(id="E10",slug="e10-adjoint-design",title="Designing light with gradients",
     headline="One error field.<br><em>Every pixel’s gradient.</em>",
     deck="Design a phase mask by measuring how each parameter affects an image, then replace thousands of separate perturbations with one adjoint calculation.",
     prerequisites=["E01","E05","E09"],worker=True,goals=["Derive a real phase gradient through a complex Fourier operator.",
         "Verify that gradient with central finite differences.",
         "Explain why adjoints are not generally inverse propagation and why gradients do not guarantee global optimality."],
     defaults=dict(target="two",seed=42,iterations=100,step=.6),
     controls=[select("target","Target intensity",[("two","Two Gaussian spots"),("ring","A Gaussian ring")]),
               slider("seed","Initialization seed",1,100,1),slider("iterations","Maximum iterations",20,200,20),
               slider("step","Maximum phase step",.1,1.2,.1,"rad",1,help="Backtracking reduces this value until the proposed step decreases the objective.")],
     presets=[preset("Two-spot design",target="two",seed=42),preset("A different start",seed=17),
              preset("Design a ring",target="ring"),preset("Conservative steps",step=.2)],
     prediction="A mask has 4,096 adjustable phase pixels and one scalar loss. How many perturbed simulations would a central finite-difference gradient require? What calculation could share work across all pixels?",
     intro="""<p>Forward modeling answers what a device does. Design asks which parameters make it do something useful. Here the parameters are the phase delays of a fixed-amplitude pupil. A unitary Fourier transform produces the output field, and its intensity is compared with a target.</p>
<div class="equation">u = a e<sup>iφ</sup> &nbsp; · &nbsp; v = Fu &nbsp; · &nbsp; J = ½ Σ(|v|² − T)² / ΣT²</div>
<p>The aperture a and target T are normalized once so their total powers agree. The loss is an intensity mismatch, not an amplitude mismatch. A central finite difference would perturb each φ separately in both directions, costing roughly twice as many forward evaluations as there are parameters.</p>
<p>Reverse differentiation shares the effect of the final error. First compute the output field v and residual r = |v|² − T. Weight that field by the residual and propagate it through the Hermitian adjoint F†. One overlap with the input field then gives every real phase derivative.</p>
<div class="equation">b = F†[rv / ΣT²] &nbsp; · &nbsp; ∂J/∂φ = 2 Im(u* b)</div>
<p>The complex conjugate and the factor of two are essential. The notebook derives this expression from dJ = 2 Re(q†dv), then compares it with numerical perturbations. A visually plausible sensitivity map is not a gradient check.</p>""",
     steps=["Run the two-spot design. Compare target and output with their common intensity scale, and follow the accepted-step loss curve.",
            "Change only the initialization seed. Compare final losses and phase masks; different solutions can have similar performance.",
            "Increase the maximum phase step. Watch backtracking add forward evaluations when needed, rather than assuming every larger step improves the design."],
     theory="""<h2>The adjoint follows the computation backward.</h2>
<p>For a linear field operator P, the adjoint P† is defined by the complex inner product: ⟨Px,y⟩ = ⟨x,P†y⟩. It transports sensitivity to a scalar objective back through the model. For a unitary Fourier transform, the adjoint equals the inverse, which makes this example especially simple.</p>
<p>That equality is not general. If propagation is diagonal in a spectral basis with factors H, the adjoint uses H*, whereas an inverse uses 1/H. Evanescent attenuation remains attenuation under the adjoint; inverse propagation would amplify it. Lossy systems therefore make a useful counterexample to the phrase run the light backward.</p>
<h3>The same idea applies to a matrix wave solver.</h3>
<p>Suppose a discretized frequency-domain model is A(p)x = b. A real scalar objective gives an output sensitivity q = ∂J/∂x*. Solve A†λ = q. If b has no parameter dependence, each real parameter derivative is −2 Re[λ†(∂A/∂p)x], plus any explicit objective dependence.</p>
<p>The optional sparse Helmholtz example uses precisely this Hermitian convention and checks all pixel derivatives. An equivalent transpose convention can be used if its source and overlap are conjugated consistently. Mixing the two conventions is a common source of gradients with convincing structure and incorrect signs.</p>
<h3>Accurate derivatives are the beginning of design.</h3>
<p>The browser uses a seeded initial phase and backtracking descent. Every accepted step must lower the stated loss. Computing the gradient needs one forward and one adjoint operation per scalar objective, while line search adds forward trials. The counter reports those additional evaluations rather than hiding them in a two-simulation claim.</p>
<p>The objective is nonconvex. Multiple starts can end at different local solutions. A phase pattern that works in the numerical model can also fail after quantization, smoothing, or a more accurate wave model. The notebook applies a fabrication projection and evaluates the resulting device again. A lower training loss is useful evidence, but it is not a certificate of global optimality or experimental performance.</p>""",
     extension="Check every gradient component in a small lossy sparse Helmholtz model, compare adjoint conventions, and evaluate quantized or smoothed phase masks after optimization.",
     limits="64 × 64 scalar phase-only pupil with a circular fixed amplitude and a unitary Fourier propagation operator. Targets have equal total power. No pixel coupling, material dispersion, noise, or fabrication constraints are included in the browser optimization. The optional Helmholtz example has a lossy boundary layer, explicitly not a PML.",
     quiz=[question("For thousands of phase parameters and one scalar loss, the adjoint gradient needs…",["One separate adjoint solve for each pixel","One forward and one adjoint operation, before line-search trials","No forward model"],1,"The overlap computes all parameter derivatives from the same forward and adjoint fields."),
           question("For an attenuating transfer factor H, the adjoint uses…",["1/H","H*","Only its magnitude squared"],1,"The inverse and adjoint coincide only when |H| = 1."),
           question("A finite-difference gradient check establishes…",["Global optimality","Consistency of the implemented derivative with the implemented objective","Experimental fabrication accuracy"],1,"It validates differentiation of the model, not the physical completeness of that model or the optimization landscape.")],
     exercises=[("Check derivatives","Compare an analytic phase gradient with central differences at several perturbation sizes.","Look for an intermediate step-size range where truncation and roundoff are both small; compare relative and absolute errors."),
                ("Count actual work","Report gradient evaluations and extra forward trials for two maximum step sizes.","One forward plus one adjoint produces a gradient for one objective. Backtracking and validation add separate evaluations."),
                ("Test the manufactured design","Quantize the final phase and re-evaluate the unchanged objective and intensity normalization.","Fabrication projection can worsen performance. A model-aware optimization can include such constraints, but a continuous-mask result alone is insufficient.")],
     refs=[("Steven G. Johnson · Notes on adjoint methods","https://math.mit.edu/~stevenj/18.336/adjoint.pdf"),
           ("SciPy · Sparse factorization solve conventions","https://docs.scipy.org/doc/scipy/reference/generated/scipy.sparse.linalg.SuperLU.solve.html"),FFT]),
]
