import { Field12, Field2 } from './pairing/Fields';
import { bn , bn2} from './Polynomial';
import bigInt from 'big-integer'
var esprima = require('esprima');
function isString(value) {return typeof value === 'string';}
let next_symbol = 0;

class R1CS {

  

  static genid() {
    next_symbol += 1;
    return 'sym_'+ next_symbol;
  }

  static extractCode(code) {
    let o = []
    let inputs = [];
    let body = [];
    let returned = false;
    //console.log(esprima)
    let bodycode = esprima.parse(code);
    bodycode = bodycode.body;
    if (bodycode[0].type != 'FunctionDeclaration') {
      throw new Error("error");
    }
  
    for (let arg of bodycode[0].params) {
        if (arg.type=='Identifier') {
          inputs.push(arg.name);
        } else {
          throw new Error("Invalid arg");
        }
    }
  
    for (let c of bodycode[0].body.body) {
        if (c.type!='VariableDeclaration' && c.type!='ReturnStatement') {
          throw new Error("Expected variable assignment or return");
        }
        
        if (returned)
          throw new Error("Cannot do stuff after a return statement");
  
        if (c.type == 'ReturnStatement')
            returned = true;
        body.push(c)
    }
  
    return { inputs, body };
  }

  static flatExpr(target, expr) {
    let op;
    if (expr.type == 'Identifier') {
      return  [['set', target, expr.name]] 
    } else if (expr.type == 'Literal') {
      return  [['set', target, expr.value] ]
    } else if (expr.type == 'BinaryExpression') {
      if (expr.operator == '+')
            op = '+';
      else if (expr.operator == '*')
            op = '*';
      else if (expr.operator == '-')
            op = '-';
      else if (expr.operator == '/')
            op = '/';
      else if (expr.operator == '**') {
        if (expr.right.type == 'Literal') {
          if (expr.right.value == 0)
            return [['set', target, 1]];
          else if (expr.right.value == 1)
            return R1CS.flatExpr(target, expr.left);
          else {
            let nxt , base, latest;
            let o=[];
            if (expr.left.type=='Identifier' || expr.left.type=='Literal') {
                if (expr.left.type=='Identifier') {
                  nxt = base = expr.left.name;
                } else {
                  nxt = base = expr.left.value;
                }
  
            } else {
                nxt = base = genid()
                o = R1CS.flatExpr(base, expr.left)
            }
            for (let i = 1; i < expr.right.value; i++) {
              latest = nxt;
              if (i == expr.right.value - 1) {
                nxt = target;
              } else { 
                nxt = R1CS.genid();
              }
              o.push(['*', nxt, latest, base])
            }
            return o;
          }
  
        }
      } else {
        throw new Error("Bad operation");
      }
      let var1, sub1, var2, sub2;
      if (expr.left.type=='Identifier' || expr.left.type=='Literal') {
        if (expr.left.type=='Identifier') {
          var1 = expr.left.name;
        } else {
          var1 = expr.left.value;
        }
        sub1 = []
      } else {
        var1 = R1CS.genid()
        sub1 = R1CS.flatExpr(var1, expr.left)
      }
  
      if (expr.right.type=='Identifier' || expr.right.type=='Literal') {
        if (expr.right.type=='Identifier') {
          var2 = expr.right.name;
        } else {
          var2 = expr.right.value;
        }
        sub2 = []
      } else {
        var2 = R1CS.genid()
        sub2 = R1CS.flatExpr(var2, expr.right)
      }
      
      return sub1.concat( sub2 ) .concat( [[op, target, var1, var2]] );
    } else {
      throw new Error("Bad Statemendt");
    }
  }
  
  static flat_stmt(stmt) {
    let target;
    let expr;
    if (stmt.type=='VariableDeclaration') {
      target = stmt.declarations[0].id.name;
      expr = stmt.declarations[0].init;
    } else if (stmt.type == 'ReturnStatement') {
      target = '~out';
      expr = stmt.argument;
    }
    return R1CS.flatExpr(target, expr)
  }

  static getVars(inputs, flatcode) {
    let outputs = [];
    for (let c of flatcode) {
      if (inputs.indexOf(c[1])===-1 && c[1]!='~out' ) {
        outputs.push(c[1]);
      }
    }
    return Array.concat(['~one'], inputs ,['~out'] , outputs);
  }
  
  static convertToFlat(body) {
    let o = []
    for (let c of body) 
      o = o.concat(R1CS.flat_stmt(c))
    return o
  }

  static insertVar(arr, vars, variable, used, reverse = false) {
    if (isString(variable)) {
        if (!(variable in used))
            throw new Error("Using a variable before it is set!");
        if (reverse)
          arr[vars.indexOf(variable)] += -1;
        else 
          arr[vars.indexOf(variable)] += 1;
        
    } else {
        if (reverse) 
          arr[0] += variable * (-1); 
        else
          arr[0] += variable * 1; 
    }
}


  static fromFlatcode(inputs , flatCode) {
    let vars = R1CS.getVars(inputs, flatCode);
    let A = [], B = [], C = [];
    let used = {};
    for (let i in inputs) {
      used[inputs[i]] = true;
    } 

    for (let x of flatCode) {
      let a = new Array(vars.length).fill(0); 
      let b = new Array(vars.length).fill(0);  
      let c = new Array(vars.length).fill(0); 
      if (x[1] in used) {
        throw new Error("Variable already used:"+x[1]);
      }
      used[x[1]] = true;
      if (x[0] == 'set') {
        a[vars.indexOf(x[1])] += 1;
        R1CS.insertVar(a, vars, x[2], used, true);
        b[0] = 1;
      } else if (x[0]=='+' || x[0]=='-') {
        c[vars.indexOf(x[1])] = 1;
        R1CS.insertVar(a, vars, x[2], used);
        R1CS.insertVar(a, vars, x[3], used, x[0]=='-');
        b[0] = 1; 
      } else if (x[0]=='*') {
        c[vars.indexOf(x[1])] = 1;
        R1CS.insertVar(a, vars, x[2], used);
        R1CS.insertVar(b, vars, x[3], used);
      } else if (x[0]=='/') {
        R1CS.insertVar(c, vars, x[2], used);
        a[vars.indexOf(x[1])] = 1;
        R1CS.insertVar(b, vars, x[3], used);
      }
      A.push(a);
      B.push(b);
      C.push(c);
    }
    
    return {A, B, C};
  }
  static grab(vars, assignment, variable)
  {
      if (isString(variable))
          return assignment[vars.indexOf(variable)];
      else if (!isNaN(variable))
          return variable;
      else
          throw new Error("What kind of expression is this?" , variable)
  }
 
  static evaluateCode(inputs, inputVars, flatCode)
  {
    let vars = R1CS.getVars(inputs, flatCode);
    let assignment = new Array(vars.length).fill(0);
    assignment[0] = 1
    for (let i = 0; i<inputVars.length; i++) {
      assignment[i + 1] = inputVars[i];
    }
    for (let x of flatCode) {
        if (x[0] == 'set')
            assignment[vars.indexOf(x[1])] = R1CS.grab(vars, assignment, x[2]);
        else if (x[0] == '+')
            assignment[vars.indexOf(x[1])] = R1CS.grab(vars, assignment, x[2]) + R1CS.grab(vars, assignment, x[3]);
        else if (x[0] == '-')
            assignment[vars.indexOf(x[1])] = R1CS.grab(vars, assignment, x[2]) - R1CS.grab(vars, assignment, x[3]);
        else if (x[0] == '*')
            assignment[vars.indexOf(x[1])] = R1CS.grab(vars, assignment, x[2]) * R1CS.grab(vars, assignment, x[3]);
        else if (x[0] == '/')
            assignment[vars.indexOf(x[1])] = R1CS.grab(vars, assignment, x[2]) / R1CS.grab(vars, assignment, x[3]);
    }
    assignment = assignment.map(function(el){
      return new Field2(bn2, bigInt(el) );

    })
    return assignment;
  }
}

export default R1CS;
