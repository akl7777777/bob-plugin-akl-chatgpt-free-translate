const CryptoJS = require("crypto-js");
const {random_safe} = require("./e.js");
const {readFile,historyFileName} = require("./file");
const file = require("./file");

async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        let mode = $option.mode;
        let prompt = $option.prompt;
        const configValue = readFile();
        if (configValue.mode) {
            mode = configValue.mode;
        }
        let A = [{"role": "user", "content": translate_text}]
        // 如果是翻译模式,需要拼接
        if (mode === 'translate') {
            translate_text = `请将以下${source_lang}内容翻译成${target_lang}：\n${translate_text}`
            A = [{"role": "user", "content": translate_text}]
        } else if (mode === 'polishing') {
            translate_text = `请润色以下内容：\n${translate_text}`
            A = [{"role": "user", "content": translate_text}]
        } else if (mode === 'custom_prompt') {
            translate_text = `${prompt}\n${translate_text}`
            A = [{"role": "user", "content": translate_text}]
        } else {
            A = readFile(historyFileName).concat(A);
        }
        const L = Date.now();
        const resp = await $http.request({
            method: "POST",
            url: random_safe('aHR0cDovL3d3dy5ub3RhZy5jbi9hcGkvZ2VuZXJhdGU='),
            body: {
                messages: A,
                time: L,
                pass: null,
                sign: await generateSignature({
                    t: L,
                    m: (A && A[A.length - 1] && A[A.length - 1].content) ? A[A.length - 1].content : ""
                })
            },
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36'
            }
        });
        if (resp.data) {
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: resp.data.split('\n'),
                },
            });
        } else {
            const errMsg = resp.data ? JSON.stringify(resp.data) : '请求翻译接口失败,请检查网络'
            completion({
                error: {
                    type: 'unknown',
                    message: errMsg,
                    addtion: errMsg,
                },
            });
        }
// 对话模式就保存
        if (mode === 'conversation') {
            A.push({
                content: resp.data,
                role: "assistant",
            });
            file.writeFile({
                value: A,
                fileName: file.historyFileName,
            });
        }
        return resp.data;
    } catch (e) {
        $log.error('接口请求错误 ==> ' + JSON.stringify(e))
        Object.assign(e, {
            _type: 'network',
            _message: '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}

async function digestMessage(r) {
    const hash = CryptoJS.SHA256(r);
    return hash.toString(CryptoJS.enc.Hex);
}

async function generateSignature(r) {
    const {t: e, m: t} = r;
    const n = {}.PUBLIC_SECRET_KEY;
    const a = `${e}:${t}:${n}`;
    const rs = await digestMessage(a);
    $log.error('==========' + rs)
    return rs;
}

exports.translate = translate;
