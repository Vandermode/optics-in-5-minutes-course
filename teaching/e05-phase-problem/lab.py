# %% [markdown]
# ## 1 · Encode the missing phase in a carrier
#
# A camera measures $|U|^2$, which is unchanged if U is multiplied by any local phase.
# Add a known tilted reference $R=A\exp(2\pi i c x/N)$ instead. The intensity now
# contains $UR^*$ and its conjugate, displaced to opposite Fourier sidebands.
# We deliberately band-limit U to B bins so that an isolated sideband can be recovered exactly.
# **Predict:** what fails if c is too small, too close to Nyquist, or the crop is too narrow?
# %%
N=128;B=8;carrier=32;A=2.
x=(np.arange(N)-N//2)/N;X,Y=np.meshgrid(x,x)
phase_object=1.1*np.exp(-((X+.18)**2+(Y-.08)**2)/.012)+.7*np.exp(-((X-.15)**2+(Y+.12)**2)/.006)
amplitude=1-.3*np.exp(-((X+.12)**2+(Y+.19)**2)/.02)
bins=np.fft.fftfreq(N)*N;FX,FY=np.meshgrid(bins,bins)
band=np.hypot(FX,FY)<=B
U=np.fft.ifft2(np.fft.fft2(amplitude*np.exp(1j*phase_object))*band)
def hologram_recover(U,carrier=32,radius=8):
    reference=A*np.exp(2j*np.pi*carrier*np.arange(N)/N)[None,:]
    camera=abs(U+reference)**2
    # UR* lies at -carrier. Move it back to zero, then keep its bandwidth.
    sideband=np.roll(np.fft.fft2(camera),carrier,axis=1)*(np.hypot(FX,FY)<=radius)/A
    return camera,np.fft.ifft2(sideband)
camera,recovered=hologram_recover(U)
error=np.linalg.norm(recovered-U)/np.linalg.norm(U)
assert error<1e-12
fig,ax=plt.subplots(1,3,figsize=(12,3.6))
for a,img,title in zip(ax,[camera,np.angle(U),np.angle(recovered)],["Recorded intensity","Known phase","Recovered phase"]):
    a.imshow(img,cmap="twilight" if "phase" in title else "magma");a.set(title=title,xlabel="Pixel",ylabel="Pixel")
show(fig,"01-holographic-recovery")
print("Relative complex-field error with isolated sideband:",error)
for c,r in [(12,8),(32,3),(60,8)]:
    _,bad=hologram_recover(U,c,r)
    print(f"Carrier {c}, crop {r}: relative field error {np.linalg.norm(bad-U)/np.linalg.norm(U):.3g}")
# %% [markdown]
# ## 2 · A recovered complex field can be refocused
#
# Propagate U with a scalar angular-spectrum transfer function. Here pixels are 1 μm,
# wavelength is 0.55 μm, and the object is band-limited to propagating frequencies.
# Backward propagation is safe for this noiseless propagating example; amplifying
# evanescent components or missing/noisy sidebands is a different inverse problem.
# %%
dx=1.;wavelength=.55
def propagate(field,z):
    f=np.fft.fftfreq(N,dx);fx,fy=np.meshgrid(f,f)
    kz=2*np.pi*np.sqrt((1/wavelength**2-fx*fx-fy*fy).astype(complex))
    return np.fft.ifft2(np.fft.fft2(field)*np.exp(1j*kz*z))
z=150.
sensor=propagate(U,z)
_,sensor_recovered=hologram_recover(sensor)
focused=propagate(sensor_recovered,-z)
# Compare up to a global phase, as an unknown reference phase would require.
alignment=np.vdot(U,focused);focused*=np.exp(-1j*np.angle(alignment))
assert np.linalg.norm(focused-U)/np.linalg.norm(U)<1e-12
fig,ax=plt.subplots(1,3,figsize=(12,3.6))
for a,img,title in zip(ax,[abs(U)**2,abs(sensor)**2,abs(focused)**2],["Object intensity","Defocused sensor","Numerically refocused"]):
    a.imshow(img,cmap="magma",vmin=.35,vmax=1.2);a.set(title=title,xlabel="Pixel")
show(fig,"02-refocusing")
# %% [markdown]
# ## 3 · Recover phase from two magnitude constraints
#
# Without a reference, one intensity plane is insufficient. Gerchberg–Saxton alternates
# between planes: keep the current phase but replace the amplitude with a measured or
# desired amplitude. This enforces one constraint at a time, not both simultaneously.
# A global phase remains undetermined. A low error is evidence of consistency, not uniqueness.
# %%
F=lambda u:np.fft.fft2(u,norm="ortho")
FH=lambda v:np.fft.ifft2(v,norm="ortho")
known_amplitude=abs(U);measured_amplitude=abs(F(U))
def gs(seed,iterations=150):
    random=np.random.default_rng(seed)
    u=known_amplitude*np.exp(1j*random.uniform(-np.pi,np.pi,(N,N)))
    losses=[]
    for _ in range(iterations):
        v=F(u)
        losses.append(np.linalg.norm(abs(v)-measured_amplitude)/np.linalg.norm(measured_amplitude))
        u=known_amplitude*np.exp(1j*np.angle(FH(measured_amplitude*np.exp(1j*np.angle(v)))))
    return u,np.asarray(losses)
results=[gs(seed) for seed in [3,7,11]]
fig,ax=plt.subplots(1,2,figsize=(11,4))
for seed,(u,history) in zip([3,7,11],results):
    ax[0].semilogy(history,label=f"Seed {seed}")
    assert history[-1]<history[0]
    assert np.max(abs(abs(u)-known_amplitude))<1e-12
ax[0].set(xlabel="Iteration",ylabel="Fourier-amplitude relative error");ax[0].legend()
ax[1].imshow(np.angle(results[0][0]),cmap="twilight",vmin=-np.pi,vmax=np.pi)
ax[1].set(title="One recovered phase · not guaranteed unique",xlabel="Pixel")
show(fig,"03-phase-retrieval")
print("Final magnitude errors:",[float(h[-1]) for u,h in results])
# %% [markdown]
# ## Optional extension · Design, then quantize, a phase-only mask
#
# Replace the measured Fourier amplitude with a target. The pupil has fixed amplitude,
# so the requested target may not be exactly feasible. After optimization, quantizing
# phase generally worsens the objective: that fabrication constraint was absent from the iterations.
# %%
pupil=(X*X+Y*Y<.4**2).astype(float)
target=np.exp(-((X-.18)**2+Y*Y)/.003)+np.exp(-((X+.18)**2+Y*Y)/.003)
target*=np.sum(pupil**2)/target.sum()
u=pupil*np.exp(1j*np.random.default_rng(23).uniform(-np.pi,np.pi,(N,N)))
for _ in range(100):
    v=np.fft.fftshift(F(u))
    u=pupil*np.exp(1j*np.angle(FH(np.fft.ifftshift(np.sqrt(target)*np.exp(1j*np.angle(v))))))
phi=np.angle(u);quantized=np.round(phi/(2*np.pi/4))*(2*np.pi/4)
outputs=[target,abs(np.fft.fftshift(F(u)))**2,abs(np.fft.fftshift(F(pupil*np.exp(1j*quantized))))**2]
fig,ax=plt.subplots(1,3,figsize=(12,3.6))
for a,img,title in zip(ax,outputs,["Requested target","Continuous phase","Four phase levels"]):
    a.imshow(img,cmap="magma",vmin=0,vmax=target.max());a.set(title=title,xlabel="Focal-plane sample")
show(fig,"04-phase-only-design")
assert abs(outputs[1].sum()-pupil.sum())<1e-9
