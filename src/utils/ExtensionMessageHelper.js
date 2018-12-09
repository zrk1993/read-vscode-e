/**
 * 插件与webview通信封装
 * @param {*} webview 
 */
function ExtensionMessageHelper(webview, context) {
    this.webview = webview;
    this.callbacks = {}; // 存放所有的回调函数
    this.listeners = {}; // 存放所有监听

    this.webview.onDidReceiveMessage(this._onMessage.bind(this), undefined, context.subscriptions);
};

/**
 * 处理接收到webview发送的消息
 */
ExtensionMessageHelper.prototype._onMessage = function(message) {
    const listeners = this.listeners[message.command];
    if (listeners && listeners.length > 0) {
        listeners.forEach((listen) => {

            // 执行监听回掉，将处理结果返回给webview
            listen.cb(message, (data) => {
                if (message.cbid) {
                    this.emit({
                        data,
                        cbid: message.cbid,
                    });
                }
            });

        });
    }
}

/**
 * 监听消息
 * @param {String} command 
 * @param {Function} cb 
 */
ExtensionMessageHelper.prototype.on = function(command, cb) {    
    if (typeof this.listeners[command] === 'undefined') {
        this.listeners[command] = [];
    }
    this.listeners[command].push({
        command,
        cb,
    });
}

/**
 * 向webview发送消息
 * @param {Object} data 
 * @param {Function} cb 
 */
ExtensionMessageHelper.prototype.emit = function(data, cb) {
	if (cb) {
		const cbid = Date.now() + '' + Math.round(Math.random() * 100000);
		this.callbacks[cbid] = cb;
		data.cbid = cbid;
	}
    this.webview.postMessage(data);
}

module.exports = ExtensionMessageHelper;