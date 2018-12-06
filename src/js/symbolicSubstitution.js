import {parseInfo} from "./code-analyzer";
import * as esprima from "esprima";

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
    oldLines=codeToParse.split("\n");
    substitute(new Map());

    alert('aaaaaaaa');
};

function initiateMap() {
    typeToHandlerMapping=new Map();
    typeToHandlerMapping['variable declaration']=varDeclaration;
    typeToHandlerMapping['assignment expression']=varAssignment;
    typeToHandlerMapping['While Statement']=condition;
    typeToHandlerMapping['if statement']=condition;
    typeToHandlerMapping['else if statement']=condition;
    typeToHandlerMapping['else statement']=copyAsIs;
    typeToHandlerMapping['return statement']=returnStatement;
    //expressions
    typeToHandlerMapping['BinaryExpression']=BinaryExpression;
    typeToHandlerMapping['Identifier']=Identifier;
    typeToHandlerMapping['Literal']=Literal;
    typeToHandlerMapping['UnaryExpression']=UnaryExpression;
    typeToHandlerMapping['MemberExpression']=MemberExpression;
}
export {functionAfterSubs};
export {newLines};

//extract from parseInfo all function args
function saveFuncArgs() {
    for(let i=1;i<parseInfo.length;i++)
    {
        if(parseInfo[i].Line>1)
            return;
        else
            argsVars.set(parseInfo[i].Name, null);
    }
}


function substituteBlock(localVars,endOfScopeLine) {
    while(oldLinesCounter<=endOfScopeLine)
    {
        let temp=oldLines[oldLinesCounter];
        temp=temp.replace(/\s/g, '');
        if((temp=="}") || (temp=="{") || !(temp.length)){//if line not in table
            newLines[newLineCounter]=oldLines[oldLinesCounter];
            newLineCounter++;
            oldLinesCounter++;
        }
        else{
            handleTableLine(localVars);
        }
        if(oldLinesCounter<=endOfScopeLine && oldLines[oldLinesCounter].includes("{")){
            substitute(localVars);
        }else {
            let x;
        }
    }
}

//go throw code lines and substitute
function substitute(localVars) {
    while(oldLinesCounter<oldLines.length){
        let newlocalVars=new Map(localVars);
        let endOfScopeLine=findEndOfScopeLine();
        substituteBlock(newlocalVars,endOfScopeLine);
    }
}
//start from oldLinesCounter - find end of scope by { }
function findEndOfScopeLine() {
    let openCount=0;
    for(let i=oldLinesCounter;i<oldLines.length;i++){
        if(oldLines[i].includes("{"))
            openCount++;
        else
            openCount=openCount;
        if(oldLines[i].includes("}"))
            openCount--;
        else
            openCount=openCount;
        if(openCount==0)
            return i;
        else
            openCount=openCount;
    }
    return oldLines.length-1;
}


//given a "line" in table - check if needed to substitute/add to locals/ad as is to newLines
function handleTableLine(localVars) {
    if(tableLinesCounter==1) //function header
        copyAsIs(localVars);
    else {
        let currTableLines=getLinesFromParseInfo();
        for (let i=0;i<currTableLines.length;i++){
            let func = typeToHandlerMapping[currTableLines[i].Type];
            let xxx=func.call(undefined, currTableLines[i],localVars);
            if(currTableLines[i].Type!='variable declaration' && currTableLines[i].Type!='assignment expression'){
                newLines[newLineCounter]=xxx;
                newLineCounter++;
            }
        }
    }
    oldLinesCounter++;
    tableLinesCounter++;
}


//not adding to newLines - only save vars
function varDeclaration(currItem,localVars) {
    let newVal = checkForLocals(currItem.Value,localVars);
    localVars.set((currItem.Name), newVal);
}

function varAssignment(currItem,localVars) {
    if(argsVars.has(currItem.Name)){//is global
        let newVal=checkForLocals(currItem.Value,localVars);
        argsVars.set(currItem.Name,newVal);
        newLines[newLineCounter]="let "+currItem.Name+"="+newVal+";";
        newLineCounter++;
    }else{//local var
        let newVal=checkForLocals(currItem.Value,localVars);
        localVars.set(currItem.Name,newVal);
    }
}

//while or if or if else
function condition(currItem,localVars) {
    let newCondition = checkForLocals(currItem.Condition,localVars);
    let oldLine=oldLines[oldLinesCounter];
    let newLine=oldLine.replace(/ *\([^)]*\) */g, "("+newCondition+")");
    return newLine;
    // newLines[newLineCounter]=newLine;
    // newLineCounter++;
}

function returnStatement(value,localVars)
{
    return "return" + checkForLocals(value.Value,localVars)+";";
}

function checkForLocals(Value,localVars) {
    if(Value=="null(or nothing)")
        return;
    else {
        let x = esprima.parseScript(Value+'');
        let func = typeToHandlerMapping[(x.body)[0].expression.type];//what king of expression
        return func.call(undefined, (x.body)[0].expression,localVars);
    }
}

function BinaryExpression(expression,localVars)
{
    let left=expression.left;
    let right=expression.right;
    left=binaryOneSide(left,localVars);
    right=binaryOneSide(right,localVars);
    //calculate if possible
    let res=calculate(left,right,expression.operator);
    if(res==null)
        return "("+left+' '+expression.operator+' '+right+")";
    else
        return res;
}

function calculate(left, right, operator) {
    let leftNum=Number(left);
    let rightNum=Number(right);
    if(isNaN(leftNum) || isNaN(rightNum))
        return null;
    else{
        switch(operator) {
            case "+":
                return leftNum+rightNum;
            case "-":
                return leftNum-rightNum;
            case "*":
                return leftNum*rightNum;
            case "/":
                return leftNum/rightNum;
            default:
                return null;
        }
    }
}

function binaryOneSide(left,localVars) {
    let func = typeToHandlerMapping[left.type];
    let temp= func.call(undefined,left,localVars);
    if(left.type==('BinaryExpression'))
        left="( "+temp+" )";
    else
        left=temp;
    return left;
}

//var
function Identifier(value,localVars)
{
    if(localVars.has(value.name))
        return localVars.get(value.name);
    else
        return value.name;
}

function Literal(value,localVars)
{
    return value.value;
}

function UnaryExpression(value,localVars)
{
    let func = typeToHandlerMapping[value.argument.type];
    let newVal= func.call(undefined,value.argument,localVars);
    return value.operator+' '+newVal;
}

function MemberExpression(value,localVars)
{
    let ans='';
    let func = typeToHandlerMapping[value.property.type];
    let indexVal= func.call(undefined,value.property,localVars);
    if(localVars.has(value.object.name))
        ans+= localVars.get(value.object.name);
    else
        ans+= value.object.name;
    return ans+' [ '+indexVal+' ] ';
}

//copy from old to new as is (by counters)
function copyAsIs(localVars) {
    newLines[newLineCounter]=oldLines[oldLinesCounter];
    newLineCounter++;
}

//returns all lines from table with "Line" value of tableLinesCounter
function getLinesFromParseInfo() {
    let ans=[];
    for(let i=0;i<parseInfo.length;i++)
    {
        if(parseInfo[i].Line>tableLinesCounter)
            return ans;
        else {
            if(parseInfo[i].Line==tableLinesCounter)
                ans.push(parseInfo[i]);
            else
                ans=ans;
        }
    }
    return ans;
}

