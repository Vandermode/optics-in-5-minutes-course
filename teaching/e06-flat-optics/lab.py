# %% [markdown]
# ## 1 · A height profile becomes an optical phase
#
# For a nondispersive thin dielectric of index n in air, $\phi=2\pi(n-1)h/\lambda$.
# A paraxial converging lens has phase $-\pi x^2/(\lambda_0 f_0)$, plus an irrelevant constant.
# Subtracting integer multiples of $h_{2\pi}=\lambda_0/(n-1)$ preserves the field
# at the design wavelength. The fabricated height stays fixed when wavelength changes.
# **Predict:** will the unwrapped and wrapped profiles still be equivalent at 650 nm?
# %%
N=2048;dx=.0625;x=(np.arange(N)-N//2)*dx
lambda0=.55;n_glass=1.5;f0=120.;R=15.
pupil=(abs(x)<=R).astype(float)
height=np.where(pupil>0,(R*R-x*x)/(2*f0*(n_glass-1)),0)
h2pi=lambda0/(n_glass-1)
wrapped=np.mod(height,h2pi)
def field(h,lam):return pupil*np.exp(2j*np.pi*(n_glass-1)*h/lam)
def propagate(u,lam,z):
    fx=np.fft.fftfreq(N,dx)
    kz=2*np.pi*np.sqrt((1/lam**2-fx*fx).astype(complex))
    return np.fft.ifft(np.fft.fft(u)*np.exp(1j*z*kz))
assert np.max(abs(field(height,lambda0)-field(wrapped,lambda0)))<1e-12
fig,ax=plt.subplots(1,2,figsize=(11,4))
ax[0].plot(x,height,label="Unwrapped");ax[0].plot(x,wrapped,label="Wrapped")
ax[0].set(xlim=(-17,17),xlabel="x (μm)",ylabel="Height (μm)");ax[0].legend()
for h,label in [(height,"Unwrapped"),(wrapped,"Wrapped")]:
    ax[1].plot(x,abs(propagate(field(h,lambda0),lambda0,f0))**2,label=label)
ax[1].set(xlim=(-5,5),xlabel="Focal coordinate (μm)",ylabel="Intensity / incident");ax[1].legend()
show(fig,"01-wrapping-equivalence")
# %% [markdown]
# ## 2 · Quantization sends power to other orders
#
# A uniform M-level approximation to one 2π blazed-grating period has ideal first-order
# efficiency $\mathrm{sinc}^2(1/M)$, using sinc(x)=sin(πx)/(πx). This is an order-efficiency
# benchmark, not the total efficiency of every finite lens or metasurface.
# %%
t=(np.arange(65536)+.5)/65536
levels=np.array([2,4,8,16,32])
efficiencies=[]
for M in levels:
    transmission=np.exp(2j*np.pi*np.floor(t*M)/M)
    amplitude_order=np.mean(transmission*np.exp(-2j*np.pi*t))
    efficiencies.append(abs(amplitude_order)**2)
exact=np.sinc(1/levels)**2
assert np.max(abs(np.array(efficiencies)-exact))<1e-8
fig,ax=plt.subplots(1,2,figsize=(11,4))
ax[0].plot(levels,efficiencies,"o",label="Numerical Fourier coefficient")
ax[0].plot(levels,exact,"--",label="sinc²(1/M)");ax[0].legend(fontsize=9)
ax[0].set(xlabel="Phase levels M",ylabel="First-order power fraction",ylim=(0,1.05))
for M in [2,4,8]:
    staircase=np.floor(wrapped/h2pi*M)*h2pi/M
    ax[1].plot(x,abs(propagate(field(staircase,lambda0),lambda0,f0))**2,label=f"{M} levels")
ax[1].set(xlim=(-5,5),xlabel="Focal coordinate (μm)",ylabel="Intensity / incident");ax[1].legend()
show(fig,"02-quantization")
print("Max grating-efficiency quadrature error:",np.max(abs(np.array(efficiencies)-exact)))
# %% [markdown]
# ## 3 · Compare colours at fixed fabrication
#
# The wrapped profile is a diffractive lens. Its first design-order focal length approximately
# follows $f=f_0\lambda_0/\lambda$. The nondispersive unwrapped thin refractive lens stays near
# f₀. Finite aperture, scalar nonparaxial phase, and interference between orders shift the
# measured axial maximum slightly; inspect the curve rather than claiming exact equality.
# %%
zs=np.linspace(75,180,211)
fig,ax=plt.subplots(1,2,figsize=(11,4))
for lam in [.45,.55,.65]:
    for h,a in [(wrapped,ax[0]),(height,ax[1])]:
        u=field(h,lam)
        axial=np.array([abs(propagate(u,lam,z)[N//2])**2 for z in zs])
        a.plot(zs,axial,label=f"λ = {lam:.2f} μm")
    predicted=f0*lambda0/lam
    print(f"Diffractive first-order prediction at {lam:.2f} μm: {predicted:.2f} μm")
for a,title in zip(ax,["Wrapped diffractive lens","Unwrapped nondispersive lens"]):
    a.set(title=title,xlabel="Propagation distance (μm)",ylabel="On-axis intensity");a.legend()
show(fig,"03-chromatic-focus")
# %% [markdown]
# ## Optional extension · Blur the height, then recompute the phase
#
# Fabrication smoothing acts on the physical height; smoothing a wrapped phase phasor is
# a different operation. This is only a manufacturing toy model: no vector scattering,
# resonant nanostructures, Fresnel reflections, or index dispersion are included.
# %%
from scipy.ndimage import gaussian_filter1d
fig,ax=plt.subplots(1,2,figsize=(11,4))
for sigma_um in [0,.1,.3]:
    blurred=wrapped if sigma_um==0 else gaussian_filter1d(wrapped,sigma_um/dx)
    ax[0].plot(x,blurred,label=f"σ = {sigma_um} μm")
    ax[1].plot(x,abs(propagate(field(blurred,lambda0),lambda0,f0))**2,label=f"σ = {sigma_um} μm")
ax[0].set(xlim=(5,15),xlabel="x (μm)",ylabel="Height (μm)")
ax[1].set(xlim=(-5,5),xlabel="Focal coordinate (μm)",ylabel="Intensity / incident")
for a in ax:a.legend()
show(fig,"04-height-blur")
