# %% [markdown]
# ## 1 · Put physical units on a Fourier axis
#
# A paraxial lens maps spatial frequency $f_x$ to $x_f=\lambda f f_x$.
# A finite entrance field makes a finite-width spot. Tilting it changes the position,
# while increasing focal length stretches the entire focal-plane coordinate scale.
# **Predict:** double f before rerunning. Which plotted distance should double?
# %%
wavelength, focal_length = .55, 10000.  # μm
tilt = .01  # rad
n,dx = 512,1.
x=(np.arange(n)-n//2)*dx
field=np.exp(-(x/70)**2)*np.exp(2j*np.pi*np.sin(tilt)*x/wavelength)
F=lambda u:np.fft.fftshift(np.fft.fftn(np.fft.ifftshift(u),norm="ortho"))
FH=lambda u:np.fft.fftshift(np.fft.ifftn(np.fft.ifftshift(u),norm="ortho"))
frequency=np.fft.fftshift(np.fft.fftfreq(n,dx))
focal_x=wavelength*focal_length*frequency
spot=abs(F(field))**2
prediction=focal_length*np.sin(tilt)
peak_position=focal_x[np.argmax(spot)]
assert abs(peak_position-prediction)<=abs(focal_x[1]-focal_x[0])/2+1e-9
assert abs(np.sum(spot)/np.sum(abs(field)**2)-1)<1e-12
fig,ax=plt.subplots(figsize=(8,4))
ax.plot(focal_x,spot/spot.max());ax.axvline(prediction,color="tab:orange",ls="--",label="f sin θ")
ax.set(xlim=(-600,600),xlabel="Focal position (μm)",ylabel="Peak-normalized intensity");ax.legend()
show(fig,"01-directions-to-positions")
print("Predicted / sampled peak:",prediction,peak_position,"μm; focal sample spacing:",focal_x[1]-focal_x[0])
# %% [markdown]
# ## 2 · A 4f system transforms twice
#
# The first lens transforms the complex field, a mask multiplies it, and the second lens
# transforms again. Two forward transforms reverse the periodic spatial indices.
# For coherent illumination, filter the field first and square only at the detector.
# %%
n=128
yy,xx=np.mgrid[:n,:n]/n
letter=((xx>.25)&(xx<.36)&(yy>.2)&(yy<.8))|((xx>.25)&(xx<.74)&(yy>.2)&(yy<.31))|((xx>.25)&(xx<.64)&(yy>.43)&(yy<.54))
object_field=letter.astype(complex)
f=np.fft.fftshift(np.fft.fftfreq(n));FX,FY=np.meshgrid(f,f);radius=np.hypot(FX,FY)
masks={"No mask":np.ones((n,n)),"Low pass":radius<.04,"Central stop":radius>.04}
index=(-np.arange(n))%n
expected=object_field[np.ix_(index,index)]
assert np.max(abs(F(F(object_field))-expected))<1e-12
fig,ax=plt.subplots(1,4,figsize=(12,3.6))
ax[0].imshow(abs(object_field)**2,vmin=0,vmax=1.5,cmap="magma");ax[0].set_title("Input")
for a,(name,mask) in zip(ax[1:],masks.items()):
    image=F(mask*F(object_field))
    a.imshow(abs(image)**2,vmin=0,vmax=1.5,cmap="magma");a.set_title(name)
for a in ax:a.set(xlabel="x sample",ylabel="y sample")
show(fig,"02-fourier-masks")
print("4f reversal assertion passed.")
# %% [markdown]
# ## 3 · Rotate the background of a phase object
#
# A weak phase object has $U \approx 1+i\phi$. A small phase disk changes the relative
# phase of the central background and scattered components. This can reveal structure,
# but the finite disk also modifies low-frequency scattering: it is not an exact phase map.
# %%
phase_object=np.exp(.65j*letter)
phase_disk=np.exp(1j*np.pi/2*(radius<1.5/n))
revealed=F(phase_disk*F(phase_object))
assert np.ptp(abs(phase_object)**2)<1e-12
assert np.ptp(abs(revealed)**2)>.1
fig,ax=plt.subplots(1,3,figsize=(11,3.5))
for a,v,title in zip(ax,[.65*letter,abs(phase_object)**2,abs(revealed)**2],["Object phase (rad)","Input intensity","Phase-contrast intensity"]):
    a.imshow(v,cmap="magma",vmin=0,vmax=2.5 if "intensity" in title.lower() else .65)
    a.set(title=title,xlabel="x sample",ylabel="y sample")
show(fig,"03-phase-contrast")
# %% [markdown]
# ## Optional extension · Check the quadratic-phase cancellation
#
# At the back focal plane of a lens, an object placed immediately against the lens produces
# a Fourier transform with a remaining output quadratic phase. The Fresnel kernel below
# is evaluated directly and compared with the FFT on its correct physical output grid.
# A front-focal-plane placement cancels this additional coordinate phase; it matters for
# complex-field comparisons even when intensity pictures agree.
# %%
size,spacing,f_lens,lam=128,.5,100.,.55
xin=(np.arange(size)-size//2)*spacing
input_field=np.exp(-(xin/5)**2)*np.exp(.4j*np.sin(xin))
fx=np.fft.fftshift(np.fft.fftfreq(size,spacing))
xout=lam*f_lens*fx
k=2*np.pi/lam
lens=np.exp(-1j*k*xin*xin/(2*f_lens))
kernel=np.exp(1j*k*(xout[:,None]-xin[None,:])**2/(2*f_lens))
direct=kernel@(input_field*lens)*spacing
fourier=(F(input_field)*np.sqrt(size)*spacing)*np.exp(1j*k*xout*xout/(2*f_lens))
relative=np.linalg.norm(direct-fourier)/np.linalg.norm(direct)
assert relative<1e-12
fig,ax=plt.subplots(1,2,figsize=(10,3.6))
ax[0].plot(xout,abs(direct)**2,label="Direct Fresnel");ax[0].plot(xout,abs(fourier)**2,"--",label="FFT + output chirp")
ax[0].set(xlabel="Output x (μm)",ylabel="Intensity in common arbitrary units");ax[0].legend()
ax[1].plot(xout,np.angle(np.exp(1j*k*xout*xout/(2*f_lens))))
ax[1].set(xlabel="Output x (μm)",ylabel="Residual phase (rad)")
show(fig,"04-fresnel-check")
print("Direct-kernel/FFT field relative error:",relative)
