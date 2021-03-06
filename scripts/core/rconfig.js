let P5=p5;

function uuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

let precisao = 100;
function trunca (x){
    return Math.round(x*precisao)/precisao;
  }

require.config({
    baseUrl: "scripts",
    paths: {
        // Paths
        views: "views",
        formulas: "formulas",
        // Libs 
        text: "../libs/requirejs/text",
    },
    waitSeconds: 20
});

let _FnOut;
let _loadedViews={};
let _views = {};
let _formulas={};
let _datasets={};
let _matrixes = {};

let _Mhandler = {set:(target, name, value)=>{
    target[name]= value;
    if(name!="op"){
        _formulas[target['op']].run(target);
        for(let i in _loadedViews){
            if(_loadedViews.hasOwnProperty(i)){
                _loadedViews[i]._onMatrixChange();
            }
        }
    }
    return true;
}};

Colors= {
    g: {
        bg1:    '#263238',
        bg2:    '#4499aa',
        fg1:    '#fefefe',
        fg2:    '#bf360c',
        typo:   '#222222',
    },
    obj: [
        '#ff0029', '#377eb8', '#66a61e', '#984ea3', '#00d2d5', '#ff7f00', '#af8d00',
        '#7f80cd', '#b3e900', '#c42e60', '#a65628', '#f781bf', '#8dd3c7', '#bebada',
        '#fb8072', '#80b1d3', '#fdb462', '#fccde5', '#bc80bd', '#ffed6f', '#c4eaff',
        '#cf8c00', '#1b9e77', '#d95f02', '#e7298a', '#e6ab02', '#a6761d', '#0097ff',
        '#00d067', '#f43600', '#4ba93b', '#5779bb', '#927acc', '#97ee3f', '#bf3947',
        '#9f5b00', '#f48758', '#8caed6', '#f2b94f', '#eff26e', '#e43872', '#d9b100',
        '#9d7a00', '#698cff', '#d9d9d9', '#00d27e', '#d06800', '#009f82', '#c49200',
        '#cbe8ff', '#fecddf', '#c27eb6', '#8cd2ce', '#c4b8d9', '#f883b0', '#a49100',
        '#f48800', '#27d0df', '#a04a9b'
    ]
};

async function loadViewsClasses(views){
    for(let i=0;i<views.length;i++){
        await new Promise(function(resolve,reject){
            require([`views/${views[i].file || views[i].name || views[i]}`],_View=>{
                let viewName = views[i].name || views[i];
                if(_View!==undefined && _views[viewName]===undefined){
                    views[i].class = _View;
                    _views[viewName] = views[i];
                }
                resolve();
            });
        });
    }
}

async function loadFormulas(fn){
    let formulaOptions = "";
    for(let i=0; i< fn.length;i++){
        await new Promise((resolve,reject)=> {
            require([`formulas/${fn[i].file || fn[i].name || fn[i]}`], _Fn => {
                if (_Fn !== undefined) {
                    let fnName = fn[i].name || fn[i];
                    let fnFile = fn[i].file || fnName;
                    let fnOut = fn[i].out || ["C"];
                    _formulas[fnName] = {out: fnOut, run: _Fn};
                    formulaOptions+=`<option value="${fnName}">${fnName}</option>`
                }
                resolve();
            })
        })
    }
    return formulaOptions;
}

async function loadDatasets(fn){
    for(let i=0; i< fn.length;i++){
        await new Promise((resolve,reject)=> {
            require([`datasets/${fn[i].file || fn[i].name || fn[i]}`], _Fn => {
                if (_Fn !== undefined) {
                    let fnName = fn[i].name || fn[i];
                    let fnFile = fn[i].file || fnName;
                    _datasets[fnName] = {name: fnName, content: _Fn};
                }
                resolve();
            })
        })
    }
}


async function mainLoad(M,views,fn,ds){
    _matrixes = new Proxy(M,_Mhandler);
    
    await loadViewsClasses(views);
    await loadDatasets(ds);

    let formulaOptions = await loadFormulas(fn);

    let formulaSelector=$("#formula");

    formulaSelector.html(formulaOptions);

    let container = $(".main-content");
    let datasets = new DatasetsConstructor(_datasets, _matrixes, $("#dataset-container"), $('#datasets-open'));
    let grid = new GridConstructor(2,container,_views,_loadedViews,_formulas,_matrixes,formulaSelector);

}

require(["core/Matrixes","views/registry","formulas/registry","datasets/registry"],(M,views,fn,ds)=>{ mainLoad(M,views,fn,ds); });