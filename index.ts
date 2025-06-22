import { SVG, Svg, Color } from '@svgdotjs/svg.js'

const WIRE_RED = '#f00';
const WIRE_GREEN = '#0f0';
const WIRE_BLUE = '#00f';
const WIRE_YELLOW = '#ff0';
const WIRE_BLACK = '#000';
const WIRE_WHITE = '#fff';
const WIRE_GREY = '#888';
const WIRE_PINK = '#f0f';
const WIRE_ORANGE = '#f80';
const WIRE_PURPLE = '#80f';
const WIRE_BROWN = '#843';

const WIRE_COLOR_MAP = {
  [WIRE_RED]: 'Red',
  [WIRE_GREEN]: 'Green', 
  [WIRE_BLUE]: 'Blue',
  [WIRE_YELLOW]: 'Yellow',
  [WIRE_BLACK]: 'Black',
  [WIRE_WHITE]: 'White',
  [WIRE_GREY]: 'Grey',
  [WIRE_PINK]: 'Pink',
  [WIRE_ORANGE]: 'Orange',
  [WIRE_PURPLE]: 'Purple',
  [WIRE_BROWN]: 'Brown'
};

let bomb: Bomb | null = null;
let lastPatternIndex: number = -1;
let defusalStartTime: number = 0;
let currentDefusal: DefusalRecord | null = null;

interface DefusalRecord {
  pattern: string;
  success: boolean;
  timeTaken: number;
  timestamp: number;
}

const recentDefusals: DefusalRecord[] = [];

const patterns = [
  {name: '1', wireColours: [WIRE_GREEN, WIRE_RED, WIRE_BLUE, WIRE_YELLOW], cutPattern: [1, 2]},
  {name: '2', wireColours: [WIRE_YELLOW, WIRE_BLACK, WIRE_GREEN, WIRE_YELLOW], cutPattern: [0, 1]},
  {name: '3', wireColours: [WIRE_ORANGE, WIRE_YELLOW, WIRE_YELLOW, WIRE_BLUE], cutPattern: [0, 3]},
  {name: '4', wireColours: [WIRE_BLUE, WIRE_BLACK, WIRE_WHITE, WIRE_RED], cutPattern: [0]},
  {name: '5', wireColours: [WIRE_ORANGE, WIRE_YELLOW, WIRE_GREEN, WIRE_BLACK], cutPattern: [2, 3, 1]},
  {name: '6', wireColours: [WIRE_YELLOW, WIRE_WHITE, WIRE_GREEN, WIRE_RED], cutPattern: [3]},
  {name: '7', wireColours: [WIRE_GREEN, WIRE_PINK, WIRE_BLUE, WIRE_PURPLE], cutPattern: [0, 2]},
  {name: '8', wireColours: [WIRE_ORANGE, WIRE_WHITE, WIRE_BROWN, WIRE_YELLOW], cutPattern: [0, 1]},
  {name: '9', wireColours: [WIRE_PURPLE, WIRE_YELLOW, WIRE_RED, WIRE_BLACK], cutPattern: [0, 2]},
  {name: '10', wireColours: [WIRE_WHITE, WIRE_BLACK, WIRE_GREY, WIRE_BLUE], cutPattern: [0, 1]},
  {name: '11', wireColours: [WIRE_YELLOW, WIRE_BLUE, WIRE_GREEN, WIRE_ORANGE], cutPattern: [2, 0]},
  {name: '12', wireColours: [WIRE_RED, WIRE_WHITE, WIRE_PURPLE, WIRE_PINK], cutPattern: [0, 3]},
  {name: '13', wireColours: [WIRE_YELLOW, WIRE_RED, WIRE_BLUE, WIRE_GREY], cutPattern: [0, 2]},
  {name: '14', wireColours: [WIRE_PINK, WIRE_GREY, WIRE_ORANGE, WIRE_GREEN], cutPattern: [0, 1]},
  {name: '15', wireColours: [WIRE_BROWN, WIRE_GREEN, WIRE_BLACK, WIRE_WHITE], cutPattern: [0, 2]},
  {name: '16', wireColours: [WIRE_PURPLE, WIRE_GREY, WIRE_RED, WIRE_YELLOW], cutPattern: [0, 3, 2]}
];

// Pattern statistics tracking
interface PatternStats {
  timesSeen: number;
  successfulDefusals: number;
  failedDefusals: number;
  totalAttempts: number;
}

const patternStats: PatternStats[] = patterns.map(() => ({
  timesSeen: 0,
  successfulDefusals: 0,
  failedDefusals: 0,
  totalAttempts: 0
}));

class Bomb {
  parent: any;
  element: any;
  cutPattern: number[];
  currentCut: number = 0;
  defused: boolean = false;
  detonated: boolean = false;
  wires: Wire[] = [];
  onDefuse: () => void;
  onDetonate: () => void;
  cutOrder: string;
  pattern: typeof patterns[0];

  constructor(parent: Svg, wires: string[], cutPattern: number[], onDefuse: () => void, onDetonate: () => void) {
    this.parent = parent;
    this.cutPattern = cutPattern;
    this.onDefuse = onDefuse;
    this.onDetonate = onDetonate;
    this.pattern = patterns.find(p => 
      p.wireColours.join(',') === wires.join(',') && 
      p.cutPattern.join(',') === cutPattern.join(',')
    )!;

    const group = parent.group();
    this.element = group;

    //const wrapper = group.rect(600, 600).fill("#111");
    group.rect(500, 500).move(50, 50).fill("#333");

    for (let i = 0; i < wires.length; i++) {
      this.wires.push(new Wire(this, i, wires[i]));
    }

    const hexagon = parent.polygon([
      [50, 300],    // left
      [175, 50],    // top left
      [425, 50],    // top right
      [550, 300],   // right
      [425, 550],   // bottom right
      [175, 550]    // bottom left
    ]).fill("white");
    
    group.clipWith(hexagon);

    this.cutOrder = cutPattern.map(position => {
      const wireColor = wires[position];
      return WIRE_COLOR_MAP[wireColor];
    }).join(' → ');
  }

  cut(position: number): void {
    if(this.cutPattern[this.currentCut] === position) {
      this.currentCut++;
      if(this.currentCut === this.cutPattern.length) {
        this.defused = true;
        this.onDefuse();
      }
    } else {
      this.detonated = true;
      this.onDetonate();
    }
  }
}

class Wire {
  bomb: Bomb;
  position: number;
  element: any;
  colour: any;

  constructor(bomb: Bomb, position: number, colour: string) {
    this.bomb = bomb;
    this.position = position;
    this.colour = new Color(colour).to(colour !== WIRE_BLACK ? '#000' : '#fff');
    console.log(this.colour);

    this.element = bomb.element.path(Wire.#generatePath(position))
      .fill('none')
      .stroke({ width: 25, color: this.colour.at(0).toHex() })
      .css('cursor', 'pointer');

    this.element.on('click', () => {
      this.bomb.cut(this.position);
      this.element.stroke({ color: this.colour.at(0.5).toHex() });
    });
  }

  static #generatePath(position: number): string {
    switch (position) {
      case 0:
        return `M 225,0 225,275 C 225,350 225,450 100,450`;
      case 1:
        return `M 350,600 350,300 C 350,250 350,150 500,150 L 600,150`;
      case 2:
        return `M 200,600 225,500 C 275,300 275,300 0,250`;
      case 3:
        return `M 500,0 400,100 C 250,250 250,250 500,600`;
      default:
        return '';
    }
  }
}

const svg = SVG('#bomb-svg').size(600, 600);

const successfulDefusalsElement = document.getElementById('successful-defusals');
const failedDefusalsElement = document.getElementById('failed-defusals');
const avgDefuseTimeElement = document.getElementById('avg-defuse-time');

const showCutOrderButton = document.getElementById('show-cut-order');
const cutOrderText = document.getElementById('cut-order-text');

let successfulDefusals = 0;
let failedDefusals = 0;
let avgDefuseTime = 0;

const patternGrid = document.getElementById('pattern-grid');

// Function to save enabled patterns to local storage
const saveEnabledPatterns = () => {
  const checkboxes = document.querySelectorAll('#pattern-grid input[type="checkbox"]');
  const enabledPatterns = Array.from(checkboxes)
    .map((checkbox: any) => ({
      index: parseInt(checkbox.dataset.patternIndex),
      enabled: checkbox.checked
    }));
  localStorage.setItem('enabledPatterns', JSON.stringify(enabledPatterns));
};

// Function to load enabled patterns from local storage
const loadEnabledPatterns = () => {
  const savedPatterns = localStorage.getItem('enabledPatterns');
  if (savedPatterns) {
    const enabledPatterns = JSON.parse(savedPatterns);
    enabledPatterns.forEach((pattern: { index: number, enabled: boolean }) => {
      const checkbox = document.querySelector(`#pattern-grid input[data-pattern-index="${pattern.index}"]`) as HTMLInputElement;
      if (checkbox) {
        checkbox.checked = pattern.enabled;
      }
    });
  }
};

// Create checkboxes for each pattern
patterns.forEach((pattern, index) => {
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = true; // Default to enabled
  checkbox.dataset.patternIndex = index.toString();
  
  const span = document.createElement('span');
  const stats = patternStats[index];
  const successRate = stats.totalAttempts > 0 
    ? Math.round((stats.successfulDefusals / stats.totalAttempts) * 100)
    : 0;
  span.textContent = `Pattern ${pattern.name} - ${successRate}% (${stats.successfulDefusals}/${stats.totalAttempts})`;
  
  label.appendChild(checkbox);
  label.appendChild(span);
  patternGrid?.appendChild(label);
});

// Load saved patterns after creating checkboxes
loadEnabledPatterns();

// Function to update pattern labels with current stats
const updatePatternLabels = () => {
  const labels = document.querySelectorAll('#pattern-grid label span');
  labels.forEach((span, index) => {
    const stats = patternStats[index];
    const successRate = stats.totalAttempts > 0 
      ? Math.round((stats.successfulDefusals / stats.totalAttempts) * 100)
      : 0;
    span.textContent = `Pattern ${patterns[index].name} - ${successRate}% (${stats.successfulDefusals}/${stats.totalAttempts})`;
  });
};

// Function to get enabled patterns
const getEnabledPatterns = () => {
  const checkboxes = document.querySelectorAll('#pattern-grid input[type="checkbox"]');
  return Array.from(checkboxes)
    .filter((checkbox: any) => checkbox.checked)
    .map((checkbox: any) => patterns[parseInt(checkbox.dataset.patternIndex)]);
};

// Function to calculate pattern weights
const calculatePatternWeights = (enabledPatterns: typeof patterns) => {
  const weights = enabledPatterns.map((pattern, index) => {
    const stats = patternStats[index];
    if (!stats) return 1;

    // If this is the last pattern used, give it zero weight
    if (patterns.indexOf(pattern) === lastPatternIndex) return 0;

    // Base weight on inverse of times seen (patterns seen less often get higher weight)
    const seenWeight = 1 / (stats.timesSeen + 1);

    // Calculate success rate
    const totalAttempts = stats.successfulDefusals + stats.failedDefusals;
    const successRate = totalAttempts > 0 ? stats.successfulDefusals / totalAttempts : 0.5;

    // Patterns with lower success rates get higher weight
    const difficultyWeight = 1 - successRate;

    // Combine weights (you can adjust these multipliers to change the influence of each factor)
    return (seenWeight * 2 + difficultyWeight * 3) / 5;
  });

  return weights;
};

// Function to get random pattern from enabled patterns with weights
const getRandomPattern = () => {
  const enabledPatterns = getEnabledPatterns();
  if (enabledPatterns.length === 0) return patterns[0];
  if (enabledPatterns.length === 1) return enabledPatterns[0];

  const weights = calculatePatternWeights(enabledPatterns);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  // Log pattern selection details
  console.group('Pattern Selection Weights');
  enabledPatterns.forEach((pattern, index) => {
    const stats = patternStats[patterns.indexOf(pattern)];
    const weight = weights[index];
    const percentage = (weight / totalWeight * 100).toFixed(1);
    const successRate = stats.totalAttempts > 0 
      ? (stats.successfulDefusals / stats.totalAttempts * 100).toFixed(1)
      : 'N/A';
    
    console.log(`Pattern ${pattern.name}: ${percentage}% chance (seen: ${stats.timesSeen}, success: ${successRate}%, ${stats.successfulDefusals}/${stats.totalAttempts} correct)`);
  });
  console.groupEnd();
  
  let random = Math.random() * totalWeight;
  for (let i = 0; i < enabledPatterns.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      const selectedPattern = enabledPatterns[i];
      const patternIndex = patterns.indexOf(selectedPattern);
      patternStats[patternIndex].timesSeen++;
      lastPatternIndex = patternIndex;
      console.log(`Selected Pattern ${selectedPattern.name} (${(weights[i] / totalWeight * 100).toFixed(1)}% chance)`);
      return selectedPattern;
    }
  }
  
  return enabledPatterns[0];
};

// Function to format time in seconds to a readable string
const formatTime = (ms: number): string => {
  const totalSeconds = ms / 1000;
  const seconds = Math.floor(totalSeconds);
  const milliseconds = Math.round((totalSeconds - seconds) * 1000);
  return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
};

// Function to update the recent defusals display
const updateRecentDefusals = () => {
  const recentDefusalsElement = document.getElementById('recent-defusals');
  if (!recentDefusalsElement) return;

  // Get the last 5 defusals, excluding the current one
  const pastDefusals = recentDefusals
    .slice(-5)
    .reverse();

  // Create the HTML for all defusals, current one first if it exists
  const defusalsHtml = [
    // Current defusal if it exists
    currentDefusal ? `
      <div class="defusal-record current">
        <span class="pattern">Pattern ${currentDefusal.pattern}</span>
      </div>
    ` : '',
    // Past defusals
    ...pastDefusals.map(defusal => `
      <div class="defusal-record ${defusal.success ? 'success' : 'failure'}">
        <span class="pattern">Pattern ${defusal.pattern}</span>
        <span class="result">${defusal.success ? '✓' : '✗'}</span>
        <span class="time">${formatTime(defusal.timeTaken)}</span>
      </div>
    `)
  ].join('');

  recentDefusalsElement.innerHTML = defusalsHtml;

  // Calculate and update average time
  const successfulDefusals = recentDefusals.filter(d => d.success);
  if (successfulDefusals.length > 0) {
    const avgTime = successfulDefusals.reduce((sum, d) => sum + d.timeTaken, 0) / successfulDefusals.length;
    avgDefuseTimeElement!.textContent = formatTime(avgTime);
  } else {
    avgDefuseTimeElement!.textContent = '0.000s';
  }
};

// Function to create the start button
const createStartButton = () => {
  const group = (svg as Svg).group();
  
  // Create the grey hexagon background
  const hexagon = (svg as Svg).polygon([
    [50, 300],    // left
    [175, 50],    // top left
    [425, 50],    // top right
    [550, 300],   // right
    [425, 550],   // bottom right
    [175, 550]    // bottom left
  ]).fill("#333");

  // Add the START text
  const text = (svg as Svg).text('START')
    .font({
      family: 'Arial',
      size: 72,
      weight: 'bold'
    })
    .fill('white')
    .center(300, 300);

  // Make the whole thing clickable
  const clickArea = (svg as Svg).rect(500, 500)
    .move(50, 50)
    .fill('transparent')
    .css('cursor', 'pointer')
    .on('click', () => {
      svg.clear();
      const pattern = getRandomPattern();
      bomb = new Bomb(svg as Svg, pattern.wireColours, pattern.cutPattern, onDefuse, onDetonate);
      defusalStartTime = Date.now();
      showCutOrderButton!.style.display = 'block';
      // Start tracking current defusal
      currentDefusal = {
        pattern: pattern.name,
        success: false,
        timeTaken: 0,
        timestamp: Date.now()
      };
      updateRecentDefusals();
    });

  group.add(hexagon);
  group.add(text);
  group.add(clickArea);
};

// Function to initialize the game
const initializeGame = () => {
  svg.clear();
  createStartButton();
  defusalStartTime = 0;
  showCutOrderButton!.style.display = 'none';
  cutOrderText!.style.display = 'none';
  currentDefusal = null;
  updateRecentDefusals();
};

// Add event listeners to checkboxes to update the current bomb when patterns are toggled
document.querySelectorAll('#pattern-grid input[type="checkbox"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    saveEnabledPatterns(); // Save state when checkbox changes
    initializeGame();
  });
});

// Initialize the game on page load
initializeGame();

const onDefuse = () => {
  console.log('defused');
  successfulDefusals++;
  successfulDefusalsElement!.textContent = successfulDefusals.toString();

  // Record the defusal
  const timeTaken = Date.now() - defusalStartTime;
  if (currentDefusal) {
    currentDefusal.success = true;
    currentDefusal.timeTaken = timeTaken;
  }
  recentDefusals.push(currentDefusal!);
  updateRecentDefusals();

  // Update pattern stats for successful defusal
  const currentPatternIndex = patterns.indexOf(bomb!.pattern);
  if (currentPatternIndex !== -1) {
    patternStats[currentPatternIndex].successfulDefusals++;
    patternStats[currentPatternIndex].totalAttempts++;
    updatePatternLabels();
  }

  svg.clear();
  cutOrderText!.style.display = 'none';
  showCutOrderButton!.style.display = 'block';

  const pattern = getRandomPattern();
  bomb = new Bomb(svg as Svg, pattern.wireColours, pattern.cutPattern, onDefuse, onDetonate);
  defusalStartTime = Date.now();
  // Start tracking new defusal
  currentDefusal = {
    pattern: pattern.name,
    success: false,
    timeTaken: 0,
    timestamp: Date.now()
  };
  updateRecentDefusals();
}

const onDetonate = () => {
  console.log('detonated');
  failedDefusals++;
  failedDefusalsElement!.textContent = failedDefusals.toString();

  // Record the defusal
  const timeTaken = Date.now() - defusalStartTime;
  if (currentDefusal) {
    currentDefusal.success = false;
    currentDefusal.timeTaken = timeTaken;
  }
  recentDefusals.push(currentDefusal!);
  updateRecentDefusals();

  // Update pattern stats for failed defusal
  const currentPatternIndex = patterns.indexOf(bomb!.pattern);
  if (currentPatternIndex !== -1) {
    patternStats[currentPatternIndex].failedDefusals++;
    patternStats[currentPatternIndex].totalAttempts++;
    updatePatternLabels();
  }

  svg.clear();
  cutOrderText!.style.display = 'none';
  showCutOrderButton!.style.display = 'block';
  
  const pattern = getRandomPattern();
  bomb = new Bomb(svg as Svg, pattern.wireColours, pattern.cutPattern, onDefuse, onDetonate);
  defusalStartTime = Date.now();
  // Start tracking new defusal
  currentDefusal = {
    pattern: pattern.name,
    success: false,
    timeTaken: 0,
    timestamp: Date.now()
  };
  updateRecentDefusals();
}

// Add cut order display logic


showCutOrderButton?.addEventListener('click', () => {
  if (cutOrderText) {
    cutOrderText.textContent = bomb!.cutOrder;
    cutOrderText.style.display = 'block';
    showCutOrderButton.style.display = 'none';
  }
});

// Add settings toggle functionality
const settingsToggle = document.getElementById('settings-toggle');
const settingsPanel = document.getElementById('settings-panel');
const settingsClose = document.getElementById('settings-close');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// Load dark mode preference from localStorage
const loadDarkMode = () => {
  const isDarkMode = localStorage.getItem('darkMode') === 'true';
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  darkModeToggle!.textContent = isDarkMode ? '☀️' : '🌙';
};

// Initialize dark mode
loadDarkMode();

settingsToggle?.addEventListener('click', () => {
  settingsPanel?.classList.toggle('active');
});

settingsClose?.addEventListener('click', () => {
  settingsPanel?.classList.remove('active');
});

darkModeToggle?.addEventListener('click', () => {
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'light' : 'dark');
  localStorage.setItem('darkMode', (!isDarkMode).toString());
  darkModeToggle.textContent = isDarkMode ? '🌙' : '☀️';
});

//const group = svg.group();


//const wrapper = group.rect(600, 600).fill("#111");
//const bomb = group.rect(500, 500).move(50, 50).fill("#333");

// const wire1 = new Wire(group, 1, '#666');
// const wire2 = new Wire(group, 2, '#666');
// const wire3 = new Wire(group, 3, '#666');
// const wire4 = new Wire(group, 4, '#666');

// Create a hexagon by drawing a polygon with 6 points, rotated 90 degrees, scaled 5x, with margins


