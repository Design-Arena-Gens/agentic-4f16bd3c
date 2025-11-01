'use client';

import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState('');
  const recorderRef = useRef(null);
  const [status, setStatus] = useState('Ready');

  // Animation state
  const animStateRef = useRef({ startMs: 0, stars: [] });

  const width = 1280; // recording resolution
  const height = 720;

  // Lyrics timing (seconds)
  const LYRICS = [
    { text: 'Twinkle, twinkle, little star', start: 0.5, end: 4.5 },
    { text: 'How I wonder what you are', start: 4.5, end: 8.5 },
    { text: 'Up above the world so high', start: 8.5, end: 12.5 },
    { text: 'Like a diamond in the sky', start: 12.5, end: 16.5 },
    { text: 'Twinkle, twinkle, little star', start: 16.5, end: 20.5 },
    { text: 'How I wonder what you are', start: 20.5, end: 24.5 },
  ];
  const TOTAL_DURATION = 26.5; // seconds including intro/outro

  function seededRandom(seed) {
    let s = seed % 2147483647;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  }

  function ensureStars() {
    if (animStateRef.current.stars.length) return;
    const rnd = seededRandom(42);
    const stars = Array.from({ length: 120 }).map(() => ({
      x: Math.floor(rnd() * width),
      y: Math.floor(rnd() * height * 0.75),
      r: 0.7 + rnd() * 1.8,
      p: rnd() * Math.PI * 2,
      c: rnd() < 0.2 ? '#a3e8ff' : '#fff6d5',
    }));
    animStateRef.current.stars = stars;
  }

  function drawScene(ctx, t) {
    ensureStars();

    // Background sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#0a0936');
    g.addColorStop(1, '#121e4b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);

    // Mountains silhouette
    ctx.fillStyle = '#0b122e';
    const baseY = height * 0.85;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= width; x += 40) {
      const y = baseY - 40 - 30 * Math.sin((x * 0.01) + t * 0.2) - 20 * Math.sin((x * 0.02) + t * 0.12);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, baseY);
    ctx.closePath();
    ctx.fill();

    // Twinkling stars
    for (const s of animStateRef.current.stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * 2 + s.p);
      ctx.globalAlpha = 0.6 + 0.4 * tw;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.8 + 0.4 * tw), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Moon
    const moonX = width * (0.15 + 0.7 * (t / TOTAL_DURATION));
    const moonY = height * 0.2 + 10 * Math.sin(t * 0.6);
    drawMoon(ctx, moonX, moonY, 36);

    // Floating diamond accompanying lyric "diamond"
    const diamondPulse = 1 + 0.1 * Math.sin(t * 4);
    drawDiamond(ctx, width * 0.8, height * 0.35, 28 * diamondPulse, '#f6e7a2');

    // Cute star characters bouncing
    const yBob = 6 * Math.sin(t * 4);
    drawSmileyStar(ctx, width * 0.25, height * 0.3 + yBob, 26);
    drawSmileyStar(ctx, width * 0.35, height * 0.22 - yBob, 22);

    // Ground meadow
    const gg = ctx.createLinearGradient(0, baseY, 0, height);
    gg.addColorStop(0, '#0e2b2d');
    gg.addColorStop(1, '#0b1f10');
    ctx.fillStyle = gg;
    ctx.fillRect(0, baseY, width, height - baseY);

    // Lyrics box
    drawLyrics(ctx, t);
  }

  function drawMoon(ctx, x, y, r) {
    ctx.save();
    ctx.shadowColor = '#ffe9a6';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ffe9a6';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    // Crescent effect
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + r * 0.35, y - r * 0.1, r * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function drawDiamond(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    const g = ctx.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, '#fffdf0');
    g.addColorStop(1, color || '#fff6d5');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawSmileyStar(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    const spike = 5;
    const step = Math.PI / spike;
    ctx.beginPath();
    for (let i = 0; i < 2 * spike; i++) {
      const rad = i % 2 === 0 ? r : r * 0.45;
      const a = i * step - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff2a3';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ffe680';
    ctx.fill();

    // Eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.05, r * 0.08, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.22, -r * 0.05, r * 0.08, 0, Math.PI * 2); ctx.fill();
    // Smile
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.35, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.restore();
  }

  function drawLyrics(ctx, t) {
    const pad = 24;
    const boxW = width - pad * 2;
    const boxH = 120;
    const boxX = pad;
    const boxY = height - boxH - 24;

    // Panel
    ctx.fillStyle = 'rgba(10, 16, 40, 0.65)';
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, boxX, boxY, boxW, boxH, 12, true, true);

    // Active line
    const active = LYRICS.find((l) => t >= l.start && t < l.end);
    const next = LYRICS.find((l) => t < l.start);

    ctx.font = '700 36px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (active) {
      const progress = (t - active.start) / (active.end - active.start);
      karaokeText(ctx, active.text, width / 2, boxY + 44, progress);
    } else {
      ctx.globalAlpha = 0.9;
      ctx.fillText('Twinkle, Twinkle Little Star', width / 2, boxY + 44);
      ctx.globalAlpha = 1;
    }

    // Next line
    if (next) {
      ctx.globalAlpha = 0.8;
      ctx.font = '600 24px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.fillStyle = '#cfe7ff';
      ctx.fillText(next.text, width / 2, boxY + 88);
      ctx.globalAlpha = 1;
    }
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (r > w / 2) r = w / 2; if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function karaokeText(ctx, text, cx, y, progress) {
    const maxW = width - 160;
    ctx.save();
    ctx.translate(cx, y);
    // Base text (muted)
    ctx.fillStyle = '#b9c9ff';
    drawWrappedText(ctx, text, 0, 0, maxW, 42, 0);

    // Highlighted portion using clip based on progress
    const totalW = Math.min(ctx.measureText(text).width, maxW);
    const clipW = Math.max(20, totalW * Math.min(1, Math.max(0, progress)));
    ctx.beginPath();
    ctx.rect(-totalW / 2, -28, clipW, 60);
    ctx.clip();
    ctx.fillStyle = '#fff1a1';
    drawWrappedText(ctx, text, 0, 0, maxW, 42, 0);
    ctx.restore();
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, lineIndex) {
    const words = text.split(' ');
    let line = '';
    let lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);
    const totalHeight = lines.length * lineHeight;
    let yy = y - totalHeight / 2 + lineHeight / 2;
    ctx.textAlign = 'center';
    for (const ln of lines) {
      ctx.fillText(ln.trim(), x, yy);
      yy += lineHeight;
    }
  }

  // Melody for Twinkle Twinkle in C major
  function getMelodyNotes() {
    const C = 261.63, D = 293.66, E = 329.63, F = 349.23, G = 392.00, A = 440.00;
    const beat = 0.5; // seconds per note
    const seq = [
      C, C, G, G, A, A, G, null,
      F, F, E, E, D, D, C, null,
      G, G, F, F, E, E, D, null,
      G, G, F, F, E, E, D, null,
      C, C, G, G, A, A, G, null,
      F, F, E, E, D, D, C, null,
    ];
    const notes = [];
    let t = 0.5; // slight intro delay
    for (const f of seq) {
      if (f) notes.push({ time: t, freq: f, dur: beat });
      t += beat;
    }
    return { notes, duration: t + 0.5 };
  }

  function startPreview() {
    if (isPlaying || isRecording) return;
    setStatus('Playing preview?');
    setIsPlaying(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    animStateRef.current.startMs = performance.now();

    // Audio
    const { notes } = getMelodyNotes();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const master = audioCtx.createGain();
    master.gain.value = 0.08; // gentle volume for kids
    master.connect(audioCtx.destination);
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.connect(master);
    const now = audioCtx.currentTime;
    let t = now;
    for (const n of notes) {
      osc.frequency.setValueAtTime(n.freq, now + n.time);
      // add tiny glide for cuteness
      osc.frequency.linearRampToValueAtTime(n.freq, now + n.time + Math.min(0.04, n.dur * 0.2));
    }
    osc.start(now + 0.45);
    osc.stop(now + TOTAL_DURATION);

    const loop = () => {
      const tSec = (performance.now() - animStateRef.current.startMs) / 1000;
      drawScene(ctx, tSec);
      if (tSec < TOTAL_DURATION) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setIsPlaying(false);
        setStatus('Ready');
      }
    };
    loop();
  }

  async function startRecording() {
    if (isPlaying || isRecording) return;
    setBlobUrl('');
    setStatus('Recording?');
    setIsRecording(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    animStateRef.current.startMs = performance.now();

    // Capture canvas stream
    const fps = 60;
    const canvasStream = canvas.captureStream(fps);

    // Audio graph to MediaStreamDestination
    const { notes } = getMelodyNotes();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const dest = audioCtx.createMediaStreamDestination();
    const master = audioCtx.createGain();
    master.gain.value = 0.12;
    master.connect(dest);

    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';

    // Gentle bell-like overtones
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    const gain2 = audioCtx.createGain();
    gain2.gain.value = 0.15;

    const attack = 0.01, release = 0.07;
    const env = audioCtx.createGain();
    env.gain.value = 0;

    osc.connect(env);
    osc2.connect(gain2).connect(env);
    env.connect(master);

    const now = audioCtx.currentTime;
    for (const n of notes) {
      const st = now + n.time;
      const et = st + n.dur;
      osc.frequency.setValueAtTime(n.freq, st);
      osc2.frequency.setValueAtTime(n.freq * 2, st);
      // mini envelope per note
      env.gain.setValueAtTime(0.0001, st - 0.002);
      env.gain.linearRampToValueAtTime(0.8, st + attack);
      env.gain.linearRampToValueAtTime(0.0001, et - release);
    }

    osc.start(now + 0.45);
    osc2.start(now + 0.45);
    osc.stop(now + TOTAL_DURATION);
    osc2.stop(now + TOTAL_DURATION);

    // Combine streams
    const mixed = new MediaStream();
    canvasStream.getTracks().forEach((t) => mixed.addTrack(t));
    dest.stream.getAudioTracks().forEach((t) => mixed.addTrack(t));

    const mimeCandidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let mime = '';
    for (const m of mimeCandidates) {
      if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
    }

    const rec = new MediaRecorder(mixed, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : { videoBitsPerSecond: 4_000_000 });
    recorderRef.current = rec;
    const chunks = [];
    rec.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: mime || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setIsRecording(false);
      setStatus('Ready');
    };

    rec.start(250);

    // Animation loop during recording
    const loop = () => {
      const tSec = (performance.now() - animStateRef.current.startMs) / 1000;
      drawScene(ctx, tSec);
      if (tSec < TOTAL_DURATION) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    loop();

    // Stop after duration
    setTimeout(() => {
      try { rec.stop(); } catch {}
      cancelAnimationFrame(rafRef.current);
    }, TOTAL_DURATION * 1000 + 400);
  }

  function stopAll() {
    try { cancelAnimationFrame(rafRef.current); } catch {}
    setIsPlaying(false);
    setIsRecording(false);
    setStatus('Ready');
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Initial frame
    drawScene(ctx, 0);
  }, []);

  return (
    <div className="container">
      <div className="header">
        <div className="title">Kids Rhyme Video Maker</div>
        <div className="subtitle">Create a cute Twinkle Twinkle video with music and download as WebM.</div>
      </div>

      <div className="panel">
        <div className="canvas-wrap">
          <canvas ref={canvasRef} width={width} height={height} />
        </div>
        <div className="controls">
          <button className="btn" onClick={startPreview} disabled={isPlaying || isRecording}>Play Preview</button>
          <button className="btn btn-accent" onClick={startRecording} disabled={isPlaying || isRecording}>Generate Video</button>
          <button className="btn btn-danger" onClick={stopAll} disabled={!isPlaying && !isRecording}>Stop</button>
          <span className="status">{status}</span>
        </div>
        <div className="footer">
          <div>
            {blobUrl ? (
              <a className="download" href={blobUrl} download="kids-rhyme-twinkle.webm">Download Video</a>
            ) : (
              <span className="status">No video yet</span>
            )}
          </div>
          <span className="status">Resolution: 1280?720 ? Duration: ~26s</span>
        </div>
      </div>
    </div>
  );
}
