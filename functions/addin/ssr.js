const URLSafeBase64 = require('urlsafe-base64');
const btoa = require('btoa');
let analyseSSR = ssrLink => {
  if (!ssrLink) return null;
  if (ssrLink.startsWith('ss://')) {
    return ssProcess(ssrLink);
  } else if (ssrLink.startsWith('ssr://')) {
    return ssrProcess(ssrLink);
  } else {
    return null;
  }
}

let ssrProcess = ssrLink => {
  let host, port, protocol, method, obfs, base64password, password;
  let base64obfsparam, obfsparam, base64protoparam, protoparam, base64remarks, remarks, base64group, group, udpport, uot;
  const encodedStr = ssrLink.startsWith('ssr://') ? ssrLink.replace(/ssr:\/\//, "") : ssrLink;
  const decodedStr = URLSafeBase64.decode(encodedStr).toString();
  const requiredParams = decodedStr.split(':');
  if (requiredParams.length != 6) {
    return null;
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

  return {
    type: 'ssr',
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
}
let ssProcess = ssLink => {
  let host, port, protocol, method, remarks;

  const encodedStr = ssLink.startsWith('ss://') ? ssLink.replace(/ss:\/\//, "") : ssLink;
  let regexMatch = encodedStr.match(/#(.*?)$/);
  if (regexMatch != null) {
    remarks = decodeURIComponent(regexMatch[1]);
  }
  const decodedStr = URLSafeBase64.decode(encodedStr.split('#')[0]).toString();
  const requiredParams = decodedStr.split('@');
  if (requiredParams.length < 2) {
    return null;
  }
  var encrypt = requiredParams[0].split(':');
  method = encrypt[0];
  password = encrypt[1];
  var addr = requiredParams[1].split(':');
  host = addr[0];
  port = addr[1];
  return {
    type: 'ss',
    host,
    port,
    protocol,
    method,
    remarks
  }
}

let getSsrShareLink = ssrEntity => {
  try {
    let ssrLink = "ssr://";
    let decodedStr = `${ssrEntity.host}:${ssrEntity.port}:${ssrEntity.protocol}:${ssrEntity.method}:${ssrEntity.obfs}:${ssrEntity.base64password}/`;
    let optionalParams = "";
    if (ssrEntity.base64obfsparam != "" && ssrEntity.base64obfsparam != undefined) {
      optionalParams += `${optionalParams==""?"":"&"}obfsparam=${ssrEntity.base64obfsparam}`
    }
    if (ssrEntity.base64protoparam != "" && ssrEntity.base64protoparam != undefined) {
      optionalParams += `${optionalParams==""?"":"&"}protoparam=${ssrEntity.base64protoparam}`
    }
    if (ssrEntity.base64remarks) {
      optionalParams += `${optionalParams==""?"":"&"}remarks=${btoa(ssrEntity.remarks)}`
    }
    if (ssrEntity.base64group) {
      optionalParams += `${optionalParams==""?"":"&"}group=${ssrEntity.base64group}`
    }
    if (ssrEntity.udpport) {
      optionalParams += `${optionalParams==""?"":"&"}udpport=${ssrEntity.udpport}`
    }
    if (ssrEntity.uot) {
      optionalParams += `${optionalParams==""?"":"&"}uot=${ssrEntity.uot}`
    }
    decodedStr += `${optionalParams==""?"":"?"}${optionalParams}}`;
    return `${ssrLink}${btoa(decodedStr)}--${JSON.stringify(ssrEntity)}`;
  } catch (e) {
    return JSON.stringify(e) + `${JSON.stringify(ssrEntity)}`;
  }

}


module.exports = {
  analyseSSR,
  ssrProcess,
  ssProcess,
  getSsrShareLink
}
