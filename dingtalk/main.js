

Dingtalk = {
  config: {},
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
  setConfig: ()=>{
    const setting = Settings.findOne();
    if(setting && setting.dingtalk){
      Dingtalk.config = setting.dingtalk;
      return true;
    }
  },
  getToken: (cb) => {
    cb = cb || {};

    if(Dingtalk.setConfig() !== true){
      return;
    }

    var _options = {
      params: {
        corpid: Dingtalk.config.corpid,
        corpsecret: Dingtalk.config.corpsecret
      }
    };
    HTTP.get(Dingtalk.config.oapiHost + '/gettoken', _options, (err, res) => {
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
        msgtype: 'text',
        agent_id: '1832819',
        userid_list: params.dtIds.join(','),
        to_all_user: false,
        msgcontent: params.text
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
