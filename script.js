document.addEventListener('DOMContentLoaded', () => {
    const game = new BaseballGame();
    game.init();
});

class BaseballGame {
    constructor() {
        this.playerName = 'Player';
        this.oppositionName = 'Opposition';
        this.playerScore = 0;
        this.playerHits = 0;
        this.playerErrors = 0;
        this.oppositionScore = 0;
        this.oppositionHits = 0;
        this.oppositionErrors = 0;
        this.outs = 0;
        this.innings = 1;
        this.isBottomInning = false;
        this.runners = [0, 0, 0];
        this.playerTurn = false;
        this.gameStarted = false;
        this.lastPitch = '';
        this.lastResult = '';

        this.outcomes = {
            fastball: [
                { name: 'home run', probability: 0.05 },
                { name: 'triple', probability: 0.10 },
                { name: 'double', probability: 0.15 },
                { name: 'single', probability: 0.20 },
                { name: 'walk', probability: 0.10 },
                { name: 'strike out', probability: 0.30 },
                { name: 'out', probability: 0.10 }
            ],
            curveball: [
                { name: 'home run', probability: 0.03 },
                { name: 'triple', probability: 0.07 },
                { name: 'double', probability: 0.10 },
                { name: 'single', probability: 0.20 },
                { name: 'walk', probability: 0.10 },
                { name: 'strike out', probability: 0.25 },
                { name: 'out', probability: 0.25 }
            ],
            slider: [
                { name: 'home run', probability: 0.04 },
                { name: 'triple', probability: 0.08 },
                { name: 'double', probability: 0.12 },
                { name: 'single', probability: 0.22 },
                { name: 'walk', probability: 0.10 },
                { name: 'strike out', probability: 0.20 },
                { name: 'out', probability: 0.24 }
            ],
            changeup: [
                { name: 'home run', probability: 0.02 },
                { name: 'triple', probability: 0.05 },
                { name: 'double', probability: 0.18 },
                { name: 'single', probability: 0.25 },
                { name: 'walk', probability: 0.10 },
                { name: 'strike out', probability: 0.10 },
                { name: 'out', probability: 0.30 }
            ]
        };

        this.pitchTypes = ['fastball', 'curveball', 'slider', 'changeup'];
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.updateBattingIndicator();
        this.updateInningDisplay();
        this.updateBoxScore();
    }

    cacheDOM() {
        this.startButton = document.getElementById('startButton');
        this.hitButton = document.getElementById('hitButton');
        this.replayButton = document.getElementById('instantReplayButton');
        this.restartButton = document.getElementById('restartButton');
        this.flashMessageElement = document.getElementById('flashMessage');
        this.runMessageElement = document.getElementById('runMessage');
        this.playerScoreElement = document.getElementById('playerScore');
        this.oppositionScoreElement = document.getElementById('oppositionScore');
        this.outsElement = document.getElementById('outs');
        this.lastPitchValue = document.getElementById('lastPitchValue');
        this.lastResultValue = document.getElementById('lastResultValue');
        this.runnerElements = {
            player: [
                document.getElementById('runner1'),
                document.getElementById('runner2'),
                document.getElementById('runner3')
            ],
            opposition: [
                document.getElementById('runnerOpp1'),
                document.getElementById('runnerOpp2'),
                document.getElementById('runnerOpp3')
            ]
        };
        this.inningDisplayElement = document.getElementById('inningDisplay');
        this.playerStar = document.getElementById('playerStar');
        this.oppositionStar = document.getElementById('oppositionStar');
        this.playerLabel = document.getElementById('playerLabel');
        this.oppositionLabel = document.getElementById('oppositionLabel');
        this.boxScorePlayerLabel = document.getElementById('boxScore').querySelector('tbody tr:nth-child(2) td:first-child');
        this.boxScoreOppositionLabel = document.getElementById('boxScore').querySelector('tbody tr:nth-child(1) td:first-child');
        this.playerDot = document.getElementById('playerDot');
        this.oppositionDot = document.getElementById('oppositionDot');
        this.outDot1 = document.getElementById('outDot1');
        this.outDot2 = document.getElementById('outDot2');
        this.outDot3 = document.getElementById('outDot3');
    }

    bindEvents() {
        if (this.startButton) {
            this.startButton.addEventListener('click', this.startGame.bind(this));
        }
        if (this.hitButton) {
            this.hitButton.addEventListener('click', this.playTurn.bind(this));
        }
        if (this.replayButton) {
            this.replayButton.addEventListener('click', this.replayLastPlay.bind(this));
        }
        if (this.restartButton) {
            this.restartButton.addEventListener('click', this.resetGame.bind(this));
        }
    }

    startGame() {
        this.promptForNames();
        this.gameStarted = true;
        this.startButton.style.display = 'none';
        if (this.hitButton) this.hitButton.style.display = 'inline-block';
        this.playerTurn = false;
    }

    promptForNames() {
        this.playerName = prompt("Enter the player's name:", "Player");
        this.oppositionName = prompt("Enter the opposition team's name:", "Opposition");
        this.updateNames();
    }

    updateNames() {
        if (this.playerLabel) {
            this.playerLabel.innerHTML = `${this.playerName}: <span id="playerScore">0</span>`;
        }
        if (this.oppositionLabel) {
            this.oppositionLabel.innerHTML = `${this.oppositionName}: <span id="oppositionScore">0</span>`;
        }
        if (this.boxScorePlayerLabel) {
            this.boxScorePlayerLabel.innerText = this.playerName;
        }
        if (this.boxScoreOppositionLabel) {
            this.boxScoreOppositionLabel.innerText = this.oppositionName;
        }
    }

    playTurn() {
        if (!this.gameStarted) return;

        if (this.playerTurn) {
            this.playerTurnAction();
        } else {
            this.oppositionTurnAction();
        }

        this.attemptSteal();
    }

    playerTurnAction() {
        const outcome = this.determineOutcome();
        this.processOutcome(outcome, false);
    }

    oppositionTurnAction() {
        const outcome = this.determineOutcome();
        this.processOutcome(outcome, true);
    }

    determineOutcome() {
        const pitcherChoice = this.pitchTypes[Math.floor(Math.random() * this.pitchTypes.length)];
        const rand = Math.random();
        this.lastPitch = pitcherChoice;
        if (this.lastPitchValue) {
            this.lastPitchValue.innerText = this.capitalize(pitcherChoice);
        }

        let cumulativeProbability = 0;
        for (let outcome of this.outcomes[pitcherChoice]) {
            cumulativeProbability += outcome.probability;
            if (rand < cumulativeProbability) {
                return outcome;
            }
        }
        return null;
    }

    processOutcome(outcome, isOpposition) {
        if (!outcome) return;

        this.lastResult = outcome.name;
        if (this.lastResultValue) {
            this.lastResultValue.innerText = this.capitalize(outcome.name);
        }

        if (outcome.name === 'strike out' || outcome.name === 'out') {
            this.flashMessage(outcome.name === 'strike out' ? 'Strike Out!!' : 'Out', 2000);
            this.outs++;
            this.updateOutsIndicator();
            if (this.outs >= 3) {
                setTimeout(() => {
                    alert('Three outs! Switching turns.');
                    this.switchTurns();
                }, 2000);
            }
        } else {
            if (outcome.name !== 'walk' && outcome.name !== 'error') {
                if (isOpposition) {
                    this.oppositionHits++;
                } else {
                    this.playerHits++;
                }
            }
            if (outcome.name === 'error') {
                if (isOpposition) {
                    this.oppositionErrors++;
                } else {
                    this.playerErrors++;
                }
            }
            this.flashMessage(this.capitalize(outcome.name), 2000);
            this.advanceRunners(outcome.name, isOpposition);
        }

        this.updateBoxScore();
    }

    advanceRunners(hitType, isOpposition) {
        let runScored = false;
        let runCount = 0;

        if (hitType === 'walk') {
            if (this.runners[2] > 0 && this.runners[1] > 0 && this.runners[0] > 0) {
                runScored = true;
                runCount++;
                isOpposition ? this.addOppositionScore(1) : this.addPlayerScore(1);
            }
            if (this.runners[1] > 0 && this.runners[0] > 0) {
                this.runners[2] = 1;
            } else if (this.runners[0] > 0) {
                this.runners[1] = 1;
            }
            this.runners[0] = 1;
        } else {
            // Move existing runners forward
            for (let i = this.runners.length - 1; i >= 0; i--) {
                if (this.runners[i] > 0) {
                    this.runners[i] = 0;
                    if (i + this.getBaseIncrement(hitType) < 3) {
                        this.runners[i + this.getBaseIncrement(hitType)] = 1;
                    } else {
                        runScored = true;
                        runCount++;
                        isOpposition ? this.addOppositionScore(1) : this.addPlayerScore(1);
                    }
                }
            }

            // Handle the batter based on hit type
            if (hitType === 'single') {
                this.runners[0] = 1;
            } else if (hitType === 'double') {
                this.runners[1] = 1;
            } else if (hitType === 'triple') {
                this.runners[2] = 1;
            } else if (hitType === 'home run') {
                runScored = true;
                runCount++;
                isOpposition ? this.addOppositionScore(1) : this.addPlayerScore(1);
                this.flashMessage('Home Run!', 2000);
                this.runners = [0, 0, 0]; // Clear all the bases
            }
        }

        if (runScored) {
            const message = runCount === 1 ? 'Run Scores!' : 'Runs Score!!';
            this.flashMessage(message, 2000, true);
        }

        this.updateRunnerPosition(isOpposition);
    }

    getBaseIncrement(hitType) {
        switch (hitType) {
            case 'home run': return 4;
            case 'triple': return 3;
            case 'double': return 2;
            case 'single': return 1;
            case 'walk': return 1;
            case 'error': return 1;
            default: return 0;
        }
    }

    addPlayerScore(points) {
        this.playerScore += points;
        if (this.playerScoreElement) {
            this.playerScoreElement.innerText = this.playerScore;
        }
    }

    addOppositionScore(points) {
        this.oppositionScore += points;
        if (this.oppositionScoreElement) {
            this.oppositionScoreElement.innerText = this.oppositionScore;
        }
    }

    updateRunnerPosition(isOpposition) {
        const runners = isOpposition ? this.runnerElements.opposition : this.runnerElements.player;

        runners.forEach(runner => runner.style.display = 'none');

        if (this.runners[0] > 0) runners[0].style.display = 'block';
        if (this.runners[1] > 0) runners[1].style.display = 'block';
        if (this.runners[2] > 0) runners[2].style.display = 'block';

        this.positionRunners(runners, isOpposition);
    }

    positionRunners(runners, isOpposition) {
        const offsetX = -20;
        const offsetY = -20;

        if (this.runners[0] > 0) {
            runners[0].style.top = `calc(50% + ${offsetY}px)`;
            runners[0].style.left = `calc(75% + ${offsetX}px)`;
        }
        if (this.runners[1] > 0) {
            runners[1].style.top = `calc(15% + ${offsetY}px)`;
            runners[1].style.left = `calc(50% + ${offsetX}px)`;
        }
        if (this.runners[2] > 0) {
            runners[2].style.top = `calc(50% + ${offsetY}px)`;
            runners[2].style.left = `calc(15% + ${offsetX}px)`;
        }
    }

    flashMessage(message, duration, isRun = false) {
        const element = isRun ? this.runMessageElement : this.flashMessageElement;
        if (element) {
            element.innerText = message;
            element.style.display = 'block';
            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        }
    }

    updateOutsIndicator() {
        if (this.outDot1) this.outDot1.style.display = this.outs > 0 ? 'inline-block' : 'none';
        if (this.outDot2) this.outDot2.style.display = this.outs > 1 ? 'inline-block' : 'none';
        if (this.outDot3) this.outDot3.style.display = this.outs > 2 ? 'inline-block' : 'none';
    }

    resetGame() {
        this.playerScore = 0;
        this.playerHits = 0;
        this.playerErrors = 0;
        this.oppositionScore = 0;
        this.oppositionHits = 0;
        this.oppositionErrors = 0;
        this.outs = 0;
        this.innings = 1;
        this.isBottomInning = false;
        this.runners = [0, 0, 0];
        this.playerTurn = false;
        this.gameStarted = false;
        this.lastPitch = '';
        this.lastResult = '';
        this.updateUIElements();
        this.resetRunners();
        this.updateInningDisplay();
        this.updateBattingIndicator();
        this.updateBoxScore();
    }

    updateUIElements() {
        if (this.playerScoreElement) {
            this.playerScoreElement.innerText = this.playerScore;
        }
        if (this.oppositionScoreElement) {
            this.oppositionScoreElement.innerText = this.oppositionScore;
        }
        if (this.outsElement) {
            this.outsElement.innerText = `Outs: ${this.outs}`;
        }
        if (this.lastPitchValue) {
            this.lastPitchValue.innerText = 'N/A';
        }
        if (this.lastResultValue) {
            this.lastResultValue.innerText = 'N/A';
        }
        if (this.startButton) {
            this.startButton.style.display = 'inline-block';
        }
        if (this.hitButton) {
            this.hitButton.style.display = 'none';
        }
        this.updateOutsIndicator(); // Reset outs indicator
    }

    resetRunners() {
        this.runnerElements.player.forEach(runner => runner.style.display = 'none');
        this.runnerElements.opposition.forEach(runner => runner.style.display = 'none');
    }

    switchTurns() {
        this.resetRunners();
        this.playerTurn = !this.playerTurn;

        if (!this.isBottomInning) {
            this.isBottomInning = true;
        } else {
            this.isBottomInning = false;
            this.innings++;
        }

        if (this.innings > 9 && this.playerScore !== this.oppositionScore) {
            this.endGame();
            return;
        }

        this.outs = 0; // Immediately reset outs
        this.updateOutsIndicator(); // Immediately update outs indicator

        alert(this.isBottomInning ? `${this.playerName}'s turn!` : `${this.oppositionName}'s turn!`);
        this.updateInningDisplay();
        this.updateBattingIndicator();
    }

    updateInningDisplay() {
        if (this.inningDisplayElement) {
            this.inningDisplayElement.innerText = this.isBottomInning ? `Bottom of Inning ${this.innings}` : `Top of Inning ${this.innings}`;
        }
    }

    updateBattingIndicator() {
        if (this.playerStar) {
            this.playerStar.innerText = this.isBottomInning ? '★' : '';
        }
        if (this.oppositionStar) {
            this.oppositionStar.innerText = this.isBottomInning ? '' : '★';
        }
        if (this.playerDot) {
            this.playerDot.style.display = this.isBottomInning ? 'block' : 'none';
        }
        if (this.oppositionDot) {
            this.oppositionDot.style.display = this.isBottomInning ? 'none' : 'block';
        }
    }

    endGame() {
        alert(`Game over! ${this.playerScore > this.oppositionScore 
            ? `${this.playerName} wins!` 
            : this.playerScore < this.oppositionScore 
                ? `${this.oppositionName} wins!` 
                : "It's a tie!"}`);
        this.resetGame();
    }

    attemptSteal() {
        if (this.runners[0] === 1 && this.runners[1] === 0 && Math.random() < 0.1) {
            if (Math.random() < 0.5) {
                this.runners[0] = 0;
                this.runners[1] = 1;
                this.flashMessage('Runner Steals Second!', 2000);
            } else {
                this.outs++;
                this.updateOutsIndicator();
                this.flashMessage('Runner Caught Stealing!', 2000);
                this.runners[0] = 0;
                if (this.outs >= 3) {
                    setTimeout(() => {
                        alert('Three outs! Switching turns.');
                        this.switchTurns();
                    }, 2000);
                }
            }
            this.updateRunnerPosition();
        }
    }

    replayLastPlay() {
        if (!this.lastPitch || !this.lastResult) return;
        if (this.lastPitchValue) {
            this.lastPitchValue.innerText = this.capitalize(this.lastPitch);
        }
        if (this.lastResultValue) {
            this.lastResultValue.innerText = this.capitalize(this.lastResult);
        }
        this.flashMessage(this.lastResult.toUpperCase(), 2000);
    }

    updateBoxScore() {
        const playerRuns = document.getElementById('playerRuns');
        const playerHits = document.getElementById('playerHits');
        const playerErrors = document.getElementById('playerErrors');
        const oppositionRuns = document.getElementById('oppositionRuns');
        const oppositionHits = document.getElementById('oppositionHits');
        const oppositionErrors = document.getElementById('oppositionErrors');

        if (playerRuns) playerRuns.innerText = this.playerScore;
        if (playerHits) playerHits.innerText = this.playerHits;
        if (playerErrors) playerErrors.innerText = this.playerErrors;
        if (oppositionRuns) oppositionRuns.innerText = this.oppositionScore;
        if (oppositionHits) oppositionHits.innerText = this.oppositionHits;
        if (oppositionErrors) oppositionErrors.innerText = this.oppositionErrors;

        // Update the labels in the box score
        if (this.boxScorePlayerLabel) {
            this.boxScorePlayerLabel.innerText = this.playerName;
        }
        if (this.boxScoreOppositionLabel) {
            this.boxScoreOppositionLabel.innerText = this.oppositionName;
        }
    }

    capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}
