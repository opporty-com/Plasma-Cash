const Root = artifacts.require("./Root.sol");

module.exports = function(deployer) {
  console.log('init deploy, Root.sol');
  deployer.deploy(Root);
};
