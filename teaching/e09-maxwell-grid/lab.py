# %% [markdown]
# ## 1 · Stagger the fields in space and time
#
# We use normalized c=ε₀=μ₀=1 and vacuum wavelength 1. Ez lives on integer cells;
# Hy is shifted half a cell and half a time step. With our sign convention a right-going
# wave has Hy=-n Ez. Update H from differences of E, then E from differences of H.
# The 1D Courant number is S=dt/dx and must not exceed 1 in vacuum.
#
# The boundary uses convolutional PML auxiliary memories. Defaults κ=1 and α=0 give
# a simple graded coordinate stretch; the function exposes κ and α for extensions.
# A layer that damps only E is also supplied for comparison—it is not a matched PML.
# **Predict:** can a better absorbing boundary repair a time step above the CFL limit?
# %%



def cpml(positions, end, pml_cells, dx, dt, left=True, right=True, m=3, target=1e-7, kappa_max=1., alpha_max=0.):
    positions = np.asarray(positions, float)
    if not pml_cells:
        return np.ones_like(positions), np.zeros_like(positions), np.ones_like(positions)
    depth = np.zeros_like(positions)
    if left:
        depth = np.maximum(depth, pml_cells - positions)
    if right:
        depth = np.maximum(depth, positions - (end - pml_cells))
    u = np.clip(depth / pml_cells, 0, 1)
    sigma_max = -(m + 1) * np.log(target) / (2 * pml_cells * dx)
    sigma = sigma_max * u**m
    kappa = 1 + (kappa_max - 1) * u**m
    alpha = alpha_max * (1 - u) * (u > 0)
    b = np.exp(-(sigma / kappa + alpha) * dt)
    a = np.zeros_like(b)
    np.divide(sigma * (b - 1), kappa * (sigma + kappa * alpha), out=a, where=sigma > 0)
    return b, a, kappa


def run1d(nx=601, N=40, S=.9, pml_cells=40, right='pml', eps=None, time=30, probes=(180,), src=120, t0=2., tau=.5, f0=1., initial=None, alpha=0., kappa=1.):
    dx = 1 / N
    dt = S * dx
    steps = round(time / dt)
    eps = np.ones(nx) if eps is None else np.asarray(eps)
    E, H = np.zeros(nx), np.zeros(nx - 1)
    if initial is not None:
        E[:], H[:] = initial
    ph, pe = np.zeros(nx - 1), np.zeros(nx - 2)
    bh, ah, kh = cpml(np.arange(nx - 1) + .5, nx - 1, pml_cells, dx, dt, right=right=='pml', alpha_max=alpha, kappa_max=kappa)
    be, ae, ke = cpml(np.arange(1, nx - 1), nx - 1, pml_cells, dx, dt, right=right=='pml', alpha_max=alpha, kappa_max=kappa)
    sigma = np.zeros(nx)
    if right == 'lossy':
        sigma[nx - 1 - pml_cells:] = 10.
    q = sigma * dt / (2 * eps)
    ca = (1 - q) / (1 + q)
    cb = dt / (dx * eps * (1 + q))
    tr = np.empty((steps, len(probes)))
    maxima = np.empty(steps)
    energy = np.empty(steps)
    flux = np.empty_like(tr)
    for k in range(steps):
        old_probe = E[list(probes)].copy()
        de = E[1:] - E[:-1]
        ph = bh * ph + ah * de
        H += S * (de / kh + ph)
        dh = H[1:] - H[:-1]
        pe = be * pe + ae * dh
        E[1:-1] = ca[1:-1] * E[1:-1] + cb[1:-1] * (dh / ke + pe)
        if src is not None:
            t = (k + 1) * dt
            E[src] += np.exp(-((t-t0)/tau)**2) * np.sin(2*np.pi*f0*(t-t0))
        E[0] = E[-1] = 0.
        tr[k] = E[list(probes)]
        pp = np.asarray(probes)
        flux[k] = -.25 * (old_probe + E[pp]) * (H[pp - 1] + H[pp])
        maxima[k] = np.max(abs(E))
        energy[k] = .5 * dx * (np.sum(eps * E**2) + np.sum(H**2))
    return np.arange(1, steps + 1) * dt, tr, maxima, energy, flux



N=40;nx=15*N+1
# A longer vacuum reference keeps its far-wall echo outside our recording window.
t,reference,_,_,_=run1d(nx=1001)
incident=(t>1)&(t<6);late=(t>18)&(t<29)
incident_norm=np.sum(reference[incident,0]**2)
fig,ax=plt.subplots(1,2,figsize=(11,4))
boundary_errors={}
for boundary in ['wall','lossy','pml']:
    _,trace,maxima,energy,_=run1d(right=boundary)
    difference=trace[:,0]-reference[:,0]
    ratio=np.sum(difference[late]**2)/incident_norm
    boundary_errors[boundary]=ratio
    ax[0].plot(t,trace[:,0],label=boundary)
    ax[1].plot(t,difference,label=boundary)
ax[0].set(xlabel="Time / optical period",ylabel="Probe Ez at x=4.5")
ax[1].set(xlim=(18,29),xlabel="Time / optical period",ylabel="Echo after reference subtraction")
for a in ax:a.legend()
show(fig,"01-boundary-reflections")
assert boundary_errors['pml']<1e-5 and boundary_errors['pml']<boundary_errors['lossy']
print("Late-window squared-field ratios:",boundary_errors)
# %% [markdown]
# ## 2 · Measure a dielectric reflection, not a raw probe peak
#
# Run a vacuum reference, subtract its field to isolate the reflected pulse, and gate the
# arrivals before boundary echoes return. At normal incidence, R=((1-n₂)/(1+n₂))².
# T needs the n₂/n₁ flux factor. For a broad pulse, finite-grid dispersion and temporal
# gating make this an approximation. The solver also returns interpolated -E×H flux.
# %%
n2=1.5;eps=np.ones(nx);eps[8*N:]=n2*n2
_,tr,_,_,flux=run1d(eps=eps,probes=(180,420))
_,ref,_,_,refflux=run1d(nx=1001,probes=(180,420))
rgate=abs(t-10.5)<2;tgate=abs(t-(7+2.5*n2))<2
R=np.sum((tr[rgate,0]-ref[rgate,0])**2)/incident_norm
T=n2*np.sum(tr[tgate,1]**2)/incident_norm
Tflux=np.sum(flux[tgate,1])/np.sum(refflux[incident,0])
exact=((1-n2)/(1+n2))**2
assert abs(R-exact)<.002 and abs(R+T-1)<.015
fig,ax=plt.subplots(figsize=(9,4))
ax.plot(t,tr[:,0]-ref[:,0],label="Reflected field · incident reference removed")
ax.plot(t,tr[:,1],label="Transmitted field")
ax.axvspan(8.5,12.5,alpha=.1,color="gray",label="Reflected arrival gate")
ax.set(xlim=(5,20),xlabel="Time / optical period",ylabel="Ez");ax.legend(fontsize=9)
show(fig,"02-interface-reflection")
print(f"R={R:.6f}, analytic R={exact:.6f}; T amplitude estimate={T:.6f}; T flux={Tflux:.6f}")
# %% [markdown]
# ## 3 · Stability and accuracy answer different questions
#
# A stable grid can still give the wrong phase velocity. In 1D vacuum the Yee relation is
# sin(ωdt/2)=S sin(knum dx/2). More cells per wavelength reduce dispersion.
# A dielectric has a shorter wavelength: count its cells using λ₀/n, not λ₀ alone.
# Boundary refinement must be tested while holding physical PML thickness fixed.
# %%
resolutions=np.array([8,12,20,30,40,60])
S=.9
kd=2*np.arcsin(np.sin(np.pi*S/resolutions)/S)
velocity=2*np.pi/(resolutions*kd)
assert abs(velocity[-1]-1)<abs(velocity[0]-1)
absorber=[]
for resolution in [20,40,80]:
    count=15*resolution+1;probe=round(4.5*resolution)
    tt,small,_,_,_=run1d(nx=count,N=resolution,pml_cells=resolution,probes=(probe,),src=3*resolution)
    _,large,_,_,_=run1d(nx=25*resolution+1,N=resolution,pml_cells=resolution,probes=(probe,),src=3*resolution)
    incoming=(tt>1)&(tt<6);echo=(tt>18)&(tt<29)
    absorber.append(np.sum((small[echo,0]-large[echo,0])**2)/np.sum(large[incoming,0]**2))
assert absorber[-1]<absorber[0]
fig,ax=plt.subplots(1,2,figsize=(11,4))
ax[0].plot(resolutions,velocity,"o-");ax[0].axhline(1,color="gray",ls="--")
ax[0].set(xlabel="Vacuum cells per wavelength",ylabel="Numerical phase velocity / c")
ax[1].semilogy([20,40,80],absorber,"o-")
ax[1].set(xlabel="Cells in fixed one-wavelength PML",ylabel="Echo squared-field ratio")
show(fig,"03-grid-and-absorber-convergence")
print("PML refinement:",absorber)
for S in [.9,1.02]:
    cells=241;j=np.arange(cells)
    initial=(np.exp(-((j-80)/9)**2)+1e-12*(-1.)**j,np.zeros(cells-1))
    _,_,maximum,_,_=run1d(nx=cells,N=20,S=S,pml_cells=0,right='wall',time=200*S/20,src=None,initial=initial)
    print("Courant",S,"max field after 200 steps",maximum[-1])
    assert maximum[-1]<2 if S<1 else maximum[-1]>1e10
# %% [markdown]
# ## Optional extension · A 2D TMz grid with CPML
#
# Ez is surrounded by staggered Hx and Hy. Each derivative direction needs its own PML
# memory. On an equal-spacing vacuum grid the stability bound is now S≤1/√2.
# The pulse and large-domain reference use identical source and probe positions relative
# to the center. Their difference isolates finite-boundary errors.
# %%
def run2d(nx=121, ny=121, N=20, S=.5, pml_cells=20, boundary='pml', time=9, probe_offset=(20,0), eps=None, initial=None, source=True):
    dx, dt=1/N, S/N
    steps=round(time/dt)
    E=np.zeros((nx,ny))
    Hx=np.zeros((nx,ny-1))
    Hy=np.zeros((nx-1,ny))
    if initial is not None:
        E[:]=initial
    eps=np.ones_like(E) if eps is None else np.asarray(eps)
    pxh,pyh=np.zeros_like(Hy),np.zeros_like(Hx)
    pxe,pye=np.zeros((nx-2,ny-2)),np.zeros((nx-2,ny-2))
    P=pml_cells if boundary=='pml' else 0
    bxh,axh,kxh=cpml(np.arange(nx-1)+.5,nx-1,P,dx,dt)
    byh,ayh,kyh=cpml(np.arange(ny-1)+.5,ny-1,P,dx,dt)
    bxe,axe,kxe=cpml(np.arange(1,nx-1),nx-1,P,dx,dt)
    bye,aye,kye=cpml(np.arange(1,ny-1),ny-1,P,dx,dt)
    sig=np.zeros_like(E)
    if boundary=='lossy':
        sig[:pml_cells,:]=sig[-pml_cells:,:]=10
        sig[:,:pml_cells]=sig[:,-pml_cells:]=10
    q=sig*dt/(2*eps)
    ca=(1-q)/(1+q)
    cb=dt/(dx*eps*(1+q))
    center=(nx//2,ny//2)
    probe=(center[0]+probe_offset[0],center[1]+probe_offset[1])
    traces=np.empty(steps)
    maxima=np.empty(steps)
    for n in range(steps):
        dex=E[1:,:]-E[:-1,:]
        dey=E[:,1:]-E[:,:-1]
        pxh=bxh[:,None]*pxh+axh[:,None]*dex
        pyh=byh[None,:]*pyh+ayh[None,:]*dey
        Hy+=S*(dex/kxh[:,None]+pxh)
        Hx-=S*(dey/kyh[None,:]+pyh)
        dhy=Hy[1:,1:-1]-Hy[:-1,1:-1]
        dhx=Hx[1:-1,1:]-Hx[1:-1,:-1]
        pxe=bxe[:,None]*pxe+axe[:,None]*dhy
        pye=bye[None,:]*pye+aye[None,:]*dhx
        E[1:-1,1:-1]=ca[1:-1,1:-1]*E[1:-1,1:-1]+cb[1:-1,1:-1]*(dhy/kxe[:,None]+pxe-dhx/kye[None,:]-pye)
        if source:
            t=(n+1)*dt
            E[center]+=np.exp(-((t-1.4)/.55)**2)*np.sin(2*np.pi*(t-1.4))
        E[0,:]=E[-1,:]=E[:,0]=E[:,-1]=0
        traces[n]=E[probe]
        maxima[n]=abs(E).max()
    return (np.arange(steps)+1)*dt,traces,maxima



t2,large,_=run2d(nx=321,ny=321,pml_cells=0,boundary='wall')
fig,ax=plt.subplots(figsize=(9,4))
errors={}
for boundary in ['wall','lossy','pml']:
    _,trace,_=run2d(boundary=boundary)
    delta=trace-large
    errors[boundary]=np.sum(delta[t2>4]**2)/np.sum(large[t2<4]**2)
    ax.plot(t2,delta,label=boundary)
ax.set(xlabel="Time / optical period",ylabel="2D probe error versus large-domain reference");ax.legend()
show(fig,"04-2d-cpml")
assert errors['pml']<errors['lossy'] and errors['pml']<1e-4
print("2D boundary squared-field ratios:",errors)
