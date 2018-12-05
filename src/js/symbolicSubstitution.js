import {parseInfo} from "./code-analyzer";
import * as esprima from "esprima";
let localVars=new Map();
let argsVars=new Map();
let newLines=[];
let oldLines=[];
let newLineCounter=0;
let oldLinesCounter=0;
let tableLinesCounter=1;
let typeToHandlerMapping=new Map();

function functionAfterSubs(codeToParse) {
    initiateMap();
    saveFuncArgs();
    oldLines=codeToParse.split("/n");
    substitute(codeToParse);
};

function initiateMap() {
    typeToHandlerMapping=new Map();
    typeToHandlerMapping['variable declaration']=varDeclaration();
    typeToHandlerMapping['assignment expression']=varAssignment();
}
export {functionAfterSubs};

//extract from parseInfo all function args
function saveFuncArgs() {
    for(let i=1;i<parseInfo.length;i++)
    {
        if(parseInfo[i].Line>1)
            return;
        else
            argsVars[parseInfo[i].Name]= null;
    }
}

//go throw code lines and substitute
function substitute() {
    while(oldLinesCounter<oldLines.length){
        if(equals(oldLines[oldLinesCounter],"}") || equals(oldLines[oldLinesCounter],"{")){//if line not in table
            newLines[newLineCounter]=oldLines[i];
            newLineCounter++;
            oldLinesCounter++;
        }
        else{
            handleTableLine();
        }
    }
}

//given a "line" in table - check if needed to substitute/add to locals/ad as is to newLines
function handleTableLine() {
    if(tableLinesCounter==1) //function header
        copyAsIs();
    else {
        let currTableLines=getLinesFromParseInfo();
        for (let i=0;i<currTableLines.length;i++){
            let func = typeToHandlerMapping[currTableLines[i].Type];
            func.call(undefined, currTableLines[i]);
        }
        oldLinesCounter++;
    }
    tableLinesCounter++;
}

//not adding to newLines - only save vars
function varDeclaration(currItem) {
    let newVal = checkForLocals(currItem.Value);
    localVars.push({Name:(currItem.Name), Value:(newVal)});
}

function varAssignment(currItem) {
    if(argsVars.prototype.has(currItem.Name)){//is global
        argsVars[currItem.Name]=currItem.Value;
    }else{//local var
        localVars[currItem.Name]=currItem.Value;
    }
}


//copy from old to new as is (by counters)
function copyAsIs() {
    newLines[newLineCounter]=oldLines[oldLinesCounter];
    newLineCounter++;
    oldLinesCounter++;
}

//returns all lines from table with "Line" value of tableLinesCounter
function getLinesFromParseInfo() {
    let ans=[];
    for(let i=0;i<parseInfo.length;i++)
    {
        if(parseInfo[i].Line>tableLinesCounter)
            return ans;
        else {
            ans.push(parseInfo[i]);
        }
    }
    return ans;
}
