import {parseInfo} from "./code-analyzer";
import * as esprima from "esprima";

let argsVars=new Map();
let newLines=[];
let oldLines=[];
let newLineCounter=0;
let oldLinesCounter=0;
let tableLinesCounter=1;
let typeToHandlerMapping=new Map();
let typeToHandlerMappingColor=new Map();
let colors=[];

function functionAfterSubs(codeToParse) {
    initiateMap();
    initiateMapColor();
    saveFuncArgs();
    codeToParse=codeToParse.replace(new RegExp("}", 'g'),"}\n");
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
            // newLines[newLineCounter]=oldLines[oldLinesCounter];
            // newLineCounter++;
            copyAsIs(localVars);
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
    if(oldLines[oldLinesCounter].includes("{"))
        openCount++;
    if(oldLines[oldLinesCounter].includes("}") && (oldLines[oldLinesCounter].indexOf("}"))>(oldLines[oldLinesCounter].indexOf("{")))
        openCount--;
    if(openCount==0)
        return oldLinesCounter;
    else
        openCount=openCount;
    for(let i=oldLinesCounter+1;i<oldLines.length;i++){
        if(oldLines[i].includes("}"))
            openCount--;
        if(openCount==0)
            return i;
        if(oldLines[i].includes("{"))
            openCount++;
        else
            openCount=openCount;
    }
    return oldLines.length-1;
}


function getTabs() {
    for(let i=0;i<oldLines[oldLinesCounter].length;i++){
        if(oldLines[oldLinesCounter].charAt(i)!="\t" && oldLines[oldLinesCounter].charAt(i)!=" "){
            return oldLines[oldLinesCounter].substring(0,i);
        }
    }
    return "";
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
            if(currTableLines[i].Type!='variable declaration' && currTableLines[i].Type!='assignment expression' && xxx!=undefined){
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
    if (argsVars.has(currItem.Name)) {//is global
        let newVal = checkForLocals(currItem.Value, localVars);
        argsVars.set(currItem.Name, newVal);
        newLines[newLineCounter] = getTabs() + currItem.Name + "=" + newVal + ";";
        newLineCounter++;
    } else {//local var
        let newVal = checkForLocals(currItem.Value, localVars);
        localVars.set(currItem.Name, newVal);
    }
}

//while or if or if else
function condition(currItem,localVars) {
    let newCondition = checkForLocals(currItem.Condition,localVars);
    let oldLine=oldLines[oldLinesCounter];
    let newLine=oldLine.replace(/ *\([^)]*\) */g, "("+newCondition+")");
    if(currItem.Type=="if statement" || currItem.Type=="else if statement"){
        findColor(newCondition);
    }
    return newLine;
    // newLines[newLineCounter]=newLine;
    // newLineCounter++;
}

function returnStatement(value,localVars)
{
    return getTabs()+"return " + checkForLocals(value.Value,localVars)+";";
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
    if(res==null) {
        if (expression.operator == "*" || expression.operator == "/")
            return "(" + left + ") " + expression.operator + " " + right;
        else
            return left + " " + expression.operator + " " + right;
    }else
        return res;
}

//check for zeros or only numbers
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
        left=""+temp;
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
    let temp=oldLines[oldLinesCounter];
    if(!temp.replace(/\s/g, '').length)
        return;
    else {
        newLines[newLineCounter]=oldLines[oldLinesCounter];
        newLineCounter++;
    }

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

//get line and find&return color
function findColor(condition) {
    let x = esprima.parseScript(condition+'');
    let func = typeToHandlerMappingColor[(x.body)[0].expression.type];//what king of expression
    let ans= func.call(undefined, (x.body)[0].expression);
    colors.push({"line":newLineCounter,"Color":ans});
}

function initiateMapColor() {
    typeToHandlerMappingColor=new Map();
    //expressions
    typeToHandlerMappingColor['BinaryExpression']=BinaryExpressionC;
    typeToHandlerMappingColor['Identifier']=IdentifierC;
    typeToHandlerMappingColor['Literal']=LiteralC;
    typeToHandlerMappingColor['UnaryExpression']=UnaryExpressionC;
    typeToHandlerMappingColor['MemberExpression']=MemberExpressionC;
}

function BinaryExpressionC(expression)
{
    let left=expression.left;
    let right=expression.right;
    left=binaryOneSideC(left);
    right=binaryOneSideC(right);
    //calculate if possible
    let res=calculate(left,right,expression.operator);
    if(res==null) {
        switch(expression.operator) {
            case "<":
                return left < right;
            case ">":
                return left > right;
            case "<=":
                return left <= right;
            case ">=":
                return left >= right;
            case "==":
                return left == right;
            case "!=":
                return left != right;
            case "||":
                return left || right;
            case "&&":
                return left && right;
            default:
                return null;
        }
    }else
        return res;
}

function binaryOneSideC(left) {
    let func = typeToHandlerMappingColor[left.type];
    let temp= func.call(undefined,left);
    return temp;
}

//var
function IdentifierC(value)
{
    if(argsVars.has(value.name))
        return argsVars.get(value.name);
    else
        return null;
}

function LiteralC(value)
{
    return value.value;
}

function UnaryExpressionC(value)
{
    let func = typeToHandlerMappingColor[value.argument.type];
    let newVal= func.call(undefined,value.argument);
    return calculate("1",newVal,value.operator);
}

function MemberExpressionC(value)
{
    let func = typeToHandlerMappingColor[value.property.type];
    let indexVal= func.call(undefined,value.property);
    if(argsVars.has(value.object.name))
        return (argsVars.get(value.object.name))[indexVal];
    else
        return null;
}