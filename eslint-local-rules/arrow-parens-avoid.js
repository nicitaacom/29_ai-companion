"use strict"

// Arrow function parameters should use `avoid` style under this project's configured
// `arrowParens: "avoid"`. Specifically:
// - A single simple identifier parameter MUST NOT be wrapped in parens.
// - Valid: x => x + 1
// - Bad:   (x) => x + 1
// Allowed:
// - Multi-identifier parameters still need parens: (x, y) => x + y
// - Destructured / default / rest parameters still need parens: ({a}) => a, (x=1) => x, (...x) => x
// - Type annotations / inline JSX typings still need parens
// - A parenthesized expression where the inner token is NOT a simple Identifier is allowed
//   to avoid false positives on advanced syntax we're not specifically linting for
module.exports = {
  "arrow-parens-avoid": {
    meta: {
      type: "suggestion",
      fixable: "code",
      docs: {
        description: "disallow wrapping a single simple identifier arrow parameter in parens under arrowParens: 'avoid'",
      },
      schema: [],
      messages: {
        avoidSingleParens:
          "Remove the parens around the single parameter '{{name}}' - with arrowParens: 'avoid', a bare identifier doesn't need them.",
      },
    },
    create(context) {
      const sourceCode = context.sourceCode ?? context.getSourceCode()

      return {
        ArrowFunctionExpression(node) {
          if (node.params.length !== 1) return
          const param = node.params[0]
          if (
            !param ||
            param.type !== "Identifier" ||
            param.typeAnnotation ||
            /^use[A-Z]/.test(node.parent?.id?.name || "")
          ) {
            return
          }
          if (node.parent && node.parent.type === "MethodDefinition") return

          // Look at the param list's own two bracketing tokens directly, rather than the whole
          // arrow node's first/last tokens - the node's last token often belongs to the BODY
          // (e.g. "(set) => ({ ... })" ends on the body's own closing paren, not the param
          // list's), so anchoring on that produced both false negatives (bodies that don't end in
          // ")", like "(x) => x + 1") and, once a fixer used it to decide what to remove, active
          // corruption (removing the body's paren instead of the param's).
          const first = sourceCode.getFirstToken(node)
          if (!first || first.value !== "(") return
          if (sourceCode.getTokenAfter(first)?.type !== "Identifier") return

          const closingParen = sourceCode.getTokenAfter(param)
          if (!closingParen || closingParen.value !== ")") return

          // Exclude arrow assertion/return-type signatures like (image): image is string => ...
          // - the parens are required there (TS return-type position), not stylistic.
          const tokenAfterClosingParen = sourceCode.getTokenAfter(closingParen)
          if (tokenAfterClosingParen && tokenAfterClosingParen.value === ":") return

          context.report({
            node: first,
            messageId: "avoidSingleParens",
            data: { name: param.name },
            fix(fixer) {
              return [fixer.remove(first), fixer.remove(closingParen)]
            },
          })
        },
      }
    },
  },
}
