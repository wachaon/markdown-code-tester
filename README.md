# *markdownCodeTester*

*markdownCodeTester* は [*wes*](https://github.com/wachaon/wes) 用のモジュールで、*markdown* のコードブロックをテスト検証します。

## install
[*wes*](https://github.com/wachaon/wes) がインストールされている状態で下記のコマンドを実行してください。

```bin
wes install @wachaon/markdownCodeTester --bare
```

## usage
テストは非常に簡単です。

`meta` 要素に `{"testing": true}` が指定されているコードブロックをテストします。
`console.log()` 内に引数を持たないアロー関数があればそれを用いてテストコードを生成し、テストします。
テストコードは末尾コメントの値を期待値とするため、末尾コメントの記述は必須です。

````
```javascript {"testing": true}
const one = 1
const two = 2
console.log(() => one + two) /* => 3 */
```
````
と記述すると下記の用になります。

```javascript {"testing": true}
const one = 1
const two = 2
console.log(() => one + two) /* => 3 */
```
あとは下記のように *markdownCodeTester* を読み込んで指定してください。

```javascript
// built-ins
import { readFileSync } from 'filesystem'
import { resolve } from 'pathname'
import tester from 'markdownCodeTester'

const md = readFileSync(resolve(process.cwd(), 'README.md'), 'UTF-8')

tester(md)
```