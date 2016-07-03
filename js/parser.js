// Page Parser
function PageParser() {
    this.dataSectionId = "srline";
    
    this.parseYahooResultPage = function(htmlPage) {
        var parsedResult = $.parseHTML(htmlPage);
        var routeDiv = $("#"+this.dataSectionId ,parsedResult);
        // if resposne doesn't contain result
        if(!routeDiv.length)
            return null;
        
        var routeList = [];
        
        $("[id^=route0]", routeDiv).each(function( index ) {
                                         //console.log("[Route"+index+"]" + $(this).attr("id"));
                                         var route = discoverRoute($(this));
                                         routeList.push(route);
                                         });
        
        return routeList;
    };
    
    function discoverRoute(route$) {
        var routeInstance = parseRouteSummary($("dl.routeSummary", route$));
        
        $("div.routeDetail" ,route$).children().each( function(index) {
                                                     var sectionClass = $(this).attr("class");
                                                     
                                                     if(sectionClass.indexOf("station") > -1) {
                                                     routeInstance.detailList.push(parseStation($(this)));
                                                     } else if(sectionClass.indexOf("access") > -1) {
                                                     routeInstance.detailList.push(parseAccess($(this)));
                                                     } else if(sectionClass.indexOf("fareSection") > -1) {
                                                     discoverFareSection("", $(this), routeInstance);
                                                     }
                                                     });
        
        return routeInstance;
    }
    
    function discoverFareSection(layer, fareSection$, superObject) {
        layer = layer + ">";
        var fareSectionInstance = new FareSection();
        // Get the fare of this section
        fareSectionInstance.fare = fareSection$.children(".fare").first().text();
        
        fareSection$.children().each( function(index) {
                                     var sectionClass = $(this).attr("class");
                                     
                                     if(sectionClass.indexOf("station") > -1) {
                                     fareSectionInstance.detailList.push(parseStation($(this)));
                                     } else if(sectionClass.indexOf("access") > -1) {
                                     fareSectionInstance.detailList.push(parseAccess($(this)));
                                     } else if(sectionClass.indexOf("fareSection") > -1) {
                                     discoverFareSection(layer, $(this), fareSectionInstance);
                                     }
                                     });
        
        superObject.detailList.push(fareSectionInstance);
    }
    
    function parseStation(station$) {
        var stationInstance = new Station();
        stationInstance.name = $("dl > dt", station$).first().text();
        stationInstance.arrivalTime = cutTail($("ul.time > li", station$).first().text());
        stationInstance.departureTime = cutTail($("ul.time > li", station$).last().text());
        if(stationInstance.arrivalTime.indexOf(stationInstance.departureTime) > -1) {
            stationInstance.departureTime = null;
        }
        return stationInstance;
    }
    
    function cutTail(str) {
        if(str.indexOf("着")+str.indexOf("発") > -2) {
            str = str.substring(0, str.length-1);
        }
        return str;
    }
    
    function parseAccess(access$) {
        var accessInstance = new Access();
        accessInstance.transport = $("ul.info > li.transport > div", access$).first().text();
        accessInstance.platform = $("ul.info > li.platform", access$).first().text();
        accessInstance.stops = $("ul.info > li.stop > span", access$).first().text();
        return accessInstance;
    }
    
    function parseRouteSummary(routeSummary$) {
        var routeInstance = new Route();
        
        var rawTransferTimes = $("dd > ul > li.transfer", routeSummary$).first().text();
        routeInstance.transferTimes = parseInt(rawTransferTimes.substring(rawTransferTimes.indexOf("：")+1, rawTransferTimes.length - 1));
        
        var kmStr = $("dd > ul > li.distance", routeSummary$).first().text();
        routeInstance.distance = parseFloat(kmStr.substring(0, kmStr.length-2));
        
        var rawTextTime = $("dd > ul > li.time", routeSummary$).first().text();
        var indexSetOff = rawTextTime.indexOf("発");
        var indexArrival = rawTextTime.indexOf("着");
        routeInstance.beginTime = rawTextTime.substring(indexSetOff-5, indexSetOff);
        routeInstance.endTime = rawTextTime.substring(indexArrival-5, indexArrival);
        
        var rawTextFare = $("dd > ul > li.fare", routeSummary$).first().text();
        var currencyStr = rawTextFare.substring(rawTextFare.indexOf("：")+1, rawTextFare.indexOf("円"));
        routeInstance.totalPrice = parseInt(currencyStr.replace(/[^0-9\.]+/g,""));
        
        return routeInstance;
    }
}