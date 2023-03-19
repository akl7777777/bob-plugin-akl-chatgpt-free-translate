const {random, random_safe} = require("./e.js");


async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        const mode = $option.mode;
        // 如果是翻译模式,需要拼接
        if (mode === 'translate') {
            translate_text = `请将以下${fromName}内容翻译成${toName}：\n${translate_text}`
        } else if (mode === 'polishing') {
            translate_text = `请润色以下内容：\n${translate_text}`
        }
        const resp = await $http.request({
            method: "POST",
            url: random_safe('aHR0cDovL3d3dy5zYXZpb3J0aGVkaXN0YW50LmNvbS90YWxrL2Fza1F1ZXN0aW9u'),
            body: {"question":translate_text},
            header: {
                'Content-Type': 'application/json',
                'User-Agent': 'ChatWithAiRobot/5.3.0 (iPhone; iOS 16.3.1; Scale/3.00)'
            }
        });

        if (resp.data && resp.data.data) {
            completion({
                result: {
                    from: query.detectFrom,
                    to: query.detectTo,
                    toParagraphs: resp.data.data.split('\n'),
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
