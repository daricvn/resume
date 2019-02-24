var __dataObject={};
var __tempData="";
var __debounceTimer={};
var __pendingRenderNodes=[];

function assign(key, data){
    __dataObject[key]=data;
}
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
function isDataChanged(){
    let data=JSON.stringify(__dataObject);
    if (__tempData!=data)
        {
            __tempData=data;
            return true;
        }
    return false;
}

function resolve(func, async)
{
    if (async)
        setTimeout(function(){
            func.call(document.querySelector("#main"));
        },0);
    else func.call(document.querySelector("#main"));
}

function toggleClass(elem, className){
    if (elem.className.indexOf(className)>=0)
        elem.className=elem.className.replace(className,"").trim();
    else elem.className+=" "+className;
}

function delay(func, time){
    setTimeout(func, time);
}
function debounce(func, time){
    if (__debounceTimer[func.prototype.name])
        clearTimeout(__debounceTimer[func.prototype.name]);
        __debounceTimer[func.prototype.name]=setTimeout(function(){
            __debounceTimer[func.prototype.name]=null;
        func.call();
    }, time)
}
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


function detectChanges(){
    resolve(function (){
        if (isDataChanged()){
            let forElems = this.querySelectorAll("[data-for]");
            for (let i=0; i<forElems.length; i++)
                if (data(forElems[i].dataset["for"]) && Array.isArray(data(forElems[i].dataset["for"])))
                {
                    let elem=forElems[i];
                    let parent=elem.parentNode;
                    let sameChild=parent.querySelectorAll("[data-for="+elem.dataset.for+"]");
                    let arr=data(elem.dataset["for"]);
                    for (let j=0; j<arr.length; j++)
                    {
                        let nextEle=null;
                        if (j<= sameChild.length && sameChild[j]){
                            nextEle=sameChild[j];
                        }
                        else{
                            nextEle=elem.cloneNode(true);
                            parent.appendChild(nextEle);
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
                                    let delayTime=childElems[k].dataset.delay?+childElems[k].dataset.delay:100;
                                    if (parent.dataset.delay)
                                        delayTime += + parent.dataset.delay + 400;
                                    delay(function(){
                                        target.style[target.dataset.style]=value;
                                    }, delayTime);
                                }
                                else
                                    childElems[k].innerHTML=arr[j][childElems[k].dataset.key];
                            }
                    }
                    if (sameChild.length>arr.length)
                        for (let j=arr.length; j<sameChild.length; j++)
                            parent.removeChild(sameChild[j]);
                }

            let animationElems=this.querySelectorAll("[data-animation]");
            let scrollTop= this.scrollTop;
            let screenView= (this.scrollTop + window.innerHeight)*0.9;
            for (let i=0; i<animationElems.length; i++)
            {
                let elem=animationElems[i];
                let currentOffset=elem.offsetTop;
                if (currentOffset<scrollTop || currentOffset>screenView)
                    __pendingRenderNodes.push(elem);
                else{
                    __renderAnimation(elem);
                }
            }

            let textElems=this.querySelectorAll("[data-text]");
            for (let i=0; i<textElems.length; i++)
                __renderText(textElems[i]);
        }
    },true);
}

function __scrollSpy(e){
    let target=document.querySelector("div#main");
    debounce(function scrollSpy(){
        if (__pendingRenderNodes && __pendingRenderNodes.length>0){
            let offsetX=target.scrollLeft;
            let scrollTop= target.scrollTop;
            let screenView= (scrollTop + window.innerHeight)*0.9;
            
            for (let i=0; i<__pendingRenderNodes.length; i++)
            {
                let elem=__pendingRenderNodes[i];
                let currentOffset=elem.offsetTop;
                if (currentOffset>=scrollTop && currentOffset<=screenView){
                    __pendingRenderNodes.splice(i,1);
                    __renderAnimation(elem,0.2);
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
function __renderText(elem){
    let text=data(elem.dataset["text"]);
    if (text){
        elem.innerHTML=text;
    }
}

document.addEventListener("DOMContentLoaded",function(){
    detectChanges();
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

