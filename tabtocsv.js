//TODO: get number of horses in each race. for each venue, for each barrier number -
// get all times when it appeared and get win%
// for those times. See if betting $1 on that brrier number for all races would have paid positive in winnings


//assuming races is all R races at RANDWICK

function analyseEarningsForLocation(races){
  var barrierArray = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
  for(var b =0; b<barrierArray.length; b++){
    var barrierNum = barrierArray[b];
    var earnings = 0;
    var earningCount = 0;
    var totalRaces = 0;
    for(var i=0; i< races.length; i++){
      var race = races[i];
      for(var j=0; j<race.horses.length; j++){
        var horse = race.horses[j];
        if (horse.name.substring(horse.name.indexOf("(") + 1, horse.name.indexOf(")")) == barrierNum){
          if (parseFloat(horse.winPrice) > 8 && parseFloat(horse.winPrice) < 20){
            earnings -= 1;
            totalRaces++;
            if (race.exacta.substring(0,race.exacta.indexOf("-")) == horse.number){
              earnings += parseFloat(horse.winPrice);
              earningCount++;
              console.log(horse.winPrice);
            }
          }
        }
      }
    }
    console.log(earningCount/totalRaces);
    console.log("BARRIER " + barrierNum + ", EARNINGS: "  + earnings + ", TOTAL RACES: " + totalRaces);
  }
}

var json2csv = require('json2csv');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var fs = require('fs');

var allRaces = [];
var fields = ['category', 'code', 'date', 'winner', 'winnerPrice', 'winnerBarrier', 'quinellaPrice', 'exactaPrice', 'trifectaPrice', 'location'];
for(var i=1; i<24; i++){
  fields.push("horse" + i + "num");
  fields.push("horse" + i + "price");
  fields.push("horse" + i + "barrier");
}
var url = 'mongodb://localhost:27017/tab';

MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  findRaces(db, function() {

    // json2csv({
    //   data: allRaces,
    //   fields: fields
    // }, function(err, csv) {
    //   if (err) console.log(err);
    //   fs.writeFile('file.csv', csv, function(err) {
    //     if (err) throw err;
    //     console.log('file saved');
    //   });
    // });

    db.close();
  });
});

var findRaces = function(db, callback) {
  var cursor = db.collection('races').find({"category": "R"});
  var allRaces = [];
  cursor.each(function(err, doc) {
    if (doc == null){
        analyseEarningsForLocation(allRaces);
    } else {
        allRaces.push(doc);
    }
    // assert.equal(err, null);
    // if (doc != null) {
    //   var newObj = {};
    //   for(var i=0; i< fields.length; i++){
    //     newObj[fields[i]] = doc[fields[i]];
    //   }
    //   var winner;
    //   if (typeof doc.exacta != "undefined"){
    //             newObj["winner"] = doc.exacta.substring(0,doc.exacta.indexOf("-"));
    //             winner = newObj["winner"];
    //   }
    //   for(var i=0; i<24; i++){
    //     var horseId = "horse" + i + 1;
    //     if (typeof doc.horses != "undefined" && typeof doc.horses[i] != "undefined"){
    //       newObj[horseId + "num"] = doc.horses[i].number;
    //       newObj[horseId + "price"] = doc.horses[i].winPrice;
    //       newObj[horseId + "barrier"] = doc.horses[i].name.substring(doc.horses[i].name.indexOf("(") + 1, doc.horses[i].name.indexOf(")"));
    //       if (winner == doc.horses[i].number){
    //         newObj["winnerPrice"] = newObj[horseId + "price"];
    //         newObj["winnerBarrier"] = newObj[horseId + "barrier"];
    //       }
    //     }
    //   }
    //   allRaces.push(newObj);
    // } else {
    //   callback();
    // }
  });
};
