
const API_BASE_URL = 'https://juicewrldapi.com/juicewrld/radio';

const SNIPPET_DURATIONS = [1, 2, 4, 7, 11, 16];

const elements = {
  startBtn: document.getElementById('startBtn'),
  gameContainer: document.getElementById('gameContainer'),
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  audioPlayer: document.getElementById('audioPlayer'),
  playBtn: document.getElementById('playBtn'),
  guessInput: document.getElementById('guessInput'),
  submitBtn: document.getElementById('submitBtn'),
  skipBtn: document.getElementById('skipBtn'),
  suggestions: document.getElementById('suggestions'),
  guessSection: document.getElementById('guessSection'),
  resultSection: document.getElementById('resultSection'),
  resultTitle: document.getElementById('resultTitle'),
  playAgainBtn: document.getElementById('playAgainBtn'),
  fullAudioPlayer: document.getElementById('fullAudioPlayer'),
  revealSongTitle: document.getElementById('revealSongTitle'),
  revealSongArtist: document.getElementById('revealSongArtist'),
  revealSongAlbum: document.getElementById('revealSongAlbum'),
  revealSongDuration: document.getElementById('revealSongDuration'),
  downloadBtn: document.getElementById('downloadBtn')
};

let gameState = {
  currentSong: null,
  attempt: 0,
  isPlaying: false,
  gameOver: false
};

elements.startBtn.addEventListener('click', startNewGame);
elements.playBtn.addEventListener('click', togglePlayPause);
elements.submitBtn.addEventListener('click', submitGuess);
elements.skipBtn.addEventListener('click', skipAttempt);
elements.playAgainBtn.addEventListener('click', () => {

  elements.audioPlayer.pause();
  elements.audioPlayer.currentTime = 0;
  elements.fullAudioPlayer.pause();
  elements.fullAudioPlayer.currentTime = 0;
  startNewGame();
});

elements.guessInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    submitGuess();
  }
});

async function startNewGame() {
  try {
    elements.loading.classList.remove('hidden');
    elements.error.classList.add('hidden');
    elements.startBtn.classList.add('hidden');
    elements.gameContainer.classList.add('hidden');
    elements.resultSection.classList.add('hidden');
    
    const response = await fetch(`${API_BASE_URL}/random/`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    gameState = {
      currentSong: data,
      attempt: 0,
      isPlaying: false,
      gameOver: false
    };
    
    const encodedPath = encodeURIComponent(data.path);
    const audioUrl = `https://juicewrldapi.com/juicewrld/files/download/?path=${encodedPath}`;
    
    elements.audioPlayer.src = audioUrl;
    await new Promise((resolve) => {
      elements.audioPlayer.addEventListener('loadedmetadata', resolve, { once: true });
    });
    
    resetGameUI();
    
    elements.loading.classList.add('hidden');
    elements.gameContainer.classList.remove('hidden');
    
  } catch (err) {
    console.error('Error starting game:', err);
    elements.error.textContent = `Error: ${err.message}`;
    elements.error.classList.remove('hidden');
    elements.loading.classList.add('hidden');
    elements.startBtn.classList.remove('hidden');
  }
}

function resetGameUI() {
  document.querySelectorAll('.attempt-box').forEach(box => {
    box.className = 'attempt-box';
    box.textContent = '';
  });
  
  elements.guessInput.value = '';
  
  elements.guessSection.classList.remove('hidden');
  elements.resultSection.classList.add('hidden');
  document.querySelector('.audio-container').classList.remove('hidden');
  
  updatePlayButton();
  updateSkipButton();
}

function updateSkipButton() {
  if (gameState.attempt < 5) {
    const nextDuration = SNIPPET_DURATIONS[gameState.attempt + 1];
    const currentDuration = SNIPPET_DURATIONS[gameState.attempt];
    const addedSeconds = nextDuration - currentDuration;
    elements.skipBtn.textContent = `Skip (+${addedSeconds}s)`;
  } else {
    elements.skipBtn.textContent = `Skip`;
  }
}

function togglePlayPause() {
  if (gameState.isPlaying) {
    elements.audioPlayer.pause();
    gameState.isPlaying = false;
    updatePlayButton();
  } else {
    gameState.isPlaying = true;
    updatePlayButton();
    
    const duration = SNIPPET_DURATIONS[gameState.attempt];
    
    elements.audioPlayer.currentTime = 0;
    elements.audioPlayer.play();
    
    setTimeout(() => {
      elements.audioPlayer.pause();
      gameState.isPlaying = false;
      updatePlayButton();
    }, duration * 1000);
  }
}

function updatePlayButton() {
  const duration = SNIPPET_DURATIONS[gameState.attempt];
  if (gameState.isPlaying) {
    elements.playBtn.textContent = `⏸ Pause`;
  } else {
    elements.playBtn.textContent = `▶ Play (${duration}s)`;
  }
}

function submitGuess() {
  const guess = elements.guessInput.value.trim();
  
  if (!guess) return;
  
  const isCorrect = checkGuess(guess);
  
  const attemptBox = document.querySelector(`.attempt-box[data-attempt="${gameState.attempt + 1}"]`);
  
  if (isCorrect) {
    attemptBox.classList.add('correct');
    attemptBox.textContent = '✔';
    endGame(true);
  } else {
    attemptBox.classList.add('wrong');
    attemptBox.textContent = '✖';
    gameState.attempt++;
    
    if (gameState.attempt >= 6) {
      endGame(false);
    } else {
      elements.guessInput.value = '';
      updatePlayButton();
      updateSkipButton();
    }
  }
}

function skipAttempt() {
  const attemptBox = document.querySelector(`.attempt-box[data-attempt="${gameState.attempt + 1}"]`);
  attemptBox.classList.add('skipped');
  attemptBox.textContent = '⊘';
  
  gameState.attempt++;
  
  if (gameState.attempt >= 6) {
    endGame(false);
  } else {
    updatePlayButton();
    updateSkipButton();
  }
}

function checkGuess(guess) {
  const normalizedGuess = guess.toLowerCase().trim();
  const songTitle = gameState.currentSong.title.toLowerCase().trim();
  const trackTitles = gameState.currentSong.song?.track_titles || [];
  
  const cleanGuess = normalizedGuess
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*v\d+/gi, '')
    .replace(/\s*2\.0$/gi, '')
    .replace(/\s*(extended|outro|intro|alternate|alt|demo|og|leak|snippet)$/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  const cleanTitle = songTitle
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*v\d+/gi, '')
    .replace(/\s*2\.0$/gi, '')
    .replace(/\s*(extended|outro|intro|alternate|alt|demo|og|leak|snippet)$/gi, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanGuess === cleanTitle) return true;
  
  for (let title of trackTitles) {
    const cleanAltTitle = title.toLowerCase().trim()
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/\s*v\d+/gi, '')
      .replace(/\s*2\.0$/gi, '')
      .replace(/\s*(extended|outro|intro|alternate|alt|demo|og|leak|snippet)$/gi, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanGuess === cleanAltTitle) {
      return true;
    }
  }
  
  return false;
}

function expandAlbumName(albumName) {
  if (!albumName) return 'Unknown Album';
  
  const acronymMap = {
    'JUTE': 'Juiced Up The EP',
    'GB&GR': 'Goodbye & Good Riddance',
    'WOD': 'WRLD On Drugs',
    'DRFL': 'Death Race For Love',
    'LND': 'Legends Never Die',
    'FD': 'Fighting Demons',
    'TPNE': 'The Party Never Ends',
    'OUT': 'Outsiders',
    'POST': 'Posthumous',
    'afflictions': 'affliction',
    'HIH 999': 'HIH 999',
    'jw 999': 'Juice WRLD 999',
    'bdm': 'BINGEDRINKINGMUSIC',
    'ND': 'NOTHING\'S DIFFERENT </3',
    'TPP': 'The Pre Party',
    'TPP (EE)': 'The Pre Party (Extended)',
    'FD (DDE)': 'Fighting Demons (Digital Deluxe Edition)',
    'TPNE 2.0': 'The Party Never Ends 2.0',
    'LND (5YAE)': 'Legends Never Die (5th Anniversary Edition)',
    'Mainstream': 'Mainstream',
    'GB&GR (AE)': 'Goodbye & Good Riddance (Anniversary Edition)',
    'GB&GR (5YAE)': 'Goodbye & Good Riddance (5 Year Anniversary Edition)',
    'FD (CE)': 'Fighting Demons (Collector\'s Edition)',
    'Smule': 'Smule',
    'YouTube': 'YouTube',
    'SoundCloud': 'SoundCloud'
  };
  
  return acronymMap[albumName.toUpperCase()] || albumName;
}

function endGame(won) {
  gameState.gameOver = true;
  
  elements.guessSection.classList.add('hidden');
  elements.audioPlayer.pause();
  gameState.isPlaying = false;
  document.querySelector('.audio-container').classList.add('hidden');
  
  elements.resultSection.classList.remove('hidden');
  
  if (won) {
    const attempts = gameState.attempt + 1;
    elements.resultTitle.textContent = `You guessed the song correctly in ${attempts}/6 attempts!`;
  } else {
    elements.resultTitle.textContent = 'Better luck next time!';
  }
  
  elements.revealSongTitle.textContent = gameState.currentSong.title;
  elements.revealSongArtist.textContent = gameState.currentSong.song?.credited_artists || 'Juice WRLD';
  
  const albumName = gameState.currentSong.song?.era?.name || 'Unknown Album';
  elements.revealSongAlbum.textContent = expandAlbumName(albumName);
  
  const durationString = gameState.currentSong.song?.length;
  elements.revealSongDuration.textContent = durationString || 'Unknown';
  
  const trackTitles = gameState.currentSong.song?.track_titles || [];
  const trackTitlesContainer = document.getElementById('trackTitlesContainer');
  const revealTrackTitles = document.getElementById('revealTrackTitles');
  
  if (trackTitles.length > 0) {
    revealTrackTitles.textContent = trackTitles.join(', ');
    trackTitlesContainer.classList.remove('hidden');
  } else {
    trackTitlesContainer.classList.add('hidden');
  }
  
  const encodedPath = encodeURIComponent(gameState.currentSong.path);
  const audioUrl = `https://juicewrldapi.com/juicewrld/files/download/?path=${encodedPath}`;
  elements.fullAudioPlayer.src = audioUrl;
  
  elements.downloadBtn.href = audioUrl;
  const fileName = gameState.currentSong.title.replace(/[^\w\s-]/g, '') + '.mp3';
  elements.downloadBtn.download = fileName;
  
  if (!durationString) {
    elements.fullAudioPlayer.addEventListener('loadedmetadata', () => {
      if (elements.fullAudioPlayer.duration && !isNaN(elements.fullAudioPlayer.duration)) {
        const duration = Math.floor(elements.fullAudioPlayer.duration);
        elements.revealSongDuration.textContent = formatDuration(duration);
      }
    }, { once: true });
  }
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
