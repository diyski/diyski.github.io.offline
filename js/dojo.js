var _one_day = 24*60*60*1000;
var _ten_mins = 60*10*1000;
// Model Classes
function Route() {
    this.totalPrice = 0;  // yen
//    this.ticketPrice = 0; // yen
//    this.exticketPrice = 0; // yen
    this.beginTime = ""; // hh:mm
    this.endTime = ""; // hh:mm
    this.waitDuration = 0; // how many minutes
    this.rideDuration = 0; // how many minutes
    this.transferTimes = 0;
    this.distance = 0.0; // float km
    this.detailList = []; // detailList includes Station, FareSection, Access
    
    this.calRideAndWait = function(inquiryDate) {
        var currentStation = this.detailList[0];
        var indexTime = new Date(inquiryDate+" "+currentStation.arrivalTime);
        for(var i = 1; i < this.detailList.length; i++) {
            if(this.detailList[i] instanceof FareSection) {
                indexTime = this.calFareSection(this.detailList[i], indexTime);
            }else if(this.detailList[i] instanceof Station){
                indexTime = this.calStation(this.detailList[i], indexTime);
            }
        }
    };
    
    
    this.calFareSection = function(fareSection, time) {
        var indexTime = time;
        var list = fareSection.detailList;
        
        for(var i = 0; i < list.length; i++) {
            if(list[i] instanceof FareSection) {
                indexTime = this.calFareSection(list[i], indexTime);
            }else if(list[i] instanceof Station){
                indexTime = this.calStation(list[i], indexTime);
            }
        }
        
        return indexTime;
    };
    
    this.calStation = function(station, time) {
        var indexTime = time;
        // cal riding time
        var durationAndTime = this.calDuration(indexTime, station.arrivalTime);
        this.rideDuration += durationAndTime["duration"];
        indexTime = durationAndTime["time"];
        // cal waiting time
        var durationAndTime = this.calDuration(indexTime, station.departureTime);
        this.waitDuration += durationAndTime["duration"];
        indexTime = durationAndTime["time"];
        return indexTime;
    };
    
    //idxTime: Date, nextTimeStr: String
    this.calDuration = function(idxTime, nextTimeStr) {
        var nextTime = idxTime;
        var duration = 0;
        if(nextTimeStr) {
            nextTime = this.getNextTimeObjByStr(idxTime, nextTimeStr);
            duration = (nextTime.getTime() - idxTime.getTime())/1000/60;
        }
        return {duration: duration, time: nextTime};
    };
    
    
    this.getNextTimeObjByStr = function(idx, nextTimeStr) {
        if(this.getTimeStr(idx) > nextTimeStr) {
            return new Date(this.getDateStr(new Date(idx.getTime() + _one_day))+" "+nextTimeStr);
        }else{
            return new Date(this.getDateStr(idx)+" "+nextTimeStr);
        }
    };
    
    this.getDateStr = function(date) {
        var dd = date.getDate();
        var mm = date.getMonth()+1; //January is 0!
        
        var yyyy = date.getFullYear();
        if(dd<10){
            dd='0'+dd
        }
        if(mm<10){
            mm='0'+mm
        }
        return yyyy+'/'+mm+'/'+dd;
    };
    
    this.getTimeStr = function(date) {
        var hh = date.getHours();
        var mm = date.getMinutes();
        
        if(hh<10){
            hh='0'+hh
        }
        if(mm<10){
            mm='0'+mm
        }
        
        return hh+":"+mm;
    };
}

function FareSection() {
    this.fare = 0; // yen
    this.detailList = []; // detailList includes Station, FareSection, Access
}

function Station() {
    this.name = "";
    this.arrivalTime = ""; // hh:mm
    this.departureTime = ""; // hh:mm
}

function Access() {
    this.transport = "";
    this.platform = "";
    this.stops = "";
    this.source = null; // http url
}


function ParentOfQuery() {
    this.yahooParams = {flatlon: "", from: "", tlatlon: "", to: "", via: "", via: "", via: "" , y: "", m: "", d: "", hh: "",m2: "", m1: "", type: "", ticket:"normal", al:"1", shin:"1", ex:"1", hb:"1", lb:"1", sr:"1", s:"0", expkind:"1", ws:"2", kw:""};
    this.fromResort = null;
    this.toResort = null;
    this.inquiryDate = ""; // yyyy/MM/dd
    this.inquiryTime = ""; // hh:mm
    
    this.breedQueries = function() {
        
        var queryList = [];
        var fromApList = this.extractApList(this.fromResort, "from");
        var toApList = this.extractApList(this.toResort, "to");
        
        // multiply accesspoints
        for(var i = 0; i < fromApList.length; i++)
            for(var j = 0; j < toApList.length; j++) {
                if(fromApList[i] != toApList[j]) {
                    var list = this.makeQuery(fromApList[i], toApList[j]);
                    for(var q=0; q < list.length; q++) {
                        queryList.push(list[q]);
                    }
                }
            }

        return queryList;
    };
    
    // type = "to" or "from":String
    this.extractApList = function(resort, type) {
        var list = [];
        if(resort) {
            for (var ap in resort.accessPoints) {
                list.push(resort.accessPoints[ap]);
            }
        }else{
            var tmpAp = new AccessPoint();
            tmpAp.name = this.yahooParams[type];
            list.push(tmpAp);
        }
        return list;
    }
    
    this.makeQuery = function(fromAp, toAp) {
        var queryList = [];
        
        var query = new Query();
        query.parent = this;
        query.fromAp = fromAp;
        query.toAp = toAp;
        query.perfectMatch = (fromAp.name == toAp.name);
        query.yahooParams["from"] = fromAp.name;
        query.yahooParams["to"] = toAp.name;
        query.yahooParams["kw"] = toAp.name;
        query.yahooParams["type"] = this.yahooParams["type"];
        query.yahooParams["y"] = this.yahooParams["y"];
        query.yahooParams["m"] = this.yahooParams["m"];
        query.yahooParams["d"] = this.yahooParams["d"];
        query.yahooParams["s"] = this.yahooParams["s"];
        
        
        // Modify Inquiry Time
        if(this.fromResort && (this.yahooParams["type"] == 1)) {
            for(var i = 0; i < fromAp.inbound.length; i++) {
                var transportation = fromAp.inbound[i];
                var timeItem = transportation.searchNextRun(this.inquiryTime);
                var newTime = new Date(this.inquiryDate + " " + timeItem.arrival);
                var adjustTime = new Date(newTime.getTime() + _ten_mins);
                var units = this.breakTimeUnit(adjustTime);
                
                var newQuery = query.clone();
                newQuery.decidedFromTransportation = transportation;
                newQuery.yahooParams["hh"] = units["hh"];
                newQuery.yahooParams["m1"] = units["m1"];
                newQuery.yahooParams["m2"] = units["m2"];
                queryList.push(newQuery);
            }
        } else if(this.toResort && (this.yahooParams["type"] == 4)) {
            for(var i = 0; i < toAp.outbound.length; i++) {
                var transportation = toAp.outbound[i];
                var timeItem = transportation.searchPreviousRun(this.inquiryTime);
                var newTime = new Date(this.inquiryDate + " " + timeItem.departure);
                var adjustTime  = new Date(newTime.getTime() - _ten_mins);
                var units = this.breakTimeUnit(adjustTime);
                
                var newQuery = query.clone();
                newQuery.decidedToTransportation = transportation;
                newQuery.yahooParams["hh"] = units["hh"];
                newQuery.yahooParams["m1"] = units["m1"];
                newQuery.yahooParams["m2"] = units["m2"];
                queryList.push(newQuery);
            }
        } else {
            var units = this.breakTimeUnit(new Date(this.inquiryDate + " " + this.inquiryTime));
            query.yahooParams["hh"] = units["hh"];
            query.yahooParams["m1"] = units["m1"];
            query.yahooParams["m2"] = units["m2"];
            
            queryList.push(query);
        }
        
        return queryList;
    };
    
    // timeObj: Date
    this.breakTimeUnit = function(timeObj) {
        var hh = timeObj.getHours();
        if(hh < 10) hh = "0" + hh;
        var minute = "" + timeObj.getMinutes();
        var m1=0;
        var m2=0;
        if(minute.length > 1) {
            m1 = minute[0];
            m2 = minute[1];
        }else{
            m2 = minute;
        }
        
        return {hh: hh, m1: m1, m2: m2};
    };
    
}

function factory_createParentOfQuery(from, to, qtype, queryDate, hour, minute, order) {
    var poq = new ParentOfQuery();
    poq.inquiryDate = queryDate;
    poq.inquiryTime = hour + ":" + minute;
    
    var dateArr = queryDate.split("/");
    poq.yahooParams["y"] = dateArr[0];
    poq.yahooParams["m"] = dateArr[1];
    poq.yahooParams["d"] = dateArr[2];
    poq.yahooParams["from"] = from;
    poq.yahooParams["to"] = to;
    poq.yahooParams["kw"] = to;
    poq.yahooParams["type"] = qtype;
    poq.yahooParams["s"] = order;
    return poq;
}

function Query() {
    this.parent = null;
    this.fromAp = null;
    this.toAp = null;
    this.decidedFromTransportation = null;
    this.decidedToTransportation = null;
    this.yahooParams = {flatlon: "", from: "", tlatlon: "", to: "", via: "", via: "", via: "" , y: "", m: "", d: "", hh: "",m2: "", m1: "", type: "", ticket:"normal", al:"1", shin:"1", ex:"1", hb:"1", lb:"1", sr:"1", s:"0", expkind:"1", ws:"2", kw:""};
    this.perfectMatch = false;
    
    this.clone = function() {
        var newQuery = new Query();
        newQuery.parent = this.parent;
        newQuery.fromAp = this.fromAp;
        newQuery.toAp = this.toAp;
        newQuery.perfectMatch = this.perfectMatch;
        newQuery.yahooParams["from"] = this.yahooParams["from"];
        newQuery.yahooParams["to"] = this.yahooParams["to"];
        newQuery.yahooParams["kw"] = this.yahooParams["kw"];
        newQuery.yahooParams["type"] = this.yahooParams["type"];
        newQuery.yahooParams["y"] = this.yahooParams["y"];
        newQuery.yahooParams["m"] = this.yahooParams["m"];
        newQuery.yahooParams["d"] = this.yahooParams["d"];
        newQuery.yahooParams["s"] = this.yahooParams["s"];
        return newQuery;
    };
    
    
    this.mergeLocalData = function(routeList) {

        for(var i = 0; i< routeList.length; i++) {
            var route = routeList[i];
            if(this.parent.fromResort) {
                var apStation = route.detailList[0]; // first station
                var transportation = this.decidedFromTransportation;
                var timeItem = null;
                
                if(transportation == null) {
                    var currentGap = _one_day*2;
                    var inquiryTimeObj = new Date(this.parent.inquiryDate + " "+ apStation.arrivalTime);
                    for(var j=0; j < this.fromAp.inbound.length; j++ ) {
                        var tmpItem = this.fromAp.inbound[j].searchPreviousRun(apStation.arrivalTime);
                        var tmpTimeObj = new Date(this.parent.inquiryDate + " "+ tmpItem.arrival);
                        var gap = inquiryTimeObj.getTime() - tmpTimeObj.getTime();
                        if(gap < 0) {
                            gap = gap + _one_day;
                        }
                        
                        if(gap < currentGap) {
                            currentGap = gap;
                            transportation = this.fromAp.inbound[j];
                            timeItem = tmpItem;
                        }
                    }
                }else{
                    timeItem = transportation.searchPreviousRun(apStation.arrivalTime);
                }
                
                var station = new Station();
                station.name = this.parent.fromResort.name;
                
                var fareSection = new FareSection();
                fareSection.fare = transportation.fare;
                
                var access = new Access();
                access.transport = "["+transportation.type+"]"+transportation.name;
                access.platform = transportation.info;
                access.source = transportation.source;
                
                fareSection.detailList.push(access);
                
                // Merge
                apStation.departureTime = apStation.arrivalTime;
                apStation.arrivalTime = timeItem.arrival;
                station.arrivalTime = timeItem.departure;
                
                if(this.perfectMatch) {
                    apStation.departureTime = null;
                    route.endTime = apStation.arrivalTime;
                    if(this.parent.toResort==null) {
                        route.transferTimes--;
                    }
                }
                
                route.beginTime = station.arrivalTime;
                //console.log("Fare:"+route.totalPrice+"+"+transportation.fare);
                route.totalPrice += transportation.fare;
                //console.log("Km:"+route.distance+"+"+transportation.distance);
                route.distance += transportation.distance;
                route.transferTimes += 1;
                route.detailList.unshift(fareSection);
                route.detailList.unshift(station);
            }
            
            if(this.parent.toResort) {
                
                var apStation = route.detailList[route.detailList.length-1]; // last station
                var transportation = this.decidedToTransportation;
                var timeItem = null;
                
                if(transportation == null) {
                    var currentGap = _one_day*2;
                    var inquiryTimeObj = new Date(this.parent.inquiryDate + " "+ apStation.arrivalTime);
                    for(var j=0; j < this.toAp.outbound.length; j++ ) {
                        var tmpItem = this.toAp.outbound[j].searchNextRun(apStation.arrivalTime);
                        var tmpTimeObj = new Date(this.parent.inquiryDate + " "+ tmpItem.departure);
                        var gap = tmpTimeObj.getTime() - inquiryTimeObj.getTime();
                        if(gap < 0) {
                            gap = gap + _one_day;
                        }
                        //console.log("apStation.arrivalTime: "+apStation.arrivalTime+" tmpItem:"+tmpItem.departure+" gap: "+gap);
                        if(gap < currentGap) {
                            currentGap = gap;
                            transportation = this.toAp.outbound[j];
                            timeItem = tmpItem;
                        }
                    }
                    
                }else{
                    timeItem = transportation.searchNextRun(apStation.arrivalTime);
                }
                
                var station = new Station();
                station.name = this.parent.toResort.name;
                
                var fareSection = new FareSection();
                fareSection.fare = transportation.fare;
                
                var access = new Access();
                access.transport = "["+transportation.type+"]"+transportation.name;
                access.platform = transportation.info;
                access.source = transportation.source;
                
                fareSection.detailList.push(access);
                
                // Merge
                apStation.departureTime = timeItem.departure;
                station.arrivalTime = timeItem.arrival;
                
                if(this.perfectMatch) {
                    //if(this.parent.fromResort==null) {
                        apStation.arrivalTime = apStation.departureTime;
                        apStation.departureTime = null;
                        route.beginTime = apStation.arrivalTime;
                    //}else{
                        route.transferTimes--;
                    //}
                }

                route.endTime = station.arrivalTime;
                //console.log("Fare:"+route.totalPrice+"+"+transportation.fare);
                route.totalPrice += transportation.fare;
                //console.log("Km:"+route.distance+"+"+transportation.distance);
                route.distance += transportation.distance;
                route.transferTimes += 1;
                route.detailList.push(fareSection);
                route.detailList.push(station);
            }

            route.calRideAndWait(this.parent.inquiryDate);
            //console.log("ride:"+route.rideDuration+" wait:"+route.waitDuration);
        }
        
    };
    
    
    this.sortResult = function(routeList) {
        var rule = this.yahooParams["s"];
        if(rule == "0") {
            routeList.sort(this.sortByPrice);
            routeList.sort(this.sortByTime);
        } else if(rule == "2") {
            routeList.sort(this.sortByTime);
            routeList.sort(this.sortByTransfer);
        } else if(rule == "1") {
            routeList.sort(this.sortByTime);
            routeList.sort(this.sortByPrice);
        }
    }
    
    this.sortByTime = function(a, b) {
        a = a.waitDuration + a.rideDuration;
        b = b.waitDuration + b.rideDuration;
        return a-b;
    }
    
    this.sortByTransfer = function(a, b) {
        return a.transferTimes-b.transferTimes;
    }
    
    this.sortByPrice = function(a, b) {
        return a.totalPrice-b.totalPrice;
    }
    
}

var ResortLoader_resorts = [];
function ResortLoader() {
    this.url = "data/resorts.xml";
    
    this.loadXML = function() {
        $.get( this.url, function(xmlDoc) {
              
              $(xmlDoc).find("resort").each(function( index ){
                                var resort = new Resort();
                                resort.name = $(this).attr("name");
                                $(this).find("accessPoint").each(function( index ){
                                        //resort.accessPoints[$(this).attr("name")] = $(this).attr("filename");
                                        resort.apXmlUrls.push($(this).attr("filename"));
                                });
                                loadAccessPointXML(resort);
                                ResortLoader_resorts.push(resort);
                });
              
        });
    };
    
    
    // if resort not found, return null
    this.getResortByName = function(resortName) {
        for(var i=0; i< ResortLoader_resorts.length; i++) {
            if(ResortLoader_resorts[i].name.indexOf(resortName) > -1) {
                
                return ResortLoader_resorts[i];
            }
        }
        return null;
    };
}

function Resort() {
    this.name = "";
    this.apXmlUrls = [];
    this.accessPoints = {};
}

function loadAccessPointXML(resort) {
    for (var i=0 ;i < resort.apXmlUrls.length;i++) {
        $.ajax({
               method: "GET",
               url: "data/"+resort.apXmlUrls[i],
               success: function( xmlDoc ) {
               
                    root$ = $(xmlDoc).find("accesspoint");

                    var ap = new AccessPoint();
                    ap.name = root$.attr("name");
                    ap.to = root$.attr("to");
                    parseTransportationToAp(root$, ap.outbound, "outbound");
                    parseTransportationToAp(root$, ap.inbound, "inbound");
 
                    resort.accessPoints[ap.name] = ap;
                    console.log("ap "+ap.name+" loaded.");
               },
               dataType: "xml"
            });
    }
}

// type = "outbound" or "inbound"
function parseTransportationToAp(apXmlRoot$, apObj_transArr, type) {
    apXmlRoot$.find(type + " > transportation").each(function( index ){
                var trans = new Transportation();
                trans.type = $(this).attr("type");
                trans.fare = parseInt($(this).attr("fare"));
                trans.drive = $(this).attr("drive");
                trans.distance = parseFloat($(this).attr("km"));
                trans.name = $(this).attr("name");
                trans.source = $(this).find("source").text();
                trans.info = $(this).find("info").text();
                                                     
                $(this).find("timetable > departure").each(function( index ){
                              var timeItem = new TimeItem();
                              timeItem.departure = $(this).attr("time");
                              timeItem.arrival = $(this).attr("arrival");
                              trans.timeTable.push(timeItem);
                        });
                apObj_transArr.push(trans);
        });
}

function AccessPoint() {
    this.name = "";
    this.to = "";
    // Transportation tactics
    this.outbound = [];
    this.inbound = [];
}

function Transportation() {
    this.type = "";
    this.fare = 0;
    this.drive = 0; // take how many minutes
    this.distance = 0.0; // float km
    this.name = "";
    this.info = "";
    this.source = null;
    this.timeTable = [];
    
    this.searchNextRun = function(time) {
        var item = this.timeTable[0];
        for(var i = (this.timeTable.length-1); i > -1; i--) {
            //console.log("Enter searchNextRun's loop.");
            if(time < this.timeTable[i].departure)
                item = this.timeTable[i];
        }
        return item;
    }
    
    this.searchPreviousRun = function(time) {
        var item = this.timeTable[this.timeTable.length-1];
        for(var i = 0; i < this.timeTable.length; i++) {
            //console.log("Enter searchNextRun's loop.");
            if(time > this.timeTable[i].arrival)
                item = this.timeTable[i];
        }
        return item;
    }
}

function TimeItem() {
    this.departure = "";
    this.arrival = "";
}