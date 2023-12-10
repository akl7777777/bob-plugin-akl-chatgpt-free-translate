const {readFile,historyFileName} = require("./file");
const file = require("./file");

async function translate(query, source_lang, target_lang, translate_text, completion) {
    try {
        let mode = $option.mode;
        let model = $option.model;
        let url = "https://veygrlhubijv.cloud.sealos.io/v1/chat/completions";
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
        let targetText = ""; // 初始化拼接结果变量
        let buffer = ""; // 新增 buffer 变量
        (async () => {
            await $http.streamRequest({
                method: "POST",
                url: url,
                header:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer sk-GTBL94nGR4BIesKwA9C678F956234097BdA5005aFd936b7f`
                },
                body:{
                    model: model,
                    stream: true,
                    temperature: 0.2,
                    max_tokens: 1000,
                    top_p: 1,
                    frequency_penalty: 1,
                    presence_penalty: 1,
                    messages: [
                        {
                            role: "user",
                            content: translate_text,
                        }
                    ]
                },
                cancelSignal: query.cancelSignal,
                streamHandler: (streamData) => {
                    if (streamData.text.includes("Invalid token")) {
                        query.onCompletion({
                            error: {
                                type: "secretKey",
                                message: "配置错误 - 请确保您在插件配置中填入了正确的 API Keys",
                                addtion: "请在插件配置中填写正确的 API Keys",
                            },
                        });
                    } else {
                        // 将新的数据添加到缓冲变量中
                        buffer += streamData.text;
                        // 检查缓冲变量是否包含一个完整的消息
                        while (true) {
                            const match = buffer.match(/data: (.*?})\n/);
                            if (match) {
                                // 如果是一个完整的消息，处理它并从缓冲变量中移除
                                const textFromResponse = match[1].trim();
                                targetText = handleResponse(query, true, targetText, textFromResponse);
                                buffer = buffer.slice(match[0].length);
                            } else {
                                // 如果没有完整的消息，等待更多的数据
                                break;
                            }
                        }
                    }
                },
                handler: (result) => {
                    if (result.response.statusCode >= 400) {
                        handleError(query, result);
                    } else {
                        query.onCompletion({
                            result: {
                                from: query.detectFrom,
                                to: query.detectTo,
                                toParagraphs: [targetText],
                            },
                        });
                    }
                }
            });
        })().catch((err) => {
            query.onCompletion({
                error: {
                    type: err._type || "unknown",
                    message: err._message || "未知错误",
                    addtion: err._addition,
                },
            });
        });
        return "";
    } catch (e) {
        Object.assign(e, {
            _type: 'network',
            _message: '接口请求错误 - ' + JSON.stringify(e),
        });
        throw e;
    }
}


function handleResponse(query, isChatGPTModel, targetText, textFromResponse) {
    if (textFromResponse !== '[DONE]') {
        try {
            const dataObj = JSON.parse(textFromResponse);
            const { choices } = dataObj;
            if (!choices || choices.length === 0) {
                query.onCompletion({
                    error: {
                        type: "api",
                        message: "接口未返回结果",
                        addtion: textFromResponse,
                    },
                });
                return targetText;
            }

            const content = isChatGPTModel ? choices[0].delta.content : choices[0].text;
            if (content !== undefined) {
                targetText += content;
                query.onStream({
                    result: {
                        from: query.detectFrom,
                        to: query.detectTo,
                        toParagraphs: [targetText],
                    },
                });
            }
        } catch (err) {
            query.onCompletion({
                error: {
                    type: err._type || "param",
                    message: err._message || "Failed to parse JSON",
                    addtion: err._addition,
                },
            });
        }
    }
    return targetText;
}

function handleError(query, result) {
    const { statusCode } = result.response;
    const reason = (statusCode >= 400 && statusCode < 500) ? "param" : "api";
    query.onCompletion({
        error: {
            type: reason,
            message: `接口响应错误 - ${HttpErrorCodes[statusCode]}`,
            addtion: `${JSON.stringify(result)}`,
        },
    });
}

exports.translate = translate;
