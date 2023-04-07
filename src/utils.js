var config = require('./config.js');
var {configFileName, readFile, writeFile, deleteFile} = require("./file");

const langMap = new Map(config.supportedLanguages);
const langMapReverse = new Map(config.supportedLanguages.map(([standardLang, lang]) => [lang, standardLang]));

function getDirectiveResult(text) {
    const configValue = readFile();

    let message;

    switch (text) {
        case "#mode":
        case "#Mode":
        case "#模式":
            if (configValue.mode === "conversation") {
                return "当前处于对话模式，有什么可以帮助你的呢？";
            } else if (configValue.mode === "polishing") {
                return "当前处于文字润色模式，有什么可以帮助你的呢？";
            } else {
                return "当前处于翻译模式，我支持很多种语言翻译哦~";
            }

        case "#switch":
        case "#Switch":
        case "#切换":
            if (configValue.mode === "conversation") {
                configValue.mode = "translate";
                message = "已切换到翻译模式！";
            } else if (configValue.mode === "translate") {
                configValue.mode = "polishing";
                message = "已切换到润色文字模式！";
            } else {
                configValue.mode = "conversation";
                message = "已切换到对话模式！";
            }
            break;

        case "#clear":
        case "#Clear":
        case "#清空":
            deleteFile();

            return "已清除对话记录，你可以继续聊天。";
    }

    writeFile({
        value: configValue,
        fileName: configFileName,
    });

    return message;
}


exports.langMap = langMap;
exports.langMapReverse = langMapReverse;
exports.getDirectiveResult = getDirectiveResult;
