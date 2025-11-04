// This is the main script that controls the pages. -->

const characterWait = 35; // time between writing single characters. (milliseconds)
const lineWait = 600; // time between lines that don't wait for user input. (milliseconds)

const continueBar = document.getElementById("continue-bar");
continueBar.style.display = 'none';

let autoScroll = true;
let skipLoading = false;
let msgIndex = 0;
let textHandlerRunning = false;

// Simple time delay function
function wait(ms) {
  if (skipLoading) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function textHandler() {
  if (textHandlerRunning) return;
  textHandlerRunning = true;

  while (msgIndex < messages.length) {
    if (skipLoading) {
      showAllRemainingText();
      break;
    }

    const output = document.getElementById("output_" + msgIndex);
    const text = messages[msgIndex];
    const isDialogue = dialogueLines.includes(msgIndex);
    const isLastLine = msgIndex === messages.length - 1;

    const textSpan = document.createElement("span");
    output.appendChild(textSpan);

    if (autoScroll) window.scrollTo(0, document.body.scrollHeight);

    if (skipLoading) {
      textSpan.innerHTML = text;
    } else {
      await typeText(textSpan, text, characterWait);
    }

    let cursor = null;
    if (isDialogue && !isLastLine) {
      cursor = document.createElement("span");
      cursor.classList.add("cursor");
      cursor.textContent = "_";
      cursor.style.display = "none";
      output.appendChild(cursor);
    }

    if (isDialogue) {
      if (cursor) cursor.style.display = "block";
      await waitForInput();
    } else if (isLastLine) {
      continueBar.style.display = 'inline';
	  window.scrollTo(0, document.body.scrollHeight);
    } else {
      await wait(lineWait);
    }

    if (cursor) cursor.style.display = "none";
    msgIndex++;
  }

  textHandlerRunning = false;
}

function typeText(element, text, speed) {
  return new Promise((resolve) => {
    if (skipLoading) {
      element.innerHTML = text;
      return resolve();
    }

    element.innerHTML = text;
    element.style.visibility = "hidden";

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    textNodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      for (let char of node.textContent) {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.visibility = "hidden";
        frag.appendChild(span);
      }
      node.parentNode.replaceChild(frag, node);
    });

    element.style.visibility = "visible";
    const spans = element.querySelectorAll("span");
    let i = 0;

    function reveal() {
      if (skipLoading) {
        spans.forEach(s => s.style.visibility = "visible");
        return resolve();
      }

      if (i < spans.length) {
        spans[i].style.visibility = "visible";
        const char = spans[i].textContent;
        i++;

        let delay = speed;
        if (/[,\-;]/.test(char)) delay = speed * 6;
        else if (/[.?!]/.test(char)) delay = speed * 10;

        setTimeout(reveal, delay);
      } else {
        resolve();
      }
    }
    reveal();
  });
}

// Wait for user input. 
function waitForInput() {
  return new Promise((resolve) => {
    if (skipLoading) return resolve();

    function onKey(e) {
      if (e.code === "Space") {
        e.preventDefault();
        document.removeEventListener("keydown", onKey);
        resolve();
      }
    }
    document.addEventListener("keydown", onKey);
  });
}

// Helper: instantly render all remaining lines (with HTML + fade-in)
function showAllRemainingText() {
  for (let i = msgIndex; i < messages.length; i++) {
    const output = document.getElementById("output_" + i);
    if (output) {
      output.innerHTML = '';
      const textSpan = document.createElement("span");
      textSpan.innerHTML = messages[i];
      textSpan.classList.add("fade-in"); // trigger fade-in animation
      output.appendChild(textSpan);
    }
  }
  continueBar.style.display = 'inline';
  window.scrollTo(0, document.body.scrollHeight);
}

// Listen for manual scrolling
document.addEventListener('scroll', () => {
  let scrollValue = this.scrollY;
});

// Skip button instantly completes everything
document.getElementById("skipLink").addEventListener("click", event => {
  event.preventDefault();
  if (skipLoading) return;
  skipLoading = true;
  showAllRemainingText();
});

textHandler();
