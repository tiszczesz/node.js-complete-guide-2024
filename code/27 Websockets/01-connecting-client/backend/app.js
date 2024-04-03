const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();
/** SOCKET-IO CONFIGURATION */
const http = require('http');
const server = http.createServer(app);
/** ======================= */

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        /** DON'T USE .toISOString() on windows */
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// app.use(bodyParser.urlEncoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
    );
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode;
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

/** REPLACE CONNECTION STRING IF USING ATLAS
 *  "mongodb+srv://<username>:<password>@<cluster-id>.mongodb.net/<dbName>?retryWrites=true&authSource=admin"
 */
mongoose
    .connect(
        'mongodb://127.0.0.1:27017/messages?retryWrites=true&authSource=admin'
    )
    .then(() => {
        /** SEE LINES 12-15 -- UPDATED CONFIGURATION */
        const { Server } = require('socket.io');
        const io = new Server(server, {
            cors: {
                origin: '*',
            },
        });
        io.on('connection', (socket) => {
            console.log('Client connected.');
        });
        /** ======================================== */
        /** LISTEN TO CUSTOM SERVER INSTANCE */
        server.listen(8080);
    })
    .catch((err) => console.log(err));
