// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const Fs = require('fs');
const Path = require('path');

const ExtensionMessageHelper = require('./utils/ExtensionMessageHelper');
const getWebViewContent = require('./utils/getWebViewContent');
const MyStorage = require('./utils/MyStorage');

let currentPanel = null;

function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.reader', function () {

        if (currentPanel && currentPanel.visible) {
            currentPanel.dispose();
            return;
        }

        const webviewOptions = {
            enableScripts: true, // 启用JS，默认禁用
            retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
        };
        
        const columnToShowIn = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : vscode.ViewColumn.Two;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
            return;
        }

        currentPanel = vscode.window.createWebviewPanel('reader', "reader", vscode.ViewColumn.Two, webviewOptions);

        // Reset when the current panel is closed
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, null, context.subscriptions);

        const storage = new MyStorage({ rootPath: context.extensionPath });

        const extensionMessageHelper = new ExtensionMessageHelper(currentPanel.webview, context);

        // 获取book目录下的所有书本
        extensionMessageHelper.on('getBook', (data, done) => {
            Fs.readdir(Path.join(context.extensionPath, 'book'), (err, files) => {
                done(files);
            });
        });

        const defaultConfig = { fontSize: 14, fontColor: '#6a9955' };

        // 去首页
        const toIndex = () => {
            const config = storage.getItem('config') || defaultConfig;
            currentPanel.webview.html = getWebViewContent({
                rootPath: context.extensionPath,
                htmlPath: 'src/views/index.html',
                data: {
                    ...config
                },
            });
        };

        // 去首页
        extensionMessageHelper.on('goto:index', toIndex);

        // 跳转到阅读界面
        extensionMessageHelper.on('reader', (data, done) => {
            const bookName = data.book;
            const book = storage.getItem(bookName) || { bookName };
            book.progress = book.progress || 0;
            const config = storage.getItem('config') || defaultConfig;
            const param = {
                bookPath: vscode.Uri.file(Path.join(context.extensionPath, 'book', bookName)).with({ scheme: 'vscode-resource' }).toString(),
                ...book,
                ...config
            };
            currentPanel.webview.html = getWebViewContent({
                rootPath: context.extensionPath,
                htmlPath: 'src/views/reader.html',
                data: param,
            });
            done();
        });

        // 更新阅读进度
        extensionMessageHelper.on('update:readerProgress', (data, done) => {
            const bookName = data.book;
            const progress = data.progress;
            const cfi = data.cfi;

            const book = storage.getItem(bookName) || { bookName };
            book.progress = progress || book.progress;
            book.cfi = cfi;

            storage.setItem(bookName, book);
        });

        // 更新配置
        extensionMessageHelper.on('config', (data, done) => {
            storage.setItem('config', data.config);
        });

        toIndex();
    });

    context.subscriptions.push(disposable);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

exports.deactivate = deactivate;