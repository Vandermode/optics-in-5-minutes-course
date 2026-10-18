import {t} from './language.js';
import {spectrumState, spectralPower, correlation} from './coherence-spectrum.js';

const guide = document.getElementById('video-guide');
if (guide) initializeGuide();

function initializeGuide() {
  const explanations = [...guide.querySelectorAll('.video-bridge')];
  const parameters = new URL(location.href).searchParams;
  if (parameters.has('guide')) {
    const selected = new Set(parameters.get('guide').split(','));
    for (const detail of explanations) detail.open = selected.has(detail.id);
  }
  const revealHash = () => {
    const target = document.getElementById(location.hash.slice(1));
    if (!target || !guide.contains(target)) return;
    const detail = target.closest('.video-bridge');
    if (detail) {
      detail.open = true;
      requestAnimationFrame(() => target.scrollIntoView({block: 'start'}));
    }
  };
  revealHash();
  addEventListener('hashchange', revealHash);
  guide.addEventListener('click', event => {
    const link = event.target.closest('.video-bridge-link');
    if (link) document.getElementById(link.hash.slice(1)).open = true;
  });

  const frame = document.querySelector('#video iframe');
  let selectedTime = null;
  function setVideoTime(seconds, play) {
    if (!frame) return;
    selectedTime = seconds;
    const url = new URL(frame.src);
    url.searchParams.set('start', seconds);
    if (play) url.searchParams.set('autoplay', '1');
    else url.searchParams.delete('autoplay');
    frame.src = url.href;
    if (play) {
      let status = document.getElementById('video-seek-status');
      if (!status) {
        status = document.createElement('p');
        status.id = 'video-seek-status';
        status.className = 'video-seek-status';
        status.setAttribute('role', 'status');
        document.getElementById('video').append(status);
      }
      const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
      status.textContent = t('Video selected at {time}.', {time});
      frame.scrollIntoView({block: 'center'});
      frame.focus({preventScroll: true});
    }
  }
  const savedTime = parameters.get('videoAt');
  if (savedTime !== null && /^\d+$/.test(savedTime) && Number(savedTime) <= 600) setVideoTime(Number(savedTime), false);
  guide.addEventListener('click', event => {
    const link = event.target.closest('a[data-video-seek]');
    if (!link || !frame || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setVideoTime(Number(link.dataset.videoSeek), true);
  });

  const demo = guide.querySelector('.coherence-demo');
  if (demo) initializeSpectrum(demo, parameters);
  addEventListener('course:language-change', event => {
    const url = event.detail.url;
    url.searchParams.set('guide', explanations.filter(d => d.open).map(d => d.id).join(','));
    if (selectedTime !== null) url.searchParams.set('videoAt', selectedTime);
    // Preserve a directly linked explanation when the reader is still in this section.
    const target = document.getElementById(location.hash.slice(1));
    if (url.hash === '#video-guide' && target && guide.contains(target)) {
      const detail = target.closest('.video-bridge');
      // A stale fragment must not reopen an explanation the reader just closed.
      if (!detail || detail.open) url.hash = location.hash;
    }
    if (demo) {
      url.searchParams.set('guideWidth', document.getElementById('spectrum-width').value);
      url.searchParams.set('guidePath', document.getElementById('spectrum-path').value);
    }
  });
  guide.classList.add('video-guide-ready');
}

function initializeSpectrum(demo, parameters) {
  const width = document.getElementById('spectrum-width');
  const path = document.getElementById('spectrum-path');
  for (const [control, key] of [[width, 'guideWidth'], [path, 'guidePath']]) {
    const raw = parameters.get(key);
    if (raw !== null && raw.trim() && Number.isFinite(Number(raw))) {
      control.value = Math.max(Number(control.min), Math.min(Number(control.max), Number(raw)));
    }
  }
  demo.querySelector('.coherence-interactive').hidden = false;
  demo.querySelector('.coherence-fallback').hidden = true;
  const spectrumCanvas = document.getElementById('spectrum-plot');
  const coherenceCanvas = document.getElementById('coherence-plot');
  function render() {
    const widthNm = Number(width.value), pathUm = Number(path.value);
    const state = spectrumState(widthNm, pathUm);
    document.getElementById('spectrum-width-value').textContent = `${widthNm} nm`;
    document.getElementById('spectrum-path-value').textContent = `${pathUm.toFixed(1)} μm`;
    document.getElementById('spectrum-visibility').textContent = state.visibility.toFixed(3);
    document.getElementById('spectrum-length').textContent = `${state.coherenceLengthUm.toFixed(2)} μm`;
    document.getElementById('spectrum-rough').textContent = `${state.roughLengthUm.toFixed(2)} μm`;
    document.getElementById('spectrum-convention').textContent = t('Frequency FWHM: {width} THz. Here ℓe is the positive delay-path value where |g⁽¹⁾| = 1/e; it is not the full width of the envelope.', {width: state.frequencyFwhmTHz.toFixed(2)});
    const spectrum = axes(spectrumCanvas, [-70, 70], [0, 1.05], [-70, 0, 70], [0, 0.5, 1]);
    if (spectrum) {
      spectrum.curve(x => spectralPower(x, widthNm), '#135b60', 2.5);
      spectrum.segment(-state.frequencyFwhmTHz / 2, 0.5, state.frequencyFwhmTHz / 2, 0.5, '#b0712d', 2);
    }
    const interference = axes(coherenceCanvas, [-12, 12], [-1.12, 1.12], [-12, 0, 12], [-1, 0, 1]);
    if (interference) {
      interference.curve(x => correlation(x, widthNm).real, '#497d7c', 1);
      interference.curve(x => correlation(x, widthNm).envelope, '#b0712d', 2.5);
      interference.curve(x => -correlation(x, widthNm).envelope, '#b0712d', 1, [4, 3]);
      interference.segment(pathUm, -1.1, pathUm, 1.1, '#172f32', 1.5, [3, 3]);
    }
  }
  width.addEventListener('input', render);
  path.addEventListener('input', render);
  demo.closest('details').addEventListener('toggle', render);
  new ResizeObserver(render).observe(demo);
  render();
}

function axes(canvas, xRange, yRange, xTicks, yTicks) {
  const width = canvas.clientWidth, height = 216;
  if (width < 80) return null;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const context = canvas.getContext('2d');
  context.scale(dpr, dpr);
  const margins = {left: 35, right: 18, top: 14, bottom: 29};
  const x = value => margins.left + (value - xRange[0]) / (xRange[1] - xRange[0]) * (width - margins.left - margins.right);
  const y = value => height - margins.bottom - (value - yRange[0]) / (yRange[1] - yRange[0]) * (height - margins.top - margins.bottom);
  context.font = '16px Lato, Arial, sans-serif';
  context.fillStyle = '#536765';
  context.strokeStyle = '#dce2d8';
  context.lineWidth = 1;
  for (const value of yTicks) {
    context.beginPath(); context.moveTo(x(xRange[0]), y(value)); context.lineTo(x(xRange[1]), y(value)); context.stroke();
    context.textAlign = 'right'; context.textBaseline = 'middle'; context.fillText(String(value), margins.left - 7, y(value));
  }
  for (const value of xTicks) {
    context.textAlign = 'center'; context.textBaseline = 'top'; context.fillText(String(value), x(value), height - margins.bottom + 8);
  }
  const stroke = (colour, thickness, dash) => {
    context.strokeStyle = colour; context.lineWidth = thickness; context.setLineDash(dash); context.stroke(); context.setLineDash([]);
  };
  return {
    curve(fn, colour, thickness = 2, dash = []) {
      context.beginPath();
      const count = Math.max(1200, Math.ceil(width * 3));
      for (let i = 0; i <= count; i++) {
        const value = xRange[0] + i / count * (xRange[1] - xRange[0]);
        if (i === 0) context.moveTo(x(value), y(fn(value)));
        else context.lineTo(x(value), y(fn(value)));
      }
      stroke(colour, thickness, dash);
    },
    segment(x1, y1, x2, y2, colour, thickness = 1, dash = []) {
      context.beginPath(); context.moveTo(x(x1), y(y1)); context.lineTo(x(x2), y(y2)); stroke(colour, thickness, dash);
    },
  };
}
