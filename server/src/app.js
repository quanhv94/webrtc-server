// import createError from 'http-errors';
import express from 'express';
// support error handing for async middleware, more info: https://www.npmjs.com/package/express-async-errors
import 'express-async-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
// import sassMiddleware from 'node-sass-middleware';
import methodOverride from 'method-override';
// import _ from 'lodash';
// import moment from 'moment';
import engine from 'ejs-locals';
// import flash from 'connect-flash';
// import session from 'express-session';
// import ConnectMongo from 'connect-mongo';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import rootRouter from './routes/index';
import constants from './config/constants';
// import './models/index';
// import './jobs/index';

dotenv.config();
mongoose.connect(constants.mongodbUrl, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: true,
});

const app = express();


// view engine setup
app.use(cors());
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('ejs', engine);
// app.locals._ = _;
// app.locals.moment = moment;
// app.locals.constants = constants;

app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// const MongooStore = ConnectMongo(session);
// app.use(
//   session({
//     secret: 'RabiKnow',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { maxAge: 24 * 60 * 60 * 1000 },
//     store: new MongooStore({ url: constants.mongodbUrl }),
//   }),
// );
// app.use(flash());
// app.use(sassMiddleware({
//   src: path.join(__dirname, 'public'),
//   dest: path.join(__dirname, 'public'),
//   indentedSyntax: false, // true = .sass and false = .scss
//   sourceMap: true,
// }));
// app.use(
//   express.static(
//     path.join(__dirname, 'public'),
//     { maxAge: constants.env === 'dev' ? '1s' : '2h' },
//   ),
// );
app.use(express.static(path.join(__dirname, '../../client/build')));
if (constants.env === 'dev') {
  app.use(logger('tiny'));
}

app.use('/', rootRouter);

// // catch 404 and forward to error handler
// app.use((req, res, next) => {
//   next(createError(404));
// });

// // error handler
// app.use((err, req, res) => {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });
export default app;
