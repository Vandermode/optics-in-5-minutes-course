"""Small independent NumPy/SciPy fixtures for the browser models."""
from pathlib import Path
import json
import numpy as np
from scipy.optimize import brentq

ROOT = Path(__file__).resolve().parents[1]
out = {}
n = 32
j = np.arange(n)
u = np.cos(.31*j) + 1j*np.sin(.23*j)
out["fft"] = dict(real=u.real.tolist(), imag=u.imag.tolist(), expected_real=np.fft.fft(u).real.tolist(), expected_imag=np.fft.fft(u).imag.tolist())
dx=.1;lam=.55;z=1.7
kz=2*np.pi*np.sqrt(1/lam**2-np.fft.fftfreq(n,dx)**2+0j)
v=np.fft.ifft(np.fft.fft(u)*np.exp(1j*z*kz))
out["asm"]=dict(dx=dx,wavelength=lam,z=z,real=v.real.tolist(),imag=v.imag.tolist())

def stack(nu,n1,n2,pairs):
    def layer(n):
        p=np.pi*nu*n
        return np.array([[np.cos(p),1j*np.sin(p)/n],[1j*n*np.sin(p),np.cos(p)]])
    cell=layer(n2)@layer(n1)
    A,B,C,D=np.linalg.matrix_power(cell,pairs).ravel()
    ni=no=1.9
    denominator=no*A-C-ni*no*B+ni*D
    r=-(no*A-C+ni*no*B-ni*D)/denominator
    t=2*ni/denominator
    return dict(R=float(abs(r)**2),T=float(abs(t)**2),halftrace=float(np.trace(cell).real/2))
out["stack"]=[dict(nu=nu,n1=n1,n2=n2,pairs=pairs,**stack(nu,n1,n2,pairs)) for nu,n1,n2,pairs in [(.12,1.5,2.3,3),(.26,1.5,2.3,8),(.4,1.9,1.9,12),(.35,1.7,2.1,4)]]
out["slab"]=[]
for width in [1,3,5,8]:
    a=width/2;k=2*np.pi/1.55;V=k*a*np.sqrt(1.5**2-1.45**2)
    roots=[]
    for m in range(12):
        low=m*np.pi/2+1e-9;high=min((m+1)*np.pi/2,V)-1e-9
        if high<=low:break
        f=lambda u:(-u/np.tan(u) if m%2 else u*np.tan(u))-np.sqrt(V*V-u*u)
        if f(low)*f(high)>0:continue
        root=brentq(f,low,high,xtol=1e-14)
        roots.append(float(np.sqrt(1.5**2-(root/(k*a))**2)))
    out["slab"].append(dict(width=width,neff=roots))
n=8
y,x=np.mgrid[:n,:n];phi=.4*np.sin(.5*x+.7*y)
a=((x-n/2)**2+(y-n/2)**2<(.45*n)**2).astype(float)
target=np.exp(-(((x-n/2)/n-.2)**2+((y-n/2)/n)**2)/(.04**2*2))+np.exp(-(((x-n/2)/n+.2)**2+((y-n/2)/n)**2)/(.04**2*2))
target*=a.sum()/target.sum()
F=lambda z:np.fft.fftshift(np.fft.fft2(np.fft.ifftshift(z),norm="ortho"))
FH=lambda z:np.fft.fftshift(np.fft.ifft2(np.fft.ifftshift(z),norm="ortho"))
u=a*np.exp(1j*phi);v=F(u);res=abs(v)**2-target;scale=np.sum(target**2)
gradient=2*np.imag(u.conj()*FH(res*v/scale))
out["adjoint"]=dict(n=n,phi=phi.ravel().tolist(),amplitude=a.ravel().tolist(),target=target.ravel().tolist(),value=float(.5*np.sum(res**2)/scale),gradient=gradient.ravel().tolist())
(ROOT/"tests").mkdir(exist_ok=True)
(ROOT/"tests/references.json").write_text(json.dumps(out,indent=2)+"\n")
print("Wrote NumPy FFT/ASM, complex transfer-matrix, SciPy slab-root, and adjoint reference cases.")
