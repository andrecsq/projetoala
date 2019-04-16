class GridConstructor{
    constructor(rows,container,views,loadedViews, formulas, matrixes,formulasSelector){
        this.matrixes = matrixes;
        this.formulas = formulas;
        this.loadedViews=loadedViews;
        this.formulaSelector = formulasSelector;
        this.matrixNames = Object.keys(matrixes);
        this.actualFormula=this.formulaSelector.val();
        this.matrixes.op = this.actualFormula;
        this.container = container;
        this.elements=[];
        this.views = views;
        for(let i=0;i<rows;i++){
            this.elements.push([]);
            for(let j=0;j<this.matrixNames.length;j++){
                this.elements[i].push([i,j]);
            }
        }
        this.createGridCells(this.elements);
    }

   loadCell(r, c){
        let last= r==this.elements.length-1;
        let viewsNames="";
        for(let i in this.views) {
            viewsNames += `<option value="${i}">${i}</option>`;
        }
        return `<section id="grid-${r}-${c}" style="grid-area: r${r}-c${c}" class="vis-container">
                    <div class="config">
                        <div class="mainOptions">
                            <select class="chooseView">
                                ${viewsNames}
                            </select>
                        </div>
                        <div class="viewOptions">
                        </div>
                    </div>
                    <div class="content"></div>
                    <div class="spanButton ${(last?"hide":"")}">
                        <span data-expand="down"><i class="fas fa-angle-down"></i></span>
                        <span data-expand="up"><i class="fas fa-angle-up"></i></span>
                    </div>
                </section>`;
    }
    
    rearrangeCells(){
        this.GridCells(this.elements,false);
    }

    createGridCells(){
        this.GridCells(this.elements, true);
    }

    GridCells(elements, create){
        let gridElements = [];
        let templateArea="";
        for(let i=0;i<elements.length;i++){
            templateArea+=`"`;
            for(let j=0;j<elements[0].length;j++){
                if(elements[i][j][0] !== i || elements[i][j][1]!==j){
                    this.container.find(`#grid-${i}-${j}`).css({"display":"none"});
                }
                else{ 
                    if(create){
                        let cell=$(this.loadCell(i,j));
                        this.setEvents(cell,i,j);
                        gridElements.push(cell);
                    }else{
                        this.container.find(`#grid-${i}-${j}`).css({"display":""});
                    }
                }
                templateArea+=`r${elements[i][j][0]}-c${elements[i][j][1]} `;
            }
            templateArea+=`"`;
        }
        this.container[0].style.gridTemplateAreas=templateArea;
        if(create)this.container.append(gridElements);
    }

    loadFormula(){
        let oldFormula = this.actualFormula;
        let newFormula = $(this.formulaSelector).val();
        try{
            this.matrixes.op = newFormula;
            for(let i in this.loadedViews){
                if(this.loadedViews.hasOwnProperty(i)){
                    this.loadedViews[i]._out=this.formulas[this.actualFormula].out;
                    this.loadedViews[i].onOutChange();
                }
            }           

            this.actualFormula = newFormula;
        }catch(e){
            Messages.error(e);
            this.matrixes.op = oldFormula;
            this.actualFormula = oldFormula;
        }
       
    }

    loadViewObj(cell,view,r,c){
        let viewClassContainer = this.views[view];
        let colspan = viewClassContainer.colspan || 1;
        let out = this.formulas[this.formulaSelector.val()].out;
        this.mergeColumns(r,c,colspan);
        let matrixNames = this.matrixNames.slice(c,c+colspan);
        this.loadedViews[view+"-"+r+"-"+c]=new (viewClassContainer.class)({out:out,container:cell[0],matrixNames:matrixNames,matrixes:this.matrixes});
    }

    setEvents(cell,r,c){
        let _this=this;
        let viewChooser =cell.find(".chooseView");
        let expandUp = cell.find("[data-expand=up]");
        let expandDown = cell.find("[data-expand=down]");
        let oldView = viewChooser.val();
        _this.loadViewObj(cell,oldView,r,c);
        expandUp.on("click",e=>{
            _this.mergeRows(r,c,-1);
        });

        expandDown.on("click",e=>{
            _this.mergeRows(r,c,1);
        });

        viewChooser.on("change",e=>{
           let value = viewChooser.val();
           try{
               _this.loadViewObj(cell,value,r,c);
               oldView = value;
           }catch(e){
                Messages.error(e,true);
                viewChooser.val(oldView);
           }
        });

        this.formulaSelector.on("change",e=>{
            _this.loadFormula();
        })
        this.loadFormula();
    }

    isRowsMerged(elm,r,c){
        return ( r+1 < elm.length    && elm[r+1][c][0]===elm[r][c][0] && elm[r+1][c][1]===elm[r][c][1])
            || ( r-1 >= 0             && elm[r-1][c][0]===elm[r][c][0] && elm[r-1][c][1]===elm[r][c][1]);
    }

    isColumnsMerged(elm,r,c){
        return ( c+1 < elm[0].length    && elm[r][c+1][0]===elm[r][c][0] && elm[r][c+1][1]===elm[r][c][1])
            || ( c-1 >= 0             && elm[r][c-1][0]===elm[r][c][0] && elm[r][c-1][1]===elm[r][c][1]);
    }

    mergeColumns(r,c,colspan){
        colspan = colspan===undefined?1:colspan;
        if(colspan>=1){
            colspan--;
            if(c+colspan>this.elements[0].length) 
                throw `View Maior que espaço alocado! tente alocar na ${(1+colspan-this.elements[0].length)}ª célula`;
            let elements = JSON.parse(JSON.stringify(this.elements));
            let tam=0,left,acol = c, arow = r;

            for(let i=0; i < elements[0].length;i++){
                if(elements[arow][i][1]===c){
                    acol=i; tam++;
                }
            }
            
            left = colspan<tam;
            colspan = Math.abs(colspan-tam);
            while(arow < elements.length && elements[arow][acol][0]===r && elements[arow][acol][1]===c){
                if(!left) for(let i = acol; i <= (acol+colspan); i++) {
                    if(!this.isRowsMerged(elements,arow,i))
                        elements[arow][i] = [r,c];
                    else{
                        if(i===acol)continue;
                        throw "Não pode sobrepor célula mesclada";
                    }
                }else for(let i = acol; i > Math.max(c,acol-colspan) ; i--){
                    elements[arow][i] = [arow,i];
                }
                arow++;
                this.elements = elements;
                this.rearrangeCells();
            }
        }
    }

    mergeRows(r,c,rowspan){
        let elements = JSON.parse(JSON.stringify(this.elements));
        if(rowspan!==0){
            let up = rowspan<0, acol = c, arow = r;
            rowspan = Math.abs(rowspan);
            for(let i=0; i < elements.length;i++){
                arow = elements[i][acol][0]===r?i:arow;
            }
            while(acol < elements[0].length && elements[arow][acol][0]===r && elements[arow][acol][1]===c){
                if(!up) for(let i = arow; i <= (arow+rowspan); i++) {
                    if(!this.isColumnsMerged(elements,i,acol))
                        elements[i][acol] = [r,c];
                    else{
                        if(i===arow)continue;
                        throw "Não pode sobrepor célula mesclada";
                    }
                }
                else for(let i = arow; i > Math.max(r,arow-rowspan) ; i--){
                    elements[i][acol] = [i,acol];
                }
                acol++;
            }

            this.elements = elements;
            this.rearrangeCells();
        }
    }
}
