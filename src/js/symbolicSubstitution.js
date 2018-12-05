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
    oldLines=codeToParse.split("\n");
    substitute(codeToParse);
    newLines;
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

//go throw code lines and substitute
function substitute() {
    while(oldLinesCounter<oldLines.length){
        let temp=oldLines[oldLinesCounter];
        if((oldLines[oldLinesCounter]=="}") || (oldLines[oldLinesCounter]=="{") || !(temp.replace(/\s/g, '').length)){//if line not in table
            newLines[newLineCounter]=oldLines[oldLinesCounter];
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
            let xxx=func.call(undefined, currTableLines[i]);
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
function varDeclaration(currItem) {
    let newVal = checkForLocals(currItem.Value);
    localVars.set((currItem.Name), newVal);
}

function varAssignment(currItem) {
    if(argsVars.has(currItem.Name)){//is global
        argsVars.set(currItem.Name,currItem.Value);
    }else{//local var
        let newVal=checkForLocals(currItem.Value);
        localVars.set(currItem.Name,newVal);
    }
}

//while or if or if else
function condition(currItem) {
    let newCondition = checkForLocals(currItem.Condition);
    let oldLine=oldLines[oldLinesCounter];
    let newLine=oldLine.replace(/ *\([^)]*\) */g, "("+newCondition+")");
    return newLine;
    // newLines[newLineCounter]=newLine;
    // newLineCounter++;
}

function returnStatement(value)
{
    return 'return ' + checkForLocals(value.Value);
}

function checkForLocals(Value) {
    if(Value=="null(or nothing)")
        return;
    else {
        let x = esprima.parseScript(Value+'');
        let func = typeToHandlerMapping[(x.body)[0].expression.type];//what king of expression
        return func.call(undefined, (x.body)[0].expression);
    }
}

function BinaryExpression(expression)
{
    let left=expression.left;
    let right=expression.right;
    left=binaryOneSide(left);
    right=binaryOneSide(right);
    //calculate if possible
    let res=calculate(left,right,expression.operator);
    if(res==null)
        return left+' '+expression.operator+' '+right;
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

function binaryOneSide(left) {
    let func = typeToHandlerMapping[left.type];
    let temp= func.call(undefined,left);
    if(left.type==('BinaryExpression'))
        left='( '+temp+' )';
    else
        left=temp;
    return left;
}

//var
function Identifier(value)
{
    if(localVars.has(value.name))
        return localVars.get(value.name);
    else
        return value.name;
}

function Literal(value)
{
    return value.value;
}

function UnaryExpression(value)
{
    let func = typeToHandlerMapping[value.argument.type];
    let newVal= func.call(undefined,value.argument);
    return value.operator+' '+newVal;
}

function MemberExpression(value)
{
    let ans='';
    let func = typeToHandlerMapping[value.property.type];
    let indexVal= func.call(undefined,value.property);
    if(localVars.has(value.object.name))
        ans+= localVars.get(value.object.name);
    else
        ans+= value.object.name;
    return ans+' [ '+indexVal+' ] ';
}

//copy from old to new as is (by counters)
function copyAsIs() {
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

