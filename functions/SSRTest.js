const fly = require("flyio");
const atob = require('atob');
const btoa = require('btoa');
const isUrl = require('is-url');
const ssr = require('./addin/ssr');
const emoji = require('./addin/emoji');

exports.handler = function (event, context, callback) {
  const {
    queryStringParameters
  } = event;

  const url = queryStringParameters['sub'];

  const remove = queryStringParameters['remove']; //正则
  const filter = queryStringParameters['filter']; //正则
  const preview = queryStringParameters['preview']; //yes则预览,不传不预览
  const flag = queryStringParameters['flag']; //是否添加国旗,不传不处理,left:前面加国旗,right:后面加国旗,remove:移除国旗(如果有)

  if (!isUrl(url)) {
    return callback(null, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      },
      statusCode: 400,
      body: "参数 sub 无效，请检查是否提供了正确的节点订阅地址。"
    });
  }

  fly.get(url).then(response => {
    try {
      const bodyDecoded = atob(response.data);
      const links = bodyDecoded.split('\n');
      //#region 支持协议过滤
      const filteredLinks = links.filter(link => {
        // Only support ssr now
        if (link.startsWith('ss://')) return true;
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
      const ssrLinks = new Array();
      filteredLinks.forEach(link => {
        var result = ssr.analyseSSR(link);
        if (result == null) return true;
        //#region 协议根据名称进行过滤

        if (filter && filter != "" && !new RegExp(filter).test(result.remarks)) {
          return true;
        }
        if (remove && remove != "" && new RegExp(remove).test(result.remarks)) {
          return true;
        }
        if (flag) {
          result.remarks = emoji.flagProcess(result.remarks, flag);
          ssrLinks.push(ssr.getSsrShareLink(result));
        } else {
          ssrLinks.push(link);
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
      //#region 结果拼接
      if (preview) {
        return callback(null, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          },
          statusCode: 200,
          body: JSON.stringify({
            ssrInfos,
            ssrLinks
          })
        });
      } else {
        return callback(null, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8"
          },
          statusCode: 200,
          body: btoa(ssrLinks.join('\n'))
        });
      }
      //#endregion
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
