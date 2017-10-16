/*
 封装Dingtalk API by qishanquan
 */
Dingtalk = {
  config: {},
  tokenData: {access_token: ''},
  getTimestamp(){
    var _date = new Date();
    var year = _date.getFullYear();
    var month = _date.getMonth() + 1;
    var day = _date.getDay();
    var hour = _date.getHours();
    var minute = _date.getMinutes();
    var second = _date.getSeconds();

    return year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day) + ' ' + (hour < 10 ? '0' + hour : hour) + ':' + (minute < 10 ? '0' + minute : minute) + ':' + (second < 10 ? '0' + second : second);
  },
  checkToken(cb){
    cb = cb || {};

    // if (!Dingtalk.tokenData.access_token) {
    Dingtalk.getToken({
      success(){
        cb.success && cb.success();
      },
      error: () => {
        cb.error && cb.error();
      }
    });
    // } else {
    //   cb.success && cb.success();
    // }
  },
  setConfig(){
    const setting = Settings.findOne();
    if (setting && setting.dingtalk) {
      Dingtalk.config = setting.dingtalk;
      return true;
    } else {
      console.log('【ERROR】未设置钉钉配置');
      return false;
    }
  },
  getToken(cb){
    cb = cb || {};

    if (Dingtalk.setConfig()) {
      var _options = {
        params: {
          corpid: Dingtalk.config.corpid,
          corpsecret: Dingtalk.config.corpsecret
        }
      };
      HTTP.get(Dingtalk.config.host + '/gettoken', _options, (err, res) => {
        if (res && res.statusCode && res.statusCode === 200) {
          if (res.data && res.data.errcode === 0) {
            Dingtalk.tokenData.access_token = res.data.access_token;
            cb.success && cb.success();
            return;
          }
        }
        console.log('【ERROR】token获取失败', res);
        cb.error && cb.error();
      });
    }
  },
  _http(method, api, params, _cb){
    if (Dingtalk.setConfig() !== true) {
      return;
    }

    let _uri = Dingtalk.config.host + api + '?access_token=' + Dingtalk.tokenData.access_token;
    // let _uri = Dingtalk.config.host+api+'?access_token='+Dingtalk.tokenData.access_token+'&userid=043913453929101166';
    // let _uri = Dingtalk.config.host+api+'?access_token='+Dingtalk.tokenData.access_token+'&department_id=37665399';

    HTTP[method](_uri, params, (error, res) => {
      if (res && res.statusCode == 200 && res.data && res.data.errcode === 0) {
        console.log('##### http success', res.data);
        _cb(true, res.data);
      } else {
        console.log('##### http fail', _uri, params, error, res);
        _cb(false);
      }
    });
  },
  _groupApi: {
    createUserGroup(user, cb){
      let params = {
        data: {
          name: '【看板】应用',
          owner: user.dingtalk.userId,
          useridlist: [user.dingtalk.userId]
        }
      };
      Dingtalk._http('post', '/chat/create', params, (isSuccess, data) => {
        if (isSuccess) { //更新至数据库user
          Users.update(user._id, {
            $set: {
              'dingtalk.chatid': data.chatid
            }
          });
          cb(data.chatid);
        }
      });
    },

    checkUserChatid(user, checkCb){
      if (user.dingtalk.chatid) {
        checkCb();
      } else {
        Dingtalk._groupApi.createUserGroup(user, (chatid) => {
          user.dingtalk.chatid = chatid;
          checkCb(true);
        });
      }
    },

    sendGroupMsg(params, cb){
      let _user = params.user;

      let _data = {};
      _data.chatid = params.user.dingtalk.chatid;

      if(params.link){
        _data.msgtype = 'markdown';
        _data.markdown = {
          "title": params.text,
          "text": "["+params.text+"]("+params.link+")"
        };
      }else{
        _data.msgtype = 'text';
        _data.text = {
          "content": params.text
        };
      }

      Dingtalk._http('post', '/chat/send', {data: _data}, (isSuccess, data) => {
        if(isSuccess){
          cb && cb(true);
          console.log('钉钉消息发送成功！', _user.username);
        }else{
          cb && cb(false);
          console.error('钉钉消息发送失败！', _user.username);
        }
      });
    },

    // getUsersByDepartId(departId, cb){
    //   Dingtalk._http('get', '/user/simplelist', {}, (err, res) => {
    //     console.log(921939, res);
    //   });
    // },

    // getUser(userId, cb){
    //   Dingtalk._http('get', '/user/get', {}, (err, res) => {
    //     console.log(921939, res);
    //   });
    // }
  },
  __sendMsg(params, cb){

    var _url = 'https://eco.taobao.com/router/rest';
    var _options = {
      params: {
        method: 'dingtalk.corp.message.corpconversation.asyncsend',
        session: Dingtalk.tokenData.access_token,
        timestamp: Dingtalk.getTimestamp(),
        format: 'json',
        v: '2.0',
        agent_id: Dingtalk.config.agentid,
        userid_list: params.dtIds.join(','),
        to_all_user: false,
        msgtype: 'text',
        // msgcontent: "{\"message_url\": \"http://dingtalk.com\",\"head\": {\"bgcolor\": \"FFBBBBBB\",\"text\": \"头部标题\"},\"body\": {\"title\": \"正文标题\",\"form\": [{\"key\": \"姓名:\",\"value\": \"张三\"},{\"key\": \"爱好:\",\"value\": \"打球、听音乐\"}],\"rich\": {\"num\": \"15.6\",\"unit\": \"元\"},\"content\": \"大段文本大段文本大段文本大段文本大段文本大段文本大段文本大段文本大段文本大段文本大段文本大段文本\",\"image\": \"@lADOADmaWMzazQKA\",\"file_count\": \"3\",\"author\": \"李四 \"}}"
        msgcontent: "{\"content\":\"" + params.text.replace(/\"/g, '\\"') + "\"}"
      }
    };

    HTTP.get(_url, _options, (err, res) => {
      console.log(6666, err, res);
      if (res && res.statusCode && res.statusCode === 200) {
        if (res.data && res.data['dingtalk_corp_message_corpconversation_asyncsend_response']) {
          console.dir(res.data['dingtalk_corp_message_corpconversation_asyncsend_response'].result);
        }
        cb.success && cb.success();
      } else {
        console.log(err, res);
        cb.error && cb.error();
      }
    });
  },
  sendMsg(params, cb){
    Dingtalk.checkToken({
      success(){
        // Dingtalk.__sendMsg(params, cb);

        Dingtalk._groupApi.checkUserChatid(params.user, (isFirst) => {
          if(isFirst){ //首次创建群组
            Dingtalk._groupApi.sendGroupMsg({
              user: params.user,
              text: '欢迎使用看板，该群是用来收取与您相关的看板消息，请勿解散（若解散需进行重置）！'
            });
          }
          Dingtalk._groupApi.sendGroupMsg(params, cb);
        });
      }
    });
  },
  testSend(){
    Dingtalk.checkToken({
      success(){
        // Dingtalk._groupApi.createGroup({
        //   groupName: 'test_for_wekan',
        //   groupUserId: '022318365437382784',
        //   groupUserIdList: ['hy1018']
        // },()=>{
        //   console.log('### finish');
        // });

        // Dingtalk._groupApi.sendGroupMsg({
        //   groupId: Dingtalk.config.chatid,
        //   msg: "Hello World",
        // }, () => {
        //   console.log('### finish');
        // });

        // Dingtalk._groupApi.getUsersByDepartId();
        // Dingtalk._groupApi.getUser();
      }
    });
  }
}
