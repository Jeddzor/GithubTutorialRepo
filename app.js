const express = require('express');
const app = express();
const path = require('path');
const cons = require('consolidate');
const dust = require('dustjs-helpers');

const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

app.engine('dust', cons.dust);

app.set('views', __dirname + '/views'); // general config
app.set('view engine', 'dust');

app.use(express.static(path.join(__dirname, 'public')));

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Authentication middleware. When used, the
// Access Token must exist and be verified against
// the Auth0 JSON Web Key Set
const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and 
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: ``
  }),

  // Validate the audience and the issuer.
  audience: '',
  issuer: ``,
  algorithms: ['RS256']
});

app.use(checkJwt);

const { Pool, Client } = require('pg');
var connectionString = "connecto";

const pool = new Pool({
    connectionString: connectionString,
})

app.get('/', function(req, res){
        //ASYNC/AWAIT checkout
        (async () => {
          const client = await pool.connect();
          try {
            const _res = await client.query('SELECT * FROM fuel');
            res.render('index', {fuel: _res.rows});
          } finally {
            client.release();
          }
        })().catch(e => console.log(e.stack));
});

app.get('/rest/petrolalertfrequency/:id?', function(req, res){
      //ASYNC/AWAIT checkout
      (async () => {
        const client = await pool.connect();
        try {
          const _res = await client.query('SELECT * FROM petrolalertfrequency');
          res.render('index', {fuel: _res.rows});
        } finally {
          client.release();
        }
      })().catch(e => console.log(e.stack));
});

app.post('/add', checkJwt, function(req, res){
  const text = "SELECT addFuel(text '" + req.body.fuel_type +"', integer '" + req.body.octane_rating + "', money '" + req.body.price_per_litre + "', money '" + req.body.price_per_gallon +"');";
  console.log(text);
  (async () => {
          const client = await pool.connect();
          try {
            const _res = await client.query(text);
          } finally {
            client.release();
            res.redirect('/');
          }
        })().catch(e => console.log(e.stack));
});

app.post('/add_admin', function(req, res){
  const text = "SELECT add_admin(text '" + req.body.fuel_type +"', text '" + req.body.octane_rating + "');";
  console.log(text);
  (async () => {
          const client = await pool.connect();
          try {
            const _res = await client.query(text);
          } finally {
            client.release();
            res.redirect('/');
          }
        })().catch(e => console.log(e.stack));
});

app.delete('/delete_admin/:id', function(req, res){
  const text = "SELECT drop_admin(" + req.params.id + ");";
  (async () => {
          const client = await pool.connect();
          try {
            const _res = await client.query(text);
          } finally {
            client.release();
            res.sendStatus(200);
          }
        })().catch(e => console.log(e.stack));
});

app.put('/update_admin/:id?', function(req, res){
  const text = "SELECT update_admin(" + req.params.id + ",'" + req.body.email + "','" + req.body.password + "');";
  //ASYNC/AWAIT checkout
  (async () => {
    const client = await pool.connect();
    try {
      const _res = await client.query(text);
    } finally {
      client.release();
      res.sendStatus(200);
    }
  })().catch(e => console.log(e.stack));
});


app.get('/get_admin/:id?', function(req, res){
  const text = "SELECT * from get_admin(" + req.params.id + ");";
  //ASYNC/AWAIT checkout
  (async () => {
    const client = await pool.connect();
    try {
      const _res = await client.query(text);
      //res.render('index', {fuel: _res.rows}); <-- Needs to be replaced with appropriate display functions
    } finally {
      client.release();
      res.sendStatus(200);
    }
  })().catch(e => console.log(e.stack));
});

app.get('/get_petrol_avg_archive', function(req, res){
  const text = "SELECT * from get_petrol_avg_archive(" + req.body.daymonth + "," + req.body.fuel_type + "," + req.body.datefrom + "," + req.body.dateto + ");";
  //ASYNC/AWAIT checkout
  (async () => {
    const client = await pool.connect();
    try {
      const _res = await client.query(text);
      //res.render('index', {fuel: _res.rows}); <-- Needs to be replaced with appropriate display functions
    } finally {
      client.release();
      res.sendStatus(200);
    }
  })().catch(e => console.log(e.stack));
});

app.delete('/delete/:fuel_id', function(req, res){
  (async () => {
          const client = await pool.connect();
          try {
            const _res = await client.query('DELETE FROM fuel WHERE fuel_id = $1', [req.params.fuel_id]);
          } finally {
            client.release();
            res.sendStatus(200);
          }
        })().catch(e => console.log(e.stack));
});

app.post('/edit', function(req, res){
  (async () => {
    const client = await pool.connect();
    try {
      const _res = await client.query('UPDATE fuel SET fuel_type=$1, fuel_price=$2, octane_rating=$3 WHERE fuel_id=$4', [req.body.fuel_type, req.body.fuel_price, req.body.octane_rating, req.body.fuel_id]);
      console.log(req.body.fuel_type, req.body.fuel_price, req.body.octane_rating, req.body.fuel_id);
    } finally {
      client.release();
      res.redirect('/');
    }
  })().catch(e => console.log(e.stack));
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

// This route need authentication
app.get('/api/private', checkJwt, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});

const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get('/api/private-scoped', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
  });
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(3000, function(){
    console.log('Server Started on port 3000');
});