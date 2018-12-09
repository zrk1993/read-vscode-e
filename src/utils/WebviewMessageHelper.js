/**
 * webview
 * webview与插件通信封装
 * @param {*} vscode 
 */
function WebviewMessageHelper(vscode) {
    this.vscode = vscode;
    this.callbacks = {}; // 存放所有的回调函数

    window.addEventListener('message', this.onMessage.bind(this));
};


/**
 * 处理接收到插件发送的消息
 */
WebviewMessageHelper.prototype.onMessage = function(event) {
    const message = event.data;
    if (message.cbid && this.callbacks[message.cbid]) {
        this.callbacks[message.cbid](message);
        delete this.callbacks[message.cbid]; // 执行完回调删除
    }
}

/**
 * 向插件发送消息
 * @param {Object} data 
 * @param {Function} cb 
 */
WebviewMessageHelper.prototype.emit = function(data, cb) {
	if (cb) {
		const cbid = Date.now() + '' + Math.round(Math.random() * 100000);
		this.callbacks[cbid] = cb;
		data.cbid = cbid;
	}
    this.vscode.postMessage(data);
}

window.WebviewMessageHelper = WebviewMessageHelper;