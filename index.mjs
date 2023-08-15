// bilt-ins
import { writeFileSync, deleteFileSync } from 'filesystem'
import { resolve } from 'pathname'
import { gray, brightGreen, clear } from 'ansi'
import genGUID from 'genGUID'
import { NONE, LF, CHECKMARK } from 'text'

const INDENT = "    "

// unified
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import gfm from 'remark-gfm'
import inspect from 'unist-util-inspect'
import remarkStringify from 'remark-stringify'

// babel
import { parse } from '@babel/parser'
import { default as traverse } from '@babel/traverse'
import { default as generator } from '@babel/generator'

// main
function markdownCodeTester(markdown) {
    // インデントの深さを定義
    let col = 0

    fromMarkdown(markdown)
        .children
        // 必要なノードのみにする
        .filter(node => (node.type === 'code' && node.meta != null && JSON.parse(node.meta).testing) || node.type === 'heading')
        .map(node => {
            // heading と code それぞれ必要な情報のみ摘出する
            const { type, depth, value } = node
            if (type === 'code') {
                const meta = JSON.parse(node.meta)
                let { message, imports = [] } = meta
                const source = (imports.concat("import { assert } from 'minitest'")).join(LF) + LF + value
                return {
                    type,
                    value: source,
                    message,
                    imports,
                }
            } else {
                return {
                    type,
                    depth,
                    value: toMarkdown(node),
                }
            }
        })
        .forEach(node => {
            // 表示処理
            const { type, depth, value, message } = node
            if (type === 'heading') {
                console.log(`\n${gray}${INDENT.repeat(depth - 1)}${value.replace(/(\r?\n)+$/, NONE)}`)
                col = depth
            } else {
                try {
                    codeTester(value)
                    console.log(`${INDENT.repeat(col - 1)}  ${brightGreen}${CHECKMARK} ${gray}${message || NONE}`)
                } catch (e) {
                    console.log(`${INDENT.repeat(col - 1)}    ${message || NONE} ${gray}// =>${clear} ${e.message}`)
                }
            }
        })
}

// トランスパイルしたコードを基にテストをする
function codeTester(code) {
    const source = transpile(code)
    const spec = resolve(__dirname, genGUID() + '.mjs')
    writeFileSync(spec, source, 'UTF-8')
    try {
        require(spec)
    } catch (e) {
        throw e
    } finally {
        deleteFileSync(spec)
    }
    return code
}

// トランスパイル
function transpile(script) {
    // option の設定
    const option = { sourceType: 'module' }
    // script を ast に変換
    const ast = parse(script, option)

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
                    const expected = parent.trailingComments[0].value.replace(/\s*=>\s*/, NONE)

                    // 実際の値を取得
                    const actual = generator(node.arguments[0]).code

                    // assert.equal を文字列で生成
                    const equal = `assert.equal(${expected}, (${actual})())`

                    // ast として生成
                    parent.expression = parse(equal).program.body[0].expression

                    // 末尾コメントの削除
                    delete parent.trailingComments
                }
            }
        }
    })

    return generator(ast).code
}

/**
 * *markdown* を *mdast* に変換
 * @param {string} markdown - *markdown*
 * @returns {mdast} *mdast*
 */
function fromMarkdown(markdown) {
    return unified()
        .use(remarkParse)
        .use(gfm)
        .parse(markdown)
}

/**
 * *mdast* を *markdown* に変換
 * @param {mdast} mdast - *html* の 抽象構文木
 * @returns {string} *markdown*
 */
function toMarkdown(mdast) {
    return unified()
        .use(remarkStringify)
        .use(gfm)
        .stringify(mdast)
}

// 登録
module.exports = markdownCodeTester
