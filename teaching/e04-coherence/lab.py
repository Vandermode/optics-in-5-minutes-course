# %% [markdown]
# ## 1 · Start with the detector average
#
# Fields always superpose. Expanding the averaged squared sum gives
# $I=I_1+I_2+2\operatorname{Re}\langle U_1U_2^*\rangle$.
# Normalized correlation is $\gamma=\langle U_1U_2^*\rangle/\sqrt{I_1I_2}$.
# Visibility equals $|\gamma|$ only for balanced beams with matching polarization.
# **Predict:** can low visibility occur even when the relative phase is stable?
# %%
phase=np.linspace(-2*np.pi,2*np.pi,501)
fig,ax=plt.subplots(1,2,figsize=(11,4))
for balance,gamma in [(1,1),(.1,1),(1,.3)]:
    I=1+balance+2*np.sqrt(balance)*gamma*np.cos(phase)
    V=2*np.sqrt(balance)*abs(gamma)/(1+balance)
    ax[0].plot(phase,I/(1+balance),label=f"I₂/I₁={balance}, γ={gamma}, V={V:.2f}")
ax[0].set(xlabel="Fringe phase (rad)",ylabel="Intensity / mean");ax[0].legend(fontsize=9)
sigma=5. # THz, baseband Gaussian spectrum
nu=np.linspace(-6*sigma,6*sigma,4001);weights=np.exp(-.5*(nu/sigma)**2);weights/=weights.sum()
tau=np.linspace(0,100,301) # fs
correlation=np.exp(-2j*np.pi*.001*tau[:,None]*nu)@weights
analytic=np.exp(-.5*(2*np.pi*.001*sigma*tau)**2)
assert np.max(abs(abs(correlation)-analytic))<5e-9
ax[1].plot(tau,abs(correlation),label="Spectral quadrature");ax[1].plot(tau,analytic,"--",label="Gaussian analytic")
ax[1].set(xlabel="Delay (fs)",ylabel="|γ|");ax[1].legend()
show(fig,"01-visibility-and-delay")
print("Gaussian spectrum Fourier-transform error:",np.max(abs(abs(correlation)-analytic)))
# %% [markdown]
# ## 2 · Random across space does not mean changing in time
#
# A fixed rough surface can produce a fixed random interference pattern. Averaging copies
# of the same intensity leaves its contrast unchanged. Independent equal-weight patterns
# approximately follow $C=\sigma_I/\langle I\rangle=1/\sqrt N$ for resolved,
# fully developed single-polarization speckle. Finite images give sampling variation.
# %%
rng=np.random.default_rng(17)
n=128;freq=np.fft.fftfreq(n)*n;FX,FY=np.meshgrid(freq,freq)
pupil=FX*FX+FY*FY<14**2
patterns=[]
for _ in range(64):
    field=np.fft.ifft2((rng.normal(size=(n,n))+1j*rng.normal(size=(n,n)))*pupil)
    I=abs(field)**2;patterns.append(I/I.mean())
patterns=np.asarray(patterns)
counts=np.array([1,4,16,64])
contrast=lambda image:image.std()/image.mean()
contrasts=np.array([contrast(patterns[:N].mean(axis=0)) for N in counts])
repeated=np.repeat(patterns[:1],64,axis=0).mean(axis=0)
assert abs(contrast(repeated)-contrast(patterns[0]))<1e-12
assert contrasts[-1]<.2 and contrasts[-1]<contrasts[0]/4
fig,ax=plt.subplots(1,3,figsize=(12,3.7))
for a,I,title in zip(ax[:2],[patterns[0],patterns.mean(axis=0)],["One fixed pattern","64 independent patterns"]):
    a.imshow(I,cmap="magma",vmin=0,vmax=4);a.set(title=title,xlabel="Pixel",ylabel="Pixel")
ax[2].loglog(counts,contrasts,"o-",label="Finite image");ax[2].loglog(counts,1/np.sqrt(counts),"--",label="1/√N")
ax[2].set(xlabel="Independent patterns",ylabel="Contrast");ax[2].legend()
show(fig,"02-speckle-averaging")
print("Measured contrasts:",dict(zip(counts,contrasts)))
# %% [markdown]
# ## 3 · A matrix of correlations
#
# $J_{ij}=\langle U_i U_j^*\rangle$ contains intensity on its diagonal and pairwise
# complex correlations elsewhere. For two equal-intensity samples,
# $J=[[1,\rho],[\rho,1]]$ has in-phase and out-of-phase modes with powers $1+\rho$ and $1-\rho$.
# The general Hermitian positive-semidefinite matrix has the same decomposition.
#
# Here each independent source angle produces a coherent field across the whole aperture.
# The source weights add intensities between those fields; they do not remove interference within a field.
# %%
x=np.linspace(-10,10,80)
angles=np.linspace(-.04,.04,41)
weights=np.exp(-.5*(angles/.015)**2);weights/=weights.sum()
fields=np.exp(-(x[None,:]/5)**2)*np.exp(2j*np.pi/.55*angles[:,None]*x[None,:])
J=np.einsum("s,si,sj->ij",weights,fields,fields.conj())
powers,modes=np.linalg.eigh(J)
assert powers.min()>-1e-10
order=np.argsort(powers)[::-1];powers=np.maximum(powers[order],0);modes=modes[:,order]
assert np.linalg.norm(J-(modes*powers)@modes.conj().T)/np.linalg.norm(J)<1e-12
fig,ax=plt.subplots(1,2,figsize=(10,4))
ax[0].imshow(abs(J),origin="lower",extent=[x[0],x[-1],x[0],x[-1]],cmap="magma")
ax[0].set(xlabel="x₂ (μm)",ylabel="x₁ (μm)",title="|Mutual intensity|")
ax[1].plot(np.arange(1,len(powers)+1),np.cumsum(powers)/powers.sum(),"o-")
ax[1].set(xlim=(1,15),ylim=(0,1.02),xlabel="Retained modes",ylabel="Cumulative power fraction")
show(fig,"03-mutual-intensity")
print("Trace / eigenvalue sum:",np.trace(J).real,powers.sum())
# %% [markdown]
# ## Optional extension · Propagate the correlations three ways
#
# A linear field operator L sends J to $LJL^\dagger$. Equivalently, propagate each independent
# source field, or each eigenmode, before summing weighted intensities. These complete
# calculations must agree. A truncated mode sum is an approximation that needs its own error check.
# %%
n=len(x)
phase_mask=np.exp(.7j*np.sin(x))
L=np.fft.fft(np.eye(n),axis=0,norm="ortho")@np.diag(phase_mask)
direct=np.sum(weights[:,None]*abs(fields@L.T)**2,axis=0)
matrix=np.diag(L@J@L.conj().T).real
propagated=L@modes
full=abs(propagated)**2@powers
assert np.max(abs(direct-matrix))<1e-12
assert np.max(abs(direct-full))<1e-12
fig,ax=plt.subplots(1,2,figsize=(11,4))
ax[0].plot(direct,label="Source sum");ax[0].plot(full,"--",label="All coherent modes")
ax[0].set(xlabel="Output sample",ylabel="Intensity (common scale)");ax[0].legend()
for K in [1,2,4,8]:
    approx=abs(propagated[:,:K])**2@powers[:K]
    error=np.linalg.norm(approx-direct)/np.linalg.norm(direct)
    ax[1].plot(approx,label=f"{K} modes · error {error:.3f}")
ax[1].set(xlabel="Output sample",ylabel="Intensity");ax[1].legend(fontsize=9)
show(fig,"04-mode-propagation")
print("All-mode/source-sum maximum intensity difference:",np.max(abs(full-direct)))
