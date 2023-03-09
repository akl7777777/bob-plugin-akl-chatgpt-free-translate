const {random, random_safe} = require("./e.js");


async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        const resp = await $http.request({
            method: "POST",
            url: random_safe('aHR0cHM6Ly9jaGF0Z3B0LWFwaS5zaG4uaGsvdjEv'),
            body: {
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": translate_text}]
            },
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });

        if (resp.data && resp.data.choices && resp.data.choices.length) {
            const rs = []
            resp.data.choices.forEach((item) => {
                rs.push(item.message.content)
            })
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: rs,
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

exports.translate = translate;
