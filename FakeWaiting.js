// Create a dummy question that will become a waiting message! It will show a fake countdown that terminated depending on a random real countdown. The next button will disable itself

var intervalId = 0; // Keep to kill the fake timer instance
var fakeTimeout = 30; // Fake timer instance start value
var realTimeoutMin = 3;
var realTimeoutMax = 30;
var realTimeoutBiasExponent = 4; // Distributes bias towards minimum rather than maximum
var realTimeout = fakeTimeout; // Set to the computed timeout

Qualtrics.SurveyEngine.addOnload(function () {
	// Disable the button so the user cannot avoid the wait!
	this.disableNextButton();

	// Upkeep a fake timeout label
	var bedit = document.getElementsByClassName("QuestionBody")[0];
	bedit.innerHTML = "<div>Timeout in " + fakeTimeout + "</div>";
	intervalId = setInterval(() => {
		fakeTimeout = fakeTimeout - 1;
		var bedit = document.getElementsByClassName("QuestionBody")[0];
		bedit.innerHTML = "<div>Timeout in " + fakeTimeout + "</div>";
	}, 1000);

	// Actions to be performed upon the real timeout
	realTimeout = 1000 * (realTimeoutMin + Math.pow(Math.random(), realTimeoutBiasExponent) * (realTimeoutMax - realTimeoutMin));
	console.log('Fake timeout - ' + fakeTimeout + '; Real timeout - ' + Math.floor(realTimeout / 1000));
	setTimeout(() => {
		this.clickNextButton();
	}, realTimeout);

	// Add a loader circle
	// Based upon https://www.w3schools.com/howto/howto_css_loader.asp
	const loadernode = document.createElement("div");
	loadernode.innerHTML = '<div class="loader"></div>';
	loadernode.style = 'border: 8px solid #f3f3f3; border-top: 8px solid #337ab7; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite;';
	loadernode.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 1000, iterations: Infinity });

	//Set the waiting message
	var qedit = document.getElementsByClassName("QuestionText")[0];
	qedit.innerHTML = '<div>Waiting for other player...</div>';
	qedit.appendChild(loadernode);
});

Qualtrics.SurveyEngine.addOnReady(function () {
	/*Place your JavaScript here to run when the page is fully displayed*/

});

Qualtrics.SurveyEngine.addOnUnload(function () {
	/*Place your JavaScript here to run when the page is unloaded*/

	// Clean up
	clearInterval(intervalId);
	this.enableNextButton();
});