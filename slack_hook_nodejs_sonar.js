var sonarProjectName = process.argv[2];
var slackWebhookUrl = process.argv[3];

var http = require('http');
var Slack = require('slack-node');

http.get('http://build:9000/api/issues/search?severities=BLOCKER&statuses=OPEN&componentRoots=' + sonarProjectName, function(response) {
		var body = '';
		
		response.on('data', function (chunk) {
			body += chunk;
		});
		
		response.on('end', function() {
			var jsonBody = JSON.parse(body);
			var numberOfBlockers = jsonBody.total; 
			var issues = jsonBody.issues;
			var totalIssues = issues.length;
			var jobUrl = 'build:9000/dashboard/index/' + sonarProjectName;

			if (totalIssues === 0)
				return;

			var message = "Negada, corre pra arrumar porque tem " + totalIssues + " blockers no " + sonarProjectName + "! <http://" + jobUrl + "|Ver mais detalhes>";

			var attachment = {
				"fallback": message,
				"pretext": message,
				"color": "#D00000",
				"fields": []
			};

			for(var index in issues) {
				var blocker = issues[index];
				var title = blocker.message;
				var value = blocker.component + '\nNa linha: ' + blocker.line;

				attachment.fields.push({
					"title": title,
					"value": value,
					"short": false
				});
			}

			slack = new Slack();
			slack.setWebhook(slackWebhookUrl);

			slack.webhook({
				attachments: [ attachment ]
			}, function(err, response) {
				console.log(response);
			});
		});
	}).on('error', function(err) {
		console.error('Error while get Sonar data: ', err);
	});