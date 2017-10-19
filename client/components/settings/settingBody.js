Meteor.subscribe('setting');
Meteor.subscribe('mailServer');
Meteor.subscribe('accountSettings');
Meteor.subscribe('dingtalkSetting');
Meteor.subscribe('user-manage-list');

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.generalSetting = new ReactiveVar(true);
    this.emailSetting = new ReactiveVar(false);
    this.accountSetting = new ReactiveVar(false);
    this.dingtalkSetting = new ReactiveVar(false);
    this.userManageSetting = new ReactiveVar(false);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  checkField(selector) {
    const value = $(selector).val();
    if(!value || value.trim() === ''){
      $(selector).parents('li.smtp-form').addClass('has-error');
      throw Error('blank field');
    } else {
      return value;
    }
  },

  currentSetting(){
    return Settings.findOne();
  },

  userManageList(){
    return Users.find();
  },

  boards() {
    return Boards.find({
      archived: false,
      'members.userId': Meteor.userId(),
      'members.isAdmin': true,
    }, {
      sort: ['title'],
    });
  },
  toggleRegistration(){
    this.setLoading(true);
    const registrationClosed = this.currentSetting().disableRegistration;
    Settings.update(Settings.findOne()._id, {$set:{disableRegistration: !registrationClosed}});
    this.setLoading(false);
    if(registrationClosed){
      $('.invite-people').slideUp();
    }else{
      $('.invite-people').slideDown();
    }
  },
  toggleTLS(){
    $('#mail-server-tls').toggleClass('is-checked');
  },
  switchMenu(event){
    const target = $(event.target);
    if(!target.hasClass('active')){
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');
      this.generalSetting.set('registration-setting' === targetID);
      this.emailSetting.set('email-setting' === targetID);
      this.accountSetting.set('account-setting' === targetID);
      this.dingtalkSetting.set('dingtalk-setting' === targetID);
      this.userManageSetting.set('userManage-setting' === targetID);
    }
  },

  checkBoard(event){
    let target = $(event.target);
    if(!target.hasClass('js-toggle-board-choose')){
      target = target.parent();
    }
    const checkboxId = target.attr('id');
    $(`#${checkboxId} .materialCheckBox`).toggleClass('is-checked');
    $(`#${checkboxId}`).toggleClass('is-checked');
  },

  inviteThroughEmail(){
    const emails = $('#email-to-invite').val().trim().split('\n').join(',').split(',');
    const boardsToInvite = [];
    $('.js-toggle-board-choose .materialCheckBox.is-checked').each(function () {
      boardsToInvite.push($(this).data('id'));
    });
    const validEmails = [];
    emails.forEach((email) => {
      if (email && SimpleSchema.RegEx.Email.test(email.trim())) {
        validEmails.push(email.trim());
      }
    });
    if (validEmails.length) {
      this.setLoading(true);
      Meteor.call('sendInvitation', validEmails, boardsToInvite, () => {
        // if (!err) {
        //   TODO - show more info to user
        // }
        this.setLoading(false);
      });
    }
  },

  saveDingtalkInfo() {
    try{
      const host = $('#dingtalk-host').val().trim();
      const corpid = $('#dingtalk-corpid').val().trim();
      const corpsecret = $('#dingtalk-corpsecret').val().trim();
      const chatid = $('#dingtalk-chatid').val().trim();
      const agentid = $('#dingtalk-agentid').val().trim();

      Settings.update(Settings.findOne()._id, {$set:{
        'dingtalk.host': host,
        'dingtalk.corpid': corpid,
        'dingtalk.corpsecret': corpsecret,
        'dingtalk.chatid': chatid,
        'dingtalk.agentid': agentid
      }});

      alert('保存成功');
    }catch(e){
      console.log(e);
      alert('保存失败');
    }
  },

  resetPassword(event){
    let trNode = $(event.target).parent().parent(); //tr
    Meteor.call('resetUserPwd', trNode.attr('userId'));
  },

  saveUserInfo(event){
    let trNode = $(event.target).parent().parent(); //tr

    Meteor.call('updateUserInfo',{
      userId: trNode.attr('userId'),
      email: trNode.find('.email-address').val(),
      dingtalkUserId: trNode.find('.dingtalk-userId').val(),
      dingtalkChatid: trNode.find('.dingtalk-chatid').val()
    });
  },

  saveMailServerInfo(){
    this.setLoading(true);
    $('li').removeClass('has-error');

    try{
      const host = this.checkField('#mail-server-host');
      const port = this.checkField('#mail-server-port');
      const username = $('#mail-server-username').val().trim();
      const password = $('#mail-server-password').val().trim();
      const from = this.checkField('#mail-server-from');
      const tls = $('#mail-server-tls.is-checked').length > 0;
      Settings.update(Settings.findOne()._id, {$set:{'mailServer.host':host, 'mailServer.port': port, 'mailServer.username': username,
          'mailServer.password': password, 'mailServer.enableTLS': tls, 'mailServer.from': from}});
    } catch (e) {
      return;
    } finally {
      this.setLoading(false);
    }
  },

  events(){
    return [{
      'click a.js-toggle-registration': this.toggleRegistration,
      'click a.js-toggle-tls': this.toggleTLS,
      'click a.js-setting-menu': this.switchMenu,
      'click a.js-toggle-board-choose': this.checkBoard,
      'click button.js-email-invite': this.inviteThroughEmail,
      'click button.js-save': this.saveMailServerInfo,
      'click button.js-dingtalk-save': this.saveDingtalkInfo,
      'click button.js-reset-password': this.resetPassword,
      'click button.js-userinfo-save': this.saveUserInfo,
    }];
  },
}).register('setting');

BlazeComponent.extendComponent({
  saveAllowEmailChange() {
    const allowEmailChange = ($('input[name=allowEmailChange]:checked').val() === 'true');
    AccountSettings.update('accounts-allowEmailChange', {
      $set: { 'booleanValue': allowEmailChange },
    });
  },

  allowEmailChange() {
    return AccountSettings.findOne('accounts-allowEmailChange').booleanValue;
  },

  events() {
    return [{
      'click button.js-accounts-save': this.saveAllowEmailChange,
    }];
  },
}).register('accountSettings');
