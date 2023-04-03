const CryptoJS = require("crypto-js");
const {random_safe} = require("./e.js");


async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        const mode = $option.mode;
        // 如果是翻译模式,需要拼接
        if (mode === 'translate') {
            translate_text = `请将以下${source_lang}内容翻译成${target_lang}：\n${translate_text}`
        } else if (mode === 'polishing') {
            translate_text = `请润色以下内容：\n${translate_text}`
        }
        const A = [{"role": "user", "content": translate_text}]
        const L = Date.now();
        const resp = await $http.request({
            method: "POST",
            url: random_safe('aHR0cHM6Ly9zdW1tZXJpbmcuaWN1L2FwaS9nZW5lcmF0ZQ=='),
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
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
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
