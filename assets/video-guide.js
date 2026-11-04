// Optional viewing only. Video choices do not participate in the consultation payload.
(() => {
  const panel = document.getElementById('program-videos');
  const video = document.getElementById('program-video');
  const stage = document.getElementById('program-video-stage');
  const summaryButton = document.getElementById('video-summary-button');
  const fullButton = document.getElementById('video-full-button');
  const versionChoice = document.getElementById('video-version-choice');
  const versionSelect = document.getElementById('full-video-version');
  const status = document.getElementById('video-status');
  const directLink = document.getElementById('video-direct-link');
  const error = document.getElementById('video-error');
  if (!panel || !video) return;

  const films = {
    summary: {
      path: './assets/films/academy-study-summary.mp4',
      poster: './assets/films/academy-study-summary-poster.jpg',
      label: '31초 요약'
    },
    consultation: {
      path: './assets/films/academy-study-full-consultation.mp4',
      poster: './assets/films/academy-study-full-poster.jpg',
      label: '전체 설명 · 2분 4초 · 배경음악 포함'
    },
    final: {
      path: './assets/films/academy-study-full-final.mp4',
      poster: './assets/films/academy-study-full-poster.jpg',
      label: '전체 설명 · 2분 4초 · 효과음만'
    }
  };
  let mode = 'summary';

  function setFilm(key) {
    video.pause();
    error.hidden = true;
    const film = films[key];
    if (!film) {
      video.removeAttribute('src');
      video.removeAttribute('poster');
      video.load();
      stage.hidden = true;
      status.textContent = '전체 영상은 버전을 선택하면 재생할 수 있어요.';
      return;
    }
    stage.hidden = false;
    if (video.getAttribute('src') !== film.path) {
      video.src = film.path;
      video.poster = film.poster;
      video.load();
    }
    directLink.href = film.path;
    video.setAttribute('aria-label', film.label + ' 안내 영상');
    status.textContent = film.label + ' · 재생 버튼을 눌러주세요.';
    // No call to play(): selecting or opening a film never starts playback.
  }

  function setMode(nextMode) {
    mode = nextMode;
    summaryButton.setAttribute('aria-pressed', String(mode === 'summary'));
    fullButton.setAttribute('aria-pressed', String(mode === 'full'));
    versionChoice.hidden = mode !== 'full';
    setFilm(mode === 'summary' ? 'summary' : versionSelect.value);
  }

  summaryButton.addEventListener('click', () => setMode('summary'));
  fullButton.addEventListener('click', () => setMode('full'));
  versionSelect.addEventListener('change', () => setFilm(versionSelect.value));
  panel.addEventListener('toggle', () => {
    if (!panel.open) video.pause();
    else setFilm(mode === 'summary' ? 'summary' : versionSelect.value);
  });
  video.addEventListener('error', () => {
    if (video.hasAttribute('src')) error.hidden = false;
  });

  const step = document.getElementById('step-4');
  if (step) {
    new MutationObserver(() => {
      if (!step.classList.contains('active')) video.pause();
    }).observe(step, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
  });
})();
