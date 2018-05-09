const Root = artifacts.require("./Root.sol");

module.exports = function(deployer) {
  deployer.deploy(Root);
};
