// express for making the server
const express = require('express');
// initialize express
let app = express();

// getting data from the json body send to the node app
app.use(express.urlencoded({ extended: true }));

const path = require('path');
// for loading HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

// for initialize function
app.get('/initialize', (req, res) => {
  console.log('initialized');
  amount = parseFloat(req.query['amount']);
  initalizeDHASHTAPP(amount);
});

// for startOperation
app.get('/start', (req, res) => {
  startOperation();
});

// for stopOperation
app.get('/stop', (req, res) => {
  stopOperation();
});

app.get('/order', (req, res) => {
  symbol = req.query['symbol'];
  side = req.query['side'];
  type = req.query['type'];
  quantity = req.query['quantity'];
  reduceOnly = req.query['reduceOnly'];
  newClientOrderId = req.query['newClientOrderId'];
  stopPrice = req.query['stopPrice'];

  placeOrder(
    symbol,
    side,
    type,
    quantity,
    reduceOnly,
    newClientOrderId,
    stopPrice
  );
});

app.get('/cancel', (req, res) => {
  symbol = req.query['symbol'];
  origClientOrderId = req.query['origClientOrderId'];

  cancelOrder(symbol, origClientOrderId);
});

// creating server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));

// using sha256
const sha256 = require('crypto-js/hmac-sha256');

// websocket module
const WebSocket = require('ws');

// xmlHttpRequest module
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var xhr = new XMLHttpRequest();

// Main code
// let f_market_data_ws = null;
// let f_user_data_ws = null;
const rest_binance_futures = 'https://fapi.binance.com';

const futures_api_key =
  'replace with your api key';
const futures_secret =
  'replace with your api secret';

let amount = null;

let single_use_break_even = false;
let operation_long = false;
let operation_short = false;

let trigger_long = 0;
let trigger_short = 0;

//ENUMS
const Contract = { BTCUSDT: 'BTCUSDT', ETCUSDT: 'ETCUSDT' };
const Side = { BUY: 'BUY', SELL: 'SELL' };
const Type = { MARKET: 'MARKET', STOP_MARKET: 'STOP_MARKET' };
const ReduceOnly = { TRUE: true, FALSE: false };
const ClientOrderId = { LONG: 1, SHORT: 2, STOPLOSS: 3 };

f_user_data_ws = null;
f_market_data_ws = null;

const initalizeDHASHTAPP = amount => (amount = amount);

// Start Operation
function startOperation() {
  let a = new WebSocket('wss://fstream.binance.com/ws/btcusdt@kline_1m');
  f_market_data_ws = a;
  f_user_data_ws = startUserDataStream();

  a.on('open', () => {
    protocolAction('Futures market data socket opened');
  });

  a.on('message', event => {
    const payload = JSON.parse(event);

    // your logic
  });

  a.on('close', () => {
    protocolAction('Futures market data socket closed');
  });

  a.on('error', () => {
    protocolAction('MARKET DATA SOCKET ERROR!');
  });

  return [a, f_user_data_ws];
  //   console.log(f_market_data_ws);
}

// stop operation
const stopOperation = () => {
  // f_market_data_ws.terminate();
  // f_user_data_ws.terminate();
  // clearInterval(keepalive_timer_id);
  // f_market_data_ws.clients.forEach(function each(ws) {
  //   return ws.terminate();
  // });
  f_market_data_ws.close();
  f_user_data_ws.close();
  // console.log(f_user_data_ws);
};

// start data stream
const startUserDataStream = () => {
  const timestamp_utc = Date.now();

  const total_params = '&timestamp=' + timestamp_utc;
  const signature = sha256(total_params, futures_secret);

  const query_string = '?' + total_params + '&signature=' + signature;

  xhr.open('POST', rest_binance_futures + '/fapi/v1/listenKey' + query_string);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('X-MBX-APIKEY', futures_api_key);

  xhr.onload = () => {
    const payload = JSON.parse(xhr.responseText);
    // console.log(payload);

    f_user_data_ws = new WebSocket(
      'wss://fstream.binance.com/ws/' + payload.listenKey
    );

    f_user_data_ws.on('open', () => {
      protocolAction('Futures user data socket opened');
    });

    f_user_data_ws.on('message', event => {
      const payload = event;
      //   console.log(payload);
      //Depending on certain information received, certain actions will be performed
    });

    f_user_data_ws.on('close', () => {
      protocolAction('Futures user data socket closed');
    });

    f_user_data_ws.onerror = () => {
      protocolAction('USER DATA SOCKET ERROR!');
    };

    return f_user_data_ws;

    keepalive_timer_id = setInterval(keepAliveListenKey, 3300000); //keepalive timer at 55 minutes
  };

  xhr.send();
  return;
};

// keep session key alive
const keepAliveListenKey = () => {
  const timestamp_utc = Date.now();

  const total_params = '&timestamp=' + timestamp_utc;
  const signature = sha256(total_params, futures_secret);

  const query_string = '?' + total_params + '&signature=' + signature;

  const xhr = new XMLHttpRequest();
  xhr.open('PUT', rest_binance_futures + '/fapi/v1/listenKey' + query_string);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('X-MBX-APIKEY', futures_api_key);

  xhr.onload = () => {
    protocolAction('listenkey has been kept alive');
  };

  xhr.send();
};

// place order
const placeOrder = (
  symbol,
  side,
  type,
  quantity,
  reduceOnly,
  newClientOrderId,
  stopPrice
) => {
  const timestamp_utc = Date.now();

  const total_params =
    'symbol=' +
    symbol +
    '&side=' +
    side +
    '&type=' +
    type +
    '&quantity=' +
    quantity +
    '&reduceOnly=' +
    reduceOnly +
    '&newClientOrderId=' +
    newClientOrderId +
    '&stopPrice=' +
    parseFloat(stopPrice).toFixed(2) +
    '&timestamp=' +
    timestamp_utc;
  const signature = sha256(total_params, futures_secret);

  const query_string = '?' + total_params + '&signature=' + signature;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', rest_binance_futures + '/fapi/v1/order' + query_string);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('X-MBX-APIKEY', futures_api_key);

  xhr.onload = () => {
    protocolAction(xhr.responseText);
  };

  xhr.send();
};

// cancel the order
const cancelOrder = (symbol, origClientOrderId) => {
  const timestamp_utc = Date.now();

  const total_params =
    'symbol=' +
    symbol +
    '&origClientOrderId=' +
    origClientOrderId +
    '&timestamp=' +
    timestamp_utc;
  const signature = sha256(total_params, futures_secret);

  const query_string = '?' + total_params + '&signature=' + signature;

  const xhr = new XMLHttpRequest();
  xhr.open('DELETE', rest_binance_futures + '/fapi/v1/order' + query_string);
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.setRequestHeader('X-MBX-APIKEY', futures_api_key);

  xhr.onload = () => {
    protocolAction(xhr.responseText);
  };

  xhr.send();
};

// protocol action: Just printing the message sent to it
const protocolAction = msg => {
  console.log(msg);
};

