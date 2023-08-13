# *markdown-code-tester*

*markdown-code-tester* は [*wes*](https://github.com/wachaon/wes) 用のモジュールで、*markdown* のコードブロックをテスト検証します。

## install
[*wes*](https://github.com/wachaon/wes) がインストールされている状態で下記のコマンドを実行してください。

```bin
wes install @wachaon/markdown-code-tester --bare
```

## usage
テストは非常に簡単です。

*code* の `meta` 要素に `{"testing": true}` が指定されているコードブロックをテストします。
`console.log()` 内に引数を持たないアロー関数があればそれを用いてテストコードを生成し、テストします。
テストコードは末尾コメントの値を期待値とするため、末尾コメントの記述は必須です。
`{"message": "***"}` で記述されたメッセージをテストの項目名として出力します。

テストの出力はビルトインモジュールの *minitest* に似た出力をします。

````
```javascript {"testing": true, "message": "1 puls 2 equal 3"}
const one = 1
const two = 2
console.log(() => one + two) /* => 3 */
```
````
と記述すると下記の通りに表示は一般的なコードブロックになります。

```javascript {"testing": true, "message": "1 puls 2 equal 3"}
const one = 1
const two = 2
console.log(() => one + two) /* => 3 */
```

あとは下記のように *README.md* を読み込んで、*markdown-code-tester* に適用してください。

```javascript
// built-ins
import { readFileSync } from 'filesystem'
import { resolve } from 'pathname'
import tester from 'markdownCodeTester'

const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'UTF-8')

tester(readme)
```
内部では下記のようにコードブロックがトランスパイルされテストされます。

```javascript
import { assert } from 'minitest';
const one = 1;
const two = 2;
assert.equal(3, (() => one + two)());
```

## テストに合格しなかったアイテムの表示

テストに合格しなかったアイテムは強調表示されます。

```javascript {"testing": true, "message": "2 by 3 equal 5"}
const two = 2
const three = 3

console.log(() => two * three) // => 5
```
