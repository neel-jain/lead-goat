const today = new Date().toISOString().slice(0, 10);
let puzzle = null;
let leftpressed = false
let leftguess = ""
let rightpressed = false
let rightguess = ""

const leftPositions = [
  {x: 75, y: 142},
  {x: 140, y: 146},
  {x: 205, y: 150},
  {x: 270, y: 154},
  {x: 335, y: 158},
  {x: 400, y: 162}
];

const rightPositions = [
  {x: 260, y: -244},
  {x: 325, y: -240},
  {x: 390, y: -236},
  {x: 455, y: -232},
  {x: 510, y: -228},
  {x: 575, y: -224}
];

let state = {
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

    generateButtons(puzzle.teamA, puzzle.teamB);

    if (save.lastPlayed === today) {
      state.finished = true;
      state.won = save.won;
      showEndScreen();
      lockButtons();
    }

  } catch (e) {
    console.error("Failed to load puzzle", e);
  }
}

// Generate image buttons in V formation
function generateButtons(teamA, teamB) {
  const allGuesses = [...teamA, ...teamB]; // keep duplicates

  const leftContainer = document.querySelector(".left-buttons");
  const rightContainer = document.querySelector(".right-buttons");

  leftContainer.innerHTML = "";
  rightContainer.innerHTML = "";

  // Ensure container is relative
  leftContainer.style.position = "relative";
  rightContainer.style.position = "relative";

  const leftButtons = allGuesses.slice(0, 6);
  const rightButtons = allGuesses.slice(6, 12);

  leftButtons.forEach((pokemon, i) => createButton(pokemon, leftContainer, "left", i));
  rightButtons.forEach((pokemon, i) => createButton(pokemon, rightContainer, "right", i));
}

// Helper to create a Pokémon button
function createButton(pokemon, container, side, index) {
  const filename = pokemon.toLowerCase().replace(/[\s.'!]/g, '');
  const imgBtn = document.createElement("img");
  try {
    if (side === "left") imgBtn.src = `https://play.pokemonshowdown.com/sprites/gen5-back/${filename}.png`;
    else imgBtn.src = `https://play.pokemonshowdown.com/sprites/gen5/${filename}.png`;
  } catch (error) {
    imgBtn.src = `images/sprites/${filename}.png`;
  }

  imgBtn.alt = pokemon;
  imgBtn.className = "guess-btn-img";
  imgBtn.style.position = "absolute";

  // Use index to position in V formation
  const pos = side === "left" ? leftPositions[index] : rightPositions[index];
  imgBtn.style.left = `${pos.x}px`;
  imgBtn.style.top = `${pos.y}px`;

  imgBtn.onclick = () => handleGuess(imgBtn, pokemon, side);

  container.appendChild(imgBtn);
}


let leftSelectedBtn = null;
let rightSelectedBtn = null;

function handleGuess(imgBtn, pokemon, lr) {
  if (state.finished) return;

  // Determine which side
  const container = lr === "left"
    ? document.querySelector(".left-buttons")
    : document.querySelector(".right-buttons");

  // Clear previous selection on this side
  if (lr === "left" && leftSelectedBtn) leftSelectedBtn.style.filter = "";
  if (lr === "right" && rightSelectedBtn) rightSelectedBtn.style.filter = "";

  // Mark this as currently selected
  imgBtn.style.filter = "brightness(1.25) saturate(1.25) drop-shadow(0 0 10px whitesmoke)";
  if (lr === "left") {
    leftSelectedBtn = imgBtn;
    leftpressed = true;
    leftguess = pokemon;
  } else {
    rightSelectedBtn = imgBtn;
    rightpressed = true;
    rightguess = pokemon;
  }

  // Only check after both sides have a guess
  if (leftpressed && rightpressed) {
    const leftCorrect = leftguess === puzzle.leadA;
    const rightCorrect = rightguess === puzzle.leadB;

    // Apply green/red glow per side
    if (leftSelectedBtn) {
      leftSelectedBtn.style.filter = leftCorrect
        ? "brightness(1.25) saturate(1.25) drop-shadow(0 0 10px #00ff00)"
        : "brightness(1.25) saturate(1.25) drop-shadow(0 0 10px #ff0000)";
    }

    if (rightSelectedBtn) {
      rightSelectedBtn.style.filter = rightCorrect
        ? "brightness(1.25) saturate(1.25) drop-shadow(0 0 10px #00ff00)"
        : "brightness(1.25) saturate(1.25) drop-shadow(0 0 10px #ff0000)";
    }

    endGame(leftCorrect && rightCorrect);
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
    message.textContent = `You got it!`;
  } else {
    message.textContent = `You didnt get it! Correct leads: ${puzzle.leadA} / ${puzzle.leadB}`;
  }

  streakEl.textContent = `Streak: ${gameSave.streak}`;
}

function lockButtons() {
  document.querySelectorAll(".guess-btn-img").forEach(btn => btn.style.pointerEvents = "none");
}
function resetImgs(){
  document.querySelectorAll(".guess-btn-img").forEach(btn => {
    btn.style.border = "0px solid #333";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
  });
}

// Helper for streak
function yesterdayDate() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Reset button
document.getElementById("reset-btn").addEventListener("click", () => {
  localStorage.removeItem("dailyGame");
  state.finished = false;
  state.won = false;
  document.querySelectorAll(".guess-btn-img").forEach(btn => {
    btn.style.border = "0px solid #333";
    btn.style.opacity = "1";
    btn.style.pointerEvents = "auto";
  });
  rightpressed = false
  leftpressed = false
  rightguess = ""
  leftguess = ""
  document.getElementById("message").textContent = "";
  document.getElementById("streak").textContent = "Streak: 0";
  loadPuzzle();
});



// Initialize
window.onload = loadPuzzle;
