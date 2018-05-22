var AWS = require('aws-sdk');
var config = require('config');
var lambda = new AWS.Lambda(config.get('aws'));
const util = require('util');

module.exports = {

  'getBlock': function (num) {
    return new Promise(function (resolve, reject) {
      var pullParams = {
        FunctionName: 'blockchainGateway',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
          resource: 'getBlock',
          num : num
        }),
      };

      lambda.invoke(pullParams, function (error, data) {
        if (error) {
          reject(error);
        } else {
          resolve(JSON.parse(data.Payload));
        }
      });
    });
  },

    'getBlockNumber': function () {
        return new Promise(function (resolve, reject) {
            var pullParams = {
                FunctionName: 'blockchainGateway',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({
                    resource: 'getBlockNumber'
                }),
            };

            lambda.invoke(pullParams, function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(data.Payload));
                }
            });
        });
    },

    'getBalance': function (userNo, account) {
        return new Promise(function (resolve, reject) {
            var pullParams = {
                FunctionName: 'blockchainGateway',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({
                    resource: 'getBalance',
                    account: '0x'+ account
                }),
            };

            lambda.invoke(pullParams, function (error, data) {
                if (error) {
                    reject(error);
                } else {
                    resolve({
                        userNo: userNo,
                        account: account,
                        result: JSON.parse(data.Payload)
                    });
                }
            });
        });
    },

    'unlockAccount': function (account, passwd) {
        return new Promise(function (resolve, reject) {
            var pullParams = {
                FunctionName: 'blockchainGateway',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({
                    resource: 'unlockAccount',
                    account: '0x' + account,
                    passwd: passwd
                }),
            };

            console.log(pullParams);
            lambda.invoke(pullParams, function (error, data) {
                if (error) {
                    console.log(error);
                    reject(data);
                } else {

                    resolve(JSON.parse(data.Payload));
                }
            });
        });
    },

    'sendTransaction': function (from, to, value) {
        return new Promise(function (resolve, reject) {
            const gasPrice = 50000000000;
            const gas = 30000;
            const final_value =(value * Math.pow(10, 18)) - (gasPrice * gas) - 1;

            console.log(final_value)
            var pullParams = {
                FunctionName: 'blockchainGateway',
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({
                    resource: 'sendTransaction',
                    from: '0x' + from,
                    to: '0x' + to,
                    value: final_value.toString(16),
                    gasPrice: gasPrice.toString(16),
                    gas: gas.toString(16)
                }),
            };

            console.log(pullParams);
            lambda.invoke(pullParams, function (error, data) {
                if (error) {
                    console.log(error);
                    reject(data);
                } else {
                    resolve({userNo:from, result: JSON.parse(data.Payload)});
                }
            });
        });
    }
};
