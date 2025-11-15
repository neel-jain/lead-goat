const today = new Date().toISOString().slice(0, 10);
let puzzle = null;
let currentSide = "A"; // track which team image is shown

let state = {
  guesses: 0,
  finished: false,
  won: false,
};

const save = JSON.parse(localStorage.getItem("dailyGame")) || {};

// Load today's puzzle
async function loadPuzzle() {
  try {
    const res = await fetch("puzzles.json");
    const puzzles = await res.json();

    puzzle = puzzles.find(p => p.date === today);

    if (!puzzle) {
      document.getElementById("message").textContent = "No puzzle for today.";
      return;
    }

    // Start with Team A
    currentSide = "A";
    document.getElementById("team-image").src = puzzle.imageA;

    generateButtons(puzzle.teamA, puzzle.teamB);

    if (save.lastPlayed === today) {
      state.finished = true;
      state.won = save.won;
      state.guesses = save.guesses;
      showEndScreen();
      lockButtons();
    }

  } catch (e) {
    console.error("Failed to load puzzle", e);
  }
}

// Generate image buttons
function generateButtons(teamA, teamB) {
  const allGuesses = [...teamA, ...teamB]; // keep duplicates

  const leftContainer = document.querySelector(".left-buttons");
  const rightContainer = document.querySelector(".right-buttons");

  leftContainer.innerHTML = "";
  rightContainer.innerHTML = "";

  const leftButtons = allGuesses.slice(0, 6);
  const rightButtons = allGuesses.slice(6, 12);

  leftButtons.forEach(pokemon => createButton(pokemon, leftContainer));
  rightButtons.forEach(pokemon => createButton(pokemon, rightContainer));

}

// Helper to create a Pokémon button
function createButton(pokemon, container) {
  const filename = pokemon.toLowerCase().replace(/[\s.'!]/g, '-') + ".png";
  const imgBtn = document.createElement("img");
  imgBtn.src = `images/sprites/${filename}`;
  imgBtn.alt = pokemon;
  imgBtn.className = "guess-btn-img";

  imgBtn.onclick = () => handleGuess(imgBtn, pokemon);

  container.appendChild(imgBtn);
}

// Handle a guess click
function handleGuess(imgBtn, pokemon) {
  if (state.finished || state.guesses >= 4) return;

  state.guesses++;

  const correct = pokemon === puzzle.leadA || pokemon === puzzle.leadB;

  // Red/green tint
  if (correct) {
    imgBtn.style.filter = "brightness(0.7) saturate(200%) sepia(100%) hue-rotate(100deg)";
  } else {
    imgBtn.style.filter = "brightness(0.7) saturate(200%) sepia(100%) hue-rotate(-50deg)";
  }

  imgBtn.style.opacity = "0.7";
  imgBtn.style.pointerEvents = "none";

  if (correct) {
    endGame(true);
  } else if (state.guesses === 4) {
    endGame(false);
  }
}

// End game logic
function endGame(won) {
  state.finished = true;
  state.won = won;

  let newStreak = 0;
  if (won) {
    if (save.lastPlayed === yesterdayDate()) {
      newStreak = (save.streak || 0) + 1;
    } else {
      newStreak = 1;
    }
  } else {
    newStreak = 0;
  }

  localStorage.setItem("dailyGame", JSON.stringify({
    lastPlayed: today,
    won: won,
    guesses: state.guesses,
    streak: newStreak,
  }));

  showEndScreen();
  lockButtons();
}

// UI updates
function showEndScreen() {
  const message = document.getElementById("message");
  const streakEl = document.getElementById("streak");
  const gameSave = JSON.parse(localStorage.getItem("dailyGame"));

  if (state.won) {
    message.textContent = `You got it in ${state.guesses} guesses!`;
  } else {
    message.textContent = `You used all 4 guesses! Correct leads: ${puzzle.leadA} / ${puzzle.leadB}`;
  }

  streakEl.textContent = `Streak: ${gameSave.streak}`;
}

function lockButtons() {
  document.querySelectorAll(".guess-btn-img").forEach(btn => btn.style.pointerEvents = "none");
}

// Helper for streak
function yesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Reset button
document.getElementById("reset-btn").addEventListener("click", () => {
  localStorage.removeItem("dailyGame");
  state.guesses = 0;
  state.finished = false;
  state.won = false;
  document.querySelectorAll(".guess-btn-img").forEach(btn => {
    btn.style.border = "1px solid #333";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
  });
  document.getElementById("message").textContent = "";
  document.getElementById("streak").textContent = "Streak: 0";
  loadPuzzle();
});

// Switch side button
document.getElementById("switch-side-btn").addEventListener("click", () => {
  if (!puzzle) return;

  if (currentSide === "A") {
    currentSide = "B";
    document.getElementById("team-image").src = puzzle.imageB;
  } else {
    currentSide = "A";
    document.getElementById("team-image").src = puzzle.imageA;
  }
});

// Initialize
window.onload = loadPuzzle;
