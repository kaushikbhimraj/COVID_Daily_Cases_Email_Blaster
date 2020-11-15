// Triggers everyday @ 5PM EST. 
function triggerEmail() {
  ScriptApp.newTrigger('sendEmail')
  .timeBased()
  .everyDays(1)
  .atHour(17)
  .create()
}



// Helper function to convert a calculation to a comma separated string with 'up'/'down' indicators.
function convert(val){
  if (val > 0) return val.toLocaleString('en') + "% ↑";
  else return val.toLocaleString('en') + "% ↓";
}




// Calculate the rate of change in cases.
function change(curr, prev) {
  if (curr/prev === 0) return 0
  else if (prev === 0) return 0
  else return (((curr/prev)-1) * 100).toFixed(2);
}




// Returns an object with all state information. 
function getDataStates(date){
  var url = "https://covidtracking.com/api/states/daily";
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);
  var idx = 0;
  var stateInfo = []
  
  while (data[idx].date === date){
    stateInfo.push({"state":data[idx].state,
                    "positive":data[idx].positiveIncrease,
                    "deaths":data[idx].deathIncrease, 
                    "ROC": change(data[idx].positiveIncrease, data[idx+55].positiveIncrease)});
    idx++;
  }
  // Sort object based on rate of change. 
  stateInfo.sort((a,b) => {return b.ROC - a.ROC;})
  return stateInfo
}




// Returns an html with US only informaiton. 
function getData() {

  var url = "https://covidtracking.com/api/us/daily";
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);
  
  // Daily
  var positive = data[0].positiveIncrease;
  var hospitalized = data[0].hospitalizedIncrease;
  var deaths = data[0].deathIncrease;
  
  var positivePrev = data[1].positiveIncrease;
  var hospitalizedPrev = data[1].hospitalizedIncrease;
  var deathsPrev = data[1].deathIncrease;
  
  // Cummulative
  var totalPositive = data[0].positive;
  var totalDeaths = data[0].death;
  var totalHospitalized = data[0].hospitalizedCurrently;
  
  // Hospitalized
  var icu = data[0].inIcuCurrently;
  var ventilator = data[0].onVentilatorCurrently;
  
  // Replace table with the appropriate values. 
  var htmlOutput = HtmlService.createHtmlOutputFromFile("index");
  var message = htmlOutput.getContent();
  
  // Replace static fields in HTML with data from API. 
  message = message.replace("%positive", positive.toLocaleString('en'));
  message = message.replace("%hospitalized", hospitalized.toLocaleString('en'));
  message = message.replace("%deaths", deaths.toLocaleString('en'));
  
  message = message.replace("%positivePrev", convert(change(positive, positivePrev)));
  message = message.replace("%hospitalizedPrev", convert(change(hospitalized, hospitalizedPrev)));
  message = message.replace("%deathsPrev", convert(change(deaths, deathsPrev)));
  
  message = message.replace("%totalPositive", totalPositive.toLocaleString('en'));
  message = message.replace("%totalDeaths", totalDeaths.toLocaleString('en'));
  message = message.replace("%totalHospitalized", totalHospitalized.toLocaleString('en'));
  message = message.replace("%icu", icu.toLocaleString('en'));
  message = message.replace("%ventilator", ventilator.toLocaleString('en'));
  
  // Get Info for All States
  var stateInfo = getDataStates(data[0].date);

  // Create a string 
  var buildHTML = '<h3>US COVID Stats Per State</h3><table style="text-align:left;width:50%;border-collapse:collapse;border:1px solid #e3e3e3;"><tr style="background-color:#e7edf0"><th>State</th><th>Cases</th><th>Deaths</th><th>ROC (Desc)</th></tr>';

  stateInfo.forEach((rec) => {
    buildHTML += '<tr>';
    buildHTML += '<td>' + Lookup(rec.state) + '</td>';
    buildHTML += '<td>' + rec.positive.toLocaleString('en') + '</td>';
    buildHTML += '<td>' + rec.deaths.toLocaleString('en') + '</td>';
    buildHTML += '<td>' + convert(rec.ROC) + '</td>';
    buildHTML += '</tr>';
  })
  buildHTML += '</table><br><Footer><i>Reported by <a href="https://covidtracking.com/">The COVID Tracking Project</a>.</i></Footer>';

  return message + buildHTML
}




// Send out email.
function sendEmail() {
  GmailApp.sendEmail("To", "COVID Daily Update", "This is an HTML Table", {htmlBody: getData()})
}
