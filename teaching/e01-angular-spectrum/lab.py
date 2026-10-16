# %% [markdown]
# ## 1 · A complex field, then a propagation rule
#
# A complex number encodes an amplitude and phase. Squaring its magnitude gives intensity,
# but discards the phase needed for later interference. For a plane wave, substituting
# $e^{i(k_xx+k_zz)}$ into the Helmholtz equation gives $k_z^2=k^2-k_x^2$.
# The outgoing square root is real for propagating waves and positive imaginary for evanescent waves.
#
# **Predict:** at the same wavelength and distance, which slit makes the broader pattern?
# Change width only after recording your prediction. All calculation lengths below are micrometres.
# %%
wavelength = 0.55
width = 2.0
distance = 12.0
dx, n = 0.05, 512
x = (np.arange(n)-n//2)*dx
u0 = (abs(x)<width/2).astype(complex)
def asm(field, dx, wavelength, z, fresnel=False):
    axes = [np.fft.fftfreq(size, dx) for size in field.shape]
    grids = np.meshgrid(*axes, indexing="ij")
    transverse = sum((2*np.pi*g)**2 for g in grids)
    k = 2*np.pi/wavelength
    kz = k-transverse/(2*k) if fresnel else np.sqrt(k*k-transverse+0j)
    return np.fft.ifftn(np.fft.fftn(field)*np.exp(1j*z*kz))
u = asm(u0, dx, wavelength, distance)
z_values = np.linspace(0, distance, 101)
history = np.array([asm(u0,dx,wavelength,z) for z in z_values])
fig, ax = plt.subplots(1,2,figsize=(11,4))
ax[0].plot(x,abs(u0)**2,label="Input");ax[0].plot(x,abs(u)**2,label="Propagated")
ax[0].set(xlabel="x (μm)",ylabel="Intensity / incident intensity");ax[0].legend()
ax[1].imshow(history.real,extent=[x[0],x[-1],distance,0],aspect="auto",cmap="RdBu_r",vmin=-1,vmax=1)
ax[1].set(xlabel="x (μm)",ylabel="z (μm)",title="Computed Re U · unequal axis scales")
show(fig,"01-slit-propagation")
# %% [markdown]
# ## 2 · Verify a case whose answer is known
#
# A Fourier-grid plane wave is an eigenfunction: it retains its shape and gains one analytic
# propagation factor. This is a stronger test than comparing two similar-looking plots.
# At zero distance the operator must be the identity. On the propagating band it must preserve
# the squared field norm because every multiplier has magnitude one.
# %%
assert np.max(abs(asm(u0,dx,wavelength,0)-u0)) < 1e-12
mode = 7
fx = mode/(n*dx)
plane = np.exp(2j*np.pi*fx*np.arange(n)*dx)
expected = plane*np.exp(1j*distance*np.sqrt((2*np.pi/wavelength)**2-(2*np.pi*fx)**2))
plane_error = np.max(abs(asm(plane,dx,wavelength,distance)-expected))
random = np.random.default_rng(11)
spec = random.normal(size=n)+1j*random.normal(size=n)
frequencies = np.fft.fftfreq(n,dx)
spec[abs(frequencies)>=1/wavelength] = 0
bandlimited = np.fft.ifft(spec)
power_error = abs(np.vdot(asm(bandlimited,dx,wavelength,3),asm(bandlimited,dx,wavelength,3)).real/np.vdot(bandlimited,bandlimited).real-1)
evanescent_mode = int(np.ceil(1.2/wavelength*n*dx))
ev_fx = evanescent_mode/(n*dx)
ev = np.exp(2j*np.pi*ev_fx*np.arange(n)*dx)
ev_z = .1
decay = np.exp(-ev_z*np.sqrt((2*np.pi*ev_fx)**2-(2*np.pi/wavelength)**2))
ev_error = np.max(abs(asm(ev,dx,wavelength,ev_z)-ev*decay))
assert plane_error < 1e-11 and power_error < 1e-12 and ev_error < 1e-11
print("Plane-wave error:",plane_error,"Power error:",power_error,"Evanescent error:",ev_error)
# %% [markdown]
# ## 3 · The FFT window repeats
#
# Padding changes the distance to periodic copies; it does not change the sample spacing.
# The following deliberately long propagation compares one, two, and four window widths.
# The four-window answer is a refinement reference, not an exact infinite-domain solution.
# **Predict:** which disagreement should shrink when padding increases?
# %%
long_z = 100.
outputs = []
for factor in [1,2,4]:
    margin = (factor-1)*n//2
    padded = np.pad(u0,(margin,margin))
    full = asm(padded,dx,wavelength,long_z)
    outputs.append(full[margin:margin+n])
errors = [np.linalg.norm(v-outputs[-1])/np.linalg.norm(outputs[-1]) for v in outputs[:2]]
fig,ax=plt.subplots(figsize=(8,4))
for factor,v in zip([1,2,4],outputs):ax.plot(x,abs(v)**2,label=f"{factor}× window")
ax.set(xlabel="x (μm)",ylabel="Intensity / incident intensity",title="Periodic replicas matter at long distance");ax.legend()
show(fig,"02-padding")
print("Field errors against 4× reference:",errors)
# %% [markdown]
# ## Optional extension · Two dimensions and a paraxial approximation
#
# The square root now contains both transverse frequencies. Fresnel propagation replaces it
# with a paraboloid. Keep the grid fixed while changing the model, then refine the grid separately.
# Negative-distance inversion is intentionally excluded: it can exponentially amplify evanescent noise.
# %%
n2, dx2, z2 = 128, .2, 10.
axis = (np.arange(n2)-n2//2)*dx2
X,Y=np.meshgrid(axis,axis)
aperture=((abs(X)<1.2)&(abs(Y)<2.0)).astype(complex)
exact=asm(aperture,dx2,wavelength,z2)
paraxial=asm(aperture,dx2,wavelength,z2,True)
fig,ax=plt.subplots(1,3,figsize=(12,3.7))
vmax=max(np.max(abs(exact)**2),np.max(abs(paraxial)**2))
for a,v,title in zip(ax,[aperture,exact,paraxial],["Input","Exact scalar ASM","Fresnel"]):
    a.imshow(abs(v)**2,extent=[axis[0],axis[-1],axis[0],axis[-1]],origin="lower",vmin=0,vmax=vmax,cmap="magma")
    a.set(title=title,xlabel="x (μm)",ylabel="y (μm)")
show(fig,"03-two-dimensional")
print("Exact/Fresnel relative intensity difference:",np.linalg.norm(abs(exact)**2-abs(paraxial)**2)/np.linalg.norm(abs(exact)**2))
