var dingtalkConfig = {
  oapiHost: 'https://oapi.dingtalk.com',
  corpid: 'dingedbefa877a26060b',
  corpsecret: 'qbH2gXdtSkOlIGBpaE_WGTwZjChgbWu-oh0TopYLihaC_l7IRHqyYhviBFjQlF0d'
};

Dingtalk = {
  tokenData: {access_token: ''},
  getTimestamp: () => {
    var _date = new Date();
    var year = _date.getFullYear();
    var month = _date.getMonth() + 1;
    var day = _date.getDay();
    var hour = _date.getHours();
    var minute = _date.getMinutes();
    var second = _date.getSeconds();

    return year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day) + ' ' + (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute) + ':' + (second < 10 ? '0' + second : second);
  },
  checkToken: (cb) => {
    cb = cb || {};
    if (!Dingtalk.tokenData.access_token) {
      Dingtalk.getToken({
        success: () => {
          cb.success && cb.success();
        },
        error: () => {
          cb.error && cb.error();
        }
      });
    } else {
      cb.success && cb.success();
    }
  },
  getToken: (cb) => {
    cb = cb || {};
    var _options = {
      params: {
        corpid: dingtalkConfig.corpid,
        corpsecret: dingtalkConfig.corpsecret
      }
    };
    HTTP.get(dingtalkConfig.oapiHost + '/gettoken', _options, (err, res) => {
      if (res && res.statusCode && res.statusCode === 200) {
        if (res.data && res.data.access_token) {
          Dingtalk.tokenData = res.data || {};
          cb.success && cb.success();
          return;
        }
      }
      console.log(res);
      cb.error && cb.error();
    });
  },
  __sendMsg: (params,cb)=>{
    var _url = 'https://eco.taobao.com/router/rest';
    var _options = {
      params: {
        method: 'dingtalk.corp.message.corpconversation.asyncsend',
        session: Dingtalk.tokenData.access_token,
        timestamp: Dingtalk.getTimestamp(),
        format: 'json',
        v: '2.0',
        msgtype: 'oa',
        agent_id: '1832819',
        userid_list: 'hj1018,0458345106845003,114964151426232169',
        to_all_user: false,
        msgcontent: "{\"message_url\": \"http://kanban.iedu.tech\",\"head\": {\"bgcolor\": \"FFBBBBBB\",\"text\": \"看板消息\"},\"body\": {\"title\": \"正文标题\",\"form\": [{\"key\": \"姓名:\",\"value\": \"德玛西亚\"},{\"key\": \"爱好:\",\"value\": \"打球、听音乐\"}],\"rich\": {\"num\": \"15.6\",\"unit\": \"元\"},\"content\": \"看板内容看板内容看板内容看板内容看板内容xxx\",\"image\": \"@lADOADmaWMzazQKA\",\"file_count\": \"3\",\"author\": \"李四 \"}}"
      }
    };

    HTTP.get(_url, _options, (err, res) => {
      if (res && res.statusCode && res.statusCode === 200) {
        cb.success && cb.success();
      }else{
        console.log(err, res);
        cb.error && cb.error();
      }
    });
  },
  sendMsg: (params,cb) => {
    cb = cb || {};

    Dingtalk.checkToken({success:()=>{
      Dingtalk.__sendMsg(params, cb);
    }});
  }
}
