//app.js
App({
  globalData: {
    requestCount: {},//用户请求时间记录
    verifyCount: {},//用户是否重复验证
    location: null,//经纬度信息
    systemInfo: null,//系统信息
    userInfo: null,

    apiHost: 'http://47.92.154.46:8081/jrtx',
    memberId: "",
    openid: '',
    personInfo: null,
    phoneNumber: ''
  },
  onLaunch: function () {
    var that = this;

    // 获取用户定位信息
    // this.getUserLocation(function (res) {
    // })

    this.globalData.systemInfo = wx.getSystemInfoSync();
    //获取用户的登录状态
    this.userIsLogin();
  },
  //获取用户的登录状态
  userIsLogin: function () {
    wx.getStorage({
      key: 'login',
      success: function (res) {

        if (res == null || res == {}) {
          that.globalData.islogin = false;
        } else {
          that.globalData.islogin = true;
        }
        console.log(that.globalData.islogin)
      },
      fail: function () {
      },
      complete: function () {
      }
    })
  },
/**
     * 接口公共访问方法
     * @param {Object} urlPath 访问路径
     * @param {Object} params 访问参数（json格式）
     * @param {Object} requestCode 访问码，返回处理使用
     * @param {Object} onSuccess 成功回调
     * @param {Object} onComplete 请求完成（不管成功或失败）回调
     * @param {Object} onErrorBefore 失败回调
     * @param {Object} requestType 请求类型（默认POST）
     * @param {Object} isVerify 是否验证重复提交
     * @param {Object} retry 访问失败重新请求次数（默认1次）
     */
    webCall: function (urlPath, params, requestCode, onSuccess, onErrorBefore, onComplete, requestType, isVerify, retry) {
    var params = arguments[1] ? arguments[1] : {};
    //var requestCode = arguments[2] ? arguments[2] : 1;
    var onSuccess = arguments[3] ? arguments[3] : function () {
    };
    var onErrorBefore = arguments[4] ? arguments[4] : this.onError;
    var onComplete = arguments[5] ? arguments[5] : this.onComplete;
    var requestType = arguments[6] ? arguments[6] : "POST";
    var isVerify = arguments[7] ? arguments[7] : false;
    var retry = arguments[8] ? arguments[8] : 1;
    var that = this;

    //防止重复提交，相同请求间隔时间不能小于500毫秒
    var nowTime = new Date().getTime();
    //console.log(this.globalData.requestCount[urlPath]);
    if (this.globalData.requestCount[urlPath] && (nowTime - this.globalData.requestCount[urlPath]) < 500) {
      return;
    }
    this.globalData.requestCount[urlPath] = nowTime;

    //是否验证重复提交
    if (isVerify) {
      if (this.globalData.verifyCount[urlPath]) {
        return;
      }
      this.globalData.verifyCount[urlPath] = true; //重复验证开关开启
    }

    console.log("发起网络请求, 路径:" + (that.globalData.apiHost + urlPath) + ", 参数:" + JSON.stringify(params));
    wx.request({
      url: that.globalData.apiHost + urlPath,
      data: params,
      method: requestType, // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      header: {
        // 'content-type': requestType == 'POST' ?
        //     'application/x-www-form-urlencoded' : 'application/json'
        'content-type': 'application/json',
      }, // 设置请求的 header
      success: function (res) {
        console.log("返回结果：" + JSON.stringify(res.data));
        if (res.data) {
          if (res.data.state == 'success') {
            onSuccess(res.data.data, requestCode);
          } else {
            onErrorBefore(res.data, res.data.msg, requestCode);
          }
        } else {
          onErrorBefore(res.data, res.data.msg, requestCode);
        }
      },
      fail: function (res) {
        retry--;
        console.log("网络访问失败：" + JSON.stringify(res.data.msg));
        if (retry > 0) {
          return
        }
        that.webCall(urlPath, params, requestCode, onSuccess, onErrorBefore, onComplete, requestType, retry);
      },
      complete: function (res) {
        onComplete(requestCode);
        //请求完成后，2秒后重复验证的开关关闭
        if (isVerify) {
          setTimeout(function () {
            that.verifyCount[urlPath] = false;
          }, 2000);
        }
      }
    })
  },
})