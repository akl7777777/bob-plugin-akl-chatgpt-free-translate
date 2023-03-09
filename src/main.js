var config = require('./config.js');
var utils = require('./utils.js');
var hh = require('./hh.js');

// 入参格式:
// {
//     "model": "gpt-3.5-turbo",
//     "messages": [{"role": "user", "content": "帮我写一个JavaScript脚本,用来加密解密"}]
// }
// 出参格式:
// {"id":"chatcmpl-6s1BHfK43qe3Fx1BOE07x76qcJiIt","object":"chat.completion","created":1678332271,"model":"gpt-3.5-turbo-0301","usage":{"prompt_tokens":24,"completion_tokens":516,"total_tokens":540},"choices":[{"message":{"role":"assistant","content":"\n\n很抱歉，我无法为您编写验证。 但我可以提供一些可能有帮助的指导：\n\n加密算法通常可以分为以下几类：\n\n1. 对称加密算法：使用同一把密钥进行加密和解密，如AES\n\n2. 非对称加密算法：使用一对密钥，一把公钥，一把私钥，公钥加密，私钥解密，如RSA\n\n3. 散列算法：对输入的数据生成唯一的摘要值，不可逆，如MD5\n\n以下是一个非对称加密算法的例子：\n\n```js\n// 生成一对公钥和私钥\nconst { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {\n  modulusLength: 2048,\n  publicKeyEncoding: {\n    type: 'spki',\n    format: 'pem'\n  },\n  privateKeyEncoding: {\n    type: 'pkcs8',\n    format: 'pem'\n  }\n});\n\n// 使用公钥加密\nconst data = 'Hello, World!';\nconst encryptedData = crypto.publicEncrypt(publicKey, Buffer.from(data));\nconsole.log(encryptedData.toString('base64'));\n\n// 使用私钥解密\nconst decryptedData = crypto.privateDecrypt(privateKey, encryptedData);\nconsole.log(decryptedData.toString());\n``` \n\n以上示例使用Node.js内建的`crypto`模块，首先生成一对公钥和私钥，然后使用公钥加密数据，接着使用私钥解密数据。请注意，对于非对称加密算法，加密过程应该使用公钥，而解密过程应该使用私钥。该示例中使用了RSA算法，使用的密钥长度为2048位。\n\n如果您需要的是对称加密算法或散列算法，可以在`crypto`模块中找到相应的API进行使用。此外，还有很多第三方库也提供了各种加密算法的实现，例如`bcrypt`、`sha256`等，您也可以考虑使用它们。"},"finish_reason":"stop","index":0}]}


function supportLanguages() {
    return config.supportedLanguages.map(([standardLang]) => standardLang);
}

function translate(query, completion) {
    (async () => {
        const targetLanguage = utils.langMap.get(query.detectTo);
        const sourceLanguage = utils.langMap.get(query.detectFrom);
        if (!targetLanguage) {
            const err = new Error();
            Object.assign(err, {
                _type: 'unsupportLanguage',
                _message: '不支持该语种',
            });
            throw err;
        }
        const source_lang = sourceLanguage || 'ZH';
        const target_lang = targetLanguage || 'EN';
        const translate_text = query.text || '';
        if (translate_text !== '') {
            try {
                await hh.translate(query, source_lang, target_lang, translate_text, completion)
            } catch (e) {
                Object.assign(e, {
                    _type: 'network',
                    _message: '接口请求错误 - ' + JSON.stringify(e),
                });
                throw e;
            }
        }
    })().catch((err) => {
        completion({
            error: {
                type: err._type || 'unknown',
                message: err._message || '未知错误',
                addtion: err._addtion,
            },
        });
    });
}

exports.supportLanguages = supportLanguages;
exports.translate = translate;
