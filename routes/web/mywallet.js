'use strict';
const express = require('express');
const auth = require('../../lib/auth');
const eth = require('../../lib/eth');
const ethapi = require('../../lib/eth-api');
const router = express.Router();
const query = require('../../lib/Query');

const numeral = require('numeral');
const blockchainGateway = require('../../lib/aws-lambda-blockchain');
const moment = require('moment');
const util = require('util');
const os = require('os');
const path = require('path');
var  gremlin;

// URL 예제 : [GET] /mywallet/
router.get('/', async function (req, res, next) {

  if (auth.authMemberCheckAndRedirect(req, res, '/mywallet/')) {
    return;
  }

  const userNo = req.session.web.userNo;

  try {
    let sql = "";
    sql += "SELECT * ";
    sql += "FROM TB_ICO ";
    sql += "WHERE siteOpen = 1 ";
    sql += "ORDER BY icoNo DESC LIMIT 1 ";
    const ico = await query.findOne(sql);

    sql = "";
    sql += "SELECT COUNT(*) cnt FROM TB_USER_TERMS WHERE (userNo, termsCode, termsVersion) = ( ";
    sql += "    SELECT :userNo, A.termsCode, A.termsVersion ";
    sql += "    FROM TB_TERMS A ";
    sql += "        INNER JOIN TB_TERMS_POLICY B ON ( A.termsCode = B.termsCode AND A.termsVersion = B.currentTermsVersion ) ";
    sql += "    WHERE A.openYn = 1 AND B.openYn = 1 AND A.termsCode = CONCAT('ICO_', :symbol)";
    sql += ")";
    const terms = await query.findOne(sql, {userNo: userNo, symbol: ico.symbol});

    let wallet = {account: '', quantity: 0};
    if (terms.cnt > 0) {
      sql = "";
      sql += "SELECT account, quantity, userEthAccountLookup ";
      sql += "FROM TB_USER_ETH_ACCOUNT ";
      sql += "WHERE userNo = :userNo AND symbol = :symbol ";
      wallet = await query.findOne(sql, {'userNo': userNo, 'symbol': ico.symbol});

      if (wallet && wallet.userEthAccountLookup != 'CACHE') {
        let real = await ethapi.getBalance(userNo, wallet.account);
        console.log(real);
        if (!real) {
          return next({
            'status': 400,
            'message': '실시간으로 사용자의 balance를 조회할 수 없습니다.'
          });
        }
        console.log(wallet.accout)
        console.log(real.result)
        wallet.quantity = real.result || 0;
      }
    }

    res.render('page/mywallet/mywallet.ejs', {ico: ico, wallet: wallet, terms: terms, numeral: numeral});
  } catch (e) {
    next({
      'status': 400,
      'message': e,
    });
  }
});

// URL 예제 : [GET] /mywallet/history
router.get('/history', async function (req, res, next) {

  if (auth.authMemberCheckAndRedirect(req, res, '/mywallet/')) {
    return;
  }

  const userNo = req.session.web.userNo;

  try {

    let sql = "";
    sql += "SELECT * ";
    sql += "FROM TB_ICO ";
    sql += "WHERE siteOpen = 1 ";
    sql += "ORDER BY icoNo DESC LIMIT 1 ";
    const ico = await query.findOne(sql);

    sql = "";
    sql += "SELECT COUNT(*) cnt FROM TB_USER_TERMS WHERE (userNo, termsCode, termsVersion) = ( ";
    sql += "    SELECT :userNo, A.termsCode, A.termsVersion ";
    sql += "    FROM TB_TERMS A ";
    sql += "        INNER JOIN TB_TERMS_POLICY B ON ( A.termsCode = B.termsCode AND A.termsVersion = B.currentTermsVersion ) ";
    sql += "    WHERE A.openYn = 1 AND B.openYn = 1 AND A.termsCode = CONCAT('ICO_', :symbol)";
    sql += ")";
    const terms = await query.findOne(sql, {userNo: userNo, symbol: ico.symbol});

    let wallet = {account: '', quantity: 0};
    if (terms.cnt > 0) {
      sql = "";
      sql += "SELECT account, quantity, userEthAccountLookup ";
      sql += "FROM TB_USER_ETH_ACCOUNT ";
      sql += "WHERE userNo = :userNo AND symbol = :symbol ";
      wallet = await query.findOne(sql, {'userNo': userNo, 'symbol': ico.symbol});

      if (wallet && wallet.userEthAccountLookup != 'CACHE') {
        let real = await ethapi.getBalance(userNo, wallet.account);
        if (!real) {
          return next({
            'status': 400,
            'message': '실시간으로 사용자의 balance를 조회할 수 없습니다.'
          });
        }
        wallet.quantity = real.result || 0;
      }
    }

    sql = "";
    sql += "    SELECT * FROM TB_ADMIN_ETH_HISTORY ";
    //sql += "    WHERE status IN ('DEPOSIT') AND icoNo = :icoNo AND userNo = :userNo ";
    sql += "    WHERE  icoNo = :icoNo AND userNo = :userNo ";
    sql += "    ORDER BY createdDate ASC ";
    const historyList = await query.find(sql, {icoNo: ico.icoNo, userNo: userNo});

    res.render('page/mywallet/history.ejs', {
      ico: ico,
      wallet: wallet,
      terms: terms,
      numeral: numeral,
      moment: moment,
      historyList: historyList
    });
  } catch (e) {
    next({
      'status': 400,
      'message': e,
    });
  }
});

// URL 예제 : [GET] /mywallet/withdraw
router.get('/withdraw', async function (req, res, next) {

  if (auth.authMemberCheckAndRedirect(req, res, '/mywallet/')) {
    return;
  }

  const userNo = req.session.web.userNo;

  try {
    let sql = "";
    sql += "SELECT * ";
    sql += "FROM TB_ICO ";
    sql += "WHERE siteOpen = 1 ";
    sql += "ORDER BY icoNo DESC LIMIT 1 ";
    const ico = await query.findOne(sql);

    sql = "";
    sql += "SELECT COUNT(*) cnt FROM TB_USER_TERMS WHERE (userNo, termsCode, termsVersion) = ( ";
    sql += "    SELECT :userNo, A.termsCode, A.termsVersion ";
    sql += "    FROM TB_TERMS A ";
    sql += "        INNER JOIN TB_TERMS_POLICY B ON ( A.termsCode = B.termsCode AND A.termsVersion = B.currentTermsVersion ) ";
    sql += "    WHERE A.openYn = 1 AND B.openYn = 1 AND A.termsCode = CONCAT('ICO_', :symbol)";
    sql += ")";
    const terms = await query.findOne(sql, {userNo: userNo, symbol: ico.symbol});

    let wallet = {account: '', quantity: 0};
    if (terms.cnt > 0) {
      sql = "";
      sql += "SELECT account, quantity, userEthAccountLookup ";
      sql += "FROM TB_USER_ETH_ACCOUNT ";
      sql += "WHERE userNo = :userNo AND symbol = :symbol ";
      wallet = await query.findOne(sql, {'userNo': userNo, 'symbol': ico.symbol});

      if (wallet && wallet.userEthAccountLookup != 'CACHE') {
        let real = await ethapi.getBalance(userNo, wallet.account);
        if (!real) {
          return next({
            'status': 400,
            'message': '실시간으로 사용자의 balance를 조회할 수 없습니다.'
          });
        }
        console.log("* balance : " + util.inspect(real))
        wallet.quantity = real.result || 0;
      }
    }

    res.render('page/mywallet/withdraw.ejs', {ico: ico, wallet: wallet, terms: terms, numeral: numeral ,
      from: wallet.account, to:"0x6afb711d9ec4a47496df4e7e5173a23e898bb264",
      balance : "1", gas : "0.0012", total:"0.9988"});
  } catch (e) {
    next({
      'status': 400,
      'message': e,
    });
  }
});

router.post('/withdraw', async function (req, res, next) {
  if (auth.authMemberCheckAndRedirect(req, res, '/mywallet/')) {
    return;
  }
  const userNo = req.session.web.userNo;

  try {
    var from= req.body.from;
    var to= req.body.to;
    var balance= req.body.balance;
    var total=req.body.total;
    var dir=path.join(__dirname, '../../config');

    if (!from || !to || !balance ) {
      return next({
        'status': 403,
        'message': '필수 항목이 없습니다.(from:'+from+', to:'+to+', balance:'+balance+', dir:'+dir+')'
      });
    }

    let real = await ethapi.getBalance(userNo, from);
    if (!real) {
      return next({
        'status': 400,
        'message': '실시간으로 사용자의 balance를 조회할 수 없습니다.'
      });
    }
    console.log("* balance : " + util.inspect(real))
    balance = real.result;
    balance = 1;

    const txHash = await eth.sendSignedTransaction(from, to, balance, dir);
    if (!txHash) {
      return next({
        'status': 400,
        'message': 'Signed 트랜잭션에 실패했습니다.'
      });
    }

    const retHis = await insertHistory('1', userNo, to, total, txHash);
    if(!retHis) {
      return next({
        'status': 403,
        'message': balance.userNo + ': 히스토리 기록(READY)에 실패하였습니다.'
      });
    }

    if (os.hostname().indexOf("Haeyoungui") == -1 ) {   // local이 아니면 -1  (neptune VPC내에서만 동작하도록)
      console.log("* os : " + os.hostname());

      gremlin = require('../../lib/gremlin');
      const retG = await insertGraph(from, to, balance);
      if (!retG) {
        return next({
          'status': 403,
          'message': balance.userNo + ': 그래프 기록에 실패하였습니다.'
        });
      }
    }

    res.redirect('/mywallet/history');

  } catch (e) {
    next({
      'status': 400,
      'message': e,
    });
  }
});

function insertHistory(icoNo, userNo, account, quantity, txhash) {
  let sql = '';
  sql += 'INSERT INTO TB_ADMIN_ETH_HISTORY ( icoNo, userNo, account, quantity, transfedQuantity, txhash, status, createdDate ) ';
  sql += 'VALUES ( :icoNo, :userNo, :account, :quantity, :quantity, null, \'SENT\', NOW() )';

  let historyNo = query.insert(sql, {
    icoNo : icoNo,
    userNo: userNo,
    account: account,
    quantity: quantity
  });

  return historyNo;
}

async function insertGraph(from, to, value) {
  let id1 = await gremlin.addVertex(from);
  if (id1) {
    console.log(id1);
  }
  let id2 = await gremlin.addVertex(to);
  if (id2) {
    console.log(id2);
  }
  let t = new Date().getTime() / 1000;
  let ret = await gremlin.addEdge(id1, id2, value, t);
  if (ret) {
    console.log(ret);
  }
  return ret;
}
module.exports = router;