// Triggers everyday @ 12PM. 
function triggerEmail() {
  ScriptApp.newTrigger('sendEmail')
  .timeBased()
  .everyDays(1)
  .atHour(12)
  .create()
}

// Calculate the rate of change in cases.
function rateOfChange(curr, prev) {
  if (curr/prev === 0) return "NA"
  else if (prev === 0) return "NA"
  else {
    var calc = (((curr/prev)-1) * 100).toFixed(2);
    var calcStr = calc.toLocaleString('en');
    if (calc > 0) return calcStr + "% ↑"
    else return calcStr + "% ↓"
  }
}

// Returns an object with all state information. 
function getDataStates(date){
  var url = "https://covidtracking.com/api/states/daily";
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);
  var idx = 0;
  var stateInfo = {}
  var states = []
  
  while (data[idx].date === date){
    states.push(data[idx].state);
    stateInfo[data[idx].state] = {"positive":data[idx].positiveIncrease,
                                  "deaths":data[idx].deathIncrease, 
                                  "previousPOS": data[idx+55].positiveIncrease};
    idx++;
  }
  stateInfo["states"] = states;
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
  message = message.replace("%positive", positive.toLocaleString('en'));
  message = message.replace("%positivePrev", rateOfChange(positive, positivePrev));
  message = message.replace("%hospitalized", hospitalized.toLocaleString('en'));
  message = message.replace("%hospitalizedPrev", rateOfChange(hospitalized, hospitalizedPrev));
  message = message.replace("%deaths", deaths.toLocaleString('en'));
  message = message.replace("%deathsPrev", rateOfChange(deaths, deathsPrev));
  
  message = message.replace("%totalPositive", totalPositive.toLocaleString('en'));
  message = message.replace("%totalDeaths", totalDeaths.toLocaleString('en'));
  message = message.replace("%totalHospitalized", totalHospitalized.toLocaleString('en'));
  message = message.replace("%icu", icu.toLocaleString('en'));
  message = message.replace("%ventilator", ventilator.toLocaleString('en'));

  // Get Info for All States
  var stateInfo = getDataStates(data[0].date);
  for (i of stateInfo["states"]){
    message = message.replace("%"+i+"Positive", stateInfo[i].positive.toLocaleString('en'));
    message = message.replace("%"+i+"Death", stateInfo[i].deaths.toLocaleString('en'));
    message = message.replace("%"+i+"ROI", rateOfChange(stateInfo[i].positive, stateInfo[i].previousPOS)); 
  }
  return message
}

// Send out email.
function sendEmail() {
  GmailApp.sendEmail("To", "COVID Daily Update", "This is an HTML Table", {htmlBody: getData()})
}
