function presentSummary(routeObj, routeNum) {
    var summaryHtmlStr = "<div class='routeSummary'>";
    summaryHtmlStr += "<div class='routeSummaryRow'>";
    summaryHtmlStr += "<span class='routeLabel'>路線 "+(routeNum)+" </span>";
    summaryHtmlStr += "<span class='timeLabel'>"+routeObj.beginTime+"出發 &#8594; <span class='hightlight'> "+routeObj.endTime+"抵達</span></span>";
    summaryHtmlStr += "<span class='priceLabel'>"+minuteToStr(routeObj.rideDuration + routeObj.waitDuration)+" (乘車"+minuteToStr(routeObj.rideDuration)+")</span>";
    summaryHtmlStr += "<span class='rideSideLabel'>轉車："+routeObj.transferTimes+"次</span>";
    summaryHtmlStr += "</div>";
    summaryHtmlStr += "<div class='routeSummaryRow'>";
    summaryHtmlStr += "<span class='routeLabelH'>路線 "+(routeNum+1)+" </span>";
    summaryHtmlStr += "<span class='priceLabel'>車資：<b>"+routeObj.totalPrice+"円</b></span>";
    summaryHtmlStr += "<span class='rideSideLabel'>"+routeObj.distance+"km</span>";
    summaryHtmlStr += "</div>";
    summaryHtmlStr += "</div>";
    
    return summaryHtmlStr;
}

function presentDetail(routeObj) {
    var detailHtmlStr = "<div class='routeDetail'>";
    detailHtmlStr += presentFareSection(routeObj);
    detailHtmlStr += "</div>";
    
    return detailHtmlStr;
}

function presentFareSection(sectionObj) {
    var sectionHtmlStr = "";
    for(var i=0; i< sectionObj.detailList.length;i++) {
        obj = sectionObj.detailList[i];
        if(obj instanceof Station) {
            sectionHtmlStr += "<div class='routeStation'>";
            sectionHtmlStr += "<table><tr><td>"+obj.arrivalTime;
            if(obj.departureTime) {
                sectionHtmlStr += "着<br/>"+obj.departureTime+"発";
            }
            sectionHtmlStr += "</td>";
            sectionHtmlStr += "<td><span class='stationName'>"+obj.name+"</span></td><td>&nbsp<br/>&nbsp</td></tr></table>";
            sectionHtmlStr += "</div>";
        }else if(obj instanceof Access) {
            sectionHtmlStr += "<div class='access'>"+obj.transport+"<br/>"+obj.platform;
            if(obj.source) {
                sectionHtmlStr += "<br/><span style='color: orange; font-size: 12px;'>注意！此路線由私人提供，如有疑慮，請參考<a target='_blank' href='"+obj.source+"'>資料來源</a>。</span>";
            }
            sectionHtmlStr += "</div>";
        }else if(obj instanceof FareSection) {
            sectionHtmlStr += presentFareSection(obj);
        }
    }
    
    return sectionHtmlStr;
}

function minuteToStr(minute) {
    var str = "";
    var hour = Math.floor(minute / 60);
    if(hour > 0) {
        str += hour + "小時";
    }
    minute -= hour*60;
    str += minute + "分";
    
    return str;
}