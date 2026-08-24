// Flowing particle background: light dots continuously track the live pointer position.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  var canvas = document.getElementById('bg-particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var DPR = Math.max(1, window.devicePixelRatio || 1);
  var width = 0, height = 0;
  var particles = [];
  var pointer = { x: 0, y: 0, active: false };

  var SPEED_MIN = 0.5;
  var SPEED_MAX = 1.1;
  var CATCH_RADIUS = 14;
  var DOT_COLOR = 'rgba(120, 165, 220, 0.09)';
  var FADE_RGB = '250, 251, 253';
  var FADE_ALPHA_IDLE = 0.14;
  var FADE_ALPHA_MOVING = 0.45;
  var MOVE_BURST_MS = 220;
  var lastMoveTime = 0;

  function particleCount() {
    return Math.min(120, Math.max(35, Math.floor((width * height) / 16000)));
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var target = particleCount();
    if (particles.length < target) {
      while (particles.length < target) particles.push(spawn());
    } else {
      particles.length = target;
    }
  }

  // Standard normal pair via Box-Muller.
  function gaussianPair() {
    var u1 = Math.random() || 1e-6;
    var u2 = Math.random();
    var r = Math.sqrt(-2 * Math.log(u1));
    var theta = 2 * Math.PI * u2;
    return [r * Math.cos(theta), r * Math.sin(theta)];
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // Particles emerge from a 2D Gaussian cloud centered on the page, so they
  // arrive from all sides with a natural falloff toward the edges, then flow
  // toward the pointer like samples flowing from noise to data.
  function spawn() {
    var z = gaussianPair();
    var x = clamp(width / 2 + z[0] * width * 0.28, 0, width);
    var y = clamp(height / 2 + z[1] * height * 0.28, 0, height);
    return {
      x: x,
      y: y,
      speed: SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN),
      r: 0.8 + Math.random() * 1.0
    };
  }

  function targetPoint() {
    if (pointer.active) return pointer;
    return { x: width / 2, y: height / 2 };
  }

  function step() {
    var sinceMove = performance.now() - lastMoveTime;
    var alpha = sinceMove < MOVE_BURST_MS ? FADE_ALPHA_MOVING : FADE_ALPHA_IDLE;
    ctx.fillStyle = 'rgba(' + FADE_RGB + ', ' + alpha + ')';
    ctx.fillRect(0, 0, width, height);

    var target = targetPoint();

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Direction is recomputed toward the live pointer every frame, so
      // motion always heads to where the pointer is right now.
      var dx = target.x - p.x, dy = target.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CATCH_RADIUS || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
        particles[i] = spawn();
        continue;
      }

      p.x += (dx / dist) * p.speed;
      p.y += (dy / dist) * p.speed;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = DOT_COLOR;
      ctx.fill();
    }

    requestAnimationFrame(step);
  }

  window.addEventListener('mousemove', function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.active = true;
    lastMoveTime = performance.now();
  });
  window.addEventListener('mouseleave', function () {
    pointer.active = false;
  });
  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length) {
      pointer.x = e.touches[0].clientX;
      pointer.y = e.touches[0].clientY;
      pointer.active = true;
      lastMoveTime = performance.now();
    }
  }, { passive: true });
  window.addEventListener('touchend', function () {
    pointer.active = false;
  });
  window.addEventListener('resize', resize);

  resize();
  ctx.fillStyle = '#fafbfd';
  ctx.fillRect(0, 0, width, height);
  requestAnimationFrame(step);
})();
