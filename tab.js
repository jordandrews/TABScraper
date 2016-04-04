var phantom = require('phantom');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var tabHome = "https://www.tab.com.au";
var tabMeetingsToday = "/racing/meetings/today";
var tabHorses = "/R";
var tabGreyhounds = "/G";
var tabHarness = "/H";

var totalNumRaces = 0;
var raceLinks = [];
var raceSetIndex = 0;
var raceIndex = 0;

getNextRaceSet();

function getNextRaceSet(){
  codeArray = [tabHorses, tabGreyhounds];
  if (raceSetIndex < codeArray.length){
    var currentIndex = raceSetIndex;
    raceSetIndex++;
    getMeetingDetails(codeArray[currentIndex]);
  } else {
    getNextRace();
  }
}

function getMeetingDetails(raceType){
  phantom.create(function(ph) {
    ph.createPage(function(page) {
      page.open(tabHome + tabMeetingsToday + raceType, function(status) {
        console.log("OPENED MEETINGS PAGE - " + raceType + " ", status);
        page.evaluate(function() {
          var raceLinks = [];
          var races = document.getElementsByClassName('race-wrapper resulted');
          for (var i = 0; i < races.length; i++) {
            raceLinks.push(races[i].getAttribute("href"));
          }
          return raceLinks;
        }, function(result) {
          console.log(result);
          raceLinks = raceLinks.concat(result);
          totalNumRaces = result.length + totalNumRaces;
          ph.exit();
          getNextRaceSet();
        });
      });
    });
  }, {
    dnodeOpts: {
      weak: false
    }
  });
}

function getNextRace(){
  var thisIndex = raceIndex;
  raceIndex = raceIndex + 1;
  console.log('RACE INDEX: ' + raceIndex + ' RACELINKS.LENGTH: ' + raceLinks.length);
  if (raceIndex < raceLinks.length){
    try {
      saveRaceDetailsFromUrl(raceLinks[thisIndex]);
    } catch (err){
      console.log(err.message);
      getNextRace();
    }
  } else {
      console.log('calling exit');
  }
}

function saveRaceDetailsFromUrl(raceUrl){
  phantom.create(function(ph){
    ph.createPage(function(page) {
      page.open(tabHome + raceUrl, function(status) {
        console.log(tabHome + raceUrl);
        console.log('OPENED RACE - ' + status);
        setTimeout(function() {
          page.evaluate(function() {
            //TODO: sort out duets.
            var raceObject = {};

            var statusText = document.getElementsByClassName('status-text');
            if (!(statusText[0].textContent.trim().toLowerCase() == "abandoned")){
              var raceUrlParts = document.location.pathname.split('/');
              raceObject["date"] = raceUrlParts[2];
              raceObject["location"] = raceUrlParts[3];
              raceObject["code"] = raceUrlParts[4];
              raceObject["category"] = raceUrlParts[5];
              raceObject["raceNumber"] = raceUrlParts[6];
              var resultOrder = ["quinella", "exacta", "duet", "trifecta", "first four"];
              var resultItemRows = document.getElementsByClassName('result-item thin');
              for (var i = 0; i < resultItemRows.length; i++) {
                var resultTitle = resultItemRows[i].firstChild.textContent.toLowerCase().trim();
                if (resultOrder.indexOf(resultTitle) > -1) {
                  raceObject[resultTitle] = resultItemRows[i].getElementsByClassName('result-pool-name')[0].innerHTML;
                  raceObject[resultTitle + "Price"] = resultItemRows[i].getElementsByClassName('result-pool-odds')[0].innerHTML;
                }
              }

              var horses = [];
              var pseudoBody = document.getElementsByClassName('pseudo-body')[0];
              var raceRows = pseudoBody.getElementsByClassName('row');
              for(var i=0; i< raceRows.length; i++){
                var raceRow = raceRows[i];
                if (!raceRow.classList.contains('scratched')){
                  var horseObject = {};
                  horseObject["number"] = raceRow.getElementsByClassName('number-cell')[0].textContent;
                  horseObject["name"] =  raceRow.getElementsByClassName('runner-name')[0].textContent;
                  horseObject["barrier"] = raceRow.getElementsByClassName('barrier')[0].textContent;
                  var winPrices = raceRow.getElementsByClassName('price-cell');
                  horseObject["winPriceFO"] = winPrices[0].getElementsByClassName('return-value')[0].textContent;
                  horseObject["placePriceFO"] = winPrices[1].getElementsByClassName('return-value')[0].textContent;
                  horseObject["winPrice"] = winPrices[2].getElementsByClassName('return-value')[0].textContent;
                  horseObject["placePrice"] = winPrices[3].getElementsByClassName('return-value')[0].textContent;
                  horses.push(horseObject);
                }
              }
              raceObject["horses"] = horses;
            }
              return raceObject;
          }, function(result) {
            console.log('DONE - ' + totalNumRaces + ' left');
            console.log(result);
            totalNumRaces = totalNumRaces - 1;
            var url = 'mongodb://localhost:27017/tab';
            MongoClient.connect(url, function(err, db) {
              assert.equal(null, err);
              var raceCollection = db.collection('races', function(err, collection) {});
              key = {code: result.code, raceNumber: result.raceNumber, date: result.date};
              raceCollection.update(key, result, {upsert:true});

                db.close();
                ph.exit();
                getNextRace();
            });
          });
        }, 5000);
      });
    });
  }, {
    dnodeOpts: {
      weak: false
  }
});
}
