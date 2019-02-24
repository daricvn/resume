// This script is designed by Darick Nguyen
// Visit daricvn.github.io for more info!
// Contact: daricvn@gmail.com
var __dataObject={};
var __tempData="";
var __debounceTimer={};
var __pendingRenderNodes=[];
var __mainNode;
var __elemCache={};

// Random unique ID
var __char="qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
function __generateUniqueID(elem){
    resolve(function(){
        let time=Math.round((new Date()).getTime()/1000);
        let char=Math.floor(Math.random()*__char.length);
        let rndChar="";
        while (rndChar.length<=5){
            rndChar+=__char[char];
            char=Math.floor(Math.random()*__char.length);
        }
        elem.setAttribute("_js_content",rndChar+time);
    },false);
}
function __getUniqueID(elem){
    if (elem.hasAttribute("_js_content"))
        return elem.getAttribute("_js_content");
    return null;
}
function __findElemByUniqueID(uniqueID){
    if (!__elemCache[uniqueID])
        __elemCache[uniqueID]=__mainNode.querySelector("[_js_content="+uniqueID+"]");
    return __elemCache[uniqueID];
}
function clone(elem){
    let node= elem.cloneNode(true);
    if (__getUniqueID(node))
        node.removeAttribute("_js_content");
    return node;
}

// Assign trackable data
function assign(key, data){
    __dataObject[key]=data;
}
// Get trackable data from key
function data(key){
    if (key.indexOf(".")<0)
        return __dataObject[key];
    else{
        var child=key.split(".");
        var result=__dataObject[child[0]];
        for (let i=1; i< child.length; i++)
            if (result)
                result=result[child[i]];
        return result;
    }
}

// Detect if trackable data is changed
function isDataChanged(){
    let data=JSON.stringify(__dataObject);
    if (__tempData!=data)
        {
            __tempData=data;
            return true;
        }
    return false;
}

// Async resolve a function
function resolve(func, async)
{
    if (!__mainNode)
        __mainNode=document.querySelector("#main");
    if (async)
        setTimeout(function(){
            func.call(__mainNode);
        },0);
    else func.call(__mainNode);
}

// Toggle class
function toggleClass(elem, className){
    if (elem.className.indexOf(className)>=0)
        elem.className=elem.className.replace(className,"").trim();
    else elem.className+=" "+className;
}

// Delay a function call
function delay(func, time){
    setTimeout(func, time);
}
// Debounce a function call
function debounce(func, time){
    if (__debounceTimer[func.prototype.name])
        clearTimeout(__debounceTimer[func.prototype.name]);
        __debounceTimer[func.prototype.name]=setTimeout(function(){
            __debounceTimer[func.prototype.name]=null;
        func.call();
    }, time)
}

// GET API
function GET(url, func){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
        // Typical action to be performed when the document is ready:
            func(xhttp.responseText);
        }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

// Detect change from trackable data and render it to UI
function detectChanges(){
    resolve(function (){
        if (isDataChanged()){
            let scrollTop= this.scrollTop;
            let screenView= (this.scrollTop + window.innerHeight);
            let forElems = this.querySelectorAll("[data-for]");
            for (let i=0; i<forElems.length; i++)
                if (data(forElems[i].dataset["for"]) && Array.isArray(data(forElems[i].dataset["for"])))
                {
                    let elem=forElems[i];
                    if (!__getUniqueID(elem))
                        __generateUniqueID(elem);
                    let parent=elem.parentNode;
                    let sameChild=parent.querySelectorAll(elem.tagName+"[manipulated="+__getUniqueID(elem)+"]");
                    let arr=data(elem.dataset["for"]);
                    for (let j=0; j<arr.length; j++)
                    {
                        let nextEle=null;
                        if (j==0)
                            nextEle=elem;
                        else
                        if (j<= sameChild.length && sameChild[j-1]){
                            nextEle=sameChild[j-1];
                        }
                        else{
                            nextEle=clone(elem);
                            nextEle.removeAttribute("data-for","");
                            parent.appendChild(nextEle);
                            nextEle.setAttribute("manipulated",__getUniqueID(elem));
                        }
                        let childElems=nextEle.querySelectorAll("[data-key]");
                        for (let k=0; k< childElems.length; k++){
                            if (arr[j][childElems[k].dataset.key])
                                if (childElems[k].dataset.style){
                                    let value=arr[j][childElems[k].dataset.key]+"";
                                    let target=childElems[k];
                                    if (childElems[k].dataset["delaykey"] && arr[j][childElems[k].dataset["delaykey"]])
                                    {
                                        childElems[k].dataset.delay=arr[j][childElems[k].dataset["delaykey"]];
                                    }
                                    else childElems[k].dataset.delay="100";
                                    target.dataset["styleValue"]=value;
                                    target.setAttribute("sync-render",__getUniqueID(elem));
                                }
                                else
                                    childElems[k].innerHTML=arr[j][childElems[k].dataset.key];
                            }
                    }
                    if (sameChild.length>arr.length-1)
                        for (let j=arr.length; j<=sameChild.length; j++)
                            parent.removeChild(sameChild[j-1]);
                }

            let animationElems=this.querySelectorAll("[data-animation]");
            for (let i=0; i<animationElems.length; i++)
            {
                let elem=animationElems[i];
                let currentOffset=elem.getBoundingClientRect().top + this.scrollTop;
                if (currentOffset<scrollTop || currentOffset>screenView)
                    __pendingRenderNodes.push(elem);
                else{
                    __renderAnimation(elem);
                }
            }

            let textElems=this.querySelectorAll("[data-text]");
            for (let i=0; i<textElems.length; i++)
                __renderText(textElems[i]);

            let styleElems= this.querySelectorAll("[data-style]")
                // let delayTime=childElems[k].dataset.delay?+childElems[k].dataset.delay:100;
            for (let i=0; i<styleElems.length; i++){
                let target=styleElems[i];
                var elemTop=0;
                if (target.hasAttribute("sync-render")){
                    elemTop=__findElemByUniqueID(target.getAttribute("sync-render")).getBoundingClientRect().top +this.scrollTop;
                }
                else
                    elemTop=target.getBoundingClientRect().top +this.scrollTop;
                if (elemTop<scrollTop || elemTop>screenView)
                {
                    __pendingRenderNodes.push(target);
                }
                else if (target.hasAttribute("data-style-value"))
                    __renderStyle(target);
            }
        }
    },true);
}

function __scrollSpy(e){
    let target=document.querySelector("div#main");
    debounce(function scrollSpy(){
        if (__pendingRenderNodes && __pendingRenderNodes.length>0){
            let offsetX=target.scrollLeft;
            let scrollTop= target.scrollTop;
            let screenView= (scrollTop + window.innerHeight);
            
            for (let i=0; i<__pendingRenderNodes.length; i++)
            {
                let elem=__pendingRenderNodes[i];
                let currentOffset=elem.getBoundingClientRect().top + target.scrollTop - 100;
                if (currentOffset>=scrollTop && currentOffset<=screenView){
                    __pendingRenderNodes.splice(i,1);
                    if (elem.hasAttribute("data-animation")){
                        __renderAnimation(elem,0.2);
                    }
                    if (elem.hasAttribute("data-style")){
                        __renderStyle(elem,0.6);
                    }
                    i--;
                }
            }
        }
    },50);
}

function __renderAnimation(elem, reduce){
    let animationKey=elem.dataset["animation"];
    elem.removeAttribute("data-animation");
    let delayTime=0;
        if (elem.dataset["delay"])
        {
            delayTime=+elem.dataset["delay"];
        }
    if (elem.parentNode)
        {
            let parent=elem.parentNode;
            while (parent && parent.tagName!="body" && parent.id!="main")
            {
                if (parent.dataset && parent.dataset.delay)
                    delayTime+=+parent.dataset.delay;
                parent=parent.parentNode;
            }
        }
    if (reduce)
        delayTime=delayTime*reduce;
    delay(function(){
        toggleClass(elem,animationKey);
    }, delayTime);
}

function __renderStyle(elem, reduce){
    let styleKey=elem.dataset.style;
    let dataValue=elem.dataset["styleValue"];
    let delayTime=+elem.dataset["delay"]+100;
    if (elem.parentNode)
        {
            let parent=elem.parentNode;
            while (parent && parent.tagName!="body" && parent.id!="main")
            {
                if (parent.dataset && parent.dataset.delay)
                    delayTime+=+parent.dataset.delay;
                parent=parent.parentNode;
            }
        }
    if (reduce)
        delayTime=delayTime*reduce;
    elem.removeAttribute("data-style-value");
    elem.removeAttribute("data-delay");
    delay(function(){
        elem.style[styleKey]=dataValue;
    }, delayTime)
}
function __renderText(elem){
    let text=data(elem.dataset["text"]);
    if (text){
        elem.innerHTML=text;
        elem.setAttribute("text-rendered","");
    }
}

document.addEventListener("DOMContentLoaded",function(){
    assign("skills",[
        { "skillname":"HTML & Javascript", "rating":"95%", "delay":"100" },
        { "skillname":"C#", "rating":"80%", "delay":"300" },
        { "skillname":"Angular", "rating":"70%", "delay":"200" },
        { "skillname":"ASP.NET Core", "rating":"70%", "delay":"400" },
        { "skillname":"MongoDB", "rating":"50%", "delay": 500},
        { "skillname":"Team work", "rating":"100%", "delay": 300},
        { "skillname":"Quick learning", "rating":"80%", "delay": 200}
    ]);
    GET("data/skills.json", function (json){
        assign("skills", JSON.parse(json));
        debounce(detectChanges,250);
    });
    GET("data/english.json", function (json){
        assign("text", JSON.parse(json));
        debounce(detectChanges,250);
    });
    document.querySelector("#main").addEventListener("scroll",__scrollSpy);
    window.addEventListener("resize",__scrollSpy);
});

