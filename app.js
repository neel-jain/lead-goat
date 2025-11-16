const today = new Date().toISOString().slice(0, 10);
let puzzle = null;
let currentSide = "A"; // track which team image is shown
let leftpressed = false
let leftguess = ""
let rightpressed = false
let rightguess = ""

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
    currentSide = "A";
    document.getElementById("team-image").src = puzzle.imageA;

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

// Generate image buttons
function generateButtons(teamA, teamB) {
  const allGuesses = [...teamA, ...teamB]; // keep duplicates

  const leftContainer = document.querySelector(".left-buttons");
  const rightContainer = document.querySelector(".right-buttons");

  leftContainer.innerHTML = "";
  rightContainer.innerHTML = "";

  const leftButtons = allGuesses.slice(0, 6);
  const rightButtons = allGuesses.slice(6, 12);

  leftButtons.forEach(pokemon => createButton(pokemon, leftContainer, "left"));
  rightButtons.forEach(pokemon => createButton(pokemon, rightContainer, "right"));

}

// Helper to create a Pokémon button
function createButton(pokemon, container, lr) {
  const filename = pokemon.toLowerCase().replace(/[\s.'!]/g, '-') + ".png";
  const imgBtn = document.createElement("img");
  imgBtn.src = `images/sprites/${filename}`;
  imgBtn.alt = pokemon;
  imgBtn.className = "guess-btn-img";

  imgBtn.onclick = () => handleGuess(imgBtn, pokemon, lr);

  container.appendChild(imgBtn);
}

// Handle a guess click
function handleGuess(imgBtn, pokemon, lr) {
  if (state.finished) return;
 
  if(lr == "left") {
    leftpressed = true;
    leftguess = pokemon;
  }
  else if(lr == "right") {
    rightpressed = true;
    rightguess = pokemon;
  }
  else return;
  imgBtn.style.filter = "brightness(1.25) saturate(1.25)";
  // Red/green tint
  /*if (correct) {
    imgBtn.style.filter = "brightness(1.3) saturate(200%) sepia(100%) hue-rotate(100deg)"
  } else {
    imgBtn.style.filter = "brightness(0.7) saturate(200%) sepia(100%) hue-rotate(-50deg)";
  }*/
  
  //imgBtn.style.pointerEvents = "none";

  if(leftpressed && rightpressed) 
  {
    if(leftguess == puzzle.leadA && rightguess == puzzle.leadB) endGame(true);
    else endGame(false);
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
    btn.style.border = "1px solid #333";
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

// Switch side button
/*document.getElementById("switch-side-btn").addEventListener("click", () => {
  if (!puzzle) return;

  if (currentSide === "A") {
    currentSide = "B";
    document.getElementById("team-image").src = puzzle.imageB;
  } else {
    currentSide = "A";
    document.getElementById("team-image").src = puzzle.imageA;
  }
});*/

// Initialize
window.onload = loadPuzzle;
