const express = require('express');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const hostname = '127.0.0.1';
const port = 3000;

// 設定資料庫連接
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'U1101601033',
    database: 'info', 
    port: 3306
});

// 連接資料庫
db.connect((err) => {
    if (err) {
        console.error('無法連接到資料庫：', err);
    } else {
        console.log('成功連接到 info 資料庫');
    }
});

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 處理登入的請求
app.post('/login', (req, res) => {
    const { userName, passWord } = req.body;
    console.log(req.body);
    // 查詢資料庫以驗證使用者
    const sql = 'SELECT * FROM userlist WHERE userName = ? AND passWord = ?';  
    db.query(sql, [userName, passWord], (err, results) => {
        if (err) {
            console.error('查詢錯誤：', err);
            res.status(500).send('伺服器錯誤');
        } else if (results.length > 0) {
            res.send('登入成功！歡迎 ' + userName);
        } else {
            res.send('登入失敗，帳號或密碼錯誤。');
        }
    });
});

// 處理註冊的請求
app.post('/register', (req, res) => {
    const { userName, passWord } = req.body;
    console.log(req.body);
    
    // 確認帳號是否已存在
    const checkSql = 'SELECT * FROM userlist WHERE userName = ?';
    db.query(checkSql, [userName], (err, results) => {
        if (err) {
            console.error('查詢錯誤：', err);
            res.status(500).send(`
                <p>伺服器錯誤</p>
                <a href="newID.html" style="display:inline-block; margin-top:10px; padding:10px 20px; background-color:#003D79; color:white; text-decoration:none; border-radius:5px;">返回註冊</a>
            `);
        } else if (results.length > 0) {
            res.send(`
                <p>註冊失敗，帳號已存在。</p>
                <a href="newID.html" style="display:inline-block; margin-top:10px; padding:10px 20px; background-color:#003D79; color:white; text-decoration:none; border-radius:5px;">返回註冊</a>
            `);
        } else {
            const insertSql = 'INSERT INTO userlist (userName, passWord) VALUES (?, ?)';
            db.query(insertSql, [userName, passWord], (err, results) => {
                if (err) {
                    console.error('插入錯誤：', err);
                    res.status(500).send(`
                        <p>伺服器錯誤</p>
                        <a href="newID.html" style="display:inline-block; margin-top:10px; padding:10px 20px; background-color:#003D79; color:white; text-decoration:none; border-radius:5px;">返回註冊</a>
                    `);
                } else {
                    res.send(`
                        <p>註冊成功！歡迎 ${userName}</p>
                        <a href="login.html" style="display:inline-block; margin-top:10px; padding:10px 20px; background-color:#009393; color:white; text-decoration:none; border-radius:5px;">返回登入</a>
                    `);
                }
            });
        }
    });
    
});

app.use(bodyParser.json());  

app.post('/save-result', (req, res) => {
    const { userName, score, duration } = req.body;

    if (!userName || score === undefined || !duration) {
        return res.status(400).json({ message: '缺少必要資料' });
    }

    const insertSql = 'INSERT INTO results (userName, score, duration) VALUES (?, ?, ?)';
    db.query(insertSql, [userName, score, duration], (err, result) => {
        if (err) {
            console.error('儲存結果時錯誤：', err);
            return res.status(500).json({ message: '儲存失敗' });
        }
        console.log(`已儲存 ${userName} 分數 ${score} 耗時 ${duration}`);
        res.json({ message: '結果儲存成功' });
    });
});

// 啟動伺服器
app.listen(port, hostname, () => {
    console.log(`伺服器運行於 http://${hostname}:${port}`);
});
