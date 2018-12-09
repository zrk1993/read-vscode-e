// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./db.json');
const db = low(adapter).defaults({ book: [] });

const ExtensionMessageHelper = require('./utils/ExtensionMessageHelper.js');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "reader" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.reader', function () {
        // The code you place here will be executed every time your command is executed

        const webviewOptions = {
            enableScripts: true, // 启用JS，默认禁用
            retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
        };
        const panel = vscode.window.createWebviewPanel('catCoding', "Cat Coding", vscode.ViewColumn.One, webviewOptions);
        
        redirection({ webview: panel.webview, context, path: 'selectFile' });

        const extensionMessageHelper = new ExtensionMessageHelper(panel.webview, context);

        extensionMessageHelper.on('readdir', (data, done) => {
            fs.readdir(data.path, (err, files) => {
                const result = [];
                files.forEach((f) => {
                    try {
                        const stat = fs.statSync(path.resolve(data.path, f));
                        result.push({
                            isDirectory: stat.isDirectory(),
                            path: path.resolve(data.path, f),
                            filename : f,
                        });
                    } catch (err) {
                    }
                });
                done(result);
            });
        });

        extensionMessageHelper.on('getBook', (data, done) => {
            const books = db.get('book')
                .cloneDeep()
                .value();
            done(books);
        });

        extensionMessageHelper.on('selectedBook', (data, done) => {

            // fs.copyFile(data.path, path.join(context.extensionPath, 'book'), (err) => {
            //     if (err) throw err;
            //     db.get('book')
            //         .push({ name: data.filename })
            //         .write();
            //     done();
            // });

            db.get('book')
                .push({ name: data.filename, path: data.path })
                .write();
            done();
        });

        extensionMessageHelper.on('delBook', (data, done) => {
            db.get('book')
                .remove({ name: data.name })
                .write();
            done();
        });

        extensionMessageHelper.on('redirection', (data, done) => {
            redirection({ webview: panel.webview, context, path: data.path });
            done();
        });

        extensionMessageHelper.on('reader', (data, done) => {
            const bookName = data.name;
            const books = db.get('book')
                .filter({name: bookName})
                .value();

            if (books && books.length > 0) {
                const book = books[0];
                const param = {
                    imgpath: vscode.Uri.file(path.resolve('F:\\360Downloads\\wpcache', '360wallpaper.jpg')).with({ scheme: 'vscode-resource' }).toString(),
                    bookpath: vscode.Uri.file(path.resolve(book.path)).with({ scheme: 'vscode-resource' }).toString()
                };
                redirection({ webview: panel.webview, context, path: 'reader', data: param });
            }
            done();
        });
    
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

/**
 * webview 跳转
 */
function redirection({ webview, context, path, data }) {
    webview.html = webview.html = getWebViewContent(context, `src/views/${path}.html`, data);
}

/**
 * 从某个HTML文件读取能被Webview加载的HTML内容
 * @param {*} context 上下文
 * @param {*} templatePath 相对于插件根目录的html文件相对路径
 */
function getWebViewContent(context, templatePath, data) {
    const resourcePath = path.join(context.extensionPath, templatePath);
    const dirPath = path.dirname(resourcePath);
    let html = fs.readFileSync(resourcePath, 'utf-8');
    // vscode不支持直接加载本地资源，需要替换成其专有路径格式，这里只是简单的将样式和JS的路径替换
    html = html.replace(/(@)(.+?)"/g, (m, $1, $2) => {
        return vscode.Uri.file(path.resolve(dirPath, $2)).with({ scheme: 'vscode-resource' }).toString() + '"';
    });

    if (data) {
        html = html.replace(/(\{\{)(.+?)(\}\})/g, (m, $1, $2) => {
            return data[$2.trim()];
        });
    }

    return html;
}

exports.deactivate = deactivate;