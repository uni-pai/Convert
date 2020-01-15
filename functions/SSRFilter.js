const fly = require("flyio");
const atob = require('atob');
const isUrl = require('is-url');
const URLSafeBase64 = require('urlsafe-base64');

exports.handler = function (event, context, callback) {
  const {
    queryStringParameters
  } = event;

  const url = queryStringParameters['src'];
  const remove = queryStringParameters['remove']; //正则
  const filter = queryStringParameters['filter']; //正则
  const preview = queryStringParameters['preview']; //任意值,有值就预览

  if (!isUrl(url)) {
    return callback(null, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      },
      statusCode: 400,
      body: "参数 src 无效，请检查是否提供了正确的节点订阅地址。"
    });
  }

  fly.get(url).then(response => {
    try {
      const bodyDecoded = atob(response.data);
      const links = bodyDecoded.split('\n');
      //#region 支持协议过滤
      const filteredLinks = links.filter(link => {
        // Only support ssr now
        if (link.startsWith('ss://')) return false;
        if (link.startsWith('ssr://')) return true;
        return false;
      });
      if (filteredLinks.length == 0) {
        return callback(null, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          },
          statusCode: 400,
          body: "订阅地址中没有节点信息。"
        });
      }
      //#endregion

      //#region 协议具体内容获取
      const ssrInfos = new Array();
      filteredLinks.forEach(link => {
        let host, port, protocol, method, obfs, base64password, password;
        let base64obfsparam, obfsparam, base64protoparam, protoparam, base64remarks, remarks, base64group, group, udpport, uot;
        let encodedStr = link.replace(/ssr:\/\//, "");
        const decodedStr = URLSafeBase64.decode(encodedStr).toString();
        const requiredParams = decodedStr.split(':');
        if (requiredParams.length != 6) {
          return true;
        }
        host = requiredParams[0];
        port = requiredParams[1];
        protocol = requiredParams[2];
        method = requiredParams[3];
        obfs = requiredParams[4];
        const tempGroup = requiredParams[5].split('/?')
        base64password = tempGroup[0];
        password = URLSafeBase64.decode(base64password).toString();

        if (tempGroup.length > 1) {
          const optionalParams = tempGroup[1];
          optionalParams.split('&').forEach(param => {
            const temp = param.split('=');
            let key = temp[0],
              value;
            if (temp.length > 1) {
              value = temp[1];
            }

            if (value) {
              switch (key) {
                case 'obfsparam':
                  base64obfsparam = value;
                  obfsparam = URLSafeBase64.decode(base64obfsparam).toString();
                  break;
                case 'protoparam':
                  base64protoparam = value;
                  protoparam = URLSafeBase64.decode(base64protoparam).toString();
                  break;
                case 'remarks':
                  base64remarks = value;
                  remarks = URLSafeBase64.decode(base64remarks).toString();
                  break;
                case 'group':
                  base64group = value;
                  group = URLSafeBase64.decode(base64group).toString();
                  break;
                case 'udpport':
                  udpport = value;
                  break;
                case 'uot':
                  uot = value;
                  break;
              }
            }
          })
        }

        result = {
          type: 'ss/ssr',
          host,
          port,
          protocol,
          method,
          obfs,
          base64password,
          password,
          base64obfsparam,
          obfsparam,
          base64protoparam,
          protoparam,
          base64remarks,
          remarks,
          base64group,
          group,
          udpport,
          uot
        }
        //#region 协议根据名称进行过滤

        if (filter && filter != "" && !new RegExp(filter).test(result.remarks)) {
          return true;
        }
        if (remove && remove != "" && new RegExp(remove).test(result.remarks)) {
          return true;
        }

        //#endregion

        ssrInfos.push(result);
      });
      if (ssrInfos.length == 0) {
        return callback(null, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          },
          statusCode: 400,
          body: "订阅节点全部解析失败"
        });
      }
      //#endregion
      //#region 预览专用
      if (preview) {
        return callback(null, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          },
          statusCode: 200,
          body: JSON.stringify(ssrInfos)
        });
      }
      //#endregion


      return callback(null, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        },
        statusCode: 200,
        body: JSON.stringify(ssrInfos)
      });
    } catch (e) {
      return callback(null, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        },
        statusCode: 500,
        body: "Runtime Error.\n" + JSON.stringify(e)
      });
    }
  }).catch(error => {
    // 404
    if (error && !isNaN(error.status)) {
      return callback(null, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        },
        statusCode: 400,
        body: "订阅地址网站出现了一个 " + String(error.status) + " 错误。"
      });
    }

    // Unknown
    return callback(null, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      },
      statusCode: 500,
      body: "Unexpected Error.\n" + JSON.stringify(error)
    });
  })

}
