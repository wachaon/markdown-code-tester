// bilt-ins
import { readFileSync, writeFileSync, deleteFileSync } from 'filesystem'
import { resolve } from 'pathname'
import { gray, clear } from 'ansi'
import genGUID from 'genGUID'

// unified
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import gfm from 'remark-gfm'

// babel
import { parse } from '@babel/parser'
import { default as traverse } from '@babel/traverse'
import { default as generator } from '@babel/generator'

function markdownCodeTester(markdown) {
    fromMarkdown(markdown)
        .children
        .filter(node => node.type === 'code')
        .forEach(code => {
            if (code.meta != null) {
                const meta = JSON.parse(code.meta)
                if (meta.testing) codeTester(code.value)
            }
        })
}

function codeTester(code) {
    const source = transpile(code)
    console.debug('[source]:\n%s', source)

    const spec = resolve(__dirname, genGUID() + '.mjs')
    writeFileSync(spec, source, 'UTF-8')
    try {
        require(spec)
        console.log('%s\n%s// =>%s %O\n', code, gray, clear, true)
    } catch (e) {
        throw e
    } finally {
        deleteFileSync(spec)
    }
    return code
}

function transpile(script) {
    // option の設定
    const option = { sourceType: 'module' }
    // script を ast に変換
    const ast = parse(script)

    // 変換
    traverse(ast, {
        // 関数の呼び出しのみが対象
        CallExpression({ node, parent }) {
            // console.log() のみが対象
            if ('object' in node.callee
                && node.callee.object.name === 'console'
                && node.callee.property.name === 'log'
            ) {
                // アロー関数かつ、引数なしのもののみが対象
                if (node.arguments.length === 1
                    && node.arguments[0].type === "ArrowFunctionExpression"
                    && node.arguments[0].params.length === 0
                ) {
                    // 末尾コメントから期待値を取得
                    const expected = parent.trailingComments[0].value.replace(' => ', '')

                    // assert.equal を文字列で生成
                    const equal = 'assert.equal(' + expected + ',(' + generator(node.arguments[0]).code + ')())'

                    // ast として生成
                    parent.expression = parse(equal).program.body[0].expression

                    // 末尾コメントの削除
                    delete parent.trailingComments
                }
            }
        }
    })

    // assertオブジェクトを導入
    ast.program.body.unshift(
        parse(`import { assert } from 'minitest'`, option).program.body[0]
    )
    return generator(ast).code

}

markdownCodeTester.codeTester = codeTester
module.exports = markdownCodeTester

// util
// markdown を ast に変換
function fromMarkdown(markdown) {
    return unified()
        .use(remarkParse)
        .use(gfm)
        .parse(markdown)
}
