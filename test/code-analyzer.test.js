
import assert from 'assert';
import {parseCode, parseInfo, createParseInfo} from '../src/js/code-analyzer';
import {functionAfterSubs,newLines} from '../src/js/symbolicSubstitution';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    // it('is parsing a simple variable declaration correctly', () => {
    //     assert.equal(
    //         JSON.stringify(parseCode('let a = 1;')),
    //         '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
    //     );
    // });
});

describe('save info and create table',()=>{

    it('code with no func decleration', ()=>{
        let text=parseCode('let x;');
        let msg=createParseInfo(text);
        assert.deepEqual('Illigal input',msg);
    });

    it('return inside function', ()=>{
        let text=parseCode('function x() {\n' +
            '    return 0;\n' +
            '}');
        createParseInfo(text);
        let expRes=[{Line:'1', Type:'function declaration', Name:'x', Condition:'', Value:''},
            {Line:'2', Type:'return statement', Name:'', Condition:'', Value:'0'}];
        assert.deepEqual(expRes,parseInfo);
    });

    it('function with var assign', ()=>{
        let code='function x(a){\nlet b=a;\n}\nlet y=0;';
        let vars='1';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i];
        }
        assert.deepEqual('function x(a){}',ans);
    });

    it('another function with arg array-string compare',()=> {
        let code = 'function x(a,b){\n' +
            'if(a[0]=="a" && b==1){\n' +
            'return "a";\n' +
            '}\n' +
            '}';
        let vars = '[\'a\',false],0';
        let temp = parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp, vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual('function x(a,b){\n' +
            'if(a [ 0 ]  == "a" && b == 1){\n' +
            'return "a";\n' +
            '}\n' +
            '}\n', ans);
    });

    it('function with global array', ()=>{
        let code='let a=[true];\n' +
            'function x(){\n' +
            'let b=0;\n' +
            'if(a[b]){\n' +
            'return "a";\n' +
            '}\n' +
            '}';
        let vars='';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(){\n' +
            'if(a [ 0 ] ){\n' +
            'return "a";\n' +
            '}\n' +
            '}\n');
    });

    it('arg array one item-string', ()=>{
        let code= 'function x(a){\n' +
            'if(a[0]==\'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}';
        let vars='["a"]';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            'if(a [ 0 ]  == \'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}\n');
    });
    it('arg array three item-string', ()=>{
        let code= 'function x(a){\n' +
            'if(a[0]==\'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}';
        let vars='["a",1,true]';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            'if(a [ 0 ]  == \'a\'){\n' +
            'return true;\n' +
            '}\n' +
            '}\n');
    });

    it('no globals but enter', ()=>{
        let code= '\nfunction x(a){\n' +
            '}';
        let vars='"a"';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a){\n' +
            '}\n');
    });

    it('var assignment with locals', ()=>{
        let code= 'function x(a,b){\n' +
            'let b=a;\n' +
            'let c;\n' +
            'c=b;\n' +
            'b=c;\n' +
            '}';
        let vars='"a",1';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            'b=a;\n'+
            '}\n');
    });

    it('using multiple', ()=>{
        let code= 'function x(a,b){\n' +
            'let x=a*b;\n' +
            '}';
        let vars='2,1';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            '}\n');
    });

    it('calculate plus', ()=>{
        let code= 'function x(){\n' +
            'let x=1+2;\n' +
            '}';
        let vars='';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(){\n' +
            '}\n');
    });

    it('zeros and not computable-all operators', ()=>{
        let code= 'function x(a,b){\n' +
            'let x=0+a;\n' +
            'x=a+0;\n'+
            'x=0+a;\n'+
            'x=a+b;\n'+
            'x=a-0;\n'+
            'x=a-b;\n'+
            'x=3-2;\n'+
            'x=2*3;\n'+
            'x=a*3;\n'+
            'x=2*a;\n'+
            'x=b*a;\n'+
            'x=2/3;\n'+
            'x=a/3;\n'+
            'x=2/a;\n'+
            'x=b/a;\n'+
            '}';
        let vars='2,9';
        let temp=parseCode(code);
        createParseInfo(temp);
        functionAfterSubs(temp,vars);
        let ans='';
        for(let i=0;i<newLines.length;i++){
            ans+=newLines[i]+'\n';
        }
        assert.deepEqual(ans,'function x(a,b){\n' +
            '}\n');
    });
});


/////////////////////////////////part 2


// describe('function with global array', () => {
//
// });
//
// describe('function with arg array-string compare', () => {
//
// });
//
// describe('another function with arg array-string compare', () => {
//     it('another function with arg array-string compare',()=>{
//         let code='function x(a,b){\n' +
//             'if(a[0]=="a" && b==1){\n' +
//             'return "a";\n' +
//             '}\n' +
//             '}';
//         let vars='[\'a\',false],0';
//         let temp=parseCode(code);
//         functionAfterSubs(temp,vars);
//         let ans=newLines.toString();
//         assert.deepEqual('function x(a,b){\n' +
//             '\n' +
//             'if(a [ 0 ]  == "a" && b == 1){\n' +
//             'return "a";\n' +
//             '\n' +
//             '}\n' +
//             '\n' +
//             '}\n',ans);
//     });
//
// });
// it('function with global array', ()=>{
//     let code='let a=[true];\n' +
//         'function x(){\n' +
//         'let b=0;\n' +
//         'if(a[b]){\n' +
//         'return "a";\n' +
//         '}\n' +
//         '}';
//     let vars='';
//     let temp=parseCode(code);
//     functionAfterSubs(temp,vars);
//     // let ans='';
//     // for(let i=0;i<newLines.length;i++){
//     //     ans+=newLines[i]+'\n';
//     // }
//     assert.deepEqual(newLines.toString(),'function x(){\n' +
//         '\n' +
//         'if(a [ 0 ] ){\n' +
//         'return "a";\n' +
//         '\n' +
//         '}\n' +
//         '\n' +
//         '}\n');
// });