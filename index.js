const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// 設定連接 Neon PostgreSQL
const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_WI3aDrdmpO1h@ep-blue-union-a5qm0cyx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require', 
    ssl: { rejectUnauthorized: false }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());  
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 處理登入請求
app.post('/login', (req, res) => {
    const { userName, passWord } = req.body;
    const sql = 'SELECT * FROM userlist WHERE username = $1 AND password = $2';
    pool.query(sql, [userName, passWord], (err, results) => {
        if (err) {
            console.error('查詢錯誤：', err);
            res.status(500).json({ success: false, message: '伺服器錯誤' });
        } else if (results.rows.length > 0) {
            res.json({ success: true, message: `登入成功！歡迎 ${userName}` });
        } else {
            res.json({ success: false, message: '登入失敗，帳號或密碼錯誤。' });
        }
    });
});


// 處理註冊請求
app.post('/register', (req, res) => {
    const { userName, passWord } = req.body;
    const checkSql = 'SELECT * FROM userlist WHERE username = $1';
    pool.query(checkSql, [userName], (err, results) => {
        if (err) {
            console.error('查詢錯誤：', err);
            res.status(500).send('伺服器錯誤');
        } else if (results.rows.length > 0) {
            res.send('<p>註冊失敗，帳號已存在。</p><a href="newID.html">返回註冊</a>');
        } else {
            const insertSql = 'INSERT INTO userlist (username, password) VALUES ($1, $2)';
            pool.query(insertSql, [userName, passWord], (err) => {
                if (err) {
                    console.error('插入錯誤：', err);
                    res.status(500).send('<p>伺服器錯誤</p><a href="newID.html">返回註冊</a>');
                } else {
                    res.send(`<p>註冊成功！歡迎 ${userName}</p><a href="login.html">返回登入</a>`);
                }
            });
        }
    });
});

// 儲存測驗結果
app.post('/save-result', (req, res) => {
    const { userName, score, duration } = req.body;
    if (!userName || score === undefined || !duration) {
        return res.status(400).json({ message: '缺少必要資料' });
    }
    const insertSql = 'INSERT INTO results (username, score, duration) VALUES ($1, $2, $3)';
    pool.query(insertSql, [userName, score, duration], (err) => {
        if (err) {
            console.error('儲存結果錯誤：', err);
            return res.status(500).json({ message: '儲存失敗' });
        }
        console.log(`已儲存 ${userName} 分數 ${score} 耗時 ${duration}`);
        res.json({ message: '結果儲存成功' });
    });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器運行中`);
});

