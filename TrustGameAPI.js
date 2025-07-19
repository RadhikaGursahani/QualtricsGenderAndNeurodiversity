// Defines functions for playing the TRUST GAME with a bot (or similar)
// Has the options for standard bot strategies - "tit for tat", "random return", "always selfish", "generous strategy" however by default the bot will pick a random strategy [which is saved with response]
// WARNING: need to set gamedata embed in survey flow to register responses from here
// Note: you need to call SetupGame and track your own game number for many games. Calling nextGameRound saves the round progress within the survey response.

// The code under OnReady and OnUnload indicates a standard question display for this game for the user. It assumes a dummy form field question and will make alterations to validate the response.
// Custom functionality is easy to enforce!

// Call to update game data (cached variables, do NOT get stored in the responses)
function updateGameData(gamedata) {
	// Rolling totals across game rounds
	Qualtrics.SurveyEngine.setEmbeddedData('playertotal', gamedata.playertotal);
	Qualtrics.SurveyEngine.setEmbeddedData('bottotal', gamedata.bottotal);

	// Player's responses
	Qualtrics.SurveyEngine.setEmbeddedData('playercurrent', gamedata.playercurrent);
	Qualtrics.SurveyEngine.setEmbeddedData('botcurrent', gamedata.botcurrent);
	// Note: the values are not accounting for multipliers, just raw

	// General game data
	Qualtrics.SurveyEngine.setEmbeddedData('botstrategy', gamedata.botstrategy);
	Qualtrics.SurveyEngine.setEmbeddedData('roundnumber', gamedata.roundnumber);
	Qualtrics.SurveyEngine.setEmbeddedData('lastplay', gamedata.lastplay); //not saved, indicates last transaction with multiplier. For semantics only
	Qualtrics.SurveyEngine.setEmbeddedData('botgender', gamedata.botgender);
	Qualtrics.SurveyEngine.setEmbeddedData('botneuro', gamedata.botneuro);
}

// Call to create the game variables
function SetupGame() {
	var gamedata = {
		playertotal: 100,
		bottotal: 100,
		playercurrent: NaN,
		botcurrent: NaN,
		botstrategy: 0,
		roundnumber: 0,
		lastplay: NaN,
		botgender: 0, // indeterminate
		botneuro: 0 // indeterminate
	};

	updateGameData(gamedata);
}

// Call to retrieve game data
function getGameData() {
	var gamedata = {
		playertotal: 0,
		bottotal: 0,
		playercurrent: NaN,
		botcurrent: NaN,
		botstrategy: 0,
		roundnumber: 0,
		lastplay: NaN,
		botgender: 0, // indeterminate
		botneuro: 0 // indeterminate
	};

	// Cached variables, do NOT get stored in the responses
	gamedata.playertotal = Qualtrics.SurveyEngine.getEmbeddedData('playertotal');
	gamedata.bottotal = Qualtrics.SurveyEngine.getEmbeddedData('bottotal');
	gamedata.playercurrent = Qualtrics.SurveyEngine.getEmbeddedData('playercurrent');
	gamedata.botcurrent = Qualtrics.SurveyEngine.getEmbeddedData('botcurrent');
	gamedata.botstrategy = Qualtrics.SurveyEngine.getEmbeddedData('botstrategy');
	gamedata.roundnumber = Qualtrics.SurveyEngine.getEmbeddedData('roundnumber');
	gamedata.lastplay = Qualtrics.SurveyEngine.getEmbeddedData('lastplay');
	gamedata.botgender = Qualtrics.SurveyEngine.getEmbeddedData('botgender');
	gamedata.botneuro = Qualtrics.SurveyEngine.getEmbeddedData('botneuro');

	return gamedata;
}

// Records BOTH the bot's response and player's response as part of survey response for this round and start the next!
function nextGameRound(gamedata, gamenumber) {
	// Since qualtrics is stupid, append game stats to a monolith game embedded object!
	var monolith = JSON.parse(Qualtrics.SurveyEngine.getEmbeddedData('gamedata'));
	if (!monolith) { monolith = {}; }
	monolith['pr' + gamenumber + '-' + gamedata.roundnumber] = gamedata.playercurrent;
	monolith['br' + gamenumber + '-' + gamedata.roundnumber] = gamedata.botcurrent;
	monolith['pt' + gamenumber] = gamedata.playertotal;
	monolith['bt' + gamenumber] = gamedata.bottotal;
	monolith['bs' + gamenumber] = gamedata.botstrategy;
	monolith['bg' + gamenumber] = gamedata.botgender;
	monolith['bn' + gamenumber] = gamedata.botneuro;
	Qualtrics.SurveyEngine.setEmbeddedData('gamedata', JSON.stringify(monolith));

	gamedata.roundnumber = gamedata.roundnumber + 1;
	updateGameData(gamedata, gamenumber);

	return gamedata;
}

function getBotType(botID) {
	const typenames = ["unspecified-random", "tit-for-tat", "random-return", "always-selfish", "generous-strategy"];
	return typenames[botID];
}

function getBotPersonaDescription(botgenderID, botneuroID) {
	const gendernames = ["unknown", "male", "female", "non-binary"];
	const neurodescs = [" unknown ASD/ADHD identity status", "out ASD and/or ADHD", " ASD and/or ADHD", " ASD and ADHD", " ASD", " ADHD"];

	return "gender identity is " + gendernames[botgenderID] + " and with" + neurodescs[botneuroID] + ".";
}

// Lets the bot provide a decision in how much to transfer
function getBotResponse(gamedata) {
	// Set the bots strategy once per game if ran with random [MAKE SURE TO UPDATE GAMEDATA]
	if (gamedata.botstrategy == 0) {
		// Sets the strategy between 1 and 4
		gamedata.botstrategy = Math.floor(Math.random() * 4) + 1;
		Qualtrics.SurveyEngine.setEmbeddedData('botstrategy', gamedata.botstrategy);
		console.log('Test! The random bot strategy is now ' + getBotType(gamedata.botstrategy));
	}

	var goingfirst = !Number.isInteger(gamedata.playercurrent); // If determined going first

	var currentstrategy = gamedata.botstrategy;
	// Change temporary strategy for tit-for-tat based on game mechanism
	if (currentstrategy == 1 && goingfirst) {
		currentstrategy = 4;
	}

	switch (currentstrategy) {
		default:
		case 1: // tit-for-tat
			// Player went first, return same percentage of money
			var playergenerousity = gamedata.playercurrent / (gamedata.playertotal + gamedata.playercurrent);
			gamedata.botcurrent = Math.round(playergenerousity * gamedata.bottotal);
			break;
		case 2: // random-return
			gamedata.botcurrent = Math.round(Math.random() * gamedata.bottotal);
			break;
		case 3: // always-selfish
			gamedata.botcurrent = Math.round(Math.random() * Math.min(100, gamedata.bottotal));
			break;
		case 4: // generous-strategy
			gamedata.botcurrent = Math.round((0.4 + 0.2 * Math.random()) * gamedata.bottotal);
			break;
	}
	console.log('Test! The bot responded with ' + gamedata.botcurrent);
}

// Used to confirm the current value for a player should be their turn. Pass 'player' or 'bot'
function confirmResponse(playertype, gamedata) {
	// Fetch relative variables
	var thistotal;
	var thiscurrent;
	var theirtotal;
	var theircurrent;
	if (playertype == 'player') {
		thiscurrent = gamedata.playercurrent;
		thistotal = gamedata.playertotal;
		theircurrent = gamedata.botcurrent;
		theirtotal = gamedata.bottotal;
	}
	else if (playertype == 'bot') {
		thiscurrent = gamedata.botcurrent;
		thistotal = gamedata.bottotal;
		theircurrent = gamedata.playercurrent;
		theirtotal = gamedata.playertotal;
	}
	else {
		console.log('Tried to call confirmResponse() but the provided playertype is invalid!');
		return;
	}

	// Clamp current value
	thiscurrent = Math.max(Math.min(thistotal, thiscurrent), 0);
	// No pennies
	thiscurrent = Math.round(thiscurrent);

	// Send the cash to the other player, using a first turn multiplier
	if (gamedata.roundnumber == 0 && !Number.isInteger(theircurrent)) {
		gamedata.lastplay = thiscurrent * 3; // First round triple
	}
	else {
		gamedata.lastplay = thiscurrent * 2; // Other rounds double
	}
	console.log(gamedata.roundnumber);
	console.log(!Number.isInteger(theircurrent));
	theirtotal = theirtotal + gamedata.lastplay;
	console.log('Test! Confirmed ' + playertype + ' transferred ' + thiscurrent + ', sending ' + gamedata.lastplay);

	// Now remove from this player's total
	thistotal = thistotal - thiscurrent;

	// Reassign
	if (playertype == 'player') {
		gamedata.playercurrent = thiscurrent;
		gamedata.playertotal = thistotal;
		gamedata.botcurrent = theircurrent;
		gamedata.bottotal = theirtotal;
	}
	else if (playertype == 'bot') {
		gamedata.botcurrent = thiscurrent;
		gamedata.bottotal = thistotal;
		gamedata.playercurrent = theircurrent;
		gamedata.playertotal = theirtotal;
	}
}

// Available globals
var intervalId;
var timeout;
var numedit; // The players input
var fakeTimeout; // Fake timer instance start value
var realTimeoutMin;
var realTimeoutMax;
var realTimeoutBiasExponent; // Distributes bias towards minimum rather than maximum
var realTimeout; // Set to the computed timeout
var timeout; // Established timeouts

// Standard player response in the game
function setupPlayerResponseQuestion(qualtrics) {
	/*Place your JavaScript here to run when the page is fully displayed*/

	// Set globals
	intervalId = 0;
	timeout = 30; // Time the player to make a move

	gamedata = getGameData();

	// Set the input restrictions for the player
	numedit = document.getElementsByClassName("InputText")[0];
	numedit.type = "number";
	numedit.min = 0;
	numedit.max = gamedata.playertotal;
	numedit.oninput = function () {
		this.value = Math.round(Math.max(Math.min(this.max, this.value), this.min));
	};

	const playerpersonatextnode = document.createElement("p");
	playerpersonatextnode.innerHTML = "<p><br></br>The other Player's " + getBotPersonaDescription(gamedata.botgender, gamedata.botneuro) + "</p>";

	const playergametextnode = document.createElement("p");
	playergametextnode.innerHTML = "<p>You have &pound;" + gamedata.playertotal + " and they have &pound;" + gamedata.bottotal + ".</p>";

	var bedit = document.getElementsByClassName("QuestionBody")[0];

	// States the transferred amount by the bot (if they played last round)
	if (Number.isInteger(gamedata.botcurrent)) {
		const botresponsegametextnode = document.createElement("p");
		botresponsegametextnode.innerHTML = "<p>They decided to transfer &pound;" + gamedata.botcurrent + ", this means you received &pound;" + gamedata.lastplay + ".</p>";

		bedit.appendChild(botresponsegametextnode);
	}

	bedit.appendChild(playergametextnode);
	bedit.appendChild(playerpersonatextnode);

	// Timeout text
	const timeouttextnode = document.createElement("div");
	timeouttextnode.innerHTML = "<div id='timeout-text'><b>Timeout in " + timeout + ".</b></div>";
	bedit.appendChild(timeouttextnode);

	// Progress timeout
	intervalId = setInterval(() => {
		timeout = timeout - 1;
		var tedit = document.getElementById("timeout-text");
		tedit.innerHTML = "<b>Timeout in " + timeout + ".</b>";

		if (timeout <= 0) {
			qualtrics.clickNextButton();
			clearInterval(intervalId);
			intervalId = 0;
		}
	}, 1000);
}

function cleanupPlayerResponseQuestion() {
	clearInterval(intervalId);
}

// Standard wait for player to connect in game
function setupPlayerConnectQuestion(qualtrics) {
	/*Place your JavaScript here to run when the page is fully displayed*/

	// Set globals
	intervalId = 0; // Keep to kill the fake timer instance
	fakeTimeout = 30; // Fake timer instance start value
	realTimeoutMin = 5;
	realTimeoutMax = 25;
	realTimeoutBiasExponent = 2; // Distributes bias towards minimum rather than maximum
	realTimeout = fakeTimeout; // Set to the computed timeout

	// Disable the button so the user cannot avoid the wait!
	qualtrics.disableNextButton();

	// Upkeep a fake timeout label
	var bedit = document.getElementsByClassName("QuestionBody")[0];
	bedit.innerHTML = "<div>Timeout in " + fakeTimeout + ".</div>";
	intervalId = setInterval(() => {
		fakeTimeout = fakeTimeout - 1;
		var bedit = document.getElementsByClassName("QuestionBody")[0];
		bedit.innerHTML = "<div>Timeout in " + fakeTimeout + ".</div>";
	}, 1000);

	// Actions to be performed upon the real timeout
	realTimeout = 1000 * (realTimeoutMin + Math.pow(Math.random(), realTimeoutBiasExponent) * (realTimeoutMax - realTimeoutMin));
	console.log('Fake timeout - ' + fakeTimeout + '; Real timeout - ' + Math.floor(realTimeout / 1000));
	setTimeout(() => {
		qualtrics.clickNextButton();
	}, realTimeout);

	// Add a loader circle
	// Based upon https://www.w3schools.com/howto/howto_css_loader.asp
	const loadernode = document.createElement("div");
	loadernode.innerHTML = '<div class="loader"></div>';
	loadernode.style = 'border: 8px solid #f3f3f3; border-top: 8px solid #337ab7; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;';
	loadernode.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1000, iterations: Infinity });

	//Set the waiting message
	var qedit = document.getElementsByClassName("QuestionText")[0];
	qedit.innerHTML = '<div>Waiting for a player to connect...</div>';
	qedit.appendChild(loadernode);
}

function cleanupPlayerConnectQuestion(qualtrics) {
	/*Place your JavaScript here to run when the page is unloaded*/

	// Clean up
	clearInterval(intervalId);
	qualtrics.enableNextButton();
}

// Standard game start display
function setupGameWelcomeQuestion(goingfirst, qualtrics) {
	/*Place your JavaScript here to run when the page is fully displayed*/

	// Set globals
	intervalId = 0;
	timeout = 10;

	qualtrics.disableNextButton();
	gamedata = getGameData();

	const playerpersonatextnode = document.createElement("p");
	playerpersonatextnode.innerHTML = "<p><br>The information you have on the other Player is that their " + getBotPersonaDescription(gamedata.botgender, gamedata.botneuro) + "</p>";
	const playergametextnode = document.createElement("p");
	playergametextnode.innerHTML = "<p>You are starting with &pound;" + gamedata.playertotal + " and they have &pound;" + gamedata.bottotal + ".</p>";
	if (goingfirst) {
		playergametextnode.innerHTML = playergametextnode.innerHTML + "<p><br>You will go first, get ready!</p>"; //The other Player will go first!
	}
	else {
		playergametextnode.innerHTML = playergametextnode.innerHTML + "<p><br>The other Player will go first!</p>";
  }

	var bedit = document.getElementsByClassName("QuestionBody")[0];

	// States the transferred amount by the bot (if they played last round)
	if (Number.isInteger(gamedata.botcurrent)) {
		const botresponsegametextnode = document.createElement("p");
		botresponsegametextnode.innerHTML = "They decided to transfer &pound;" + gamedata.botcurrent + ", this means you received &pound;" + gamedata.lastplay + ".";

		bedit.appendChild(botresponsegametextnode);
	}

	bedit.appendChild(playergametextnode);
	bedit.appendChild(playerpersonatextnode);

	// Timeout text
	const timeouttextnode = document.createElement("div");
	timeouttextnode.innerHTML = "<div id='timeout-text'><b>Starting in " + timeout + "...</b></div>";
	bedit.appendChild(timeouttextnode);

	// Progress timeout
	intervalId = setInterval(() => {
		timeout = timeout - 1;
		var tedit = document.getElementById("timeout-text");
		tedit.innerHTML = "<b>Starting in " + timeout + "...</b>";

		if (timeout <= 0) {
			qualtrics.clickNextButton();
			clearInterval(intervalId);
			intervalId = 0;
		}
	}, 1000);
}

function cleanupGameWelcomeQuestion(qualtrics) {
	/*Place your JavaScript here to run when the page is unloaded*/
	clearInterval(intervalId);
	qualtrics.enableNextButton();
}

// Standard round waiting for other player question
function setupWaitingForPlayerResponseQuestion(qualtrics) {
	/*Place your JavaScript here to run when the page is fully displayed*/

	// Set globals
	intervalId = 0; // Keep to kill the fake timer instance
	fakeTimeout = 30; // Fake timer instance start value
	realTimeoutMin = 5;
	realTimeoutMax = 15;
	realTimeoutBiasExponent = 4; // Distributes bias towards minimum rather than maximum
	realTimeout = fakeTimeout; // Set to the computed timeout

	// Disable the button so the user cannot avoid the wait!
	qualtrics.disableNextButton();

	// Upkeep a fake timeout label
	var bedit = document.getElementsByClassName("QuestionBody")[0];
	const timeoutnode = document.createElement("div");
	timeoutnode.innerHTML = "Timeout in " + fakeTimeout + ".";
	intervalId = setInterval(() => {
		fakeTimeout = fakeTimeout - 1;
		timeoutnode.innerHTML = "Timeout in " + fakeTimeout + ".";
	}, 1000);

	const descriptionnode = document.createElement("div");
	gamedata = getGameData();
	if (Number.isInteger(gamedata.playercurrent)) {
		descriptionnode.innerHTML = "<p>Last round you transferred &pound;" + gamedata.playercurrent + ", this means they received &pound;" + gamedata.lastplay + ".</p>";
	}
	descriptionnode.innerHTML = descriptionnode.innerHTML + "<p>You currently have &pound;" + gamedata.playertotal + " and they have &pound;" + gamedata.bottotal + ".</p>";
	descriptionnode.innerHTML = descriptionnode.innerHTML + "<p><br></br>The other Player's " + getBotPersonaDescription(gamedata.botgender, gamedata.botneuro) + "</p>";


	bedit.appendChild(descriptionnode);
	bedit.appendChild(timeoutnode);

	// Actions to be performed upon the real timeout
	realTimeout = 1000 * (realTimeoutMin + Math.pow(Math.random(), realTimeoutBiasExponent) * (realTimeoutMax - realTimeoutMin));
	console.log('Fake timeout - ' + fakeTimeout + '; Real timeout - ' + Math.floor(realTimeout / 1000));
	setTimeout(() => {
		qualtrics.clickNextButton();
	}, realTimeout);

	// Add a loader circle
	// Based upon https://www.w3schools.com/howto/howto_css_loader.asp
	const loadernode = document.createElement("div");
	loadernode.innerHTML = '<div class="loader"></div>';
	loadernode.style = 'border: 8px solid #f3f3f3; border-top: 8px solid #337ab7; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;';
	loadernode.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1000, iterations: Infinity });

	//Set the waiting message
	var qedit = document.getElementsByClassName("QuestionText")[0];
	qedit.innerHTML = '<div>Waiting for the other player...</div>';
	qedit.appendChild(loadernode);
}

function cleanupWaitingForPlayerResponseQuestion(qualtrics) {
	/*Place your JavaScript here to run when the page is unloaded*/

	// Clean up
	clearInterval(intervalId);
	qualtrics.enableNextButton();

	// Player went, make bot go then end round
	/*getBotResponse(gamedata);
	confirmResponse('bot', gamedata);

	// New round!
	nextGameRound(gamedata, 1);*/
}

// Standard game over question
function setupGameOverQuestion() {
	/*Place your JavaScript here to run when the page is fully displayed*/
	var bedit = document.getElementsByClassName("QuestionBody")[0];
	gamedata = getGameData();
	bedit.innerHTML = "<p>You ended with &pound;" + gamedata.playertotal + " and they ended with &pound;" + gamedata.bottotal + ".</p><br>Please click next to start the next game.";
}
