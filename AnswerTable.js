// Create a question with a dummy body that will be replaced by a table summarising the user's correct answers!

// Returns a table summarising correct answers. Compares embed response to provided answers
// (Set responses in validateqn[x] embed)
function markQuestions(number, questions, answers) {
	var correctanswers = 0;
	
	var tableresults = '<table class="ChoiceStructure">';
	tableresults = tableresults + '<tr><th><b>Question</b></th><th><b>Your Answer</b></th><th><b>Correct Answer</b></th><th><b>Outcome</b></th></tr>';
	for(var i = 0; i < number; i++) {
		var qn = i + 1;
		var response = Qualtrics.SurveyEngine.getEmbeddedData('validateqn' + qn);
		var outcome = '&cross;';
		if(response == answers[i]) {
			outcome = '&check;';
			correctanswers = correctanswers + 1;
		}
		
		tableresults = tableresults + '<tr><td>' + questions[i] + '</td><td>' + response + '</td><td>' + answers[i] + '</td><td>' + outcome + '</td></tr>';
	}
	tableresults = tableresults + '<tr><td colspan = "4">&nbsp;</td></tr>';
	tableresults = tableresults + '<tr><td colspan = "3"><b>Result:</b></td><td>' + correctanswers + '/' + number + '</td></tr>';
	tableresults = tableresults + '</table>';
	
	return tableresults;
}

Qualtrics.SurveyEngine.addOnload(function()
{
	/*Place your JavaScript here to run when the page loads*/
	
	// Set question responses
	Qualtrics.SurveyEngine.setEmbeddedData('validateqn1', 'Two eyes');
	Qualtrics.SurveyEngine.setEmbeddedData('validateqn2', 'One');
	Qualtrics.SurveyEngine.setEmbeddedData('validateqn3', 'Jar');
	Qualtrics.SurveyEngine.setEmbeddedData('validateqn4', 'Yes');
	// (make sure to delete these embeds later)
	
});

Qualtrics.SurveyEngine.addOnReady(function()
{
	/*Place your JavaScript here to run when the page is fully displayed*/

	var bedit = document.getElementsByClassName("QuestionBody")[0];
	bedit.innerHTML = markQuestions(4, ['What is a cyclops?', 'How many wheels on a unicycle?', 'print(jar)', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'], ['One eye', 'One', 'jar', 'Yes']);
});

Qualtrics.SurveyEngine.addOnUnload(function()
{
	/*Place your JavaScript here to run when the page is unloaded*/

});