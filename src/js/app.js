import $ from 'jquery';
import {createParseInfo, parseCode, parseInfo} from './code-analyzer';
import {functionAfterSubs,newLines,colors} from "./symbolicSubstitution";



$(document).ready(function () {

    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let input=$('#varsPlaceholder').val();
        createParseInfo(parsedCode);
        functionAfterSubs(codeToParse,input);
        showFuncAfterSubs();
        addToTable();
    });

});

function showFuncAfterSubs() {

    let table = document.getElementById('subsFuncTable');

    for(let i=0;i<newLines.length;i++){
        var row = table.insertRow(i);
        var line = row.insertCell(0);
        line.innerHTML=newLines[i];
        if(colors.has(i))
        {
            if(colors.get(i))
                line.className="green";
            else
                line.className="red";
        }

    }
}


function addToTable() {
    let table = document.getElementById('resultsTable');
    table.innerHTML = '<tr>\n' +
        '                <th>Line</th>\n' +'<th>Type</th>\n' + '<th>Name</th>\n' + '<th>Condition</th>\n' + '<th>Value</th>\n' +
        '            </tr>';
    for(let i=0;i<parseInfo.length;i++){
        var row = table.insertRow(i+1);
        var line = row.insertCell(0);
        var type = row.insertCell(1);
        var name = row.insertCell(2);
        var condition = row.insertCell(3);
        var value = row.insertCell(4);
        line.innerHTML = parseInfo[i].Line;
        type.innerHTML = parseInfo[i].Type;
        name.innerHTML = parseInfo[i].Name;
        condition.innerHTML = parseInfo[i].Condition.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        value.innerHTML = parseInfo[i].Value;
    }
}
