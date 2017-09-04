const express = require('express');
const multer = require('multer');
const http = require('http');
const app = express();
const users = {};
app.set('port', process.env.PORT || 3100);
// Set static resources
app.use(express.static(__dirname + '/public'));
// Set template engine
app.set('view engine', 'pug');

const upload = multer({dest: 'public/upload/'});

// Homepage
app.get('/', (req, res) => {
    res.render('index');
});

// single file upload
app.post('/api/upload', upload.single('file'), function (req, res, next) {
    const file = req.file;
    res.send({path: file.path});
});

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

const server = http.createServer(app);
// socket.io
const io = require('socket.io')(server);
io.on('connection', (socket) => {
    // online
    socket.on('online', function (data) {
        const userId = data.userId;
        socket.userId = userId;
        if (!users[userId]) {
            users[userId] = userId;
        }
        socket.emit('online', {users: users, user: userId});
    });
    // disconnect
    socket.on('disconnect', function() {
        if (users[socket.userId]) {
            delete users[socket.userId];
            socket.broadcast.emit('offline', {users: users, user: socket.userId});
        }
    });
    socket.on('send', function (data) {
        if (data.to.type === 'all') {
            // send to all
            socket.broadcast.emit('send', data);
        } else {
            // send to someone
            const clients = io.sockets.clients();
            clients.forEach(function (client) {
                if (client.userId === data.to) {
                    client.emit('send', data);
                }
            });
        }
    });
});

server.listen(app.get('port'), () => {
    console.log('connect success in http://localhost:3100');
});
