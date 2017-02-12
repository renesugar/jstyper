import * as ts from 'typescript';
import {ReactorCallback} from '../utils/language_service_reactor';
import * as nodes from '../utils/nodes';
import * as symbols from '../utils/symbols';
import {Mutator} from '../utils/mutator';

export const updateExports: ReactorCallback = (fileNames, services, addChange, addRequirement) => {
  const program = services.getProgram();
  const checker = program.getTypeChecker();

  for (const sourceFile of program.getSourceFiles()) {
    if (fileNames.indexOf(sourceFile.fileName) >= 0) {
      const mutator = new Mutator(sourceFile.fileName, addChange);

      const exports = new Map<ts.Symbol, string>();
      ts.forEachChild(sourceFile, visitDefaultExport);
      if (exports.size > 0) {
        ts.forEachChild(sourceFile, visitExports);
      }

      function visitDefaultExport(node: ts.Node) {
        if (nodes.isExpressionStatement(node) && nodes.isBinaryExpression(node.expression) && nodes.isEqualsToken(node.expression.operatorToken)) {
          const {left, right} = node.expression;
          let should
          if (nodes.isPropertyAccessExpression(left) && nodes.isIdentifier(left.expression) &&
              left.name.text == 'exports' && left.expression.text == 'module') {
            if (nodes.isObjectLiteralExpression(right)) {
              let canExportSeparately = true;
              
              for (const prop of right.properties) {
                // TODO: handle nodes.isShorthandPropertyAssignment(prop)
                if (nodes.isPropertyAssignment(prop) && nodes.isIdentifier(prop.name)) {
                  const sym = checker.getSymbolAtLocation(prop.initializer || prop.name);

                  function isRewritable(d: ts.Declaration) {
                    return d.getSourceFile() == sourceFile &&
                      !isVarWithSiblings(d) &&
                      (!nodes.isVariableDeclaration(d) || nodes.isIdentifier(d.name));
                  }
                  if (sym && sym.getDeclarations().every(isRewritable)) {
                    exports.set(sym, prop.name.text);
                    continue;
                  }
                }
                canExportSeparately = false;
              }

              const start = node.getStart();
              if (canExportSeparately) {
                mutator.remove(start, node.getFullWidth());
              } else {
                mutator.remove(start, right.getStart() - start, `export default `);
                exports.clear();
              }
            }
          }
        }
      }

      function visitExports(node: ts.Node) {
        if (nodes.isClassDeclaration(node) ||
            nodes.isFunctionDeclaration(node)) {
          node.name && handleExport(symbols.getSymbol(node, checker), node, node.name.text);
        } else if (nodes.isVariableStatement(node) && node.declarationList.declarations.length == 1) {
          const decl = node.declarationList.declarations[0];
          if (nodes.isIdentifier(decl.name)) {
            handleExport(symbols.getSymbol(decl, checker), node, decl.name.text);
          }
        }
      }

      function handleExport(sym: ts.Symbol | undefined, node: ts.Node, name: string) {
        // const sym = symbols.getSymbol(node, checker);
        if (sym) {
          const exportedName = exports.get(sym);
          if (exportedName) {
            if (name == exportedName) {
              // for (const decl of sym.getDeclarations()) {
                mutator.insert(node.getStart(), 'export ');
              // }
            } else {
              // for (const decl of sym.getDeclarations()) {
                mutator.insert(node.getEnd(), `\nexport {${name} as ${exportedName}};\n`);
              // }
            }
          }
        }
      }
    }
  }
};

function isVarWithSiblings(node: ts.Node): boolean {
  return nodes.isVariableDeclaration(node) &&
      nodes.isVariableDeclarationList(node.parent) &&
      node.parent.declarations.length > 1;
}